import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { getCurrentMembership } from "@/lib/auth";

export default async function Home() {
  let membership;

  try {
    membership = await getCurrentMembership();
  } catch {
    redirect("/login");
  }

  redirect(membership.role === Role.STUDENT ? "/my-workout" : "/dashboard");
}
