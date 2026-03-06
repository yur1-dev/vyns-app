// app/api/user/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { User, Username } from "@/models";
import { verifyAuth } from "@/lib/utils/auth";
import { nanoid } from "nanoid";
import { getTierFromLength } from "@/types/dashboard";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let user = await User.findById(auth.userId).catch(() => null);
    if (!user && auth.email) {
      user = await User.findOne({ email: auth.email });
    }

    if (!user) {
      user = await User.create({
        email: auth.email,
        xp: 0,
        level: 1,
        earnings: 0,
        stakedAmount: 0,
        referralCode: nanoid(8),
      });
    }

    const usernameRecords = await Username.find({
      $or: [
        { walletAddress: user._id.toString() },
        { "stats.ownerId": user._id.toString() },
        ...(auth.email ? [{ walletAddress: auth.email }] : []),
      ],
    });

    const usernames = usernameRecords.map((u) => {
      const tier =
        (u.stats as any)?.tier ??
        getTierFromLength(u.username.replace(/^@/, "").length);
      return {
        id: u._id.toString(),
        name: u.username,
        username: u.username,
        tier,
        yield: (u.stats as any)?.yieldRate ?? u.totalYield ?? 0,
        value: (u.stats as any)?.price ?? 0,
        expiresAt:
          (u.stats as any)?.expiresAt ??
          new Date(Date.now() + 365 * 86_400_000).toISOString(),
        claimedAt:
          (u.stats as any)?.claimedAt ??
          (u as any).createdAt?.toISOString() ??
          new Date().toISOString(),
        staked: (u.stats as any)?.staked ?? u.staked ?? false,
        // ✅ these were missing — now included
        isListed: u.isListed ?? false,
        listedPrice: u.listedPrice ?? null,
      };
    });

    const payload = {
      ...user.toObject(),
      usernames,
      earnings: {
        today: 0,
        week: 0,
        month: 0,
        allTime: user.earnings ?? 0,
      },
      stakedAmount: user.stakedAmount ?? 0,
      stakingPositions: [],
      referrals: 0,
      referralCode: user.referralCode,
      activity: [],
      isNewUser: usernameRecords.length === 0,
    };

    return NextResponse.json({ success: true, user: payload });
  } catch (error) {
    console.error("GET /api/user/me error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
