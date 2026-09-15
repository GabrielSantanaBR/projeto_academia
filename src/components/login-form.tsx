"use client";

import { LoaderCircle, LockKeyhole } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { inputClassName, labelClassName } from "@/components/ui";

export function LoginForm({ demo = false }: { demo?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setIsLoading(true);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    try {
    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (!response?.ok) {
      setError("Confira e-mail e senha. Se houve várias tentativas, aguarde 15 minutos; se seu acesso foi desativado, fale com a academia.");
      return;
    }

    const requestedPath = params.get("callbackUrl");
    const destination = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") && !requestedPath.includes("\\") ? requestedPath : "/";
    router.replace(destination);
    router.refresh();
    } catch { setError("Não foi possível conectar. Tente novamente em alguns instantes."); }
    finally { setIsLoading(false); }
  }

  return (
    <form action={onSubmit} className="space-y-5">
      {params.get("passwordChanged") === "1" && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Senha alterada. Entre com a nova senha.</p>}
      {demo && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Ambiente de demonstração. Use somente dados fictícios.</p>}
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
      {error && <p role="alert" className="rounded-lg bg-[#fef2f2] px-3 py-2 text-sm font-medium text-[#b42318]">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-bold text-white transition hover:bg-[#c84411] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? <LoaderCircle className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
        {isLoading ? "Entrando..." : "Entrar na plataforma"}
      </button>
    </form>
  );
}
