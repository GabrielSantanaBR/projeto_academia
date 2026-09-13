import type { CSSProperties } from "react";
import { NavLinks } from "@/components/nav-links";
import { Role } from "@prisma/client";
import { BarChart3, ClipboardList, History, UserRound } from "lucide-react";


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
  membership: { role: Role; organization: { name: string; primaryColor: string }; user: { name: string } };
  children: React.ReactNode;
}) {
  return (
    <div style={{ "--accent": membership.organization.primaryColor } as CSSProperties} className="min-h-screen bg-[#f5f6f6] pb-24">
      <a href="#main-content" className="skip-link">Ir para o conteúdo</a>
      <header className="sticky top-0 z-20 border-b border-[#dfe3e6] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div><Logo compact /><p className="mt-1 max-w-48 truncate text-xs text-[#64707d]">{membership.organization.name}</p></div>
          <UserMenu name={membership.user.name} role="Aluno" />
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#dfe3e6] bg-white pb-[env(safe-area-inset-bottom)]" aria-label="Navegação do aluno">
        <div className="mx-auto grid max-w-3xl grid-cols-4 px-1">
          <NavLinks links={items.map(({href, label}) => ({href, label}))} student />
        </div>
      </nav>
    </div>
  );
}
