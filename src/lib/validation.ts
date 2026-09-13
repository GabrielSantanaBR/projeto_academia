import { z } from "zod";

export const optionalText = (maxLength: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(maxLength).optional(),
  );

export const optionalNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const number = Number(typeof value === "string" ? value.trim().replace(",", ".") : value);
    return Number.isFinite(number) ? number : value;
  },
  z.number().finite().nonnegative().optional(),
);

export const optionalDate = z.preprocess(
  (value) => {
    if (!value) return undefined;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(`${value}T12:00:00.000Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? value : date;
  },
  z.date().optional(),
);

export function formValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}
