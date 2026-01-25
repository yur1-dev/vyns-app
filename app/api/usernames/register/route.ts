import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, walletAddress, txSignature } = body;

    // Validation
    if (!username || !walletAddress) {
      return NextResponse.json(
        { error: "Username and wallet address are required" },
        { status: 400 }
      );
    }

    // Clean username
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("vyns_db");

    // Check if username already exists
    const existing = await db.collection("usernames").findOne({
      username: `@${cleanUsername}`,
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    // Check if wallet already has a username (optional - remove if allowing multiple)
    const walletHasUsername = await db.collection("usernames").findOne({
      wallet_address: walletAddress,
    });

    // Create new username
    const newUsername = {
      username: `@${cleanUsername}`,
      wallet_address: walletAddress,
      created_at: new Date(),
      last_active: new Date(),
      level: 1,
      xp: 0,
      total_transactions: 0,
      total_volume: 0,
      total_yield: 0,
      is_premium: cleanUsername.length <= 4,
      is_verified: false,
      listed_price: null,
      registration_tx: txSignature || null,
      profile: {
        bio: "",
        avatar_url: "",
        twitter: "",
        links: [],
      },
      stats: {
        sent_count: 0,
        received_count: 0,
        trading_volume: 0,
      },
      settings: {
        privacy_mode: false,
        notifications: true,
        public_profile: true,
      },
    };

    const result = await db.collection("usernames").insertOne(newUsername);

    return NextResponse.json(
      {
        success: true,
        username: `@${cleanUsername}`,
        id: result.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register username" },
      { status: 500 }
    );
  }
}
