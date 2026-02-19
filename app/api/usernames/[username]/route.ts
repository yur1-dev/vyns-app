import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Username, Transaction } from "@/models";

// GET /api/usernames/[username] — fetch username profile + recent transactions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    await connectDB();
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    const cleanUsername = `@${username.replace("@", "").toLowerCase()}`;

    const usernameData = await Username.findOne({ username: cleanUsername });

    if (!usernameData) {
      return NextResponse.json(
        { error: "Username not found" },
        { status: 404 },
      );
    }

    const recentTransactions = await Transaction.find({
      $or: [{ fromUsername: cleanUsername }, { toUsername: cleanUsername }],
    })
      .sort({ timestamp: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      username: usernameData.username,
      owner: usernameData.walletAddress,
      level: usernameData.level,
      xp: usernameData.xp,
      registeredAt: usernameData.createdAt,
      totalTransactions: usernameData.totalTransactions,
      totalVolume: usernameData.totalVolume,
      totalYield: usernameData.totalYield,
      isPremium: usernameData.isPremium,
      isVerified: usernameData.isVerified,
      listedPrice: usernameData.listedPrice,
      profile: usernameData.profile,
      stats: usernameData.stats,
      recentTransactions: recentTransactions.map((tx) => ({
        type: tx.type,
        amount: tx.amount,
        token: tx.token,
        from: tx.fromUsername,
        to: tx.toUsername,
        timestamp: tx.timestamp,
      })),
    });
  } catch (error) {
    console.error("GET /api/usernames/[username] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch username details" },
      { status: 500 },
    );
  }
}
