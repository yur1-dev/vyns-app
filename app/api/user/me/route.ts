// app/api/user/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongodb";
import { User, Username, Activity } from "@/models";
import { verifyAuth } from "@/lib/utils/auth";
import { nanoid } from "nanoid";
import { getTierFromLength } from "@/types/dashboard";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const hasBearerToken = req.headers
      .get("authorization")
      ?.startsWith("Bearer ");

    const auth = hasBearerToken ? await verifyAuth(req) : null;
    const session = !auth ? await getServerSession(authOptions) : null;

    if (!auth && !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth?.userId ?? (session?.user as any)?.id ?? null;
    const email = auth?.email ?? session?.user?.email ?? null;
    const sessionWallet =
      auth?.wallet ?? (session?.user as any)?.wallet ?? null;

    let user = userId ? await User.findById(userId).catch(() => null) : null;
    if (!user && email) user = await User.findOne({ email });
    if (!user && sessionWallet)
      user = await User.findOne({ wallet: sessionWallet });

    if (!user) {
      user = await User.create({
        email,
        name: session?.user?.name ?? undefined,
        xp: 0,
        level: 1,
        earnings: 0,
        marketplaceEarnings: 0,
        stakingEarnings: 0,
        stakedAmount: 0,
        referralCode: nanoid(8),
      });
    }

    const wallet = user.wallet ?? sessionWallet ?? null;

    const usernameRecords = await Username.find({
      $or: [
        { walletAddress: user._id.toString() },
        { "stats.ownerId": user._id.toString() },
        ...(email ? [{ walletAddress: email }] : []),
        ...(wallet
          ? [{ walletAddress: wallet }, { "stats.ownerId": wallet }]
          : []),
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

    // ── Fetch recent activity ─────────────────────────────────────────────────
    // Look up by wallet OR userId so both auth types get their activity.
    const activityKeys = [
      user._id.toString(),
      ...(wallet ? [wallet] : []),
      ...(email ? [email] : []),
    ];

    const activityRecords = await Activity.find({
      wallet: { $in: activityKeys },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const activity = activityRecords.map((a: any) => ({
      id: a._id.toString(),
      type: a.type,
      description: a.description,
      amount: a.amount ?? 0,
      token: "SOL",
      txHash: a.txHash ?? null,
      date: new Date(a.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
    // ─────────────────────────────────────────────────────────────────────────

    const userObj = user.toObject();

    const marketplaceEarnings = userObj.marketplaceEarnings ?? 0;
    const stakingEarnings = userObj.stakingEarnings ?? 0;
    const referralEarnings = userObj.referralEarnings ?? 0;
    const allTime = userObj.earnings ?? 0;

    const payload = {
      _id: userObj._id?.toString() ?? null,
      wallet,
      email: userObj.email ?? null,
      name: userObj.name ?? null,
      xp: userObj.xp ?? 0,
      level: userObj.level ?? 1,
      stakedAmount: userObj.stakedAmount ?? 0,
      referralCode: userObj.referralCode ?? null,
      activeUsername: userObj.activeUsername ?? null,
      usernames,
      earnings: {
        today: 0,
        week: 0,
        month: 0,
        allTime,
        marketplace: marketplaceEarnings,
        staking: stakingEarnings,
        referral: referralEarnings,
      },
      stakingPositions: [],
      referrals: userObj.referrals ?? 0,
      referralEarnings,
      stakingRewards: stakingEarnings,
      activity, // ← now populated
      isNewUser: usernameRecords.length === 0,
      bio: userObj.bio ?? "",
      claimedVyns: userObj.claimedVyns ?? 0,
      unclaimedReferralSol: 0,
      unclaimedVyns: 0,
      referralClaimPending: userObj.referralClaimPending ?? false,
      customization: userObj.customization ?? {
        theme: "teal",
        petId: "none",
        avatarSeed: "",
        avatarImage: null,
        coverPhoto: null,
        socials: { x: null, facebook: null, tiktok: null, telegram: null },
      },
    };

    const res = NextResponse.json({ success: true, user: payload });

    if (session?.user && req.cookies.get("auth-token")) {
      res.cookies.set("auth-token", "", { maxAge: 0, path: "/" });
    }

    return res;
  } catch (error) {
    console.error("GET /api/user/me error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
