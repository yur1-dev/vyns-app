// app/username/[name]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Zap,
  Shield,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Star,
  Users,
  Twitter,
  Globe,
  Calendar,
  TrendingUp,
  Tag,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface OwnerUsername {
  name: string;
  tier: string;
  isListed: boolean;
  listedPrice: number | null;
}

interface OwnerProfile {
  _id: string | null;
  name: string | null;
  displayName: string | null;
  bio: string;
  xp: number;
  level: number;
  wallet: string | null;
  email: string | null;
  activeUsername: string | null;
  avatar: string | null;
  coverPhoto: string | null;
  socials: {
    x: string | null;
    facebook: string | null;
    tiktok: string | null;
    telegram: string | null;
  };
  theme: string;
  usernames: OwnerUsername[];
  joinedAt: string | null;
  stakedAmount: number;
  earnings: number;
  referrals: number;
}

interface ListingInfo {
  isListed: boolean;
  price?: number | null;
  listedAt?: string | null;
  ownerWallet?: string | null;
}

interface UsernameData {
  success: boolean;
  username: string;
  tier: string;
  length: number;
  level: number;
  staked: boolean;
  claimedAt: string | null;
  listing: ListingInfo;
  owner: OwnerProfile | null;
}

// ── Tier config ──────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<
  string,
  { cls: string; bg: string; label: string; glow: string }
> = {
  Diamond: {
    cls: "text-cyan-400 border-cyan-500/40",
    bg: "from-cyan-500/20 to-cyan-900/10",
    label: "💎 Diamond",
    glow: "shadow-cyan-500/20",
  },
  Platinum: {
    cls: "text-purple-300 border-purple-500/40",
    bg: "from-purple-500/20 to-purple-900/10",
    label: "⬡ Platinum",
    glow: "shadow-purple-500/20",
  },
  Gold: {
    cls: "text-amber-400 border-amber-500/40",
    bg: "from-amber-500/20 to-amber-900/10",
    label: "✦ Gold",
    glow: "shadow-amber-500/20",
  },
  Silver: {
    cls: "text-slate-300 border-slate-500/40",
    bg: "from-slate-500/20 to-slate-900/10",
    label: "◈ Silver",
    glow: "shadow-slate-500/20",
  },
  Bronze: {
    cls: "text-orange-400 border-orange-500/40",
    bg: "from-orange-500/20 to-orange-900/10",
    label: "◉ Bronze",
    glow: "shadow-orange-500/20",
  },
};

// ── XP bar ───────────────────────────────────────────────────────────────────
function XpBar({ xp, level }: { xp: number; level: number }) {
  const xpForNext = level * 500;
  const pct = Math.min((xp / xpForNext) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-white/40 mb-1.5">
        <span>Level {level}</span>
        <span>
          {xp.toLocaleString()} / {xpForNext.toLocaleString()} XP
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Owner avatar ─────────────────────────────────────────────────────────────
function OwnerAvatar({
  owner,
  size = 72,
}: {
  owner: OwnerProfile;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const initial = (owner.activeUsername ??
    owner.displayName ??
    owner.name ??
    "?")[0]
    .toUpperCase()
    .replace("@", "");

  if (owner.avatar && !imgError) {
    return (
      <div
        className="rounded-full overflow-hidden ring-2 ring-white/10 flex-shrink-0"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={owner.avatar}
          alt={initial}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback: styled initial
  const colours = [
    "from-teal-500 to-cyan-600",
    "from-indigo-500 to-purple-600",
    "from-amber-500 to-orange-600",
    "from-pink-500 to-rose-600",
    "from-emerald-500 to-teal-600",
  ];
  const colour = colours[initial.charCodeAt(0) % colours.length];

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${colour} flex items-center justify-center ring-2 ring-white/10 flex-shrink-0`}
      style={{ width: size, height: size }}
    >
      <span className="font-bold text-white" style={{ fontSize: size * 0.38 }}>
        {initial}
      </span>
    </div>
  );
}

// ── Tier pill ────────────────────────────────────────────────────────────────
function TierPill({ tier }: { tier: string }) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.Bronze;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

// ── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-white/30 hover:text-teal-400 transition-colors"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-teal-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function UsernameDetailPage() {
  const { name } = useParams();
  const raw = decodeURIComponent(name as string)
    .toLowerCase()
    .replace(/^@/, "");

  const [data, setData] = useState<UsernameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!raw) return;
    setLoading(true);
    setNotFound(false);

    fetch(`/api/username/${raw}`)
      .then((r) => r.json())
      .then((json: UsernameData) => {
        if (!json.success) {
          setNotFound(true);
        } else {
          setData(json);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [raw]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          <p className="text-sm text-white/30">Loading @{raw}…</p>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-white/20 mx-auto" />
          <p className="text-xl font-bold text-white/60">@{raw} not found</p>
          <p className="text-sm text-white/30">
            This username hasn't been registered yet.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 mt-4 text-teal-400 hover:text-teal-300 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { owner, listing, tier, level, staked, claimedAt } = data;
  const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG.Bronze;

  const displayName =
    owner?.displayName ??
    owner?.name ??
    owner?.activeUsername?.replace(/^@/, "") ??
    null;

  const walletDisplay = (w: string) =>
    w.length > 12 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* ── Cover photo / hero ─────────────────────────────────────────────── */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        {owner?.coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={owner.coverPhoto}
            alt="cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${tierCfg.bg} opacity-60`}
          />
        )}
        {/* dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />

        {/* back button */}
        <Link
          href="/dashboard?tab=marketplace"
          className="absolute top-5 left-5 inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Marketplace
        </Link>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 -mt-16 relative z-10">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            {/* Owner card */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 space-y-5">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                {owner ? (
                  <OwnerAvatar owner={owner} size={64} />
                ) : (
                  // No owner resolved — show wallet stub
                  <div className="w-16 h-16 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                    <Shield className="w-7 h-7 text-white/20" />
                  </div>
                )}

                <div className="min-w-0">
                  {owner ? (
                    <>
                      <p className="font-bold text-white truncate text-lg leading-tight">
                        {displayName ?? `@${raw}`}
                      </p>
                      {owner.activeUsername && (
                        <p className="text-sm text-teal-400/80 truncate">
                          @{owner.activeUsername.replace(/^@/, "")}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-white/40 bg-white/[0.05] px-2 py-0.5 rounded-full">
                          Level {owner.level}
                        </span>
                        <span className="text-xs text-white/25">
                          {owner.xp.toLocaleString()} XP
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-white text-lg">Unknown</p>
                      <p className="text-xs text-white/30">
                        Owner info not available
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              {owner?.bio && (
                <p className="text-sm text-white/50 leading-relaxed border-t border-white/[0.05] pt-4">
                  {owner.bio}
                </p>
              )}

              {/* XP bar */}
              {owner && <XpBar xp={owner.xp} level={owner.level} />}

              {/* Wallet */}
              {(owner?.wallet || listing.ownerWallet) && (
                <div className="border-t border-white/[0.05] pt-4">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">
                    Wallet
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-white/50 truncate">
                      {walletDisplay(
                        owner?.wallet ?? listing.ownerWallet ?? "",
                      )}
                    </span>
                    <CopyButton
                      value={owner?.wallet ?? listing.ownerWallet ?? ""}
                    />
                    <a
                      href={`https://solscan.io/account/${owner?.wallet ?? listing.ownerWallet}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/30 hover:text-teal-400 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Stats row */}
              {owner && (
                <div className="grid grid-cols-3 gap-3 border-t border-white/[0.05] pt-4 text-center">
                  <div>
                    <p className="text-base font-bold text-white">
                      {owner.usernames.length}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">Names</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">
                      {owner.stakedAmount ?? 0}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">Staked</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">
                      {owner.referrals ?? 0}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">Refs</p>
                  </div>
                </div>
              )}

              {/* Socials */}
              {owner?.socials && Object.values(owner.socials).some(Boolean) && (
                <div className="flex items-center gap-3 border-t border-white/[0.05] pt-4">
                  {owner.socials.x && (
                    <a
                      href={`https://x.com/${owner.socials.x}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/30 hover:text-teal-400 transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {owner.socials.telegram && (
                    <a
                      href={`https://t.me/${owner.socials.telegram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/30 hover:text-teal-400 transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              {/* Joined date */}
              {owner?.joinedAt && (
                <div className="flex items-center gap-2 text-xs text-white/25 border-t border-white/[0.05] pt-3">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined{" "}
                  {new Date(owner.joinedAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>

            {/* Other names owned by same person */}
            {owner && owner.usernames.length > 1 && (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
                  Also owns
                </p>
                <div className="space-y-2">
                  {owner.usernames
                    .filter((u) => u.name !== raw)
                    .slice(0, 5)
                    .map((u) => (
                      <Link
                        key={u.name}
                        href={`/username/${u.name}`}
                        className="flex items-center justify-between group"
                      >
                        <span className="text-sm text-white/60 group-hover:text-teal-400 transition-colors font-mono">
                          @{u.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {u.isListed && u.listedPrice != null && (
                            <span className="text-xs text-white/30">
                              {u.listedPrice} SOL
                            </span>
                          )}
                          <TierPill tier={u.tier} />
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Username hero card */}
            <div
              className={`rounded-2xl border border-white/[0.08] bg-gradient-to-br ${tierCfg.bg} p-8 shadow-xl ${tierCfg.glow}`}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <TierPill tier={tier} />
                  <h1 className="text-5xl font-extrabold text-white mt-3 tracking-tight">
                    @{raw}
                  </h1>
                  <p className="text-sm text-white/40 mt-2">
                    {raw.length} chars · Level {level}
                    {staked && (
                      <span className="ml-3 inline-flex items-center gap-1 text-teal-400">
                        <Zap className="w-3.5 h-3.5" />
                        Staked
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `https://vyns-app.vercel.app/username/${raw}`,
                      );
                    }}
                    className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all"
                    title="Copy link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <a
                    href={`https://vyns-app.vercel.app/username/${raw}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Claimed date */}
              {claimedAt && (
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <Calendar className="w-3.5 h-3.5" />
                  Registered{" "}
                  {new Date(claimedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>

            {/* ── BUY / LISTING SECTION ───────────────────────────────────── */}
            {listing.isListed ? (
              <div className="rounded-2xl border border-teal-500/25 bg-teal-500/[0.04] p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white/60 uppercase tracking-widest">
                    For Sale
                  </p>
                  {listing.listedAt && (
                    <span className="text-xs text-white/25">
                      Listed{" "}
                      {new Date(listing.listedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>

                <div className="flex items-end gap-2">
                  <span className="text-5xl font-extrabold text-white tabular-nums">
                    {listing.price ?? "—"}
                  </span>
                  <span className="text-xl text-white/40 pb-1">SOL</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-black font-bold py-3.5 rounded-xl transition-all text-sm">
                    <ShoppingCart className="w-4 h-4" />
                    Buy Now
                  </button>
                  <button className="flex items-center justify-center gap-2 border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white py-3.5 px-5 rounded-xl transition-all text-sm">
                    Make Offer
                  </button>
                </div>

                <p className="text-xs text-white/25 text-center">
                  Transaction processed on Solana · non-custodial
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center space-y-2">
                <Shield className="w-8 h-8 text-white/15 mx-auto" />
                <p className="text-sm font-medium text-white/40">
                  Not listed for sale
                </p>
                <p className="text-xs text-white/25">
                  This username is owned but not currently available to
                  purchase.
                </p>
              </div>
            )}

            {/* ── USERNAME DETAILS GRID ──────────────────────────────────── */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-1">
                <p className="text-[10px] text-white/30 uppercase tracking-widest">
                  Tier
                </p>
                <TierPill tier={tier} />
                <p className="text-xs text-white/25 pt-1">
                  {raw.length}-character username
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-1">
                <p className="text-[10px] text-white/30 uppercase tracking-widest">
                  Level
                </p>
                <p className="text-2xl font-bold text-white">{level}</p>
                <p className="text-xs text-white/25">
                  {staked ? "Currently staked" : "Not staked"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
