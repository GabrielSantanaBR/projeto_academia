"use server";

import { Role, WorkoutSessionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthorizationError, requireRole } from "@/lib/auth";
import { isPlanCurrent } from "@/lib/attention";
import { prisma } from "@/lib/prisma";
import { formValues } from "@/lib/validation";
import { calculateSessionDuration, normalizeSetLog } from "@/lib/workout-domain";

const startSchema = z.object({ workoutDayId: z.string().min(1) });
const finishSchema = z.object({ sessionId: z.string().min(1) });

export async function startStudentWorkout(formData: FormData) {
  const membership = await requireRole(Role.STUDENT);
  const input = startSchema.parse(formValues(formData));
  const student = await prisma.studentProfile.findFirst({
    where: { membershipId: membership.id, organizationId: membership.organizationId },
    select: { id: true },
  });

  if (!student) throw new AuthorizationError("Perfil de aluno não encontrado.");

  const existingSession = await prisma.workoutSession.findFirst({
    where: {
      organizationId: membership.organizationId,
      studentId: student.id,
      status: WorkoutSessionStatus.IN_PROGRESS,
    },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });

  if (existingSession) redirect(`/my-workout/session/${existingSession.id}`);

  const day = await prisma.workoutDay.findFirst({
    where: {
      id: input.workoutDayId,
      organizationId: membership.organizationId,
      workoutPlan: { studentId: student.id },
    },
    include: {
      workoutPlan: true,
      exercises: {
        orderBy: { sortOrder: "asc" },
        include: { exercise: true },
      },
    },
  });

  if (
    !day ||
    day.workoutPlan.status !== "PUBLISHED" ||
    !isPlanCurrent(day.workoutPlan.validUntil) ||
    day.exercises.length === 0
  ) {
    throw new AuthorizationError("Este treino não está disponível para iniciar.");
  }

  const session = await prisma.workoutSession.create({
    data: {
      organizationId: membership.organizationId,
      studentId: student.id,
      workoutPlanId: day.workoutPlanId,
      workoutDayId: day.id,
      dayName: `${day.code} · ${day.name}`,
      exercises: {
        create: day.exercises.map((exercise) => ({
          workoutExerciseId: exercise.id,
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exercise.name,
          sortOrder: exercise.sortOrder,
          targetSets: exercise.sets,
          targetRepsMin: exercise.repsMin,
          targetRepsMax: exercise.repsMax,
          sets: {
            create: Array.from({ length: exercise.sets }, (_, index) => ({
              setNumber: index + 1,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/my-workout");
  redirect(`/my-workout/session/${session.id}`);
}

export async function finishStudentWorkout(formData: FormData) {
  const membership = await requireRole(Role.STUDENT);
  const input = finishSchema.parse(formValues(formData));
  const session = await prisma.workoutSession.findFirst({
    where: {
      id: input.sessionId,
      organizationId: membership.organizationId,
      status: WorkoutSessionStatus.IN_PROGRESS,
      student: { membershipId: membership.id },
    },
    include: {
      exercises: {
        orderBy: { sortOrder: "asc" },
        include: { sets: { orderBy: { setNumber: "asc" } } },
      },
    },
  });

  if (!session) {
    throw new AuthorizationError("Sessão não encontrada ou já finalizada.");
  }

  const completedAt = new Date();

  await prisma.$transaction(async (tx) => {
    for (const exercise of session.exercises) {
      const markedComplete = formData.get(`completed-${exercise.id}`) === "on";
      let hasRecordedSet = false;

      for (const set of exercise.sets) {
        const loggedSet = normalizeSetLog(
          formData.get(`load-${exercise.id}-${set.setNumber}`),
          formData.get(`reps-${exercise.id}-${set.setNumber}`),
        );
        hasRecordedSet ||= loggedSet.hasRecord;

        await tx.workoutSet.update({
          where: { id: set.id },
          data: {
            load: loggedSet.load,
            reps: loggedSet.reps,
            completedAt: loggedSet.hasRecord ? completedAt : null,
          },
        });
      }

      await tx.workoutSessionExercise.update({
        where: { id: exercise.id },
        data: { completedAt: markedComplete || hasRecordedSet ? completedAt : null },
      });
    }

    await tx.workoutSession.update({
      where: { id: session.id },
      data: {
        status: WorkoutSessionStatus.COMPLETED,
        completedAt,
        durationMinutes: calculateSessionDuration(session.startedAt, completedAt),
      },
    });
  });

  revalidatePath("/my-workout");
  revalidatePath("/my-history");
  revalidatePath("/students");
  revalidatePath(`/students/${session.studentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/pending");
  redirect("/my-history?completed=1");
}
