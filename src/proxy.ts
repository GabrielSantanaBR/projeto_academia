import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/students",
  "/teachers",
  "/exercises",
  "/templates",
  "/pending",
  "/my-workout",
  "/my-history",
  "/my-progress",
  "/my-assessments",
];

export async function proxy(request: NextRequest) {
  const needsSession = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (!needsSession) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/students/:path*",
    "/teachers/:path*",
    "/exercises/:path*",
    "/templates/:path*",
    "/pending/:path*",
    "/my-workout/:path*",
    "/my-history/:path*",
    "/my-progress/:path*",
    "/my-assessments/:path*",
  ],
};
