import { Dumbbell } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="Movimento, início" className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent)] text-white shadow-sm">
        <Dumbbell className="size-5" strokeWidth={2.4} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            Movimento
          </span>
          <span className="mt-1 block text-base font-bold tracking-tight text-[#161b22]">
            Gestão de treino
          </span>
        </span>
      )}
    </Link>
  );
}
