// app/api/referrals/claim/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models/index";

// ─── Referral reward rates per tier ──────────────────────────────────────────
const TIER_RATES = [
  { minReferrals: 75, solPerReferral: 0.025, vynsPerReferral: 75 },
  { minReferrals: 30, solPerReferral: 0.015, vynsPerReferral: 40 },
  { minReferrals: 15, solPerReferral: 0.01, vynsPerReferral: 25 },
  { minReferrals: 5, solPerReferral: 0.007, vynsPerReferral: 15 },
  { minReferrals: 0, solPerReferral: 0.005, vynsPerReferral: 10 },
];

function getRates(referrals: number) {
  for (const tier of TIER_RATES) {
    if (referrals >= tier.minReferrals) return tier;
  }
  return TIER_RATES[TIER_RATES.length - 1];
}

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

    const filter = auth.wallet ? { wallet: auth.wallet } : { _id: auth.userId };
    const user = await User.findOne(filter);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const totalReferrals: number = user.referrals ?? 0;
    const rewardedReferrals: number = user.rewardedReferrals ?? 0;
    const unclaimedCount = totalReferrals - rewardedReferrals;

    if (unclaimedCount <= 0) {
      return NextResponse.json(
        { success: false, error: "No unclaimed referral rewards" },
        { status: 400 },
      );
    }

    if (user.referralClaimPending === true) {
      return NextResponse.json(
        { success: false, error: "Claim already in progress" },
        { status: 409 },
      );
    }

    // Lock to prevent double-claim
    await User.updateOne(filter, { $set: { referralClaimPending: true } });

    try {
      const rates = getRates(totalReferrals);
      const solReward = parseFloat(
        (unclaimedCount * rates.solPerReferral).toFixed(6),
      );
      const vynsReward = unclaimedCount * rates.vynsPerReferral;

      // FIX: earnings is a plain Number in the schema, not an object.
      // Use $inc: { earnings: solReward } directly instead of earnings.allTime
      await User.updateOne(filter, {
        $set: { referralClaimPending: false },
        $inc: {
          rewardedReferrals: unclaimedCount,
          claimedVyns: vynsReward,
          referralEarnings: solReward,
          earnings: solReward,
        },
      });

      return NextResponse.json({
        success: true,
        solRewarded: solReward,
        vynsRewarded: vynsReward,
        claimedCount: unclaimedCount,
      });
    } catch (payoutErr: any) {
      // Release lock if payout fails so user can retry
      await User.updateOne(filter, { $set: { referralClaimPending: false } });
      throw payoutErr;
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

// ─── GET: return unclaimed reward preview ─────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const filter = auth.wallet ? { wallet: auth.wallet } : { _id: auth.userId };
    const user = (await User.findOne(filter).lean()) as any;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const totalReferrals: number = user.referrals ?? 0;
    const rewardedReferrals: number = user.rewardedReferrals ?? 0;
    const unclaimedCount = Math.max(0, totalReferrals - rewardedReferrals);
    const rates = getRates(totalReferrals);

    return NextResponse.json({
      success: true,
      totalReferrals,
      rewardedReferrals,
      unclaimedCount,
      unclaimedReferralSol: parseFloat(
        (unclaimedCount * rates.solPerReferral).toFixed(6),
      ),
      unclaimedVyns: unclaimedCount * rates.vynsPerReferral,
      claimedVyns: user.claimedVyns ?? 0,
      referralClaimPending: user.referralClaimPending ?? false,
      currentTierRates: rates,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
