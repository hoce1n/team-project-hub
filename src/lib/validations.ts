import { z } from "zod";

const slugPattern = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(80, "Name must be 80 characters or fewer");

export const workspaceSlugSchema = z
  .string()
  .trim()
  .min(3, "Slug must be at least 3 characters")
  .max(50, "Slug must be 50 characters or fewer")
  .regex(slugPattern, "Slug may only contain lowercase letters, numbers and hyphens");

export const createWorkspaceSchema = z.object({
  name: workspaceNameSchema,
  slug: workspaceSlugSchema,
});

export const updateWorkspaceSchema = z.object({
  id: z.string().cuid(),
  name: workspaceNameSchema.optional(),
});

export const joinWorkspaceSchema = z.object({
  slug: workspaceSlugSchema,
});

export const inviteMemberSchema = z.object({
  workspaceId: z.string().cuid(),
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const changeMemberRoleSchema = z.object({
  workspaceId: z.string().cuid(),
  memberId: z.string().cuid(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const removeMemberSchema = z.object({
  workspaceId: z.string().cuid(),
  memberId: z.string().cuid(),
});

export const createProjectSchema = z.object({
  workspaceId: z.string().cuid(),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  description: z.string().trim().max(1000, "Keep the description under 1000 characters").optional(),
});

export const updateProjectSchema = z.object({
  projectId: z.string().cuid(),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer")
    .optional(),
  description: z.string().trim().max(1000, "Keep the description under 1000 characters").optional(),
});

export const createTaskSchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
  description: z.string().trim().max(2000, "Keep the description under 2000 characters").optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().datetime().optional().or(z.literal("")),
  assigneeId: z.string().cuid().nullable().optional(),
});

export const updateTaskSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be 200 characters or fewer").optional(),
  description: z.string().trim().max(2000, "Keep the description under 2000 characters").optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().datetime().optional().or(z.literal("")),
  assigneeId: z.string().cuid().nullable().optional(),
});

export const setTaskStatusSchema = z.object({
  taskId: z.string().cuid(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
});
