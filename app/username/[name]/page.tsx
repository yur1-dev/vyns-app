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
} from "lucide-react";

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

function Avatar({ seed, size = 64 }: { seed: string; size?: number }) {
  const colors = ["#14b8a6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899"];
  const color = colors[seed.charCodeAt(0) % colors.length];
  const letter = seed.replace(/^@/, "").charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color + "18",
        border: `1.5px solid ${color}35`,
        borderRadius: size * 0.28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color,
        flexShrink: 0,
        boxShadow: `0 0 ${size * 0.4}px ${color}20`,
      }}
    >
      {letter}
    </div>
  );
}

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
    if (result.success) {
      setDone(true);
    } else {
      setError(result.error ?? "Purchase failed");
    }
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
                <Avatar seed={username} size={44} />
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

export default function UsernamePage() {
  const params = useParams();
  const rawName = (params?.name as string) ?? "";
  const username = decodeURIComponent(rawName).replace(/^@/, "");

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // FIX: Track BOTH _id (email/Google users) and wallet (wallet users) separately
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
    ])
      .then(([listingData, userData]) => {
        if (listingData.listing) setListing(listingData.listing);
        else setNotFound(true);

        if (userData?.user) {
          // FIX: store both identifiers — don't rely on just one
          setCurrentUserId(userData.user._id ?? null);
          // wallet field on user — populated for wallet-authenticated users
          setCurrentWallet(userData.user.wallet ?? null);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  // FIX: Was:  listing.owner === currentUserId || listing.owner === listing.ownerWallet
  //           ↑ second condition compared listing's OWN fields to each other — always true
  //           for wallet users, making everyone appear as the owner.
  //
  // Now: exact equality only, checked against the current user's actual identifiers.
  // listing.ownerId  = MongoDB _id string (set by list route via stats.ownerId)
  // listing.ownerWallet = raw wallet address (set by list route via walletAddress)
  const isOwner = !!(
    listing &&
    // Email / Google users: identified by MongoDB _id
    ((currentUserId && listing.owner && currentUserId === listing.owner) ||
      // Wallet users: identified by wallet address
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
      const data = await res.json();
      return data;
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b14] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal-400/40" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
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
          <div className="space-y-3">
            <div
              className={`rounded-2xl border ${cfg.border} bg-white/[0.02] overflow-hidden`}
            >
              <div
                className="h-px w-full"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${cfg.glow}80 50%, transparent 100%)`,
                }}
              />
              <div className="p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <Avatar seed={username} size={56} />
                    <div>
                      <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
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
                      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        @{username}
                      </h1>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleCopy}
                      className="p-2 rounded-xl border border-white/[0.07] text-white/25 hover:text-white/60 hover:border-white/[0.12] transition-all cursor-pointer"
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
                      className="p-2 rounded-xl border border-white/[0.07] text-white/25 hover:text-white/60 hover:border-white/[0.12] transition-all"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-5">
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

                {/* Show wallet address of actual owner */}
                {listing?.ownerWallet && (
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] mb-5">
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
