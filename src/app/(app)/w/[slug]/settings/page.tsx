import { requireUser } from "@/lib/session";
import { getMembershipBySlug } from "@/lib/membership";
import { can } from "@/lib/authz";
import { RenameWorkspaceForm } from "./rename-workspace-form";
import { DeleteWorkspaceForm } from "./delete-workspace-form";

export default async function WorkspaceSettingsPage({
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

  const workspace = membership.workspace;
  const canEdit = can(membership.role, "editWorkspace");
  const canDelete = can(membership.role, "deleteWorkspace");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {canEdit && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Workspace name</h2>
          <p className="mt-1 text-sm text-slate-500">
            Changing the name updates it for everyone in the workspace.
          </p>
          <div className="mt-4">
            <RenameWorkspaceForm
              workspaceId={workspace.id}
              currentName={workspace.name}
            />
          </div>
        </section>
      )}

      {canDelete && (
        <section className="rounded-xl border border-red-200 bg-red-50/50 p-5">
          <h2 className="text-sm font-semibold text-red-900">
            Delete workspace
          </h2>
          <p className="mt-1 text-sm text-red-700/80">
            Permanently deletes the workspace and all of its projects, tasks and
            comments. This cannot be undone.
          </p>
          <div className="mt-4">
            <DeleteWorkspaceForm workspaceId={workspace.id} />
          </div>
        </section>
      )}

      {!canEdit && (
        <p className="text-sm text-slate-500">
          You need at least an Admin role to manage workspace settings.
        </p>
      )}
    </div>
  );
}
