"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pause, Play, Save, Square } from "lucide-react";
import { saveRunActivity } from "@/app/actions/running";
import { metersBetween, paceLabel, type RunPoint } from "@/lib/running";
import { RouteMap } from "@/components/route-map";

type Mode = "idle" | "starting" | "running" | "paused";
export function RunRecorder() {
  const [mode, setMode] = useState<Mode>("idle");
  const modeRef = useRef<Mode>("idle");
  const [points, setPoints] = useState<RunPoint[]>([]);
  const pointsRef = useRef<RunPoint[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const watch = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const activeFrom = useRef<number | null>(null);
  const activeMs = useRef(0);
  const segment = useRef(0);
  const router = useRouter();
  const setStatus = (value: Mode) => { modeRef.current = value; setMode(value); };
  const clearWatch = () => { if (watch.current !== null && typeof navigator !== "undefined") { navigator.geolocation.clearWatch(watch.current); watch.current = null; } };
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(Math.floor((activeMs.current + (activeFrom.current ? Date.now() - activeFrom.current : 0)) / 1000)), 1000);
    const beforeUnload = (event: BeforeUnloadEvent) => { if (modeRef.current !== "idle") { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", beforeUnload);
    return () => { window.clearInterval(timer); window.removeEventListener("beforeunload", beforeUnload); clearWatch(); };
  }, []);
  function pause() {
    clearWatch();
    if (activeFrom.current !== null) activeMs.current += Date.now() - activeFrom.current;
    activeFrom.current = null;
    setStatus("paused");
    setSeconds(Math.floor(activeMs.current / 1000));
  }
  function begin() {
    if (!navigator.geolocation || !window.isSecureContext) { setNotice("O GPS exige um navegador compatível e HTTPS. Abra a academia em uma conexão segura."); return; }
    if (modeRef.current === "running" || modeRef.current === "starting") return;
    setNotice("Aguardando sinal do GPS… Permita a localização quando o navegador solicitar.");
    setStatus("starting");
    if (startTime.current === null) startTime.current = Date.now();
    else segment.current = (pointsRef.current.at(-1)?.segment ?? -1) + 1;
    watch.current = navigator.geolocation.watchPosition(position => {
      if (modeRef.current !== "starting" && modeRef.current !== "running") return;
      const { latitude: lat, longitude: lng, accuracy } = position.coords;
      if (accuracy > 50) { setNotice(`Aguardando sinal melhor (precisão atual: ${Math.round(accuracy)} m).`); return; }
      const point: RunPoint = { lat, lng, t: Date.now(), segment: segment.current };
      const prev = pointsRef.current.at(-1);
      if (prev) {
        const meters = metersBetween(prev, point);
        if (point.segment === prev.segment && (point.t - prev.t < 2500 || meters < 5 || meters / Math.max((point.t - prev.t) / 1000, 1) > 12)) return;
      }
      if (pointsRef.current.length >= 2000) { pause(); setNotice("Limite de pontos atingido. Salve sua corrida."); return; }
      pointsRef.current = [...pointsRef.current, point]; setPoints(pointsRef.current);
      if (modeRef.current === "starting") { activeFrom.current = Date.now(); setStatus("running"); }
      setNotice("");
    }, error => { clearWatch(); setStatus("paused"); setNotice(error.code === 1 ? "Localização negada. Autorize o GPS no navegador para registrar a corrida." : "GPS indisponível no momento. Verifique o sinal e tente continuar."); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  }
  const distance = points.reduce((sum,p,i) => i && p.segment === points[i-1].segment ? sum + metersBetween(points[i-1],p) : sum, 0);
  function save() {
    if (modeRef.current === "running") pause();
    if (!startTime.current || pointsRef.current.length < 2) { setNotice("Aguarde ao menos dois pontos de GPS antes de salvar."); return; }
    const data = new FormData();
    data.set("startedAt", new Date(startTime.current).toISOString());
    data.set("durationSeconds", String(Math.floor(activeMs.current / 1000)));
    data.set("points", JSON.stringify(pointsRef.current));
    setNotice("Salvando corrida…");
    startTransition(async () => {
      try {
        const result = await saveRunActivity(data);
        if (result.error) { setNotice(result.error); return; }
        setNotice(result.success ?? "Corrida salva.");
        pointsRef.current = []; setPoints([]); activeMs.current = 0; activeFrom.current = null; startTime.current = null; segment.current = 0; setSeconds(0); setStatus("idle"); router.replace("/my-runs"); router.refresh();
      } catch { setNotice("Sem conexão. Seu trajeto ainda está nesta tela; tente salvar novamente."); }
    });
  }
  function discard() {
    if (!window.confirm("Descartar esta corrida? O trajeto ainda não foi salvo.")) return;
    clearWatch(); pointsRef.current = []; setPoints([]); activeMs.current = 0; activeFrom.current = null; startTime.current = null; segment.current = 0; setSeconds(0); setStatus("idle"); setNotice("");
  }
  return <section className="overflow-hidden border border-[#dfe3e6] bg-white"><div className="bg-[#172b46] p-6 text-white sm:p-8"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-[#ffbc94]"><MapPin className="size-4" /> Corrida com GPS</p><div className="mt-7 grid grid-cols-3 gap-4"><div><p className="text-xs text-slate-300">Tempo ativo</p><strong className="mt-1 block text-2xl tabular-nums sm:text-3xl">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,"0")}</strong></div><div><p className="text-xs text-slate-300">Distância</p><strong className="mt-1 block text-2xl tabular-nums sm:text-3xl">{(distance/1000).toFixed(2)}<span className="text-sm"> km</span></strong></div><div><p className="text-xs text-slate-300">Ritmo</p><strong className="mt-1 block text-xl tabular-nums sm:text-2xl">{paceLabel(distance,seconds)}</strong></div></div></div>
    {points.length > 0 && <RouteMap points={points} />}
    <div className="space-y-4 p-5"><p className="text-sm text-[#465568]">{mode === "idle" ? "Toque em iniciar para ativar o GPS. O trajeto fica particular na sua conta." : mode === "starting" ? "Procurando sua localização…" : mode === "running" ? "Gravando somente enquanto esta página estiver aberta." : "Corrida pausada. Continue ou salve seu trajeto."}</p><div className="flex flex-wrap gap-2">{mode === "idle" || mode === "paused" ? <button type="button" onClick={begin} disabled={pending} className="primary-button"><Play className="size-4" /> {mode === "idle" ? "Iniciar corrida" : "Continuar"}</button> : <button type="button" onClick={pause} disabled={mode === "starting"} className="secondary-button"><Pause className="size-4" /> Pausar</button>}{mode === "paused" && <button type="button" onClick={save} disabled={pending} className="secondary-button"><Save className="size-4" /> Salvar corrida</button>}{mode !== "idle" && <button type="button" onClick={discard} disabled={pending} className="secondary-button"><Square className="size-4" /> Descartar</button>}</div><p role="status" aria-live="polite" className="text-sm text-[#a34e26]">{notice}</p><p className="text-xs leading-5 text-[#64707d]">O GPS funciona com HTTPS e permissão do navegador; em segundo plano ou com a tela bloqueada, o rastreamento pode parar. O mapa usa blocos do OpenStreetMap ao ser exibido.</p></div>
  </section>;
}
