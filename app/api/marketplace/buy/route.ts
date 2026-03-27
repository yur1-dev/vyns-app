// app/api/marketplace/buy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { Username, User, Activity, Transaction } from "@/models/index";

const PLATFORM_FEE_PCT = 0.025; // 2.5%

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const auth = !session?.user ? await verifyAuth(req) : null;

    if (!session?.user && !auth) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const buyerUserId = (session?.user as any)?.id ?? auth?.userId ?? null;
    const buyerWallet = (session?.user as any)?.wallet ?? auth?.wallet ?? null;

    let resolvedBuyerWallet = buyerWallet;
    if (!resolvedBuyerWallet && buyerUserId) {
      const buyerDoc = (await User.findById(buyerUserId)
        .select("wallet")
        .lean()) as any;
      resolvedBuyerWallet = buyerDoc?.wallet ?? null;
    }

    const body = await req.json();
    const { username } = body;
    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username required" },
        { status: 400 },
      );
    }

    const clean = username.toLowerCase().replace(/^@/, "");
    const record = await Username.findOne({
      $or: [
        { username: clean, isListed: true },
        { username: `@${clean}`, isListed: true },
      ],
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Listing not found or already sold" },
        { status: 404 },
      );
    }

    const isSelfPurchase =
      (resolvedBuyerWallet && record.walletAddress === resolvedBuyerWallet) ||
      (buyerUserId &&
        record.stats?.ownerId &&
        record.stats.ownerId === buyerUserId);

    if (isSelfPurchase) {
      return NextResponse.json(
        { success: false, error: "You already own this username" },
        { status: 400 },
      );
    }

    // Snapshot seller info before clearing
    const sellerUserId = record.listedById ?? record.stats?.ownerId ?? null;
    const sellerWallet = record.listedByWallet ?? record.walletAddress ?? null;
    const listPrice = record.listedPrice ?? 0;
    const displayUsername = record.username;

    // ── 2.5% platform fee ─────────────────────────────────────────────────────
    const platformFee = parseFloat((listPrice * PLATFORM_FEE_PCT).toFixed(9));
    const sellerPayout = parseFloat((listPrice - platformFee).toFixed(9));

    const newStats = {
      ...(record.stats ?? {}),
      ownerId: buyerUserId,
      isEmailUser: !resolvedBuyerWallet,
    };

    await Username.findByIdAndUpdate(record._id, {
      $set: {
        walletAddress: resolvedBuyerWallet ?? buyerUserId,
        isListed: false,
        stats: newStats,
        listedById: buyerUserId,
        listedByWallet: resolvedBuyerWallet ?? null,
      },
      $unset: { listedPrice: "" },
    });

    // ── Credit seller with payout AFTER 2.5% fee ──────────────────────────────
    if (sellerPayout > 0) {
      let sellerCredited = false;

      if (sellerUserId) {
        const result = await User.findByIdAndUpdate(
          sellerUserId,
          {
            $inc: {
              earnings: sellerPayout,
              marketplaceEarnings: sellerPayout,
              xp: 10,
            },
          },
          { new: false },
        ).catch(() => null);
        sellerCredited = !!result;
      }

      if (!sellerCredited && sellerWallet) {
        await User.findOneAndUpdate(
          { wallet: sellerWallet },
          {
            $inc: {
              earnings: sellerPayout,
              marketplaceEarnings: sellerPayout,
              xp: 10,
            },
          },
        ).catch(() => {});
      }
    }

    // ── Remove username from seller's usernames[] ─────────────────────────────
    const usernameVariants = [clean, `@${clean}`];
    if (sellerUserId) {
      await User.findByIdAndUpdate(sellerUserId, {
        $pull: { usernames: { name: { $in: usernameVariants } } },
      }).catch(() => {});
    } else if (sellerWallet) {
      await User.findOneAndUpdate(
        { wallet: sellerWallet },
        { $pull: { usernames: { name: { $in: usernameVariants } } } },
      ).catch(() => {});
    }

    // ── Clear seller's activeUsername if it matches the sold username ─────────
    const activeUsernameClearQuery = {
      $or: [{ activeUsername: clean }, { activeUsername: `@${clean}` }],
    };
    if (sellerUserId) {
      await User.findOneAndUpdate(
        { _id: sellerUserId, ...activeUsernameClearQuery },
        { $unset: { activeUsername: "" } },
      ).catch(() => {});
    } else if (sellerWallet) {
      await User.findOneAndUpdate(
        { wallet: sellerWallet, ...activeUsernameClearQuery },
        { $unset: { activeUsername: "" } },
      ).catch(() => {});
    }

    // ── Push username to buyer's usernames[] ──────────────────────────────────
    if (buyerUserId) {
      await User.findByIdAndUpdate(buyerUserId, {
        $push: {
          usernames: {
            name: record.username,
            tier: record.stats?.tier ?? null,
            claimedAt: new Date().toISOString(),
            staked: false,
          },
        },
      }).catch(() => {});
    }

    // ── Resolve buyer's active username for Transaction record ────────────────
    const buyerDoc = buyerUserId
      ? ((await User.findById(buyerUserId)
          .select("activeUsername")
          .lean()) as any)
      : null;
    const buyerActiveUsername = buyerDoc?.activeUsername
      ? `@${buyerDoc.activeUsername.replace("@", "")}`
      : null;

    // ── Write Transaction record ──────────────────────────────────────────────
    const txRecord = await Transaction.create({
      type: "purchase",
      amount: listPrice,
      token: "SOL",
      fromUsername: buyerActiveUsername ?? resolvedBuyerWallet ?? buyerUserId,
      fromWallet: resolvedBuyerWallet ?? null,
      toUsername: displayUsername,
      toWallet: sellerWallet ?? null,
      listedByWallet: sellerWallet ?? null,
      listedById: sellerUserId ?? null,
      username: displayUsername,
      timestamp: new Date(),
    }).catch(() => null);

    const txHash = txRecord?._id?.toString() ?? null;

    // ── Activity for BUYER ────────────────────────────────────────────────────
    if (resolvedBuyerWallet || buyerUserId) {
      await Activity.create({
        wallet: resolvedBuyerWallet ?? buyerUserId,
        type: "transaction",
        description: `You purchased @${clean} for ${listPrice} SOL`,
        amount: listPrice,
        txHash,
      }).catch(() => {});
    }

    // ── Activity for SELLER — shows net payout after fee ─────────────────────
    const activityKey =
      (sellerUserId
        ? ((await User.findById(sellerUserId).select("wallet").lean()) as any)
            ?.wallet
        : null) ??
      sellerWallet ??
      sellerUserId;

    if (activityKey) {
      await Activity.create({
        wallet: activityKey,
        type: "transaction",
        description: `@${clean} sold for ${listPrice} SOL (you received ${sellerPayout.toFixed(4)} SOL after 2.5% fee)`,
        amount: sellerPayout,
        txHash,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      username: clean,
      listPrice,
      platformFee,
      sellerPayout,
    });
  } catch (err: any) {
    console.error("[marketplace/buy]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
