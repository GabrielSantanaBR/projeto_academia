import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email().max(160).transform((value) => value.toLowerCase()),
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

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: {
            memberships: {
              orderBy: { createdAt: "asc" },
              take: 1,
            },
          },
        });

        if (!user || !user.memberships[0]) {
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

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: membership.role,
          organizationId: membership.organizationId,
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
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? token.sub ?? "";
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getCurrentMembership() {
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

  if (!membership) {
    throw new AuthorizationError("Vínculo com a academia não encontrado.");
  }

  return membership;
}

export async function requireRole(...roles: Role[]) {
  const membership = await getCurrentMembership();

  if (roles.length > 0 && !roles.includes(membership.role)) {
    throw new AuthorizationError();
  }

  return membership;
}
