import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const user = await requireUser();

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        Welcome, {user.name}
      </h1>
      <p className="mt-1 text-slate-500">
        Your workspaces will appear here. Workspace management lands in the
        next phase.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {memberships.map((membership) => (
          <div
            key={membership.workspaceId}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold text-slate-900">
              {membership.workspace.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              /{membership.workspace.slug}
            </p>
            <span className="mt-3 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {membership.role.toLowerCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
