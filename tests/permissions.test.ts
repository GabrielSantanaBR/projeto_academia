import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { canAccessStudent, canManageStudent } from "../src/lib/permissions";

const student = {
  organizationId: "gym-a",
  membershipId: "student-membership",
  primaryTeacherId: "teacher-a",
};

describe("tenant authorization", () => {
  it("never grants access across organizations", () => {
    expect(
      canAccessStudent(
        { id: "admin-b", organizationId: "gym-b", role: Role.ADMIN },
        student,
      ),
    ).toBe(false);
  });

  it("allows an admin from the same academy", () => {
    expect(
      canManageStudent(
        { id: "admin-a", organizationId: "gym-a", role: Role.ADMIN },
        student,
      ),
    ).toBe(true);
  });

  it("restricts professors to their assigned students", () => {
    expect(
      canAccessStudent(
        { id: "teacher-a", organizationId: "gym-a", role: Role.PROFESSOR },
        student,
      ),
    ).toBe(true);
    expect(
      canAccessStudent(
        { id: "teacher-other", organizationId: "gym-a", role: Role.PROFESSOR },
        student,
      ),
    ).toBe(false);
  });

  it("limits a student to their own profile", () => {
    expect(
      canAccessStudent(
        { id: "student-membership", organizationId: "gym-a", role: Role.STUDENT },
        student,
      ),
    ).toBe(true);
    expect(
      canAccessStudent(
        { id: "other-student", organizationId: "gym-a", role: Role.STUDENT },
        student,
      ),
    ).toBe(false);
  });
});
