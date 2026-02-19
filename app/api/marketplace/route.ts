import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Username } from "@/models";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get("sort") || "recent";
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    await connectDB();

    let sortCriteria: any = {};
    switch (sort) {
      case "price-low":
        sortCriteria = { listed_price: 1 };
        break;
      case "price-high":
        sortCriteria = { listed_price: -1 };
        break;
      case "level":
        sortCriteria = { level: -1 };
        break;
      case "recent":
      default:
        sortCriteria = { created_at: -1 };
    }

    const filter = { listed_price: { $ne: null, $gt: 0 } };

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
        price: item.listed_price,
        owner: item.wallet_address,
        level: item.level,
        xp: item.xp,
        isPremium: item.is_premium,
        listedAt: item.created_at,
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
