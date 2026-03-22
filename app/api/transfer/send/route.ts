// app/api/transfer/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { Transaction, Activity, User, Username } from "@/models/index";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions).catch(() => null);
    const auth = !session?.user ? await verifyAuth(req) : null;

    if (!session?.user && !auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { fromUsername, toUsername, amount, txHash } = await req.json();

    if (!fromUsername || !toUsername || !amount || !txHash) {
      return NextResponse.json(
        { error: "fromUsername, toUsername, amount, txHash required" },
        { status: 400 },
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be > 0" },
        { status: 400 },
      );
    }

    if (fromUsername.toLowerCase() === toUsername.toLowerCase()) {
      return NextResponse.json(
        { error: "Cannot send to yourself" },
        { status: 400 },
      );
    }

    // Record the transaction
    await Transaction.create({
      fromUsername: fromUsername.replace(/^@/, ""),
      toUsername: toUsername.replace(/^@/, ""),
      type: "transfer",
      amount,
      token: "SOL",
      txHash,
      timestamp: new Date(),
    });

    // Record activity for sender
    const senderWallet = auth?.wallet ?? (session?.user as any)?.wallet ?? null;
    if (senderWallet) {
      await Activity.create({
        wallet: senderWallet,
        type: "transaction",
        description: `Sent ${amount} SOL to @${toUsername.replace(/^@/, "")}`,
        amount: -amount,
        txHash,
      });
    }

    // Record activity for receiver — look up their wallet
    const cleanTo = toUsername.toLowerCase().replace(/^@/, "");
    const toRecord = (await Username.findOne({
      $or: [{ username: cleanTo }, { username: `@${cleanTo}` }],
    }).lean()) as any;

    const receiverWallet = toRecord?.walletAddress ?? null;
    if (receiverWallet) {
      await Activity.create({
        wallet: receiverWallet,
        type: "transaction",
        description: `Received ${amount} SOL from @${fromUsername.replace(/^@/, "")}`,
        amount,
        txHash,
      });
    }

    return NextResponse.json({ success: true, txHash });
  } catch (err: any) {
    console.error("[transfer/send]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
