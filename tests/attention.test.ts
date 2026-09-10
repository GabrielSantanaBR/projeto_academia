import { describe, expect, it } from "vitest";

import { getAttentionItems } from "../src/lib/attention";

const now = new Date("2026-09-04T12:00:00.000Z");
const daysBefore = (days: number) => new Date(now.getTime() - days * 86_400_000);
const daysAfter = (days: number) => new Date(now.getTime() + days * 86_400_000);

describe("attention calculation", () => {
  it("prioritizes new students without a workout", () => {
    const result = getAttentionItems(
      [
        {
          id: "new-student",
          name: "Ana",
          firstEnrolledAt: daysBefore(3),
          plan: null,
          lastCompletedAt: null,
        },
      ],
      { now },
    );

    expect(result[0]).toMatchObject({
      reason: "NEW_WITHOUT_WORKOUT",
      description: "Novo aluno sem treino",
      priority: 1,
    });
  });

  it("identifies expired, expiring, and inactive cases from real dates", () => {
    const result = getAttentionItems(
      [
        {
          id: "expired",
          name: "Bruno",
          firstEnrolledAt: daysBefore(90),
          plan: { id: "plan-1", validUntil: daysBefore(1) },
          lastCompletedAt: daysBefore(1),
        },
        {
          id: "expiring",
          name: "Carla",
          firstEnrolledAt: daysBefore(90),
          plan: { id: "plan-2", validUntil: daysAfter(2) },
          lastCompletedAt: daysBefore(1),
        },
        {
          id: "inactive",
          name: "Diego",
          firstEnrolledAt: daysBefore(90),
          plan: { id: "plan-3", validUntil: daysAfter(30) },
          lastCompletedAt: daysBefore(12),
        },
      ],
      { now },
    );

    expect(result.map((item) => item.reason)).toEqual([
      "EXPIRED_WORKOUT",
      "EXPIRING_WORKOUT",
      "INACTIVE_STUDENT",
    ]);
  });
});
