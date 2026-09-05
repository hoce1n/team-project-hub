import { prisma } from "@/lib/db";
import type {
  WorkspaceMember,
  Workspace,
  Project,
  Task,
} from "@/generated/prisma/client";

export type MembershipWithWorkspace = WorkspaceMember & {
  workspace: Workspace;
};

export type ProjectAccess = {
  membership: WorkspaceMember;
  project: Project;
};

export type TaskAccess = {
  membership: WorkspaceMember;
  project: Project;
  task: Task;
};

export async function getMembership(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceMember | null> {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

export async function getMembershipBySlug(
  userId: string,
  slug: string,
): Promise<MembershipWithWorkspace | null> {
  return prisma.workspaceMember.findFirst({
    where: { userId, workspace: { slug } },
    include: { workspace: true },
  });
}

export async function getWorkspaceBySlug(
  slug: string,
): Promise<Workspace | null> {
  return prisma.workspace.findUnique({ where: { slug } });
}

export async function getWorkspaceSlug(
  workspaceId: string,
): Promise<string | null> {
  return prisma.workspace
    .findUnique({ where: { id: workspaceId }, select: { slug: true } })
    .then((workspace) => workspace?.slug ?? null);
}

export async function getProjectAccess(
  userId: string,
  projectId: string,
): Promise<ProjectAccess | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) {
    return null;
  }
  const membership = await getMembership(userId, project.workspaceId);
  if (!membership) {
    return null;
  }
  return { membership, project };
}

export async function getTaskAccess(
  userId: string,
  taskId: string,
): Promise<TaskAccess | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!task) {
    return null;
  }
  const membership = await getMembership(userId, task.project.workspaceId);
  if (!membership) {
    return null;
  }
  return { membership, project: task.project, task };
}
