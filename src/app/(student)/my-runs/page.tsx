import { Role } from "@prisma/client";
import { PageHeader, EmptyState } from "@/components/ui";
import { RunRecorder } from "@/components/run-recorder";
import { RunHistoryMap } from "@/components/run-history-map";
import { DeleteRunForm } from "@/components/delete-run-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runPoint, paceLabel } from "@/lib/running";

export const metadata = { title: "Minhas corridas" };
export default async function MyRunsPage() {
  const viewer = await requireRole(Role.STUDENT);
  const student = await prisma.studentProfile.findFirst({ where: { membershipId: viewer.id, organizationId: viewer.organizationId }, select: { id: true } });
  if (!student) return null;
  const runs = await prisma.runActivity.findMany({ where: { organizationId: viewer.organizationId, studentId: student.id }, orderBy: { createdAt: "desc" }, take: 20 });
  return <div className="space-y-7"><PageHeader eyebrow="Movimente-se lá fora" title="Minhas corridas" description="Registre um trajeto no navegador e acompanhe distância, duração e ritmo. O mapa só aparece para você." /><RunRecorder />
    <section className="space-y-3"><h2 className="text-lg font-bold">Histórico de corridas</h2>{!runs.length ? <EmptyState title="Nenhuma corrida salva" description="Sua primeira corrida aparecerá aqui depois de salvar o trajeto." /> : runs.map(run => <article key={run.id} className="border-b border-[#dfe3e6] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">{run.startedAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</h3><p className="text-sm text-[#64707d]">{run.startedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p></div><p className="text-sm"><strong>{(run.distanceMeters / 1000).toFixed(2)} km</strong> · {Math.floor(run.durationSeconds / 60)} min · {paceLabel(run.distanceMeters, run.durationSeconds)}</p></div><RunHistoryMap points={runPoint.array().parse(run.points)} /><DeleteRunForm runId={run.id} /></article>)}</section>
  </div>;
}
