"use client";

import { useTransition } from "react";
import { setTaskStatusAction } from "@/actions/tasks";
import { STATUS_ORDER, STATUS_LABELS } from "@/lib/task-labels";
import type { TaskStatus } from "@/generated/prisma/enums";

export function TaskStatusSelect({
  taskId,
  currentStatus,
}: {
  taskId: string;
  currentStatus: TaskStatus;
}) {
  const [pending, startTransition] = useTransition();

  function handleChange(status: TaskStatus) {
    if (status === currentStatus) {
      return;
    }
    const formData = new FormData();
    formData.set("taskId", taskId);
    formData.set("status", status);
    startTransition(async () => {
      await setTaskStatusAction(undefined, formData);
    });
  }

  return (
    <select
      value={currentStatus}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value as TaskStatus)}
      className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-slate-500 focus:outline-none disabled:opacity-50"
    >
      {STATUS_ORDER.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
