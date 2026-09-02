import type { WorkspaceRole } from "@/generated/prisma/enums";

export type WorkspaceAction =
  | "view"
  | "invite"
  | "editWorkspace"
  | "deleteWorkspace"
  | "manageMembers"
  | "manageProjects";

type RoleCapabilities = Record<WorkspaceRole, WorkspaceAction[]>;

const CAPABILITIES: RoleCapabilities = {
  OWNER: [
    "view",
    "invite",
    "editWorkspace",
    "deleteWorkspace",
    "manageMembers",
    "manageProjects",
  ],
  ADMIN: ["view", "invite", "editWorkspace", "manageMembers", "manageProjects"],
  MEMBER: ["view"],
};

export function can(
  role: WorkspaceRole | null | undefined,
  action: WorkspaceAction,
): boolean {
  if (!role) {
    return false;
  }
  return CAPABILITIES[role].includes(action);
}

export function roleRank(role: WorkspaceRole): number {
  switch (role) {
    case "OWNER":
      return 3;
    case "ADMIN":
      return 2;
    case "MEMBER":
      return 1;
  }
}

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};
