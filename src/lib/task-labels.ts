import type { TaskStatus } from "@/generated/prisma/enums";

export const STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};
