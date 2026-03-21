// app/api/auth/google-mobile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sign } from "jsonwebtoken";
import { nanoid } from "nanoid";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Access token required" },
        { status: 400 },
      );
    }

    // 1. Verify the access token with Google
    const googleRes = await fetch("https://www.googleapis.com/userinfo/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!googleRes.ok) {
      return NextResponse.json(
        { success: false, error: "Invalid Google access token" },
        { status: 401 },
      );
    }

    const googleUser = await googleRes.json();

    if (!googleUser.email) {
      return NextResponse.json(
        { success: false, error: "Could not get email from Google" },
        { status: 400 },
      );
    }

    await connectDB();

    const email = googleUser.email.toLowerCase();
    const googleId = googleUser.id;

    // FIX: always search by googleId first — most reliable unique identifier
    let user = await User.findOne({ googleId });

    // No googleId match — check by email (handles email/password accounts)
    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      // Link googleId if not already saved (first time Google login for this account)
      let changed = false;
      if (!user.googleId) {
        user.googleId = googleId;
        changed = true;
      }
      if (!user.avatar && googleUser.picture) {
        user.avatar = googleUser.picture;
        changed = true;
      }
      if (changed) await user.save();
    } else {
      // Brand new user — create fresh account
      user = await User.create({
        email,
        name: googleUser.name ?? email.split("@")[0],
        avatar: googleUser.picture ?? null,
        googleId,
        xp: 0,
        level: 1,
        earnings: 0,
        stakedAmount: 0,
        referralCode: nanoid(8),
        createdAt: new Date(),
      });
    }

    // 2. Issue JWT for mobile
    const token = sign(
      {
        userId: user._id.toString(),
        email: user.email,
        provider: "google",
        iat: Math.floor(Date.now() / 1000),
      },
      NEXTAUTH_SECRET,
      { expiresIn: "30d" },
    );

    // 3. Return token + user data (same shape as /api/user/me)
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email ?? null,
        name: user.name ?? null,
        image: user.avatar ?? null,
        provider: "google",
        wallet: user.wallet ?? null,
        activeUsername: user.activeUsername ?? null,
        level: user.level ?? 1,
        xp: user.xp ?? 0,
        referralCode: user.referralCode ?? null,
        referrals: user.referrals ?? 0,
        earnings: user.earnings ?? 0,
        stakedAmount: user.stakedAmount ?? 0,
        customization: user.customization ?? null,
        bio: user.bio ?? "",
      },
    });
  } catch (err: any) {
    console.error("[google-mobile]", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
