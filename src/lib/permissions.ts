import { Role, type Membership, type StudentProfile } from "@prisma/client";

export type Viewer = Pick<Membership, "id" | "organizationId" | "role">;
export type StudentResource = Pick<
  StudentProfile,
  "organizationId" | "membershipId" | "primaryTeacherId"
>;

export function canAccessStudent(viewer: Viewer, student: StudentResource) {
  if (viewer.organizationId !== student.organizationId) {
    return false;
  }

  if (viewer.role === Role.ADMIN) {
    return true;
  }

  if (viewer.role === Role.PROFESSOR) {
    return student.primaryTeacherId === viewer.id;
  }

  return student.membershipId === viewer.id;
}

export function canManageStudent(viewer: Viewer, student: StudentResource) {
  return (
    viewer.organizationId === student.organizationId &&
    (viewer.role === Role.ADMIN ||
      (viewer.role === Role.PROFESSOR && student.primaryTeacherId === viewer.id))
  );
}

export function canManageCatalog(viewer: Viewer) {
  return viewer.role === Role.ADMIN || viewer.role === Role.PROFESSOR;
}
