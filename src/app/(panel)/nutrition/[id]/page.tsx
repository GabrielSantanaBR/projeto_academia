import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { publishNutritionPlan } from "@/app/actions/nutrition";
import { ActionForm } from "@/components/action-form";
import { PageHeader, inputClassName, labelClassName } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nutritionMeals } from "@/lib/nutrition";

export const metadata = { title: "Plano alimentar" };
export default async function NutritionStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireRole(Role.NUTRITIONIST);
  const { id } = await params;
  const student = await prisma.studentProfile.findFirst({ where: { id, organizationId: viewer.organizationId, nutritionistId: viewer.id, status: "ACTIVE" }, include: { membership: { include: { user: true } }, nutritionPlans: { where: { nutritionistId: viewer.id }, orderBy: { createdAt: "desc" }, take: 5 } } });
  if (!student) notFound();
  const current = student.nutritionPlans.find(p => p.active);
  return <div className="space-y-7"><Link href="/nutrition" className="text-sm font-semibold text-[var(--accent)]">← Meus alunos</Link><PageHeader eyebrow="Orientação particular" title={student.membership.user.name} description="Publique um plano individual; o plano anterior permanece no histórico. Apenas você e este aluno podem abrir o conteúdo." />
    {current && <article className="border-l-4 border-[var(--accent)] bg-white p-6"><p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Plano atual</p><h2 className="mt-2 text-xl font-bold">{current.title}</h2><p className="mt-2 whitespace-pre-line text-sm text-[#465568]">{current.guidance}</p><ul className="mt-5 divide-y divide-[#dfe3e6]">{nutritionMeals(current.meals).map((meal,i) => <li key={i} className="py-3"><strong>{meal.title}</strong><p className="whitespace-pre-line text-sm text-[#64707d]">{meal.details}</p></li>)}</ul></article>}
    <ActionForm action={publishNutritionPlan} className="space-y-5 border border-[#dfe3e6] bg-white p-6"><input type="hidden" name="studentId" value={student.id} /><h2 className="text-lg font-bold">{current ? "Nova versão do plano" : "Criar orientação"}</h2><label className={labelClassName}>Título<input name="title" minLength={3} maxLength={120} required className={inputClassName} placeholder="Ex.: Rotina de alimentação da semana" /></label><label className={labelClassName}>Orientações gerais<textarea name="guidance" rows={5} minLength={10} maxLength={3000} required className={inputClassName} placeholder="Anotações personalizadas pelo profissional" /></label><div className="grid gap-4 sm:grid-cols-2">{[1,2,3,4,5].map(n => <div key={n} className="space-y-3 border-t border-[#dfe3e6] pt-4"><h3 className="text-sm font-bold">Refeição {n}</h3><label className={labelClassName}>Nome ou horário<input name={`meal${n}Title`} maxLength={80} className={inputClassName} placeholder="Ex.: Café da manhã" /></label><label className={labelClassName}>Orientação<textarea name={`meal${n}Details`} maxLength={800} rows={3} className={inputClassName} /></label></div>)}</div><button className="primary-button">Publicar para o aluno</button></ActionForm>
    {student.nutritionPlans.filter(p => !p.active).length > 0 && <details className="border border-[#dfe3e6] bg-white p-5"><summary className="font-semibold">Versões anteriores</summary>{student.nutritionPlans.filter(p => !p.active).map(plan => <div key={plan.id} className="mt-4 border-t pt-4"><h3 className="font-semibold">{plan.title}</h3><p className="mt-2 whitespace-pre-line text-sm">{plan.guidance}</p><ul className="mt-2 text-sm">{nutritionMeals(plan.meals).map((meal,i) => <li key={i}><strong>{meal.title}:</strong> {meal.details}</li>)}</ul></div>)}</details>}
  </div>;
}
