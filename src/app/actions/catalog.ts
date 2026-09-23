"use server";

import { safeAction } from "@/lib/safe-action";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthorizationError, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formValues, optionalText } from "@/lib/validation";
import { videoEmbedUrl } from "@/lib/video";

const exerciseSchema = z.object({
  name: z.string().trim().min(2).max(120),
  unit: z.enum(["REPS", "SECONDS"]).default("REPS"),
  muscleGroup: z.string().trim().min(2).max(100),
  description: optionalText(500),
  instructions: optionalText(1_500),
  notes: optionalText(1_000),
  videoUrl: optionalText(300).refine(url => !url || Boolean(videoEmbedUrl(url)), "Use um link HTTPS do YouTube ou Vimeo."),
});

export async function createExercise(formData: FormData) {
  return safeAction(async () => {
  const membership = await requireRole(Role.ADMIN, Role.PROFESSOR);
  const input = exerciseSchema.parse(formValues(formData));

  await prisma.exercise.create({
    data: {
      organizationId: membership.organizationId,
      isSystem: false,
      ...input,
      videoUrl: input.videoUrl ?? null,
    },
  });

  revalidatePath("/exercises");
  redirect("/exercises");

  });
}

export async function updateExercise(formData: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
    const input = exerciseSchema.extend({ exerciseId: z.string().min(1) }).parse(formValues(formData));
    const { exerciseId, unit, ...fields } = input;
    const existing = await prisma.exercise.findFirst({ where: { id: exerciseId, organizationId: viewer.organizationId, isSystem: false } });
    if (!existing || existing.unit !== unit) throw new AuthorizationError("A medida de um exercício não pode ser alterada. Cadastre um novo exercício.");
    const result = await prisma.exercise.updateMany({ where: { id: exerciseId, organizationId: viewer.organizationId, isSystem: false }, data: { ...fields, videoUrl: fields.videoUrl ?? null, description: fields.description ?? null, instructions: fields.instructions ?? null, notes: fields.notes ?? null } });
    if (!result.count) throw new AuthorizationError("Este exercício não pode ser alterado pela sua academia.");
    revalidatePath("/exercises"); revalidatePath("/templates"); revalidatePath("/my-workout");
    redirect("/exercises");
  });
}
