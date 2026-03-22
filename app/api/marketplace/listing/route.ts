// app/api/marketplace/listing/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { Username } from "@/models/index";

export async function GET(req: NextRequest) {
  try {
    const username = req.nextUrl.searchParams.get("username");
    if (!username) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }

    await connectDB();

    const clean = username.toLowerCase().replace(/^@/, "");
    const record = (await Username.findOne({
      $or: [
        { username: clean, isListed: true },
        { username: `@${clean}`, isListed: true },
      ],
    }).lean()) as any;

    if (!record) {
      return NextResponse.json({ listing: null });
    }

    return NextResponse.json({
      listing: {
        username: record.username?.replace(/^@/, "") ?? clean,
        price: record.listedPrice,
        // Current owner
        owner: record.stats?.ownerId ?? record.walletAddress,
        ownerWallet: record.walletAddress,
        // FIX: Original lister — stable, doesn't change on purchase
        listedById: record.listedById ?? null,
        listedByWallet: record.listedByWallet ?? null,
        level: record.level ?? 1,
        xp: record.xp ?? 0,
        isPremium: record.isPremium ?? false,
        tier: record.stats?.tier ?? null,
        listedAt:
          record.updatedAt ?? record.createdAt ?? new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[marketplace/listing]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
