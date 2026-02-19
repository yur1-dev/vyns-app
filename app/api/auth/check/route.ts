import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/models";

// GET /api/auth/check?wallet=xxx — check if wallet is registered
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: "Wallet is required" },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findOne({ wallet });

    return NextResponse.json({
      success: true,
      isRegistered: !!user,
      hasUsername: !!user?.username,
      user: user || null,
    });
  } catch (error) {
    console.error("GET /api/auth/check error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check wallet" },
      { status: 500 },
    );
  }
}
