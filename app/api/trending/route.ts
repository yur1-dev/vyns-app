// app/api/trending/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { Trending } from "@/models/trending";

// GET /api/trending — returns all active trending entries
// Used by marketplace cards + dashboard to show badges
export async function GET() {
  try {
    await connectDB();

    const active = await Trending.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      trending: active.map((t: any) => ({
        keyword: t.keyword,
        matchedUsernames: t.matchedUsernames,
        category: t.category,
        duration: t.duration,
        yieldBoost: t.yieldBoost,
        priceFloorMultiplier: t.priceFloorMultiplier,
        expiresAt: t.expiresAt,
        source: t.source,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
