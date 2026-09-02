import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getMembershipBySlug } from "@/lib/membership";
import { can } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { CreateProjectForm } from "./create-project-form";

export default async function WorkspaceHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();
  const membership = await getMembershipBySlug(user.id, slug);
  if (!membership) {
    notFound();
  }

  const workspaceId = membership.workspace.id;
  const canManageProjects = can(membership.role, "manageProjects");
  const [projects, memberCount] = await Promise.all([
    prisma.project.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.workspaceMember.count({ where: { workspaceId } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">Projects</h2>
        <Link
          href={`/w/${slug}/members`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </Link>
      </div>

      {canManageProjects && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <CreateProjectForm workspaceId={workspaceId} />
        </div>
      )}

      {projects.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            No projects yet
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            {canManageProjects
              ? "Create the first project to start tracking tasks with your team."
              : "Ask an Admin or Owner to create the first project."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/w/${slug}/p/${project.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <h3 className="font-semibold text-slate-900">{project.name}</h3>
              {project.description && (
                <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                  {project.description}
                </p>
              )}
              <span className="mt-3 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {project._count.tasks} {project._count.tasks === 1 ? "task" : "tasks"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
