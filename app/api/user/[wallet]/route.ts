import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> },
) {
  try {
    const { wallet: walletAddress } = await params;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("vyns_db");

    // Get all usernames owned by this wallet
    const usernames = await db
      .collection("usernames")
      .find({ wallet_address: walletAddress })
      .toArray();

    if (usernames.length === 0) {
      return NextResponse.json({
        walletAddress,
        usernames: [],
        totalYield: 0,
        totalTransactions: 0,
        totalVolume: 0,
      });
    }

    // Calculate totals
    const totals = usernames.reduce(
      (acc, username) => ({
        totalYield: acc.totalYield + (username.total_yield || 0),
        totalTransactions:
          acc.totalTransactions + (username.total_transactions || 0),
        totalVolume: acc.totalVolume + (username.total_volume || 0),
      }),
      { totalYield: 0, totalTransactions: 0, totalVolume: 0 },
    );

    // Get recent activity
    const recentTransactions = await db
      .collection("transactions")
      .find({
        $or: [{ from_wallet: walletAddress }, { to_wallet: walletAddress }],
      })
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({
      walletAddress,
      usernames: usernames.map((u) => ({
        username: u.username,
        level: u.level,
        xp: u.xp,
        totalYield: u.total_yield,
        isPremium: u.is_premium,
        isVerified: u.is_verified,
        listedPrice: u.listed_price,
        registeredAt: u.created_at,
      })),
      totalYield: totals.totalYield,
      totalTransactions: totals.totalTransactions,
      totalVolume: totals.totalVolume,
      recentActivity: recentTransactions.map((tx) => ({
        type: tx.type,
        amount: tx.amount,
        token: tx.token,
        from: tx.from_username,
        to: tx.to_username,
        timestamp: tx.timestamp,
      })),
    });
  } catch (error) {
    console.error("User profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 },
    );
  }
}
