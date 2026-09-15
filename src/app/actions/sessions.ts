"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthorizationError, requireRole } from "@/lib/auth";
import { isPlanCurrent } from "@/lib/attention";
import { prisma } from "@/lib/prisma";
import { safeAction } from "@/lib/safe-action";
import { InputError } from "@/lib/action-result";
import { formValues } from "@/lib/validation";
import { calculateSessionDuration, normalizeSetLog } from "@/lib/workout-domain";

export async function startStudentWorkout(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.STUDENT);
    const dayId = z.string().min(1).parse(data.get("workoutDayId"));
    const sessionId = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "StudentProfile" WHERE "membershipId" = ${viewer.id} AND "organizationId" = ${viewer.organizationId} FOR UPDATE`;
      const student = await tx.studentProfile.findFirst({ where: { membershipId: viewer.id, organizationId: viewer.organizationId, status: "ACTIVE" } });
      if (!student) throw new AuthorizationError();
      const existing = await tx.workoutSession.findFirst({ where: { organizationId: viewer.organizationId, studentId: student.id, status: "IN_PROGRESS" } });
      if (existing) return existing.id;
      const day = await tx.workoutDay.findFirst({ where: { id: dayId, organizationId: viewer.organizationId, workoutPlan: { studentId: student.id, status: "PUBLISHED" } },
        include: { workoutPlan: true, exercises: { orderBy: { sortOrder: "asc" }, include: { exercise: true } } } });
      if (!day || !isPlanCurrent(day.workoutPlan.validUntil) || day.workoutPlan.validFrom > new Date() || !day.exercises.length) throw new InputError("Este treino venceu ou foi atualizado. Volte ao seu treino atual.");
      const session = await tx.workoutSession.create({ data: { organizationId: viewer.organizationId, studentId: student.id, workoutPlanId: day.workoutPlanId, workoutDayId: day.id,
        dayName: `${day.code} · ${day.name}`, exercises: { create: day.exercises.map(item => ({ workoutExerciseId: item.id, exerciseId: item.exerciseId,
          exerciseName: item.exercise.name, sortOrder: item.sortOrder, targetSets: item.sets, targetRepsMin: item.repsMin, targetRepsMax: item.repsMax,
          unit: item.exercise.unit, restSeconds: item.restSeconds, suggestedLoad: item.suggestedLoad, instructions: item.exercise.instructions, notes: item.notes,
          sets: { create: Array.from({ length: item.sets }, (_, i) => ({ setNumber: i + 1 })) },
        })) } } });
      return session.id;
    });
    revalidatePath("/my-workout");
    redirect(`/my-workout/session/${sessionId}`);
  });
}

export async function saveStudentWorkout(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.STUDENT);
    const input = z.object({ sessionId: z.string().min(1), version: z.coerce.number().int().nonnegative(), intent: z.enum(["save", "finish", "abandon"]) }).parse(formValues(data));
    const now = new Date();
    const result = await prisma.$transaction(async tx => {
      const session = await tx.workoutSession.findFirst({ where: { id: input.sessionId, organizationId: viewer.organizationId, student: { membershipId: viewer.id }, status: "IN_PROGRESS" },
        include: { exercises: { include: { sets: true } } } });
      if (!session) throw new InputError("Este treino já foi encerrado ou não está disponível para sua conta. Volte para Meu treino.");
      const claim = await tx.workoutSession.updateMany({ where: { id: session.id, version: input.version, status: "IN_PROGRESS" }, data: { version: { increment: 1 } } });
      if (!claim.count) throw new InputError("Este treino foi salvo em outra aba. Reabra a sessão antes de continuar para preservar o registro mais recente.");
      let completedSets = 0;
      if (input.intent !== "abandon") {
        for (const exercise of session.exercises) {
          let count = 0;
          for (const set of exercise.sets) {
            const values = normalizeSetLog(data.get(`load-${set.id}`), data.get(`reps-${set.id}`), exercise.unit === "SECONDS" ? 600 : 100);
            const done = data.get(`done-${set.id}`) === "on";
            if (done && (!values.reps || values.reps < 1)) throw new InputError(`Informe ${exercise.unit === "SECONDS" ? "os segundos" : "as repetições"} da série ${set.setNumber} de ${exercise.exerciseName}.`);
            if (done) { count++; completedSets++; }
            await tx.workoutSet.update({ where: { id: set.id }, data: { load: values.load, reps: values.reps, completedAt: done ? set.completedAt ?? now : null } });
          }
          await tx.workoutSessionExercise.update({ where: { id: exercise.id }, data: { completedAt: count === exercise.sets.length ? now : null } });
        }
      }
      if (input.intent === "finish" && !completedSets) throw new InputError("Registre e marque pelo menos uma série como feita antes de finalizar.");
      if (input.intent !== "save") await tx.workoutSession.update({ where: { id: session.id }, data: {
        status: input.intent === "finish" ? "COMPLETED" : "ABANDONED", completedAt: now, durationMinutes: calculateSessionDuration(session.startedAt, now),
      } });
      return { studentId: session.studentId, version: input.version + 1 };
    }, { timeout: 20_000 });
    for (const path of ["/my-workout", "/my-history", "/students", `/students/${result.studentId}`, "/dashboard", "/pending"]) revalidatePath(path);
    if (input.intent === "finish") redirect("/my-history?completed=1");
    if (input.intent === "abandon") redirect("/my-workout");
    return { success: "Progresso salvo. Você pode sair e retomar este treino.", version: result.version };
  });
}
