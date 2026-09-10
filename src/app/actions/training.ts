"use server";

import { Role, WorkoutPlanStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthorizationError, requireRole } from "@/lib/auth";
import { canManageStudent } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formValues, optionalNumber, optionalText } from "@/lib/validation";
import { cloneWorkoutDays } from "@/lib/workout-domain";

const templateDaySchema = z.object({
  code: z.string().trim().min(1).max(12),
  name: z.string().trim().min(2).max(120),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().min(1),
        sets: z.number().int().min(1).max(12),
        repsMin: z.number().int().min(1).max(100),
        repsMax: z.number().int().min(1).max(100),
        suggestedLoad: z.number().nonnegative().max(1_000).nullable().optional(),
        restSeconds: z.number().int().min(15).max(900),
        notes: z.string().trim().max(500).nullable().optional(),
      }),
    )
    .min(1)
    .max(20),
});

const templatePayloadSchema = z.object({
  days: z.array(templateDaySchema).min(1).max(7),
});

const assignTemplateSchema = z.object({
  studentId: z.string().min(1),
  templateId: z.string().min(1),
  name: optionalText(120),
  validUntil: z.string().optional(),
});

const duplicatePlanSchema = z.object({
  planId: z.string().min(1),
  validUntil: z.string().optional(),
});

function parseOptionalPlanDate(value?: string) {
  if (!value) {
    const date = new Date();
    date.setDate(date.getDate() + 42);
    return date;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("Data de validade inválida.");
  parsed.setHours(23, 59, 59, 999);
  if (parsed <= new Date()) throw new Error("A validade precisa estar no futuro.");
  return parsed;
}

async function getManagedStudent(studentId: string, viewer: Awaited<ReturnType<typeof requireRole>>) {
  const student = await prisma.studentProfile.findFirst({
    where: { id: studentId, organizationId: viewer.organizationId },
  });

  if (!student || !canManageStudent(viewer, student)) {
    throw new AuthorizationError("Você não pode administrar o treino deste aluno.");
  }

  return student;
}

function refreshTrainingPaths(studentId: string) {
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  revalidatePath("/dashboard");
  revalidatePath("/pending");
}

export async function createTemplate(formData: FormData) {
  const membership = await requireRole(Role.ADMIN, Role.PROFESSOR);
  const base = z
    .object({
      name: z.string().trim().min(3).max(120),
      description: optionalText(500),
      payload: z.string().min(2).max(50_000),
    })
    .parse(formValues(formData));

  let payload: z.infer<typeof templatePayloadSchema>;
  try {
    payload = templatePayloadSchema.parse(JSON.parse(base.payload));
  } catch {
    throw new Error("Estrutura do template inválida.");
  }

  for (const day of payload.days) {
    for (const exercise of day.exercises) {
      if (exercise.repsMin > exercise.repsMax) {
        throw new Error("A repetição mínima não pode ser maior que a máxima.");
      }
    }
  }

  const exerciseIds = [...new Set(payload.days.flatMap((day) => day.exercises.map((item) => item.exerciseId)))];
  const validExerciseCount = await prisma.exercise.count({
    where: {
      id: { in: exerciseIds },
      OR: [{ isSystem: true }, { organizationId: membership.organizationId }],
    },
  });

  if (validExerciseCount !== exerciseIds.length) {
    throw new AuthorizationError("O template contém exercícios indisponíveis para sua academia.");
  }

  await prisma.trainingTemplate.create({
    data: {
      organizationId: membership.organizationId,
      createdByMembershipId: membership.id,
      name: base.name,
      description: base.description,
      days: {
        create: payload.days.map((day, dayIndex) => ({
          code: day.code,
          name: day.name,
          sortOrder: dayIndex + 1,
          exercises: {
            create: day.exercises.map((exercise, exerciseIndex) => ({
              exerciseId: exercise.exerciseId,
              sortOrder: exerciseIndex + 1,
              sets: exercise.sets,
              repsMin: exercise.repsMin,
              repsMax: exercise.repsMax,
              suggestedLoad: exercise.suggestedLoad ?? null,
              restSeconds: exercise.restSeconds,
              notes: exercise.notes ?? null,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/templates");
  redirect("/templates");
}

export async function assignTemplateToStudent(formData: FormData) {
  const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
  const input = assignTemplateSchema.parse(formValues(formData));
  const [student, template] = await Promise.all([
    getManagedStudent(input.studentId, viewer),
    prisma.trainingTemplate.findFirst({
      where: { id: input.templateId, organizationId: viewer.organizationId, active: true },
      include: {
        days: {
          orderBy: { sortOrder: "asc" },
          include: { exercises: { orderBy: { sortOrder: "asc" } } },
        },
      },
    }),
  ]);

  if (!template || template.days.length === 0) {
    throw new AuthorizationError("Template não encontrado ou sem dias de treino.");
  }

  const validUntil = parseOptionalPlanDate(input.validUntil);

  await prisma.$transaction(async (tx) => {
    await tx.workoutPlan.updateMany({
      where: {
        organizationId: viewer.organizationId,
        studentId: student.id,
        status: WorkoutPlanStatus.PUBLISHED,
      },
      data: { status: WorkoutPlanStatus.ARCHIVED },
    });

    await tx.workoutPlan.create({
      data: {
        organizationId: viewer.organizationId,
        studentId: student.id,
        createdByMembershipId: viewer.id,
        sourceTemplateId: template.id,
        name: input.name || template.name,
        description: template.description,
        validFrom: new Date(),
        validUntil,
        status: WorkoutPlanStatus.PUBLISHED,
        days: { create: cloneWorkoutDays(template.days, viewer.organizationId) },
      },
    });
  });

  refreshTrainingPaths(student.id);
  redirect(`/students/${student.id}?tab=training`);
}

export async function duplicateWorkoutPlan(formData: FormData) {
  const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
  const input = duplicatePlanSchema.parse(formValues(formData));
  const sourcePlan = await prisma.workoutPlan.findFirst({
    where: { id: input.planId, organizationId: viewer.organizationId },
    include: {
      student: true,
      days: {
        orderBy: { sortOrder: "asc" },
        include: { exercises: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!sourcePlan || !canManageStudent(viewer, sourcePlan.student)) {
    throw new AuthorizationError("Treino não encontrado ou indisponível.");
  }

  const validUntil = parseOptionalPlanDate(input.validUntil);

  await prisma.$transaction(async (tx) => {
    await tx.workoutPlan.updateMany({
      where: {
        organizationId: viewer.organizationId,
        studentId: sourcePlan.studentId,
        status: WorkoutPlanStatus.PUBLISHED,
      },
      data: { status: WorkoutPlanStatus.ARCHIVED },
    });

    await tx.workoutPlan.create({
      data: {
        organizationId: viewer.organizationId,
        studentId: sourcePlan.studentId,
        createdByMembershipId: viewer.id,
        sourceTemplateId: sourcePlan.sourceTemplateId,
        name: `${sourcePlan.name} (cópia)`,
        description: sourcePlan.description,
        validFrom: new Date(),
        validUntil,
        status: WorkoutPlanStatus.PUBLISHED,
        days: { create: cloneWorkoutDays(sourcePlan.days, viewer.organizationId) },
      },
    });
  });

  refreshTrainingPaths(sourcePlan.studentId);
  redirect(`/students/${sourcePlan.studentId}?tab=training`);
}

const quickExerciseSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().trim().min(3).max(120),
  exerciseId: z.string().min(1),
  sets: z.coerce.number().int().min(1).max(12),
  repsMin: z.coerce.number().int().min(1).max(100),
  repsMax: z.coerce.number().int().min(1).max(100),
  suggestedLoad: optionalNumber,
});

export async function createQuickWorkout(formData: FormData) {
  const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
  const input = quickExerciseSchema.parse(formValues(formData));
  const student = await getManagedStudent(input.studentId, viewer);

  if (input.repsMin > input.repsMax) throw new Error("Faixa de repetições inválida.");

  const exercise = await prisma.exercise.findFirst({
    where: {
      id: input.exerciseId,
      OR: [{ isSystem: true }, { organizationId: viewer.organizationId }],
    },
    select: { id: true },
  });

  if (!exercise) throw new AuthorizationError("Exercício não encontrado.");

  const validUntil = parseOptionalPlanDate();
  await prisma.$transaction(async (tx) => {
    await tx.workoutPlan.updateMany({
      where: { organizationId: viewer.organizationId, studentId: student.id, status: WorkoutPlanStatus.PUBLISHED },
      data: { status: WorkoutPlanStatus.ARCHIVED },
    });

    await tx.workoutPlan.create({
      data: {
        organizationId: viewer.organizationId,
        studentId: student.id,
        createdByMembershipId: viewer.id,
        name: input.name,
        description: "Treino rápido criado manualmente.",
        validUntil,
        status: WorkoutPlanStatus.PUBLISHED,
        days: {
          create: {
            organizationId: viewer.organizationId,
            code: "A",
            name: input.name,
            sortOrder: 1,
            exercises: {
              create: {
                organizationId: viewer.organizationId,
                exerciseId: exercise.id,
                sortOrder: 1,
                sets: input.sets,
                repsMin: input.repsMin,
                repsMax: input.repsMax,
                suggestedLoad: input.suggestedLoad,
                restSeconds: 75,
              },
            },
          },
        },
      },
    });
  });

  refreshTrainingPaths(student.id);
  redirect(`/students/${student.id}?tab=training`);
}
