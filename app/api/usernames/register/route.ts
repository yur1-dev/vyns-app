import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { Username } from "@/models";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, walletAddress, txSignature } = body;

    if (!username || !walletAddress) {
      return NextResponse.json(
        { error: "Username and wallet address are required" },
        { status: 400 },
      );
    }

    // Normalize: strip @ and clean — store WITHOUT @ prefix always
    const cleanUsername = username
      .replace(/^@/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    if (cleanUsername.length < 1 || cleanUsername.length > 32) {
      return NextResponse.json(
        { error: "Username must be 1-32 characters" },
        { status: 400 },
      );
    }

    await connectDB();

    // Check BOTH formats to catch old entries stored with @
    const existing = await Username.findOne({
      username: { $in: [cleanUsername, `@${cleanUsername}`] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 },
      );
    }

    // Determine tier
    const tier =
      cleanUsername.length <= 2
        ? "Legendary"
        : cleanUsername.length <= 4
          ? "Premium"
          : "Standard";

    // Store WITHOUT @ prefix
    const newUsername = await Username.create({
      username: cleanUsername,
      walletAddress,
      level: 1,
      xp: 0,
      isPremium: cleanUsername.length <= 4,
      isVerified: false,
      listedPrice: null,
      totalTransactions: 0,
      totalVolume: 0,
      totalYield: 0,
      profile: {
        bio: "",
        avatar: "",
        twitter: "",
        website: "",
      },
      stats: {
        tier,
        staked: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        username: cleanUsername,
        id: newUsername._id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register username" },
      { status: 500 },
    );
  }
}
