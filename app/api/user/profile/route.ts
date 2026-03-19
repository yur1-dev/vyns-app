// app/api/user/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import dbConnect from "@/lib/db/mongodb";
import { User } from "@/models/index";

// ── Shared query builder ───────────────────────────────────────────────────────
function buildQuery(session: any) {
  const wallet = (session as any)?.wallet;
  if (wallet) return { wallet };
  if (session?.user?.email) return { email: session.user.email };
  return null;
}

// ── GET /api/user/profile ──────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  const query = buildQuery(session);
  if (!query)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const user = await User.findOne(query).select(
    "displayName bio coverPhoto preferences customization",
  );

  return NextResponse.json({ user: user ?? null });
}

// ── PATCH /api/user/profile ────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const query = buildQuery(session);
  if (!query)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { displayName, bio, coverPhoto, preferences, customization } = body;

  const update: Record<string, any> = {};

  if (displayName !== undefined) {
    update.displayName = String(displayName).trim().slice(0, 32);
  }
  if (bio !== undefined) {
    update.bio = String(bio).trim().slice(0, 160);
  }
  if (coverPhoto !== undefined) {
    // Accept base64 data URLs or https URLs; null clears the field
    if (coverPhoto === null) {
      update.coverPhoto = null;
    } else if (
      typeof coverPhoto === "string" &&
      (coverPhoto.startsWith("data:image/") ||
        coverPhoto.startsWith("https://"))
    ) {
      // Basic size guard — base64 of a 1200×400 JPEG is roughly ~200KB
      if (coverPhoto.length > 500_000) {
        return NextResponse.json(
          { error: "Cover photo too large. Max ~375KB." },
          { status: 413 },
        );
      }
      update.coverPhoto = coverPhoto;
    }
  }
  if (preferences !== undefined && typeof preferences === "object") {
    update.preferences = preferences;
  }
  if (customization !== undefined && typeof customization === "object") {
    update.customization = customization;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await dbConnect();
  await User.updateOne(query, { $set: update });

  return NextResponse.json({ success: true });
}
