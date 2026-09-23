import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  if (process.env.DEMO_MODE !== "true" || process.env.ALLOW_DEMO_SEED !== "true") throw new Error("Complemento demonstrativo bloqueado fora de um banco demo.");
  const organization = await prisma.organization.findUnique({ where: { slug: "movimento-academia" } });
  if (!organization || await prisma.organization.count() !== 1) throw new Error("Exige a academia demonstrativa isolada Movimento Academia.");
  const student = await prisma.studentProfile.findFirst({ where: { organizationId: organization.id, membership: { user: { email: "aluno@movimento.fit" } } } });
  const teacher = await prisma.membership.findFirst({ where: { organizationId: organization.id, user: { email: "rafael@movimento.fit" }, role: "PROFESSOR" } });
  if (!student || !teacher) throw new Error("Contas base da demonstração ausentes. Nada foi alterado.");

  let nutritionist = await prisma.membership.findFirst({ where: { organizationId: organization.id, role: "NUTRITIONIST", user: { email: "nutri@movimento.fit" } } });
  if (!nutritionist) {
    const passwordHash = await bcrypt.hash("Demo123!", 12);
    nutritionist = await prisma.$transaction(async tx => {
      const user = await tx.user.create({ data: { name: "Luísa Almeida", email: "nutri@movimento.fit", passwordHash } });
      return tx.membership.create({ data: { organizationId: organization.id, userId: user.id, role: "NUTRITIONIST" } });
    });
  }
  if (!student.nutritionistId) await prisma.studentProfile.updateMany({ where: { id: student.id, organizationId: organization.id, nutritionistId: null }, data: { nutritionistId: nutritionist.id } });
  if ((!student.nutritionistId || student.nutritionistId === nutritionist.id) && !await prisma.nutritionPlan.count({ where: { organizationId: organization.id, studentId: student.id } })) await prisma.nutritionPlan.create({ data: {
    organizationId: organization.id, studentId: student.id, nutritionistId: nutritionist.id, title: "Exemplo de acompanhamento", guidance: "Plano fictício para mostrar a organização de orientações individuais. O profissional responsável deverá elaborar e validar qualquer plano usado com um aluno real.", meals: [{ title: "Conversa inicial", details: "Registrar rotina, preferências e necessidades com o profissional antes de definir refeições." }, { title: "Ajustes do plano", details: "O acompanhamento e as mudanças são feitos pelo nutricionista vinculado." }],
  } });
  if (!await prisma.communityPost.count({ where: { organizationId: organization.id } })) {
    await prisma.communityPost.createMany({ data: [
      { organizationId: organization.id, authorId: teacher.id, body: "Bem-vindos à comunidade da Movimento! Conte uma conquista da sua semana e incentive a equipe." },
      { organizationId: organization.id, authorId: student.membershipId, body: "Concluí meu treino da semana. Um passo de cada vez!" },
    ] });
  }
  if (!await prisma.runActivity.count({ where: { organizationId: organization.id, studentId: student.id } })) {
    const startedAt = new Date(Date.now() - 3 * 86_400_000);
    await prisma.runActivity.create({ data: { organizationId: organization.id, studentId: student.id, startedAt, durationSeconds: 180, distanceMeters: 166, points: [
      { lat: -23.5871, lng: -46.6563, t: startedAt.getTime(), segment: 0 },
      { lat: -23.5866, lng: -46.6563, t: startedAt.getTime() + 60_000, segment: 0 },
      { lat: -23.5861, lng: -46.6563, t: startedAt.getTime() + 120_000, segment: 0 },
      { lat: -23.5856, lng: -46.6563, t: startedAt.getTime() + 180_000, segment: 0 },
    ] } });
  }
  // A public Sesc DF demonstration is embedded only when a learner explicitly opens it.
  await prisma.exercise.updateMany({ where: { name: "Agachamento livre", isSystem: true, videoUrl: null }, data: { videoUrl: "https://www.youtube.com/watch?v=nrM8zB5-gtE" } });
  console.log("Demonstração ampliada: nutrição, comunidade, corrida e vídeo (sem apagar cadastros)." );
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
