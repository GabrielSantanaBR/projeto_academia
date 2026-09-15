import { z } from "zod";

export const trainingPayloadSchema = z.object({
  days: z.array(z.object({
    code: z.string().trim().min(1).max(12).transform(v => v.toUpperCase()),
    name: z.string().trim().min(2).max(120),
    exercises: z.array(z.object({
      exerciseId: z.string().min(1), sets: z.number().int().min(1).max(12),
      repsMin: z.number().int().min(1).max(600), repsMax: z.number().int().min(1).max(600),
      suggestedLoad: z.number().finite().min(0).max(1000).nullable(),
      restSeconds: z.number().int().min(15).max(900), notes: z.string().trim().max(500).nullable(),
    }).refine(v => v.repsMin <= v.repsMax, "A meta mínima não pode superar a máxima.")).min(1).max(20),
  })).min(1).max(7),
}).refine(v => new Set(v.days.map(d => d.code)).size === v.days.length, "Cada dia deve ter um código diferente.");

export type TrainingPayload = z.infer<typeof trainingPayloadSchema>;

export function planExpiry(value?: string, now = new Date()) {
  // Calendar dates are interpreted in the academy's Brazil timezone, never the host timezone.
  if (!value) return new Date(now.getTime() + 42 * 86_400_000);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Data inválida.");
  const date = new Date(`${value}T23:59:59.999-03:00`);
  const calendar = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || calendar.toISOString().slice(0,10) !== value || date <= now) throw new Error("A validade precisa ser uma data atual ou futura.");
  return date;
}
