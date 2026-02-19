import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/models";
import { nanoid } from "nanoid";

// GET /api/user/[wallet] — fetch or auto-create user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> },
) {
  try {
    await connectDB();
    const { wallet } = await params;

    let user = await User.findOne({ wallet });

    if (!user) {
      user = await User.create({
        wallet,
        xp: 0,
        level: 1,
        earnings: 0,
        stakedAmount: 0,
        referralCode: nanoid(8),
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("GET /api/user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

// POST /api/user/[wallet] — update user data
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> },
) {
  try {
    await connectDB();
    const { wallet } = await params;
    const body = await req.json();

    const allowedFields = [
      "username",
      "avatar",
      "xp",
      "level",
      "earnings",
      "stakedAmount",
    ];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const user = await User.findOneAndUpdate(
      { wallet },
      { $set: updates },
      { new: true, upsert: true },
    );

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("POST /api/user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 },
    );
  }
}
