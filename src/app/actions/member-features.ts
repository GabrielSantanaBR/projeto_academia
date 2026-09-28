"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, AuthorizationError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeAction } from "@/lib/safe-action";
import { formValues } from "@/lib/validation";

export async function addNutritionNote(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.STUDENT, Role.PROFESSOR, Role.ADMIN);
    const input = z.object({ studentId: z.string().min(1), body: z.string().trim().min(2).max(2000) }).parse(formValues(data));
    const student = await prisma.studentProfile.findFirst({ where: { id: input.studentId, organizationId: viewer.organizationId } });
    if (!student || (viewer.role === Role.STUDENT && student.membershipId !== viewer.id)) throw new AuthorizationError();
    await prisma.nutritionNote.create({ data: { organizationId: viewer.organizationId, studentId: student.id, authorId: viewer.id, body: input.body } });
    revalidatePath("/my-nutrition");
    revalidatePath(`/students/${student.id}/nutrition`);
    return { success: "Registro adicionado." };
  });
}

export async function createSubscriptionPlan(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN);
    const input = z.object({ name: z.string().trim().min(2).max(80), price: z.coerce.number().min(0).max(100000), durationDays: z.coerce.number().int().min(1).max(730) }).parse(formValues(data));
    await prisma.subscriptionPlan.create({ data: { organizationId: viewer.organizationId, name: input.name, priceCents: Math.round(input.price * 100), durationDays: input.durationDays } });
    revalidatePath("/subscriptions");
    return { success: "Plano criado." };
  });
}

export async function assignSubscription(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN);
    const input = z.object({ studentId: z.string().min(1), planId: z.string().min(1), startsAt: z.iso.date() }).parse(formValues(data));
    const [student, plan] = await Promise.all([
      prisma.studentProfile.findFirst({ where: { id: input.studentId, organizationId: viewer.organizationId } }),
      prisma.subscriptionPlan.findFirst({ where: { id: input.planId, organizationId: viewer.organizationId, active: true } }),
    ]);
    if (!student || !plan) throw new AuthorizationError();
    const startsAt = new Date(`${input.startsAt}T12:00:00.000Z`);
    const expiresAt = new Date(startsAt.getTime() + plan.durationDays * 86400000);
    await prisma.studentSubscription.upsert({ where: { studentId: student.id }, create: { studentId: student.id, planId: plan.id, startsAt, expiresAt }, update: { planId: plan.id, startsAt, expiresAt } });
    revalidatePath("/subscriptions"); revalidatePath("/my-nutrition");
    return { success: "Assinatura registrada." };
  });
}

export async function submitExerciseVideo(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.STUDENT);
    if (!viewer.studentProfile) throw new AuthorizationError();
    const input = z.object({ exerciseName: z.string().trim().min(2).max(120), videoUrl: z.url().max(500).refine(v => v.startsWith("https://")), comment: z.string().trim().max(1000).optional() }).parse(formValues(data));
    await prisma.exerciseFeedback.create({ data: { ...input, organizationId: viewer.organizationId, studentId: viewer.studentProfile.id } });
    revalidatePath("/my-feedback");
    return { success: "Vídeo enviado para avaliação." };
  });
}

export async function replyExerciseVideo(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
    const input = z.object({ feedbackId: z.string().min(1), coachReply: z.string().trim().min(2).max(1000) }).parse(formValues(data));
    const result = await prisma.exerciseFeedback.updateMany({ where: { id: input.feedbackId, organizationId: viewer.organizationId }, data: { coachReply: input.coachReply } });
    if (!result.count) throw new AuthorizationError();
    revalidatePath("/feedback");
    return { success: "Avaliação enviada." };
  });
}

const routePoint = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), at: z.number().int().positive() });
function meters(a: z.infer<typeof routePoint>, b: z.infer<typeof routePoint>) {
  const radians = Math.PI / 180;
  const dLat = (b.lat - a.lat) * radians, dLng = (b.lng - a.lng) * radians;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(dLng / 2) ** 2;
  return 12742000 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export async function saveOutdoorRun(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.STUDENT);
    if (!viewer.studentProfile) throw new AuthorizationError();
    const route = z.array(routePoint).min(2).max(500).parse(JSON.parse(z.string().max(50000).parse(data.get("route"))));
    const now = Date.now();
    if (route[0].at < now - 12 * 3600000 || route.at(-1)!.at > now + 60000 || route.at(-1)!.at <= route[0].at) throw new Error("Trajeto inválido.");
    let distance = 0;
    for (let i = 1; i < route.length; i++) {
      const delta = (route[i].at - route[i - 1].at) / 1000;
      const segment = meters(route[i - 1], route[i]);
      if (delta < 2 || segment / delta > 12) throw new Error("Pontos de localização inconsistentes.");
      distance += segment;
    }
    await prisma.outdoorRun.create({ data: { organizationId: viewer.organizationId, studentId: viewer.studentProfile.id, startedAt: new Date(route[0].at), finishedAt: new Date(route.at(-1)!.at), distanceMeters: Math.round(distance), route } });
    revalidatePath("/my-run");
    return { success: `Corrida salva: ${(distance / 1000).toFixed(2)} km.` };
  });
}
