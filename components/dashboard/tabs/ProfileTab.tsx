"use client";
// components/dashboard/tabs/ProfileTab.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  Clock,
  Gift,
  Layers,
  BarChart2,
  Star,
  Activity,
  Palette,
  ImageIcon,
} from "lucide-react";
import type { UserData, UsernameItem, ActivityItem } from "@/types/dashboard";
import type { ProfileCustomization } from "@/components/dashboard/modals/ProfileCustomizeModal";

function PixelAvatar({
  seed,
  size = 96,
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

interface Props {
  session: any;
  userData: UserData;
  wallet: string | null;
  provider: string;
  displayName: string;
  activeUsername: string | null;
  customization: ProfileCustomization;
  onSaveCustomization: (c: ProfileCustomization) => Promise<void>;
  onTabChange: (tab: any) => void;
  onOpenCustomize: () => void;
}

export default function ProfileTab({
  session,
  userData,
  wallet,
  provider,
  displayName,
  activeUsername,
  customization,
  onSaveCustomization,
  onTabChange,
  onOpenCustomize,
}: Props) {
  const router = useRouter();
  const themeColor = THEME_COLORS[customization?.theme ?? "teal"] ?? "#2dd4bf";
  const avatarSeed = customization?.avatarSeed || displayName || "vyns";

  const [bio, setBio] = useState((userData as any).bio ?? "");
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [balLoading, setBalLoading] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const xp = userData.xp ?? 0;
  const xpTier =
    [...XP_TIERS].reverse().find((t) => xp >= t.min) ?? XP_TIERS[0];
  const nextTier = XP_TIERS.find((t) => t.min > xp) ?? null;
  const xpProgress = nextTier
    ? ((xp - xpTier.min) / (nextTier.min - xpTier.min)) * 100
    : 100;

  const usernames: UsernameItem[] = userData.usernames ?? [];
  const activity: ActivityItem[] = userData.activity ?? [];
  const referralCode = userData.referralCode ?? "";
  const totalEarnings = userData.earnings?.allTime ?? 0;
  const stakedAmount = userData.stakedAmount ?? 0;
  const stakingRewards = userData.stakingRewards ?? 0;
  const referralCount = userData.referrals ?? 0;
  const activePositions = (userData.stakingPositions ?? []).filter(
    (p: any) => p.status === "active",
  ).length;

  useEffect(() => {
    if ((userData as any).bio) setBio((userData as any).bio);
  }, [userData]);

  const fetchBalance = useCallback(async () => {
    if (!wallet) return;
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
          params: [wallet],
        }),
      });
      const data = await res.json();
      setSolBalance(data.result?.value ? data.result.value / 1e9 : 0);
    } catch {
      setSolBalance(0);
    }
    setBalLoading(false);
  }, [wallet]);

  useEffect(() => {
    if (wallet) fetchBalance();
  }, [wallet, fetchBalance]);

  const saveBio = async () => {
    setSavingBio(true);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bio }),
      });
    } catch {}
    setSavingBio(false);
    setEditingBio(false);
  };

  const copyWallet = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const copyRef = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const effectiveDisplayName = customization?.displayName || displayName;

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* ── HERO ── */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        {/* Banner */}
        <div
          className="relative h-28 sm:h-36 overflow-hidden"
          style={
            customization?.coverPhoto
              ? {
                  backgroundImage: `url(${customization.coverPhoto})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {
                  background: `linear-gradient(130deg, #07101f 0%, ${themeColor}1a 55%, #0b1628 100%)`,
                }
          }
        >
          {!customization?.coverPhoto && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
          )}
          {customization?.coverPhoto && (
            <div className="absolute inset-0 bg-black/30" />
          )}
          <div
            className="absolute top-0 right-0 w-56 h-56 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"
            style={{ background: `${themeColor}0e` }}
          />

          {/* Cover photo button — sits on banner top-left */}
          <button
            onClick={() => router.push("/settings")}
            className="absolute top-3 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.12] bg-black/30 backdrop-blur-sm text-[11px] text-white/50 hover:text-white/80 hover:bg-black/50 transition-all cursor-pointer"
          >
            <ImageIcon className="h-3 w-3" />
            {customization?.coverPhoto ? "Change cover" : "Add cover"}
          </button>

          {/* XP tier badge — top right */}
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

        <div className="bg-[#060b14] px-5 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-9">
            {/* Avatar — clickable to open customize modal */}
            <div className="relative shrink-0 z-10">
              <button
                onClick={onOpenCustomize}
                className="group block cursor-pointer"
                title="Customize avatar"
              >
                <div
                  className="rounded-2xl border-[3px] border-[#060b14] overflow-hidden transition-all group-hover:ring-2 group-hover:ring-white/20"
                  style={{
                    width: 72,
                    height: 72,
                    boxShadow: `0 0 0 1px ${themeColor}25, 0 0 20px ${themeColor}15`,
                  }}
                >
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt="avatar"
                      width={72}
                      height={72}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PixelAvatar
                      seed={avatarSeed}
                      size={72}
                      themeColor={themeColor}
                    />
                  )}
                </div>
                {/* Edit overlay on hover */}
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Palette className="h-4 w-4 text-white" />
                </div>
              </button>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#060b14]" />
            </div>

            <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:pb-1 pt-10 sm:pt-0">
              <div className="space-y-0.5">
                <h2 className="text-xl font-bold text-white tracking-tight leading-none">
                  {effectiveDisplayName}
                </h2>
                {activeUsername && (
                  <p
                    className="text-sm font-mono"
                    style={{ color: themeColor }}
                  >
                    @{activeUsername}
                  </p>
                )}
                {session?.user?.email && (
                  <p className="text-xs text-white/25">{session.user.email}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 sm:pb-0.5">
                <button
                  onClick={onOpenCustomize}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] text-xs text-white/40 hover:text-white/70 transition-all cursor-pointer"
                >
                  <Palette className="h-3 w-3" /> Customize
                </button>
                <button
                  onClick={() => router.push("/settings")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] text-xs text-white/40 hover:text-white/70 transition-all cursor-pointer"
                >
                  <Edit3 className="h-3 w-3" /> Edit profile
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3">
            {editingBio ? (
              <div className="flex gap-2 max-w-md">
                <input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
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
                {bio ? (
                  <span className="text-white/40">{bio}</span>
                ) : (
                  <span className="italic text-white/20">Add a bio…</span>
                )}
                <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            )}
          </div>

          <div className="mt-4 max-w-sm">
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[11px] font-medium"
                style={{ color: xpTier.hex }}
              >
                {xp.toLocaleString()} XP · {xpTier.label}
              </span>
              {nextTier && (
                <span className="text-[11px] text-white/20">
                  {(nextTier.min - xp).toLocaleString()} to {nextTier.label}
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

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: Crown,
            label: "Usernames",
            value: usernames.length,
            accent: themeColor,
            tab: "usernames",
          },
          {
            icon: TrendingUp,
            label: "All-time",
            value: `${totalEarnings.toFixed(3)} SOL`,
            accent: "#34d399",
            tab: "earnings",
          },
          {
            icon: Zap,
            label: "Staked",
            value: `${stakedAmount.toFixed(2)} SOL`,
            accent: "#a78bfa",
            tab: "staking",
          },
          {
            icon: Users,
            label: "Referrals",
            value: referralCount,
            accent: "#22d3ee",
            tab: "referrals",
          },
        ].map(({ icon: Icon, label, value, accent, tab }) => (
          <button
            key={label}
            onClick={() => onTabChange(tab)}
            className="relative group rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 text-left overflow-hidden hover:border-white/[0.1] transition-all cursor-pointer"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 0%, ${accent}09, transparent 65%)`,
              }}
            />
            <div className="flex items-center gap-1.5 mb-1.5">
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
          </button>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left col */}
        <div className="space-y-4">
          {/* Wallet */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-3.5 w-3.5" style={{ color: themeColor }} />
                <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                  Wallet
                </span>
              </div>
              {wallet && (
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
            {wallet ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.025] border border-white/[0.05]">
                  <span className="flex-1 text-xs font-mono text-white/35 truncate">
                    {wallet.slice(0, 8)}…{wallet.slice(-6)}
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
                    href={`https://solscan.io/account/${wallet}`}
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
                    via {provider}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <Wallet className="h-8 w-8 mx-auto text-white/10" />
                <p className="text-xs text-white/25">No wallet connected</p>
                <p className="text-[11px] text-white/15">
                  Use the Connect Wallet button in the header
                </p>
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
                  {referralCount} user{referralCount !== 1 ? "s" : ""} referred
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
              <p className="text-sm font-medium text-white/70">{provider}</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          </div>
        </div>

        {/* Right col */}
        <div className="lg:col-span-2 space-y-4">
          {/* Usernames */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" style={{ color: themeColor }} />
                <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                  Registered Names
                </span>
                {usernames.length > 0 && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${themeColor}15`, color: themeColor }}
                  >
                    {usernames.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => onTabChange("usernames")}
                className="flex items-center gap-1 text-[11px] text-white/20 hover:text-white/45 transition-colors cursor-pointer"
              >
                Manage <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {usernames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {usernames.map((u) => {
                  const hex = TIER_HEX[u.tier] ?? "#64748b";
                  return (
                    <div
                      key={u.id}
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
            ) : (
              <div className="py-8 text-center space-y-2">
                <Crown className="h-8 w-8 mx-auto text-white/[0.07]" />
                <p className="text-sm text-white/20">No usernames yet</p>
                <button
                  onClick={() => onTabChange("usernames")}
                  className="text-xs px-3 py-1.5 rounded-lg border text-teal-400 border-teal-500/20 bg-teal-500/10 hover:bg-teal-500/20 transition-all cursor-pointer"
                >
                  Claim your first name
                </button>
              </div>
            )}
          </div>

          {/* Staking */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                  Staking
                </span>
              </div>
              <button
                onClick={() => onTabChange("staking")}
                className="flex items-center gap-1 text-[11px] text-white/20 hover:text-white/45 transition-colors cursor-pointer"
              >
                View <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Active", value: activePositions, accent: "#34d399" },
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
              ].map(({ label, value }) => (
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

          {/* Activity */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-3.5 w-3.5 text-white/25" />
              <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                Recent Activity
              </span>
            </div>
            {activity.length > 0 ? (
              <div>
                {activity.slice(0, 8).map((a, i) => {
                  const cfg = ACT_CFG[a.type] ?? {
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
  );
}
