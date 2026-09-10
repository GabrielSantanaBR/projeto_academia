import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getCurrentMembership } from "@/lib/auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  let membership;

  try {
    membership = await getCurrentMembership();
  } catch {
    redirect("/login");
  }

  if (membership.role === Role.STUDENT) redirect("/my-workout");
  return <AppShell membership={membership}>{children}</AppShell>;
}
