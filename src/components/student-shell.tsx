import { Role } from "@prisma/client";
import { BarChart3, ClipboardList, History, UserRound } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";

const items = [
  { href: "/my-workout", label: "Treino", icon: ClipboardList },
  { href: "/my-history", label: "Histórico", icon: History },
  { href: "/my-progress", label: "Evolução", icon: BarChart3 },
  { href: "/my-assessments", label: "Avaliações", icon: UserRound },
];

export function StudentShell({
  membership,
  children,
}: {
  membership: { role: Role; organization: { name: string }; user: { name: string } };
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f6f6] pb-20">
      <header className="sticky top-0 z-20 border-b border-[#dfe3e6] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo compact />
          <UserMenu name={membership.user.name} role="Aluno" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#dfe3e6] bg-white" aria-label="Navegação do aluno">
        <div className="mx-auto grid max-w-3xl grid-cols-4 px-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#64707d] transition hover:bg-[#fff7ed] hover:text-[#c84411]"
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
