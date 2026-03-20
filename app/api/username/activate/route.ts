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

    const record =
      (await Username.findOne({ username: lowerUsername })) ||
      (await Username.findOne({ username: `@${lowerUsername}` }));

    if (!record) {
      return NextResponse.json(
        { error: "Username not found" },
        { status: 404 },
      );
    }

    // Find the user making the request
    const userFilter = auth.wallet
      ? { wallet: auth.wallet }
      : { _id: auth.userId };
    const user = (await User.findOne(userFilter).lean()) as any;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ownerId = record.stats?.ownerId ?? null;
    const storedWallet = record.walletAddress ?? null;
    const userId = user._id.toString();

    // Check ownership via Username record fields OR via User's username array
    const ownedInArray = (user.usernames ?? []).some(
      (u: any) =>
        (u.name ?? u.username ?? "").replace(/^@/, "").toLowerCase() ===
        lowerUsername,
    );

    const isOwner =
      ownedInArray ||
      (auth.wallet && storedWallet === auth.wallet) ||
      storedWallet === userId ||
      ownerId === userId ||
      (auth.wallet && ownerId === auth.wallet);

    if (!isOwner) {
      return NextResponse.json(
        {
          error: `You don't own this username. storedWallet: ${storedWallet?.slice(0, 10)}, ownerId: ${ownerId?.slice(0, 10)}, yourId: ${userId?.slice(0, 10)}`,
        },
        { status: 403 },
      );
    }

    await User.findOneAndUpdate(userFilter, {
      $set: { activeUsername: lowerUsername },
    });

    return NextResponse.json({ success: true, activeUsername: lowerUsername });
  } catch (err: any) {
    console.error("[username/activate]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
