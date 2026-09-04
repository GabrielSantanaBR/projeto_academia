import { describe, expect, it } from "vitest";

import { calculateSessionDuration, cloneWorkoutDays, normalizeSetLog } from "../src/lib/workout-domain";

describe("workout assignment and logging", () => {
  it("clones a template into an independent workout plan payload", () => {
    const original = [
      {
        code: "A",
        name: "Peito",
        sortOrder: 1,
        exercises: [
          {
            exerciseId: "supino",
            sortOrder: 1,
            sets: 4,
            repsMin: 8,
            repsMax: 10,
            suggestedLoad: 70,
            restSeconds: 90,
            notes: "Controle o movimento",
          },
        ],
      },
    ];

    const cloned = cloneWorkoutDays(original, "gym-a");

    expect(cloned).toEqual([
      {
        organizationId: "gym-a",
        code: "A",
        name: "Peito",
        sortOrder: 1,
        exercises: {
          create: [
            expect.objectContaining({
              organizationId: "gym-a",
              exerciseId: "supino",
              sets: 4,
              suggestedLoad: 70,
            }),
          ],
        },
      },
    ]);
    expect(cloned[0].exercises.create[0]).not.toBe(original[0].exercises[0]);
  });

  it("normalizes valid logged sets and calculates a session duration", () => {
    expect(normalizeSetLog("70", "10")).toEqual({ load: 70, reps: 10, hasRecord: true });
    expect(normalizeSetLog("", "")).toEqual({ load: null, reps: null, hasRecord: false });
    expect(
      calculateSessionDuration(
        new Date("2026-09-04T10:00:00.000Z"),
        new Date("2026-09-04T10:47:00.000Z"),
      ),
    ).toBe(47);
  });

  it("rejects invalid series values before persistence", () => {
    expect(() => normalizeSetLog("-5", "10")).toThrow("Registro de série inválido");
    expect(() => normalizeSetLog("80", "101")).toThrow("Registro de série inválido");
  });
});
