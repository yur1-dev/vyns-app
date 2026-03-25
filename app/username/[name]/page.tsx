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
  ExternalLink,
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
    dot: string;
  }
> = {
  Diamond: {
    cls: "text-cyan-300",
    label: "Diamond",
    glow: "0 0 20px rgba(34,211,238,0.08)",
    hex: "#22d3ee",
    pill: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    bar: "bg-cyan-400",
    dot: "bg-cyan-400",
  },
  Platinum: {
    cls: "text-violet-300",
    label: "Platinum",
    glow: "0 0 20px rgba(167,139,250,0.08)",
    hex: "#a78bfa",
    pill: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    bar: "bg-violet-400",
    dot: "bg-violet-400",
  },
  Gold: {
    cls: "text-amber-300",
    label: "Gold",
    glow: "0 0 20px rgba(251,191,36,0.08)",
    hex: "#fbbf24",
    pill: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    bar: "bg-amber-400",
    dot: "bg-amber-400",
  },
  Silver: {
    cls: "text-slate-300",
    label: "Silver",
    glow: "0 0 20px rgba(148,163,184,0.06)",
    hex: "#94a3b8",
    pill: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    bar: "bg-slate-400",
    dot: "bg-slate-400",
  },
  Bronze: {
    cls: "text-orange-300",
    label: "Bronze",
    glow: "0 0 20px rgba(249,115,22,0.08)",
    hex: "#f97316",
    pill: "bg-orange-500/10 text-orange-300 border-orange-500/20",
    bar: "bg-orange-400",
    dot: "bg-orange-400",
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
  size = 32,
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

// ── Stat Chip ────────────────────────────────────────────────────────────────
function StatChip({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: any;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
      <Icon className={`w-3 h-3 ${color} shrink-0`} />
      <span className="text-xs font-black text-white tabular-nums">
        {value}
      </span>
      <span className="text-[9px] font-semibold text-white/20 uppercase tracking-wider">
        {label}
      </span>
    </div>
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

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b14]">
        {user && <DashboardHeader {...headerProps} />}
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
            <p className="text-[10px] text-white/20 tracking-[0.2em] uppercase font-bold">
              Loading @{raw}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-[#060b14]">
        <DashboardHeader {...headerProps} />
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-white/10 mx-auto" />
            <div>
              <p className="text-base font-black text-white">@{raw}</p>
              <p className="text-xs text-white/25 mt-0.5">
                Username not registered
              </p>
            </div>
            <Link
              href="/dashboard?tab=marketplace"
              className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Marketplace
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
    w.length > 12 ? `${w.slice(0, 5)}…${w.slice(-4)}` : w;

  const fee = (listing.price ?? 0) * 0.025;
  const total = (listing.price ?? 0) * 1.025;

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <DashboardHeader {...headerProps} />

      {/* Subtle ambient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 25% at 50% 0%, ${tierCfg.hex}08 0%, transparent 60%)`,
        }}
      />

      {/* Tier accent bar */}
      <div
        className="h-px w-full"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${tierCfg.hex}40 50%, transparent 100%)`,
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-5">
        {/* Back nav */}
        <Link
          href="/dashboard?tab=marketplace"
          className="inline-flex items-center gap-1 text-white/25 hover:text-white/60 text-[10px] font-bold uppercase tracking-widest transition-colors mb-4 group"
        >
          <ArrowLeft className="w-2.5 h-2.5 group-hover:-translate-x-0.5 transition-transform" />
          Marketplace
        </Link>

        {/* ── MAIN LAYOUT ─────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[220px_1fr] gap-3">
          {/* ── LEFT: compact owner panel ─────────────────────────────── */}
          <div className="space-y-2">
            {/* Owner card */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0a0f1a] overflow-hidden">
              {/* Slim cover */}
              <div
                className="h-8 relative"
                style={{
                  background: `linear-gradient(135deg, ${tierCfg.hex}18 0%, transparent 70%)`,
                }}
              >
                {owner?.coverPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={owner.coverPhoto}
                    alt="cover"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                )}
              </div>

              <div className="px-3 pb-3">
                {/* Avatar + tier */}
                <div className="flex items-end justify-between -mt-5 mb-2">
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-[#0a0f1a] overflow-hidden bg-[#111520]"
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
                          size={40}
                          themeColor={tierCfg.hex}
                        />
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 bg-teal-500 text-black text-[6px] font-black px-1 py-px rounded leading-none">
                      LV{owner?.level ?? 1}
                    </div>
                  </div>
                  <span
                    className={`text-[7px] font-black uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full border ${tierCfg.pill}`}
                  >
                    {tierIcon} {tierCfg.label}
                  </span>
                </div>

                {/* Name */}
                <p className="text-sm font-black text-white leading-tight truncate">
                  {ownerDisplayName || `@${raw}`}
                </p>
                {owner?.activeUsername && (
                  <p className="text-[10px] font-semibold text-teal-400/60 mt-0.5 truncate">
                    @{owner.activeUsername.replace(/^@/, "")}
                  </p>
                )}
                {owner?.bio && (
                  <p className="text-[10px] text-white/25 mt-1.5 leading-relaxed line-clamp-2">
                    {owner.bio}
                  </p>
                )}

                {/* Wallet */}
                {(owner?.wallet || listing.ownerWallet) && (
                  <button
                    onClick={() =>
                      handleCopy(owner?.wallet ?? listing.ownerWallet ?? "")
                    }
                    className="mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/[0.025] border border-white/[0.05] hover:border-white/[0.09] transition-all w-full group"
                  >
                    <Wallet className="w-2 h-2 text-white/15 shrink-0" />
                    <span className="font-mono text-[9px] text-white/25 tracking-wide flex-1 text-left">
                      {walletDisplay(
                        owner?.wallet ?? listing.ownerWallet ?? "",
                      )}
                    </span>
                    {copied ? (
                      <Check className="w-2 h-2 text-teal-400" />
                    ) : (
                      <Copy className="w-2 h-2 text-white/15 group-hover:text-white/35 transition-colors" />
                    )}
                  </button>
                )}

                {/* Stats */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <StatChip
                    icon={Users}
                    value={owner?.referrals ?? 0}
                    label="Refs"
                    color="text-sky-400"
                  />
                  <StatChip
                    icon={Zap}
                    value={owner?.stakedAmount ?? 0}
                    label="Staked"
                    color="text-violet-400"
                  />
                  <StatChip
                    icon={TrendingUp}
                    value={owner?.earnings ?? 0}
                    label="SOL"
                    color="text-teal-400"
                  />
                </div>

                {/* Joined */}
                {owner?.joinedAt && (
                  <div className="mt-2 flex items-center gap-1 text-[9px] text-white/15 font-semibold">
                    <Calendar className="w-2 h-2" />
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
                <div className="rounded-xl border border-white/[0.06] bg-[#0a0f1a] px-3 py-2.5">
                  <p className="text-[7px] font-black text-white/15 uppercase tracking-[0.2em] mb-1.5">
                    Also Owns
                  </p>
                  <div className="space-y-px">
                    {owner.usernames
                      .filter((u) => u.name !== raw)
                      .slice(0, 5)
                      .map((u) => {
                        const utc = TIER_CONFIG[u.tier] ?? TIER_CONFIG.Bronze;
                        return (
                          <Link
                            key={u.name}
                            href={`/username/${u.name}`}
                            className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-all group"
                          >
                            <span className="text-[11px] font-bold text-white/35 group-hover:text-white/70 transition-colors truncate">
                              @{u.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              <span
                                className={`text-[7px] font-black uppercase tracking-wide ${utc.cls}`}
                              >
                                {u.tier}
                              </span>
                              <ChevronRight className="w-2 h-2 text-white/10 group-hover:text-white/25 transition-colors" />
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              )}
          </div>

          {/* ── RIGHT: username detail ─────────────────────────────────── */}
          <div className="space-y-3">
            {/* Hero banner — compact */}
            <div
              className="rounded-xl border border-white/[0.06] bg-[#0a0f1a] overflow-hidden relative"
              style={{ boxShadow: tierCfg.glow }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${tierCfg.hex}50, transparent)`,
                }}
              />

              {/* BG watermark */}
              <div className="absolute bottom-0 right-3 opacity-[0.035] pointer-events-none select-none">
                <Crown size={72} style={{ color: tierCfg.hex }} />
              </div>

              <div className="px-5 py-4">
                {/* Pills row */}
                <div className="flex flex-wrap items-center gap-1 mb-3">
                  <span
                    className={`text-[7px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full border ${tierCfg.pill}`}
                  >
                    {tierIcon} {tierCfg.label}
                  </span>
                  <span className="text-[7px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/25">
                    {raw.length} chars
                  </span>
                  <span className="text-[7px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/25">
                    Lv{usernameLevel}
                  </span>
                  {staked && (
                    <span className="text-[7px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full border border-teal-500/20 bg-teal-500/8 text-teal-300 flex items-center gap-0.5">
                      <Zap className="w-1.5 h-1.5" /> Staked
                    </span>
                  )}
                  {claimedAt && (
                    <span className="text-[7px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/20">
                      {new Date(claimedAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {/* Username */}
                <h1
                  className="text-4xl sm:text-5xl font-black tracking-tight leading-none"
                  style={{ color: tierCfg.hex }}
                >
                  @{raw}
                </h1>

                {/* Copy */}
                <button
                  onClick={() => handleCopy(`@${raw}`)}
                  className="mt-2.5 inline-flex items-center gap-1 text-[10px] text-white/20 hover:text-white/50 font-bold transition-colors"
                >
                  {copied ? (
                    <Check className="w-2.5 h-2.5 text-teal-400" />
                  ) : (
                    <Copy className="w-2.5 h-2.5" />
                  )}
                  Copy username
                </button>
              </div>
            </div>

            {/* Meta chips — single row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  label: "Tier",
                  value: tierCfg.label,
                  icon: Crown,
                  color: tierCfg.cls,
                },
                {
                  label: "Chars",
                  value: raw.length,
                  icon: Activity,
                  color: "text-white/35",
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
                      : "text-white/20",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/[0.05] bg-[#0a0f1a] px-3 py-2.5 flex flex-col gap-1"
                >
                  <Icon className={`w-3 h-3 ${color}`} />
                  <p className="text-sm font-black text-white leading-none">
                    {value}
                  </p>
                  <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/18">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Listing / Buy card */}
            {listing.isListed ? (
              <div className="rounded-xl border border-white/[0.06] bg-[#0a0f1a] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />

                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-400" />
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-[0.18em] text-teal-400">
                        Listed for Sale
                      </span>
                    </div>
                    {listing.listedAt && (
                      <span className="text-[9px] font-semibold text-white/15">
                        Since{" "}
                        {new Date(listing.listedAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                    )}
                  </div>

                  {/* Price + action in same row */}
                  <div className="flex items-end justify-between gap-4">
                    {/* Price */}
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/15 mb-1">
                        Price
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-white tabular-nums">
                          {listing.price}
                        </span>
                        <span className="text-sm font-black text-white/20 uppercase">
                          SOL
                        </span>
                      </div>
                    </div>

                    {/* Buttons */}
                    {buyStep === "detail" && (
                      <div className="flex gap-1.5 shrink-0">
                        {!phantomConnected ? (
                          <button
                            onClick={handleConnectWallet}
                            className="h-9 px-4 rounded-lg bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-black text-[11px] font-black transition-all flex items-center gap-1.5 shadow-lg shadow-teal-500/15"
                          >
                            <Wallet size={11} />
                            Connect Wallet
                          </button>
                        ) : (
                          <button
                            onClick={() => setBuyStep("confirm")}
                            className="h-9 px-4 rounded-lg bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-black text-[11px] font-black transition-all flex items-center gap-1.5 shadow-lg shadow-teal-500/15"
                          >
                            <ShoppingCart size={11} />
                            Buy Now
                          </button>
                        )}
                        <button className="h-9 px-3 rounded-lg border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] text-white/35 hover:text-white text-[11px] font-black transition-all">
                          Offer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Confirm step */}
                  {buyStep === "confirm" && (
                    <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                      <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] divide-y divide-white/[0.04] overflow-hidden">
                        <div className="flex justify-between items-center px-3 py-2.5">
                          <span className="text-[11px] text-white/30 font-semibold">
                            Listing Price
                          </span>
                          <span className="text-[11px] font-black text-white">
                            {listing.price} SOL
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-3 py-2.5">
                          <span className="text-[11px] text-white/30 font-semibold">
                            Network Fee (2.5%)
                          </span>
                          <span className="text-[11px] font-black text-white/35">
                            {fee.toFixed(4)} SOL
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-3 py-2.5 bg-teal-500/[0.04]">
                          <span className="text-[11px] font-black text-white">
                            Total
                          </span>
                          <span className="text-base font-black text-teal-400 tabular-nums">
                            {total.toFixed(4)} SOL
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setBuyStep("detail")}
                          className="flex-1 py-2.5 rounded-lg border border-white/[0.07] bg-white/[0.02] text-white/30 hover:text-white text-[11px] font-black transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleBuy}
                          disabled={buyLoading}
                          className="flex-[2] py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black text-[11px] font-black transition-all flex items-center justify-center gap-1.5"
                        >
                          {buyLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check size={11} />
                          )}
                          Confirm Purchase
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Success */}
                  {buyStep === "success" && (
                    <div className="mt-3 py-2 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                          <Check size={13} className="text-teal-400" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">
                            Purchase Successful
                          </p>
                          <p className="text-[9px] text-white/25">
                            @{raw} is now yours
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push("/dashboard?tab=names")}
                        className="h-8 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black text-[11px] font-black transition-all"
                      >
                        View Names
                      </button>
                    </div>
                  )}

                  {/* Error */}
                  {buyStep === "error" && (
                    <div className="mt-3 py-2 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                          <AlertCircle size={13} className="text-red-400" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">
                            Purchase Failed
                          </p>
                          <p className="text-[9px] text-white/25 max-w-[160px] truncate">
                            {buyError}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setBuyStep("detail")}
                        className="h-8 px-3 rounded-lg border border-white/[0.07] text-white text-[11px] font-black transition-all hover:bg-white/[0.04]"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.05] bg-[#0a0f1a] px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center shrink-0">
                  <Shield size={13} className="text-white/12" />
                </div>
                <div>
                  <p className="text-xs font-black text-white/25">
                    Not Listed for Sale
                  </p>
                  <p className="text-[10px] text-white/12">
                    This username is held by its owner
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
