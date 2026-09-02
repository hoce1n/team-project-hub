"use client";

import { useActionState } from "react";
import {
  changeMemberRoleAction,
  removeMemberAction,
} from "@/actions/workspaces";

export function MemberActions({
  workspaceId,
  memberId,
}: {
  workspaceId: string;
  memberId: string;
}) {
  const [roleState, roleAction, rolePending] = useActionState(
    changeMemberRoleAction,
    undefined,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeMemberAction,
    undefined,
  );

  return (
    <div className="flex items-center gap-2">
      <form action={roleAction}>
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <input type="hidden" name="memberId" value={memberId} />
        <select
          name="role"
          defaultValue="MEMBER"
          disabled={rolePending}
          onChange={(e) => e.target.form?.requestSubmit()}
          className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 focus:border-slate-500 focus:outline-none"
        >
          <option value="MEMBER">Make member</option>
          <option value="ADMIN">Make admin</option>
        </select>
      </form>
      <form action={removeAction}>
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <input type="hidden" name="memberId" value={memberId} />
        <button
          type="submit"
          disabled={removePending}
          className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Remove
        </button>
      </form>
      {roleState?.error && (
        <span className="text-xs text-red-700">{roleState.error}</span>
      )}
      {removeState?.error && (
        <span className="text-xs text-red-700">{removeState.error}</span>
      )}
    </div>
  );
}
