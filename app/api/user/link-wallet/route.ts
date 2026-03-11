// app/api/user/link-wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { wallet } = await req.json();
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: "Wallet address required" },
        { status: 400 },
      );
    }

    await connectDB();

    const userId = (session.user as any).id;

    // If another account owns this wallet, unlink it from there first
    // (happens when user previously signed in via wallet-auth, creating a
    //  separate user record — safe to unlink since they now own both accounts)
    const existing = await User.findOne({ wallet, _id: { $ne: userId } });
    if (existing) {
      await User.findByIdAndUpdate(existing._id, { $unset: { wallet: "" } });
    }

    await User.findByIdAndUpdate(userId, { $set: { wallet } });

    return NextResponse.json({ success: true, wallet });
  } catch (err: any) {
    console.error("[link-wallet]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }
    await connectDB();
    const userId = (session.user as any).id;
    await User.findByIdAndUpdate(userId, { $unset: { wallet: "" } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
