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
    // Always returns sets — never undefined — so filtering is always airtight
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
          // Skip deleted immediately — don't even add to list
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
      const soldTxs = (await Transaction.find({
        type: { $in: ["purchase", "marketplace_sale", "buy"] },
        fromUsername: { $exists: true },
      })
        .sort({ timestamp: -1 })
        .limit(20)
        .lean()) as any[];

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

      for (const tx of soldTxs) {
        const id = `sale_${tx._id}`;
        if (deletedSet.has(id)) continue;
        if (tx.toUsername && myUsernames.has(tx.toUsername)) {
          notifications.push({
            id,
            type: "marketplace",
            title: "Username sold",
            body: `${tx.fromUsername ?? "Someone"} bought ${tx.toUsername} for ${tx.amount} SOL`,
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
      // Only add if not deleted
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

    // ── Sort + dedupe (deleted already filtered above per-item) ──
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
