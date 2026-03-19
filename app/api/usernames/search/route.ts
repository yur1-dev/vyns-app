import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { Username } from "@/models";

function getTier(len: number): string {
  if (len <= 2) return "Legendary";
  if (len <= 4) return "Premium";
  return "Standard";
}

function getPrice(tier: string): string {
  return tier === "Legendary"
    ? "1.0 SOL"
    : tier === "Premium"
      ? "0.5 SOL"
      : "0.2 SOL";
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") ?? searchParams.get("username");

    if (!query) {
      return NextResponse.json(
        { error: "Username query is required" },
        { status: 400 },
      );
    }

    // Normalize: strip @, lowercase, only valid chars
    const cleanUsername = query
      .replace(/^@/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    if (cleanUsername.length < 1) {
      return NextResponse.json(
        { error: "Username must be at least 1 character" },
        { status: 400 },
      );
    }

    if (cleanUsername.length > 32) {
      return NextResponse.json(
        { error: "Username must be 32 characters or less" },
        { status: 400 },
      );
    }

    await connectDB();

    // Check BOTH formats since different routes stored them differently
    // Some entries: "yuri", others: "@yuri" — check both to be safe
    const existingUsername = (await Username.findOne({
      username: { $in: [cleanUsername, `@${cleanUsername}`] },
    }).lean()) as any;

    const tier = getTier(cleanUsername.length);
    const price = getPrice(tier);

    if (existingUsername) {
      return NextResponse.json({
        username: cleanUsername,
        available: false,
        owner: existingUsername.walletAddress ?? null,
        price: existingUsername.listedPrice
          ? `${existingUsername.listedPrice} SOL`
          : price,
        tier,
        level: existingUsername.level ?? 1,
        xp: existingUsername.xp ?? 0,
        staked: existingUsername.stats?.staked ?? false,
        registeredAt: existingUsername.createdAt
          ? new Date(existingUsername.createdAt).toLocaleDateString()
          : "N/A",
      });
    }

    // Not found in either format → available
    return NextResponse.json({
      username: cleanUsername,
      available: true,
      tier,
      price,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search username" },
      { status: 500 },
    );
  }
}
