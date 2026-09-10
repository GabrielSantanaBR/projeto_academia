"use client";

import { LoaderCircle, LockKeyhole } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { inputClassName, labelClassName } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setIsLoading(true);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (!response?.ok) {
      setError("E-mail ou senha incorretos.");
      return;
    }

    const requestedPath = params.get("callbackUrl");
    const destination = requestedPath?.startsWith("/") ? requestedPath : "/";
    router.replace(destination);
    router.refresh();
  }

  return (
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
          className={inputClassName}
          required
        />
      </div>
      {error && <p className="rounded-lg bg-[#fef2f2] px-3 py-2 text-sm font-medium text-[#b42318]">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#e85d24] px-4 text-sm font-bold text-white transition hover:bg-[#c84411] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? <LoaderCircle className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
        {isLoading ? "Entrando..." : "Entrar na plataforma"}
      </button>
    </form>
  );
}
