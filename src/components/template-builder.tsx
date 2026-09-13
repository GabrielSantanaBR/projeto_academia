"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { createTemplate, saveWorkoutPlan } from "@/app/actions/training";
import { ActionForm } from "@/components/action-form";
import { inputClassName, labelClassName } from "@/components/ui";
import { trainingPayloadSchema, type TrainingPayload } from "@/lib/training-input";

type ExerciseOption = { id: string; name: string; muscleGroup: string; unit?: "REPS" | "SECONDS" };
type Initial = { name: string; description: string | null; validUntil?: string; updatedAt?: string; days: TrainingPayload["days"] };
type Day = TrainingPayload["days"][number] & { key: string };
const blankExercise = (exerciseId: string) => ({ exerciseId, sets: 3, repsMin: 8, repsMax: 12, suggestedLoad: null, restSeconds: 60, notes: null });

export function TemplateBuilder({ exercises, initial, kind = "template", studentId, recordId }: {
  exercises: ExerciseOption[]; initial?: Initial; kind?: "template" | "plan"; studentId?: string; recordId?: string;
}) {
  const sequence = useRef(10);
  const [days, setDays] = useState<Day[]>(() => (initial?.days ?? [{ code: "A", name: "Treino A", exercises: exercises[0] ? [blankExercise(exercises[0].id)] : [] }]).map((d, i) => ({ ...d, key: `day-${i}` })));
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const valid = trainingPayloadSchema.safeParse({ days });
  const total = days.reduce((n, d) => n + d.exercises.length, 0);
  const filteredOptions = exercises.filter(e => `${e.name} ${e.muscleGroup}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()));
  function updateDay(key: string, patch: Partial<Day>) { setDirty(true); setDays(prev => prev.map(d => d.key === key ? { ...d, ...patch } : d)); }
  function move(key: string, from: number, to: number) {
    const day = days.find(d => d.key === key)!;
    const next = [...day.exercises];
    [next[from], next[to]] = [next[to], next[from]];
    updateDay(key, { exercises: next });
  }
  return <ActionForm action={kind === "plan" ? saveWorkoutPlan : createTemplate} className="space-y-6">
    <input type="hidden" name="payload" value={JSON.stringify({ days })} />
    {studentId && <input type="hidden" name="studentId" value={studentId} />}
    {recordId && <input type="hidden" name={kind === "plan" ? "planId" : "templateId"} value={recordId} />}
    {initial?.updatedAt && <input type="hidden" name="updatedAt" value={initial.updatedAt} />}
    <section className="grid gap-5 rounded-xl border border-[#dfe3e6] bg-white p-5 sm:grid-cols-2 sm:p-7">
      <label className={labelClassName}>Nome do {kind === "plan" ? "treino" : "modelo"}<input name="name" required minLength={3} maxLength={120} defaultValue={initial?.name} className={inputClassName} placeholder="Ex.: Condicionamento ABC" /></label>
      <label className={labelClassName}>Descrição<input name="description" maxLength={500} defaultValue={initial?.description ?? ""} className={inputClassName} placeholder="Objetivo e orientações para este ciclo" /></label>
      {kind === "plan" && <label className={labelClassName}>Válido até<input name="validUntil" type="date" defaultValue={initial?.validUntil} className={inputClassName} /><span className="mt-1 block text-sm font-normal text-[#64707d]">Sem data informada: 6 semanas.</span></label>}
      <div className="flex items-center gap-5 text-sm text-[#64707d]"><strong className="text-[#161b22]">{days.length} dias</strong><span>{total} exercícios</span><span>Até 7 dias e 20 exercícios por dia</span></div>
    </section>
    <label className={`${labelClassName} max-w-lg`}>Filtrar catálogo<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar exercício ou grupo muscular" className={inputClassName} /></label>
    {days.map(day => <section key={day.key} className="overflow-hidden rounded-xl border border-[#dfe3e6] bg-white">
      <div className="flex flex-wrap items-end gap-3 border-b border-[#dfe3e6] bg-[#fafafa] p-5">
        <label className={`${labelClassName} w-20`}>Código<input required maxLength={12} value={day.code} onChange={e => updateDay(day.key, { code: e.target.value.toUpperCase() })} className={inputClassName} /></label>
        <label className={`${labelClassName} min-w-40 flex-1`}>Nome do dia<input required minLength={2} maxLength={120} value={day.name} onChange={e => updateDay(day.key, { name: e.target.value })} className={inputClassName} /></label>
        {days.length > 1 && <button type="button" className="secondary-button text-red-700" onClick={() => { setDirty(true); setDays(prev => prev.filter(d => d.key !== day.key)); }}><Trash2 className="size-4" /> Remover dia</button>}
      </div>
      <div className="divide-y divide-[#e5e7e9]">
        {day.exercises.map((item, index) => {
          const selected = exercises.find(e => e.id === item.exerciseId);
          const options = filteredOptions.some(e => e.id === item.exerciseId) || !selected ? filteredOptions : [selected, ...filteredOptions];
          const change = (patch: Partial<typeof item>) => updateDay(day.key, { exercises: day.exercises.map((e, i) => i === index ? { ...e, ...patch } : e) });
          return <div key={`${day.key}-${index}`} className="space-y-4 p-5">
            <div className="flex items-end gap-3">
              <label className={`${labelClassName} min-w-0 flex-1`}>{index + 1}. Exercício<select value={item.exerciseId} required onChange={e => change({ exerciseId: e.target.value })} className={inputClassName}>{options.map(e => <option key={e.id} value={e.id}>{e.name} · {e.muscleGroup}{e.unit === "SECONDS" ? " · tempo" : ""}</option>)}</select></label>
              <button type="button" onClick={() => updateDay(day.key, { exercises: day.exercises.filter((_, i) => i !== index) })} className="icon-button text-red-700" aria-label={`Remover exercício ${index + 1}`}><Trash2 className="size-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {([['sets', 'Séries', 1, 12], ['repsMin', selected?.unit === 'SECONDS' ? 'Mín. (s)' : 'Repetições mín.', 1, selected?.unit === 'SECONDS' ? 600 : 100], ['repsMax', selected?.unit === 'SECONDS' ? 'Máx. (s)' : 'Repetições máx.', 1, selected?.unit === 'SECONDS' ? 600 : 100], ['suggestedLoad', 'Carga (kg)', 0, 1000], ['restSeconds', 'Descanso (s)', 15, 900]] as const).map(([field, label, min, max]) => <label key={field} className={labelClassName}>{label}<input type="number" min={min} max={max} step={field === 'suggestedLoad' ? '0.5' : '1'} required={field !== 'suggestedLoad'} value={item[field] ?? ''} onChange={e => change({ [field]: e.target.value === '' ? null : Number(e.target.value) })} className={inputClassName} /></label>)}
            </div>
            <div className="flex flex-wrap items-end gap-3"><label className={`${labelClassName} min-w-40 flex-1`}>Orientação para o aluno<input maxLength={500} value={item.notes ?? ''} onChange={e => change({ notes: e.target.value || null })} className={inputClassName} placeholder="Opcional" /></label><div className="flex gap-1"><button type="button" className="icon-button" disabled={index === 0} onClick={() => move(day.key, index, index - 1)} aria-label={`Mover exercício ${index + 1} para cima`}><ArrowUp className="size-4" /></button><button type="button" className="icon-button" disabled={index === day.exercises.length - 1} onClick={() => move(day.key, index, index + 1)} aria-label={`Mover exercício ${index + 1} para baixo`}><ArrowDown className="size-4" /></button></div></div>
          </div>;
        })}
      </div>
      <div className="border-t border-[#edf0f2] p-4"><button type="button" className="secondary-button" disabled={!exercises.length || day.exercises.length >= 20} onClick={() => updateDay(day.key, { exercises: [...day.exercises, blankExercise(filteredOptions[0]?.id ?? exercises[0].id)] })}><Plus className="size-4" /> Adicionar exercício</button></div>
    </section>)}
    {dirty && !valid.success && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Confira os códigos dos dias e as metas. Cada dia precisa de pelo menos um exercício, com mínimo menor ou igual ao máximo.</p>}
    {!exercises.length && <p className="text-sm text-amber-900">Cadastre pelo menos um exercício para montar o treino. <Link href="/exercises/new" className="underline">Cadastrar exercício</Link></p>}
    <div className="sticky bottom-0 flex flex-col justify-between gap-3 rounded-xl border border-[#dfe3e6] bg-white p-4 shadow-sm sm:flex-row">
      <button type="button" disabled={days.length >= 7} className="secondary-button" onClick={() => {
        const code = 'ABCDEFG'.split('').find(c => !days.some(d => d.code === c)) ?? `D${days.length + 1}`;
        setDays(prev => [...prev, { key: `new-${sequence.current++}`, code, name: `Treino ${code}`, exercises: exercises[0] ? [blankExercise(exercises[0].id)] : [] }]);
      }}><Plus className="size-4" /> Adicionar dia</button>
      <button type="submit" disabled={!valid.success} className="primary-button">{kind === 'plan' ? 'Publicar treino para o aluno' : 'Salvar modelo'}</button>
    </div>
  </ActionForm>;
}
