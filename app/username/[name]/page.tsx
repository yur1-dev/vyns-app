// app/username/[name]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Tag,
  AlertCircle,
  BarChart3,
  Users,
  Activity,
  Star,
  Layers,
  Gift,
} from "lucide-react";

// ── Tier config ────────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  Diamond: {
    cls: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    pill: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    glow: "#06b6d4",
    label: "💎 Diamond",
  },
  Platinum: {
    cls: "text-purple-300",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    pill: "text-purple-300 bg-purple-500/10 border-purple-500/20",
    glow: "#a855f7",
    label: "⬡ Platinum",
  },
  Gold: {
    cls: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    pill: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    glow: "#f59e0b",
    label: "✦ Gold",
  },
  Silver: {
    cls: "text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    pill: "text-slate-300 bg-slate-500/10 border-slate-500/20",
    glow: "#94a3b8",
    label: "◈ Silver",
  },
  Bronze: {
    cls: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    pill: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    glow: "#f97316",
    label: "◉ Bronze",
  },
} as const;

const THEME_COLORS: Record<string, string> = {
  teal: "#2dd4bf",
  violet: "#a78bfa",
  rose: "#fb7185",
  amber: "#fbbf24",
  cyan: "#22d3ee",
  lime: "#a3e635",
  pink: "#f472b6",
  white: "#e2e8f0",
};

const XP_TIERS = [
  { min: 0, label: "Observer", hex: "#64748b" },
  { min: 100, label: "Recruiter", hex: "#22d3ee" },
  { min: 500, label: "Resolver", hex: "#a78bfa" },
  { min: 1000, label: "Architect", hex: "#2dd4bf" },
  { min: 5000, label: "Sovereign", hex: "#fbbf24" },
];

const TIER_HEX: Record<string, string> = {
  Diamond: "#22d3ee",
  Platinum: "#a78bfa",
  Gold: "#fbbf24",
  Silver: "#94a3b8",
  Bronze: "#b45309",
};

const ACT_CFG: Record<string, { icon: any; color: string }> = {
  claim: { icon: Crown, color: "#2dd4bf" },
  staking: { icon: Zap, color: "#a78bfa" },
  referral: { icon: Gift, color: "#22d3ee" },
  received: { icon: TrendingUp, color: "#34d399" },
  sent: { icon: TrendingUp, color: "#fb7185" },
  unstake: { icon: Activity, color: "#fbbf24" },
  reward: { icon: Star, color: "#f472b6" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getTier(name: string): keyof typeof TIER_CONFIG {
  const n = name.replace(/^@/, "").length;
  if (n <= 3) return "Diamond";
  if (n <= 5) return "Platinum";
  if (n <= 8) return "Gold";
  if (n <= 15) return "Silver";
  return "Bronze";
}

function getYield(tier: keyof typeof TIER_CONFIG) {
  return tier === "Diamond"
    ? 5
    : tier === "Platinum"
      ? 3
      : tier === "Gold"
        ? 1.5
        : 0;
}

// ── PixelAvatar ────────────────────────────────────────────────────────────────

import { useRef } from "react";

function PixelAvatar({
  seed,
  size = 72,
  themeColor = "#2dd4bf",
}: {
  seed: string;
  size?: number;
  themeColor?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !seed) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const G = 8;
    c.width = G;
    c.height = G;
    let h = 0;
    for (let i = 0; i < seed.length; i++)
      h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
    const rand = (n: number) => {
      h = (Math.imul(1664525, h) + 1013904223) | 0;
      return Math.abs(h) % n;
    };
    const hue = rand(360),
      hue2 = (hue + 40 + rand(80)) % 360;
    ctx.fillStyle = `hsl(${hue},60%,8%)`;
    ctx.fillRect(0, 0, G, G);
    for (let y = 0; y < G; y++)
      for (let x = 0; x < Math.ceil(G / 2); x++) {
        if (rand(3) !== 0) {
          ctx.fillStyle =
            rand(4) === 0
              ? themeColor
              : `hsl(${x % 2 === 0 ? hue : hue2},65%,${40 + rand(35)}%)`;
          ctx.fillRect(x, y, 1, 1);
          ctx.fillRect(G - 1 - x, y, 1, 1);
        }
      }
    ctx.fillStyle = "#fff";
    ctx.fillRect(2, 2, 1, 1);
    ctx.fillRect(5, 2, 1, 1);
  }, [seed, themeColor]);
  return (
    <canvas
      ref={ref}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        borderRadius: "50%",
      }}
    />
  );
}

// ── BuyModal ───────────────────────────────────────────────────────────────────

function BuyModal({
  username,
  price,
  tier,
  onClose,
  onConfirm,
}: {
  username: string;
  price: number;
  tier: keyof typeof TIER_CONFIG;
  onClose: () => void;
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const cfg = TIER_CONFIG[tier];

  const handleBuy = async () => {
    setLoading(true);
    setError("");
    const result = await onConfirm();
    if (result.success) setDone(true);
    else setError(result.error ?? "Purchase failed");
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0a0f1a] shadow-2xl overflow-hidden">
        <div
          className="h-px w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${cfg.glow}70, transparent)`,
          }}
        />
        <div className="p-6 space-y-4">
          {done ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto">
                <Check className="h-7 w-7 text-teal-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-white mb-1">
                  Purchase complete
                </p>
                <p className="text-sm text-white/35">
                  @{username} has been transferred to your account.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-semibold cursor-pointer hover:bg-teal-500/20 transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 pb-1">
                <div
                  className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}
                >
                  <Tag className={`h-4 w-4 ${cfg.cls}`} />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">
                    Confirm Purchase
                  </p>
                  <p className="text-xs text-white/35">
                    Review before completing
                  </p>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 p-4 rounded-2xl ${cfg.bg} border ${cfg.border}`}
              >
                <PixelAvatar seed={username} size={44} themeColor={cfg.glow} />
                <div>
                  <p className="text-lg font-bold text-white">@{username}</p>
                  <span className={`text-xs font-medium ${cfg.cls}`}>
                    {cfg.label} tier
                  </span>
                </div>
              </div>
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] divide-y divide-white/[0.04]">
                {[
                  ["Price", `${price} SOL`],
                  ["Platform fee (2.5%)", `${(price * 0.025).toFixed(4)} SOL`],
                  ["Total", `${(price * 1.025).toFixed(4)} SOL`],
                ].map(([k, v], i) => (
                  <div
                    key={k}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <span
                      className={`text-xs ${i === 2 ? "text-white/60 font-medium" : "text-white/30"}`}
                    >
                      {k}
                    </span>
                    <span
                      className={`text-sm ${i === 2 ? "text-white font-semibold" : "text-white/60"}`}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400/80 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-400/70 leading-relaxed">
                  Custodial purchase — records ownership in the Vyns registry.
                  Real SOL transfers coming soon.
                </p>
              </div>
              {error && (
                <div className="px-3 py-2.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-xs">
                  {error}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.07] text-white/35 text-sm hover:text-white/60 transition-all cursor-pointer disabled:opacity-30"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBuy}
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-xl ${cfg.bg} border ${cfg.border} ${cfg.cls} text-sm font-semibold hover:opacity-80 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Tag className="h-4 w-4" />
                  )}
                  Buy Now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function UsernamePage() {
  const params = useParams();
  const rawName = (params?.name as string) ?? "";
  const username = decodeURIComponent(rawName).replace(/^@/, "");

  const [listing, setListing] = useState<any>(null);
  const [publicProfile, setPublicProfile] = useState<any>(null); // owner's public profile data
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const tier = getTier(username) as keyof typeof TIER_CONFIG;
  const cfg = TIER_CONFIG[tier];
  const yieldPct = getYield(tier);

  useEffect(() => {
    if (!username) return;
    Promise.all([
      fetch(
        `/api/marketplace/listing?username=${encodeURIComponent(username)}`,
      ).then((r) => r.json()),
      fetch("/api/user/me", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => null),
      // Fetch the owner's public profile — create this API route if it doesn't exist yet
      fetch(`/api/user/public?username=${encodeURIComponent(username)}`)
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([listingData, userData, profileData]) => {
        if (listingData.listing) setListing(listingData.listing);
        else setNotFound(true);

        if (userData?.user) {
          setCurrentUserId(userData.user._id ?? null);
          setCurrentWallet(userData.user.wallet ?? null);
        }

        if (profileData?.user) setPublicProfile(profileData.user);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  const isOwner = !!(
    listing &&
    ((currentUserId && listing.owner && currentUserId === listing.owner) ||
      (currentWallet &&
        listing.ownerWallet &&
        currentWallet === listing.ownerWallet))
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://vyns.io/${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBuy = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/marketplace/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username }),
      });
      return await res.json();
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  // Derive public profile display values
  const themeColor =
    THEME_COLORS[publicProfile?.customization?.theme ?? "teal"] ?? "#2dd4bf";
  const avatarSeed =
    publicProfile?.customization?.avatarSeed ||
    publicProfile?.displayName ||
    username;
  const displayName = publicProfile?.displayName || `@${username}`;
  const bio = publicProfile?.bio ?? "";
  const xp = publicProfile?.xp ?? 0;
  const xpTier =
    [...XP_TIERS].reverse().find((t) => xp >= t.min) ?? XP_TIERS[0];
  const nextTier = XP_TIERS.find((t) => t.min > xp) ?? null;
  const xpProgress = nextTier
    ? ((xp - xpTier.min) / (nextTier.min - xpTier.min)) * 100
    : 100;
  const usernames = publicProfile?.usernames ?? [];
  const activity = publicProfile?.activity ?? [];
  const referralCount = publicProfile?.referrals ?? 0;
  const totalEarnings = publicProfile?.earnings?.allTime ?? 0;
  const stakedAmount = publicProfile?.stakedAmount ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b14] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal-400/40" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-[0.07]"
          style={{ backgroundColor: cfg.glow }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-white/25 hover:text-white/60 text-xs mb-8 transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to dashboard
        </Link>

        {notFound ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
              <Tag className="h-5 w-5 text-white/15" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white mb-1">
                @{username}
              </p>
              <p className="text-sm text-white/30">
                This username isn't listed for sale.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold hover:bg-teal-500/20 transition-all"
            >
              Browse marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ── PUBLIC PROFILE HERO ───────────────────────────────────────── */}
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
              {/* Banner */}
              <div
                className="relative h-28 overflow-hidden"
                style={{
                  background: `linear-gradient(130deg, #07101f 0%, ${themeColor}1a 55%, #0b1628 100%)`,
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)",
                    backgroundSize: "24px 24px",
                  }}
                />
                <div
                  className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"
                  style={{ background: `${themeColor}0e` }}
                />

                {/* XP rank badge */}
                <div
                  className="absolute top-3 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold"
                  style={{
                    borderColor: `${xpTier.hex}35`,
                    background: `${xpTier.hex}12`,
                    color: xpTier.hex,
                  }}
                >
                  <Shield className="h-3 w-3" />
                  {xpTier.label}
                </div>

                {/* Top-right actions */}
                <div className="absolute top-3 left-4 flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl border border-white/[0.07] bg-black/20 text-white/25 hover:text-white/60 hover:border-white/[0.12] transition-all cursor-pointer backdrop-blur-sm"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-teal-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <a
                    href={`https://vyns.io/${username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl border border-white/[0.07] bg-black/20 text-white/25 hover:text-white/60 hover:border-white/[0.12] transition-all backdrop-blur-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Profile info */}
              <div className="bg-[#060b14] px-5 pb-5">
                <div className="flex items-end gap-4 -mt-9">
                  {/* Avatar */}
                  <div
                    className="rounded-2xl border-[3px] border-[#060b14] overflow-hidden shrink-0 z-10"
                    style={{
                      width: 72,
                      height: 72,
                      boxShadow: `0 0 0 1px ${themeColor}25, 0 0 20px ${themeColor}15`,
                    }}
                  >
                    <PixelAvatar
                      seed={avatarSeed}
                      size={72}
                      themeColor={themeColor}
                    />
                  </div>

                  <div className="pb-1 pt-10 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.pill}`}
                      >
                        {cfg.label}
                      </span>
                      {yieldPct > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border text-teal-400 bg-teal-500/10 border-teal-500/20">
                          <TrendingUp className="h-2.5 w-2.5" /> {yieldPct}%
                          yield
                        </span>
                      )}
                      {isOwner && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border text-teal-400 bg-teal-500/10 border-teal-500/20">
                          <Check className="h-2.5 w-2.5" /> Yours
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight truncate">
                      @{username}
                    </h1>
                    {displayName !== `@${username}` && (
                      <p className="text-sm text-white/40 mt-0.5">
                        {displayName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {bio && (
                  <p className="mt-3 text-sm text-white/45 leading-relaxed">
                    {bio}
                  </p>
                )}

                {/* XP bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: xpTier.hex }}
                    >
                      {xp.toLocaleString()} XP · {xpTier.label}
                    </span>
                    {nextTier && (
                      <span className="text-[11px] text-white/20">
                        {(nextTier.min - xp).toLocaleString()} to{" "}
                        {nextTier.label}
                      </span>
                    )}
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(xpProgress, 100)}%`,
                        background: `linear-gradient(90deg, ${xpTier.hex}, ${themeColor})`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── PUBLIC STATS ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon: Crown,
                  label: "Usernames",
                  value: usernames.length,
                  accent: themeColor,
                },
                {
                  icon: TrendingUp,
                  label: "All-time",
                  value: `${totalEarnings.toFixed(3)} SOL`,
                  accent: "#34d399",
                },
                {
                  icon: Zap,
                  label: "Staked",
                  value: `${stakedAmount.toFixed(2)} SOL`,
                  accent: "#a78bfa",
                },
                {
                  icon: Users,
                  label: "Referrals",
                  value: referralCount,
                  accent: "#22d3ee",
                },
              ].map(({ icon: Icon, label, value, accent }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 text-center"
                >
                  <Icon
                    className="h-3.5 w-3.5 mx-auto mb-1.5"
                    style={{ color: accent }}
                  />
                  <p className="text-lg font-bold text-white tabular-nums leading-none">
                    {value}
                  </p>
                  <p className="text-[10px] text-white/25 mt-1 uppercase tracking-widest">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* ── REGISTERED USERNAMES ─────────────────────────────────────── */}
            {usernames.length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Layers
                    className="h-3.5 w-3.5"
                    style={{ color: themeColor }}
                  />
                  <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                    Registered Names
                  </span>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${themeColor}15`, color: themeColor }}
                  >
                    {usernames.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {usernames.map((u: any) => {
                    const hex = TIER_HEX[u.tier] ?? "#64748b";
                    return (
                      <div
                        key={u.id ?? u.name}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white/[0.02]"
                        style={{ borderColor: `${hex}25` }}
                      >
                        <span className="text-xs font-mono text-white/60">
                          @{u.name}
                        </span>
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: `${hex}18`, color: hex }}
                        >
                          {u.tier}
                        </span>
                        {u.staked && (
                          <Zap
                            className="h-3 w-3 shrink-0"
                            style={{ color: hex }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── RECENT ACTIVITY (public, limited) ────────────────────────── */}
            {activity.length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-3.5 w-3.5 text-white/25" />
                  <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                    Recent Activity
                  </span>
                </div>
                <div>
                  {activity.slice(0, 5).map((a: any, i: number) => {
                    const ac = ACT_CFG[a.type] ?? {
                      icon: Star,
                      color: "#64748b",
                    };
                    const Icon = ac.icon;
                    return (
                      <div
                        key={a.id ?? i}
                        className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${ac.color}12` }}
                        >
                          <Icon
                            className="h-3.5 w-3.5"
                            style={{ color: ac.color }}
                          />
                        </div>
                        <p className="flex-1 text-xs text-white/55 truncate">
                          {a.description}
                        </p>
                        {a.amount !== 0 && (
                          <span
                            className="text-xs font-mono shrink-0"
                            style={{
                              color: a.type === "sent" ? "#fb7185" : "#34d399",
                            }}
                          >
                            {a.type === "sent" ? "-" : "+"}
                            {Math.abs(a.amount).toFixed(4)} {a.token}
                          </span>
                        )}
                        <span className="text-[10px] text-white/20 shrink-0 flex items-center gap-0.5 ml-1">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(a.date).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── LISTING / BUY SECTION ────────────────────────────────────── */}
            <div
              className={`rounded-2xl border ${cfg.border} bg-white/[0.02] overflow-hidden`}
            >
              <div
                className="h-px w-full"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${cfg.glow}80 50%, transparent 100%)`,
                }}
              />
              <div className="p-5">
                <p className="text-[10px] uppercase tracking-widest text-white/25 font-medium mb-4">
                  Listing Details
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    {
                      label: "Price",
                      value: `${listing?.price ?? "—"}`,
                      sub: "SOL",
                      accent: "text-white",
                    },
                    {
                      label: "Length",
                      value: `${username.length}`,
                      sub: "chars",
                      accent: "text-white/60",
                    },
                    {
                      label: "Yield",
                      value: yieldPct > 0 ? `${yieldPct}%` : "—",
                      sub: "APY",
                      accent: "text-teal-400",
                    },
                    {
                      label: "Level",
                      value: `${listing?.level ?? 1}`,
                      sub: "lvl",
                      accent: "text-white/60",
                    },
                  ].map(({ label, value, sub, accent }) => (
                    <div
                      key={label}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center"
                    >
                      <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">
                        {label}
                      </p>
                      <p
                        className={`text-lg font-bold tabular-nums leading-none ${accent}`}
                      >
                        {value}
                      </p>
                      <p className="text-[10px] text-white/20 mt-0.5">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Owner row */}
                {listing?.ownerWallet && (
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] mb-4">
                    <div className="flex items-center gap-2 text-white/30 text-xs">
                      <Shield className="h-3.5 w-3.5" />
                      {isOwner ? "Listed by you" : "Current owner"}
                    </div>
                    <span className="font-mono text-xs text-white/50">
                      {listing.ownerWallet.length > 16
                        ? `${listing.ownerWallet.slice(0, 6)}…${listing.ownerWallet.slice(-6)}`
                        : listing.ownerWallet}
                    </span>
                  </div>
                )}

                {/* Buy / owner button */}
                {isOwner ? (
                  <div className="w-full py-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-white/30 text-sm font-medium flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-teal-400" />
                    This is your listing — go to Usernames tab to delist
                  </div>
                ) : (
                  <button
                    onClick={() => setShowBuy(true)}
                    className={`w-full py-3.5 rounded-2xl ${cfg.bg} border ${cfg.border} ${cfg.cls} text-sm font-bold hover:opacity-80 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2`}
                  >
                    <Tag className="h-4 w-4" />
                    Buy @{username} — {listing?.price} SOL
                  </button>
                )}
              </div>
            </div>

            {/* ── BENEFIT CARDS ────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: <Crown className="h-4 w-4 text-amber-400" />,
                  title: "Tier Benefits",
                  desc:
                    yieldPct > 0
                      ? `${yieldPct}% annual yield`
                      : "Base membership",
                },
                {
                  icon: <Zap className="h-4 w-4 text-teal-400" />,
                  title: "Instant Transfer",
                  desc: "Ownership moves to you immediately",
                },
                {
                  icon: <BarChart3 className="h-4 w-4 text-purple-400" />,
                  title: "Resellable",
                  desc: "Re-list on marketplace anytime",
                },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
                    {icon}
                  </div>
                  <p className="text-xs font-semibold text-white mb-1">
                    {title}
                  </p>
                  <p className="text-[11px] text-white/30 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            {listing?.listedAt && (
              <div className="flex items-center gap-1.5 text-[11px] text-white/15 px-1">
                <Clock className="h-3 w-3" />
                Listed{" "}
                {new Date(listing.listedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showBuy && listing && !isOwner && (
        <BuyModal
          username={username}
          price={listing.price}
          tier={tier}
          onClose={() => setShowBuy(false)}
          onConfirm={handleBuy}
        />
      )}
    </div>
  );
}
