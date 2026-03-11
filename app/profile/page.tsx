"use client";
// app/profile/page.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Copy,
  Check,
  ExternalLink,
  Wallet,
  Edit3,
  Save,
  X,
  Crown,
  Zap,
  TrendingUp,
  Users,
  Shield,
  ChevronRight,
  RefreshCw,
  Loader2,
  ArrowLeft,
  Clock,
  Gift,
  Layers,
  BarChart2,
  Star,
  Activity,
  User,
} from "lucide-react";
import { useDashboard } from "@/hook/useDashboard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import type { Notification } from "@/components/dashboard/DashboardHeader";
import type { UsernameItem, ActivityItem } from "@/types/dashboard";

// ─── Shared pixel avatar (same algo as header) ────────────────────────────────
function PixelAvatar({
  seed,
  size = 80,
  themeColor = "#2dd4bf",
}: {
  seed: string;
  size?: number;
  themeColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !seed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const G = 8;
    canvas.width = G;
    canvas.height = G;
    let h = 0;
    for (let i = 0; i < seed.length; i++)
      h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
    const rand = (n: number) => {
      h = (Math.imul(1664525, h) + 1013904223) | 0;
      return Math.abs(h) % n;
    };
    const hue = rand(360);
    const hue2 = (hue + 40 + rand(80)) % 360;
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
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        borderRadius: "50%",
      }}
    />
  );
}

// ─── Theme map ────────────────────────────────────────────────────────────────
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

// ─── Tier config based on XP ──────────────────────────────────────────────────
const XP_TIERS = [
  { min: 0, label: "Observer", hex: "#64748b" },
  { min: 100, label: "Recruiter", hex: "#22d3ee" },
  { min: 500, label: "Resolver", hex: "#a78bfa" },
  { min: 1000, label: "Architect", hex: "#2dd4bf" },
  { min: 5000, label: "Sovereign", hex: "#fbbf24" },
];

function getXpTier(xp: number) {
  return [...XP_TIERS].reverse().find((t) => xp >= t.min) ?? XP_TIERS[0];
}

function getNextXpTier(xp: number) {
  return XP_TIERS.find((t) => t.min > xp) ?? null;
}

// ─── Username tier colors ─────────────────────────────────────────────────────
const TIER_HEX: Record<string, string> = {
  Diamond: "#22d3ee",
  Platinum: "#a78bfa",
  Gold: "#fbbf24",
  Silver: "#94a3b8",
  Bronze: "#b45309",
};

// ─── Activity type config ─────────────────────────────────────────────────────
const ACT_CONFIG: Record<string, { icon: any; color: string }> = {
  claim: { icon: Crown, color: "#2dd4bf" },
  staking: { icon: Zap, color: "#a78bfa" },
  referral: { icon: Gift, color: "#22d3ee" },
  received: { icon: TrendingUp, color: "#34d399" },
  sent: { icon: ArrowLeft, color: "#fb7185" },
  unstake: { icon: Activity, color: "#fbbf24" },
  reward: { icon: Star, color: "#f472b6" },
};

export default function ProfilePage() {
  const router = useRouter();
  const dash = useDashboard();

  const [notifications] = useState<Notification[]>([]);
  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [balLoading, setBalLoading] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const themeColor =
    THEME_COLORS[dash.customization?.theme ?? "teal"] ?? "#2dd4bf";
  const avatarSeed =
    dash.customization?.avatarSeed || dash.displayName || "vyns";

  const xp = dash.userData.xp ?? 0;
  const xpTier = getXpTier(xp);
  const nextTier = getNextXpTier(xp);
  const prevTierMin = getXpTier(xp).min;
  const xpProgress = nextTier
    ? ((xp - prevTierMin) / (nextTier.min - prevTierMin)) * 100
    : 100;

  const usernames: UsernameItem[] = dash.userData.usernames ?? [];
  const activity: ActivityItem[] = dash.userData.activity ?? [];
  const referralCode = dash.userData.referralCode ?? "";
  const totalEarnings = dash.userData.earnings?.allTime ?? 0;
  const stakedAmount = dash.userData.stakedAmount ?? 0;
  const stakingRewards = dash.userData.stakingRewards ?? 0;
  const referralCount = dash.userData.referrals ?? 0;
  const positions = dash.userData.stakingPositions ?? [];
  const activePositions = positions.filter(
    (p: any) => p.status === "active",
  ).length;

  // Load bio from userData
  useEffect(() => {
    if ((dash.userData as any).bio) setBio((dash.userData as any).bio);
  }, [dash.userData]);

  // Fetch SOL balance
  const fetchBalance = useCallback(async () => {
    if (!dash.wallet) return;
    setBalLoading(true);
    try {
      const rpc =
        process.env.NEXT_PUBLIC_SOLANA_RPC ||
        "https://api.mainnet-beta.solana.com";
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [dash.wallet],
        }),
      });
      const data = await res.json();
      setSolBalance(data.result?.value ? data.result.value / 1e9 : 0);
    } catch {
      setSolBalance(0);
    }
    setBalLoading(false);
  }, [dash.wallet]);

  useEffect(() => {
    if (dash.wallet) fetchBalance();
  }, [dash.wallet, fetchBalance]);

  // Save bio
  const saveBio = async () => {
    setSavingBio(true);
    try {
      await fetch("/api/user/customization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...dash.customization,
          bio,
          wallet: dash.wallet,
        }),
      });
    } catch {}
    setSavingBio(false);
    setEditingBio(false);
  };

  const copyWallet = () => {
    if (!dash.wallet) return;
    navigator.clipboard.writeText(dash.wallet);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const copyRef = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  if (dash.loading) {
    return (
      <div className="min-h-screen bg-[#060b14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400/40" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14] text-white overflow-x-hidden">
      {/* Ambient blobs */}
      <div
        className="fixed top-0 left-0 w-[700px] h-[400px] pointer-events-none blur-[140px] -translate-x-1/2 -translate-y-1/2 z-0"
        style={{ background: `${themeColor}08` }}
      />
      <div
        className="fixed bottom-0 right-0 w-[500px] h-[400px] pointer-events-none blur-[120px] translate-x-1/3 translate-y-1/3 z-0"
        style={{ background: "rgba(99,102,241,0.06)" }}
      />
      {/* Scanlines */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.007) 3px,rgba(255,255,255,0.007) 4px)",
        }}
      />

      <div className="relative z-10">
        <DashboardHeader
          session={dash.session}
          wallet={dash.wallet}
          provider={dash.provider}
          displayName={dash.displayName}
          activeUsername={dash.activeUsername}
          customization={dash.customization}
          notifications={notifications}
          sidebarOpen={false}
          onToggleSidebar={() => {}}
          onMarkNotifsRead={() => {}}
          onOpenSettings={() => router.push("/settings")}
          onLogout={dash.logout}
          onWalletLinked={(pk) => dash.setWallet(pk || null)}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {/* Back */}
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
          </button>

          {/* ── HERO ──────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            {/* Banner */}
            <div
              className="relative h-28 sm:h-36 overflow-hidden"
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
                className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"
                style={{ background: `${themeColor}0f` }}
              />
              {/* Tier badge */}
              <div
                className="absolute top-3 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold tracking-wide"
                style={{
                  borderColor: `${xpTier.hex}35`,
                  background: `${xpTier.hex}12`,
                  color: xpTier.hex,
                }}
              >
                <Shield className="h-3 w-3" />
                {xpTier.label}
              </div>
            </div>

            {/* Avatar + info */}
            <div className="bg-[#060b14] px-5 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
                {/* Avatar */}
                <div className="relative shrink-0 z-10">
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-[3px] border-[#060b14] overflow-hidden"
                    style={{
                      boxShadow: `0 0 0 1px ${themeColor}25, 0 0 24px ${themeColor}18`,
                    }}
                  >
                    {dash.session?.user?.image ? (
                      <Image
                        src={dash.session.user.image}
                        alt="avatar"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PixelAvatar
                        seed={avatarSeed}
                        size={96}
                        themeColor={themeColor}
                      />
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#060b14]" />
                </div>

                {/* Name block */}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:pb-1">
                  <div className="space-y-0.5">
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none">
                      {dash.displayName}
                    </h1>
                    {dash.activeUsername && (
                      <p
                        className="text-sm font-mono"
                        style={{ color: themeColor }}
                      >
                        @{dash.activeUsername}
                      </p>
                    )}
                    {dash.session?.user?.email && (
                      <p className="text-xs text-white/25">
                        {dash.session.user.email}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => router.push("/settings")}
                    className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" /> Edit profile
                  </button>
                </div>
              </div>

              {/* Bio */}
              <div className="mt-3 ml-0 sm:ml-1">
                {editingBio ? (
                  <div className="flex gap-2 max-w-md">
                    <input
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={120}
                      placeholder="Short bio…"
                      className="flex-1 h-8 px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                    />
                    <button
                      onClick={saveBio}
                      disabled={savingBio}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500/15 border border-teal-500/25 text-teal-400 text-xs font-medium hover:bg-teal-500/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {savingBio ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingBio(false)}
                      className="p-1.5 rounded-lg border border-white/[0.07] text-white/25 hover:text-white/50 transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingBio(true)}
                    className="group flex items-center gap-1.5 text-sm text-white/30 hover:text-white/50 transition-colors cursor-pointer"
                  >
                    {bio || (
                      <span className="italic text-white/20">Add a bio…</span>
                    )}
                    <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                )}
              </div>

              {/* XP bar */}
              <div className="mt-4 max-w-sm">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: xpTier.hex }}
                  >
                    {xp.toLocaleString()} XP
                  </span>
                  {nextTier && (
                    <span className="text-[11px] text-white/20">
                      {nextTier.label} in {(nextTier.min - xp).toLocaleString()}{" "}
                      XP
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

          {/* ── STATS ROW ─────────────────────────────────────────────────────── */}
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
                className="relative group rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 overflow-hidden hover:border-white/[0.1] transition-all"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${accent}09, transparent 65%)`,
                  }}
                />
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: accent }}
                  />
                  <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                    {label}
                  </span>
                </div>
                <p className="text-xl font-bold text-white tabular-nums leading-none">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* ── MAIN GRID ─────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left column */}
            <div className="space-y-4">
              {/* Wallet */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet
                      className="h-3.5 w-3.5"
                      style={{ color: themeColor }}
                    />
                    <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                      Wallet
                    </span>
                  </div>
                  {dash.wallet && (
                    <button
                      onClick={fetchBalance}
                      className="text-white/20 hover:text-white/50 transition-colors cursor-pointer"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${balLoading ? "animate-spin" : ""}`}
                      />
                    </button>
                  )}
                </div>

                {dash.wallet ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.025] border border-white/[0.05]">
                      <span className="flex-1 text-xs font-mono text-white/35 truncate">
                        {dash.wallet.slice(0, 8)}…{dash.wallet.slice(-6)}
                      </span>
                      <button
                        onClick={copyWallet}
                        className="shrink-0 text-white/20 hover:text-white/55 transition-colors cursor-pointer"
                      >
                        {copiedWallet ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <a
                        href={`https://solscan.io/account/${dash.wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-white/20 hover:text-white/55 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <div className="text-center py-1">
                      {balLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white/20 mx-auto" />
                      ) : (
                        <>
                          <p className="text-3xl font-bold text-white tabular-nums">
                            {(solBalance ?? 0).toFixed(4)}
                          </p>
                          <p className="text-[11px] text-white/20 mt-0.5">
                            SOL · Mainnet
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-[11px] text-white/20">
                        via {dash.provider}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-2">
                    <Wallet className="h-8 w-8 mx-auto text-white/10" />
                    <p className="text-xs text-white/25">No wallet connected</p>
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.07] text-white/35 hover:text-white/60 hover:bg-white/[0.04] transition-all cursor-pointer"
                    >
                      Connect from dashboard
                    </button>
                  </div>
                )}
              </div>

              {/* Referral */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="h-3.5 w-3.5 text-sky-400" />
                  <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                    Referral Code
                  </span>
                </div>
                {referralCode ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-sky-500/[0.08] border border-sky-500/[0.15]">
                      <span className="flex-1 text-sm font-mono font-bold text-sky-300 tracking-widest">
                        {referralCode}
                      </span>
                      <button
                        onClick={copyRef}
                        className="shrink-0 text-sky-400/50 hover:text-sky-400 transition-colors cursor-pointer"
                      >
                        {copiedRef ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-white/20 text-center">
                      {referralCount} user{referralCount !== 1 ? "s" : ""}{" "}
                      referred
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-white/20 text-center py-2">
                    No referral code yet
                  </p>
                )}
              </div>

              {/* Auth badge */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] px-4 py-3 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `${themeColor}12`,
                    border: `1px solid ${themeColor}20`,
                  }}
                >
                  <Shield className="h-4 w-4" style={{ color: themeColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-white/25 uppercase tracking-wider">
                    Auth provider
                  </p>
                  <p className="text-sm font-medium text-white/70">
                    {dash.provider}
                  </p>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Usernames */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers
                      className="h-3.5 w-3.5"
                      style={{ color: themeColor }}
                    />
                    <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                      Registered Names
                    </span>
                    {usernames.length > 0 && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `${themeColor}15`,
                          color: themeColor,
                        }}
                      >
                        {usernames.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-1 text-[11px] text-white/20 hover:text-white/45 transition-colors cursor-pointer"
                  >
                    Manage <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {usernames.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {usernames.map((u) => {
                      const tierHex = TIER_HEX[u.tier] ?? "#64748b";
                      return (
                        <div
                          key={u.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                          style={{ borderColor: `${tierHex}25` }}
                        >
                          <span className="text-xs font-mono text-white/60">
                            @{u.name}
                          </span>
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{
                              background: `${tierHex}18`,
                              color: tierHex,
                            }}
                          >
                            {u.tier}
                          </span>
                          {u.staked && (
                            <Zap
                              className="h-3 w-3 shrink-0"
                              style={{ color: tierHex }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <Crown className="h-8 w-8 mx-auto text-white/[0.07]" />
                    <p className="text-sm text-white/20">
                      No usernames registered yet
                    </p>
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="text-xs px-3 py-1.5 rounded-lg border text-teal-400 border-teal-500/20 bg-teal-500/10 hover:bg-teal-500/20 transition-all cursor-pointer"
                    >
                      Claim your first name
                    </button>
                  </div>
                )}
              </div>

              {/* Staking summary */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                      Staking
                    </span>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-1 text-[11px] text-white/20 hover:text-white/45 transition-colors cursor-pointer"
                  >
                    View <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "Active",
                      value: activePositions,
                      accent: "#34d399",
                    },
                    {
                      label: "Staked",
                      value: `${stakedAmount.toFixed(2)} SOL`,
                      accent: "#a78bfa",
                    },
                    {
                      label: "Rewards",
                      value: `${stakingRewards.toFixed(4)}`,
                      accent: "#fbbf24",
                    },
                  ].map(({ label, value, accent }) => (
                    <div
                      key={label}
                      className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-center"
                    >
                      <p className="text-base font-bold text-white leading-none">
                        {value}
                      </p>
                      <p className="text-[10px] text-white/25 mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity feed */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-3.5 w-3.5 text-white/25" />
                  <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                    Recent Activity
                  </span>
                </div>

                {activity.length > 0 ? (
                  <div className="space-y-0">
                    {activity.slice(0, 8).map((a, i) => {
                      const cfg = ACT_CONFIG[a.type] ?? {
                        icon: Star,
                        color: "#64748b",
                      };
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={a.id ?? i}
                          className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${cfg.color}12` }}
                          >
                            <Icon
                              className="h-3.5 w-3.5"
                              style={{ color: cfg.color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/55 truncate">
                              {a.description}
                            </p>
                          </div>
                          {a.amount !== 0 && (
                            <span
                              className="text-xs font-mono shrink-0"
                              style={{
                                color:
                                  a.type === "sent" ? "#fb7185" : "#34d399",
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
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <Activity className="h-7 w-7 mx-auto text-white/[0.07]" />
                    <p className="text-sm text-white/20">No activity yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
