import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { Username, User } from "@/models";

// GET /api/stats — public, no auth required
// Used by the landing page to show live protocol stats
export async function GET() {
  try {
    await connectDB();

    const [totalUsernames, totalUsers, totalListed] = await Promise.all([
      Username.countDocuments({}),
      User.countDocuments({}),
      Username.countDocuments({ isListed: true, listedPrice: { $gt: 0 } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsernames,
        totalUsers,
        totalListed,
      },
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
