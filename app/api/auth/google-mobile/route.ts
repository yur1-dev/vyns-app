// app/api/auth/google-mobile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sign } from "jsonwebtoken";
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

    // 1. Verify the access token with Google and get user info
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

    // FIX: always check googleId FIRST — never match by email alone.
    // Matching by email caused the wrong account to load when an email/password
    // account already existed with the same email address.

    // Step 1: try to find by googleId
    let user = await User.findOne({ googleId: googleUser.id });

    // Step 2: if no googleId match, check if an email/password account exists
    if (!user) {
      const emailUser = await User.findOne({ email });

      if (emailUser) {
        if (emailUser.googleId) {
          // Another Google account already owns this email — block it
          return NextResponse.json(
            {
              success: false,
              error:
                "This email is already linked to a different Google account.",
            },
            { status: 409 },
          );
        }
        // Email/password account exists — link Google to it
        emailUser.googleId = googleUser.id;
        if (!emailUser.avatar && googleUser.picture) {
          emailUser.avatar = googleUser.picture;
        }
        await emailUser.save();
        user = emailUser;
      }
    }

    // Step 3: no existing account at all — create a fresh one
    if (!user) {
      user = await User.create({
        email,
        name: googleUser.name ?? email.split("@")[0],
        avatar: googleUser.picture ?? null,
        googleId: googleUser.id,
        createdAt: new Date(),
      });
    }

    // 3. Issue a JWT the mobile app uses as Bearer token
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

    // 4. Return token + user data (same shape as /api/user/me)
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
