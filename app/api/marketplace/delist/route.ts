// app/api/marketplace/delist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { Username, User } from "@/models/index";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const auth = await verifyAuth(req);
    if (!auth)
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );

    const { username } = await req.json();
    if (!username)
      return NextResponse.json(
        { success: false, error: "Username is required" },
        { status: 400 },
      );

    const record = await Username.findOne({ username });
    if (!record)
      return NextResponse.json(
        { success: false, error: "Username not found" },
        { status: 404 },
      );

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

    // ── Delist ────────────────────────────────────────────────────────────────
    record.isListed = false;
    record.listedPrice = undefined;
    // Keep listedById/listedByWallet intact — they identify the owner, not just the listing.
    await record.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[marketplace/delist]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
