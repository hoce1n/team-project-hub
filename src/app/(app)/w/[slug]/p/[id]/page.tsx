import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getMembershipBySlug } from "@/lib/membership";
import { prisma } from "@/lib/db";
import { STATUS_ORDER, STATUS_LABELS } from "@/lib/task-labels";
import { can } from "@/lib/authz";
import { NewTaskForm } from "./new-task-form";
import { TaskCard } from "./task-card";
import { ProjectAdminPanel } from "./project-admin-panel";

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const user = await requireUser();
  const membership = await getMembershipBySlug(user.id, slug);
  if (!membership) {
    notFound();
  }

  const project = await prisma.project.findFirst({
    where: { id, workspaceId: membership.workspace.id },
  });
  if (!project) {
    notFound();
  }

  const tasks = await prisma.task.findMany({
    where: { projectId: project.id },
    include: { assignee: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status),
  }));

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/w/${slug}`}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← {membership.workspace.name}
          </Link>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            {project.name}
          </h2>
          {project.description && (
            <p className="mt-1 text-sm text-slate-500">{project.description}</p>
          )}
        </div>
      </div>

      {can(membership.role, "manageProjects") && (
        <div className="mb-6">
          <ProjectAdminPanel projectId={project.id} currentName={project.name} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {grouped.map(({ status, tasks: columnTasks }) => (
          <div
            key={status}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <h3 className="px-1 text-sm font-semibold text-slate-700">
              {STATUS_LABELS[status]}{" "}
              <span className="font-normal text-slate-400">
                {columnTasks.length}
              </span>
            </h3>
            <div className="mt-2 space-y-2">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  taskId={task.id}
                  title={task.title}
                  priority={task.priority}
                  assigneeName={task.assignee?.name ?? null}
                  currentStatus={task.status}
                  href={`/w/${slug}/p/${project.id}/t/${task.id}`}
                />
              ))}
            </div>
            <div className="mt-3">
              <NewTaskForm projectId={project.id} defaultStatus={status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
