"use client";

import { useActionState } from "react";
import { createWorkspaceAction } from "@/actions/workspaces";

export function CreateWorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspaceAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">New workspace</h3>
      <div>
        <label
          htmlFor="ws-name"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Name
        </label>
        <input
          id="ws-name"
          name="name"
          type="text"
          required
          maxLength={80}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none"
          placeholder="Acme Inc."
        />
      </div>
      <div>
        <label
          htmlFor="ws-slug"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Slug
        </label>
        <div className="flex items-center rounded-lg border border-slate-300 focus-within:border-slate-500">
          <span className="px-3 text-sm text-slate-400">/w/</span>
          <input
            id="ws-slug"
            name="slug"
            type="text"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            maxLength={50}
            className="w-full rounded-r-lg px-3 py-2 pl-0 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            placeholder="acme-inc"
          />
        </div>
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create workspace"}
      </button>
    </form>
  );
}
