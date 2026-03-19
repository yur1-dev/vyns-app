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
    const { theme, petId, avatarSeed, avatarImage, coverPhoto, bio, socials } =
      body;

    const customization: Record<string, any> = { theme, petId, avatarSeed };

    if (avatarImage !== undefined) customization.avatarImage = avatarImage;
    if (coverPhoto !== undefined) customization.coverPhoto = coverPhoto;

    // Save socials — only update keys that are explicitly provided
    if (socials !== undefined) {
      if (socials.x !== undefined)
        customization["socials.x"] = socials.x || null;
      if (socials.facebook !== undefined)
        customization["socials.facebook"] = socials.facebook || null;
      if (socials.tiktok !== undefined)
        customization["socials.tiktok"] = socials.tiktok || null;
      if (socials.telegram !== undefined)
        customization["socials.telegram"] = socials.telegram || null;
    }

    const userId = (session?.user as any)?.id ?? auth?.userId;
    const walletAddr = (session?.user as any)?.wallet ?? auth?.wallet;
    const filter = userId ? { _id: userId } : { walletAddress: walletAddr };

    // Build $set — use dot-notation keys so we don't wipe sibling fields
    const setPayload: Record<string, any> = {};
    for (const [k, v] of Object.entries(customization)) {
      // Keys like "socials.x" go in directly; plain keys get prefixed
      if (k.startsWith("socials.")) {
        setPayload[`customization.${k}`] = v;
      } else {
        setPayload[`customization.${k}`] = v;
      }
    }
    if (bio !== undefined) setPayload.bio = bio;

    const user = await User.findOneAndUpdate(
      filter,
      { $set: setPayload },
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
        avatarImage: null,
        coverPhoto: null,
        socials: { x: null, facebook: null, tiktok: null, telegram: null },
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
