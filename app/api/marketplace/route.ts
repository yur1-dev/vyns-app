// app/api/marketplace/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { Username } from "@/models";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get("sort") || "recent";
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const tier = searchParams.get("tier");

    await connectDB();

    const filter: any = { isListed: true, listedPrice: { $gt: 0 } };
    if (tier && tier !== "All") {
      filter["stats.tier"] = tier;
    }

    let sortCriteria: any = {};
    switch (sort) {
      case "price-low":
        sortCriteria = { listedPrice: 1 };
        break;
      case "price-high":
        sortCriteria = { listedPrice: -1 };
        break;
      case "level":
        sortCriteria = { level: -1 };
        break;
      default:
        sortCriteria = { updatedAt: -1 };
    }

    const [listings, totalCount] = await Promise.all([
      Username.find(filter)
        .sort(sortCriteria)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Username.countDocuments(filter),
    ]);

    return NextResponse.json({
      listings: listings.map((item: any) => ({
        username: item.username,
        price: item.listedPrice,
        // FIX: Return both owner (MongoDB _id) AND ownerWallet separately
        // so the frontend can match against both email users (_id) and
        // wallet users (wallet address) correctly.
        owner: item.stats?.ownerId ?? null,
        ownerWallet: item.walletAddress ?? null,
        level: item.level,
        xp: item.xp,
        isPremium: item.isPremium,
        tier: item.stats?.tier ?? null,
        listedAt: item.updatedAt,
      })),
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    });
  } catch (error) {
    console.error("Marketplace error:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace listings" },
      { status: 500 },
    );
  }
}
