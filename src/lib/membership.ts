import { prisma } from "@/lib/db";
import type { WorkspaceMember, Workspace } from "@/generated/prisma/client";

export type MembershipWithWorkspace = WorkspaceMember & {
  workspace: Workspace;
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
