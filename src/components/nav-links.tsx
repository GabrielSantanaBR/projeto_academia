"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, AlertTriangle, ClipboardList, LayoutDashboard, Settings, Users, UsersRound, History, TrendingUp, Ruler, Utensils, Video, MapPinned, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
const icons = { dashboard: LayoutDashboard, students: Users, teachers: UsersRound, templates: ClipboardList, exercises: Activity, pending: AlertTriangle, settings: Settings, 'my-workout': ClipboardList, 'my-history': History, 'my-progress': TrendingUp, 'my-assessments': Ruler, 'my-nutrition': Utensils, 'my-feedback': Video, 'my-run': MapPinned, subscriptions: CreditCard, feedback: Video };
export function NavLinks({ links, mobile = false, student = false }: { links: { href: string; label: string }[]; mobile?: boolean; student?: boolean }) {
  const path = usePathname();
  return links.map(item => {
    const active = path === item.href || path.startsWith(`${item.href}/`);
    const Icon = icons[item.href.slice(1) as keyof typeof icons] ?? ClipboardList;
    return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={cn('nav-link', active && 'nav-link-active', student ? 'nav-student' : mobile ? 'nav-mobile' : 'nav-desktop')}><Icon className="size-[18px] shrink-0" /><span>{item.label}</span></Link>;
  });
}
