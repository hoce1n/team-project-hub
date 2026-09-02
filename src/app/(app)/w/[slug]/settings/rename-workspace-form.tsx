"use client";

import { useActionState } from "react";
import { updateWorkspaceAction } from "@/actions/workspaces";

export function RenameWorkspaceForm({
  workspaceId,
  currentName,
}: {
  workspaceId: string;
  currentName: string;
}) {
  const [state, action, pending] = useActionState(updateWorkspaceAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row">
      <input type="hidden" name="id" value={workspaceId} />
      <input
        type="text"
        name="name"
        required
        maxLength={80}
        defaultValue={currentName}
        className="w-full flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
      {state?.error && (
        <span className="text-sm text-red-700">{state.error}</span>
      )}
    </form>
  );
}
