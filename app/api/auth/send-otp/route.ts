// app/api/auth/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models";
import { OtpCode } from "@/models/otp";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email required" },
        { status: 400 },
      );
    }

    // Check if email already registered
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already in use" },
        { status: 400 },
      );
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any previous OTP for this email and create fresh one
    await OtpCode.deleteMany({ email });
    await OtpCode.create({ email, code, expiresAt });

    // Send the email
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "VYNS <noreply@vyns.io>",
      to: email,
      subject: "Your VYNS verification code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#09090b;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
            <h1 style="margin:0;font-size:24px;color:#fff;">VYNS</h1>
          </div>
          <div style="padding:32px;">
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:14px;">Your verification code</p>
            <div style="text-align:center;margin:24px 0;">
              <span style="font-size:48px;font-weight:700;letter-spacing:12px;color:#2dd4bf;">${code}</span>
            </div>
            <p style="margin:0;color:rgba(255,255,255,0.3);font-size:13px;text-align:center;">
              This code expires in <strong style="color:rgba(255,255,255,0.5);">10 minutes</strong>.<br/>
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[send-otp]", err);
    return NextResponse.json(
      { success: false, error: "Failed to send code" },
      { status: 500 },
    );
  }
}
