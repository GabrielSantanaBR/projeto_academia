import { CheckCircle2, ChevronDown, Dumbbell } from "lucide-react";

import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime, formatDuration, formatKg } from "@/lib/format";
import { getCurrentMembership } from "@/lib/auth";
import { getStudentDetail, getStudentWorkout } from "@/lib/queries";

export const metadata = { title: "Meu histórico" };

export default async function MyHistoryPage() {
  const membership = await getCurrentMembership();
  const { student } = await getStudentWorkout(membership.id, membership.organizationId);
  const detail = await getStudentDetail(student.id, membership);
  const sessions = detail.sessions.filter((session) => session.status === "COMPLETED");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Seu acompanhamento" title="Histórico" description="Treinos concluídos e as séries que você registrou." />
      {sessions.length === 0 ? <EmptyState title="Seu histórico começa no primeiro treino" description="Quando você finalizar uma sessão, ela aparecerá aqui." /> : <section className="divide-y divide-[#dfe3e6] border border-[#dfe3e6] bg-white">{sessions.map((session) => <details key={session.id} className="group"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 hover:bg-[#fffaf5]"><div><div className="flex items-center gap-2"><h2 className="font-bold text-[#161b22]">{session.dayName}</h2><Badge tone="success"><CheckCircle2 className="mr-1 size-3" /> Concluído</Badge></div><p className="mt-2 text-sm text-[#64707d]">{formatDateTime(session.completedAt)} · {formatDuration(session.durationMinutes)}</p></div><ChevronDown className="size-5 text-[#8a959d] transition group-open:rotate-180" /></summary><div className="grid gap-4 border-t border-[#edf0f2] bg-[#fafafa] p-4 sm:grid-cols-2">{session.exercises.map((exercise) => <div key={exercise.id} className="border border-[#dfe3e6] bg-white p-4"><div className="flex items-center gap-2"><Dumbbell className="size-4 text-[#e85d24]" /><p className="font-bold text-[#27313a]">{exercise.exerciseName}</p></div><div className="mt-3 space-y-1 text-sm text-[#64707d]">{exercise.sets.map((set) => <p key={set.id}>Série {set.setNumber}: <strong className="text-[#27313a]">{formatKg(set.load)} × {set.reps ?? "—"}</strong></p>)}</div></div>)}</div></details>)}</section>}
    </div>
  );
}
