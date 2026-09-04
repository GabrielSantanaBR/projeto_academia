import { Role } from "@prisma/client";
import { ArrowRight, CalendarClock, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge, Metric, PageHeader, SectionHeading } from "@/components/ui";
import { getCurrentMembership } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";

export const metadata = { title: "Visão geral" };

export default async function DashboardPage() {
  const membership = await getCurrentMembership();
  if (membership.role !== Role.ADMIN) redirect("/students");
  const dashboard = await getDashboardData(membership.organizationId);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operação da academia"
        title="Visão geral"
        description="Os dados abaixo são calculados a partir dos alunos, treinos e sessões registrados na plataforma."
      />

      <section className="grid gap-px overflow-hidden border border-[#dfe3e6] bg-[#dfe3e6] sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Alunos ativos" value={dashboard.metrics.activeStudents} helper="Base atual da academia" />
        <Metric label="Professores" value={dashboard.metrics.teachers} helper="Com alunos atribuídos" />
        <Metric
          label="Sem treino ativo"
          value={dashboard.metrics.withoutCurrentPlan}
          helper="Precisam de um plano vigente"
          tone={dashboard.metrics.withoutCurrentPlan ? "alert" : "default"}
        />
        <Metric
          label="Treinos vencendo"
          value={dashboard.metrics.expiringPlans}
          helper="Nos próximos 7 dias"
          tone={dashboard.metrics.expiringPlans ? "accent" : "default"}
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
        <div className="border border-[#dfe3e6] bg-white">
          <div className="flex items-start justify-between gap-4 border-b border-[#e5e7e9] px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#e85d24]">Ação prioritária</p>
              <h2 className="mt-2 text-lg font-bold text-[#161b22]">Precisam de atenção</h2>
              <p className="mt-1 text-sm text-[#64707d]">Sinais que pedem contato ou ajuste de treino.</p>
            </div>
            <Link href="/pending" className="inline-flex items-center gap-1 text-sm font-bold text-[#c84411] hover:underline">
              Ver tudo <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="divide-y divide-[#edf0f2]">
            {dashboard.attention.slice(0, 6).map((item) => (
              <Link
                key={`${item.studentId}-${item.reason}`}
                href={`/students/${item.studentId}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#fffaf5] sm:px-6"
              >
                <div>
                  <p className="font-semibold text-[#27313a]">{item.studentName}</p>
                  <p className="mt-1 text-sm text-[#64707d]">{item.description}</p>
                </div>
                <Badge tone={item.priority === 1 ? "danger" : item.priority === 2 ? "warning" : "neutral"}>
                  Prioridade {item.priority}
                </Badge>
              </Link>
            ))}
            {dashboard.attention.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-[#64707d]">Nenhum aluno precisa de atenção agora.</p>
            )}
          </div>
        </div>

        <div className="border border-[#dfe3e6] bg-white p-5 sm:p-6">
          <SectionHeading title="Distribuição por professor" description="Alunos ativos atribuídos" />
          <div className="mt-6 space-y-5">
            {dashboard.teacherDistribution.map((teacher) => {
              const total = Math.max(dashboard.metrics.activeStudents, 1);
              const width = Math.max(6, (teacher.studentCount / total) * 100);
              return (
                <div key={teacher.id}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold text-[#3c4650]">{teacher.name}</span>
                    <span className="font-bold text-[#161b22]">{teacher.studentCount}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf0f2]">
                    <div className="h-full rounded-full bg-[#e85d24]" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 border-t border-[#edf0f2] pt-5 text-sm">
            <Link href="/teachers" className="inline-flex items-center gap-2 font-bold text-[#c84411] hover:underline">
              <Users className="size-4" /> Gerenciar professores
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 border-t border-[#dfe3e6] pt-6 sm:grid-cols-3">
        <div className="flex items-start gap-3 bg-white p-4">
          <CalendarClock className="mt-0.5 size-5 text-[#e85d24]" />
          <div>
            <p className="font-bold text-[#161b22]">{dashboard.metrics.expiredPlans} treinos vencidos</p>
            <p className="mt-1 text-sm text-[#64707d]">Atualize a prescrição antes do próximo treino.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-white p-4">
          <Users className="mt-0.5 size-5 text-[#e85d24]" />
          <div>
            <p className="font-bold text-[#161b22]">{dashboard.metrics.newStudents} alunos novos</p>
            <p className="mt-1 text-sm text-[#64707d]">Entraram nos últimos 14 dias.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-white p-4">
          <CalendarClock className="mt-0.5 size-5 text-[#e85d24]" />
          <div>
            <p className="font-bold text-[#161b22]">{dashboard.metrics.inactiveStudents} sem atividade recente</p>
            <p className="mt-1 text-sm text-[#64707d]">Sem treino há 10 dias ou mais.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
