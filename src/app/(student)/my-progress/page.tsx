import { TrendingDown, TrendingUp } from "lucide-react";

import { AssessmentChart } from "@/components/assessment-chart";
import { EmptyState, PageHeader } from "@/components/ui";
import { formatCm, formatDate, formatKg } from "@/lib/format";
import { getCurrentMembership } from "@/lib/auth";
import { getStudentDetail, getStudentWorkout } from "@/lib/queries";

export const metadata = { title: "Minha evolução" };

function EvolutionMetric({ label, current, previous, unit }: { label: string; current: number | null; previous: number | null; unit: string }) {
  if (current === null || previous === null) return null;
  const difference = current - previous;
  const formatter = unit === "kg" ? formatKg : formatCm;

  return (
    <div className="border-l-2 border-[#e85d24] bg-white px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#64707d]">{label}</p>
      <p className="mt-2 text-xl font-bold text-[#161b22]">{formatter(previous)} → {formatter(current)}</p>
      <p className={`mt-2 flex items-center gap-1 text-xs font-bold ${difference <= 0 ? "text-[#15803d]" : "text-[#b45309]"}`}>{difference <= 0 ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}{difference > 0 ? "+" : ""}{difference.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} {unit} desde a última avaliação</p>
    </div>
  );
}

export default async function MyProgressPage() {
  const membership = await getCurrentMembership();
  const { student } = await getStudentWorkout(membership.id, membership.organizationId);
  const detail = await getStudentDetail(student.id, membership);
  const chronological = detail.assessments.slice().reverse();
  const current = chronological.at(-1);
  const previous = chronological.at(-2);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Seu acompanhamento" title="Evolução" description="Comparação simples entre suas avaliações registradas." />
      {chronological.length < 2 || !current || !previous ? (
        <EmptyState title="Ainda faltam dados para comparar" description="Peça ao seu professor para registrar pelo menos duas avaliações físicas." />
      ) : (
        <>
          <section className="grid gap-px overflow-hidden border border-[#dfe3e6] bg-[#dfe3e6] sm:grid-cols-2">
            <EvolutionMetric label="Peso" current={current.weight} previous={previous.weight} unit="kg" />
            <EvolutionMetric label="Cintura" current={current.waist} previous={previous.waist} unit="cm" />
          </section>
          <section className="border border-[#dfe3e6] bg-white p-5">
            <h2 className="font-bold text-[#161b22]">Sua trajetória</h2>
            <p className="mt-1 text-sm text-[#64707d]">Dados de {formatDate(chronological[0]?.assessedAt)} até {formatDate(current.assessedAt)}.</p>
            <div className="mt-6"><AssessmentChart assessments={chronological.map((assessment) => ({ date: formatDate(assessment.assessedAt), weight: assessment.weight, waist: assessment.waist }))} /></div>
          </section>
        </>
      )}
    </div>
  );
}
