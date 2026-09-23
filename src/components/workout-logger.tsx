"use client";

import { Check, Pause, RotateCcw, Save, Timer } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveStudentWorkout } from "@/app/actions/sessions";
import type { ActionResult } from "@/lib/action-result";
import { formatKg } from "@/lib/format";
import { ExerciseVideo } from "@/components/exercise-video";

type Item = { id: string; exerciseId: string; exerciseName: string; targetRepsMin: number; targetRepsMax: number; unit: "REPS" | "SECONDS"; restSeconds: number; suggestedLoad: number | null; instructions: string | null; videoUrl: string | null; notes: string | null; sets: { id: string; setNumber: number; load: number | null; reps: number | null; done: boolean }[] };

export function WorkoutLogger({ sessionId, initialVersion, exercises, lastLoads }: { sessionId: string; initialVersion: number; exercises: Item[]; lastLoads: Record<string, number> }) {
  const [version, setVersion] = useState(initialVersion);
  const [result, setResult] = useState<ActionResult>({});
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>(() => Object.fromEntries(exercises.flatMap(e => e.sets.map(s => [s.id, s.done]))));
  const [timerEnd, setTimerEnd] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [confirm, setConfirm] = useState<"finish" | "abandon" | null>(null);
  const busy = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const total = exercises.reduce((n, e) => n + e.sets.length, 0);
  const completed = Object.values(done).filter(Boolean).length;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    const guard = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest('a[href]');
      if (link && !window.confirm("Há registros ainda não salvos. Deseja sair mesmo assim?")) { event.preventDefault(); event.stopPropagation(); }
    };
    document.addEventListener('click', guard, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener('click', guard, true); };
  }, [dirty]);
  useEffect(() => {
    if (!timerEnd) return;
    const tick = () => { const value = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000)); setRemaining(value); };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [timerEnd]);

  function submit(intent: "save" | "finish" | "abandon") {
    if (!form.current || busy.current) return;
    if (intent !== "abandon" && !form.current.reportValidity()) return;
    const data = new FormData(form.current);
    data.set("sessionId", sessionId); data.set("version", String(version)); data.set("intent", intent);
    busy.current = true; setResult({});
    startTransition(async () => {
      try {
        const response = await saveStudentWorkout(data);
        setResult(response);
        if (!response.error) { setDirty(false); setConfirm(null); if (response.version !== undefined) setVersion(response.version); }
      } catch { setResult({ error: "Sem conexão para salvar. Mantenha esta tela aberta e tente novamente." }); }
      finally { busy.current = false; }
    });
  }
  return <form ref={form} className="space-y-5" onChange={() => { setDirty(true); setResult({}); }} onSubmit={event => { event.preventDefault(); submit("save"); }} aria-busy={pending}>
    <div className="rounded-xl border border-[#dfe3e6] bg-white p-5"><div className="flex justify-between gap-3 text-sm"><strong>{completed} de {total} séries feitas</strong><span className="text-[#64707d]">{Math.round(completed / Math.max(total, 1) * 100)}%</span></div><progress className="mt-3 h-2 w-full accent-[#c84411]" value={completed} max={total} aria-label="Séries concluídas" /></div>
    <fieldset disabled={pending} className="contents space-y-5">
      {exercises.map((exercise, index) => <section key={exercise.id} className="overflow-hidden rounded-xl border border-[#dfe3e6] bg-white">
        <div className="space-y-3 border-b border-[#edf0f2] p-5"><div className="flex gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#fff7ed] font-bold text-[var(--accent)]">{index + 1}</span><div className="min-w-0"><h2 className="font-bold">{exercise.exerciseName}</h2><p className="mt-1 text-sm text-[#64707d]">{exercise.sets.length} séries · {exercise.targetRepsMin}–{exercise.targetRepsMax} {exercise.unit === 'SECONDS' ? 'segundos' : 'repetições'}</p></div></div>
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-[#64707d]">{lastLoads[exercise.exerciseId] !== undefined ? `Última carga: ${formatKg(lastLoads[exercise.exerciseId])}` : exercise.suggestedLoad !== null ? `Carga sugerida: ${formatKg(exercise.suggestedLoad)}` : 'Carga livre conforme orientação'}</p><button type="button" className="secondary-button" onClick={() => { setRemaining(exercise.restSeconds); setTimerEnd(Date.now() + exercise.restSeconds * 1000); }}><Timer className="size-4" /> Descanso {exercise.restSeconds}s</button></div>
          {(exercise.instructions || exercise.notes) && <details className="text-sm text-[#64707d]"><summary className="cursor-pointer py-2 font-semibold text-[var(--accent)]">Ver orientações</summary>{exercise.instructions && <p className="py-1 leading-6">{exercise.instructions}</p>}{exercise.notes && <p className="py-1 leading-6">{exercise.notes}</p>}</details>}
          <ExerciseVideo url={exercise.videoUrl} name={exercise.exerciseName} />
        </div>
        <div className="grid grid-cols-[2rem_1fr_1fr_2.75rem] gap-2 border-b border-[#edf0f2] px-4 py-3 text-xs font-semibold text-[#64707d] sm:px-5"><span>Série</span><span>Carga (kg)</span><span>{exercise.unit === 'SECONDS' ? 'Segundos' : 'Repetições'}</span><span>Feita</span></div>
        {exercise.sets.map(set => <div key={set.id} className={`grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-2 border-b border-[#edf0f2] px-4 py-3 last:border-0 sm:px-5 ${done[set.id] ? 'bg-emerald-50/60' : ''}`}><span className="text-sm font-bold">{set.setNumber}</span>
          <input name={`load-${set.id}`} aria-label={`${exercise.exerciseName}, série ${set.setNumber}, carga em kg`} type="number" min={0} max={1000} step="0.5" inputMode="decimal" defaultValue={set.load ?? ''} placeholder="—" className="session-input" />
          <input name={`reps-${set.id}`} aria-label={`${exercise.exerciseName}, série ${set.setNumber}, ${exercise.unit === 'SECONDS' ? 'segundos' : 'repetições'}`} type="number" min={1} max={exercise.unit === 'SECONDS' ? 600 : 100} step={1} inputMode="numeric" defaultValue={set.reps ?? ''} placeholder={`${exercise.targetRepsMin}–${exercise.targetRepsMax}`} className="session-input" />
          <label className="flex min-h-11 items-center justify-center"><input name={`done-${set.id}`} type="checkbox" checked={done[set.id]} onChange={e => setDone(prev => ({ ...prev, [set.id]: e.target.checked }))} aria-label={`Série ${set.setNumber} de ${exercise.exerciseName} feita`} className="size-6 accent-emerald-700" /></label>
        </div>)}
      </section>)}
      {timerEnd !== null && <div className="flex items-center justify-between gap-4 rounded-xl border border-[#dfe3e6] bg-[#161b22] p-4 text-white"><div role="timer" aria-label="Descanso"><p className="text-xs text-slate-300">{remaining > 0 ? 'Descanso' : 'Descanso concluído'}</p><strong className="text-2xl tabular-nums">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</strong></div><button type="button" className="icon-button text-white" onClick={() => setTimerEnd(null)} aria-label="Encerrar cronômetro"><Pause className="size-5" /></button></div>}
      <div className="sticky bottom-20 space-y-3 rounded-xl border border-[#dfe3e6] bg-white p-4 shadow-lg">
        <p className="text-sm text-[#64707d]">{dirty ? 'Há alterações ainda não salvas.' : 'Os registros salvos ficam disponíveis para retomar.'}</p>
        <div className="grid grid-cols-2 gap-3"><button type="submit" className="secondary-button"><Save className="size-4" /> Salvar progresso</button><button type="button" className="primary-button" onClick={() => setConfirm('finish')}><Check className="size-4" /> Finalizar</button></div>
        {confirm && <div className="space-y-3 border-t border-[#edf0f2] pt-4" role="group" aria-label="Confirmar encerramento"><p className="text-sm">{confirm === 'finish' ? `Finalizar com ${completed} de ${total} séries feitas? Apenas as séries marcadas serão contadas como realizadas.` : 'Encerrar este treino sem contar como concluído? O progresso já salvo será preservado no sistema.'}</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => submit(confirm)} className="primary-button">{confirm === 'finish' ? 'Confirmar finalização' : 'Encerrar treino'}</button><button type="button" className="secondary-button" onClick={() => setConfirm(null)}>Continuar treinando</button></div></div>}
        <div aria-live="polite">{pending && <p className="text-sm text-[#64707d]">Salvando…</p>}{result.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{result.error}</p>}{result.success && <p className="text-sm text-emerald-800">{result.success}</p>}</div>
      </div>
      <button type="button" onClick={() => setConfirm('abandon')} className="flex min-h-11 items-center gap-2 text-sm text-[#64707d]"><RotateCcw className="size-4" /> Encerrar sem concluir</button>
    </fieldset>
  </form>;
}
