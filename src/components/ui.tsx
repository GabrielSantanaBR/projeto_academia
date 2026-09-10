import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col justify-between gap-5 border-b border-[#dfe3e6] pb-6 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#e85d24]">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-[#161b22] sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64707d]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function ButtonLink({
  href,
  children,
  className,
  variant = "primary",
  ...props
}: ComponentProps<typeof Link> & { variant?: "primary" | "secondary" }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors",
        variant === "primary"
          ? "bg-[#e85d24] text-white hover:bg-[#c84411]"
          : "border border-[#cfd5d9] bg-white text-[#27313a] hover:border-[#aeb7bd] hover:bg-[#fafafa]",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
}) {
  const tones = {
    neutral: "bg-[#edf0f2] text-[#56616c]",
    success: "bg-[#dcfce7] text-[#166534]",
    warning: "bg-[#fef3c7] text-[#92400e]",
    danger: "bg-[#fee2e2] text-[#b42318]",
    accent: "bg-[#ffedd5] text-[#c2410c]",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function Metric({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "default" | "accent" | "alert";
}) {
  return (
    <div
      className={cn(
        "border-l-2 px-4 py-3",
        tone === "accent" && "border-[#e85d24] bg-[#fff7ed]",
        tone === "alert" && "border-[#dc2626] bg-[#fef2f2]",
        tone === "default" && "border-[#cfd5d9] bg-white",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64707d]">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[#161b22]">{value}</p>
      {helper && <p className="mt-1 text-xs leading-5 text-[#64707d]">{helper}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-[#cfd5d9] bg-white px-6 py-12 text-center">
      <h2 className="font-semibold text-[#161b22]">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#64707d]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-bold text-[#161b22]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[#64707d]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export const inputClassName =
  "mt-1 block min-h-10 w-full rounded-lg border border-[#cfd5d9] bg-white px-3 py-2 text-sm text-[#161b22] outline-none transition placeholder:text-[#9aa3aa] focus:border-[#e85d24] focus:ring-2 focus:ring-[#fed7aa]";

export const labelClassName = "block text-sm font-semibold text-[#3c4650]";
