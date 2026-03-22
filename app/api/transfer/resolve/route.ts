// app/api/transfer/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { Username, User } from "@/models/index";

export async function GET(req: NextRequest) {
  try {
    const username = req.nextUrl.searchParams.get("username");
    if (!username) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }

    await connectDB();
    const clean = username.toLowerCase().replace(/^@/, "");

    // Look up the Username record first
    const record = (await Username.findOne({
      $or: [{ username: clean }, { username: `@${clean}` }],
    }).lean()) as any;

    if (!record) {
      return NextResponse.json(
        { error: `@${clean} not found` },
        { status: 404 },
      );
    }

    // Resolve wallet: walletAddress on the Username record is most reliable
    let wallet = record.walletAddress ?? null;

    // Fallback: look up via stats.ownerId in User collection
    if (!wallet && record.stats?.ownerId) {
      const user = (await User.findById(record.stats.ownerId).lean()) as any;
      wallet = user?.wallet ?? null;
    }

    if (!wallet) {
      return NextResponse.json(
        { error: `@${clean} has no linked wallet` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      username: clean,
      wallet,
    });
  } catch (err: any) {
    console.error("[transfer/resolve]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
