"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { createTemplate } from "@/app/actions/training";
import { inputClassName, labelClassName } from "@/components/ui";

type ExerciseOption = { id: string; name: string; muscleGroup: string };

type BuilderExercise = {
  id: string;
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  suggestedLoad: number | null;
  restSeconds: number;
  notes: string | null;
};

type BuilderDay = {
  id: string;
  code: string;
  name: string;
  exercises: BuilderExercise[];
};

const itemId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function blankExercise(exerciseId: string): BuilderExercise {
  return {
    id: itemId(),
    exerciseId,
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    suggestedLoad: null,
    restSeconds: 60,
    notes: null,
  };
}

export function TemplateBuilder({ exercises }: { exercises: ExerciseOption[] }) {
  const [days, setDays] = useState<BuilderDay[]>([
    {
      id: itemId(),
      code: "A",
      name: "Treino A",
      exercises: exercises[0] ? [blankExercise(exercises[0].id)] : [],
    },
  ]);

  const payload = JSON.stringify({
    days: days.map((day) => ({
      code: day.code,
      name: day.name,
      exercises: day.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        sets: exercise.sets,
        repsMin: exercise.repsMin,
        repsMax: exercise.repsMax,
        suggestedLoad: exercise.suggestedLoad,
        restSeconds: exercise.restSeconds,
        notes: exercise.notes,
      })),
    })),
  });

  function updateDay(dayId: string, updates: Partial<BuilderDay>) {
    setDays((current) => current.map((day) => (day.id === dayId ? { ...day, ...updates } : day)));
  }

  function updateExercise(dayId: string, exerciseId: string, updates: Partial<BuilderExercise>) {
    setDays((current) =>
      current.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: day.exercises.map((exercise) =>
                exercise.id === exerciseId ? { ...exercise, ...updates } : exercise,
              ),
            }
          : day,
      ),
    );
  }

  function removeExercise(dayId: string, exerciseId: string) {
    setDays((current) =>
      current.map((day) =>
        day.id === dayId
          ? { ...day, exercises: day.exercises.filter((exercise) => exercise.id !== exerciseId) }
          : day,
      ),
    );
  }

  return (
    <form action={createTemplate} className="space-y-7">
      <input type="hidden" name="payload" value={payload} />
      <section className="grid gap-5 border border-[#dfe3e6] bg-white p-5 sm:grid-cols-2 sm:p-7">
        <div>
          <label htmlFor="name" className={labelClassName}>Nome do template</label>
          <input id="name" name="name" required minLength={3} maxLength={120} className={inputClassName} placeholder="Ex.: Hipertrofia iniciante ABC" />
        </div>
        <div>
          <label htmlFor="description" className={labelClassName}>Descrição</label>
          <input id="description" name="description" maxLength={500} className={inputClassName} placeholder="Para quem este modelo foi pensado?" />
        </div>
      </section>

      {days.map((day) => (
        <section key={day.id} className="overflow-hidden border border-[#dfe3e6] bg-white">
          <div className="flex flex-col gap-4 border-b border-[#dfe3e6] bg-[#fafafa] p-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
            <div className="grid flex-1 gap-3 sm:grid-cols-[90px_minmax(0,1fr)]">
              <label className={labelClassName}>
                Código
                <input
                  value={day.code}
                  onChange={(event) => updateDay(day.id, { code: event.target.value.toUpperCase() })}
                  maxLength={12}
                  className={inputClassName}
                  required
                />
              </label>
              <label className={labelClassName}>
                Nome do dia
                <input
                  value={day.name}
                  onChange={(event) => updateDay(day.id, { name: event.target.value })}
                  maxLength={120}
                  className={inputClassName}
                  required
                />
              </label>
            </div>
            {days.length > 1 && (
              <button
                type="button"
                onClick={() => setDays((current) => current.filter((item) => item.id !== day.id))}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold text-[#b42318] hover:bg-[#fef2f2]"
              >
                <Trash2 className="size-4" /> Remover dia
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="text-left text-xs font-bold uppercase tracking-[0.08em] text-[#64707d]">
                <tr>
                  <th className="px-5 py-3">Exercício</th>
                  <th className="px-3 py-3">Séries</th>
                  <th className="px-3 py-3">Mín.</th>
                  <th className="px-3 py-3">Máx.</th>
                  <th className="px-3 py-3">Carga sugerida</th>
                  <th className="px-3 py-3">Descanso</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0f2]">
                {day.exercises.map((exercise) => (
                  <tr key={exercise.id}>
                    <td className="px-5 py-3">
                      <select
                        value={exercise.exerciseId}
                        onChange={(event) => updateExercise(day.id, exercise.id, { exerciseId: event.target.value })}
                        className="min-h-9 w-full rounded-md border border-[#cfd5d9] bg-white px-2 text-sm outline-none focus:border-[#e85d24]"
                        required
                      >
                        {exercises.map((option) => (
                          <option key={option.id} value={option.id}>{option.name} · {option.muscleGroup}</option>
                        ))}
                      </select>
                    </td>
                    {([
                      ["sets", 1, 12],
                      ["repsMin", 1, 100],
                      ["repsMax", 1, 100],
                      ["suggestedLoad", 0, 1_000],
                      ["restSeconds", 15, 900],
                    ] as const).map(([field, min, max]) => (
                      <td key={field} className="px-3 py-3">
                        <input
                          type="number"
                          min={min}
                          max={max}
                          step={field === "suggestedLoad" ? "0.5" : "1"}
                          value={exercise[field] ?? ""}
                          onChange={(event) => {
                            const value = event.target.value;
                            updateExercise(day.id, exercise.id, {
                              [field]: value === "" ? null : Number(value),
                            });
                          }}
                          className="min-h-9 w-20 rounded-md border border-[#cfd5d9] px-2 text-sm outline-none focus:border-[#e85d24]"
                          required={field !== "suggestedLoad"}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeExercise(day.id, exercise.id)}
                        className="inline-flex size-9 items-center justify-center rounded-md text-[#b42318] hover:bg-[#fef2f2]"
                        aria-label="Remover exercício"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[#edf0f2] px-5 py-3">
            <button
              type="button"
              disabled={!exercises[0]}
              onClick={() =>
                setDays((current) =>
                  current.map((item) =>
                    item.id === day.id
                      ? { ...item, exercises: [...item.exercises, blankExercise(exercises[0].id)] }
                      : item,
                  ),
                )
              }
              className="inline-flex items-center gap-2 text-sm font-bold text-[#c84411] hover:underline disabled:cursor-not-allowed disabled:text-[#9aa3aa]"
            >
              <Plus className="size-4" /> Adicionar exercício
            </button>
          </div>
        </section>
      ))}

      <div className="flex flex-col-reverse justify-between gap-4 border-t border-[#dfe3e6] pt-6 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() =>
            setDays((current) => [
              ...current,
              {
                id: itemId(),
                code: String.fromCharCode(65 + current.length),
                name: `Treino ${String.fromCharCode(65 + current.length)}`,
                exercises: exercises[0] ? [blankExercise(exercises[0].id)] : [],
              },
            ])
          }
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#cfd5d9] bg-white px-4 text-sm font-bold text-[#3c4650] hover:bg-[#fafafa]"
        >
          <Plus className="size-4" /> Adicionar dia de treino
        </button>
        <button
          type="submit"
          disabled={days.some((day) => day.exercises.length === 0)}
          className="min-h-10 rounded-lg bg-[#e85d24] px-5 text-sm font-bold text-white hover:bg-[#c84411] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Salvar template
        </button>
      </div>
      {exercises.length === 0 && <p className="text-sm text-[#b45309]">Cadastre pelo menos um exercício antes de montar um template.</p>}
    </form>
  );
}
