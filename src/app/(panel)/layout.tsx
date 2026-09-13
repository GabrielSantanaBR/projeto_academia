import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getCurrentMembership, AuthorizationError } from "@/lib/auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  let membership;

  try {
    membership = await getCurrentMembership();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/login");
    throw error;
  }

  if (membership.role === Role.STUDENT) redirect("/my-workout");
  return <AppShell membership={membership}>{children}</AppShell>;
}
