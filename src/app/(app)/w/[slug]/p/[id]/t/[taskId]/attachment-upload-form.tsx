"use client";

import { useActionState } from "react";
import { addAttachmentAction } from "@/actions/attachments";

export function AttachmentUploadForm({ taskId }: { taskId: string }) {
  const [state, action, pending] = useActionState(addAttachmentAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="taskId" value={taskId} />
      <input
        type="file"
        name="file"
        required
        accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain,text/markdown,text/csv,application/json"
        disabled={pending}
        className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800 disabled:opacity-50"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {pending ? "Uploading..." : "Upload file"}
        </button>
        {state?.error && (
          <span className="text-sm text-red-700">{state.error}</span>
        )}
        {state?.ok && <span className="text-sm text-emerald-700">Uploaded.</span>}
      </div>
      <p className="text-xs text-slate-400">
        Images, PDF, text, CSV, JSON. Max 5MB.
      </p>
    </form>
  );
}
