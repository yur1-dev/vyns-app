import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Activity } from "@/models";

// GET /api/activity/[wallet] — fetch user activity feed
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> },
) {
  try {
    await connectDB();
    const { wallet } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const activities = await Activity.find({ wallet })
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error("GET /api/activity error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activities" },
      { status: 500 },
    );
  }
}

// POST /api/activity/[wallet] — log a new activity
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> },
) {
  try {
    await connectDB();
    const { wallet } = await params;
    const { type, description, amount, xpEarned, txHash } = await req.json();

    if (!type || !description) {
      return NextResponse.json(
        { success: false, error: "Type and description are required" },
        { status: 400 },
      );
    }

    const activity = await Activity.create({
      wallet,
      type,
      description,
      amount,
      xpEarned,
      txHash,
    });

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error("POST /api/activity error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to log activity" },
      { status: 500 },
    );
  }
}
