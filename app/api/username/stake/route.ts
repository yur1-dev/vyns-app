// app/api/username/stake/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { verifyAuth } from "@/lib/utils/auth";
import { Username } from "@/models";

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username, action, signature } = body;

    if (!username || !["stake", "unstake"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Wallet users must provide a signature as proof of ownership
    const isWalletUser = !!auth.wallet;
    if (isWalletUser && !signature) {
      return NextResponse.json(
        { error: "Wallet signature required to stake" },
        { status: 400 },
      );
    }

    await connectDB();

    const record = await Username.findOne({ username: username.toLowerCase() });
    if (!record) {
      return NextResponse.json(
        { error: "Username not found" },
        { status: 404 },
      );
    }

    const staked = action === "stake";

    await Username.findByIdAndUpdate(record._id, {
      $set: {
        "stats.staked": staked,
        // Store the signature so we have an on-chain proof trail
        ...(signature ? { "stats.lastStakeSig": signature } : {}),
        "stats.stakedAt": staked ? new Date().toISOString() : null,
      },
    });

    return NextResponse.json({ success: true, username, staked });
  } catch (err) {
    console.error("[username/stake]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
