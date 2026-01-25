import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Username query is required" },
        { status: 400 }
      );
    }

    // Clean username (lowercase, remove special chars except underscore)
    const cleanUsername = query.toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (cleanUsername.length > 20) {
      return NextResponse.json(
        { error: "Username must be 20 characters or less" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("vyns_db");

    // Check if username exists
    const existingUsername = await db.collection("usernames").findOne({
      username: `@${cleanUsername}`,
    });

    if (existingUsername) {
      // Username is taken
      return NextResponse.json({
        username: cleanUsername,
        available: false,
        owner: existingUsername.wallet_address,
        price: existingUsername.listed_price || null,
        level: existingUsername.level || 1,
        totalYield: existingUsername.total_yield || 0,
        registeredAt: existingUsername.created_at
          ? new Date(existingUsername.created_at).toLocaleDateString()
          : "N/A",
      });
    } else {
      // Username is available
      return NextResponse.json({
        username: cleanUsername,
        available: true,
      });
    }
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search username" },
      { status: 500 }
    );
  }
}
