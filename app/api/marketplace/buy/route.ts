// app/api/marketplace/buy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { Username, User } from "@/models/index";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Support both auth methods — session first, wallet JWT fallback
    const session = await getServerSession(authOptions);
    const auth = !session?.user ? await verifyAuth(req) : null;

    if (!session?.user && !auth) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Resolve buyer identifiers
    const buyerUserId = (session?.user as any)?.id ?? auth?.userId ?? null;
    const buyerWallet = (session?.user as any)?.wallet ?? auth?.wallet ?? null;

    const body = await req.json();
    const { username } = body;
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

    // Self-purchase check — same type only, never cross-compare wallet vs userId
    const isSelfPurchase =
      (buyerWallet && record.walletAddress === buyerWallet) ||
      (buyerUserId &&
        record.stats?.ownerId &&
        record.stats.ownerId === buyerUserId);

    if (isSelfPurchase) {
      return NextResponse.json(
        { success: false, error: "You already own this username" },
        { status: 400 },
      );
    }

    // Transfer ownership to buyer
    record.walletAddress = buyerWallet ?? buyerUserId;
    record.isListed = false;
    record.listedPrice = null;
    if (record.stats) {
      record.stats.ownerId = buyerUserId ?? buyerWallet;
    }
    await record.save();

    // Push to buyer's User.usernames[] if they have a User doc
    if (buyerUserId) {
      await User.findByIdAndUpdate(buyerUserId, {
        $push: {
          usernames: {
            name: record.username,
            tier: record.stats?.tier ?? null,
            claimedAt: new Date().toISOString(),
            staked: false,
          },
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, username: clean });
  } catch (err: any) {
    console.error("[marketplace/buy]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
