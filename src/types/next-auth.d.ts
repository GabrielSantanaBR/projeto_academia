import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: Role;
      organizationId?: string;
      sessionVersion?: number;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    organizationId?: string;
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    organizationId?: string;
    sessionVersion?: number;
  }
}
