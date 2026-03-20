// app/api/username/activate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { Username, User } from "@/models/index";
import { Types } from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, wallet: bodyWallet } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const lowerUsername = username.toLowerCase().replace(/^@/, "");

    // Find username record with or without @ prefix
    const record =
      (await Username.findOne({ username: lowerUsername })) ||
      (await Username.findOne({ username: `@${lowerUsername}` }));

    if (!record) {
      return NextResponse.json(
        { error: "Username not found" },
        { status: 404 },
      );
    }

    // Find the user — try all strategies
    let user: any = null;

    if (bodyWallet) {
      user = await User.findOne({ wallet: bodyWallet }).lean();
    }
    if (!user && auth.wallet) {
      user = await User.findOne({ wallet: auth.wallet }).lean();
    }
    if (!user && auth.userId && Types.ObjectId.isValid(auth.userId)) {
      user = await User.findById(auth.userId).lean();
    }
    if (!user && auth.email) {
      user = await User.findOne({ email: auth.email }).lean();
    }
    if (!user && auth.userId) {
      user = await User.findOne({ email: auth.userId }).lean();
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = (user as any)._id.toString();
    const ownerId = record.stats?.ownerId ?? null;
    const storedWallet = record.walletAddress ?? null;

    // Check ownership via Username record fields OR User's usernames array
    const ownedInArray = ((user as any).usernames ?? []).some(
      (u: any) =>
        (u.name ?? u.username ?? "").replace(/^@/, "").toLowerCase() ===
        lowerUsername,
    );

    const isOwner =
      ownedInArray ||
      (bodyWallet && storedWallet === bodyWallet) ||
      (bodyWallet && ownerId === bodyWallet) ||
      (auth.wallet && storedWallet === auth.wallet) ||
      (auth.wallet && ownerId === auth.wallet) ||
      storedWallet === userId ||
      ownerId === userId;

    if (!isOwner) {
      return NextResponse.json(
        {
          error: `You don't own this username. storedWallet: ${storedWallet?.slice(0, 10)}, ownerId: ${ownerId?.slice(0, 10)}, yourId: ${userId?.slice(0, 10)}`,
        },
        { status: 403 },
      );
    }

    // Update — try all filter strategies
    let updated: any = null;

    if (bodyWallet) {
      updated = await User.findOneAndUpdate(
        { wallet: bodyWallet },
        { $set: { activeUsername: lowerUsername } },
        { new: true },
      );
    }
    if (!updated && auth.wallet) {
      updated = await User.findOneAndUpdate(
        { wallet: auth.wallet },
        { $set: { activeUsername: lowerUsername } },
        { new: true },
      );
    }
    if (!updated && Types.ObjectId.isValid(userId)) {
      updated = await User.findByIdAndUpdate(
        userId,
        { $set: { activeUsername: lowerUsername } },
        { new: true },
      );
    }
    if (!updated && auth.email) {
      updated = await User.findOneAndUpdate(
        { email: auth.email },
        { $set: { activeUsername: lowerUsername } },
        { new: true },
      );
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, activeUsername: lowerUsername });
  } catch (err: any) {
    console.error("[username/activate]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
