import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

export default async function setup() {
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash("AdminBrowser123!", 4);
    const accounts: Record<string, { admin: string; teacher: string; student: string }> = {};
    for (const project of ["desktop", "mobile"]) {
      const id = randomUUID();
      const org = await prisma.organization.create({ data: { name: "Academia Piloto", slug: `browser-${id}` } });
      accounts[project] = { admin: `admin-${id}@example.com`, teacher: `teacher-${id}@example.com`, student: `student-${id}@example.com` };
      await prisma.user.create({ data: { name: "Admin Piloto", email: accounts[project].admin, passwordHash, memberships: { create: { organizationId: org.id, role: "ADMIN" } } } });
      await prisma.exercise.create({ data: { organizationId: org.id, name: "Agachamento", muscleGroup: "Pernas", instructions: "Siga a orientação do professor." } });
    }
    await mkdir(".e2e", { recursive: true });
    await writeFile(".e2e/accounts.json", JSON.stringify(accounts));
  } finally { await prisma.$disconnect(); }
}
