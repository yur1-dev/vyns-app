import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User, Username } from "@/models";

// POST /api/username/claim — claim a username
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { wallet, username } = await req.json();

    if (!wallet || !username) {
      return NextResponse.json(
        { success: false, error: "Wallet and username are required" },
        { status: 400 },
      );
    }

    // Validate: letters, numbers, underscores, 3-20 chars
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Username must be 3-20 characters, letters/numbers/underscores only",
        },
        { status: 400 },
      );
    }

    const formatted = `@${username.toLowerCase()}`;

    // Check if taken
    const existing = await Username.findOne({ username: formatted });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Username already taken" },
        { status: 409 },
      );
    }

    // Check if user already has a username
    const user = await User.findOne({ wallet });
    if (user?.username) {
      return NextResponse.json(
        { success: false, error: "You already have a username" },
        { status: 409 },
      );
    }

    // Claim it
    await Username.create({ username: formatted, walletAddress: wallet });
    await User.findOneAndUpdate({ wallet }, { $set: { username: formatted } });

    return NextResponse.json({ success: true, username: formatted });
  } catch (error) {
    console.error("POST /api/username/claim error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to claim username" },
      { status: 500 },
    );
  }
}

// GET /api/username/claim?username=xxx — check availability
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username is required" },
        { status: 400 },
      );
    }

    const formatted = `@${username.replace("@", "").toLowerCase()}`;
    const existing = await Username.findOne({ username: formatted });

    return NextResponse.json({ success: true, available: !existing });
  } catch (error) {
    console.error("GET /api/username/claim error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check username" },
      { status: 500 },
    );
  }
}
