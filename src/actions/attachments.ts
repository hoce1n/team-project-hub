"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/authz";
import { getTaskAccess, getWorkspaceSlug } from "@/lib/membership";
import { z } from "zod";
import {
  UPLOAD_ROOT,
  MAX_FILE_SIZE,
  ALLOWED_TYPES,
  extensionFor,
  attachmentDiskPath,
} from "@/lib/attachments";

type ActionState = { error?: string; ok?: boolean } | undefined;

const taskIdSchema = z.string().cuid();

export async function addAttachmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskIdSchema.safeParse(taskId).success) {
    return { error: "Invalid task reference." };
  }

  const access = await getTaskAccess(user.id, taskId);
  if (!access || !can(access.membership.role, "view")) {
    return { error: "You don't have access to this task." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "No file selected." };
  }
  if (file.size === 0) {
    return { error: "The file is empty." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Files must be 5MB or smaller." };
  }
  if (!(file.type in ALLOWED_TYPES)) {
    return {
      error: `File type not allowed. Allowed: ${Object.keys(ALLOWED_TYPES).join(", ")}`,
    };
  }

  const storedName = `${randomUUID()}${extensionFor(file.name, file.type)}`;
  const dir = `${UPLOAD_ROOT}/${taskId}`;
  await mkdir(dir, { recursive: true });
  await writeFile(attachmentDiskPath(taskId, storedName), Buffer.from(await file.arrayBuffer()));

  await prisma.attachment.create({
    data: {
      filename: file.name,
      storedName,
      mimeType: file.type,
      size: file.size,
      taskId,
      uploadedById: user.id,
    },
  });

  const slug = await getWorkspaceSlug(access.project.workspaceId);
  if (slug) {
    revalidatePath(`/w/${slug}/p/${access.project.id}/t/${taskId}`);
  }
  return { ok: true };
}
