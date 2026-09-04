import { ClipboardCheck } from "lucide-react";

import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { formatCm, formatDate, formatKg } from "@/lib/format";
import { getCurrentMembership } from "@/lib/auth";
import { getStudentDetail, getStudentWorkout } from "@/lib/queries";

export const metadata = { title: "Minhas avaliações" };

export default async function MyAssessmentsPage() {
  const membership = await getCurrentMembership();
  const { student } = await getStudentWorkout(membership.id, membership.organizationId);
  const detail = await getStudentDetail(student.id, membership);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Seu acompanhamento" title="Avaliações" description="Medidas registradas pelos profissionais da sua academia." />
      {detail.assessments.length === 0 ? (
        <EmptyState title="Nenhuma avaliação registrada" description="Quando seu professor concluir uma avaliação, ela aparecerá aqui." />
      ) : (
        <section className="divide-y divide-[#dfe3e6] border border-[#dfe3e6] bg-white">
          {detail.assessments.map((assessment) => (
            <article key={assessment.id} className="p-5">
              <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#fff7ed] text-[#c2410c]"><ClipboardCheck className="size-4" /></span><div><h2 className="font-bold text-[#161b22]">Avaliação de {formatDate(assessment.assessedAt)}</h2><p className="mt-1 text-sm text-[#64707d]">Registrada por {assessment.recordedBy.user.name}</p></div></div><Badge tone="neutral">Avaliação física</Badge></div>
              <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden border border-[#edf0f2] bg-[#edf0f2] text-sm"><div className="bg-white p-3"><dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#8a959d]">Peso</dt><dd className="mt-1 font-bold text-[#27313a]">{formatKg(assessment.weight)}</dd></div><div className="bg-white p-3"><dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#8a959d]">Cintura</dt><dd className="mt-1 font-bold text-[#27313a]">{formatCm(assessment.waist)}</dd></div><div className="bg-white p-3"><dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#8a959d]">Quadril</dt><dd className="mt-1 font-bold text-[#27313a]">{formatCm(assessment.hip)}</dd></div></dl>
              {assessment.notes && <p className="mt-4 border-l-2 border-[#e85d24] pl-3 text-sm leading-6 text-[#64707d]">{assessment.notes}</p>}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
