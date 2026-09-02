"use client";

import { useActionState } from "react";
import { createProjectAction } from "@/actions/projects";

export function CreateProjectForm({ workspaceId }: { workspaceId: string }) {
  const [state, action, pending] = useActionState(createProjectAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input
        type="text"
        name="name"
        required
        maxLength={120}
        placeholder="New project name"
        className="w-full flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create project"}
      </button>
      {state?.error && (
        <span className="text-sm text-red-700">{state.error}</span>
      )}
    </form>
  );
}
