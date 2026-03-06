// app/api/staking/positions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { StakingPosition as StakingPositionModel } from "@/models/staking";

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

    const filter = auth.wallet
      ? { wallet: auth.wallet }
      : { userId: auth.userId };
    const positions = await StakingPositionModel.find(filter).sort({
      startDate: -1,
    });

    const now = Date.now();

    // Auto-mark unlocked positions and calculate live rewards
    const enriched = positions.map((p) => {
      const unlockTime =
        new Date(p.startDate).getTime() + p.lockPeriod * 86_400_000;
      const daysElapsed = (now - new Date(p.startDate).getTime()) / 86_400_000;
      const liveRewards = ((p.amount * p.apy) / 100) * (daysElapsed / 365);

      let status = p.status;
      if (p.status === "active" && now >= unlockTime) {
        status = "unlocked";
        // Update in DB async (don't await to keep response fast)
        p.updateOne({ status: "unlocked" }).exec();
      }

      return {
        id: p._id.toString(),
        amount: p.amount,
        lockPeriod: p.lockPeriod,
        apy: p.apy,
        startDate: p.startDate,
        status,
        rewards: p.status === "claimed" ? p.rewards : liveRewards,
        txSignature: p.txSignature,
      };
    });

    return NextResponse.json({ success: true, positions: enriched });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
