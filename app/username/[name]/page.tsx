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
  ChevronRight,
  Tag,
  Layers,
  Hash,
  Star,
  Sparkles,
  X,
  ZoomIn,
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
  tier: string; // ignored — we recalculate from length
  length: number;
  level: number;
  staked: boolean;
  claimedAt: string | null;
  listing: ListingInfo;
  owner: OwnerProfile | null;
}

// ── Tier config ──────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  Diamond: {
    cls: "text-cyan-300",
    label: "Diamond",
    chars: "1–3",
    glow: "0 0 40px rgba(34,211,238,0.12), 0 0 80px rgba(34,211,238,0.04)",
    hex: "#22d3ee",
    pill: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    gradient: "from-cyan-500/15 via-cyan-500/5 to-transparent",
  },
  Platinum: {
    cls: "text-violet-300",
    label: "Platinum",
    chars: "4–5",
    glow: "0 0 40px rgba(167,139,250,0.12), 0 0 80px rgba(167,139,250,0.04)",
    hex: "#a78bfa",
    pill: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    gradient: "from-violet-500/15 via-violet-500/5 to-transparent",
  },
  Gold: {
    cls: "text-amber-300",
    label: "Gold",
    chars: "6–8",
    glow: "0 0 40px rgba(251,191,36,0.12), 0 0 80px rgba(251,191,36,0.04)",
    hex: "#fbbf24",
    pill: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
  },
  Silver: {
    cls: "text-slate-300",
    label: "Silver",
    chars: "9–15",
    glow: "0 0 40px rgba(148,163,184,0.08), 0 0 80px rgba(148,163,184,0.03)",
    hex: "#94a3b8",
    pill: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    gradient: "from-slate-500/15 via-slate-500/5 to-transparent",
  },
  Bronze: {
    cls: "text-orange-300",
    label: "Bronze",
    chars: "16+",
    glow: "0 0 40px rgba(249,115,22,0.10), 0 0 80px rgba(249,115,22,0.04)",
    hex: "#f97316",
    pill: "bg-orange-500/10 text-orange-300 border-orange-500/20",
    gradient: "from-orange-500/15 via-orange-500/5 to-transparent",
  },
} as const;

const TIER_ICONS: Record<string, string> = {
  Diamond: "💎",
  Platinum: "⬡",
  Gold: "✦",
  Silver: "◈",
  Bronze: "◉",
};

// ── THE FIX: always derive tier from actual username length ──────────────────
function getTier(username: string): keyof typeof TIER_CONFIG {
  const n = username.replace(/^@/, "").length;
  if (n <= 3) return "Diamond";
  if (n <= 5) return "Platinum";
  if (n <= 8) return "Gold";
  if (n <= 15) return "Silver";
  return "Bronze";
}

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
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b14]">
        {user && <DashboardHeader {...headerProps} />}
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border border-teal-500/20 animate-ping" />
              <div className="w-10 h-10 rounded-full border border-teal-500/30 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
              </div>
            </div>
            <p className="text-[10px] text-white/20 tracking-[0.25em] uppercase font-semibold">
              Loading @{raw}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-[#060b14]">
        <DashboardHeader {...headerProps} />
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-white/15" />
            </div>
            <div>
              <p className="text-xl font-bold text-white tracking-tight">
                @{raw}
              </p>
              <p className="text-sm text-white/25 mt-1">
                Username not registered
              </p>
            </div>
            <Link
              href="/dashboard?tab=marketplace"
              className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 text-xs font-semibold transition-colors group"
            >
              <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { owner, listing, level: usernameLevel, staked, claimedAt } = data;

  // ✅ THE FIX: calculate tier from the actual username length, ignore data.tier
  const tier = getTier(raw);
  const tierCfg = TIER_CONFIG[tier];
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

  // Helper: get tier for any username string (used in "Also Owns")
  const getOwnerUsernameTier = (uname: string): keyof typeof TIER_CONFIG =>
    getTier(uname);

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <DashboardHeader {...headerProps} />

      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 70% 30% at 50% -5%, ${tierCfg.hex}0a 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 85% 85%, ${tierCfg.hex}05 0%, transparent 50%)
          `,
        }}
      />

      {/* Tier accent bar */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${tierCfg.hex}70 30%, ${tierCfg.hex}99 50%, ${tierCfg.hex}70 70%, transparent 100%)`,
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Back nav */}
        <Link
          href="/dashboard?tab=marketplace"
          className="inline-flex items-center gap-1.5 text-white/25 hover:text-white/60 text-xs font-semibold uppercase tracking-widest transition-all mb-6 group"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          Marketplace
        </Link>

        <div className="grid lg:grid-cols-[320px_1fr] gap-4">
          {/* ── LEFT: Owner panel ─────────────────────────────────── */}
          <div className="space-y-3">
            <div
              className="rounded-2xl border border-white/[0.07] bg-[#0a0f1a] overflow-hidden"
              style={{ boxShadow: tierCfg.glow }}
            >
              {/* Cover strip */}
              <div
                className="h-32 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${tierCfg.hex}1a 0%, ${tierCfg.hex}08 50%, transparent 100%)`,
                }}
              >
                {owner?.coverPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={owner.coverPhoto}
                    alt="cover"
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                )}
                <div
                  className="absolute inset-0 opacity-[0.15]"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, ${tierCfg.hex}60 1px, transparent 0)`,
                    backgroundSize: "16px 16px",
                  }}
                />
              </div>

              <div className="px-5 pb-5">
                {/* Avatar */}
                <div className="flex items-end justify-between -mt-10 mb-4">
                  <div className="relative group/avatar">
                    <button
                      onClick={() => setAvatarModalOpen(true)}
                      className="block relative"
                      title="View full size"
                    >
                      <div
                        className="w-20 h-20 rounded-full border-[3px] border-[#0a0f1a] overflow-hidden bg-[#111520] transition-transform group-hover/avatar:scale-105"
                        style={{ boxShadow: `0 0 24px ${tierCfg.hex}40` }}
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
                            size={80}
                            themeColor={tierCfg.hex}
                          />
                        )}
                      </div>
                      {/* Zoom hint */}
                      <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover/avatar:bg-black/40 transition-all">
                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                      </div>
                    </button>
                    <div
                      className="absolute -bottom-1 -right-1 text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none text-black"
                      style={{ background: tierCfg.hex }}
                    >
                      LV{owner?.level ?? 1}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border ${tierCfg.pill}`}
                  >
                    {tierIcon} {tierCfg.label}
                  </span>
                </div>

                <div className="space-y-0.5 mb-4">
                  <p className="text-lg font-bold text-white leading-tight truncate">
                    {ownerDisplayName || `@${raw}`}
                  </p>
                  {owner?.activeUsername && (
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: `${tierCfg.hex}90` }}
                    >
                      @{owner.activeUsername.replace(/^@/, "")}
                    </p>
                  )}
                  {owner?.bio && (
                    <p className="text-xs text-white/35 mt-2 leading-relaxed line-clamp-3">
                      {owner.bio}
                    </p>
                  )}
                </div>

                {/* Wallet */}
                {(owner?.wallet || listing.ownerWallet) && (
                  <button
                    onClick={() =>
                      handleCopy(owner?.wallet ?? listing.ownerWallet ?? "")
                    }
                    className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all w-full group"
                  >
                    <Wallet className="w-3.5 h-3.5 text-white/20 shrink-0" />
                    <span className="font-mono text-xs text-white/35 tracking-wide flex-1 text-left">
                      {walletDisplay(
                        owner?.wallet ?? listing.ownerWallet ?? "",
                      )}
                    </span>
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                    )}
                  </button>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    {
                      icon: Users,
                      val: owner?.referrals ?? 0,
                      label: "Refs",
                      color: "#38bdf8",
                    },
                    {
                      icon: Zap,
                      val: owner?.stakedAmount ?? 0,
                      label: "Staked",
                      color: "#a78bfa",
                    },
                    {
                      icon: TrendingUp,
                      val: (owner?.earnings ?? 0).toFixed(2),
                      label: "SOL",
                      color: "#2dd4bf",
                    },
                  ].map(({ icon: Icon, val, label, color }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                      <span className="text-sm font-black text-white tabular-nums">
                        {val}
                      </span>
                      <span className="text-[9px] font-semibold text-white/20 uppercase tracking-wider">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {owner?.joinedAt && (
                  <div className="flex items-center gap-1.5 text-xs text-white/25 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined{" "}
                    {new Date(owner.joinedAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Also Owns */}
            {owner &&
              owner.usernames.filter((u) => u.name !== raw).length > 0 && (
                <div className="rounded-2xl border border-white/[0.06] bg-[#0a0f1a] p-4">
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2.5 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" /> Also Owns
                  </p>
                  <div className="space-y-0.5">
                    {owner.usernames
                      .filter((u) => u.name !== raw)
                      .slice(0, 5)
                      .map((u) => {
                        // ✅ Also fix tier display in "Also Owns" list
                        const uTier = getOwnerUsernameTier(u.name);
                        const utc = TIER_CONFIG[uTier];
                        return (
                          <Link
                            key={u.name}
                            href={`/username/${u.name}`}
                            className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all group"
                          >
                            <span className="text-xs font-semibold text-white/40 group-hover:text-white/70 transition-colors truncate">
                              @{u.name}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span
                                className="text-[9px] font-bold uppercase tracking-wide"
                                style={{ color: utc.hex }}
                              >
                                {utc.label}
                              </span>
                              <ChevronRight className="w-3 h-3 text-white/15 group-hover:text-white/35 transition-colors" />
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              )}
          </div>

          {/* ── RIGHT ─────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Hero banner */}
            <div
              className="rounded-2xl border overflow-hidden relative"
              style={{
                borderColor: `${tierCfg.hex}20`,
                background: `linear-gradient(135deg, #0d1525 0%, #0a0f1a 60%, #060b14 100%)`,
                boxShadow: tierCfg.glow,
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${tierCfg.hex}80, transparent)`,
                }}
              />
              {/* Decorative watermark char */}
              <div
                className="absolute -bottom-8 -right-4 text-[180px] font-black leading-none select-none pointer-events-none opacity-[0.022]"
                style={{ color: tierCfg.hex }}
              >
                {raw.charAt(0).toUpperCase()}
              </div>

              <div className="relative px-6 py-7">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border"
                    style={{
                      borderColor: `${tierCfg.hex}30`,
                      background: `${tierCfg.hex}10`,
                      color: tierCfg.hex,
                    }}
                  >
                    {tierIcon} {tierCfg.label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border border-white/[0.07] bg-white/[0.03] text-white/30">
                    <Hash className="w-2.5 h-2.5" />
                    {raw.length} chars
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border border-white/[0.07] bg-white/[0.03] text-white/30">
                    <Star className="w-2.5 h-2.5" />
                    Lv{usernameLevel}
                  </span>
                  {staked && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border border-teal-500/25 bg-teal-500/10 text-teal-300">
                      <Zap className="w-2.5 h-2.5" /> Staked
                    </span>
                  )}
                  {claimedAt && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/20 px-2.5 py-1 rounded-full border border-white/[0.05] bg-white/[0.02]">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(claimedAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {/* Username */}
                <h1
                  className="text-5xl sm:text-6xl font-black tracking-tight leading-none"
                  style={{
                    color: tierCfg.hex,
                    textShadow: `0 0 40px ${tierCfg.hex}40`,
                  }}
                >
                  @{raw}
                </h1>

                {/* Copy */}
                <button
                  onClick={() => handleCopy(`@${raw}`)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/25 hover:text-white/60 font-medium transition-colors group"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-teal-400" />
                      <span className="text-teal-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 group-hover:text-white/50" />
                      Copy @{raw}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Meta stat cards */}
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  label: "Tier",
                  value: tierCfg.label,
                  icon: Crown,
                  color: tierCfg.hex,
                  bg: `${tierCfg.hex}12`,
                },
                {
                  label: "Length",
                  value: `${raw.length}`,
                  icon: Hash,
                  color: "#94a3b8",
                  bg: "rgba(148,163,184,0.08)",
                },
                {
                  label: "Level",
                  value: usernameLevel,
                  icon: Sparkles,
                  color: "#a78bfa",
                  bg: "rgba(167,139,250,0.08)",
                },
                {
                  label: "Status",
                  value: staked
                    ? "Staked"
                    : listing.isListed
                      ? "Listed"
                      : "Held",
                  icon: staked ? Zap : listing.isListed ? Tag : Shield,
                  color: staked
                    ? "#2dd4bf"
                    : listing.isListed
                      ? "#fbbf24"
                      : "#475569",
                  bg: staked
                    ? "rgba(45,212,191,0.08)"
                    : listing.isListed
                      ? "rgba(251,191,36,0.08)"
                      : "rgba(71,85,105,0.08)",
                },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/[0.06] bg-[#0a0f1a] px-3 py-3.5 flex flex-col gap-2 hover:border-white/[0.1] transition-all"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: bg }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none">
                      {value}
                    </p>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/25 mt-0.5">
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Buy / Not listed card */}
            {listing.isListed ? (
              <div
                className="rounded-2xl border overflow-hidden relative"
                style={{
                  borderColor: "rgba(45,212,191,0.15)",
                  background:
                    "linear-gradient(135deg, #0a1520 0%, #0a0f1a 100%)",
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-[0.15em] text-teal-400">
                        Listed for Sale
                      </span>
                    </div>
                    {listing.listedAt && (
                      <span className="text-[10px] font-medium text-white/20">
                        Since{" "}
                        {new Date(listing.listedAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                    )}
                  </div>

                  {/* Detail step */}
                  {buyStep === "detail" && (
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20 mb-1.5">
                          Listing Price
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black text-white tabular-nums leading-none">
                            {listing.price}
                          </span>
                          <span className="text-base font-black text-white/30 uppercase tracking-wide">
                            SOL
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {!phantomConnected ? (
                          <button
                            onClick={handleConnectWallet}
                            className="h-11 px-5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.97] text-black text-sm font-black transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20"
                          >
                            <Wallet size={14} /> Connect Wallet
                          </button>
                        ) : (
                          <button
                            onClick={() => setBuyStep("confirm")}
                            className="h-11 px-5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.97] text-black text-sm font-black transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20"
                          >
                            <ShoppingCart size={14} /> Buy Now
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Confirm step */}
                  {buyStep === "confirm" && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <p className="text-sm font-bold text-white">
                        Confirm Purchase
                      </p>
                      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-3">
                          <span className="text-sm text-white/40 font-medium">
                            Listing Price
                          </span>
                          <span className="text-sm font-bold text-white">
                            {listing.price} SOL
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3">
                          <span className="text-sm text-white/40 font-medium">
                            Network Fee (2.5%)
                          </span>
                          <span className="text-sm font-bold text-white/40">
                            {fee.toFixed(4)} SOL
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 bg-teal-500/[0.05]">
                          <span className="text-sm font-bold text-white">
                            Total
                          </span>
                          <span className="text-lg font-black text-teal-400 tabular-nums">
                            {total.toFixed(4)} SOL
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setBuyStep("detail")}
                          className="flex-1 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.04] text-sm font-bold transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleBuy}
                          disabled={buyLoading}
                          className="flex-[2] py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black text-sm font-black transition-all flex items-center justify-center gap-2"
                        >
                          {buyLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          Confirm Purchase
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Success */}
                  {buyStep === "success" && (
                    <div className="py-2 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                          <Check size={16} className="text-teal-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            Purchase Successful!
                          </p>
                          <p className="text-xs text-white/30 mt-0.5">
                            @{raw} is now yours
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push("/dashboard?tab=names")}
                        className="h-9 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-black transition-all"
                      >
                        View Names
                      </button>
                    </div>
                  )}

                  {/* Error */}
                  {buyStep === "error" && (
                    <div className="py-2 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                          <AlertCircle size={16} className="text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            Purchase Failed
                          </p>
                          <p className="text-xs text-white/30 mt-0.5 max-w-[200px] truncate">
                            {buyError}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setBuyStep("detail")}
                        className="h-9 px-4 rounded-xl border border-white/[0.08] text-white/60 hover:text-white text-xs font-bold transition-all hover:bg-white/[0.04]"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.05] bg-[#0a0f1a] px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <Shield size={16} className="text-white/15" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/30">
                    Not Listed for Sale
                  </p>
                  <p className="text-xs text-white/15 mt-0.5">
                    This username is privately held by its owner
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Avatar lightbox modal ─────────────────────────────────────── */}
      {avatarModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setAvatarModalOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Modal content */}
          <div
            className="relative z-10 flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setAvatarModalOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all z-20"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Large avatar */}
            <div
              className="w-64 h-64 rounded-3xl overflow-hidden border-2"
              style={{
                borderColor: `${tierCfg.hex}50`,
                boxShadow: `0 0 80px ${tierCfg.hex}30, 0 0 160px ${tierCfg.hex}10`,
              }}
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
                  size={256}
                  themeColor={tierCfg.hex}
                />
              )}
            </div>

            {/* Name below */}
            <div className="text-center">
              <p className="text-base font-bold text-white">
                {ownerDisplayName || `@${raw}`}
              </p>
              {owner?.activeUsername && (
                <p
                  className="text-sm mt-0.5"
                  style={{ color: `${tierCfg.hex}90` }}
                >
                  @{owner.activeUsername.replace(/^@/, "")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
