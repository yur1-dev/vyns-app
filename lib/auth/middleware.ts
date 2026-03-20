// lib/auth/middleware.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { NextRequest, NextResponse } from "next/server";

export type AuthedUser = {
  userId: string;
  email: string | null;
  wallet: string | null;
};

export async function requireAuth(
  req: NextRequest,
): Promise<AuthedUser | NextResponse> {
  // 1. Web — NextAuth session cookie
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    return {
      userId: session.user.id,
      email: session.user.email ?? null,
      wallet: session.user.wallet ?? null,
    };
  }

  // 2. Mobile — Authorization: Bearer <jwt>
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { decode } = await import("next-auth/jwt");
      const decoded = await decode({
        token,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      if (decoded?.userId) {
        return {
          userId: decoded.userId as string,
          email: (decoded.email as string) ?? null,
          wallet: (decoded.wallet as string) ?? null,
        };
      }
    } catch {}
  }

  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 },
  );
}
