"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";

/** Preserve entered values on validation/network errors; block duplicate submissions. */
export function ActionForm({ action, children, className, id }: {
  action: (data: FormData) => Promise<ActionResult | void>;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const [result, setResult] = useState<ActionResult>({});
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  const router = useRouter();
  return <form id={id} className={`${className ?? ""} action-form`} aria-busy={pending} onSubmit={(event) => {
    event.preventDefault();
    if (busy.current) return;
    const data = new FormData(event.currentTarget);
    busy.current = true;
    setResult({});
    startTransition(async () => {
      try {
        const next = await action(data);
        setResult(next ?? {});
        if (next?.success) router.refresh();
      } catch {
        setResult({ error: "A conexão foi interrompida. Confira sua internet e tente salvar novamente." });
      } finally { busy.current = false; }
    });
  }}>
    <fieldset disabled={pending} className={`contents ${className?.match(/(?:^|\s)(?:[a-z]+:)?space-y-[^\s]+/g)?.join(" ") ?? ""}`}>{children}</fieldset>
    <div className="form-feedback" aria-live="polite" aria-atomic="true">
      {pending && <p className="text-sm text-[#64707d]">Salvando…</p>}
      {result.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{result.error}</p>}
      {result.success && <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{result.success}</p>}
    </div>
  </form>;
}
