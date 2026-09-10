import { z } from "zod";

export const optionalText = (maxLength: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(maxLength).optional(),
  );

export const optionalNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : value;
  },
  z.number().finite().nonnegative().optional(),
);

export const optionalDate = z.preprocess(
  (value) => {
    if (!value) return undefined;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? value : date;
  },
  z.date().optional(),
);

export function formValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}
