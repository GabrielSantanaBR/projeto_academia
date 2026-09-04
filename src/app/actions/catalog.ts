"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formValues, optionalText } from "@/lib/validation";

const exerciseSchema = z.object({
  name: z.string().trim().min(2).max(120),
  muscleGroup: z.string().trim().min(2).max(100),
  description: optionalText(500),
  instructions: optionalText(1_500),
  notes: optionalText(1_000),
});

export async function createExercise(formData: FormData) {
  const membership = await requireRole(Role.ADMIN, Role.PROFESSOR);
  const input = exerciseSchema.parse(formValues(formData));

  await prisma.exercise.create({
    data: {
      organizationId: membership.organizationId,
      isSystem: false,
      ...input,
    },
  });

  revalidatePath("/exercises");
  redirect("/exercises");
}
