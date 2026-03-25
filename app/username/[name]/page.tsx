// app/username/[name]/page.tsx
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
    bg: string;
    label: string;
    glow: string;
    hex: string;
    accent: string;
    border: string;
    pill: string;
  }
> = {
  Diamond: {
    cls: "text-cyan-300",
    bg: "from-cyan-950/60 via-[#0a0a0f] to-[#0a0a0f]",
    label: "Diamond",
    glow: "0 0 60px rgba(34,211,238,0.15)",
    hex: "#22d3ee",
    accent: "bg-cyan-400",
    border: "border-cyan-500/20",
    pill: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  },
  Platinum: {
    cls: "text-violet-300",
    bg: "from-violet-950/60 via-[#0a0a0f] to-[#0a0a0f]",
    label: "Platinum",
    glow: "0 0 60px rgba(167,139,250,0.15)",
    hex: "#a78bfa",
    accent: "bg-violet-400",
    border: "border-violet-500/20",
    pill: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  },
  Gold: {
    cls: "text-amber-300",
    bg: "from-amber-950/60 via-[#0a0a0f] to-[#0a0a0f]",
    label: "Gold",
    glow: "0 0 60px rgba(251,191,36,0.12)",
    hex: "#fbbf24",
    accent: "bg-amber-400",
    border: "border-amber-500/20",
    pill: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  },
  Silver: {
    cls: "text-slate-300",
    bg: "from-slate-800/60 via-[#0a0a0f] to-[#0a0a0f]",
    label: "Silver",
    glow: "0 0 60px rgba(148,163,184,0.10)",
    hex: "#94a3b8",
    accent: "bg-slate-400",
    border: "border-slate-500/20",
    pill: "bg-slate-500/10 text-slate-300 border-slate-500/30",
  },
  Bronze: {
    cls: "text-orange-300",
    bg: "from-orange-950/60 via-[#0a0a0f] to-[#0a0a0f]",
    label: "Bronze",
    glow: "0 0 60px rgba(249,115,22,0.12)",
    hex: "#f97316",
    accent: "bg-orange-400",
    border: "border-orange-500/20",
    pill: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  },
};

const TIER_ICONS: Record<string, string> = {
  Diamond: "💎",
  Platinum: "⬡",
  Gold: "✦",
  Silver: "◈",
  Bronze: "◉",
};

// ── Pixel Avatar ──────────────────────────────────────────────────────────────
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

// ── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] transition-colors">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-sm font-black text-white tabular-nums">
        {value}
      </span>
      <span className="text-[9px] font-bold text-white/25 uppercase tracking-[0.18em]">
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

  // Dashboard User State
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Buy Flow State
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
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
            <p className="text-xs text-white/25 tracking-widest uppercase font-bold">
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
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-white/20" />
            </div>
            <div>
              <p className="text-2xl font-black text-white tracking-tight">
                @{raw}
              </p>
              <p className="text-sm text-white/30 mt-1">
                This username hasn't been registered yet
              </p>
            </div>
            <Link
              href="/dashboard?tab=marketplace"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
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

      {/* ── Ambient tier glow ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${tierCfg.hex}10 0%, transparent 70%)`,
        }}
      />

      {/* ── Cover strip ── */}
      <div className="relative h-52 sm:h-64 overflow-hidden">
        {owner?.coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={owner.coverPhoto}
            alt="cover"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${tierCfg.hex}18 0%, transparent 60%)`,
            }}
          />
        )}
        {/* grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07070c]/50 to-[#07070c]" />

        {/* Back nav */}
        <div className="relative z-10 px-5 pt-5">
          <Link
            href="/dashboard?tab=marketplace"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Marketplace
          </Link>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 -mt-16 relative z-10">
        <div className="grid lg:grid-cols-[340px_1fr] gap-5">
          {/* ── LEFT: Profile card ──────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Profile glass card */}
            <div className="rounded-3xl border border-white/[0.07] bg-[#0d0d14]/80 backdrop-blur-xl overflow-hidden">
              {/* Mini cover inside card */}
              <div
                className="h-20 relative"
                style={{
                  background: `linear-gradient(135deg, ${tierCfg.hex}22 0%, transparent 80%)`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, white 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />
              </div>

              <div className="px-7 pb-7">
                {/* Avatar — overlapping the mini cover */}
                <div className="flex justify-between items-end -mt-11 mb-5">
                  <div className="relative">
                    <div
                      className="w-[72px] h-[72px] rounded-2xl border-[3px] border-[#0d0d14] overflow-hidden bg-[#0d0d14]"
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
                          size={72}
                          themeColor={tierCfg.hex}
                        />
                      )}
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 bg-teal-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none">
                      LV{owner?.level ?? 1}
                    </div>
                  </div>

                  {/* Tier pill */}
                  <span
                    className={`text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-1.5 rounded-full border ${tierCfg.pill}`}
                  >
                    {tierIcon} {tierCfg.label}
                  </span>
                </div>

                {/* Name */}
                <h2 className="text-xl font-black text-white leading-tight tracking-tight">
                  {ownerDisplayName || `@${raw}`}
                </h2>
                {owner?.activeUsername && (
                  <p className="text-xs font-bold text-teal-400/80 mt-0.5">
                    @{owner.activeUsername.replace(/^@/, "")}
                  </p>
                )}
                {owner?.bio && (
                  <p className="text-sm text-white/35 mt-3 leading-relaxed">
                    {owner.bio}
                  </p>
                )}

                {/* Wallet */}
                {(owner?.wallet || listing.ownerWallet) && (
                  <button
                    onClick={() =>
                      handleCopy(owner?.wallet ?? listing.ownerWallet ?? "")
                    }
                    className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all w-full group"
                  >
                    <Wallet className="w-3 h-3 text-white/25 shrink-0" />
                    <span className="font-mono text-[11px] text-white/35 tracking-wider flex-1 text-left">
                      {walletDisplay(
                        owner?.wallet ?? listing.ownerWallet ?? "",
                      )}
                    </span>
                    {copied ? (
                      <Check className="w-3 h-3 text-teal-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors" />
                    )}
                  </button>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-5">
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
                    value={`${owner?.earnings ?? 0}`}
                    label="SOL"
                    color="text-teal-400"
                  />
                </div>

                {/* Joined */}
                {owner?.joinedAt && (
                  <div className="mt-5 pt-5 border-t border-white/[0.05] flex items-center gap-2 text-[11px] text-white/20 font-bold">
                    <Calendar className="w-3 h-3" />
                    Joined{" "}
                    {new Date(owner.joinedAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Also owns */}
            {owner &&
              owner.usernames.filter((u) => u.name !== raw).length > 0 && (
                <div className="rounded-3xl border border-white/[0.07] bg-[#0d0d14]/80 backdrop-blur-xl p-5">
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">
                    Also Owns
                  </p>
                  <div className="space-y-1">
                    {owner.usernames
                      .filter((u) => u.name !== raw)
                      .slice(0, 5)
                      .map((u) => {
                        const utc = TIER_CONFIG[u.tier] ?? TIER_CONFIG.Bronze;
                        return (
                          <Link
                            key={u.name}
                            href={`/username/${u.name}`}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-all group"
                          >
                            <span className="text-sm font-bold text-white/50 group-hover:text-white transition-colors">
                              @{u.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[8px] font-black uppercase tracking-wider ${utc.cls}`}
                              >
                                {u.tier}
                              </span>
                              <ChevronRight className="w-3 h-3 text-white/15 group-hover:text-white/40 transition-colors" />
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              )}
          </div>

          {/* ── RIGHT ───────────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* ── Hero banner ── */}
            <div
              className="rounded-3xl border border-white/[0.07] bg-[#0d0d14]/80 backdrop-blur-xl overflow-hidden relative"
              style={{ boxShadow: tierCfg.glow }}
            >
              {/* accent stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${tierCfg.hex}80, transparent)`,
                }}
              />

              <div className="p-8 sm:p-10">
                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span
                    className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${tierCfg.pill}`}
                  >
                    {tierIcon} {tierCfg.label}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] text-white/30">
                    {raw.length} chars
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] text-white/30">
                    Level {usernameLevel}
                  </span>
                  {staked && (
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 flex items-center gap-1.5">
                      <Zap className="w-2.5 h-2.5" />
                      Staked
                    </span>
                  )}
                  {claimedAt && (
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] text-white/30">
                      Claimed{" "}
                      {new Date(claimedAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {/* Username */}
                <h1
                  className="text-6xl sm:text-8xl font-black tracking-tight leading-none"
                  style={{ color: tierCfg.hex }}
                >
                  @{raw}
                </h1>

                {/* Decorative flair */}
                <div className="absolute bottom-6 right-8 opacity-[0.04] pointer-events-none select-none">
                  <Crown size={140} style={{ color: tierCfg.hex }} />
                </div>
              </div>
            </div>

            {/* ── Listing / Buy card ── */}
            {listing.isListed ? (
              <div className="rounded-3xl border border-white/[0.07] bg-[#0d0d14]/80 backdrop-blur-xl overflow-hidden relative">
                {/* live indicator stripe */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />

                <div className="p-8">
                  {/* header row */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-50" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400">
                        Listed for Sale
                      </span>
                    </div>
                    {listing.listedAt && (
                      <span className="text-[10px] font-bold text-white/20">
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
                  <div className="mb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">
                      Listed Price
                    </p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-7xl font-black text-white tracking-tight tabular-nums">
                        {listing.price}
                      </span>
                      <span className="text-xl font-black text-white/20 uppercase">
                        SOL
                      </span>
                    </div>
                  </div>

                  {/* ── buy step: detail ── */}
                  {buyStep === "detail" && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      {!phantomConnected ? (
                        <button
                          onClick={handleConnectWallet}
                          className="flex-1 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-black text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                        >
                          <Wallet size={16} />
                          Connect Wallet to Buy
                        </button>
                      ) : (
                        <button
                          onClick={() => setBuyStep("confirm")}
                          className="flex-1 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-black text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                        >
                          <ShoppingCart size={16} />
                          Buy Now
                        </button>
                      )}
                      <button className="px-6 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-white/50 hover:text-white text-sm font-black transition-all">
                        Make Offer
                      </button>
                    </div>
                  )}

                  {/* ── buy step: confirm ── */}
                  {buyStep === "confirm" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
                      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden">
                        <div className="flex justify-between items-center px-5 py-4">
                          <span className="text-sm text-white/40 font-bold">
                            Listing Price
                          </span>
                          <span className="text-sm font-black text-white">
                            {listing.price} SOL
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-5 py-4">
                          <span className="text-sm text-white/40 font-bold">
                            Network Fee (2.5%)
                          </span>
                          <span className="text-sm font-black text-white/50">
                            {fee.toFixed(4)} SOL
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-5 py-4 bg-teal-500/[0.04]">
                          <span className="text-sm font-black text-white">
                            Total Due
                          </span>
                          <span className="text-2xl font-black text-teal-400 tabular-nums">
                            {total.toFixed(4)} SOL
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setBuyStep("detail")}
                          className="flex-1 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white text-sm font-black transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleBuy}
                          disabled={buyLoading}
                          className="flex-[2] py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black text-sm font-black transition-all flex items-center justify-center gap-2"
                        >
                          {buyLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                          Confirm Purchase
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── buy step: success ── */}
                  {buyStep === "success" && (
                    <div className="text-center py-4 space-y-5 animate-in fade-in zoom-in-95 duration-300">
                      <div
                        className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto"
                        style={{ boxShadow: "0 0 40px rgba(20,184,166,0.15)" }}
                      >
                        <Check size={28} className="text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">
                          Purchase Successful
                        </h3>
                        <p className="text-sm text-white/35 mt-1">
                          @{raw} is now yours
                        </p>
                      </div>
                      <button
                        onClick={() => router.push("/dashboard?tab=names")}
                        className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-black text-sm font-black transition-all"
                      >
                        View My Names
                      </button>
                    </div>
                  )}

                  {/* ── buy step: error ── */}
                  {buyStep === "error" && (
                    <div className="text-center py-4 space-y-5 animate-in fade-in zoom-in-95 duration-300">
                      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                        <AlertCircle size={28} className="text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">
                          Purchase Failed
                        </h3>
                        <p className="text-sm text-white/35 mt-1">{buyError}</p>
                      </div>
                      <button
                        onClick={() => setBuyStep("detail")}
                        className="w-full py-4 rounded-2xl border border-white/[0.08] text-white text-sm font-black transition-all hover:bg-white/[0.04]"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Not listed */
              <div className="rounded-3xl border border-white/[0.07] bg-[#0d0d14]/80 backdrop-blur-xl p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <Shield size={20} className="text-white/15" />
                </div>
                <p className="text-base font-black text-white/40">
                  Not Listed for Sale
                </p>
                <p className="text-sm text-white/20 mt-1">
                  This username is held by its owner
                </p>
              </div>
            )}

            {/* ── Username metadata strip ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                  color: "text-white/50",
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
                  color: staked ? "text-teal-400" : "text-white/30",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-2"
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                  <p className="text-base font-black text-white">{value}</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/20">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
