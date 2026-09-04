import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#f5f6f6] lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[#161b22] px-12 py-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-32 -top-28 size-[34rem] rounded-full border-[64px] border-[#e85d24]/20" />
        <div className="absolute -bottom-56 -left-32 size-[28rem] rounded-full bg-[#e85d24]/10" />
        <Logo className="relative [&_span:last-child_span:last-child]:text-white" />
        <div className="relative my-auto max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#fdba74]">Gestão que gera presença</p>
          <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight">
            Menos planilha. Mais alunos em movimento.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Organize professores, acompanhe treinos e encontre os alunos que precisam de atenção antes que eles se afastem.
          </p>
          <ul className="mt-10 space-y-4 text-sm text-slate-200">
            {["Visão clara da operação da academia", "Treino simples para o aluno no celular", "Acompanhamento real para os professores"].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-[#fb923c]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">MVP demonstrativo · Dados fictícios</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Logo className="lg:hidden" />
          <div className="mt-12 border border-[#dfe3e6] bg-white p-6 shadow-[0_14px_45px_rgba(22,27,34,0.06)] sm:p-8 lg:mt-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e85d24]">Acesso seguro</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#161b22]">Boas-vindas de volta</h2>
            <p className="mt-2 text-sm leading-6 text-[#64707d]">Entre com sua conta da academia para continuar.</p>
            <div className="mt-8">
              <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-[#f5f6f6]" />}>
                <LoginForm />
              </Suspense>
            </div>
            <div className="mt-7 border-t border-[#edf0f2] pt-5">
              <Link href="#credenciais" className="inline-flex items-center gap-2 text-sm font-semibold text-[#c84411] hover:underline">
                Ver contas de demonstração <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <div id="credenciais" className="mt-4 border border-[#dfe3e6] bg-white px-5 py-4 text-xs leading-5 text-[#64707d]">
            <strong className="text-[#3c4650]">Demonstração:</strong> admin@movimento.fit, rafael@movimento.fit ou aluno@movimento.fit · senha <strong className="text-[#3c4650]">Demo123!</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
