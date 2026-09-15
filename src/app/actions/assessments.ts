"use server";

import { safeAction } from "@/lib/safe-action";
import { InputError } from "@/lib/action-result";

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
  weight: optionalNumber.refine(v => v === undefined || (v > 0 && v <= 500)),
  height: optionalNumber.refine(v => v === undefined || (v > 0 && v <= 3)),
  waist: optionalNumber.refine(v => v === undefined || (v > 0 && v <= 300)),
  hip: optionalNumber.refine(v => v === undefined || (v > 0 && v <= 300)),
  arm: optionalNumber.refine(v => v === undefined || (v > 0 && v <= 200)),
  thigh: optionalNumber.refine(v => v === undefined || (v > 0 && v <= 300)),
  notes: optionalText(1_500),
});

export async function createAssessment(formData: FormData) {
  return safeAction(async () => {
  const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
  const input = assessmentSchema.parse(formValues(formData));
  if (![input.weight, input.height, input.waist, input.hip, input.arm, input.thigh].some(v => v !== undefined)) throw new InputError("Informe pelo menos uma medida para registrar a avaliação.");
  if (input.assessedAt && input.assessedAt.toISOString().slice(0,10) > new Date().toISOString().slice(0,10)) throw new InputError("A data da avaliação não pode estar no futuro.");
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

  });
}
