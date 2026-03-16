// app/api/referrals/track/route.ts
// Called client-side after Google OAuth completes.
// Reads the ref code from the request body and credits the referrer.

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models/index";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { refCode } = await req.json();
    if (!refCode) {
      return NextResponse.json(
        { success: false, error: "No ref code provided" },
        { status: 400 },
      );
    }

    // Find the current user
    const filter = auth.wallet ? { wallet: auth.wallet } : { _id: auth.userId };
    const currentUser = await User.findOne(filter);

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Already been referred — don't double count
    if (currentUser.referredBy) {
      return NextResponse.json(
        { success: false, error: "Already referred" },
        { status: 409 },
      );
    }

    // Find the referrer by their referral code
    const referrer = await User.findOne({ referralCode: refCode });
    if (!referrer) {
      return NextResponse.json(
        { success: false, error: "Invalid referral code" },
        { status: 404 },
      );
    }

    // Don't let someone refer themselves
    if (referrer._id.toString() === currentUser._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Cannot refer yourself" },
        { status: 400 },
      );
    }

    // Credit the referrer + mark current user as referred
    await Promise.all([
      User.findByIdAndUpdate(referrer._id, {
        $inc: { referrals: 1 },
      }),
      User.findByIdAndUpdate(currentUser._id, {
        $set: { referredBy: referrer._id },
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
