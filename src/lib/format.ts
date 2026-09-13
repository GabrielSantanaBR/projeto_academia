const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value?: Date | null) {
  return value ? dateFormatter.format(value) : "—";
}

export function formatDateTime(value?: Date | null) {
  return value ? dateTimeFormatter.format(value) : "—";
}

export function formatKg(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;
}

export function formatCm(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} cm`;
}

export function formatDuration(minutes?: number | null) {
  if (!minutes) return "—";
  return `${minutes} min`;
}

export function formatRelativeDate(value?: Date | null, now = new Date()) {
  if (!value) return "Sem registro";
  const difference = Math.round((Date.parse(toDateInputValue(now)) - Date.parse(toDateInputValue(value))) / 86_400_000);
  if (difference <= 0) return "Hoje";
  if (difference === 1) return "Ontem";
  return `Há ${difference} dias`;
}

export function formatAge(birthDate?: Date | null) {
  if (!birthDate) return "—";
  const today = toDateInputValue(new Date());
  const birthday = toDateInputValue(birthDate);
  let age = Number(today.slice(0, 4)) - Number(birthday.slice(0, 4));
  if (today.slice(5) < birthday.slice(5)) age -= 1;
  return `${age} anos`;
}

export function toDateInputValue(value?: Date | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
