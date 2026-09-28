"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveOutdoorRun } from "@/app/actions/member-features";
type Point = { lat: number; lng: number; at: number };
export function RunTracker() {
 const watch = useRef<number | null>(null), points = useRef<Point[]>([]);
 const [active, setActive] = useState(false), [message, setMessage] = useState("Permita o acesso à localização para iniciar."), [count, setCount] = useState(0);
 const [pending, startTransition] = useTransition();
 useEffect(() => () => { if (watch.current !== null) navigator.geolocation.clearWatch(watch.current); }, []);
 function start() {
  if (!navigator.geolocation) { setMessage("GPS indisponível neste dispositivo."); return; }
  points.current = []; setCount(0);
  watch.current = navigator.geolocation.watchPosition(position => {
   if (position.coords.accuracy > 100) { setMessage("Aguardando sinal GPS mais preciso..."); return; }
   const next = { lat: position.coords.latitude, lng: position.coords.longitude, at: Date.now() };
   const last = points.current.at(-1);
   if (!last || next.at - last.at >= 10000) { if (points.current.length >= 500) { setMessage("Limite de pontos atingido. Finalize e salve esta corrida."); return; } points.current.push(next); setCount(points.current.length); setMessage("Rota sendo registrada neste aparelho."); }
  }, () => setMessage("Não foi possível obter a localização. Verifique a permissão e o sinal GPS."), { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  setActive(true);
 }
 function finish() {
  if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
  watch.current = null; setActive(false);
  if (points.current.length < 2) { setMessage("São necessários ao menos dois pontos válidos para salvar."); return; }
  const data = new FormData(); data.set("route", JSON.stringify(points.current));
  startTransition(async () => { try { const result = await saveOutdoorRun(data); setMessage(result.error ?? result.success ?? "Registro concluído."); } catch { setMessage("Falha de conexão. Tente novamente antes de sair."); } });
 }
 return <section className="space-y-4 border-l-4 border-[var(--accent)] bg-white p-6"><h2 className="text-lg font-bold">Registrar corrida</h2><p className="text-sm text-[#64707d]">Mantenha esta tela aberta e o celular ativo durante a corrida. O GPS requer HTTPS e permissão de localização. O trajeto é salvo somente ao finalizar.</p><p aria-live="polite" className="text-sm">{message} {active && `${count} pontos recebidos.`}</p><button type="button" disabled={pending} className="primary-button" onClick={active ? finish : start}>{active ? "Finalizar e salvar" : "Iniciar corrida"}</button></section>;
}
