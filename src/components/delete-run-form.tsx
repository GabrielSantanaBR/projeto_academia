"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRunActivity } from "@/app/actions/running";

export function DeleteRunForm({ runId }: { runId: string }) {
  const [pending,startTransition] = useTransition();
  const [error,setError] = useState("");
  const router = useRouter();
  return <div className="mt-3"><button type="button" disabled={pending} className="text-xs font-semibold text-[#a34e26] underline-offset-4 hover:underline" onClick={() => {
    if (!window.confirm("Excluir esta corrida e o trajeto em definitivo?")) return;
    setError("");
    const data = new FormData(); data.set("runId",runId);
    startTransition(async () => { try { const result = await deleteRunActivity(data); if (result.error) setError(result.error); else router.refresh(); } catch { setError("Não foi possível excluir agora. Tente novamente."); } });
  }}>{pending ? "Excluindo…" : "Excluir corrida"}</button>{error && <p role="alert" className="text-xs text-red-700">{error}</p>}</div>;
}
