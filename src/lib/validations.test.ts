import { describe, expect, it } from "vitest";
import {
  createWorkspaceSchema,
  workspaceSlugSchema,
  inviteMemberSchema,
  createProjectSchema,
  createTaskSchema,
  createCommentSchema,
} from "./validations";

const cuid = "clx1234567890123456789012";

describe("workspaceSlugSchema", () => {
  it("accepts simple lowercase slugs", () => {
    expect(workspaceSlugSchema.safeParse("acme").success).toBe(true);
    expect(workspaceSlugSchema.safeParse("team-42").success).toBe(true);
  });

  it("rejects slugs that are too short, uppercase or have bad chars", () => {
    expect(workspaceSlugSchema.safeParse("ab").success).toBe(false);
    expect(workspaceSlugSchema.safeParse("Acme").success).toBe(false);
    expect(workspaceSlugSchema.safeParse("ac me").success).toBe(false);
    expect(workspaceSlugSchema.safeParse("acme_team").success).toBe(false);
  });
});

describe("createWorkspaceSchema", () => {
  it("requires a name", () => {
    const result = createWorkspaceSchema.safeParse({ name: "", slug: "acme" });
    expect(result.success).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  it("defaults role to MEMBER", () => {
    const result = inviteMemberSchema.safeParse({
      workspaceId: cuid,
      email: "A@Example.com ",
    });
    expect(result.success).toBe(true);
    expect(result.data?.role).toBe("MEMBER");
    expect(result.data?.email).toBe("a@example.com");
  });

  it("rejects a bad email or a forbidden role", () => {
    expect(
      inviteMemberSchema.safeParse({
        workspaceId: cuid,
        email: "nope",
        role: "OWNER",
      }).success,
    ).toBe(false);
  });
});

describe("createProjectSchema", () => {
  it("requires a workspace id and non-empty name", () => {
    expect(createProjectSchema.safeParse({ workspaceId: cuid, name: "Launch" }).success).toBe(true);
    expect(createProjectSchema.safeParse({ workspaceId: "not-a-cuid", name: "x" }).success).toBe(false);
    expect(createProjectSchema.safeParse({ workspaceId: cuid, name: "  " }).success).toBe(false);
  });
});

describe("createTaskSchema", () => {
  it("applies status and priority defaults", () => {
    const result = createTaskSchema.safeParse({
      projectId: cuid,
      title: "Ship it",
      dueDate: "",
      assigneeId: null,
    });
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe("TODO");
    expect(result.data?.priority).toBe("MEDIUM");
    expect(result.data?.dueDate).toBe("");
  });

  it("rejects unknown statuses", () => {
    expect(
      createTaskSchema.safeParse({
        projectId: cuid,
        title: "x",
        status: "DOING",
      }).success,
    ).toBe(false);
  });
});

describe("createCommentSchema", () => {
  it("rejects empty and whitespace-only comments", () => {
    expect(createCommentSchema.safeParse({ taskId: cuid, body: "" }).success).toBe(false);
    expect(createCommentSchema.safeParse({ taskId: cuid, body: "   " }).success).toBe(false);
    expect(createCommentSchema.safeParse({ taskId: cuid, body: "Sounds good" }).success).toBe(true);
  });
});
