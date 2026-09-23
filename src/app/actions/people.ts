"use server";

import { safeAction } from "@/lib/safe-action";

import { Role, StudentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthorizationError, requireRole } from "@/lib/auth";
import { lockActiveTeacher, lockManagedStudent } from "@/lib/locks";
import { prisma } from "@/lib/prisma";
import { formValues, optionalDate, optionalText } from "@/lib/validation";

const teacherSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  password: z.string().min(10).max(72),
});

const studentSchema = teacherSchema.extend({
  primaryTeacherId: z.string().min(1),
  birthDate: optionalDate.refine(value => !value || value <= new Date()),
  goal: optionalText(180),
  phone: optionalText(25),
  notes: optionalText(1_500),
});

const updateStudentSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  primaryTeacherId: z.string().min(1).optional(),
  nutritionistId: z.string().optional(),
  birthDate: optionalDate.refine(value => !value || value <= new Date()),
  goal: optionalText(180),
  phone: optionalText(25),
  notes: optionalText(1_500),
  status: z.nativeEnum(StudentStatus),
});

function refreshPeoplePaths(studentId?: string) {
  revalidatePath("/students");
  revalidatePath("/teachers");
  revalidatePath("/dashboard");
  revalidatePath("/pending");
  if (studentId) revalidatePath(`/students/${studentId}`);
}

export async function createTeacher(formData: FormData) {
  return safeAction(async () => {
  const membership = await requireRole(Role.ADMIN);
  const input = teacherSchema.parse(formValues(formData));
  const passwordHash = await bcrypt.hash(input.password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        mustChangePassword: true,
      },
    });

    await tx.membership.create({
      data: {
        organizationId: membership.organizationId,
        userId: user.id,
        role: Role.PROFESSOR,
      },
    });
  });

  refreshPeoplePaths();
  redirect("/teachers");

  });
}

export async function createStudent(formData: FormData) {
  return safeAction(async () => {
  const membership = await requireRole(Role.ADMIN);
  const input = studentSchema.parse(formValues(formData));

  const passwordHash = await bcrypt.hash(input.password, 12);
  const student = await prisma.$transaction(async (tx) => {
    const teacher = await lockActiveTeacher(tx, membership.organizationId, input.primaryTeacherId);
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        mustChangePassword: true,
      },
    });

    const studentMembership = await tx.membership.create({
      data: {
        organizationId: membership.organizationId,
        userId: user.id,
        role: Role.STUDENT,
      },
    });

    return tx.studentProfile.create({
      data: {
        organizationId: membership.organizationId,
        membershipId: studentMembership.id,
        primaryTeacherId: teacher.id,
        birthDate: input.birthDate ?? null,
        goal: input.goal ?? null,
        phone: input.phone ?? null,
        notes: input.notes ?? null,
      },
    });
  });

  refreshPeoplePaths(student.id);
  redirect(`/students/${student.id}`);

  });
}

export async function updateStudent(formData: FormData) {
  return safeAction(async () => {
  const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
  const input = updateStudentSchema.parse(formValues(formData));
  await prisma.$transaction(async tx => {
    const student = await lockManagedStudent(tx, viewer, input.studentId);
    const primaryTeacherId = input.primaryTeacherId || student.primaryTeacherId;
    const nutritionistId = input.nutritionistId === undefined ? student.nutritionistId : input.nutritionistId || null;
    if (nutritionistId !== student.nutritionistId && viewer.role !== Role.ADMIN) throw new AuthorizationError("Somente administradores podem trocar o nutricionista responsável.");
    if (nutritionistId) {
      const professional = await tx.membership.findFirst({ where: { id: nutritionistId, organizationId: viewer.organizationId, role: Role.NUTRITIONIST, active: true } });
      if (!professional) throw new AuthorizationError("Nutricionista indisponível nesta academia.");
    }
    if (primaryTeacherId !== student.primaryTeacherId) {
    if (viewer.role !== Role.ADMIN) {
      throw new AuthorizationError("Somente administradores podem trocar o professor responsável.");
    }
    }
    if (input.status === StudentStatus.ACTIVE || primaryTeacherId !== student.primaryTeacherId) {
      await lockActiveTeacher(tx, viewer.organizationId, primaryTeacherId);
    }
    const member = await tx.membership.findUniqueOrThrow({ where: { id: student.membershipId } });
    await tx.user.update({ where: { id: member.userId }, data: { name: input.name,
      ...(input.status !== student.status ? { sessionVersion: { increment: 1 } } : {}),
    } });
    await tx.studentProfile.update({
      where: { id: student.id },
      data: {
        primaryTeacherId,
        nutritionistId,
        birthDate: input.birthDate ?? null,
        goal: input.goal ?? null,
        phone: input.phone ?? null,
        notes: input.notes ?? null,
        status: input.status,
      },
    });
    if (nutritionistId !== student.nutritionistId) {
      await tx.nutritionPlan.updateMany({ where: { organizationId: viewer.organizationId, studentId: student.id, active: true }, data: { active: false } });
    }
  });

  refreshPeoplePaths(input.studentId);
  redirect(`/students/${input.studentId}`);

  });
}

export async function updateTeacher(formData: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN);
    const input = z.object({ membershipId: z.string().min(1), name: z.string().trim().min(2).max(120), active: z.enum(["true", "false"]) }).parse(formValues(formData));
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Membership" WHERE id = ${input.membershipId} AND "organizationId" = ${viewer.organizationId} FOR UPDATE`;
      const teacher = await tx.membership.findFirst({ where: { id: input.membershipId, organizationId: viewer.organizationId, role: Role.PROFESSOR } });
      if (!teacher) throw new AuthorizationError();
      const assigned = await tx.studentProfile.count({ where: { primaryTeacherId: teacher.id, organizationId: viewer.organizationId, status: StudentStatus.ACTIVE } });
      if (input.active === "false" && assigned) throw new AuthorizationError("Transfira os alunos ativos para outro professor antes de desativar este acesso.");
      await tx.membership.update({ where: { id: teacher.id }, data: { active: input.active === "true" } });
      await tx.user.update({ where: { id: teacher.userId }, data: { name: input.name, ...(input.active === "false" ? { sessionVersion: { increment: 1 } } : {}) } });
    });
    refreshPeoplePaths();
    return { success: "Cadastro do professor atualizado." };
  });
}
