import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { StudentShell } from "@/components/student-shell";
import { getCurrentMembership, AuthorizationError } from "@/lib/auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  let membership;

  try {
    membership = await getCurrentMembership();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/login");
    throw error;
  }

  if (membership.role !== Role.STUDENT) redirect(membership.role === Role.NUTRITIONIST ? "/nutrition" : "/dashboard");
  return <StudentShell membership={membership}>{children}</StudentShell>;
}
