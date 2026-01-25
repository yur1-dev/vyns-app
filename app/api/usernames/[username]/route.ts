import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.replace("@", "").toLowerCase();

    const client = await clientPromise;
    const db = client.db("vyns_db");

    // Get username details
    const usernameData = await db.collection("usernames").findOne({
      username: `@${cleanUsername}`,
    });

    if (!usernameData) {
      return NextResponse.json(
        { error: "Username not found" },
        { status: 404 }
      );
    }

    // Get recent transactions
    const recentTransactions = await db
      .collection("transactions")
      .find({
        $or: [
          { from_username: `@${cleanUsername}` },
          { to_username: `@${cleanUsername}` },
        ],
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      username: usernameData.username,
      owner: usernameData.wallet_address,
      level: usernameData.level,
      xp: usernameData.xp,
      registeredAt: usernameData.created_at,
      totalTransactions: usernameData.total_transactions,
      totalVolume: usernameData.total_volume,
      totalYield: usernameData.total_yield,
      isPremium: usernameData.is_premium,
      isVerified: usernameData.is_verified,
      listedPrice: usernameData.listed_price,
      profile: usernameData.profile,
      stats: usernameData.stats,
      recentTransactions: recentTransactions.map((tx) => ({
        type: tx.type,
        amount: tx.amount,
        token: tx.token,
        from: tx.from_username,
        to: tx.to_username,
        timestamp: tx.timestamp,
      })),
    });
  } catch (error) {
    console.error("Get username error:", error);
    return NextResponse.json(
      { error: "Failed to fetch username details" },
      { status: 500 }
    );
  }
}
