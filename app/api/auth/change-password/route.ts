// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models";
import { verifyPassword } from "@/lib/utils/auth"; // already used in authOptions
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Wallet-only users have no password
  if (auth.wallet && !auth.email) {
    return NextResponse.json(
      { success: false, error: "Wallet accounts don't have a password" },
      { status: 400 },
    );
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { success: false, error: "currentPassword and newPassword are required" },
      { status: 400 },
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { success: false, error: "New password must be at least 8 characters" },
      { status: 400 },
    );
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      {
        success: false,
        error: "New password must differ from current password",
      },
      { status: 400 },
    );
  }

  try {
    await connectDB();
    const user = await User.findById(auth.userId).select("+password");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          error: "This account uses OAuth and has no password",
        },
        { status: 400 },
      );
    }

    // Re-use your existing verifyPassword util
    const isMatch = await verifyPassword(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 401 },
      );
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(auth.userId, {
      $set: { password: hashed, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[change-password]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
