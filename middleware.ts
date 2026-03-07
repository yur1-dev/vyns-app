// middleware.ts  (root of project, next to package.json)
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /dashboard routes
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // Strategy 1: NextAuth JWT (Google + email/password users)
  const nextAuthToken = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (nextAuthToken) {
    return NextResponse.next();
  }

  // Strategy 2: Custom JWT cookie (wallet users)
  const customToken = req.cookies.get("auth-token")?.value;
  if (customToken) {
    // Verify it's a real JWT (has 3 dot-separated parts)
    const parts = customToken.split(".");
    if (parts.length === 3) {
      return NextResponse.next();
    }
  }

  // No valid auth found — redirect to login
  const loginUrl = new URL("/login", req.url);
  // Preserve the intended destination so login can redirect back
  loginUrl.searchParams.set("callbackUrl", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
