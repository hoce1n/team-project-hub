import { describe, expect, it } from "vitest";
import { can, roleRank, ROLE_LABELS } from "./authz";

describe("can()", () => {
  it("denies everything for a non-member", () => {
    expect(can(null, "view")).toBe(false);
    expect(can(undefined, "view")).toBe(false);
  });

  it("lets all roles view a workspace", () => {
    for (const role of ["OWNER", "ADMIN", "MEMBER"] as const) {
      expect(can(role, "view")).toBe(true);
    }
  });

  it("only OWNER and ADMIN can invite members", () => {
    expect(can("OWNER", "invite")).toBe(true);
    expect(can("ADMIN", "invite")).toBe(true);
    expect(can("MEMBER", "invite")).toBe(false);
  });

  it("only OWNER can delete the workspace", () => {
    expect(can("OWNER", "deleteWorkspace")).toBe(true);
    expect(can("ADMIN", "deleteWorkspace")).toBe(false);
    expect(can("MEMBER", "deleteWorkspace")).toBe(false);
  });

  it("lets OWNER and ADMIN manage members and projects", () => {
    expect(can("OWNER", "manageMembers")).toBe(true);
    expect(can("ADMIN", "manageMembers")).toBe(true);
    expect(can("MEMBER", "manageMembers")).toBe(false);

    expect(can("OWNER", "manageProjects")).toBe(true);
    expect(can("ADMIN", "manageProjects")).toBe(true);
    expect(can("MEMBER", "manageProjects")).toBe(false);
  });

  it("lets OWNER and ADMIN edit workspace settings", () => {
    expect(can("OWNER", "editWorkspace")).toBe(true);
    expect(can("ADMIN", "editWorkspace")).toBe(true);
    expect(can("MEMBER", "editWorkspace")).toBe(false);
  });
});

describe("roleRank()", () => {
  it("orders OWNER > ADMIN > MEMBER", () => {
    expect(roleRank("OWNER")).toBeGreaterThan(roleRank("ADMIN"));
    expect(roleRank("ADMIN")).toBeGreaterThan(roleRank("MEMBER"));
  });
});

describe("ROLE_LABELS", () => {
  it("has human labels for every role", () => {
    expect(ROLE_LABELS).toHaveProperty("OWNER");
    expect(ROLE_LABELS).toHaveProperty("ADMIN");
    expect(ROLE_LABELS).toHaveProperty("MEMBER");
  });
});
