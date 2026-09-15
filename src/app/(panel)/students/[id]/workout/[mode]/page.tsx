import { Role } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TemplateBuilder } from "@/components/template-builder";
import { PageHeader } from "@/components/ui";
import { requireRole, AuthorizationError } from "@/lib/auth";
import { getStudentDetail, getExercises } from "@/lib/queries";
import { toDateInputValue } from "@/lib/format";

export const metadata = { title: "Editor de treino" };
export default async function WorkoutEditor({ params }: { params: Promise<{ id: string; mode: string }> }) {
  const { id, mode } = await params;
  if (!["new", "edit"].includes(mode)) notFound();
  const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
  const student = await getStudentDetail(id, viewer).catch(error => { if (error instanceof AuthorizationError) notFound(); throw error; });
  const plan = student.workoutPlans.find(p => p.status === "PUBLISHED");
  if (mode === "edit" && !plan) notFound();
  const exercises = await getExercises(viewer.organizationId);
  return <div className="space-y-7"><Link href={`/students/${id}?tab=training`} className="text-sm font-bold text-[#64707d]">← Voltar ao treino de {student.membership.user.name.split(" ")[0]}</Link><PageHeader title={mode === "edit" ? "Editar treino" : "Novo treino"} description={`${student.membership.user.name} · A publicação substitui o ciclo atual e preserva as sessões anteriores.`} />
    <TemplateBuilder exercises={exercises} kind="plan" studentId={id} recordId={mode === "edit" ? plan?.id : undefined} initial={mode === "edit" && plan ? { name: plan.name, description: plan.description, days: plan.days, validUntil: toDateInputValue(plan.validUntil) } : undefined} />
  </div>;
}
