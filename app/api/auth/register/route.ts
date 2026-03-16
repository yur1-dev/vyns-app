// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import connectDB from "@/lib/db/mongodb";
import { User, Referral } from "@/models";
import { OtpCode } from "@/models/otp";

export async function POST(req: Request) {
  try {
    const { name, email, password, otpCode, refCode } = await req.json();

    if (!name || !email || !password || !otpCode) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    await connectDB();

    // ── 1. Verify OTP ─────────────────────────────────────────────────────────
    const otpRecord = await OtpCode.findOne({ email });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "No verification code found. Please request a new one.",
        },
        { status: 400 },
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      await OtpCode.deleteOne({ email });
      return NextResponse.json(
        { success: false, error: "Code expired. Please request a new one." },
        { status: 400 },
      );
    }

    if (otpRecord.code !== otpCode.trim()) {
      return NextResponse.json(
        { success: false, error: "Incorrect code. Please try again." },
        { status: 400 },
      );
    }

    // ── 2. Check email not already taken ──────────────────────────────────────
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already in use" },
        { status: 400 },
      );
    }

    // ── 3. Create user ────────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      xp: 0,
      level: 1,
      earnings: 0,
      stakedAmount: 0,
      referralCode: nanoid(8),
      referrals: 0,
    });

    // ── 4. Delete used OTP ────────────────────────────────────────────────────
    await OtpCode.deleteOne({ email });

    // ── 5. Process referral if code provided ──────────────────────────────────
    if (refCode) {
      try {
        const referrer = await User.findOne({ referralCode: refCode });
        if (referrer && referrer._id.toString() !== newUser._id.toString()) {
          const referredIdentifier = email;
          const referrerIdentifier =
            referrer.wallet ?? referrer.email ?? referrer._id.toString();

          const alreadyReferred = await Referral.findOne({
            referredWallet: referredIdentifier,
          });

          if (!alreadyReferred) {
            await Promise.all([
              Referral.create({
                referrerWallet: referrerIdentifier,
                referredWallet: referredIdentifier,
                rewardEarned: 0,
              }),
              User.findByIdAndUpdate(referrer._id, {
                $inc: { referrals: 1 },
              }),
              User.findByIdAndUpdate(newUser._id, {
                $set: { referredBy: referrerIdentifier },
              }),
            ]);
          }
        }
      } catch (refErr) {
        // Never block signup if referral tracking fails
        console.error("[register] referral error:", refErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[register]", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 },
    );
  }
}
