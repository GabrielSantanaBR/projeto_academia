import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateExercise } from "@/app/actions/catalog";
import { ActionForm } from "@/components/action-form";
import { PageHeader, inputClassName, labelClassName } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Editar exercício" };
export default async function EditExercise({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
  const { id } = await params;
  const item = await prisma.exercise.findFirst({ where: { id, organizationId: viewer.organizationId, isSystem: false } });
  if (!item) notFound();
  return <div className="mx-auto max-w-3xl space-y-7"><Link href="/exercises" className="text-sm font-bold text-[var(--accent)]">← Exercícios</Link><PageHeader title="Editar exercício" description="As sessões já iniciadas preservam a orientação original." /><ActionForm action={updateExercise} className="space-y-5 rounded-xl border border-[#dfe3e6] bg-white p-6"><input type="hidden" name="exerciseId" value={id} />
    <label className={labelClassName}>Nome<input name="name" required minLength={2} maxLength={120} defaultValue={item.name} className={inputClassName} /></label>
    <label className={labelClassName}>Grupo muscular<input name="muscleGroup" required minLength={2} maxLength={100} defaultValue={item.muscleGroup} className={inputClassName} /></label>
    <input name="unit" type="hidden" value={item.unit} /><p className="text-sm text-[#64707d]">Medida: {item.unit === "SECONDS" ? "segundos" : "repetições"}. Para mudar a medida, crie um novo exercício.</p>
    <label className={labelClassName}>Descrição<input name="description" maxLength={500} defaultValue={item.description ?? ""} className={inputClassName} /></label>
    <label className={labelClassName}>Instruções<textarea name="instructions" maxLength={1500} rows={4} defaultValue={item.instructions ?? ""} className={inputClassName} /></label>
    <label className={labelClassName}>Vídeo de demonstração<input type="url" name="videoUrl" maxLength={300} defaultValue={item.videoUrl ?? ""} placeholder="https://www.youtube.com/watch?v=..." className={inputClassName} /></label>
    <label className={labelClassName}>Observações<textarea name="notes" maxLength={1000} rows={3} defaultValue={item.notes ?? ""} className={inputClassName} /></label>
    <button className="primary-button">Salvar exercício</button>
  </ActionForm></div>;
}
