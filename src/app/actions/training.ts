"use server";

import { Role, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthorizationError, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeAction } from "@/lib/safe-action";
import { InputError } from "@/lib/action-result";
import { lockManagedStudent } from "@/lib/locks";
import { formValues, optionalText } from "@/lib/validation";
import { cloneWorkoutDays } from "@/lib/workout-domain";
import { planExpiry, trainingPayloadSchema, type TrainingPayload } from "@/lib/training-input";

const baseSchema = z.object({ name: z.string().trim().min(3).max(120), description: optionalText(500), payload: z.string().min(2).max(100_000) });
const orderedDays = { orderBy: { sortOrder: "asc" as const }, include: { exercises: { orderBy: { sortOrder: "asc" as const } } } };

function readPayload(value: string) {
  try { return trainingPayloadSchema.parse(JSON.parse(value)); }
  catch { throw new InputError("Confira o treino: use códigos de dia diferentes, inclua exercícios e respeite as faixas de séries, metas e descanso."); }
}
function expiry(value?: string) {
  try { return planExpiry(value); } catch { throw new InputError("Informe uma validade atual ou futura."); }
}
async function checkExercises(tx: Prisma.TransactionClient, organizationId: string, payload: TrainingPayload) {
  const ids = [...new Set(payload.days.flatMap(d => d.exercises.map(e => e.exerciseId)))];
  const exercises = await tx.exercise.findMany({ where: { id: { in: ids }, OR: [{ isSystem: true, organizationId: null }, { organizationId }] }, select: { id: true, unit: true } });
  if (exercises.length !== ids.length) throw new AuthorizationError("O treino contém exercícios indisponíveis para esta academia.");
  for (const day of payload.days) for (const item of day.exercises) {
    if (exercises.find(e => e.id === item.exerciseId)?.unit === "REPS" && item.repsMax > 100) throw new InputError("Exercícios por repetição aceitam até 100 repetições. Exercícios por tempo aceitam até 600 segundos.");
  }
}
function templateDays(payload: TrainingPayload) {
  return payload.days.map((day, i) => ({ code: day.code, name: day.name, sortOrder: i + 1,
    exercises: { create: day.exercises.map((e, j) => ({ ...e, sortOrder: j + 1 })) },
  }));
}
function planDays(payload: TrainingPayload, organizationId: string) {
  return cloneWorkoutDays(payload.days.map((d, i) => ({ ...d, sortOrder: i + 1, exercises: d.exercises.map((e, j) => ({ ...e, sortOrder: j + 1 })) })), organizationId);
}
function refreshTraining(studentId?: string) {
  for (const path of ["/dashboard", "/students", "/pending", "/templates", "/my-workout"]) revalidatePath(path);
  if (studentId) revalidatePath(`/students/${studentId}`);
}

export async function createTemplate(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
    const input = baseSchema.extend({ templateId: optionalText(80), updatedAt: optionalText(40) }).parse(formValues(data));
    const payload = readPayload(input.payload);
    await prisma.$transaction(async tx => {
      await checkExercises(tx, viewer.organizationId, payload);
      if (input.templateId) {
        await tx.$queryRaw`SELECT id FROM "TrainingTemplate" WHERE id = ${input.templateId} AND "organizationId" = ${viewer.organizationId} FOR UPDATE`;
        const template = await tx.trainingTemplate.findFirst({ where: { id: input.templateId, organizationId: viewer.organizationId } });
        if (!template || (viewer.role !== Role.ADMIN && template.createdByMembershipId !== viewer.id)) throw new AuthorizationError("Apenas o autor ou a administração pode editar este modelo.");
        if (template.updatedAt.toISOString() !== input.updatedAt) throw new InputError("Este modelo foi atualizado em outra tela. Reabra o editor antes de salvar.");
        await tx.templateDay.deleteMany({ where: { templateId: template.id } });
        await tx.trainingTemplate.update({ where: { id: template.id }, data: { name: input.name, description: input.description ?? null, days: { create: templateDays(payload) } } });
      } else {
        await tx.trainingTemplate.create({ data: { organizationId: viewer.organizationId, createdByMembershipId: viewer.id, name: input.name, description: input.description, days: { create: templateDays(payload) } } });
      }
    });
    refreshTraining();
    redirect("/templates");
  });
}

export async function saveWorkoutPlan(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
    const input = baseSchema.extend({ studentId: z.string().min(1), planId: optionalText(80), validUntil: z.string().optional() }).parse(formValues(data));
    const payload = readPayload(input.payload);
    const validUntil = expiry(input.validUntil);
    await prisma.$transaction(async tx => {
      await lockManagedStudent(tx, viewer, input.studentId);
      await checkExercises(tx, viewer.organizationId, payload);
      if (input.planId) {
        const source = await tx.workoutPlan.findFirst({ where: { id: input.planId, studentId: input.studentId, organizationId: viewer.organizationId, status: "PUBLISHED" } });
        if (!source) throw new InputError("O treino atual mudou. Reabra o editor para trabalhar na versão mais recente.");
      }
      await tx.workoutPlan.updateMany({ where: { organizationId: viewer.organizationId, studentId: input.studentId, status: "PUBLISHED" }, data: { status: "ARCHIVED" } });
      // Publish a new revision: existing sessions keep their original prescription.
      await tx.workoutPlan.create({ data: { organizationId: viewer.organizationId, studentId: input.studentId, createdByMembershipId: viewer.id,
        name: input.name, description: input.description, validUntil, status: "PUBLISHED", days: { create: planDays(payload, viewer.organizationId) } } });
    });
    refreshTraining(input.studentId);
    redirect(`/students/${input.studentId}?tab=training`);
  });
}

export async function assignTemplateToStudent(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
    const input = z.object({ studentId: z.string().min(1), templateId: z.string().min(1), name: optionalText(120), validUntil: z.string().optional() }).parse(formValues(data));
    const validUntil = expiry(input.validUntil);
    await prisma.$transaction(async tx => {
      await lockManagedStudent(tx, viewer, input.studentId);
      const template = await tx.trainingTemplate.findFirst({ where: { id: input.templateId, organizationId: viewer.organizationId, active: true }, include: { days: orderedDays } });
      if (!template || !template.days.length) throw new AuthorizationError("Modelo não encontrado ou arquivado.");
      await tx.workoutPlan.updateMany({ where: { studentId: input.studentId, organizationId: viewer.organizationId, status: "PUBLISHED" }, data: { status: "ARCHIVED" } });
      await tx.workoutPlan.create({ data: { organizationId: viewer.organizationId, studentId: input.studentId, createdByMembershipId: viewer.id,
        sourceTemplateId: template.id, name: input.name || template.name, description: template.description, validUntil, status: "PUBLISHED",
        days: { create: cloneWorkoutDays(template.days, viewer.organizationId) } } });
    });
    refreshTraining(input.studentId);
    redirect(`/students/${input.studentId}?tab=training`);
  });
}

export async function duplicateWorkoutPlan(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
    const input = z.object({ planId: z.string().min(1), validUntil: z.string().optional() }).parse(formValues(data));
    const source = await prisma.workoutPlan.findFirst({ where: { id: input.planId, organizationId: viewer.organizationId }, include: { days: orderedDays } });
    if (!source) throw new AuthorizationError();
    const validUntil = expiry(input.validUntil);
    await prisma.$transaction(async tx => {
      await lockManagedStudent(tx, viewer, source.studentId);
      await tx.workoutPlan.updateMany({ where: { studentId: source.studentId, organizationId: viewer.organizationId, status: "PUBLISHED" }, data: { status: "ARCHIVED" } });
      await tx.workoutPlan.create({ data: { organizationId: viewer.organizationId, studentId: source.studentId, createdByMembershipId: viewer.id,
        sourceTemplateId: source.sourceTemplateId, name: source.name, description: source.description, validUntil, status: "PUBLISHED",
        days: { create: cloneWorkoutDays(source.days, viewer.organizationId) } } });
    });
    refreshTraining(source.studentId);
    redirect(`/students/${source.studentId}?tab=training`);
  });
}

export async function duplicateTemplate(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
    const id = z.string().min(1).parse(data.get("templateId"));
    const template = await prisma.trainingTemplate.findFirst({ where: { id, organizationId: viewer.organizationId }, include: { days: orderedDays } });
    if (!template) throw new AuthorizationError();
    const payload = trainingPayloadSchema.parse({ days: template.days });
    const copy = await prisma.trainingTemplate.create({ data: { organizationId: viewer.organizationId, createdByMembershipId: viewer.id,
      name: `${template.name.slice(0, 90)} · cópia ${crypto.randomUUID().slice(0, 6)}`, description: template.description, days: { create: templateDays(payload) } } });
    refreshTraining();
    redirect(`/templates/${copy.id}/edit`);
  });
}

export async function toggleTemplate(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
    const input = z.object({ templateId: z.string().min(1), active: z.enum(["true", "false"]) }).parse(formValues(data));
    const result = await prisma.trainingTemplate.updateMany({ where: { id: input.templateId, organizationId: viewer.organizationId,
      ...(viewer.role === Role.PROFESSOR ? { createdByMembershipId: viewer.id } : {}) }, data: { active: input.active === "true" } });
    if (!result.count) throw new AuthorizationError();
    refreshTraining();
    return { success: input.active === "true" ? "Modelo reativado." : "Modelo arquivado. Os treinos dos alunos foram preservados." };
  });
}
