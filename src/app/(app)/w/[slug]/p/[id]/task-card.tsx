"use client";

import Link from "next/link";
import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import { TaskStatusSelect } from "./task-status-select";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-red-50 text-red-700",
};

export function TaskCard({
  taskId,
  title,
  priority,
  assigneeName,
  currentStatus,
  href,
}: {
  taskId: string;
  title: string;
  priority: TaskPriority;
  assigneeName: string | null;
  currentStatus: TaskStatus;
  href: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <Link href={href} className="block font-medium text-slate-900 hover:underline">
        {title}
      </Link>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${PRIORITY_COLORS[priority]}`}
          >
            {priority}
          </span>
          {assigneeName && (
            <span className="text-slate-500">{assigneeName}</span>
          )}
        </div>
        <TaskStatusSelect taskId={taskId} currentStatus={currentStatus} />
      </div>
    </div>
  );
}
