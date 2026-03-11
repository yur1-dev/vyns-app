// app/api/user/customization/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models/index";

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

    const body = await req.json();
    const { theme, petId, avatarSeed, bio } = body;

    const customization = { theme, petId, avatarSeed };

    const userId = (session?.user as any)?.id ?? auth?.userId;
    const walletAddr = (session?.user as any)?.wallet ?? auth?.wallet;

    const filter = userId ? { _id: userId } : { walletAddress: walletAddr };

    const updateFields: any = { customization };
    if (bio !== undefined) updateFields.bio = bio;

    const user = await User.findOneAndUpdate(
      filter,
      { $set: updateFields },
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

    const session = await getServerSession(authOptions);
    const auth = !session?.user ? await verifyAuth(req) : null;

    if (!session?.user && !auth) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const userId = (session?.user as any)?.id ?? auth?.userId;
    const walletAddr = (session?.user as any)?.wallet ?? auth?.wallet;
    const filter = userId ? { _id: userId } : { walletAddress: walletAddr };

    const user = await User.findOne(filter).select("customization bio");

    return NextResponse.json({
      success: true,
      customization: user?.customization ?? {
        theme: "teal",
        petId: "none",
        avatarSeed: "",
      },
      bio: user?.bio ?? "",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
