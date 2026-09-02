import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getMembershipBySlug } from "@/lib/membership";
import { prisma } from "@/lib/db";

export default async function WorkspaceHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();
  const membership = await getMembershipBySlug(user.id, slug);
  if (!membership) {
    return null;
  }

  const workspaceId = membership.workspace.id;
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
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No projects yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Projects are small collections of tasks that your team works on
            together. Project creation arrives in the next phase.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold text-slate-900">{project.name}</h3>
              {project.description && (
                <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                  {project.description}
                </p>
              )}
              <span className="mt-3 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {project._count.tasks} tasks
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-slate-500">
        <Link
          href={`/w/${slug}/members`}
          className="font-medium text-slate-900 underline"
        >
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </Link>{" "}
        in this workspace.
      </p>
    </div>
  );
}
