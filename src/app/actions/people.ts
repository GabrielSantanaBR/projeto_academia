"use server";

import { Role, StudentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthorizationError, requireRole } from "@/lib/auth";
import { canManageStudent } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formValues, optionalDate, optionalText } from "@/lib/validation";

const teacherSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
});

const studentSchema = teacherSchema.extend({
  primaryTeacherId: z.string().min(1),
  birthDate: optionalDate,
  goal: optionalText(180),
  notes: optionalText(1_500),
});

const updateStudentSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  primaryTeacherId: z.string().min(1).optional(),
  birthDate: optionalDate,
  goal: optionalText(180),
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
  const membership = await requireRole(Role.ADMIN);
  const input = teacherSchema.parse(formValues(formData));
  const passwordHash = await bcrypt.hash(input.password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
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
}

export async function createStudent(formData: FormData) {
  const membership = await requireRole(Role.ADMIN);
  const input = studentSchema.parse(formValues(formData));

  const teacher = await prisma.membership.findFirst({
    where: {
      id: input.primaryTeacherId,
      organizationId: membership.organizationId,
      role: Role.PROFESSOR,
    },
    select: { id: true },
  });

  if (!teacher) {
    throw new AuthorizationError("Professor responsável inválido.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const student = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
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
        birthDate: input.birthDate,
        goal: input.goal,
        notes: input.notes,
      },
    });
  });

  refreshPeoplePaths(student.id);
  redirect(`/students/${student.id}`);
}

export async function updateStudent(formData: FormData) {
  const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
  const input = updateStudentSchema.parse(formValues(formData));
  const student = await prisma.studentProfile.findFirst({
    where: { id: input.studentId, organizationId: viewer.organizationId },
    include: { membership: true },
  });

  if (!student || !canManageStudent(viewer, student)) {
    throw new AuthorizationError();
  }

  let primaryTeacherId = student.primaryTeacherId;
  if (input.primaryTeacherId && input.primaryTeacherId !== student.primaryTeacherId) {
    if (viewer.role !== Role.ADMIN) {
      throw new AuthorizationError("Somente administradores podem trocar o professor responsável.");
    }

    const teacher = await prisma.membership.findFirst({
      where: {
        id: input.primaryTeacherId,
        organizationId: viewer.organizationId,
        role: Role.PROFESSOR,
      },
      select: { id: true },
    });

    if (!teacher) throw new AuthorizationError("Professor responsável inválido.");
    primaryTeacherId = teacher.id;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: student.membership.userId }, data: { name: input.name } }),
    prisma.studentProfile.update({
      where: { id: student.id },
      data: {
        primaryTeacherId,
        birthDate: input.birthDate,
        goal: input.goal,
        notes: input.notes,
        status: input.status,
      },
    }),
  ]);

  refreshPeoplePaths(student.id);
  redirect(`/students/${student.id}`);
}
