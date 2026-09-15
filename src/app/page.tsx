import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { getCurrentMembership, AuthorizationError } from "@/lib/auth";

export default async function Home() {
  let membership;

  try {
    membership = await getCurrentMembership();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/login");
    throw error;
  }

  redirect(membership.role === Role.STUDENT ? "/my-workout" : "/dashboard");
}
