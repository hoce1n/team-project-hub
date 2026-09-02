"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteTaskAction } from "@/actions/tasks";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete task"}
    </button>
  );
}

export function DeleteTaskForm({ taskId }: { taskId: string }) {
  const [armed, setArmed] = useState(false);

  return (
    <form action={deleteTaskAction} className="flex items-center gap-3">
      <input type="hidden" name="taskId" value={taskId} />
      {!armed && (
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete task
        </button>
      )}
      {armed && (
        <>
          <p className="text-sm font-medium text-red-900">Delete this task?</p>
          <ConfirmButton />
          <button
            type="button"
            onClick={() => setArmed(false)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </>
      )}
    </form>
  );
}
