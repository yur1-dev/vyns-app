// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models";

export async function POST(req: NextRequest) {
  let body: { token?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 },
    );
  }

  const { token, newPassword } = body;

  if (!token || !newPassword) {
    return NextResponse.json(
      { success: false, error: "Token and new password are required" },
      { status: 400 },
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { success: false, error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() }, // not expired
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Reset link is invalid or has expired" },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await User.findByIdAndUpdate(user._id, {
      $set: { password: hashed, updatedAt: new Date() },
      $unset: { resetToken: "", resetTokenExpiry: "" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
