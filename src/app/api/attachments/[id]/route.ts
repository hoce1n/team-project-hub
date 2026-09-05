import type { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { getMembership } from "@/lib/membership";
import { auth } from "@/lib/auth";
import { attachmentDiskPath, sanitizeFilename } from "@/lib/attachments";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: { task: { include: { project: { select: { workspaceId: true } } } } },
  });
  if (!attachment) {
    return new Response("Not found", { status: 404 });
  }

  const membership = await getMembership(user.id, attachment.task.project.workspaceId);
  if (!membership) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!attachment.storedName) {
    return new Response("File is not stored on disk", { status: 410 });
  }

  const filePath = attachmentDiskPath(attachment.taskId, attachment.storedName);
  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    return new Response("File missing on server", { status: 410 });
  }

  const filename = sanitizeFilename(attachment.filename);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, max-age=60",
    },
  });
}
