import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getMembershipBySlug } from "@/lib/membership";
import { prisma } from "@/lib/db";
import { can } from "@/lib/authz";
import { TaskEditForm } from "./task-edit-form";
import { DeleteTaskForm } from "./delete-task-form";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string; taskId: string }>;
}) {
  const { slug, id, taskId } = await params;
  const user = await requireUser();
  const membership = await getMembershipBySlug(user.id, slug);
  if (!membership) {
    notFound();
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId: id,
      project: { workspaceId: membership.workspace.id },
    },
    include: {
      project: { select: { id: true, name: true, workspaceId: true } },
      createdBy: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  });
  if (!task) {
    notFound();
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: membership.workspace.id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const canDelete =
    task.createdById === user.id || can(membership.role, "manageProjects");

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/w/${slug}/p/${task.project.id}`}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← {task.project.name}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{task.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Created by {task.createdBy.name}
        {task.assignee ? ` · Assigned to ${task.assignee.name}` : ""}
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <TaskEditForm
          taskId={task.id}
          title={task.title}
          description={task.description}
          priority={task.priority}
          dueDate={task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null}
          assigneeId={task.assigneeId}
          members={members.map((member) => ({
            id: member.user.id,
            name: member.user.name ?? member.user.id,
          }))}
        />
      </div>

      {canDelete && (
        <div className="mt-4 flex justify-end">
          <DeleteTaskForm taskId={task.id} />
        </div>
      )}
    </div>
  );
}
