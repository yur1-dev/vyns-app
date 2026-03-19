// app/api/user/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongodb";
import { User, Username } from "@/models";
import { verifyAuth } from "@/lib/utils/auth";
import { nanoid } from "nanoid";
import { getTierFromLength } from "@/types/dashboard";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const auth = !session?.user ? await verifyAuth(req) : null;

    if (!auth && !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session?.user as any)?.id ?? auth?.userId ?? null;
    const email = session?.user?.email ?? auth?.email ?? null;
    const wallet = (session?.user as any)?.wallet ?? auth?.wallet ?? null;

    let user = userId ? await User.findById(userId).catch(() => null) : null;
    if (!user && email) user = await User.findOne({ email });
    if (!user && wallet) user = await User.findOne({ wallet });

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
        ...(wallet ? [{ walletAddress: wallet }] : []),
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

    const userObj = user.toObject();

    const payload = {
      _id: userObj._id?.toString() ?? null,
      wallet: wallet ?? userObj.wallet ?? null,
      email: userObj.email ?? null,
      name: userObj.name ?? null,
      xp: userObj.xp ?? 0,
      level: userObj.level ?? 1,
      stakedAmount: userObj.stakedAmount ?? 0,
      referralCode: userObj.referralCode ?? null,
      activeUsername: userObj.activeUsername ?? null,
      usernames,
      earnings: { today: 0, week: 0, month: 0, allTime: userObj.earnings ?? 0 },
      stakingPositions: [],
      referrals: userObj.referrals ?? 0,
      activity: [],
      isNewUser: usernameRecords.length === 0,
      // ── Profile fields ──────────────────────────────────────────────────────
      bio: userObj.bio ?? "",
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

    // Clear stale wallet cookie if NextAuth session is active
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
