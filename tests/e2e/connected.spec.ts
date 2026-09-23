import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

test("comunidade, corrida e plano nutricional funcionam com papéis separados", async ({ page }, info) => {
  const db = new PrismaClient();
  const id = randomUUID();
  const password = "ConnectedBrowser123!";
  const passwordHash = await bcrypt.hash(password, 4);
  let studentEmail = "", nutritionEmail = "";
  try {
    const organization = await db.organization.create({ data: { name: "Movimento Navegador", slug: `connected-${id}` } });
    studentEmail = `student-connected-${id}@example.com`;
    nutritionEmail = `nutrition-connected-${id}@example.com`;
    const nutritionist = await db.user.create({ data: { name: "Nutricionista Piloto", email: nutritionEmail, passwordHash, memberships: { create: { role: "NUTRITIONIST", organizationId: organization.id } } }, include: { memberships: true } });
    const student = await db.user.create({ data: { name: "Aluno Piloto", email: studentEmail, passwordHash, memberships: { create: { role: "STUDENT", organizationId: organization.id } } }, include: { memberships: true } });
    await db.studentProfile.create({ data: { organizationId: organization.id, membershipId: student.memberships[0].id, nutritionistId: nutritionist.memberships[0].id } });
  } finally { await db.$disconnect(); }

  async function signIn(email: string) {
    await page.goto("/login");
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar na plataforma" }).click();
    await expect(page).not.toHaveURL(/\/login/);
  }
  async function signOut() { await page.getByRole("button", { name: "Sair da conta" }).click(); await expect(page).toHaveURL(/\/login/); }

  await signIn(studentEmail);
  await page.goto("/community");
  await page.getByLabel("O que você gostaria de compartilhar?").fill("Minha primeira semana de treinos completos.");
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByText("Minha primeira semana de treinos completos.")).toBeVisible();
  await page.screenshot({ path: info.outputPath("comunidade.png"), fullPage: true });
  await page.goto("/my-runs");
  await expect(page.getByRole("heading", { name: "Minhas corridas" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar corrida" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("corridas.png"), fullPage: true });
  await page.goto("/my-nutrition");
  await expect(page.getByText("Ainda não há plano publicado")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await signOut();

  await signIn(nutritionEmail);
  await page.goto("/nutrition");
  await page.getByRole("link", { name: /Aluno Piloto/ }).click();
  await page.getByLabel("Título").fill("Acompanhamento do mês");
  await page.getByLabel("Orientações gerais").fill("Plano individual preparado em consulta para o aluno.");
  await page.getByLabel("Nome ou horário").first().fill("Café da manhã");
  await page.getByLabel("Orientação", { exact: true }).first().fill("Exemplo de orientação escrita pelo profissional.");
  await page.getByRole("button", { name: "Publicar para o aluno" }).click();
  await expect(page.getByText("Acompanhamento do mês")).toBeVisible();
  await signOut();

  await signIn(studentEmail);
  await page.goto("/my-nutrition");
  await expect(page.getByRole("heading", { name: "Acompanhamento do mês" })).toBeVisible();
  await expect(page.getByText("Café da manhã")).toBeVisible();
  await page.screenshot({ path: info.outputPath("nutricao.png"), fullPage: true });
  await page.goto("/nutrition");
  await expect(page).toHaveURL(/\/my-workout/);
});
