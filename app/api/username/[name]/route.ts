// app/api/username/[name]/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Returns full listing + owner public profile so the /username/[name] page
// can display who actually owns/is selling the username.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { User, Username } from "@/models/index";
import { getTierFromLength } from "@/types/dashboard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    await connectDB();

    const { name } = await params;
    const raw = decodeURIComponent(name).toLowerCase().replace(/^@/, "");

    // ── 1. Find the username record ──────────────────────────────────────────
    const usernameDoc = await Username.findOne({
      username: { $in: [`@${raw}`, raw] },
    });

    if (!usernameDoc) {
      return NextResponse.json(
        { success: false, error: "Username not found" },
        { status: 404 },
      );
    }

    const tier =
      (usernameDoc.stats as any)?.tier ?? getTierFromLength(raw.length);

    // ── 2. Resolve the owner User document ──────────────────────────────────
    //
    // Ownership can be stored in several ways depending on when it was
    // registered.  Try them all, most-specific first.
    const ownerId: string =
      (usernameDoc.stats as any)?.ownerId ?? (usernameDoc as any).userId ?? "";

    const ownerWallet: string = (usernameDoc as any).walletAddress ?? "";

    let ownerUser: any = null;

    if (ownerId) {
      // Try by MongoDB _id first
      ownerUser = await User.findById(ownerId).catch(() => null);
      // Fall back to wallet or email stored as ownerId
      if (!ownerUser) {
        ownerUser = await User.findOne({
          $or: [{ wallet: ownerId }, { email: ownerId }],
        }).catch(() => null);
      }
    }

    if (!ownerUser && ownerWallet) {
      ownerUser = await User.findOne({
        $or: [
          { wallet: ownerWallet },
          { email: ownerWallet },
          { _id: ownerWallet },
        ],
      }).catch(() => null);
    }

    // ── 3. Build owner public profile ────────────────────────────────────────
    let ownerProfile: Record<string, any> | null = null;

    if (ownerUser) {
      const u = ownerUser.toObject();

      // All usernames this owner holds (for the "Other usernames" section)
      const ownerUsernameDocs = await Username.find({
        $or: [
          { "stats.ownerId": u._id.toString() },
          { walletAddress: u._id.toString() },
          ...(u.wallet
            ? [{ walletAddress: u.wallet }, { "stats.ownerId": u.wallet }]
            : []),
          ...(u.email
            ? [{ walletAddress: u.email }, { "stats.ownerId": u.email }]
            : []),
        ],
      }).select("username stats isListed listedPrice");

      const ownerUsernames = ownerUsernameDocs.map((d) => ({
        name: d.username.replace(/^@/, ""),
        tier:
          (d.stats as any)?.tier ??
          getTierFromLength(d.username.replace(/^@/, "").length),
        isListed: d.isListed ?? false,
        listedPrice: d.listedPrice ?? null,
      }));

      ownerProfile = {
        _id: u._id?.toString() ?? null,
        name: u.name ?? u.displayName ?? null,
        displayName: u.displayName ?? u.name ?? null,
        bio: u.bio ?? "",
        xp: u.xp ?? 0,
        level: u.level ?? 1,
        wallet: u.wallet ?? ownerWallet ?? null,
        email: u.email ?? null,
        activeUsername: u.activeUsername ?? null,
        referralCode: u.referralCode ?? null,
        usernames: ownerUsernames,
        // Avatar — check every field the app might have used
        avatar:
          u.customization?.avatarImage ??
          u.avatar ??
          u.profilePicture ??
          u.avatarUrl ??
          null,
        coverPhoto: u.customization?.coverPhoto ?? u.coverPhoto ?? null,
        // Social links
        socials: u.customization?.socials ??
          u.socials ?? {
            x: null,
            facebook: null,
            tiktok: null,
            telegram: null,
          },
        theme: u.customization?.theme ?? "teal",
        avatarSeed: u.customization?.avatarSeed ?? "",
        joinedAt: u.createdAt?.toISOString() ?? null,
        stakedAmount: u.stakedAmount ?? 0,
        earnings: u.earnings ?? 0,
        referrals: u.referrals ?? 0,
      };
    }

    // ── 4. Assemble listing info ─────────────────────────────────────────────
    const listing = usernameDoc.isListed
      ? {
          isListed: true,
          price:
            usernameDoc.listedPrice ??
            (usernameDoc.stats as any)?.price ??
            null,
          listedAt: (usernameDoc.stats as any)?.listedAt ?? null,
          ownerWallet: ownerWallet || ownerUser?.wallet || null,
        }
      : { isListed: false };

    return NextResponse.json({
      success: true,
      username: raw,
      tier,
      length: raw.length,
      level: (usernameDoc.stats as any)?.level ?? 1,
      staked: (usernameDoc.stats as any)?.staked ?? usernameDoc.staked ?? false,
      claimedAt:
        (usernameDoc.stats as any)?.claimedAt ??
        (usernameDoc as any).createdAt?.toISOString() ??
        null,
      listing,
      owner: ownerProfile, // ← full public profile of the owner
    });
  } catch (err) {
    console.error("GET /api/username/[name] error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
