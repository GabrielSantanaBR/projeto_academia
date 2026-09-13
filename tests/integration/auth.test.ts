import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import type { CredentialsConfig } from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";

const state = vi.hoisted(() => ({ session: null as unknown }));
vi.mock("next-auth", () => ({ getServerSession: async () => state.session }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); },
  unstable_rethrow: (error: unknown) => { if (error instanceof Error && error.message.startsWith("REDIRECT:")) throw error; },
}));

import { authOptions, getCurrentMembership, requireRole } from "@/lib/auth";
import { changePassword, resetMemberPassword } from "@/app/actions/account";
import { prisma } from "@/lib/prisma";

const email = `auth-${randomUUID()}@example.com`;
const password = "InitialTest123!";
const key = createHash("sha256").update(email).digest("hex");
let userId: string, membershipId: string, organizationId: string;
const data = (values: Record<string, string>) => { const form = new FormData(); Object.entries(values).forEach(([key, value]) => form.set(key, value)); return form; };
async function login(address = email, secret = password) {
  const authorize = (authOptions.providers[0] as CredentialsConfig).options?.authorize;
  if (!authorize) throw new Error("Credentials provider is missing its authorize callback");
  return authorize({ email: address, password: secret }, {} as never);
}
function session(version = 0) {
  state.session = { user: { id: userId, organizationId, role: "ADMIN", sessionVersion: version } };
}

beforeAll(async () => {
  const org = await prisma.organization.create({ data: { name: "Auth Test", slug: `auth-${randomUUID()}` } });
  organizationId = org.id;
  const user = await prisma.user.create({ data: { name: "Auth Admin", email, passwordHash: await bcrypt.hash(password, 4) } });
  userId = user.id;
  const membership = await prisma.membership.create({ data: { organizationId, userId, role: "ADMIN" } });
  membershipId = membership.id;
});
afterAll(() => prisma.$disconnect());

describe("authentication with real persisted credentials", () => {
  it("normalizes email, checks passwords and clears successful login attempts", async () => {
    expect(await login(email, "WrongPassword123!")).toBeNull();
    expect((await prisma.loginThrottle.findUniqueOrThrow({ where: { key } })).attempts).toBe(1);
    expect(await login(`  ${email.toUpperCase()}  `)).toMatchObject({ id: userId, organizationId, role: "ADMIN", sessionVersion: 0 });
    expect(await prisma.loginThrottle.findUnique({ where: { key } })).toBeNull();
  });
  it("blocks excessive attempts and permits login after the window expires", async () => {
    await prisma.loginThrottle.create({ data: { key, attempts: 10, expiresAt: new Date(Date.now() + 60_000) } });
    expect(await login()).toBeNull();
    await prisma.loginThrottle.update({ where: { key }, data: { expiresAt: new Date(Date.now() - 1_000) } });
    expect(await login()).toMatchObject({ id: userId });
  });
  it("rechecks live membership and role instead of trusting old token claims", async () => {
    session();
    expect((await getCurrentMembership()).id).toBe(membershipId);
    await prisma.membership.update({ where: { id: membershipId }, data: { role: "PROFESSOR" } });
    await expect(requireRole("ADMIN")).rejects.toThrow("permissão");
    await prisma.membership.update({ where: { id: membershipId }, data: { active: false } });
    await expect(getCurrentMembership()).rejects.toThrow("Vínculo");
    expect(await login()).toBeNull();
    await prisma.membership.update({ where: { id: membershipId }, data: { active: true, role: "ADMIN" } });
  });
  it("forces a temporary password change and invalidates previously issued sessions", async () => {
    session();
    await prisma.user.update({ where: { id: userId }, data: { mustChangePassword: true } });
    await expect(getCurrentMembership()).rejects.toThrow("REDIRECT:/account");
    expect((await getCurrentMembership({ allowTemporaryPassword: true })).id).toBe(membershipId);
    expect((await changePassword(data({ currentPassword: "WrongPassword123!", newPassword: "UpdatedTest456!", confirmPassword: "UpdatedTest456!" }))).error).toContain("não confere");
    await expect(changePassword(data({ currentPassword: password, newPassword: "UpdatedTest456!", confirmPassword: "UpdatedTest456!" }))).rejects.toThrow("REDIRECT:/login?passwordChanged=1");
    await expect(getCurrentMembership()).rejects.toThrow("Vínculo");
    expect(await login()).toBeNull();
    expect(await login(email, "UpdatedTest456!")).toMatchObject({ sessionVersion: 1 });
    session(1);
    expect((await getCurrentMembership()).user.mustChangePassword).toBe(false);
  });
  it("refuses an academy administrator resetting an identity shared by another academy", async () => {
    session(1);
    const other = await prisma.organization.create({ data: { name: "Other academy", slug: `other-${randomUUID()}` } });
    const shared = await prisma.user.create({ data: { name: "Shared identity", email: `shared-${randomUUID()}@example.com`, passwordHash: await bcrypt.hash(password, 4) } });
    const target = await prisma.membership.create({ data: { userId: shared.id, organizationId, role: "PROFESSOR" } });
    await prisma.membership.create({ data: { userId: shared.id, organizationId: other.id, role: "PROFESSOR" } });
    const result = await resetMemberPassword(data({ membershipId: target.id, currentPassword: "UpdatedTest456!", password: "Temporary789!" }));
    expect(result.error).toContain("mais de uma academia");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: shared.id } })).passwordHash).toBe(shared.passwordHash);
  });
});
