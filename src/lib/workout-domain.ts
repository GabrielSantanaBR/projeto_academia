export type CloneableWorkoutExercise = {
  exerciseId: string;
  sortOrder: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  suggestedLoad: number | null;
  restSeconds: number;
  notes: string | null;
};

export type CloneableWorkoutDay = {
  code: string;
  name: string;
  sortOrder: number;
  exercises: CloneableWorkoutExercise[];
};

export function cloneWorkoutDays<T extends CloneableWorkoutDay>(days: T[], organizationId: string) {
  return days.map((day) => ({
    organizationId,
    code: day.code,
    name: day.name,
    sortOrder: day.sortOrder,
    exercises: {
      create: day.exercises.map((exercise) => ({
        organizationId,
        exerciseId: exercise.exerciseId,
        sortOrder: exercise.sortOrder,
        sets: exercise.sets,
        repsMin: exercise.repsMin,
        repsMax: exercise.repsMax,
        suggestedLoad: exercise.suggestedLoad,
        restSeconds: exercise.restSeconds,
        notes: exercise.notes,
      })),
    },
  }));
}

function readOptionalNumber(value: FormDataEntryValue | null, max: number) {
  if (value === null || String(value).trim() === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > max) {
    throw new Error("Registro de série inválido.");
  }
  return number;
}

export function normalizeSetLog(loadValue: FormDataEntryValue | null, repsValue: FormDataEntryValue | null) {
  const load = readOptionalNumber(loadValue, 1_000);
  const rawReps = readOptionalNumber(repsValue, 100);
  const reps = rawReps === null ? null : Math.round(rawReps);

  return {
    load,
    reps,
    hasRecord: load !== null || reps !== null,
  };
}

export function calculateSessionDuration(startedAt: Date, completedAt: Date) {
  return Math.max(1, Math.round((completedAt.getTime() - startedAt.getTime()) / 60_000));
}
