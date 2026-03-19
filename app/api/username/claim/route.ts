// app/api/username/claim/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { verifyAuth } from "@/lib/utils/auth";
import { User, Username } from "@/models";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{1,32}$/;
const RESERVED = [
  "admin",
  "vyns",
  "solana",
  "phantom",
  "wallet",
  "api",
  "app",
  "dashboard",
];

function getTier(len: number): string {
  if (len <= 2) return "Legendary";
  if (len <= 4) return "Premium";
  return "Standard";
}

function getPrice(tier: string): number {
  return tier === "Legendary" ? 1.0 : tier === "Premium" ? 0.5 : 0.2;
}

function getYield(tier: string): number {
  return tier === "Legendary" ? 5 : tier === "Premium" ? 3 : 1.5;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username, wallet } = body;

    if (!username || !USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: "Invalid username — letters, numbers, underscores only" },
        { status: 400 },
      );
    }
    if (RESERVED.includes(username.toLowerCase())) {
      return NextResponse.json(
        { error: "This username is reserved" },
        { status: 400 },
      );
    }

    await connectDB();

    // Normalize: ALWAYS store WITHOUT @ prefix going forward
    const cleanUsername = username.toLowerCase().replace(/^@/, "");

    // Check BOTH formats to catch legacy entries that have @ prefix
    const existing = await Username.findOne({
      username: { $in: [cleanUsername, `@${cleanUsername}`] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Username already taken — try a different one" },
        { status: 409 },
      );
    }

    const resolvedWallet = auth.wallet ?? wallet ?? null;
    const resolvedUserId = auth.userId ?? null;

    let user = null;
    if (resolvedWallet) {
      user = await User.findOne({ wallet: resolvedWallet });
    }
    if (!user && resolvedUserId) {
      user = await User.findById(resolvedUserId);
    }
    if (!user) {
      return NextResponse.json(
        { error: "User not found — please log in again" },
        { status: 404 },
      );
    }

    const tier = getTier(cleanUsername.length);
    const price = getPrice(tier);
    const yieldRate = getYield(tier);
    const claimedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 86_400_000).toISOString();

    // Store WITHOUT @ prefix for consistency
    await Username.create({
      username: cleanUsername,
      walletAddress: resolvedWallet ?? resolvedUserId ?? user._id.toString(),
      level: 1,
      xp: 0,
      isPremium: tier === "Legendary" || tier === "Premium",
      isVerified: false,
      totalYield: yieldRate,
      profile: {},
      stats: {
        tier,
        price,
        yieldRate,
        claimedAt,
        expiresAt,
        staked: false,
        ownerId: user._id.toString(),
      },
    });

    await User.findByIdAndUpdate(user._id, {
      $inc: { xp: 50 },
      $set: { isNewUser: false },
      $push: {
        usernames: {
          id: cleanUsername,
          name: cleanUsername,
          tier,
          yield: yieldRate,
          value: price,
          claimedAt,
          expiresAt,
          staked: false,
        },
      },
    });

    return NextResponse.json({
      success: true,
      username: cleanUsername,
      tier,
      price,
    });
  } catch (err) {
    console.error("[username/claim]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
