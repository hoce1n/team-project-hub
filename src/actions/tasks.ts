"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/authz";
import { getProjectAccess, getTaskAccess, getWorkspaceSlug } from "@/lib/membership";
import {
  createTaskSchema,
  updateTaskSchema,
  setTaskStatusSchema,
} from "@/lib/validations";
import type { TaskStatus, TaskPriority } from "@/generated/prisma/enums";

type ActionState = { error?: string } | undefined;

export async function createTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createTaskSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    dueDate: formData.get("dueDate") || "",
    assigneeId: formData.get("assigneeId") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { projectId, ...data } = parsed.data;

  const access = await getProjectAccess(user.id, projectId);
  if (!access) {
    return { error: "You are not a member of this project's workspace." };
  }
  if (!can(access.membership.role, "view")) {
    return { error: "You don't have access to this project." };
  }

  await prisma.task.create({
    data: {
      ...data,
      title: data.title,
      description: data.description,
      status: data.status as TaskStatus,
      priority: data.priority as TaskPriority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assigneeId: data.assigneeId || null,
      projectId,
      createdById: user.id,
    },
  });
  const slug = await getWorkspaceSlug(access.project.workspaceId);
  if (slug) {
    revalidatePath(`/w/${slug}/p/${projectId}`);
  }
  return undefined;
}

export async function updateTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = updateTaskSchema.safeParse({
    taskId: formData.get("taskId"),
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || undefined,
    dueDate: formData.get("dueDate") || "",
    assigneeId: formData.get("assigneeId") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { taskId, ...data } = parsed.data;

  const access = await getTaskAccess(user.id, taskId);
  if (!access || !can(access.membership.role, "view")) {
    return { error: "You don't have access to this task." };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assigneeId: data.assigneeId || null,
    },
  });
  const slug = await getWorkspaceSlug(access.project.workspaceId);
  if (slug) {
    revalidatePath(`/w/${slug}/p/${access.project.id}`);
    revalidatePath(`/w/${slug}/p/${access.project.id}/t/${taskId}`);
  }
  return undefined;
}

export async function setTaskStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = setTaskStatusSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const access = await getTaskAccess(user.id, parsed.data.taskId);
  if (!access || !can(access.membership.role, "view")) {
    return { error: "You don't have access to this task." };
  }

  await prisma.task.update({
    where: { id: parsed.data.taskId },
    data: { status: parsed.data.status as TaskStatus },
  });
  const slug = await getWorkspaceSlug(access.project.workspaceId);
  if (slug) {
    revalidatePath(`/w/${slug}/p/${access.project.id}`);
    revalidatePath(`/w/${slug}/p/${access.project.id}/t/${parsed.data.taskId}`);
  }
  return undefined;
}

export async function deleteTaskAction(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");

  const access = await getTaskAccess(user.id, taskId);
  if (!access) {
    throw new Error("You don't have access to this task.");
  }
  const isAuthor = access.task.createdById === user.id;
  const isModerator = can(access.membership.role, "manageProjects");
  if (!isAuthor && !isModerator) {
    throw new Error("Only the task author or an admin can delete this task.");
  }

  await prisma.task.delete({ where: { id: taskId } });
  const slug = await prisma.workspace
    .findUnique({
      where: { id: access.project.workspaceId },
      select: { slug: true },
    })
    .then((workspace) => workspace?.slug);
  redirect(`/w/${slug}/p/${access.project.id}`);
}
