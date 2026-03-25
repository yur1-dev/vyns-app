"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Zap,
  Shield,
  Copy,
  Check,
  Loader2,
  Users,
  Calendar,
  TrendingUp,
  ShoppingCart,
  AlertCircle,
  Wallet,
  Activity,
  ChevronRight,
  Tag,
} from "lucide-react";
import DashboardHeader, {
  Notification,
} from "@/components/dashboard/DashboardHeader";

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
  {
    cls: string;
    label: string;
    glow: string;
    hex: string;
    pill: string;
    bar: string;
  }
> = {
  Diamond: {
    cls: "text-cyan-300",
    label: "Diamond",
    glow: "0 0 40px rgba(34,211,238,0.12)",
    hex: "#22d3ee",
    pill: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25",
    bar: "bg-cyan-400",
  },
  Platinum: {
    cls: "text-violet-300",
    label: "Platinum",
    glow: "0 0 40px rgba(167,139,250,0.12)",
    hex: "#a78bfa",
    pill: "bg-violet-500/10 text-violet-300 border-violet-500/25",
    bar: "bg-violet-400",
  },
  Gold: {
    cls: "text-amber-300",
    label: "Gold",
    glow: "0 0 40px rgba(251,191,36,0.10)",
    hex: "#fbbf24",
    pill: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    bar: "bg-amber-400",
  },
  Silver: {
    cls: "text-slate-300",
    label: "Silver",
    glow: "0 0 40px rgba(148,163,184,0.08)",
    hex: "#94a3b8",
    pill: "bg-slate-500/10 text-slate-300 border-slate-500/25",
    bar: "bg-slate-400",
  },
  Bronze: {
    cls: "text-orange-300",
    label: "Bronze",
    glow: "0 0 40px rgba(249,115,22,0.10)",
    hex: "#f97316",
    pill: "bg-orange-500/10 text-orange-300 border-orange-500/25",
    bar: "bg-orange-400",
  },
};

const TIER_ICONS: Record<string, string> = {
  Diamond: "💎",
  Platinum: "⬡",
  Gold: "✦",
  Silver: "◈",
  Bronze: "◉",
};

// ── Pixel Avatar ─────────────────────────────────────────────────────────────
function PixelAvatar({
  seed,
  size = 64,
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

// ── Main page ────────────────────────────────────────────────────────────────

export default function UsernameDetailPage() {
  const { name } = useParams();
  const router = useRouter();
  const raw = decodeURIComponent(name as string)
    .toLowerCase()
    .replace(/^@/, "");

  const [data, setData] = useState<UsernameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [phantomConnected, setPhantomConnected] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyStep, setBuyStep] = useState<
    "detail" | "confirm" | "success" | "error"
  >("detail");
  const [buyError, setBuyError] = useState("");

  useEffect(() => {
    const solana = (window as any).phantom?.solana ?? (window as any).solana;
    if (solana?.isPhantom && solana.isConnected) setPhantomConnected(true);
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/user/me", { credentials: "include" });
      const json = await res.json();
      if (json.success && json.user) setUser(json.user);
    } catch {}
  }, []);

  useEffect(() => {
    if (!raw) return;
    setLoading(true);
    setNotFound(false);
    Promise.all([
      fetch(`/api/username/${raw}`).then((r) => r.json()),
      fetchMe(),
    ])
      .then(([json]) => {
        if (!json.success) setNotFound(true);
        else setData(json);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [raw, fetchMe]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleConnectWallet = async () => {
    const solana = (window as any).phantom?.solana ?? (window as any).solana;
    if (!solana?.isPhantom) {
      window.open("https://phantom.app/", "_blank");
      return;
    }
    try {
      const resp = await solana.connect();
      const pk = resp.publicKey.toString();
      setPhantomConnected(true);
      try {
        await fetch("/api/user/link-wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ wallet: pk }),
        });
        fetchMe();
      } catch {}
    } catch {
      setBuyError("Failed to connect wallet");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/user/logout", { method: "POST" });
      router.push("/");
    } catch {}
  };

  const handleBuy = async () => {
    const solana = (window as any).phantom?.solana ?? (window as any).solana;
    if (!solana?.isPhantom || !solana.isConnected) {
      setPhantomConnected(false);
      setBuyError("Wallet disconnected. Please reconnect.");
      setBuyStep("error");
      return;
    }
    setBuyLoading(true);
    setBuyError("");
    try {
      const res = await fetch("/api/marketplace/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: raw }),
      });
      const result = await res.json();
      if (result.success) setBuyStep("success");
      else {
        setBuyError(result.error ?? "Purchase failed");
        setBuyStep("error");
      }
    } catch {
      setBuyError("Network error");
      setBuyStep("error");
    }
    setBuyLoading(false);
  };

  const headerProps = {
    session: user,
    wallet: user?.wallet || null,
    provider: user?.provider || "email",
    displayName: user?.displayName || user?.name || user?.email || "User",
    activeUsername: user?.activeUsername,
    customization: user?.customization,
    notifications,
    sidebarOpen,
    onToggleSidebar: () => setSidebarOpen(!sidebarOpen),
    onMarkNotifsRead: () =>
      setNotifications((n) => n.map((x) => ({ ...x, read: true }))),
    onOpenSettings: () => router.push("/dashboard?tab=settings"),
    onLogout: handleLogout,
    onWalletLinked: () => fetchMe(),
    onOpenProfile: () => router.push("/dashboard?tab=profile"),
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070c]">
        {user && <DashboardHeader {...headerProps} />}
        <div className="flex items-center justify-center h-[calc(100vh-60px)]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
            <p className="text-[10px] text-white/20 tracking-[0.2em] uppercase font-bold">
              Loading @{raw}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-[#07070c]">
        <DashboardHeader {...headerProps} />
        <div className="flex items-center justify-center h-[calc(100vh-60px)]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5 text-white/15" />
            </div>
            <div>
              <p className="text-xl font-black text-white tracking-tight">
                @{raw}
              </p>
              <p className="text-xs text-white/25 mt-1">
                This username hasn't been registered yet
              </p>
            </div>
            <Link
              href="/dashboard?tab=marketplace"
              className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    owner,
    listing,
    tier,
    level: usernameLevel,
    staked,
    claimedAt,
  } = data;
  const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG.Bronze;
  const tierIcon = TIER_ICONS[tier] ?? "◉";

  const ownerDisplayName =
    owner?.displayName ??
    owner?.name ??
    owner?.activeUsername?.replace(/^@/, "") ??
    null;

  const walletDisplay = (w: string) =>
    w.length > 12 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w;

  const fee = (listing.price ?? 0) * 0.025;
  const total = (listing.price ?? 0) * 1.025;

  return (
    <div className="min-h-screen bg-[#07070c] text-white">
      <DashboardHeader {...headerProps} />

      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 30% at 50% 0%, ${tierCfg.hex}0d 0%, transparent 70%)`,
        }}
      />

      {/* Thin top accent bar */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${tierCfg.hex}50 50%, transparent 100%)`,
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Back nav */}
        <Link
          href="/dashboard?tab=marketplace"
          className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/70 text-[11px] font-bold uppercase tracking-widest transition-colors mb-5 group"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          Marketplace
        </Link>

        <div className="grid lg:grid-cols-[280px_1fr] gap-4">
          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Profile Card */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d14] overflow-hidden">
              {/* Mini cover */}
              <div
                className="h-14 relative"
                style={{
                  background: `linear-gradient(135deg, ${tierCfg.hex}1a 0%, transparent 80%)`,
                }}
              >
                {owner?.coverPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={owner.coverPhoto}
                    alt="cover"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                  />
                )}
              </div>

              <div className="px-4 pb-4">
                {/* Avatar row */}
                <div className="flex items-end justify-between -mt-7 mb-3">
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-xl border-2 border-[#0d0d14] overflow-hidden bg-[#111118]"
                      style={{ boxShadow: tierCfg.glow }}
                    >
                      {owner?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={owner.avatar}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PixelAvatar
                          seed={owner?.activeUsername || raw}
                          size={56}
                          themeColor={tierCfg.hex}
                        />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-teal-500 text-black text-[7px] font-black px-1 py-0.5 rounded leading-none">
                      LV{owner?.level ?? 1}
                    </div>
                  </div>

                  <span
                    className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full border ${tierCfg.pill}`}
                  >
                    {tierIcon} {tierCfg.label}
                  </span>
                </div>

                {/* Name */}
                <h2 className="text-base font-black text-white leading-tight">
                  {ownerDisplayName || `@${raw}`}
                </h2>
                {owner?.activeUsername && (
                  <p className="text-[11px] font-semibold text-teal-400/70 mt-0.5">
                    @{owner.activeUsername.replace(/^@/, "")}
                  </p>
                )}
                {owner?.bio && (
                  <p className="text-xs text-white/30 mt-2 leading-relaxed">
                    {owner.bio}
                  </p>
                )}

                {/* Wallet */}
                {(owner?.wallet || listing.ownerWallet) && (
                  <button
                    onClick={() =>
                      handleCopy(owner?.wallet ?? listing.ownerWallet ?? "")
                    }
                    className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.05] transition-all w-full group"
                  >
                    <Wallet className="w-2.5 h-2.5 text-white/20 shrink-0" />
                    <span className="font-mono text-[10px] text-white/30 tracking-wide flex-1 text-left">
                      {walletDisplay(
                        owner?.wallet ?? listing.ownerWallet ?? "",
                      )}
                    </span>
                    {copied ? (
                      <Check className="w-2.5 h-2.5 text-teal-400" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 text-white/15 group-hover:text-white/40 transition-colors" />
                    )}
                  </button>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-1.5 mt-3">
                  {[
                    {
                      icon: Users,
                      value: owner?.referrals ?? 0,
                      label: "Refs",
                      color: "text-sky-400",
                    },
                    {
                      icon: Zap,
                      value: owner?.stakedAmount ?? 0,
                      label: "Staked",
                      color: "text-violet-400",
                    },
                    {
                      icon: TrendingUp,
                      value: owner?.earnings ?? 0,
                      label: "SOL",
                      color: "text-teal-400",
                    },
                  ].map(({ icon: Icon, value, label, color }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-white/[0.025] border border-white/[0.04]"
                    >
                      <Icon className={`w-3 h-3 ${color}`} />
                      <span className="text-xs font-black text-white tabular-nums">
                        {value}
                      </span>
                      <span className="text-[8px] font-bold text-white/20 uppercase tracking-wider">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Joined */}
                {owner?.joinedAt && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-1.5 text-[10px] text-white/20 font-semibold">
                    <Calendar className="w-2.5 h-2.5" />
                    Joined{" "}
                    {new Date(owner.joinedAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Also Owns */}
            {owner &&
              owner.usernames.filter((u) => u.name !== raw).length > 0 && (
                <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d14] p-3.5">
                  <p className="text-[8px] font-black text-white/15 uppercase tracking-[0.2em] mb-2.5">
                    Also Owns
                  </p>
                  <div className="space-y-0.5">
                    {owner.usernames
                      .filter((u) => u.name !== raw)
                      .slice(0, 5)
                      .map((u) => {
                        const utc = TIER_CONFIG[u.tier] ?? TIER_CONFIG.Bronze;
                        return (
                          <Link
                            key={u.name}
                            href={`/username/${u.name}`}
                            className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-all group"
                          >
                            <span className="text-xs font-bold text-white/40 group-hover:text-white/80 transition-colors">
                              @{u.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[8px] font-black uppercase tracking-wider ${utc.cls}`}
                              >
                                {u.tier}
                              </span>
                              <ChevronRight className="w-2.5 h-2.5 text-white/10 group-hover:text-white/30 transition-colors" />
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              )}
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Hero username banner */}
            <div
              className="rounded-2xl border border-white/[0.06] bg-[#0d0d14] overflow-hidden relative"
              style={{ boxShadow: tierCfg.glow }}
            >
              {/* Top accent */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${tierCfg.hex}60, transparent)`,
                }}
              />

              {/* Decorative crown */}
              <div className="absolute bottom-2 right-4 opacity-[0.04] pointer-events-none select-none">
                <Crown size={100} style={{ color: tierCfg.hex }} />
              </div>

              <div className="px-6 py-5">
                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  <span
                    className={`text-[8px] font-black uppercase tracking-[0.18em] px-2 py-1 rounded-full border ${tierCfg.pill}`}
                  >
                    {tierIcon} {tierCfg.label}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-[0.18em] px-2 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/25">
                    {raw.length} chars
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-[0.18em] px-2 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/25">
                    Level {usernameLevel}
                  </span>
                  {staked && (
                    <span className="text-[8px] font-black uppercase tracking-[0.18em] px-2 py-1 rounded-full border border-teal-500/25 bg-teal-500/8 text-teal-300 flex items-center gap-1">
                      <Zap className="w-2 h-2" />
                      Staked
                    </span>
                  )}
                  {claimedAt && (
                    <span className="text-[8px] font-black uppercase tracking-[0.18em] px-2 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/25">
                      Claimed{" "}
                      {new Date(claimedAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {/* Big username */}
                <h1
                  className="text-5xl sm:text-7xl font-black tracking-tight leading-none"
                  style={{ color: tierCfg.hex }}
                >
                  @{raw}
                </h1>

                {/* Copy username */}
                <button
                  onClick={() => handleCopy(`@${raw}`)}
                  className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-white/25 hover:text-white/60 font-bold transition-colors"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-teal-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  Copy username
                </button>
              </div>
            </div>

            {/* Meta chips */}
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  label: "Tier",
                  value: tierCfg.label,
                  icon: Crown,
                  color: tierCfg.cls,
                },
                {
                  label: "Characters",
                  value: raw.length,
                  icon: Activity,
                  color: "text-white/40",
                },
                {
                  label: "Level",
                  value: usernameLevel,
                  icon: Shield,
                  color: "text-violet-400",
                },
                {
                  label: "Status",
                  value: staked
                    ? "Staked"
                    : listing.isListed
                      ? "Listed"
                      : "Held",
                  icon: Zap,
                  color: staked
                    ? "text-teal-400"
                    : listing.isListed
                      ? "text-amber-400"
                      : "text-white/25",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/[0.05] bg-[#0d0d14] px-3 py-3 flex flex-col gap-1.5"
                >
                  <Icon className={`w-3 h-3 ${color}`} />
                  <p className="text-sm font-black text-white leading-none">
                    {value}
                  </p>
                  <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/18">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Listing / Buy card */}
            {listing.isListed ? (
              <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d14] overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-400" />
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-400">
                        Listed for Sale
                      </span>
                    </div>
                    {listing.listedAt && (
                      <span className="text-[9px] font-semibold text-white/15">
                        Since{" "}
                        {new Date(listing.listedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/15 mb-1.5">
                      Listed Price
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-white tracking-tight tabular-nums">
                        {listing.price}
                      </span>
                      <span className="text-base font-black text-white/20 uppercase">
                        SOL
                      </span>
                    </div>
                  </div>

                  {/* Buy steps */}
                  {buyStep === "detail" && (
                    <div className="flex gap-2">
                      {!phantomConnected ? (
                        <button
                          onClick={handleConnectWallet}
                          className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-black text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/15"
                        >
                          <Wallet size={13} />
                          Connect Wallet to Buy
                        </button>
                      ) : (
                        <button
                          onClick={() => setBuyStep("confirm")}
                          className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-black text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/15"
                        >
                          <ShoppingCart size={13} />
                          Buy Now
                        </button>
                      )}
                      <button className="px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] text-white/40 hover:text-white text-xs font-black transition-all">
                        Make Offer
                      </button>
                    </div>
                  )}

                  {buyStep === "confirm" && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
                      <div className="rounded-xl bg-white/[0.025] border border-white/[0.05] divide-y divide-white/[0.04] overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-3">
                          <span className="text-xs text-white/35 font-semibold">
                            Listing Price
                          </span>
                          <span className="text-xs font-black text-white">
                            {listing.price} SOL
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3">
                          <span className="text-xs text-white/35 font-semibold">
                            Network Fee (2.5%)
                          </span>
                          <span className="text-xs font-black text-white/40">
                            {fee.toFixed(4)} SOL
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 bg-teal-500/[0.04]">
                          <span className="text-xs font-black text-white">
                            Total Due
                          </span>
                          <span className="text-lg font-black text-teal-400 tabular-nums">
                            {total.toFixed(4)} SOL
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setBuyStep("detail")}
                          className="flex-1 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-white/35 hover:text-white text-xs font-black transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleBuy}
                          disabled={buyLoading}
                          className="flex-[2] py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black text-xs font-black transition-all flex items-center justify-center gap-1.5"
                        >
                          {buyLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check size={13} />
                          )}
                          Confirm Purchase
                        </button>
                      </div>
                    </div>
                  )}

                  {buyStep === "success" && (
                    <div className="text-center py-3 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                      <div
                        className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto"
                        style={{ boxShadow: "0 0 30px rgba(20,184,166,0.12)" }}
                      >
                        <Check size={20} className="text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">
                          Purchase Successful
                        </h3>
                        <p className="text-xs text-white/30 mt-0.5">
                          @{raw} is now yours
                        </p>
                      </div>
                      <button
                        onClick={() => router.push("/dashboard?tab=names")}
                        className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-black transition-all"
                      >
                        View My Names
                      </button>
                    </div>
                  )}

                  {buyStep === "error" && (
                    <div className="text-center py-3 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                        <AlertCircle size={20} className="text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">
                          Purchase Failed
                        </h3>
                        <p className="text-xs text-white/30 mt-0.5">
                          {buyError}
                        </p>
                      </div>
                      <button
                        onClick={() => setBuyStep("detail")}
                        className="w-full py-3 rounded-xl border border-white/[0.07] text-white text-xs font-black transition-all hover:bg-white/[0.04]"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d14] p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-white/[0.025] border border-white/[0.05] flex items-center justify-center mx-auto mb-3">
                  <Shield size={16} className="text-white/12" />
                </div>
                <p className="text-sm font-black text-white/30">
                  Not Listed for Sale
                </p>
                <p className="text-[11px] text-white/15 mt-0.5">
                  This username is held by its owner
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
