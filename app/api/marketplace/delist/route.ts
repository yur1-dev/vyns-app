// app/api/marketplace/delist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { Username } from "@/models/index";

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
    const record = await Username.findOne({ username });

    if (!record)
      return NextResponse.json(
        { success: false, error: "Username not found" },
        { status: 404 },
      );
    if (record.walletAddress !== auth.wallet)
      return NextResponse.json(
        { success: false, error: "You don't own this username" },
        { status: 403 },
      );

    record.listedPrice = undefined;
    record.isListed = false;
    await record.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
