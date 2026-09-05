"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/authz";
import { getMembership, getProjectAccess, getWorkspaceSlug } from "@/lib/membership";
import { createProjectSchema, updateProjectSchema } from "@/lib/validations";

type ActionState = { error?: string } | undefined;

export async function createProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createProjectSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const membership = await getMembership(user.id, parsed.data.workspaceId);
  if (!membership || !can(membership.role, "manageProjects")) {
    return { error: "You need at least an Admin role to create projects." };
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      workspaceId: parsed.data.workspaceId,
      createdById: user.id,
    },
  });

  const workspace = await prisma.workspace.findUnique({
    where: { id: parsed.data.workspaceId },
    select: { slug: true },
  });
  redirect(`/w/${workspace?.slug ?? ""}/p/${project.id}`);
}

export async function renameProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = updateProjectSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const access = await getProjectAccess(user.id, parsed.data.projectId);
  if (!access || !can(access.membership.role, "manageProjects")) {
    return { error: "You need at least an Admin role to edit projects." };
  }

  await prisma.project.update({
    where: { id: parsed.data.projectId },
    data: { name: parsed.data.name },
  });
  const slug = await getWorkspaceSlug(access.project.workspaceId);
  if (slug) {
    revalidatePath(`/w/${slug}`);
  }
  return undefined;
}

export async function deleteProjectAction(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");

  const access = await getProjectAccess(user.id, projectId);
  if (!access || !can(access.membership.role, "manageProjects")) {
    throw new Error("You need at least an Admin role to delete projects.");
  }
  const slug = await prisma.workspace.findUnique({
    where: { id: access.project.workspaceId },
    select: { slug: true },
  });

  await prisma.project.delete({ where: { id: projectId } });
  redirect(`/w/${slug?.slug ?? ""}`);
}
