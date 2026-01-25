import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get("sort") || "recent";
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const client = await clientPromise;
    const db = client.db("vyns_db");

    // Build sort criteria
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

    // Get listed usernames only (those with a price)
    const listings = await db
      .collection("usernames")
      .find({
        listed_price: { $ne: null, $gt: 0 },
      })
      .sort(sortCriteria)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await db.collection("usernames").countDocuments({
      listed_price: { $ne: null, $gt: 0 },
    });

    return NextResponse.json({
      listings: listings.map((item) => ({
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
      { status: 500 }
    );
  }
}
