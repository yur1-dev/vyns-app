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
  if (len <= 3) return "Diamond";
  if (len <= 5) return "Platinum";
  if (len <= 8) return "Gold";
  if (len <= 15) return "Silver";
  return "Bronze";
}

function getPrice(tier: string): number {
  return tier === "Diamond"
    ? 1.0
    : tier === "Platinum"
      ? 0.5
      : tier === "Gold"
        ? 0.2
        : tier === "Silver"
          ? 0.1
          : 0.05;
}

function getYield(tier: string): number {
  return tier === "Diamond"
    ? 5
    : tier === "Platinum"
      ? 3
      : tier === "Gold"
        ? 1.5
        : 0;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username, wallet } = body;

    // 2. Validate
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

    // 3. Check if already taken in the Username collection
    const existing = await Username.findOne({
      username: username.toLowerCase(),
    });
    if (existing) {
      return NextResponse.json(
        { error: "Username already taken — try a different one" },
        { status: 409 },
      );
    }

    // 4. Resolve which user owns this claim
    const resolvedWallet = auth.wallet ?? wallet ?? null;
    const resolvedUserId = auth.userId ?? null;

    // Find the user in the User collection
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

    // 5. Derive tier + price
    const tier = getTier(username.length);
    const price = getPrice(tier);
    const yieldRate = getYield(tier);

    // 6. Save to Username collection (this is where usernames live in your schema)
    await Username.create({
      username: username.toLowerCase(),
      walletAddress: resolvedWallet ?? resolvedUserId ?? user._id.toString(),
      level: 1,
      xp: 0,
      isPremium: tier === "Diamond" || tier === "Platinum",
      isVerified: false,
      totalYield: yieldRate,
      profile: {},
      stats: {
        tier,
        price,
        yieldRate,
        claimedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 86_400_000).toISOString(),
        staked: false,
        ownerId: user._id.toString(),
      },
    });

    // 7. Update the User record (xp bump, mark not new)
    await User.findByIdAndUpdate(user._id, {
      $inc: { xp: 50 },
      $set: { isNewUser: false },
    });

    return NextResponse.json({ success: true, username, tier, price });
  } catch (err) {
    console.error("[username/claim]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
