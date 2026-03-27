// app/api/marketplace/buy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { Username, User, Activity, Transaction } from "@/models/index";

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

    // ── Resolve buyer's wallet from DB if not in session/token ───────────────
    // This prevents walletAddress being set to a userId on the Username doc.
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

    // Snapshot seller info before clearing it
    const sellerUserId = record.listedById ?? record.stats?.ownerId ?? null;
    const sellerWallet = record.listedByWallet ?? record.walletAddress ?? null;
    const salePrice = record.listedPrice ?? 0;
    const displayUsername = record.username;

    const newStats = {
      ...(record.stats ?? {}),
      ownerId: buyerUserId, // always use userId as canonical owner
      isEmailUser: !resolvedBuyerWallet, // track if buyer has no wallet
    };

    await Username.findByIdAndUpdate(record._id, {
      $set: {
        // ── FIXED: walletAddress is only ever a real wallet.
        // For email/Google buyers with no wallet, fall back to their userId
        // (same schema-required fallback as claim) but ownerId in stats
        // is the canonical key all ownership checks use.
        walletAddress: resolvedBuyerWallet ?? buyerUserId,
        isListed: false,
        stats: newStats,
        listedById: buyerUserId, // update to new owner so delist works
        listedByWallet: resolvedBuyerWallet ?? null,
      },
      $unset: { listedPrice: "" },
    });

    // ── Credit seller earnings ────────────────────────────────────────────────
    if (salePrice > 0) {
      let sellerCredited = false;

      if (sellerUserId) {
        const result = await User.findByIdAndUpdate(
          sellerUserId,
          {
            $inc: {
              earnings: salePrice,
              marketplaceEarnings: salePrice,
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
              earnings: salePrice,
              marketplaceEarnings: salePrice,
              xp: 10,
            },
          },
        ).catch(() => {});
      }
    }

    // Remove username from seller's User.usernames[]
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

    // Push to buyer's User.usernames[]
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

    // ── Resolve buyer's active username for Transaction.toUsername ────────────
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
      amount: salePrice,
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

    // ── Write Activity for BUYER ──────────────────────────────────────────────
    if (resolvedBuyerWallet || buyerUserId) {
      await Activity.create({
        wallet: resolvedBuyerWallet ?? buyerUserId,
        type: "transaction",
        description: `You purchased ${displayUsername} for ${salePrice} SOL`,
        amount: salePrice,
        txHash,
      }).catch(() => {});
    }

    // ── Write Activity for SELLER ─────────────────────────────────────────────
    if (sellerWallet || sellerUserId) {
      const sellerDoc = sellerUserId
        ? ((await User.findById(sellerUserId).select("wallet").lean()) as any)
        : null;
      const resolvedSellerWallet = sellerDoc?.wallet ?? sellerWallet;

      if (resolvedSellerWallet) {
        await Activity.create({
          wallet: resolvedSellerWallet,
          type: "transaction",
          description: `${displayUsername} was sold for ${salePrice} SOL`,
          amount: salePrice,
          txHash,
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, username: clean });
  } catch (err: any) {
    console.error("[marketplace/buy]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
