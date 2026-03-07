// middleware.ts  (root of project, next to package.json)
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const isProduction = process.env.NODE_ENV === "production";

  // Strategy 1: NextAuth JWT — must check BOTH cookie names.
  // In production Vercel, NextAuth uses __Secure- prefix automatically.
  // getToken() defaults to the dev name and misses the prod cookie — so we try both.
  const nextAuthToken =
    (await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: isProduction
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
    })) ??
    (await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: "next-auth.session-token",
    }));

  if (nextAuthToken) {
    return NextResponse.next();
  }

  // Strategy 2: Custom JWT cookie (wallet users via /api/auth/verify)
  const customToken = req.cookies.get("auth-token")?.value;
  if (customToken && customToken.split(".").length === 3) {
    return NextResponse.next();
  }

  // No valid auth — redirect to login, preserving destination
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
