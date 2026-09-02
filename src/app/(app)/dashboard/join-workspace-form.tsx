"use client";

import { useActionState } from "react";
import { joinWorkspaceAction } from "@/actions/workspaces";

export function JoinWorkspaceForm() {
  const [state, action, pending] = useActionState(joinWorkspaceAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">Join a workspace</h3>
      <div className="flex items-center rounded-lg border border-slate-300 focus-within:border-slate-500">
        <span className="px-3 text-sm text-slate-400">/w/</span>
        <input
          name="slug"
          type="text"
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          maxLength={50}
          className="w-full rounded-r-lg px-3 py-2 pl-0 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          placeholder="acme-inc"
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {pending ? "Joining..." : "Join"}
      </button>
    </form>
  );
}
