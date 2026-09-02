"use client";

import { useActionState } from "react";
import { inviteMemberAction } from "@/actions/workspaces";

export function InviteMemberForm({ workspaceId }: { workspaceId: string }) {
  const [state, action, pending] = useActionState(inviteMemberAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-900">Invite a member</h3>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          placeholder="teammate@example.com"
          className="w-full flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none"
        />
        <select
          name="role"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          defaultValue="MEMBER"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Inviting..." : "Invite"}
        </button>
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
