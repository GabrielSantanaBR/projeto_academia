"use client";

import { useState } from "react";
import { RouteMap } from "@/components/route-map";
import type { RunPoint } from "@/lib/running";

export function RunHistoryMap({ points }: { points: RunPoint[] }) {
  const [open, setOpen] = useState(false);
  return <div className="mt-3"><button type="button" className="text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline" onClick={() => setOpen(value => !value)}>{open ? "Fechar mapa" : "Abrir mapa da corrida"}</button>{open && <div className="mt-3"><RouteMap points={points} /></div>}</div>;
}
