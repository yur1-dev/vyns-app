// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models";

const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 },
    );
  }

  const { email } = body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { success: false, error: "Valid email is required" },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    // Always return success to prevent email enumeration
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.password) {
      return NextResponse.json({ success: true });
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await User.findByIdAndUpdate(user._id, {
      $set: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + EXPIRY_MS),
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Reset your VYNS password",
      text: `Reset your password here (expires in 1 hour):\n\n${resetUrl}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#09090b;color:#fff;border-radius:16px">
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:600">Reset your password</h2>
          <p style="color:#888;margin:0 0 24px;font-size:14px;line-height:1.6">
            Click the button below to reset your VYNS password. This link expires in <strong style="color:#fff">1 hour</strong>.
          </p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#14b8a6;color:#000;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">
            Reset Password
          </a>
          <p style="color:#555;font-size:12px;margin-top:32px">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 },
    );
  }
}
