// app/api/staking/stake/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { verifyAuth } from "@/lib/utils/auth";
import { User } from "@/models";
import { LOCK_OPTIONS } from "@/types/dashboard";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { wallet, amount, lockPeriodDays } = await req.json();

    // Validate amount
    if (!amount || amount < 0.1) {
      return NextResponse.json(
        { error: "Minimum stake is 0.1 SOL" },
        { status: 400 },
      );
    }

    // Validate lock period
    const lockOpt = LOCK_OPTIONS.find((o) => o.days === lockPeriodDays);
    if (!lockOpt) {
      return NextResponse.json(
        { error: "Invalid lock period" },
        { status: 400 },
      );
    }

    await connectDB();

    const position = {
      id: `stake_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      amount,
      lockPeriod: lockPeriodDays,
      apy: lockOpt.apy,
      startDate: new Date().toISOString(),
      status: "active" as const,
      rewards: 0,
    };

    const updated = await User.findOneAndUpdate(
      { wallet: auth.wallet || wallet },
      {
        $push: { stakingPositions: position },
        $inc: {
          stakedAmount: amount,
          xp: 25,
        },
      },
      { new: true, upsert: false },
    );

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, position });
  } catch (err) {
    console.error("[staking/stake]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
