"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthorizationError, requireRole } from "@/lib/auth";
import { canManageStudent } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formValues, optionalDate, optionalNumber, optionalText } from "@/lib/validation";

const assessmentSchema = z.object({
  studentId: z.string().min(1),
  assessedAt: optionalDate,
  weight: optionalNumber,
  height: optionalNumber,
  waist: optionalNumber,
  hip: optionalNumber,
  arm: optionalNumber,
  thigh: optionalNumber,
  notes: optionalText(1_500),
});

export async function createAssessment(formData: FormData) {
  const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
  const input = assessmentSchema.parse(formValues(formData));
  const student = await prisma.studentProfile.findFirst({
    where: { id: input.studentId, organizationId: viewer.organizationId },
  });

  if (!student || !canManageStudent(viewer, student)) {
    throw new AuthorizationError("Você não pode registrar avaliação para este aluno.");
  }

  await prisma.physicalAssessment.create({
    data: {
      organizationId: viewer.organizationId,
      studentId: student.id,
      recordedByMembershipId: viewer.id,
      assessedAt: input.assessedAt ?? new Date(),
      weight: input.weight,
      height: input.height,
      waist: input.waist,
      hip: input.hip,
      arm: input.arm,
      thigh: input.thigh,
      notes: input.notes,
    },
  });

  revalidatePath(`/students/${student.id}`);
  revalidatePath("/my-progress");
  revalidatePath("/my-assessments");
  redirect(`/students/${student.id}?tab=assessments`);
}
