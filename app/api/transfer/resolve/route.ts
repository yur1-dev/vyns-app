// app/api/transfer/resolve/route.ts — FIXED
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { Username, User } from "@/models/index";

// Solana pubkeys are 32-44 base58 chars — anything else is not a real wallet
function isValidSolanaAddress(addr: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

export async function GET(req: NextRequest) {
  try {
    const username = req.nextUrl.searchParams.get("username");
    if (!username) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }

    await connectDB();
    const clean = username.toLowerCase().replace(/^@/, "");

    const record = (await Username.findOne({
      $or: [{ username: clean }, { username: `@${clean}` }],
    }).lean()) as any;

    if (!record) {
      return NextResponse.json(
        { error: `@${clean} not found` },
        { status: 404 },
      );
    }

    let wallet: string | null = null;

    // Strategy 1: walletAddress is a real Solana key
    if (record.walletAddress && isValidSolanaAddress(record.walletAddress)) {
      wallet = record.walletAddress;
    }

    // Strategy 2: stats.ownerId → User.wallet
    if (!wallet && record.stats?.ownerId) {
      const user = (await User.findById(record.stats.ownerId).lean()) as any;
      if (user?.wallet && isValidSolanaAddress(user.wallet)) {
        wallet = user.wallet;
      }
    }

    // Strategy 3: walletAddress is actually a userId (email users) → User._id
    if (
      !wallet &&
      record.walletAddress &&
      !isValidSolanaAddress(record.walletAddress)
    ) {
      try {
        const user = (await User.findById(record.walletAddress).lean()) as any;
        if (user?.wallet && isValidSolanaAddress(user.wallet)) {
          wallet = user.wallet;
        }
      } catch {
        // Not a valid ObjectId, skip
      }
    }

    // Strategy 4: look up User by activeUsername or username
    if (!wallet) {
      const user = (await User.findOne({
        $or: [
          { activeUsername: clean },
          { activeUsername: `@${clean}` },
          { username: clean },
          { username: `@${clean}` },
        ],
      }).lean()) as any;
      if (user?.wallet && isValidSolanaAddress(user.wallet)) {
        wallet = user.wallet;
      }
    }

    if (!wallet) {
      return NextResponse.json(
        { error: `@${clean} hasn't linked a wallet yet` },
        { status: 404 },
      );
    }

    return NextResponse.json({ username: clean, wallet });
  } catch (err: any) {
    console.error("[transfer/resolve]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
