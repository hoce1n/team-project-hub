"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { renameProjectAction, deleteProjectAction } from "@/actions/projects";

function RenameForm({ projectId, currentName }: { projectId: string; currentName: string }) {
  const [state, action, pending] = useActionState(renameProjectAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="project-name" className="text-sm font-medium text-slate-700">
        Project name
      </label>
      <div className="flex gap-2">
        <input
          id="project-name"
          name="name"
          type="text"
          required
          maxLength={120}
          defaultValue={currentName}
          className="w-full flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
        />
        <input type="hidden" name="projectId" value={projectId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Rename"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
    </form>
  );
}

function ConfirmDeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete project"}
    </button>
  );
}

export function ProjectAdminPanel({
  projectId,
  currentName,
}: {
  projectId: string;
  currentName: string;
}) {
  const [deleteArmed, setDeleteArmed] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">Project settings</h3>
      <div className="mt-3">
        <RenameForm projectId={projectId} currentName={currentName} />
      </div>
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-sm font-medium text-red-900">Danger zone</p>
        <form action={deleteProjectAction} className="mt-2 flex items-center gap-3">
          <input type="hidden" name="projectId" value={projectId} />
          {!deleteArmed ? (
            <button
              type="button"
              onClick={() => setDeleteArmed(true)}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Delete project
            </button>
          ) : (
            <>
              <p className="text-sm font-medium text-red-900">
                Delete all its tasks too?
              </p>
              <ConfirmDeleteButton />
              <button
                type="button"
                onClick={() => setDeleteArmed(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
