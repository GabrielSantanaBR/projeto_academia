"use server";

import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentMembership, requireRole, AuthorizationError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InputError } from "@/lib/action-result";
import { safeAction } from "@/lib/safe-action";
import { formValues, optionalText } from "@/lib/validation";

const passwordSchema = z.string().min(10).max(72);

export async function changePassword(data: FormData) {
  return safeAction(async () => {
    const viewer = await getCurrentMembership({ allowTemporaryPassword: true });
    const input = z.object({ currentPassword: z.string().min(1).max(200), newPassword: passwordSchema, confirmPassword: z.string() }).parse(formValues(data));
    if (input.newPassword !== input.confirmPassword) throw new InputError("A confirmação deve ser igual à nova senha.");
    if (!(await bcrypt.compare(input.currentPassword, viewer.user.passwordHash))) throw new InputError("A senha atual não confere.");
    if (await bcrypt.compare(input.newPassword, viewer.user.passwordHash)) throw new InputError("Escolha uma senha diferente da atual.");
    await prisma.user.update({ where: { id: viewer.userId }, data: {
      passwordHash: await bcrypt.hash(input.newPassword, 12), mustChangePassword: false, sessionVersion: { increment: 1 },
    } });
    redirect("/login?passwordChanged=1");
  });
}

export async function resetMemberPassword(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN);
    const input = z.object({ membershipId: z.string().min(1), password: passwordSchema, currentPassword: z.string().min(1).max(200) }).parse(formValues(data));
    if (!(await bcrypt.compare(input.currentPassword, viewer.user.passwordHash))) throw new InputError("A senha do administrador não confere.");
    const member = await prisma.membership.findFirst({ where: { id: input.membershipId, organizationId: viewer.organizationId, role: { in: [Role.PROFESSOR, Role.STUDENT, Role.NUTRITIONIST] } }, include: { user: { include: { _count: { select: { memberships: true } } } } } });
    if (!member) throw new AuthorizationError();
    // Identity is global. An academy admin must never reset another tenant's identity.
    if (member.user._count.memberships !== 1) throw new InputError("Esta conta pertence a mais de uma academia. O próprio titular deve alterar a senha.");
    await prisma.user.update({ where: { id: member.userId }, data: { passwordHash: await bcrypt.hash(input.password, 12), mustChangePassword: true, sessionVersion: { increment: 1 } } });
    return { success: "Senha temporária definida. O titular deverá trocá-la no próximo acesso." };
  });
}

export async function updateOrganization(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole(Role.ADMIN);
    const input = z.object({
      name: z.string().trim().min(3).max(100), contactEmail: z.union([z.literal(""), z.string().trim().email().max(160)]),
      phone: optionalText(25), city: optionalText(100), primaryColor: z.enum(["#c84411", "#047857", "#1d4ed8", "#7e22ce"]),
    }).parse(formValues(data));
    await prisma.organization.update({ where: { id: viewer.organizationId }, data: {
      ...input, contactEmail: input.contactEmail || null, phone: input.phone ?? null, city: input.city ?? null,
    } });
    revalidatePath("/", "layout");
    return { success: "Dados da academia atualizados." };
  });
}
