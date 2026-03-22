// app/api/marketplace/list/route.ts
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

    const body = await req.json();
    const { username, price } = body;

    if (!username || !price || price <= 0) {
      return NextResponse.json(
        { success: false, error: "Username and valid price required" },
        { status: 400 },
      );
    }

    const lowerUsername = username.toLowerCase().replace(/^@/, "");
    const record =
      (await Username.findOne({ username: lowerUsername })) ||
      (await Username.findOne({ username: `@${lowerUsername}` }));

    if (!record) {
      return NextResponse.json(
        { success: false, error: `Username @${lowerUsername} not found in DB` },
        { status: 404 },
      );
    }

    const ownerId = record.stats?.ownerId ?? null;
    const storedWallet = record.walletAddress ?? null;

    const isOwner =
      (auth.wallet && storedWallet === auth.wallet) ||
      (auth.userId && storedWallet === auth.userId) ||
      (auth.userId && ownerId === auth.userId);

    if (!isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: `Ownership mismatch — storedWallet: ${storedWallet?.slice(0, 10)}, ownerId: ${ownerId?.slice(0, 10)}, yourUserId: ${auth.userId?.slice(0, 10)}, yourWallet: ${auth.wallet?.slice(0, 10)}`,
        },
        { status: 403 },
      );
    }

    if (record.staked) {
      return NextResponse.json(
        { success: false, error: "Unstake before listing" },
        { status: 400 },
      );
    }

    record.listedPrice = price;
    record.isListed = true;
    // FIX: Save who is listing it right now, separately from ownership.
    // These never change after listing — even if someone buys it later,
    // we still know who the original lister was.
    record.listedById = auth.userId ?? null;
    record.listedByWallet = auth.wallet ?? null;
    await record.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[marketplace/list]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
