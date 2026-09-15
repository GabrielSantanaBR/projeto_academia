import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../src/lib/prisma';
const schema = z.object({ name: z.string().trim().min(3).max(100), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80), adminName: z.string().trim().min(2).max(120), email: z.string().trim().email().max(160).transform(v => v.toLowerCase()), password: z.string().min(12).max(72) });
async function main() {
  const input = schema.parse({ name: process.env.ACADEMY_NAME, slug: process.env.ACADEMY_SLUG, adminName: process.env.ADMIN_NAME, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  const exists = await prisma.organization.findUnique({ where: { slug: input.slug } });
  if (exists) throw new Error('Esta academia já existe. Nenhum dado foi alterado.');
  if (await prisma.user.findUnique({ where: { email: input.email } })) throw new Error('Este e-mail já está cadastrado. Nenhuma credencial será substituída.');
  const passwordHash = await bcrypt.hash(input.password, 12);
  await prisma.$transaction(async tx => {
    const org = await tx.organization.create({ data: { name: input.name, slug: input.slug, contactEmail: input.email } });
    await tx.user.create({ data: { name: input.adminName, email: input.email, passwordHash, mustChangePassword: true, memberships: { create: { organizationId: org.id, role: 'ADMIN' } } } });
    const catalog = [ ['Agachamento livre','Pernas'], ['Leg press','Pernas'], ['Cadeira extensora','Pernas'], ['Mesa flexora','Pernas'], ['Supino reto','Peitoral'], ['Supino inclinado','Peitoral'], ['Puxada alta','Costas'], ['Remada baixa','Costas'], ['Desenvolvimento com halteres','Ombros'], ['Elevação lateral','Ombros'], ['Rosca direta','Bíceps'], ['Tríceps na polia','Tríceps'], ['Panturrilha em pé','Panturrilhas'], ['Prancha','Core'] ];
    await tx.exercise.createMany({ data: catalog.map(([name,muscleGroup]) => ({ organizationId: org.id, name, muscleGroup, isSystem: false, unit: name === 'Prancha' ? 'SECONDS' : 'REPS' })) });
  });
  console.log('Academia, administrador e catálogo inicial criados. O administrador deve trocar a senha no primeiro acesso.');
}
main().catch(error => { console.error(error instanceof z.ZodError ? 'Confira ACADEMY_NAME, ACADEMY_SLUG, ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD (12–72 caracteres).' : error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
