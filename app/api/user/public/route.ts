// app/api/user/public/route.ts
// Returns a sanitized public profile for any user by username.
// NO private fields — no referral codes, no email, no password, no wallet internals.

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { User, Username, Activity, Referral } from "@/models/index";

function getTier(name: string) {
  const n = name.replace(/^@/, "").length;
  if (n <= 3) return "Diamond";
  if (n <= 5) return "Platinum";
  if (n <= 8) return "Gold";
  if (n <= 15) return "Silver";
  return "Bronze";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams
    .get("username")
    ?.replace(/^@/, "")
    .toLowerCase();

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  try {
    await connectDB();

    // 1. Find the username document
    const usernameDoc = (await Username.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    }).lean()) as any;

    if (!usernameDoc) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // 2. Find the owner User document
    const ownerUser = (await User.findOne({
      $or: [
        { wallet: usernameDoc.walletAddress },
        { username: { $regex: new RegExp(`^${username}$`, "i") } },
        { _id: usernameDoc.walletAddress },
      ],
    }).lean()) as any;

    // 3. Get all usernames owned by the same wallet
    const allUsernames = (await Username.find({
      walletAddress: usernameDoc.walletAddress,
    }).lean()) as any[];

    // 4. Get recent public activity
    const recentActivity = (await Activity.find({
      wallet: usernameDoc.walletAddress,
      type: { $in: ["claim", "stake", "unstake", "referral"] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()) as any[];

    // 5. Count referrals
    const referralCount = await Referral.countDocuments({
      referrerWallet: usernameDoc.walletAddress,
    });

    const publicUser = {
      displayName: ownerUser?.name ?? `@${username}`,
      activeUsername: ownerUser?.activeUsername ?? null,
      bio: ownerUser?.bio ?? usernameDoc.profile?.bio ?? null,
      xp: ownerUser?.xp ?? 0,
      level: ownerUser?.level ?? 1,
      // ✅ Now includes avatarImage and coverPhoto
      customization: {
        theme: ownerUser?.customization?.theme ?? "teal",
        avatarSeed: ownerUser?.customization?.avatarSeed ?? username,
        avatarImage: ownerUser?.customization?.avatarImage ?? null,
        coverPhoto: ownerUser?.customization?.coverPhoto ?? null,
        socials: ownerUser?.customization?.socials ?? null,
      },
      usernames: allUsernames.map((u) => ({
        id: u._id?.toString(),
        name: u.username,
        tier: getTier(u.username),
        staked: u.staked ?? false,
      })),
      earnings: { allTime: ownerUser?.earnings ?? 0 },
      stakedAmount: ownerUser?.stakedAmount ?? 0,
      referrals: referralCount,
      activity: recentActivity.map((a) => ({
        id: a._id?.toString(),
        type: a.type,
        description: a.description,
        amount: a.amount ?? 0,
        token: "SOL",
        date: a.createdAt,
      })),
    };

    return NextResponse.json({ user: publicUser });
  } catch (err) {
    console.error("[api/user/public]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
