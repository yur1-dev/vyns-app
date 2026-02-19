import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
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

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters" },
        { status: 400 },
      );
    }

    await connectDB();

    const existing = await Username.findOne({ username: `@${cleanUsername}` });
    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 },
      );
    }

    const newUsername = await Username.create({
      username: `@${cleanUsername}`,
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
    });

    return NextResponse.json(
      {
        success: true,
        username: `@${cleanUsername}`,
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
