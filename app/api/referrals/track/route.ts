// app/api/referrals/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongodb";
import { User, Referral } from "@/models/index";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // getServerSession works reliably for Google OAuth — unlike verifyAuth
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { refCode } = await req.json();
    if (!refCode) {
      return NextResponse.json(
        { success: false, error: "No ref code" },
        { status: 400 },
      );
    }

    // Find current user
    const currentUser = await User.findOne(
      (session.user as any).id
        ? { _id: (session.user as any).id }
        : { email: session.user.email },
    );

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Already referred — don't double count
    if (currentUser.referredBy) {
      return NextResponse.json({ success: false, error: "Already referred" });
    }

    // Find referrer by their referral code
    const referrer = await User.findOne({ referralCode: refCode });
    if (!referrer) {
      return NextResponse.json(
        { success: false, error: "Invalid referral code" },
        { status: 404 },
      );
    }

    // Can't refer yourself
    if (referrer._id.toString() === currentUser._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Cannot refer yourself" },
        { status: 400 },
      );
    }

    const referredIdentifier =
      currentUser.wallet ?? currentUser.email ?? currentUser._id.toString();
    const referrerIdentifier =
      referrer.wallet ?? referrer.email ?? referrer._id.toString();

    // Guard: check Referral collection so we never double-count
    const exists = await Referral.findOne({
      referredWallet: referredIdentifier,
    });
    if (exists) {
      return NextResponse.json({ success: false, error: "Already recorded" });
    }

    // Write everything atomically
    await Promise.all([
      Referral.create({
        referrerWallet: referrerIdentifier,
        referredWallet: referredIdentifier,
        rewardEarned: 0,
      }),
      User.findByIdAndUpdate(referrer._id, {
        $inc: { referrals: 1 },
      }),
      User.findByIdAndUpdate(currentUser._id, {
        $set: { referredBy: referrerIdentifier },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[referrals/track]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
