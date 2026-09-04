const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
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
  const difference = Math.floor((now.getTime() - value.getTime()) / 86_400_000);
  if (difference <= 0) return "Hoje";
  if (difference === 1) return "Ontem";
  return `Há ${difference} dias`;
}

export function formatAge(birthDate?: Date | null) {
  if (!birthDate) return "—";
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const birthdayThisYear = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (birthdayThisYear > now) age -= 1;
  return `${age} anos`;
}

export function toDateInputValue(value?: Date | null) {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
