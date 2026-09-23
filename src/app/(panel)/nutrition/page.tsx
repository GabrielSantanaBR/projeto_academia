import Link from "next/link";
import { Role } from "@prisma/client";
import { PageHeader, EmptyState } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Acompanhamento nutricional" };
export default async function NutritionPage() {
  const viewer = await requireRole(Role.NUTRITIONIST);
  const students = await prisma.studentProfile.findMany({ where: { organizationId: viewer.organizationId, nutritionistId: viewer.id, status: "ACTIVE" }, include: { membership: { include: { user: true } }, nutritionPlans: { where: { active: true }, select: { createdAt: true, title: true }, take: 1 } }, orderBy: { membership: { user: { name: "asc" } } } });
  return <div className="space-y-8"><PageHeader eyebrow="Atendimento profissional" title="Nutrição" description="Alunos vinculados a você. As orientações são individuais e ficam disponíveis apenas neste acompanhamento e na conta do aluno." />
    {!students.length ? <EmptyState title="Nenhum aluno vinculado" description="A administração vincula seus alunos em Editar cadastro, na área Alunos." /> : <section className="divide-y divide-[#dfe3e6] border-y border-[#dfe3e6] bg-white">{students.map(student => <Link href={`/nutrition/${student.id}`} key={student.id} className="flex items-center justify-between gap-4 px-5 py-5 transition hover:bg-[#f4f7fa]"><div><h2 className="font-bold">{student.membership.user.name}</h2><p className="mt-1 text-sm text-[#64707d]">{student.nutritionPlans[0]?.title ?? "Aguardando primeira orientação"}</p></div><span aria-hidden className="text-xl text-[var(--accent)]">↗</span></Link>)}</section>}
  </div>;
}
