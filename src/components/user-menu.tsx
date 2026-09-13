"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { signOut } from "next-auth/react";

export function UserMenu({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-[#161b22]">{name}</p>
        <p className="text-xs text-[#64707d]">{role}</p>
      </div>
      <Link href="/account" className="icon-button text-[#64707d]" aria-label="Minha conta" title="Minha conta"><UserRound className="size-4" /></Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="inline-flex size-11 items-center justify-center rounded-lg text-[#64707d] transition hover:bg-[#edf0f2] hover:text-[#161b22]"
        aria-label="Sair da conta"
        title="Sair"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
