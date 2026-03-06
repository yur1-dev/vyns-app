// app/api/staking/stake/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models/index";
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

    const { amount, lockPeriod } = await req.json();

    if (!amount || amount < 0.1) {
      return NextResponse.json(
        { success: false, error: "Minimum stake is 0.1 SOL" },
        { status: 400 },
      );
    }

    const APY_MAP: Record<number, number> = {
      30: 5.2,
      90: 8.5,
      180: 12.0,
      365: 18.0,
    };
    const apy = APY_MAP[lockPeriod];
    if (!apy) {
      return NextResponse.json(
        { success: false, error: "Invalid lock period" },
        { status: 400 },
      );
    }

    const filter = auth.wallet ? { wallet: auth.wallet } : { _id: auth.userId };

    // Create staking position
    const position = await StakingPositionModel.create({
      userId: auth.userId,
      wallet: auth.wallet,
      amount,
      lockPeriod,
      apy,
      startDate: new Date(),
      status: "active",
      rewards: 0,
    });

    // Update user's stakedAmount
    await User.findOneAndUpdate(filter, { $inc: { stakedAmount: amount } });

    return NextResponse.json({ success: true, position });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
