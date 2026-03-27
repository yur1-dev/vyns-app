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

    const clean = username.toLowerCase().replace(/^@/, "");
    const record = await Username.findOne({
      $or: [{ username: clean }, { username: `@${clean}` }],
    });

    if (!record)
      return NextResponse.json(
        { success: false, error: "Username not found" },
        { status: 404 },
      );

    // ── Resolve caller's wallet from DB if not in token ───────────────────────
    let callerWallet = auth.wallet;
    if (!callerWallet && auth.userId) {
      const userDoc = (await User.findById(auth.userId)
        .select("wallet")
        .lean()) as any;
      callerWallet = userDoc?.wallet ?? null;
    }

    const callerId = auth.userId;
    const recordOwnerId = record.stats?.ownerId as string | undefined;
    const recordListedBy = record.listedById as string | undefined;

    // ── Ownership: any one of these must match ────────────────────────────────
    const byOwnerId = callerId && recordOwnerId && recordOwnerId === callerId;
    const byListedBy =
      callerId && recordListedBy && recordListedBy === callerId;
    const byWallet = callerWallet && record.walletAddress === callerWallet;

    if (!byOwnerId && !byListedBy && !byWallet) {
      return NextResponse.json(
        { success: false, error: "You don't own this username" },
        { status: 403 },
      );
    }

    record.isListed = false;
    record.listedPrice = undefined;
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
