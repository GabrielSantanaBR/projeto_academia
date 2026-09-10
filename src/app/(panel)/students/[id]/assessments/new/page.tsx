import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createAssessment } from "@/app/actions/assessments";
import { PageHeader, inputClassName, labelClassName } from "@/components/ui";
import { getCurrentMembership } from "@/lib/auth";
import { getStudentDetail } from "@/lib/queries";

type PageProps = { params: Promise<{ id: string }> };

export const metadata = { title: "Nova avaliação" };

export default async function NewAssessmentPage({ params }: PageProps) {
  const { id } = await params;
  const membership = await getCurrentMembership();
  let student: Awaited<ReturnType<typeof getStudentDetail>>;

  try {
    student = await getStudentDetail(id, membership);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link href={`/students/${student.id}?tab=assessments`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#64707d] hover:text-[#c84411]"><ArrowLeft className="size-4" /> Voltar para avaliações</Link>
      <PageHeader title="Registrar avaliação" description={`Avaliação física simples de ${student.membership.user.name}. Não substitui acompanhamento médico.`} />
      <form action={createAssessment} className="space-y-7 border border-[#dfe3e6] bg-white p-5 sm:p-7">
        <input type="hidden" name="studentId" value={student.id} />
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClassName}>Data<input name="assessedAt" type="date" className={inputClassName} /></label>
          <label className={labelClassName}>Peso (kg)<input name="weight" type="number" min="0" max="500" step="0.1" className={inputClassName} /></label>
          <label className={labelClassName}>Altura (m)<input name="height" type="number" min="0" max="3" step="0.01" className={inputClassName} placeholder="Ex.: 1,75" /></label>
          <label className={labelClassName}>Cintura (cm)<input name="waist" type="number" min="0" max="300" step="0.1" className={inputClassName} /></label>
          <label className={labelClassName}>Quadril (cm)<input name="hip" type="number" min="0" max="300" step="0.1" className={inputClassName} /></label>
          <label className={labelClassName}>Braço (cm)<input name="arm" type="number" min="0" max="200" step="0.1" className={inputClassName} /></label>
          <label className={labelClassName}>Coxa (cm)<input name="thigh" type="number" min="0" max="300" step="0.1" className={inputClassName} /></label>
          <div />
          <label className={`${labelClassName} sm:col-span-2`}>Observações<textarea name="notes" rows={5} className={inputClassName} placeholder="Anotações do profissional." /></label>
        </div>
        <div className="flex justify-end border-t border-[#edf0f2] pt-5"><button type="submit" className="min-h-10 rounded-lg bg-[#e85d24] px-5 text-sm font-bold text-white hover:bg-[#c84411]">Salvar avaliação</button></div>
      </form>
    </div>
  );
}
