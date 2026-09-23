import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentMembership, AuthorizationError } from "@/lib/auth";
import { StudentShell } from "@/components/student-shell";
import { AppShell } from "@/components/app-shell";

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  let membership;
  try { membership = await getCurrentMembership(); }
  catch (error) { if (error instanceof AuthorizationError) redirect("/login"); throw error; }
  return membership.role === Role.STUDENT ? <StudentShell membership={membership}>{children}</StudentShell> : <AppShell membership={membership}>{children}</AppShell>;
}
