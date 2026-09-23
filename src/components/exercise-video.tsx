"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { videoEmbedUrl } from "@/lib/video";

export function ExerciseVideo({ url, name }: { url: string | null; name: string }) {
  const [open, setOpen] = useState(false);
  const embed = videoEmbedUrl(url);
  if (!embed) return null;
  return <div className="mt-3">
    {open ? <div className="aspect-video max-w-xl overflow-hidden rounded-xl bg-[#101c32]"><iframe title={`Demonstração: ${name}`} src={embed} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="h-full w-full" /></div> : <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#cfd5d9] bg-white px-3 text-sm font-semibold text-[#1b365a]"><Play className="size-4" /> Ver demonstração em vídeo</button>}
    <p className="mt-1 text-xs text-[#64707d]">Ao abrir, o provedor de vídeo recebe dados de navegação. Siga as orientações do seu professor.</p>
  </div>;
}
