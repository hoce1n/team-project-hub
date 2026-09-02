import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/authz";
import { CreateWorkspaceForm } from "./create-workspace-form";
import { JoinWorkspaceForm } from "./join-workspace-form";

export default async function DashboardPage() {
  const user = await requireUser();

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: { include: { _count: { select: { members: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">
        Your workspaces
      </h1>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Workspaces ({memberships.length})
          </h2>
          {memberships.length === 0 ? (
            <p className="text-sm text-slate-500">
              You are not in any workspace yet. Create one or join with a slug.
            </p>
          ) : (
            <ul className="space-y-3">
              {memberships.map((membership) => (
                <li key={membership.workspaceId}>
                  <Link
                    href={`/w/${membership.workspace.slug}`}
                    className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {membership.workspace.name}
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500">
                          /w/{membership.workspace.slug}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {ROLE_LABELS[membership.role]}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {membership.workspace._count.members} members
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <CreateWorkspaceForm />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <JoinWorkspaceForm />
          </div>
        </section>
      </div>
    </div>
  );
}
