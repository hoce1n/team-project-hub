"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteWorkspaceAction } from "@/actions/workspaces";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete workspace"}
    </button>
  );
}

export function DeleteWorkspaceForm({ workspaceId }: { workspaceId: string }) {
  const [armed, setArmed] = useState(false);

  return (
    <form action={deleteWorkspaceAction} className="flex items-center gap-3">
      <input type="hidden" name="id" value={workspaceId} />
      {!armed && (
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Delete workspace
        </button>
      )}
      {armed && (
        <>
          <p className="text-sm font-medium text-red-900">
            Are you sure? This deletes everything.
          </p>
          <ConfirmButton />
          <button
            type="button"
            onClick={() => setArmed(false)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </>
      )}
    </form>
  );
}
