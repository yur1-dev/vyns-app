import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongodb";
import { Activity, Transaction, User, Username } from "@/models";
import NotificationState from "@/models/NotificationState";

// GET /api/notifications — aggregates activity, transactions, referrals, and marketplace sales
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const user = (await User.findById(userId).lean()) as any;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Load this user's read/deleted state from DB
    const state = (await NotificationState.findOne({
      userId: userId.toString(),
    }).lean()) as any;
    const readSet = new Set<string>(state?.readIds ?? []);
    const deletedSet = new Set<string>(state?.deletedIds ?? []);

    const wallet = user.wallet ?? null;
    const activeUsername = user.activeUsername
      ? `@${user.activeUsername.replace("@", "")}`
      : null;

    const notifications: any[] = [];

    // ── 1. Activity feed ──
    {
      const activityQuery: any[] = [];
      if (wallet) activityQuery.push({ wallet });
      if (userId) activityQuery.push({ userId: userId.toString() });

      if (activityQuery.length > 0) {
        const activities = (await Activity.find({ $or: activityQuery })
          .sort({ createdAt: -1 })
          .limit(30)
          .lean()) as any[];

        for (const a of activities) {
          const id = `activity_${a._id}`;
          if (deletedSet.has(id)) continue;

          let type: string = "system";
          let title = "";
          const body = a.description;

          switch (a.type) {
            case "stake":
              type = "staking";
              title = "Username staked";
              break;
            case "unstake":
              type = "staking";
              title = "Username unstaked";
              break;
            case "claim":
              type = "claim";
              title = "Username claimed";
              break;
            case "referral":
              type = "referral";
              title = "Referral reward";
              break;
            case "transaction":
              type = "transaction";
              title = "SOL transaction";
              break;
            case "marketplace_sale":
            case "sale":
              type = "marketplace";
              title = "Username sold";
              break;
            default:
              type = "system";
              title = "System update";
          }

          notifications.push({
            id,
            type,
            title,
            body,
            amount: a.amount ?? null,
            xpEarned: a.xpEarned ?? null,
            txHash: a.txHash ?? null,
            time: a.createdAt,
            read: readSet.has(id),
            source: "activity",
          });
        }
      }
    }

    // ── 2. SOL received ──
    if (activeUsername) {
      const received = (await Transaction.find({
        toUsername: activeUsername,
        type: { $in: ["transfer", "send", "sol_transfer"] },
      })
        .sort({ timestamp: -1 })
        .limit(20)
        .lean()) as any[];

      for (const tx of received) {
        const id = `tx_in_${tx._id}`;
        if (deletedSet.has(id)) continue;
        notifications.push({
          id,
          type: "transaction",
          title: "SOL received",
          body: `${tx.fromUsername} sent you ${tx.amount} SOL`,
          amount: tx.amount,
          txHash: tx.txHash ?? null,
          time: tx.timestamp,
          read: readSet.has(id),
          source: "transaction",
        });
      }
    }

    // ── 3. Marketplace sales ──
    if (wallet || userId) {
      // Find usernames owned/listed by this user
      const usernameQuery: any[] = [];
      if (userId) usernameQuery.push({ listedById: userId.toString() });
      if (wallet) usernameQuery.push({ listedByWallet: wallet });

      const usernames =
        usernameQuery.length > 0
          ? ((await Username.find({ $or: usernameQuery })
              .select("username listedById listedByWallet")
              .lean()) as any[])
          : [];

      const myUsernames = new Set(usernames.map((u: any) => u.username));

      if (myUsernames.size > 0) {
        // Fetch purchase transactions where the sold username belongs to this user
        const soldTxs = (await Transaction.find({
          type: { $in: ["purchase", "marketplace_sale", "buy"] },
          toUsername: { $in: Array.from(myUsernames) },
        })
          .sort({ timestamp: -1 })
          .limit(20)
          .lean()) as any[];

        // Collect all buyer wallet addresses so we can resolve their usernames
        const buyerWallets = [
          ...new Set(
            soldTxs
              .map(
                (tx: any) =>
                  tx.buyerWallet ?? tx.fromWallet ?? tx.buyer ?? null,
              )
              .filter(Boolean),
          ),
        ];

        // Build a wallet → username map for buyers
        const buyerUsernameMap = new Map<string, string>();
        if (buyerWallets.length > 0) {
          const buyerUsers = (await User.find({
            wallet: { $in: buyerWallets },
          })
            .select("wallet activeUsername")
            .lean()) as any[];

          for (const bu of buyerUsers) {
            if (bu.wallet && bu.activeUsername) {
              buyerUsernameMap.set(
                bu.wallet,
                `@${bu.activeUsername.replace("@", "")}`,
              );
            }
          }
        }

        for (const tx of soldTxs) {
          const id = `sale_${tx._id}`;
          if (deletedSet.has(id)) continue;

          // Resolve buyer display name — prefer stored username fields, then
          // wallet→username lookup, then truncated wallet, then "Someone"
          const buyerWallet =
            tx.buyerWallet ?? tx.fromWallet ?? tx.buyer ?? null;

          const buyerDisplay: string =
            // 1. Explicit buyer username stored on the transaction
            tx.buyerUsername ??
            tx.fromUsername ??
            // 2. Resolved from wallet → User lookup
            (buyerWallet ? buyerUsernameMap.get(buyerWallet) : undefined) ??
            // 3. Truncated wallet address as last resort (not a contract hash)
            (buyerWallet && buyerWallet.length > 12
              ? `${buyerWallet.slice(0, 4)}…${buyerWallet.slice(-4)}`
              : buyerWallet) ??
            "Someone";

          notifications.push({
            id,
            type: "marketplace",
            title: "Username sold",
            body: `${buyerDisplay} bought ${tx.toUsername} for ${tx.amount} SOL`,
            amount: tx.amount,
            txHash: tx.txHash ?? null,
            time: tx.timestamp,
            read: readSet.has(id),
            source: "marketplace",
          });
        }
      }
    }

    // ── 4. Referral signups ──
    if (user.referrals > 0) {
      const id = `referral_total_${userId}`;
      if (!deletedSet.has(id)) {
        notifications.push({
          id,
          type: "referral",
          title: "Referral program",
          body: `You have ${user.referrals} referral${user.referrals !== 1 ? "s" : ""}. Keep sharing to level up your tier.`,
          amount: user.referralEarnings ?? null,
          time: user.updatedAt,
          read: readSet.has(id),
          source: "referral",
        });
      }
    }

    // ── Sort + dedupe ──
    notifications.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

    const seen = new Set<string>();
    const unique = notifications.filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });

    return NextResponse.json({
      success: true,
      notifications: unique.slice(0, 50),
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
