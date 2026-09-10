import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { StudentShell } from "@/components/student-shell";
import { getCurrentMembership } from "@/lib/auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  let membership;

  try {
    membership = await getCurrentMembership();
  } catch {
    redirect("/login");
  }

  if (membership.role !== Role.STUDENT) redirect("/dashboard");
  return <StudentShell membership={membership}>{children}</StudentShell>;
}
