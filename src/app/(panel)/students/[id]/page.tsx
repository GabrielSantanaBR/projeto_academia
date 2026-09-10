import { WorkoutPlanStatus, WorkoutSessionStatus } from "@prisma/client";
import { ArrowLeft, CalendarDays, ClipboardList, Pencil, Plus, RotateCcw } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createQuickWorkout, assignTemplateToStudent, duplicateWorkoutPlan } from "@/app/actions/training";
import { AssessmentChart } from "@/components/assessment-chart";
import { Badge, ButtonLink, EmptyState, PageHeader, SectionHeading, inputClassName, labelClassName } from "@/components/ui";
import { formatAge, formatCm, formatDate, formatDateTime, formatDuration, formatKg, formatRelativeDate } from "@/lib/format";
import { getCurrentMembership } from "@/lib/auth";
import { getExercises, getStudentDetail, getTemplates } from "@/lib/queries";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const tabs = [
  ["overview", "Visão geral"],
  ["training", "Treino"],
  ["history", "Histórico"],
  ["assessments", "Avaliações"],
] as const;

export const metadata = { title: "Aluno" };

export default async function StudentDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, { tab: requestedTab }] = await Promise.all([params, searchParams]);
  const membership = await getCurrentMembership();
  let student;

  try {
    student = await getStudentDetail(id, membership);
  } catch {
    notFound();
  }

  const tab = tabs.some(([value]) => value === requestedTab) ? requestedTab : "overview";
  const activePlan = student.workoutPlans.find((plan) => plan.status === WorkoutPlanStatus.PUBLISHED) ?? null;
  const latestCompletedSession = student.sessions.find((session) => session.status === WorkoutSessionStatus.COMPLETED);
  const [templates, exercises] =
    tab === "training"
      ? await Promise.all([getTemplates(membership.organizationId), getExercises(membership.organizationId)])
      : [[], []];

  return (
    <div className="space-y-7">
      <Link href="/students" className="inline-flex items-center gap-2 text-sm font-semibold text-[#64707d] hover:text-[#c84411]">
        <ArrowLeft className="size-4" /> Voltar para alunos
      </Link>
      <PageHeader
        eyebrow="Perfil do aluno"
        title={student.membership.user.name}
        description={`${student.goal ?? "Objetivo não informado"} · Responsável: ${student.primaryTeacher?.user.name ?? "Sem professor"}`}
        action={
          <ButtonLink href={`/students/${student.id}/edit`} variant="secondary">
            <Pencil className="size-4" /> Editar cadastro
          </ButtonLink>
        }
      />

      <nav className="flex gap-1 overflow-x-auto border-b border-[#dfe3e6]" aria-label="Seções do aluno">
        {tabs.map(([value, label]) => (
          <Link
            key={value}
            href={`/students/${student.id}?tab=${value}`}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition ${tab === value ? "border-[#e85d24] text-[#c84411]" : "border-transparent text-[#64707d] hover:text-[#27313a]"}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <section className="border border-[#dfe3e6] bg-white">
            <div className="border-b border-[#e5e7e9] px-5 py-5 sm:px-6"><SectionHeading title="Visão geral" description="Informações operacionais e do treinamento atual." /></div>
            <dl className="grid divide-x divide-y divide-[#edf0f2] sm:grid-cols-2">
              {[
                ["Idade", formatAge(student.birthDate)],
                ["Professor responsável", student.primaryTeacher?.user.name ?? "Sem responsável"],
                ["Objetivo", student.goal ?? "Não informado"],
                ["Status", student.status === "ACTIVE" ? "Ativo" : "Inativo"],
                ["Treino atual", activePlan?.name ?? "Sem treino ativo"],
                ["Validade", formatDate(activePlan?.validUntil)],
                ["Última atividade", formatRelativeDate(latestCompletedSession?.completedAt)],
                ["Próxima revisão", formatDate(activePlan?.validUntil)],
              ].map(([label, value]) => (
                <div key={label} className="px-5 py-4 sm:px-6">
                  <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[#8a959d]">{label}</dt>
                  <dd className="mt-2 text-sm font-semibold text-[#27313a]">{value}</dd>
                </div>
              ))}
            </dl>
            {student.notes && <div className="border-t border-[#edf0f2] px-5 py-5 sm:px-6"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8a959d]">Observações</p><p className="mt-2 text-sm leading-6 text-[#56616c]">{student.notes}</p></div>}
          </section>
          <aside className="border border-[#dfe3e6] bg-white p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e85d24]">Atividade recente</p>
            {latestCompletedSession ? (
              <>
                <h2 className="mt-3 text-lg font-bold text-[#161b22]">{latestCompletedSession.dayName}</h2>
                <p className="mt-1 text-sm text-[#64707d]">Concluído {formatDateTime(latestCompletedSession.completedAt)}</p>
                <div className="mt-6 border-t border-[#edf0f2] pt-5 text-sm text-[#56616c]">
                  <p><strong className="text-[#27313a]">{latestCompletedSession.exercises.length}</strong> exercícios registrados</p>
                  <p className="mt-2"><strong className="text-[#27313a]">{formatDuration(latestCompletedSession.durationMinutes)}</strong> de duração</p>
                </div>
                <Link href={`/students/${student.id}?tab=history`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#c84411] hover:underline">Ver histórico <ClipboardList className="size-4" /></Link>
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[#64707d]">Ainda não há treino concluído registrado para este aluno.</p>
            )}
          </aside>
        </div>
      )}

      {tab === "training" && (
        <div className="space-y-7">
          {activePlan ? (
            <section className="border border-[#dfe3e6] bg-white">
              <div className="flex flex-col justify-between gap-4 border-b border-[#dfe3e6] px-5 py-5 sm:flex-row sm:items-start sm:px-6">
                <div>
                  <div className="flex items-center gap-2"><Badge tone="success">Publicado</Badge><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8a959d]">Válido até {formatDate(activePlan.validUntil)}</p></div>
                  <h2 className="mt-3 text-xl font-bold text-[#161b22]">{activePlan.name}</h2>
                  <p className="mt-1 text-sm text-[#64707d]">{activePlan.description ?? "Treino individual do aluno"}</p>
                </div>
                <form action={duplicateWorkoutPlan} className="flex items-center gap-2">
                  <input type="hidden" name="planId" value={activePlan.id} />
                  <input name="validUntil" type="date" className="min-h-10 rounded-lg border border-[#cfd5d9] px-2 text-sm" aria-label="Nova validade" />
                  <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#cfd5d9] px-3 text-sm font-bold text-[#3c4650] hover:bg-[#fafafa]"><RotateCcw className="size-4" /> Duplicar</button>
                </form>
              </div>
              <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-3">
                {activePlan.days.map((day) => (
                  <div key={day.id} className="border border-[#dfe3e6] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#e85d24]">Treino {day.code}</p>
                    <h3 className="mt-1 font-bold text-[#27313a]">{day.name}</h3>
                    <ul className="mt-4 space-y-3 text-sm">
                      {day.exercises.map((item) => <li key={item.id} className="border-t border-[#edf0f2] pt-3 first:border-0 first:pt-0"><p className="font-semibold text-[#3c4650]">{item.exercise.name}</p><p className="mt-1 text-[#64707d]">{item.sets} × {item.repsMin}–{item.repsMax} · {item.restSeconds}s</p></li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <EmptyState title="Aluno sem treino ativo" description="Atribua um template ou crie um treino simples abaixo para publicar a primeira prescrição." />
          )}

          <section className="grid gap-7 xl:grid-cols-2">
            <form action={assignTemplateToStudent} className="space-y-4 border border-[#dfe3e6] bg-white p-5 sm:p-6">
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e85d24]">Atribuir template</p><h2 className="mt-2 font-bold text-[#161b22]">Criar treino a partir de um modelo</h2><p className="mt-1 text-sm leading-6 text-[#64707d]">O template é copiado; alterações futuras deste aluno não mexem no modelo original.</p></div>
              <input type="hidden" name="studentId" value={student.id} />
              <label className={labelClassName}>Template<select name="templateId" required className={inputClassName}><option value="">Selecione um template</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className={labelClassName}>Nome do treino<input name="name" className={inputClassName} placeholder="Opcional" /></label><label className={labelClassName}>Validade<input name="validUntil" type="date" className={inputClassName} /></label></div>
              <button type="submit" disabled={templates.length === 0} className="min-h-10 rounded-lg bg-[#e85d24] px-4 text-sm font-bold text-white hover:bg-[#c84411] disabled:cursor-not-allowed disabled:opacity-60">Publicar treino</button>
            </form>
            <form action={createQuickWorkout} className="space-y-4 border border-[#dfe3e6] bg-white p-5 sm:p-6">
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64707d]">Atalho</p><h2 className="mt-2 font-bold text-[#161b22]">Criar treino simples</h2><p className="mt-1 text-sm leading-6 text-[#64707d]">Para uma prescrição rápida com um exercício. O novo treino substitui o atual.</p></div>
              <input type="hidden" name="studentId" value={student.id} />
              <div className="grid gap-4 sm:grid-cols-2"><label className={labelClassName}>Nome<input name="name" required className={inputClassName} placeholder="Treino adaptado" /></label><label className={labelClassName}>Exercício<select name="exerciseId" required className={inputClassName}>{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select></label></div>
              <div className="grid grid-cols-4 gap-3"><label className={labelClassName}>Séries<input name="sets" type="number" defaultValue={3} min={1} max={12} className={inputClassName} /></label><label className={labelClassName}>Mín.<input name="repsMin" type="number" defaultValue={8} min={1} max={100} className={inputClassName} /></label><label className={labelClassName}>Máx.<input name="repsMax" type="number" defaultValue={12} min={1} max={100} className={inputClassName} /></label><label className={labelClassName}>Carga<input name="suggestedLoad" type="number" min={0} step="0.5" className={inputClassName} /></label></div>
              <button type="submit" disabled={exercises.length === 0} className="min-h-10 rounded-lg border border-[#cfd5d9] px-4 text-sm font-bold text-[#3c4650] hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-60">Criar e publicar</button>
            </form>
          </section>
        </div>
      )}

      {tab === "history" && (
        <section className="border border-[#dfe3e6] bg-white">
          <div className="border-b border-[#dfe3e6] px-5 py-5 sm:px-6"><SectionHeading title="Histórico de treinos" description="Sessões concluídas e séries registradas pelo aluno." /></div>
          {student.sessions.filter((session) => session.status === WorkoutSessionStatus.COMPLETED).length === 0 ? <EmptyState title="Sem histórico ainda" description="As sessões finalizadas pelo aluno aparecerão aqui." /> : <div className="divide-y divide-[#edf0f2]">{student.sessions.filter((session) => session.status === WorkoutSessionStatus.COMPLETED).map((session) => <details key={session.id} className="group"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 hover:bg-[#fffaf5] sm:px-6"><div><p className="font-bold text-[#27313a]">{session.dayName}</p><p className="mt-1 text-sm text-[#64707d]">{formatDateTime(session.completedAt)} · {formatDuration(session.durationMinutes)}</p></div><CalendarDays className="size-5 text-[#8a959d]" /></summary><div className="border-t border-[#edf0f2] bg-[#fafafa] px-5 py-5 sm:px-6"><div className="grid gap-4 md:grid-cols-2">{session.exercises.map((exercise) => <div key={exercise.id} className="border border-[#dfe3e6] bg-white p-4"><p className="font-bold text-[#27313a]">{exercise.exerciseName}</p><div className="mt-3 space-y-1 text-sm text-[#64707d]">{exercise.sets.map((set) => <p key={set.id}>Série {set.setNumber}: <strong className="text-[#3c4650]">{formatKg(set.load)} × {set.reps ?? "—"}</strong></p>)}</div></div>)}</div></div></details>)}</div>}
        </section>
      )}

      {tab === "assessments" && (
        <div className="space-y-7">
          <section className="border border-[#dfe3e6] bg-white p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><SectionHeading title="Evolução básica" description="Os gráficos aparecem quando há pelo menos duas avaliações com dados comparáveis." /><ButtonLink href={`/students/${student.id}/assessments/new`}><Plus className="size-4" /> Nova avaliação</ButtonLink></div>
            <div className="mt-6"><AssessmentChart assessments={student.assessments.slice().reverse().map((assessment) => ({ date: formatDate(assessment.assessedAt), weight: assessment.weight, waist: assessment.waist }))} /></div>
            {student.assessments.length < 2 && <p className="mt-5 text-sm text-[#64707d]">Registre mais uma avaliação para visualizar a evolução em gráfico.</p>}
          </section>
          <section className="overflow-hidden border border-[#dfe3e6] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#fafafa] text-xs font-bold uppercase tracking-[0.09em] text-[#64707d]"><tr><th className="px-5 py-3.5">Data</th><th className="px-5 py-3.5">Peso</th><th className="px-5 py-3.5">Cintura</th><th className="px-5 py-3.5">Quadril</th><th className="px-5 py-3.5">Braço</th><th className="px-5 py-3.5">Coxa</th><th className="px-5 py-3.5">Registrado por</th></tr></thead><tbody className="divide-y divide-[#edf0f2]">{student.assessments.map((assessment) => <tr key={assessment.id}><td className="px-5 py-4 font-semibold text-[#27313a]">{formatDate(assessment.assessedAt)}</td><td className="px-5 py-4 text-[#56616c]">{formatKg(assessment.weight)}</td><td className="px-5 py-4 text-[#56616c]">{formatCm(assessment.waist)}</td><td className="px-5 py-4 text-[#56616c]">{formatCm(assessment.hip)}</td><td className="px-5 py-4 text-[#56616c]">{formatCm(assessment.arm)}</td><td className="px-5 py-4 text-[#56616c]">{formatCm(assessment.thigh)}</td><td className="px-5 py-4 text-[#56616c]">{assessment.recordedBy.user.name}</td></tr>)}</tbody></table></div></section>
        </div>
      )}
    </div>
  );
}
