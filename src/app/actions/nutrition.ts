"use server";

import bcrypt from "bcryptjs";
import { Role, StudentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole, AuthorizationError } from "@/lib/auth";
import { InputError } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { safeAction } from "@/lib/safe-action";
import { formValues } from "@/lib/validation";

const person = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(160).transform(v => v.toLowerCase()), password: z.string().min(10).max(72) });

export async function createNutritionist(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN);
    const input = person.parse(formValues(data));
    const passwordHash = await bcrypt.hash(input.password, 12);
    await prisma.$transaction(async tx => {
      const user = await tx.user.create({ data: { name: input.name, email: input.email, passwordHash, mustChangePassword: true } });
      await tx.membership.create({ data: { organizationId: viewer.organizationId, userId: user.id, role: Role.NUTRITIONIST } });
    });
    revalidatePath("/nutritionists");
    redirect("/nutritionists");
  });
}

export async function setNutritionistAccess(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN);
    const input = z.object({ membershipId: z.string().min(1), active: z.enum(["true", "false"]) }).parse(formValues(data));
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Membership" WHERE id = ${input.membershipId} AND "organizationId" = ${viewer.organizationId} FOR UPDATE`;
      const professional = await tx.membership.findFirst({ where: { id: input.membershipId, organizationId: viewer.organizationId, role: Role.NUTRITIONIST } });
      if (!professional) throw new AuthorizationError();
      if (input.active === "false" && await tx.studentProfile.count({ where: { organizationId: viewer.organizationId, nutritionistId: professional.id, status: StudentStatus.ACTIVE } })) throw new InputError("Remova os alunos vinculados antes de desativar este acesso.");
      await tx.membership.update({ where: { id: professional.id }, data: { active: input.active === "true" } });
      if (input.active === "false") await tx.user.update({ where: { id: professional.userId }, data: { sessionVersion: { increment: 1 } } });
    });
    revalidatePath("/nutritionists");
    return { success: "Acesso atualizado." };
  });
}

const planInput = z.object({
  studentId: z.string().min(1),
  title: z.string().trim().min(3).max(120),
  guidance: z.string().trim().min(10).max(3000),
});

export async function publishNutritionPlan(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.NUTRITIONIST);
    const input = planInput.parse(formValues(data));
    const allMeals = [1,2,3,4,5].map(n => ({ title: z.string().trim().max(80).parse(data.get(`meal${n}Title`) ?? ""), details: z.string().trim().max(800).parse(data.get(`meal${n}Details`) ?? "") }));
    const meals = allMeals.filter(meal => meal.title && meal.details);
    if (meals.length < 1) throw new InputError("Preencha pelo menos uma refeição com nome e orientação.");
    if (allMeals.some(meal => Boolean(meal.title) !== Boolean(meal.details))) throw new InputError("Cada refeição precisa de nome e orientação.");
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "StudentProfile" WHERE id = ${input.studentId} AND "organizationId" = ${viewer.organizationId} FOR UPDATE`;
      const student = await tx.studentProfile.findFirst({ where: { id: input.studentId, organizationId: viewer.organizationId, nutritionistId: viewer.id, status: StudentStatus.ACTIVE } });
      if (!student) throw new AuthorizationError("Este aluno não está vinculado ao seu acompanhamento.");
      await tx.nutritionPlan.updateMany({ where: { organizationId: viewer.organizationId, studentId: student.id, active: true }, data: { active: false } });
      await tx.nutritionPlan.create({ data: { organizationId: viewer.organizationId, studentId: student.id, nutritionistId: viewer.id, title: input.title, guidance: input.guidance, meals, active: true } });
    });
    revalidatePath("/nutrition"); revalidatePath(`/nutrition/${input.studentId}`); revalidatePath("/my-nutrition");
    redirect(`/nutrition/${input.studentId}`);
  });
}
