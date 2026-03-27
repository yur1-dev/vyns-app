// app/api/auth/delete-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongodb";
import { User, Username, Activity } from "@/models";
import NotificationState from "@/models/NotificationState";
import bcrypt from "bcryptjs";

export async function DELETE(req: NextRequest) {
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

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Email/password users must confirm with their password
    if (user.password) {
      let body: any = {};
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: "Password is required to delete your account",
          },
          { status: 400 },
        );
      }
      if (!body?.password) {
        return NextResponse.json(
          {
            success: false,
            error: "Password is required to delete your account",
          },
          { status: 400 },
        );
      }
      const match = await bcrypt.compare(body.password, user.password);
      if (!match) {
        return NextResponse.json(
          { success: false, error: "Incorrect password" },
          { status: 403 },
        );
      }
    }

    // 1. Release all usernames owned by this user
    await Username.updateMany(
      {
        $or: [
          { listedById: userId.toString() },
          { ownerId: userId.toString() },
        ],
      },
      {
        $set: {
          listed: false,
          listedById: null,
          listedByWallet: null,
          ownerId: null,
          ownerWallet: null,
        },
      },
    );

    // 2. Delete notification state
    await NotificationState.deleteOne({ userId: userId.toString() });

    // 3. Delete activities tied to wallet
    if (user.wallet) {
      await Activity.deleteMany({ wallet: user.wallet });
    }

    // 4. Delete the user
    await User.findByIdAndDelete(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/auth/delete-account error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
