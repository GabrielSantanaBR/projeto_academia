import type { Prisma } from "@prisma/client";
import { AuthorizationError } from "@/lib/auth";
import { canManageStudent, type Viewer } from "@/lib/permissions";

export async function lockManagedStudent(tx: Prisma.TransactionClient, viewer: Viewer, id: string) {
  await tx.$queryRaw`SELECT id FROM "StudentProfile" WHERE id = ${id} AND "organizationId" = ${viewer.organizationId} FOR UPDATE`;
  const student = await tx.studentProfile.findFirst({ where: { id, organizationId: viewer.organizationId } });
  if (!student || !canManageStudent(viewer, student)) throw new AuthorizationError("Aluno indisponível para sua conta.");
  return student;
}

/** Serialize assignments with deactivation so active students keep an active teacher. */
export async function lockActiveTeacher(tx: Prisma.TransactionClient, organizationId: string, id: string | null) {
  if (!id) throw new AuthorizationError("Escolha um professor ativo desta academia.");
  await tx.$queryRaw`SELECT id FROM "Membership" WHERE id = ${id} AND "organizationId" = ${organizationId} FOR UPDATE`;
  const teacher = await tx.membership.findFirst({ where: { id, organizationId, role: "PROFESSOR", active: true } });
  if (!teacher) throw new AuthorizationError("Escolha um professor ativo desta academia.");
  return teacher;
}
