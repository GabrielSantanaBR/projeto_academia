import { z } from "zod";
import { InputError } from "@/lib/action-result";

export const runPoint = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  t: z.number().int().nonnegative(),
  segment: z.number().int().nonnegative().max(100),
}).strict();
export type RunPoint = z.infer<typeof runPoint>;

export function metersBetween(a: Pick<RunPoint,"lat"|"lng">, b: Pick<RunPoint,"lat"|"lng">) {
  const radians = Math.PI / 180;
  const dLat = (b.lat - a.lat) * radians;
  const dLon = (b.lng - a.lng) * radians;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function validateRun(points: RunPoint[], durationSeconds: number, startedAt: Date, now = new Date()) {
  if (points.length < 2 || points.length > 2000) throw new InputError("Registre pelo menos dois pontos de GPS antes de salvar a corrida.");
  if (!Number.isInteger(durationSeconds) || durationSeconds < 10 || durationSeconds > 86_400) throw new InputError("A duração da corrida é inválida.");
  const wallTime = now.getTime() - startedAt.getTime();
  if (!Number.isFinite(wallTime) || wallTime < 10_000 || wallTime > 86_400_000 || durationSeconds * 1000 > wallTime + 30_000) throw new InputError("Confira o horário do dispositivo e reinicie a corrida.");
  if (points[0].t < startedAt.getTime() - 30_000 || points.at(-1)!.t > now.getTime() + 30_000) throw new InputError("Os pontos de GPS não correspondem ao horário da corrida.");
  let distance = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]; const point = points[i];
    if (point.t <= prev.t || point.t > now.getTime() + 30_000 || point.segment < prev.segment || point.segment > prev.segment + 1) throw new InputError("Os dados de localização estão fora de ordem.");
    if (point.segment !== prev.segment) continue;
    const meters = metersBetween(prev, point);
    if (meters / ((point.t - prev.t) / 1000) <= 12 && meters >= 3) distance += meters;
  }
  if (distance < 10) throw new InputError("Caminhe alguns metros com o GPS ativado antes de salvar.");
  if (distance > durationSeconds * 12) throw new InputError("A distância registrada é incompatível com a duração.");
  return Math.round(distance);
}

export function paceLabel(distanceMeters: number, durationSeconds: number) {
  if (!distanceMeters) return "—";
  const total = Math.round(durationSeconds * 1000 / distanceMeters);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2,"0")} /km`;
}
