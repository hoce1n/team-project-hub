import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getMembershipBySlug } from "@/lib/membership";
import { can, ROLE_LABELS } from "@/lib/authz";
import { WorkspaceNav } from "./workspace-nav";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();

  const membership = await getMembershipBySlug(user.id, slug);
  if (!membership || !can(membership.role, "view")) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">
          {membership.workspace.name}
        </h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
          <span>/w/{membership.workspace.slug}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {ROLE_LABELS[membership.role]}
          </span>
        </div>
        <div className="mt-4">
          <WorkspaceNav slug={membership.workspace.slug} />
        </div>
      </div>
      {children}
    </div>
  );
}
