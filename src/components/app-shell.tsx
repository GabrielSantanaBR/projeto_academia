import type { CSSProperties } from "react";
import { NavLinks } from "@/components/nav-links";
import { Settings } from "lucide-react";
import { Role } from "@prisma/client";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  Users,
  UsersRound,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";


type ShellMembership = {
  role: Role;
  organization: { name: string; primaryColor: string };
  user: { name: string };
};

const navigation: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}> = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard, roles: [Role.ADMIN] },
  { href: "/students", label: "Alunos", icon: Users, roles: [Role.ADMIN, Role.PROFESSOR] },
  { href: "/teachers", label: "Professores", icon: UsersRound, roles: [Role.ADMIN] },
  { href: "/templates", label: "Modelos de treino", icon: ClipboardList, roles: [Role.ADMIN, Role.PROFESSOR] },
  { href: "/exercises", label: "Exercícios", icon: Activity, roles: [Role.ADMIN, Role.PROFESSOR] },
  { href: "/settings", label: "Academia", icon: Settings, roles: [Role.ADMIN] },
  { href: "/subscriptions", label: "Assinaturas", icon: ClipboardList, roles: [Role.ADMIN] },
  { href: "/feedback", label: "Avaliar vídeos", icon: Activity, roles: [Role.ADMIN, Role.PROFESSOR] },
  { href: "/pending", label: "Pendências", icon: AlertTriangle, roles: [Role.ADMIN, Role.PROFESSOR] },
];

function roleLabel(role: Role) {
  return role === Role.ADMIN ? "Administrador" : "Professor";
}

export function AppShell({
  membership,
  children,
}: {
  membership: ShellMembership;
  children: React.ReactNode;
}) {
  const links = navigation.filter((item) => item.roles.includes(membership.role));

  return (
    <div style={{ "--accent": membership.organization.primaryColor } as CSSProperties} className="min-h-screen bg-[#f5f6f6] md:grid md:grid-cols-[244px_minmax(0,1fr)]">
      <a href="#main-content" className="skip-link">Ir para o conteúdo</a>
      <aside className="sticky top-0 hidden h-screen self-start overflow-y-auto border-r border-[#dfe3e6] bg-white px-4 py-6 md:flex md:flex-col">
        <Logo className="px-2" />
        <div className="mt-10 px-2">
          <p className="truncate text-sm font-bold text-[#161b22]">{membership.organization.name}</p>
          <p className="mt-1 text-xs text-[#64707d]">Painel da academia</p>
        </div>
        <nav className="mt-7 space-y-1" aria-label="Navegação principal">
          <NavLinks links={links.map(({ href, label }) => ({ href, label }))} />
        </nav>
        <div className="mt-auto border-t border-[#e5e7e9] px-2 pt-5">
          <p className="text-xs leading-5 text-[#64707d]">Acompanhe o treino antes que a adesão caia.</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-[#dfe3e6] bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
            <Logo compact className="md:hidden" />
            <div className="hidden items-center gap-2 text-sm text-[#64707d] md:flex">
              <BookOpen className="size-4 text-[var(--accent)]" />
              Gestão de treino
            </div>
            <UserMenu name={membership.user.name} role={roleLabel(membership.role)} />
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-[#edf0f2] px-3 py-2 md:hidden" aria-label="Navegação móvel">
            <NavLinks links={links.map(({ href, label }) => ({ href, label }))} mobile />
          </nav>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
