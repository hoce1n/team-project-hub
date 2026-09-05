import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => {
  let current: Headers = new Headers();
  return {
    get current() {
      return current;
    },
    setCurrent(value: Headers) {
      current = value;
    },
    signInAs(cookie: string) {
      current = new Headers({ cookie });
    },
  };
});

vi.mock("next/headers", () => ({
  headers: async () => store.current,
  cookies: async () => store.current,
}));

vi.mock("next/navigation", () => {
  function makeError(kind: "redirect" | "notFound") {
    return (target?: string) => {
      const error = new Error(`${kind}:${target ?? ""}`) as Error & {
        digest: string;
        url?: string;
      };
      error.digest =
        kind === "redirect"
          ? `NEXT_REDIRECT;push;${target};307;`
          : "NEXT_NOT_FOUND";
      error.url = target;
      throw error;
    };
  }
  return {
    redirect: makeError("redirect"),
    notFound: makeError("notFound"),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: () => {},
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createWorkspaceAction,
  joinWorkspaceAction,
  changeMemberRoleAction,
} from "@/actions/workspaces";
import { createProjectAction } from "@/actions/projects";
import { createTaskAction } from "@/actions/tasks";
import { createCommentAction } from "@/actions/comments";
import { addAttachmentAction } from "@/actions/attachments";
import { unlink, access } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_ROOT } from "@/lib/attachments";

const PASSWORD = "password123";
const stamp = Date.now().toString(36);

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

type Identity = {
  email: string;
  cookie: string;
  userId: string;
};

async function createIdentity(label: string): Promise<Identity> {
  const email = `${label}-${stamp}@smoke.example`;
  const signUp = (await auth.api.signUpEmail({
    body: { email, password: PASSWORD, name: label },
    headers: store.current as never,
    returnHeaders: true,
  } as never)) as unknown as { headers: Headers };
  const cookie = signUp.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  store.signInAs(cookie);
  const session = await auth.api.getSession({ headers: store.current as never });
  return { email, cookie, userId: session!.user.id };
}

async function expectRedirect(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    const digest = (error as { digest?: string }).digest ?? "";
    if (!digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    return (error as { url: string }).url;
  }
  throw new Error("Expected a redirect, but the action resolved.");
}

describe("smoke: real server-action flows against Postgres", () => {
  beforeEach(() => {
    store.setCurrent(new Headers());
  });

  it("covers roles, project, task, comment and upload end to end", async () => {
    const owner = await createIdentity("owner");
    const member = await createIdentity("member");
    const outsider = await createIdentity("outsider");
    const slug = `smoke-${stamp}`;

    store.signInAs(owner.cookie);
    const wsUrl = await expectRedirect(() =>
      createWorkspaceAction(undefined, form({ name: "Smoke Workspace", slug })),
    );
    expect(wsUrl).toBe(`/w/${slug}`);

    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: { members: true },
    });
    expect(workspace).not.toBeNull();
    expect(workspace!.members).toHaveLength(1);
    expect(workspace!.members[0]).toMatchObject({
      userId: owner.userId,
      role: "OWNER",
    });

    store.signInAs(member.cookie);
    const joinedUrl = await expectRedirect(() =>
      joinWorkspaceAction(undefined, form({ slug })),
    );
    expect(joinedUrl).toBe(`/w/${slug}`);

    const memberRow = await prisma.workspaceMember.findFirst({
      where: { workspaceId: workspace!.id, userId: member.userId },
    });
    expect(memberRow?.role).toBe("MEMBER");

    const denied = await createProjectAction(
      undefined,
      form({ workspaceId: workspace!.id, name: "Nope" }),
    );
    expect(denied?.error).toMatch(/Admin/);

    store.signInAs(owner.cookie);
    const promote = await changeMemberRoleAction(
      undefined,
      form({ workspaceId: workspace!.id, memberId: memberRow!.id, role: "ADMIN" }),
    );
    expect(promote).toBeUndefined();
    expect(
      (await prisma.workspaceMember.findUnique({ where: { id: memberRow!.id } }))?.role,
    ).toBe("ADMIN");

    store.signInAs(member.cookie);
    const projectUrl = await expectRedirect(() =>
      createProjectAction(
        undefined,
        form({
          workspaceId: workspace!.id,
          name: "Launchpad",
          description: "Smoke project",
        }),
      ),
    );
    const projectId = projectUrl.split("/p/")[1];
    expect(projectId).toMatch(/^c/);

    const taskResult = await createTaskAction(
      undefined,
      form({ projectId, title: "Smoke task", status: "TODO", priority: "HIGH" }),
    );
    expect(taskResult).toBeUndefined();
    const task = await prisma.task.findFirst({
      where: { projectId, title: "Smoke task" },
    });
    expect(task).not.toBeNull();
    expect(task!.createdById).toBe(member.userId);

    const commentResult = await createCommentAction(
      undefined,
      form({ taskId: task!.id, body: "Smoke comment" }),
    );
    expect(commentResult).toBeUndefined();
    const comment = await prisma.taskComment.findFirst({
      where: { taskId: task!.id, body: "Smoke comment" },
    });
    expect(comment?.authorId).toBe(member.userId);

    const file = new File(["smoke payload"], "smoke.txt", { type: "text/plain" });
    const uploadFd = new FormData();
    uploadFd.set("taskId", task!.id);
    uploadFd.set("file", file);
    const uploadResult = await addAttachmentAction(undefined, uploadFd);
    expect(uploadResult?.ok).toBe(true);
    const attachment = await prisma.attachment.findFirst({
      where: { taskId: task!.id },
    });
    expect(attachment).not.toBeNull();
    const diskFile = path.join(UPLOAD_ROOT, task!.id, attachment!.storedName!);
    await expect(access(diskFile)).resolves.toBeUndefined();
    await unlink(diskFile);

    store.signInAs(outsider.cookie);
    const outsiderComment = await createCommentAction(
      undefined,
      form({ taskId: task!.id, body: "unauthorized" }),
    );
    expect(outsiderComment?.error).toMatch(/access/i);
  }, 60000);

  it("redirects an unauthenticated actor to /login", async () => {
    const url = await expectRedirect(() =>
      createWorkspaceAction(undefined, form({ name: "x", slug: "xx" })),
    );
    expect(url).toBe("/login");
  });
});
