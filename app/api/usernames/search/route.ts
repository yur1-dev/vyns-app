import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Username } from "@/models";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Username query is required" },
        { status: 400 },
      );
    }

    const cleanUsername = query.toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 },
      );
    }

    if (cleanUsername.length > 20) {
      return NextResponse.json(
        { error: "Username must be 20 characters or less" },
        { status: 400 },
      );
    }

    await connectDB();

    const existingUsername = (await Username.findOne({
      username: `@${cleanUsername}`,
    }).lean()) as any;

    if (existingUsername) {
      return NextResponse.json({
        username: cleanUsername,
        available: false,
        owner: existingUsername.walletAddress,
        price: existingUsername.listedPrice || null,
        level: existingUsername.level || 1,
        totalYield: existingUsername.totalYield || 0,
        registeredAt: existingUsername.createdAt
          ? new Date(existingUsername.createdAt).toLocaleDateString()
          : "N/A",
      });
    } else {
      return NextResponse.json({
        username: cleanUsername,
        available: true,
      });
    }
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search username" },
      { status: 500 },
    );
  }
}
