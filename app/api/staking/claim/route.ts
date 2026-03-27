// app/api/staking/claim/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { User, Activity } from "@/models/index";
import { StakingPosition as StakingPositionModel } from "@/models/staking";

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

    const { positionId } = await req.json();
    if (!positionId) {
      return NextResponse.json(
        { success: false, error: "positionId required" },
        { status: 400 },
      );
    }

    const position = await StakingPositionModel.findById(positionId);
    if (!position) {
      return NextResponse.json(
        { success: false, error: "Position not found" },
        { status: 404 },
      );
    }

    const ownerMatch = auth.wallet
      ? position.wallet === auth.wallet
      : position.userId?.toString() === auth.userId;
    if (!ownerMatch) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    if (position.status === "claimed") {
      return NextResponse.json(
        { success: false, error: "Already claimed" },
        { status: 400 },
      );
    }

    const now = Date.now();
    const unlockTime =
      new Date(position.startDate).getTime() + position.lockPeriod * 86_400_000;
    if (now < unlockTime) {
      return NextResponse.json(
        { success: false, error: "Position still locked" },
        { status: 400 },
      );
    }

    const daysElapsed =
      (now - new Date(position.startDate).getTime()) / 86_400_000;
    const rewards =
      ((position.amount * position.apy) / 100) * (daysElapsed / 365);

    position.rewards = rewards;
    position.status = "claimed";
    await position.save();

    const filter = auth.wallet ? { wallet: auth.wallet } : { _id: auth.userId };

    // ── Increment both earnings (total) and stakingEarnings (per-source) ──
    await User.findOneAndUpdate(filter, {
      $inc: {
        stakedAmount: -position.amount,
        earnings: rewards,
        stakingEarnings: rewards, // ── NEW per-source field
      },
    });

    // ── Notify the user their yield claim went through ──
    const activityWallet = auth.wallet ?? auth.userId;
    if (activityWallet) {
      await Activity.create({
        wallet: activityWallet,
        type: "claim",
        description: `Your staking is done! You claimed ${rewards.toFixed(4)} SOL in yield from your ${position.lockPeriod}-day position.`,
        amount: rewards,
        xpEarned: null,
        txHash: null,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      rewards,
      amount: position.amount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
