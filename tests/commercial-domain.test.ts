import { describe, expect, it } from "vitest";
import { trainingPayloadSchema, planExpiry } from "../src/lib/training-input";
import { csvCell, toCsv } from "../src/lib/csv";
import { optionalDate, optionalNumber } from "../src/lib/validation";
import { normalizeSetLog } from "../src/lib/workout-domain";
import { isPlanCurrent, getAttentionItems } from "../src/lib/attention";
import { toDateInputValue, formatRelativeDate } from "../src/lib/format";

const day = { code: "A", name: "Treino A", exercises: [{ exerciseId: "exercise", sets: 3, repsMin: 8, repsMax: 12, suggestedLoad: null, restSeconds: 60, notes: null }] };
describe("commercial readiness boundaries", () => {
  it("validates complete plans and rejects duplicate normalized day codes", () => {
    expect(trainingPayloadSchema.safeParse({ days: [day] }).success).toBe(true);
    expect(trainingPayloadSchema.safeParse({ days: [day, { ...day, code: " a " }] }).success).toBe(false);
  });
  it("rejects empty days, excessive days and reversed rep ranges", () => {
    expect(trainingPayloadSchema.safeParse({ days: [{ ...day, exercises: [] }] }).success).toBe(false);
    expect(trainingPayloadSchema.safeParse({ days: Array.from({ length: 8 }, (_, i) => ({ ...day, code: String(i) })) }).success).toBe(false);
    expect(trainingPayloadSchema.safeParse({ days: [{ ...day, exercises: [{ ...day.exercises[0], repsMin: 15 }] }] }).success).toBe(false);
  });
  it("uses the end of a Brazil calendar day and rejects impossible dates", () => {
    expect(planExpiry("2026-09-10", new Date("2026-09-10T23:00:00Z")).toISOString()).toBe("2026-09-11T02:59:59.999Z");
    expect(() => planExpiry("2026-02-31", new Date("2026-01-01"))).toThrow();
    expect(() => planExpiry("2026-09-09", new Date("2026-09-10T12:00:00Z"))).toThrow();
  });
  it("keeps the plan current across UTC midnight until Brazil midnight", () => {
    const expiry = new Date("2026-09-11T02:59:59.999Z");
    expect(isPlanCurrent(expiry, new Date("2026-09-11T02:00:00Z"))).toBe(true);
    expect(isPlanCurrent(expiry, new Date("2026-09-11T03:00:00Z"))).toBe(false);
  });
  it("preserves the selected validity date when reopening an editor on a UTC server", () => {
    const now = new Date("2026-09-10T12:00:00Z");
    const saved = planExpiry("2026-10-01", now);
    expect(toDateInputValue(saved)).toBe("2026-10-01");
    expect(planExpiry(toDateInputValue(saved), now)).toEqual(saved);
    expect(formatRelativeDate(new Date("2026-09-10T23:00:00-03:00"), new Date("2026-09-11T01:00:00-03:00"))).toBe("Ontem");
  });
  it("does not mark a new student with a valid plan as inactive on their first day", () => {
    const now = new Date("2026-09-10T12:00:00Z");
    expect(getAttentionItems([{ id: "s", name: "Aluno", firstEnrolledAt: now, plan: { id: "p", validUntil: null } }], { now })).toHaveLength(0);
  });
  it("accepts Brazilian decimal entry and validates real calendar dates", () => {
    expect(optionalNumber.parse("72,5")).toBe(72.5);
    expect(optionalDate.safeParse("2026-02-31").success).toBe(false);
    expect(optionalDate.parse("2026-09-10")?.toISOString()).toBe("2026-09-10T12:00:00.000Z");
  });
  it("rejects fractional reps and accepts timed exercise logs", () => {
    expect(() => normalizeSetLog("20", "8.5")).toThrow();
    expect(normalizeSetLog("", "120", 600).reps).toBe(120);
    expect(() => normalizeSetLog("", "601", 600)).toThrow();
  });
  it("neutralizes spreadsheet formulas and quotes delimiters", () => {
    for (const value of ['=1+1', '+SUM(A1)', '@SUM(A1)', '-1+2', '  =1', '\t=1']) expect(csvCell(value)).toMatch(/^"'/);
    expect(csvCell('Ana; "B"')).toBe('"Ana; ""B"""');
    expect(toCsv([["Nome", "Telefone"], ["João", "+5521999999999"]])).toContain('\uFEFF"Nome";"Telefone"\r\n');
  });
});
