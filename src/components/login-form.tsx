"use client";

import { GraduationCap, LoaderCircle, LockKeyhole, UserRound, Utensils } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { inputClassName, labelClassName } from "@/components/ui";

const DEMO_PASSWORD = "Demo123!";

export function LoginForm({ demo = false }: { demo?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoRole, setDemoRole] = useState<"professor" | "aluno" | "nutricionista" | null>(null);

  function getDestination() {
    const requestedPath = params.get("callbackUrl");
    return requestedPath?.startsWith("/") && !requestedPath.startsWith("//") && !requestedPath.includes("\\")
      ? requestedPath
      : "/";
  }

  async function authenticate(email: string, password: string) {
    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!response?.ok) {
      setError("Confira e-mail e senha. Se houve várias tentativas, aguarde 15 minutos; se seu acesso foi desativado, fale com a academia.");
      return false;
    }

    router.replace(getDestination());
    router.refresh();
    return true;
  }

  async function onSubmit(formData: FormData) {
    setError(null);
    setIsLoading(true);
    setDemoRole(null);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      await authenticate(email, password);
    } catch {
      setError("Não foi possível conectar. Tente novamente em alguns instantes.");
    } finally {
      setIsLoading(false);
    }
  }

  async function signInDemo(role: "professor" | "aluno" | "nutricionista") {
    setError(null);
    setDemoRole(role);
    setIsLoading(true);

    const email = role === "professor" ? "rafael@movimento.fit" : role === "aluno" ? "aluno@movimento.fit" : "nutri@movimento.fit";

    try {
      await authenticate(email, DEMO_PASSWORD);
    } catch {
      setError("Não foi possível abrir a conta de demonstração. Tente novamente em alguns instantes.");
    } finally {
      setIsLoading(false);
      setDemoRole(null);
    }
  }

  return (
    <div className="space-y-5">
      {params.get("passwordChanged") === "1" && (
        <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Senha alterada. Entre com a nova senha.
        </p>
      )}

      {demo && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-950">Escolha um perfil para demonstrar o sistema</p>
          <p className="mt-1 text-xs leading-5 text-amber-900">
            As contas abaixo usam somente dados fictícios e entram com um clique.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => signInDemo("professor")}
              disabled={isLoading}
              className="flex min-h-20 items-center gap-3 rounded-lg border border-amber-300 bg-white px-4 text-left transition hover:border-[var(--accent)] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {demoRole === "professor" ? <LoaderCircle className="size-5 animate-spin text-[var(--accent)]" /> : <GraduationCap className="size-5 text-[var(--accent)]" />}
              <span>
                <span className="block text-sm font-bold text-[#161b22]">Entrar como Professor</span>
                <span className="mt-0.5 block text-xs text-[#64707d]">Gestão de alunos e treinos</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => signInDemo("aluno")}
              disabled={isLoading}
              className="flex min-h-20 items-center gap-3 rounded-lg border border-amber-300 bg-white px-4 text-left transition hover:border-[var(--accent)] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {demoRole === "aluno" ? <LoaderCircle className="size-5 animate-spin text-[var(--accent)]" /> : <UserRound className="size-5 text-[var(--accent)]" />}
              <span>
                <span className="block text-sm font-bold text-[#161b22]">Entrar como Aluno</span>
                <span className="mt-0.5 block text-xs text-[#64707d]">Treino, progresso e histórico</span>
              </span>
            </button>
            <button type="button" onClick={() => signInDemo("nutricionista")} disabled={isLoading} className="flex min-h-20 items-center gap-3 rounded-lg border border-amber-300 bg-white px-4 text-left transition hover:border-[var(--accent)] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">
              {demoRole === "nutricionista" ? <LoaderCircle className="size-5 animate-spin text-[var(--accent)]" /> : <Utensils className="size-5 text-[var(--accent)]" />}
              <span><span className="block text-sm font-bold text-[#161b22]">Entrar como Nutricionista</span><span className="mt-0.5 block text-xs text-[#64707d]">Planos alimentares individuais</span></span>
            </button>
          </div>
        </div>
      )}

      <form action={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className={labelClassName}>
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@academia.com"
            className={inputClassName}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className={labelClassName}>
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={200}
            className={inputClassName}
            required
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-[#fef2f2] px-3 py-2 text-sm font-medium text-[#b42318]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-bold text-white transition hover:bg-[#c84411] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading && !demoRole ? <LoaderCircle className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
          {isLoading && !demoRole ? "Entrando..." : "Entrar na plataforma"}
        </button>
      </form>
    </div>
  );
}
