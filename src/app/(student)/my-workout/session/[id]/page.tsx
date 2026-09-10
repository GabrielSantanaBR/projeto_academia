import { CheckCircle2, ChevronLeft, Circle, Dumbbell, Save } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { finishStudentWorkout } from "@/app/actions/sessions";
import { Badge, PageHeader } from "@/components/ui";
import { formatKg } from "@/lib/format";
import { getCurrentMembership } from "@/lib/auth";
import { getLastLoadsForExercises, getSessionForStudent } from "@/lib/queries";

type PageProps = { params: Promise<{ id: string }> };

export const metadata = { title: "Registrar treino" };

export default async function WorkoutSessionPage({ params }: PageProps) {
  const { id } = await params;
  const membership = await getCurrentMembership();
  let session: Awaited<ReturnType<typeof getSessionForStudent>>;

  try {
    session = await getSessionForStudent(id, membership.id, membership.organizationId);
  } catch {
    notFound();
  }

  const lastLoads = await getLastLoadsForExercises(
    session.studentId,
    membership.organizationId,
    session.exercises.map((exercise) => exercise.exerciseId),
  );

  return (
    <div className="space-y-6">
      <Link href="/my-workout" className="inline-flex items-center gap-2 text-sm font-semibold text-[#64707d] hover:text-[#c84411]"><ChevronLeft className="size-4" /> Voltar</Link>
      <PageHeader eyebrow="Treino em andamento" title={session.dayName} description="Registre a carga e as repetições feitas em cada série. Seus dados serão salvos ao finalizar." />
      <form action={finishStudentWorkout} className="space-y-5">
        <input type="hidden" name="sessionId" value={session.id} />
        {session.exercises.map((exercise, index) => (
          <section key={exercise.id} className="overflow-hidden border border-[#dfe3e6] bg-white">
            <div className="flex items-start justify-between gap-4 border-b border-[#edf0f2] p-5">
              <div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#fff7ed] text-sm font-bold text-[#c2410c]">{index + 1}</span><div><h2 className="font-bold text-[#161b22]">{exercise.exerciseName}</h2><p className="mt-1 text-sm text-[#64707d]">Meta: {exercise.targetSets} × {exercise.targetRepsMin}–{exercise.targetRepsMax}</p>{lastLoads.has(exercise.exerciseId) && <p className="mt-2 text-xs font-bold text-[#c2410c]">Última carga: {formatKg(lastLoads.get(exercise.exerciseId))}</p>}</div></div>
              <Badge tone="neutral"><Dumbbell className="mr-1 size-3" /> {exercise.targetSets} séries</Badge>
            </div>
            <div className="divide-y divide-[#edf0f2]">
              {exercise.sets.map((set) => (
                <div key={set.id} className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 px-5 py-4 sm:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)]">
                  <p className="text-sm font-bold text-[#3c4650]">Série {set.setNumber}</p>
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#8a959d]">Carga (kg)<input name={`load-${exercise.id}-${set.setNumber}`} type="number" min="0" max="1000" step="0.5" defaultValue={set.load ?? lastLoads.get(exercise.exerciseId) ?? ""} className="mt-1 block min-h-10 w-full rounded-lg border border-[#cfd5d9] px-2 text-sm font-semibold text-[#27313a] outline-none focus:border-[#e85d24]" /></label>
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#8a959d]">Repetições<input name={`reps-${exercise.id}-${set.setNumber}`} type="number" min="0" max="100" defaultValue={set.reps ?? exercise.targetRepsMax} className="mt-1 block min-h-10 w-full rounded-lg border border-[#cfd5d9] px-2 text-sm font-semibold text-[#27313a] outline-none focus:border-[#e85d24]" /></label>
                </div>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 border-t border-[#edf0f2] bg-[#fafafa] px-5 py-3 text-sm font-semibold text-[#3c4650]"><input name={`completed-${exercise.id}`} type="checkbox" className="size-4 accent-[#e85d24]" /> <CheckCircle2 className="size-4 text-[#e85d24]" /> Marcar exercício como concluído</label>
          </section>
        ))}
        <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#e85d24] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#c84411]"><Save className="size-4" /> Finalizar e salvar treino</button>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-[#64707d]"><Circle className="size-3" /> Os registros serão visíveis para seu professor.</p>
      </form>
    </div>
  );
}
