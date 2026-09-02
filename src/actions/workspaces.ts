"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/authz";
import { getMembership } from "@/lib/membership";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  joinWorkspaceSchema,
  inviteMemberSchema,
  changeMemberRoleSchema,
  removeMemberSchema,
} from "@/lib/validations";
import type { WorkspaceRole } from "@/generated/prisma/enums";

type ActionState = { error?: string } | undefined;

async function assertCan(
  userId: string,
  workspaceId: string,
  action: Parameters<typeof can>[1],
) {
  const membership = await getMembership(userId, workspaceId);
  if (!membership || !can(membership.role, action)) {
    throw new Error("You don't have permission to do that.");
  }
  return membership;
}

export async function createWorkspaceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.workspace.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return { error: "That slug is already taken." };
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  });
  redirect(`/w/${workspace.slug}`);
}

export async function updateWorkspaceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = updateWorkspaceSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await assertCan(user.id, parsed.data.id, "editWorkspace");
    await prisma.workspace.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Update failed." };
  }

  revalidatePath("/w/[slug]", "layout");
}

export async function deleteWorkspaceAction(formData: FormData) {
  const user = await requireUser();
  const workspaceId = String(formData.get("id") ?? "");

  try {
    await assertCan(user.id, workspaceId, "deleteWorkspace");
    await prisma.workspace.delete({ where: { id: workspaceId } });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Delete failed.");
  }

  redirect("/dashboard");
}

export async function joinWorkspaceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = joinWorkspaceSchema.safeParse({
    slug: formData.get("slug"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (!workspace) {
    return { error: "No workspace found with that slug." };
  }

  const existing = await getMembership(user.id, workspace.id);
  if (existing) {
    redirect(`/w/${workspace.slug}`);
  }

  try {
    await prisma.workspaceMember.create({
      data: { workspaceId: workspace.id, userId: user.id, role: "MEMBER" },
    });
  } catch {
    return { error: "Could not join that workspace." };
  }

  redirect(`/w/${workspace.slug}`);
}

export async function inviteMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = inviteMemberSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { workspaceId, email, role } = parsed.data;

  try {
    await assertCan(user.id, workspaceId, "invite");

    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) {
      return { error: "No account found for that email. Ask them to sign up first." };
    }

    const existing = await getMembership(invitee.id, workspaceId);
    if (existing) {
      return { error: "That user is already a member." };
    }

    await prisma.workspaceMember.create({
      data: { workspaceId, userId: invitee.id, role },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invite failed." };
  }

  revalidatePath("/w/[slug]/members");
}

export async function changeMemberRoleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = changeMemberRoleSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    memberId: formData.get("memberId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { workspaceId, memberId, role } = parsed.data;

  try {
    await assertCan(user.id, workspaceId, "manageMembers");

    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.workspaceId !== workspaceId) {
      return { error: "That member does not exist in this workspace." };
    }
    if (member.role === "OWNER") {
      return { error: "You cannot change the role of the workspace owner." };
    }

    await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: role as WorkspaceRole },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Role change failed." };
  }

  revalidatePath("/w/[slug]/members");
}

export async function removeMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = removeMemberSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    memberId: formData.get("memberId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { workspaceId, memberId } = parsed.data;

  try {
    await assertCan(user.id, workspaceId, "manageMembers");

    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.workspaceId !== workspaceId) {
      return { error: "That member does not exist in this workspace." };
    }
    if (member.role === "OWNER") {
      return { error: "You cannot remove the workspace owner." };
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Removal failed." };
  }

  revalidatePath("/w/[slug]/members");
}
