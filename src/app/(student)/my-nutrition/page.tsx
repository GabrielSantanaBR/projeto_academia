import { Role } from "@prisma/client";
import { PageHeader, EmptyState } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nutritionMeals } from "@/lib/nutrition";

export const metadata = { title: "Minha nutrição" };
export default async function MyNutritionPage() {
  const viewer = await requireRole(Role.STUDENT);
  const student = await prisma.studentProfile.findFirst({ where: { organizationId: viewer.organizationId, membershipId: viewer.id }, include: { nutritionist: { include: { user: true } } } });
  if (!student) return null;
  const plan = student.nutritionistId ? await prisma.nutritionPlan.findFirst({ where: { organizationId: viewer.organizationId, studentId: student.id, nutritionistId: student.nutritionistId, active: true }, orderBy: { createdAt: "desc" } }) : null;
  return <div className="space-y-7"><PageHeader eyebrow="Seu cuidado" title="Minha nutrição" description={student.nutritionist ? `Acompanhamento com ${student.nutritionist.user.name}.` : "Sua academia ainda não vinculou um nutricionista ao seu perfil."} />
    {!plan || !student.nutritionist ? <EmptyState title="Ainda não há plano publicado" description="Quando o nutricionista vinculado preparar orientações para você, elas aparecerão aqui." /> : <><header className="bg-[#172b46] p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-[#ffbc94]">Orientação atual</p><h2 className="mt-3 text-2xl font-bold">{plan.title}</h2><p className="mt-2 text-sm text-slate-300">Publicado em {plan.createdAt.toLocaleDateString("pt-BR")}</p></header><section className="border-l-4 border-[var(--accent)] bg-white p-5"><h3 className="font-bold">Orientações gerais</h3><p className="mt-2 whitespace-pre-line leading-7 text-[#465568]">{plan.guidance}</p></section><section className="space-y-3"><h3 className="text-lg font-bold">Sua rotina alimentar</h3>{nutritionMeals(plan.meals).map((meal,i) => <article key={i} className="border-b border-[#dfe3e6] bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">{String(i+1).padStart(2,"0")} / refeição</p><h4 className="mt-2 text-lg font-bold">{meal.title}</h4><p className="mt-2 whitespace-pre-line leading-7 text-[#465568]">{meal.details}</p></article>)}</section><p className="text-xs text-[#64707d]">Orientações individuais do profissional. Se precisar ajustar seu plano, converse com ele.</p></>}
  </div>;
}
