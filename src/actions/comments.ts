"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/authz";
import { getTaskAccess } from "@/lib/membership";
import { createCommentSchema } from "@/lib/validations";
import { publishComment } from "@/lib/comment-stream";

type ActionState = { error?: string } | undefined;

export async function createCommentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createCommentSchema.safeParse({
    taskId: formData.get("taskId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const access = await getTaskAccess(user.id, parsed.data.taskId);
  if (!access || !can(access.membership.role, "view")) {
    return { error: "You don't have access to this task." };
  }

  const comment = await prisma.taskComment.create({
    data: { taskId: parsed.data.taskId, authorId: user.id, body: parsed.data.body },
  });

  publishComment({
    id: comment.id,
    taskId: comment.taskId,
    body: comment.body,
    authorId: user.id,
    authorName: user.name ?? "Unknown",
    createdAt: comment.createdAt.toISOString(),
  });

  revalidatePath(`/w/[slug]/p/${access.project.id}/t/${parsed.data.taskId}`);
  return undefined;
}

export async function deleteCommentAction(formData: FormData) {
  const user = await requireUser();
  const commentId = String(formData.get("commentId") ?? "");

  const comment = await prisma.taskComment.findUnique({
    where: { id: commentId },
    include: { task: { include: { project: true } } },
  });
  if (!comment) {
    throw new Error("Comment not found.");
  }
  const access = await getTaskAccess(user.id, comment.taskId);
  if (!access) {
    throw new Error("You don't have access to this task.");
  }
  const isAuthor = comment.authorId === user.id;
  const isModerator = can(access.membership.role, "manageProjects");
  if (!isAuthor && !isModerator) {
    throw new Error("Only the comment author or an admin can delete this.");
  }

  await prisma.taskComment.delete({ where: { id: commentId } });
  revalidatePath(`/w/[slug]/p/${access.project.id}/t/${comment.taskId}`);
}
