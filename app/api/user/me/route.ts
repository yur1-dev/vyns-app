// app/api/user/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db/mongodb";
import { User, Username } from "@/models";
import { verifyAuth } from "@/lib/utils/auth";
import { nanoid } from "nanoid";
import { getTierFromLength } from "@/types/dashboard";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // ── Strategy 1: custom JWT cookie (wallet users) ──────────
    const auth = await verifyAuth(req);

    // ── Strategy 2: NextAuth session (email/Google users) ─────
    const session = !auth ? await getServerSession(authOptions) : null;

    // Neither auth method worked
    if (!auth && !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve userId and email from whichever auth worked
    const userId = auth?.userId ?? (session?.user as any)?.id ?? null;
    const email = auth?.email ?? session?.user?.email ?? null;

    // Find user
    let user = userId ? await User.findById(userId).catch(() => null) : null;
    if (!user && email) {
      user = await User.findOne({ email });
    }

    // Auto-create if missing (shouldn't happen but safety net)
    if (!user) {
      user = await User.create({
        email,
        name: session?.user?.name ?? undefined,
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
        ...(email ? [{ walletAddress: email }] : []),
        ...(auth?.wallet ? [{ walletAddress: auth.wallet }] : []),
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
        isListed: u.isListed ?? false,
        listedPrice: u.listedPrice ?? null,
      };
    });

    const payload = {
      ...user.toObject(),
      usernames,
      earnings: { today: 0, week: 0, month: 0, allTime: user.earnings ?? 0 },
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
