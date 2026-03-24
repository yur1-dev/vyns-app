// app/api/user/delete/route.ts
// Place this file at: app/api/user/delete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions"; // adjust path to your authOptions
import connectDB from "@/lib/db/mongodb"; // adjust path to your DB connect helper
import { User } from "@/models/index"; // adjust path to your User model

export async function DELETE(req: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────────────────────
    // Supports both NextAuth session (web) and JWT Bearer token (mobile app)
    let userId: string | null = null;

    // Try NextAuth session first (web app)
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    }

    // Fall back to Bearer JWT (mobile app)
    if (!userId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        try {
          // If you use jose or jsonwebtoken — adjust to match your existing pattern
          const { jwtVerify } = await import("jose");
          const secret = new TextEncoder().encode(
            process.env.NEXTAUTH_SECRET ?? "",
          );
          const { payload } = await jwtVerify(token, secret);
          userId = (payload.sub ?? payload.id ?? payload.userId) as string;
        } catch {
          return NextResponse.json(
            { success: false, error: "Invalid token" },
            { status: 401 },
          );
        }
      }
    }

    // Fall back to session cookie set by your custom email/password auth
    if (!userId) {
      const cookieHeader = req.headers.get("cookie") ?? "";
      // Parse vyns_session or next-auth.session-token from cookie string
      const sessionTokenMatch = cookieHeader.match(
        /(?:vyns_session|next-auth\.session-token)=([^;]+)/,
      );
      if (sessionTokenMatch) {
        try {
          const { jwtVerify } = await import("jose");
          const secret = new TextEncoder().encode(
            process.env.NEXTAUTH_SECRET ?? "",
          );
          const { payload } = await jwtVerify(
            decodeURIComponent(sessionTokenMatch[1]),
            secret,
          );
          userId = (payload.sub ?? payload.id ?? payload.userId) as string;
        } catch {}
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // ── 2. Connect DB & delete user ─────────────────────────────────────────
    await connectDB();

    const deleted = await User.findByIdAndDelete(userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // ── 3. Clear auth cookies on response ───────────────────────────────────
    const response = NextResponse.json({ success: true });

    // Wipe all common auth cookies so the web app logs out immediately
    const cookiesToClear = [
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "next-auth.csrf-token",
      "__Host-next-auth.csrf-token",
      "vyns_session",
      "authjs.session-token",
    ];

    for (const name of cookiesToClear) {
      response.cookies.set(name, "", {
        maxAge: 0,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }

    return response;
  } catch (err: any) {
    console.error("[DELETE /api/user/delete]", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
