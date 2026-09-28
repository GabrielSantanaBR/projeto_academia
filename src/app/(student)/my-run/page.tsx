import { Role } from "@prisma/client";
import { RunTracker } from "@/components/run-tracker";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export default async function MyRun() {
 const viewer = await requireRole(Role.STUDENT);
 const runs = await prisma.outdoorRun.findMany({ where: { organizationId: viewer.organizationId, studentId: viewer.studentProfile!.id }, orderBy: { startedAt: "desc" }, take: 30 });
 return <div className="space-y-6"><PageHeader title="Corridas ao ar livre" description="Registre distância e duração pelo GPS do celular." /><RunTracker /><section className="space-y-3"><h2 className="text-lg font-bold">Histórico</h2>{runs.map(run => <article key={run.id} className="flex justify-between gap-3 bg-white p-4 text-sm"><span>{new Intl.DateTimeFormat("pt-BR").format(run.startedAt)}</span><strong>{(run.distanceMeters / 1000).toFixed(2)} km · {Math.round((run.finishedAt.getTime() - run.startedAt.getTime()) / 60000)} min</strong></article>)}</section></div>;
}
