// app/api/username/activate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { Username, User } from "@/models/index";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const lowerUsername = username.toLowerCase().replace(/^@/, "");

    // Find username with or without @ prefix
    const record =
      (await Username.findOne({ username: lowerUsername })) ||
      (await Username.findOne({ username: `@${lowerUsername}` }));

    if (!record) {
      return NextResponse.json(
        { error: "Username not found" },
        { status: 404 },
      );
    }

    // Multi-strategy ownership check
    const ownerId = record.stats?.ownerId ?? null;
    const storedWallet = record.walletAddress ?? null;

    const isOwner =
      (auth.wallet && storedWallet === auth.wallet) ||
      (auth.userId && storedWallet === auth.userId) ||
      (auth.userId && ownerId === auth.userId);

    if (!isOwner) {
      return NextResponse.json(
        {
          error: `You don't own this username. storedWallet: ${storedWallet?.slice(0, 10)}, ownerId: ${ownerId?.slice(0, 10)}, yourId: ${auth.userId?.slice(0, 10)}`,
        },
        { status: 403 },
      );
    }

    // Update active username on User document
    const userFilter = auth.wallet
      ? { wallet: auth.wallet }
      : { _id: auth.userId };

    await User.findOneAndUpdate(userFilter, {
      $set: { activeUsername: lowerUsername },
    });

    return NextResponse.json({ success: true, activeUsername: lowerUsername });
  } catch (err: any) {
    console.error("[username/activate]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
