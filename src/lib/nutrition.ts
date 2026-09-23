import type { Prisma } from "@prisma/client";
import { z } from "zod";

export function nutritionMeals(value: Prisma.JsonValue): { title: string; details: string }[] {
  const parsed = z.array(z.object({ title: z.string(), details: z.string() })).safeParse(value);
  return parsed.success ? parsed.data : [];
}
