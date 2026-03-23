import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongodb";
import { Activity, Transaction, User, Username } from "@/models";

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

    const wallet = user.wallet ?? null;
    const activeUsername = user.activeUsername
      ? `@${user.activeUsername.replace("@", "")}`
      : null;

    const notifications: any[] = [];

    // ── 1. Activity feed (stake, unstake, claim, referral, transaction) ──
    if (wallet) {
      const activities = (await Activity.find({ wallet })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean()) as any[];

      for (const a of activities) {
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
          default:
            type = "system";
            title = "System update";
        }

        notifications.push({
          id: `activity_${a._id}`,
          type,
          title,
          body,
          amount: a.amount ?? null,
          xpEarned: a.xpEarned ?? null,
          txHash: a.txHash ?? null,
          time: a.createdAt,
          read: false,
          source: "activity",
        });
      }
    }

    // ── 2. SOL received — transactions sent TO the user's active username ──
    if (activeUsername) {
      const received = (await Transaction.find({
        toUsername: activeUsername,
        type: { $in: ["transfer", "send", "sol_transfer"] },
      })
        .sort({ timestamp: -1 })
        .limit(20)
        .lean()) as any[];

      for (const tx of received) {
        notifications.push({
          id: `tx_in_${tx._id}`,
          type: "transaction",
          title: "SOL received",
          body: `${tx.fromUsername} sent you ${tx.amount} SOL`,
          amount: tx.amount,
          txHash: tx.txHash ?? null,
          time: tx.timestamp,
          read: false,
          source: "transaction",
        });
      }
    }

    // ── 3. Marketplace sale — username you listed was purchased ──
    if (wallet || userId) {
      const soldTxs = (await Transaction.find({
        type: { $in: ["purchase", "marketplace_sale", "buy"] },
        fromUsername: { $exists: true },
      })
        .sort({ timestamp: -1 })
        .limit(20)
        .lean()) as any[];

      const usernames = (await Username.find({
        $or: [{ listedById: userId.toString() }, { listedByWallet: wallet }],
      })
        .select("username listedById listedByWallet")
        .lean()) as any[];

      const myUsernames = new Set(usernames.map((u: any) => u.username));

      for (const tx of soldTxs) {
        if (tx.toUsername && myUsernames.has(tx.toUsername)) {
          notifications.push({
            id: `sale_${tx._id}`,
            type: "claim",
            title: "Username sold",
            body: `${tx.fromUsername ?? "Someone"} bought ${tx.toUsername} for ${tx.amount} SOL`,
            amount: tx.amount,
            txHash: tx.txHash ?? null,
            time: tx.timestamp,
            read: false,
            source: "marketplace",
          });
        }
      }
    }

    // ── 4. Referral signups ──
    if (user.referrals > 0) {
      notifications.push({
        id: `referral_total_${userId}`,
        type: "referral",
        title: "Referral program",
        body: `You have ${user.referrals} referral${user.referrals !== 1 ? "s" : ""}. Keep sharing to level up your tier.`,
        amount: user.referralEarnings ?? null,
        time: user.updatedAt,
        read: false,
        source: "referral",
      });
    }

    // ── Sort all by time desc ──
    notifications.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

    // ── Deduplicate by id ──
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
