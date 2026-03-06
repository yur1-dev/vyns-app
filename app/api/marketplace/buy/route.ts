// app/api/marketplace/buy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { Username, User } from "@/models/index";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { username } = await req.json();
    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username required" },
        { status: 400 },
      );
    }

    const clean = username.toLowerCase().replace(/^@/, "");
    const record = await Username.findOne({
      $or: [
        { username: clean, isListed: true },
        { username: `@${clean}`, isListed: true },
      ],
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Listing not found or already sold" },
        { status: 404 },
      );
    }

    // Block self-purchase — check all ownership identifiers
    const isSelfPurchase =
      (auth.wallet && record.walletAddress === auth.wallet) ||
      (auth.userId && record.walletAddress === auth.userId) ||
      (auth.userId && record.stats?.ownerId === auth.userId);

    if (isSelfPurchase) {
      return NextResponse.json(
        { success: false, error: "You already own this username" },
        { status: 400 },
      );
    }

    // Transfer ownership to buyer
    const newOwner = auth.wallet ?? auth.userId;
    record.walletAddress = newOwner;
    record.isListed = false;
    record.listedPrice = null;
    if (record.stats) {
      record.stats.ownerId = auth.userId;
    }
    await record.save();

    return NextResponse.json({ success: true, username: clean });
  } catch (err: any) {
    console.error("[marketplace/buy]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
