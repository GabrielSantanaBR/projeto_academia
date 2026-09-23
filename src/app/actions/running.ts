"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, AuthorizationError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeAction } from "@/lib/safe-action";
import { runPoint, validateRun } from "@/lib/running";

const runSchema = z.object({
  startedAt: z.string().datetime({ offset: true }).transform(value => new Date(value)),
  durationSeconds: z.coerce.number().int().positive(),
  points: z.string().max(200_000).transform(value => JSON.parse(value)).pipe(z.array(runPoint).min(2).max(2000)),
});

export async function saveRunActivity(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.STUDENT);
    const input = runSchema.parse({ startedAt: data.get("startedAt"), durationSeconds: data.get("durationSeconds"), points: data.get("points") });
    const student = await prisma.studentProfile.findFirst({ where: { membershipId: viewer.id, organizationId: viewer.organizationId, status: "ACTIVE" }, select: { id: true } });
    if (!student) throw new AuthorizationError();
    const distanceMeters = validateRun(input.points, input.durationSeconds, input.startedAt);
    await prisma.runActivity.create({ data: { organizationId: viewer.organizationId, studentId: student.id, startedAt: input.startedAt, durationSeconds: input.durationSeconds, distanceMeters, points: input.points } });
    revalidatePath("/my-runs");
    return { success: "Corrida salva. Seu trajeto é particular e não aparece na comunidade." };
  });
}

export async function deleteRunActivity(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.STUDENT);
    const id = z.string().min(1).parse(data.get("runId"));
    const removed = await prisma.runActivity.deleteMany({ where: { id, organizationId: viewer.organizationId, student: { membershipId: viewer.id } } });
    if (!removed.count) throw new AuthorizationError("Corrida não encontrada em sua conta.");
    revalidatePath("/my-runs");
    return { success: "Corrida e trajeto removidos da sua conta." };
  });
}
