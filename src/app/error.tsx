"use client";
import Link from "next/link";
export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="mx-auto max-w-lg space-y-5 px-5 py-20 text-center"><h1 className="text-2xl font-bold">Não foi possível carregar esta página</h1><p className="text-[#64707d]">Tente novamente em alguns instantes. Os registros já salvos permanecem no sistema.</p><div className="flex justify-center gap-3"><button className="primary-button" onClick={() => retry()}>Tentar novamente</button><Link className="secondary-button" href="/">Voltar ao início</Link></div></main>;
}
