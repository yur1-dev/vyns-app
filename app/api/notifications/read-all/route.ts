// app/api/notifications/read-all/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongodb";
import { Activity, Transaction, User, Username } from "@/models";
import NotificationState from "@/models/NotificationState";

// POST /api/notifications/read-all
// Marks every current notification as read for the authenticated user
export async function POST(req: NextRequest) {
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

    // Optionally accept a list of IDs from the client (faster),
    // or fall back to re-deriving all current notification IDs
    let ids: string[] = [];

    try {
      const body = await req.json();
      if (Array.isArray(body?.ids) && body.ids.length > 0) {
        ids = body.ids as string[];
      }
    } catch {
      // body was empty — we'll derive IDs below
    }

    // If client didn't send IDs, derive them server-side
    if (ids.length === 0) {
      const user = (await User.findById(userId).lean()) as any;
      if (!user)
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 },
        );

      const wallet = user.wallet ?? null;
      const activeUsername = user.activeUsername
        ? `@${user.activeUsername.replace("@", "")}`
        : null;

      if (wallet) {
        const acts = await Activity.find({ wallet })
          .select("_id")
          .limit(30)
          .lean();
        ids.push(...acts.map((a: any) => `activity_${a._id}`));
      }

      if (activeUsername) {
        const txs = await Transaction.find({
          toUsername: activeUsername,
          type: { $in: ["transfer", "send", "sol_transfer"] },
        })
          .select("_id")
          .limit(20)
          .lean();
        ids.push(...txs.map((t: any) => `tx_in_${t._id}`));
      }

      if (wallet || userId) {
        const soldTxs = (await Transaction.find({
          type: { $in: ["purchase", "marketplace_sale", "buy"] },
          fromUsername: { $exists: true },
        })
          .select("_id toUsername")
          .limit(20)
          .lean()) as any[];

        const usernames = (await Username.find({
          $or: [{ listedById: userId.toString() }, { listedByWallet: wallet }],
        })
          .select("username")
          .lean()) as any[];

        const myUsernames = new Set(usernames.map((u: any) => u.username));
        for (const tx of soldTxs) {
          if (tx.toUsername && myUsernames.has(tx.toUsername)) {
            ids.push(`sale_${tx._id}`);
          }
        }
      }

      if (user.referrals > 0) {
        ids.push(`referral_total_${userId}`);
      }
    }

    // Upsert — add all IDs to readIds, remove from deletedIds
    await NotificationState.findOneAndUpdate(
      { userId },
      {
        $addToSet: { readIds: { $each: ids } },
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({ success: true, markedRead: ids.length });
  } catch (error) {
    console.error("POST /api/notifications/read-all error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark as read" },
      { status: 500 },
    );
  }
}
