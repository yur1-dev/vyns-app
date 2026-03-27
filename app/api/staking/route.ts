// app/api/staking/username/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { verifyAuth } from "@/lib/utils/auth";
import { User, Username } from "@/models";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, action } = await req.json(); // action: "stake" | "unstake"
    if (!username || !action) {
      return NextResponse.json(
        { error: "username and action required" },
        { status: 400 },
      );
    }

    const lowerUsername = username.toLowerCase().replace(/^@/, "");
    const record =
      (await Username.findOne({ username: lowerUsername })) ||
      (await Username.findOne({ username: `@${lowerUsername}` }));

    if (!record) {
      return NextResponse.json(
        { error: `Username @${lowerUsername} not found` },
        { status: 404 },
      );
    }

    // Ownership check
    const ownerId = record.stats?.ownerId ?? null;
    const storedWallet = record.walletAddress ?? null;
    const isOwner =
      (auth.wallet && storedWallet === auth.wallet) ||
      (auth.userId && storedWallet === auth.userId) ||
      (auth.userId && ownerId === auth.userId);

    if (!isOwner) {
      return NextResponse.json(
        { error: "You don't own this username" },
        { status: 403 },
      );
    }

    if (action === "stake") {
      // ── GUARD: cannot stake a listed username ──
      if (record.isListed) {
        return NextResponse.json(
          {
            error:
              "This username is listed on the marketplace. Delist it before staking.",
          },
          { status: 400 },
        );
      }

      if (record.staked) {
        return NextResponse.json(
          { error: "Username is already staked" },
          { status: 400 },
        );
      }

      record.staked = true;
      if (record.stats) record.stats.staked = true;
      await record.save();

      // Sync staked flag on the User.usernames[] subdoc if it exists
      await User.updateOne(
        {
          $or: [{ _id: auth.userId }, { wallet: auth.wallet }],
          "usernames.id": record._id.toString(),
        },
        { $set: { "usernames.$.staked": true } },
      );

      return NextResponse.json({ success: true, action: "staked" });
    }

    if (action === "unstake") {
      if (!record.staked) {
        return NextResponse.json(
          { error: "Username is not staked" },
          { status: 400 },
        );
      }

      record.staked = false;
      if (record.stats) record.stats.staked = false;
      await record.save();

      await User.updateOne(
        {
          $or: [{ _id: auth.userId }, { wallet: auth.wallet }],
          "usernames.id": record._id.toString(),
        },
        { $set: { "usernames.$.staked": false } },
      );

      return NextResponse.json({ success: true, action: "unstaked" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[staking/username]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
