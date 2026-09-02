"use client";

import { useActionState } from "react";
import { createTaskAction } from "@/actions/tasks";
import type { TaskStatus } from "@/generated/prisma/enums";

export function NewTaskForm({
  projectId,
  defaultStatus,
}: {
  projectId: string;
  defaultStatus: TaskStatus;
}) {
  const [state, action, pending] = useActionState(createTaskAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="status" value={defaultStatus} />
      <input
        type="text"
        name="title"
        required
        maxLength={200}
        disabled={pending}
        placeholder={`Add a task to "${defaultStatus.toLowerCase()}"...`}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add task"}
      </button>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
