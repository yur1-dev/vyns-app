// app/api/user/customization/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models/index";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { theme, petId, avatarSeed } = await req.json();
    const customization = { theme, petId, avatarSeed };

    const filter = auth.wallet
      ? { walletAddress: auth.wallet }
      : { _id: auth.userId };

    const user = await User.findOneAndUpdate(
      filter,
      { $set: { customization } },
      { new: true, upsert: true },
    );

    return NextResponse.json({
      success: true,
      customization: user.customization,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const filter = auth.wallet
      ? { walletAddress: auth.wallet }
      : { _id: auth.userId };

    const user = await User.findOne(filter).select("customization");

    return NextResponse.json({
      success: true,
      customization: user?.customization ?? {
        theme: "teal",
        petId: "none",
        avatarSeed: "",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
