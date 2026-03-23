// app/api/referrals/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongodb";
import { User, Referral, Activity } from "@/models/index";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

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

    if (currentUser.referredBy) {
      return NextResponse.json({ success: false, error: "Already referred" });
    }

    const referrer = await User.findOne({ referralCode: refCode });
    if (!referrer) {
      return NextResponse.json(
        { success: false, error: "Invalid referral code" },
        { status: 404 },
      );
    }

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

    const exists = await Referral.findOne({
      referredWallet: referredIdentifier,
    });
    if (exists) {
      return NextResponse.json({ success: false, error: "Already recorded" });
    }

    // Write referral + update counts
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

    // ── Notify the REFERRER ──
    // Use wallet if available, otherwise fall back to userId string
    const referrerWallet = referrer.wallet ?? referrer._id.toString();
    const newReferralCount = (referrer.referrals ?? 0) + 1;

    await Activity.create({
      wallet: referrerWallet,
      type: "referral",
      description: `Someone joined using your referral code! You now have ${newReferralCount} referral${newReferralCount !== 1 ? "s" : ""}.`,
      amount: null,
      xpEarned: null,
      txHash: null,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[referrals/track]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
