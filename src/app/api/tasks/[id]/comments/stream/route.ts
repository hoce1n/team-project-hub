import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getMembership } from "@/lib/membership";
import { auth } from "@/lib/auth";
import { subscribeToComments, eventIsForTask } from "@/lib/comment-stream";
import type { CommentEvent } from "@/lib/comment-stream";

export const dynamic = "force-dynamic";

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

  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: { select: { workspaceId: true } } },
  });
  if (!task) {
    return new Response("Not found", { status: 404 });
  }
  const membership = await getMembership(user.id, task.project.workspaceId);
  if (!membership) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));

      const listener = (comment: CommentEvent) => {
        if (eventIsForTask(comment, id)) {
          send(`data: ${JSON.stringify(comment)}\n\n`);
        }
      };
      const unsubscribe = subscribeToComments(id, listener);

      const heartbeat = setInterval(() => {
        send(`: ping\n\n`);
      }, 15_000);

      const abort = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // stream already closed
        }
      };
      request.signal.addEventListener("abort", abort);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
