import { requireUser } from "@/lib/session";
import { getMembershipBySlug } from "@/lib/membership";
import { can, ROLE_LABELS } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { InviteMemberForm } from "./invite-member-form";
import { MemberActions } from "./member-actions";

export default async function MembersPage({
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

  const currentUserRole = membership.role;
  const canInvite = can(currentUserRole, "invite");
  const canManage = can(currentUserRole, "manageMembers");

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: membership.workspace.id },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-xl font-semibold text-slate-900">
        Members ({members.length})
      </h2>

      {canInvite && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <InviteMemberForm workspaceId={membership.workspace.id} />
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {members.map((member) => {
          const isSelf = member.userId === user.id;
          const isOwner = member.role === "OWNER";
          return (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                  {member.user.name?.slice(0, 1).toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {member.user.name}
                    {isSelf && <span className="text-slate-400"> (you)</span>}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {member.user.email}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {ROLE_LABELS[member.role]}
                </span>
                {canManage && !isSelf && !isOwner && (
                  <MemberActions
                    workspaceId={membership.workspace.id}
                    memberId={member.id}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
