import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar na plataforma" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
async function firstAccess(page: Page, email: string) {
  await login(page, email, "TemporaryBrowser123!");
  await expect(page).toHaveURL(/\/account$/);
  await page.getByLabel("Senha atual", { exact: true }).fill("TemporaryBrowser123!");
  await page.getByLabel("Nova senha", { exact: true }).fill("PersonalBrowser456!");
  await page.getByLabel("Confirme a nova senha", { exact: true }).fill("PersonalBrowser456!");
  await page.getByRole("button", { name: "Salvar senha e entrar novamente" }).click();
  await expect(page).toHaveURL(/passwordChanged=1/);
  await login(page, email, "PersonalBrowser456!");
}
async function logout(page: Page) {
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/\/login/);
}
async function fitsViewport(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test("administra a academia e completa o ciclo real de professor e aluno", async ({ page }, info) => {
  const accounts = JSON.parse(await readFile(".e2e/accounts.json", "utf8"))[info.project.name];
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/login");
  await expect(page.getByText("Demo123!")).toHaveCount(0);
  await login(page, accounts.admin, "AdminBrowser123!");
  await expect(page.getByRole("heading", { name: "Visão geral", exact: true })).toBeVisible();
  await fitsViewport(page);

  await page.goto("/teachers/new");
  await page.getByLabel("Nome completo").fill("Professor Piloto");
  await page.getByLabel("E-mail de acesso").fill(accounts.teacher);
  await page.getByLabel("Senha inicial").fill("TemporaryBrowser123!");
  await page.getByRole("button", { name: "Criar professor", exact: true }).click();
  await expect(page).toHaveURL(/\/teachers$/);

  await page.goto("/students/new");
  await page.getByLabel("Nome completo").fill("Aluno Piloto");
  await page.getByLabel("E-mail de acesso").fill(accounts.student);
  await page.getByLabel("Senha inicial").fill("TemporaryBrowser123!");
  await page.getByLabel("Professor responsável").selectOption({ label: "Professor Piloto" });
  await page.getByRole("button", { name: "Criar aluno", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Aluno Piloto", exact: true })).toBeVisible();
  const studentPath = new URL(page.url()).pathname;

  await page.goto("/subscriptions");
  await page.getByRole("heading", { name: "Planos e assinaturas" }).waitFor();
  await page.getByLabel("Nome", { exact: true }).fill("Mensal piloto");
  await page.getByLabel("Preço (R$)").fill("99.90");
  await page.getByRole("button", { name: "Criar plano" }).click();
  await expect(page.getByText("Plano criado.")).toBeVisible();
  await page.getByLabel("Aluno", { exact: true }).selectOption({ label: "Aluno Piloto" });
  const planId = await page.getByLabel("Plano", { exact: true }).locator("option", { hasText: "Mensal piloto" }).getAttribute("value");
  expect(planId).not.toBeNull();
  await page.getByLabel("Plano", { exact: true }).selectOption(planId!);
  await page.getByRole("button", { name: "Salvar assinatura" }).click();
  await expect(page.getByText("Assinatura registrada.")).toBeVisible();

  await page.goto("/settings");
  await page.getByLabel("Nome da academia").fill("Academia Movimento Piloto");
  await page.getByLabel("Cidade", { exact: true }).fill("São Paulo");
  await page.getByLabel("Azul", { exact: true }).check();
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(page.getByText("Dados da academia atualizados.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Cidade", { exact: true })).toHaveValue("São Paulo");
  await expect(page.getByLabel("Azul", { exact: true })).toBeChecked();
  const csv = await page.request.get("/api/exports/students");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("Aluno Piloto");
  await fitsViewport(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("academia.png"), fullPage: true });
  await logout(page);

  await firstAccess(page, accounts.teacher);
  await page.goto(`${studentPath}/nutrition`);
  await page.getByLabel("Novo registro").fill("Vamos acompanhar a rotina das refeições na próxima avaliação.");
  await page.getByRole("button", { name: "Publicar registro" }).click();
  await expect(page.getByText("Registro adicionado.")).toBeVisible();
  await page.goto("/templates/new");
  await page.getByLabel("Nome do modelo", { exact: true }).fill("Modelo Piloto");
  await page.getByLabel("Nome do dia", { exact: true }).fill("Corpo inteiro");
  await page.getByLabel("Séries", { exact: true }).fill("2");
  await page.getByLabel("Orientação para o aluno", { exact: true }).fill("Movimento controlado");
  await fitsViewport(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("editor.png"), fullPage: true });
  await page.getByRole("button", { name: "Salvar modelo", exact: true }).click();
  await expect(page).toHaveURL(/\/templates$/);
  await page.goto(`${studentPath}?tab=training`);
  await page.locator('select[name="templateId"]').selectOption({ label: "Modelo Piloto" });
  await page.getByRole("button", { name: "Publicar treino", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Modelo Piloto", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Editar treino", exact: true }).click();
  // The previous screen also has a "Nome do treino" field. Wait for the editor.
  await expect(page).toHaveURL(/\/workout\/edit$/);
  await expect(page.getByRole("heading", { name: "Editar treino", exact: true })).toBeVisible();
  await page.getByLabel("Nome do treino", { exact: true }).fill("Ciclo personalizado");
  await page.getByRole("button", { name: "Publicar treino para o aluno", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ciclo personalizado", exact: true })).toBeVisible();
  expect((await page.request.get("/api/exports/students")).status()).toBe(403);
  await logout(page);

  await firstAccess(page, accounts.student);
  await expect(page).toHaveURL(/\/my-workout$/);
  await page.goto("/my-nutrition");
  await expect(page.getByText("Mensal piloto", { exact: false })).toBeVisible();
  await expect(page.getByText("Vamos acompanhar a rotina das refeições", { exact: false })).toBeVisible();
  await page.goto("/my-feedback");
  await page.getByLabel("Exercício").fill("Agachamento");
  await page.getByLabel("Link do vídeo (HTTPS)").fill("https://example.com/video-de-demonstracao");
  await page.getByRole("button", { name: "Enviar para avaliação" }).click();
  await expect(page.getByText("Vídeo enviado para avaliação.")).toBeVisible();
  await page.goto("/my-run");
  await expect(page.getByRole("button", { name: "Iniciar corrida" })).toBeVisible();
  await fitsViewport(page);
  await page.goto("/my-workout");
  await page.getByRole("button", { name: "Iniciar", exact: true }).click();
  await expect(page).toHaveURL(/\/my-workout\/session\//);
  const load = page.getByRole("spinbutton", { name: "Agachamento, série 1, carga em kg", exact: true });
  const reps = page.getByRole("spinbutton", { name: "Agachamento, série 1, repetições", exact: true });
  await load.fill("20");
  await reps.fill("10");
  await page.getByRole("checkbox", { name: "Série 1 de Agachamento feita", exact: true }).check();
  await page.getByRole("button", { name: "Salvar progresso", exact: true }).click();
  await expect(page.getByText("Progresso salvo.", { exact: false })).toBeVisible();
  await page.reload();
  await expect(load).toHaveValue("20");
  await expect(reps).toHaveValue("10");
  await expect(page.getByRole("checkbox", { name: "Série 1 de Agachamento feita", exact: true })).toBeChecked();
  await fitsViewport(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("treino.png"), fullPage: true });
  await page.getByRole("button", { name: "Finalizar", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar finalização", exact: true }).click();
  await expect(page).toHaveURL(/\/my-history/);
  await page.locator("summary").first().click();
  await expect(page.getByText("Não realizada", { exact: true })).toBeVisible();
  await expect(page.getByText(/20 kg × 10/)).toBeVisible();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/my-workout/);
  expect((await page.request.get("/api/exports/students")).status()).toBe(403);
  await logout(page);
  expect(errors).toEqual([]);
});
