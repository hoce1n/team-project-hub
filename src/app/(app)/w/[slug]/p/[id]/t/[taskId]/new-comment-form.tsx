"use client";

import { useActionState } from "react";
import { createCommentAction } from "@/actions/comments";

export function NewCommentForm({ taskId }: { taskId: string }) {
  const [state, action, pending] = useActionState(createCommentAction, undefined);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="taskId" value={taskId} />
      <textarea
        name="body"
        required
        rows={3}
        maxLength={2000}
        placeholder="Write a comment..."
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Posting..." : "Post comment"}
        </button>
        {state?.error && (
          <span className="text-sm text-red-700">{state.error}</span>
        )}
      </div>
    </form>
  );
}
