// app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models";

const VALID_KEYS = ["staking", "referrals", "rewards", "system"] as const;
type PrefKey = (typeof VALID_KEYS)[number];

const DEFAULTS: Record<PrefKey, boolean> = {
  staking: true,
  referrals: false,
  rewards: true,
  system: true,
};

// GET /api/user/preferences
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const user = await User.findById(auth.userId).select("preferences");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const preferences: Record<PrefKey, boolean> = {
      ...DEFAULTS,
      ...(user.preferences ?? {}),
    };

    return NextResponse.json({ success: true, preferences });
  } catch (err) {
    console.error("[preferences:GET]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/user/preferences
// Body: { staking: true } — partial updates supported
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  let body: Partial<Record<PrefKey, boolean>>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // Only allow known keys with boolean values
  const update: Partial<Record<string, boolean>> = {};
  for (const key of VALID_KEYS) {
    if (key in body) {
      if (typeof body[key] !== "boolean") {
        return NextResponse.json(
          { success: false, error: `"${key}" must be a boolean` },
          { status: 400 },
        );
      }
      update[`preferences.${key}`] = body[key];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { success: false, error: `Valid keys: ${VALID_KEYS.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    const user = await User.findByIdAndUpdate(
      auth.userId,
      { $set: { ...update, updatedAt: new Date() } },
      { new: true },
    ).select("preferences");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const preferences: Record<PrefKey, boolean> = {
      ...DEFAULTS,
      ...(user.preferences ?? {}),
    };

    return NextResponse.json({ success: true, preferences });
  } catch (err) {
    console.error("[preferences:PATCH]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
