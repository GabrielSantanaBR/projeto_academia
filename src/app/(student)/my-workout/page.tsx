import { Role } from "@prisma/client";
import { ActionForm } from "@/components/action-form";
import { CalendarClock, ChevronRight, Dumbbell, Play, Timer, MapPinned, HeartHandshake, Utensils } from "lucide-react";
import Link from "next/link";

import { startStudentWorkout } from "@/app/actions/sessions";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { formatDate, formatKg } from "@/lib/format";
import { requireRole } from "@/lib/auth";
import { getLastLoadsForExercises, getStudentWorkout } from "@/lib/queries";
import { ExerciseVideo } from "@/components/exercise-video";

export const metadata = { title: "Meu treino" };

export default async function MyWorkoutPage() {
  const membership = await requireRole(Role.STUDENT);
  const { student, plan, incompleteSession } = await getStudentWorkout(membership.id, membership.organizationId);
  const exerciseIds = plan?.days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseId)) ?? [];
  const lastLoads = await getLastLoadsForExercises(student.id, membership.organizationId, exerciseIds);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Seu treino"
        title={`Olá, ${student.membership.user.name.split(" ")[0]}`}
        description={plan ? `Ciclo válido até ${formatDate(plan.validUntil)}.` : "Fale com seu professor para receber seu próximo treino."}
      />
      <nav aria-label="Explore seu acompanhamento" className="grid overflow-hidden border border-[#dce3ea] bg-white sm:grid-cols-3"><Link href="/my-runs" className="group flex items-center gap-3 border-b border-[#dce3ea] p-4 transition hover:bg-[#eef4f9] sm:border-b-0 sm:border-r"><MapPinned className="size-5 shrink-0 text-[#2d6599]" /><span className="text-sm font-semibold">Registrar corrida <span aria-hidden className="text-[#8191a1] group-hover:text-[#2d6599]">↗</span></span></Link><Link href="/community" className="group flex items-center gap-3 border-b border-[#dce3ea] p-4 transition hover:bg-[#eef4f9] sm:border-b-0 sm:border-r"><HeartHandshake className="size-5 shrink-0 text-[#2d6599]" /><span className="text-sm font-semibold">Comunidade <span aria-hidden className="text-[#8191a1] group-hover:text-[#2d6599]">↗</span></span></Link><Link href="/my-nutrition" className="group flex items-center gap-3 p-4 transition hover:bg-[#eef4f9]"><Utensils className="size-5 shrink-0 text-[#2d6599]" /><span className="text-sm font-semibold">Nutrição <span aria-hidden className="text-[#8191a1] group-hover:text-[#2d6599]">↗</span></span></Link></nav>

      {incompleteSession && (
        <Link href={`/my-workout/session/${incompleteSession.id}`} className="flex items-center justify-between gap-4 border border-[#fdba74] bg-[#fff7ed] p-4 transition hover:bg-[#ffedd5]">
          <div className="flex items-center gap-3"><Timer className="size-5 text-[#c2410c]" /><div><p className="font-bold text-[#7c2d12]">Você tem um treino em andamento</p><p className="mt-1 text-sm text-[#9a3412]">Continue de onde parou.</p></div></div>
          <ChevronRight className="size-5 text-[#c2410c]" />
        </Link>
      )}

      {!plan ? (
        <EmptyState title="Seu treino ainda não foi publicado" description="Quando seu professor preparar a rotina, ela aparecerá aqui pronta para você iniciar." />
      ) : (
        <>
          <section className="relative overflow-hidden bg-[#172b46] p-5 text-white sm:p-7"><span aria-hidden className="absolute -right-12 -top-20 size-64 rounded-full border-[28px] border-white/5" />
            <div className="relative flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ffbc94]">Seu próximo movimento</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{plan.name}</h2><p className="mt-2 text-sm leading-6 text-slate-300">{plan.description ?? "Treino preparado para a sua evolução."}</p></div><Dumbbell className="size-7 shrink-0 text-[#ffbc94]" /></div>
            <div className="mt-6 flex items-center gap-2 text-sm text-slate-300"><CalendarClock className="size-4" /> {plan.days.length} dias de treino disponíveis</div>
          </section>
          <section className="space-y-4">
            {plan.days.map((day) => (
              <article key={day.id} className="overflow-hidden border border-[#dfe3e6] bg-white">
                <div className="flex items-start justify-between gap-4 border-b border-[#edf0f2] px-5 py-5">
                  <div><Badge tone="accent">Treino {day.code}</Badge><h2 className="mt-3 text-xl font-bold tracking-tight text-[#161b22]">{day.name}</h2><p className="mt-1 text-sm text-[#64707d]">{day.exercises.length} exercícios</p></div>
                  <ActionForm action={startStudentWorkout}><input type="hidden" name="workoutDayId" value={day.id} /><button type="submit" disabled={Boolean(incompleteSession)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-bold text-white hover:bg-[#c84411] disabled:cursor-not-allowed disabled:opacity-60"><Play className="size-4 fill-current" /> Iniciar</button></ActionForm>
                </div>
                <ol className="divide-y divide-[#edf0f2]">
                  {day.exercises.map((exercise, index) => (
                    <li key={exercise.id} className="flex gap-4 px-5 py-4">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#edf0f2] text-xs font-bold text-[#56616c]">{index + 1}</span>
                      <div className="min-w-0"><p className="font-bold text-[#27313a]">{exercise.exercise.name}</p><p className="mt-1 text-sm text-[#64707d]">{exercise.sets} × {exercise.repsMin}–{exercise.repsMax}{exercise.exercise.unit === "SECONDS" ? "s" : " rep."} · descanso {exercise.restSeconds}s</p>{lastLoads.has(exercise.exerciseId) && <p className="mt-2 text-xs font-semibold text-[#c2410c]">Última carga: {formatKg(lastLoads.get(exercise.exerciseId))}</p>}<ExerciseVideo url={exercise.exercise.videoUrl} name={exercise.exercise.name} /></div>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
