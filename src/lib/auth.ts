import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { createHash } from "node:crypto";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
});

export class AuthorizationError extends Error {
  constructor(message = "Você não tem permissão para executar esta ação.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const key = createHash("sha256").update(parsed.data.email).digest("hex");
        const now = new Date();
        await prisma.loginThrottle.deleteMany({ where: { expiresAt: { lt: now } } });
        const throttle = await prisma.loginThrottle.upsert({
          where: { key },
          create: { key, expiresAt: new Date(now.getTime() + 15 * 60_000) },
          update: { attempts: { increment: 1 } },
        });
        if (throttle.attempts > 10) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: {
            memberships: {
              where: { active: true },
              include: { studentProfile: true },
              orderBy: { createdAt: "asc" },
              take: 1,
            },
          },
        });

        if (!user || !user.memberships[0]) {
          // Perform the same expensive password operation for unknown accounts.
          await bcrypt.compare(parsed.data.password, "$2b$12$hRDHU2OXDcUeGaFxUTTk8e5.EFfgNYB7WO7Eo8GOAJdbOBhNCyfS2");
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );

        if (!passwordMatches) {
          return null;
        }

        const membership = user.memberships[0];
        if (membership.studentProfile?.status === "INACTIVE") return null;
        await prisma.loginThrottle.deleteMany({ where: { key } });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: membership.role,
          organizationId: membership.organizationId,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.sessionVersion = user.sessionVersion;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? token.sub ?? "";
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.sessionVersion = token.sessionVersion;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getCurrentMembership(options: { allowTemporaryPassword?: boolean } = {}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const organizationId = session?.user?.organizationId;

  if (!userId || !organizationId) {
    throw new AuthorizationError("Sua sessão expirou. Entre novamente.");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId, organizationId },
    include: {
      user: true,
      organization: true,
      studentProfile: true,
    },
  });

  if (!membership || !membership.active || membership.studentProfile?.status === "INACTIVE" ||
      (session.user.sessionVersion ?? 0) !== membership.user.sessionVersion) {
    throw new AuthorizationError("Vínculo com a academia não encontrado.");
  }

  if (membership.user.mustChangePassword && !options.allowTemporaryPassword) redirect("/account");

  return membership;
}

export async function requireRole(...roles: Role[]) {
  const membership = await getCurrentMembership();

  if (roles.length > 0 && !roles.includes(membership.role)) {
    throw new AuthorizationError();
  }

  return membership;
}
