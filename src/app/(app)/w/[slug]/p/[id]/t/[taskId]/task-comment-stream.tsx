"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CommentEvent } from "@/lib/comment-stream";
import { deleteCommentAction } from "@/actions/comments";

export type RenderableComment = CommentEvent & { canDelete: boolean };

function sortByCreatedAt(a: RenderableComment, b: RenderableComment) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export function TaskCommentStream({
  taskId,
  comments,
}: {
  taskId: string;
  comments: RenderableComment[];
}) {
  const [extras, setExtras] = useState<CommentEvent[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const shown = useMemo(() => {
    const deleted = new Set(deletedIds);
    const byId = new Map<string, RenderableComment>();
    for (const extra of extras) {
      if (!deleted.has(extra.id)) {
        byId.set(extra.id, { ...extra, canDelete: false });
      }
    }
    for (const comment of comments) {
      byId.set(comment.id, comment); // server props win (authoritative canDelete)
    }
    return [...byId.values()].sort(sortByCreatedAt);
  }, [comments, extras, deletedIds]);

  function handleIncoming(comment: CommentEvent) {
    setExtras((prev) =>
      prev.some((c) => c.id === comment.id) ? prev : [comment, ...prev],
    );
  }

  function handleDeleted(id: string) {
    setDeletedIds((prev) => [...prev, id]);
  }

  return (
    <div>
      {shown.length === 0 ? (
        <p className="text-sm text-slate-500">
          No comments yet. Start the conversation below.
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDeleted={handleDeleted}
            />
          ))}
        </ul>
      )}
      <CommentSse taskId={taskId} onIncoming={handleIncoming} />
    </div>
  );
}

function CommentSse({
  taskId,
  onIncoming,
}: {
  taskId: string;
  onIncoming: (comment: CommentEvent) => void;
}) {
  const router = useRouter();

  useEffect(() => {
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let closed = false;

    function clearPoll() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = undefined;
      }
    }

    function connect() {
      if (closed) {
        return;
      }
      es = new EventSource(`/api/tasks/${taskId}/comments/stream`);
      es.onopen = () => clearPoll();
      es.onmessage = (event) => {
        try {
          onIncoming(JSON.parse(event.data) as CommentEvent);
        } catch {
          // ignore malformed events
        }
      };
      es.onerror = () => {
        // SSE unavailable (connection dropped / proxy blocked the stream):
        // fall back to periodically refreshing server-rendered comments.
        if (!pollTimer) {
          pollTimer = setInterval(() => router.refresh(), 5000);
        }
      };
    }

    connect();

    return () => {
      closed = true;
      es?.close();
      clearPoll();
    };
  }, [taskId, onIncoming, router]);

  return null;
}

function CommentItem({
  comment,
  onDeleted,
}: {
  comment: RenderableComment;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    const formData = new FormData();
    formData.set("commentId", comment.id);
    try {
      await deleteCommentAction(formData);
      onDeleted(comment.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">
          {comment.authorName}
          <span className="ml-2 text-xs font-normal text-slate-400">
            {new Date(comment.createdAt).toLocaleString()}
          </span>
        </p>
        {comment.canDelete && (
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
        {comment.body}
      </p>
    </li>
  );
}
