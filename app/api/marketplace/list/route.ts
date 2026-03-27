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
        { success: false, error: `Username @${lowerUsername} not found` },
        { status: 404 },
      );
    }

    // ── Resolve caller's wallet ───────────────────────────────────────────────
    let callerWallet = auth.wallet;
    if (!callerWallet && auth.userId) {
      const userDoc = await User.findById(auth.userId).lean();
      callerWallet = (userDoc as any)?.wallet ?? undefined;
    }

    const callerId = auth.userId;
    const recordOwnerId = record.stats?.ownerId as string | undefined;

    // ── Ownership check ───────────────────────────────────────────────────────
    // Primary: ownerId match (works for ALL auth types)
    // Fallback: wallet match (wallet users whose ownerId may not be set on old records)
    const ownerIdMatch =
      callerId && recordOwnerId && recordOwnerId === callerId;
    const walletMatch = callerWallet && record.walletAddress === callerWallet;

    if (!ownerIdMatch && !walletMatch) {
      return NextResponse.json(
        { success: false, error: "You don't own this username" },
        { status: 403 },
      );
    }

    // ── GUARD: cannot list a staked username ─────────────────────────────────
    if (record.staked || record.stats?.staked) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This username is currently staked. Unstake it before listing.",
        },
        { status: 400 },
      );
    }

    record.listedPrice = price;
    record.isListed = true;
    record.listedById = callerId ?? undefined;
    record.listedByWallet = callerWallet ?? undefined;
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
