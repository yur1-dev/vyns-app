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
  ExternalLink,
  Users,
  Calendar,
  TrendingUp,
  ShoppingCart,
  AlertCircle,
  Wallet,
  Activity,
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
  { cls: string; bg: string; label: string; glow: string; hex: string }
> = {
  Diamond: {
    cls: "text-cyan-400 border-cyan-500/40",
    bg: "from-cyan-500/20 to-cyan-900/10",
    label: "💎 Diamond",
    glow: "shadow-cyan-500/20",
    hex: "#22d3ee",
  },
  Platinum: {
    cls: "text-purple-300 border-purple-500/40",
    bg: "from-purple-500/20 to-purple-900/10",
    label: "⬡ Platinum",
    glow: "shadow-purple-500/20",
    hex: "#a78bfa",
  },
  Gold: {
    cls: "text-amber-400 border-amber-500/40",
    bg: "from-amber-500/20 to-amber-900/10",
    label: "✦ Gold",
    glow: "shadow-amber-500/20",
    hex: "#fbbf24",
  },
  Silver: {
    cls: "text-slate-300 border-slate-500/40",
    bg: "from-slate-500/20 to-slate-900/10",
    label: "◈ Silver",
    glow: "shadow-slate-500/20",
    hex: "#94a3b8",
  },
  Bronze: {
    cls: "text-orange-400 border-orange-500/40",
    bg: "from-orange-500/20 to-orange-900/10",
    label: "◉ Bronze",
    glow: "shadow-orange-500/20",
    hex: "#f97316",
  },
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

  // Check Phantom wallet on mount
  useEffect(() => {
    const solana = (window as any).phantom?.solana ?? (window as any).solana;
    if (solana?.isPhantom && solana.isConnected) {
      setPhantomConnected(true);
    }
  }, []);

  // Fetch current user (me) for DashboardHeader
  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/user/me", { credentials: "include" });
      const json = await res.json();
      if (json.success && json.user) {
        setUser(json.user);
      }
    } catch (err) {
      console.error("Failed to fetch user session", err);
    }
  }, []);

  // Fetch username data
  useEffect(() => {
    if (!raw) return;
    setLoading(true);
    setNotFound(false);

    Promise.all([
      fetch(`/api/username/${raw}`).then((r) => r.json()),
      fetchMe(),
    ])
      .then(([json]) => {
        if (!json.success) {
          setNotFound(true);
        } else {
          setData(json);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [raw, fetchMe]);

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
      // Link wallet to backend
      try {
        await fetch("/api/user/link-wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ wallet: pk }),
        });
        fetchMe(); // Refresh user data after linking
      } catch {
        // Non-fatal
      }
    } catch (err) {
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
      if (result.success) {
        setBuyStep("success");
      } else {
        setBuyError(result.error ?? "Purchase failed");
        setBuyStep("error");
      }
    } catch {
      setBuyError("Network error");
      setBuyStep("error");
    }
    setBuyLoading(false);
  };

  // ── Header Props Helper ────────────────────────────────────────────────────
  const headerProps = {
    session: user,
    wallet: user?.wallet || null,
    provider: user?.provider || "email",
    displayName: user?.displayName || user?.name || user?.email || "User",
    activeUsername: user?.activeUsername,
    customization: user?.customization,
    notifications: notifications,
    sidebarOpen: sidebarOpen,
    onToggleSidebar: () => setSidebarOpen(!sidebarOpen),
    onMarkNotifsRead: () =>
      setNotifications((n) => n.map((x) => ({ ...x, read: true }))),
    onOpenSettings: () => router.push("/dashboard?tab=settings"),
    onLogout: handleLogout,
    onWalletLinked: (addr: string) => fetchMe(),
    onOpenProfile: () => router.push("/dashboard?tab=profile"),
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        {user && <DashboardHeader {...headerProps} />}
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            <p className="text-sm text-white/30">Loading @{raw}…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <DashboardHeader {...headerProps} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-white/20 mx-auto" />
            <p className="text-xl font-bold text-white/60">@{raw} not found</p>
            <p className="text-sm text-white/30">
              This username hasn't been registered yet.
            </p>
            <Link
              href="/dashboard?tab=marketplace"
              className="inline-flex items-center gap-2 mt-4 text-teal-400 hover:text-teal-300 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Marketplace
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

  const ownerDisplayName =
    owner?.displayName ??
    owner?.name ??
    owner?.activeUsername?.replace(/^@/, "") ??
    null;

  const walletDisplay = (w: string) =>
    w.length > 12 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      <DashboardHeader {...headerProps} />

      {/* Hero Section with Cover Photo */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />

        <Link
          href="/dashboard?tab=marketplace"
          className="absolute top-5 left-5 inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors z-20"
        >
          <ArrowLeft className="w-4 h-4" />
          Marketplace
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 -mt-24 relative z-10">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* LEFT: Profile Card (Matches app/profile/page.tsx glass styling) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-8 flex flex-col items-center text-center shadow-2xl">
              {/* Avatar Section (XP rings removed) */}
              <div className="relative mb-6">
                <div className="relative w-28 h-28 rounded-full border-4 border-white/[0.05] overflow-hidden bg-[#0a0a0f]">
                  {owner?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={owner.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PixelAvatar
                      seed={owner?.activeUsername || raw}
                      size={112}
                      themeColor={tierCfg.hex}
                    />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-teal-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#0a0a0f]">
                  LVL {owner?.level ?? 1}
                </div>
              </div>

              {/* Name & Bio */}
              <h2 className="text-2xl font-black text-white leading-tight">
                {ownerDisplayName || `@${raw}`}
              </h2>
              {owner?.activeUsername && (
                <p className="text-teal-400 font-bold text-sm mt-1">
                  @{owner.activeUsername.replace(/^@/, "")}
                </p>
              )}
              {owner?.bio && (
                <p className="text-sm text-white/40 mt-4 leading-relaxed px-4">
                  {owner.bio}
                </p>
              )}

              {/* Wallet Info */}
              {(owner?.wallet || listing.ownerWallet) && (
                <div className="mt-6 w-full pt-6 border-t border-white/[0.05] flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                    <Wallet className="w-3 h-3 text-white/30" />
                    <span className="font-mono text-[10px] text-white/40 tracking-wider">
                      {walletDisplay(
                        owner?.wallet ?? listing.ownerWallet ?? "",
                      )}
                    </span>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          owner?.wallet ?? listing.ownerWallet ?? "",
                        )
                      }
                      className="text-white/20 hover:text-teal-400 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Profile Stats (Referrals, Staked, Earnings) */}
              <div className="grid grid-cols-3 gap-2 w-full mt-8">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center">
                  <Users className="w-4 h-4 text-sky-400 mb-1" />
                  <span className="text-xs font-black text-white">
                    {owner?.referrals ?? 0}
                  </span>
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                    Refs
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center">
                  <Zap className="w-4 h-4 text-violet-400 mb-1" />
                  <span className="text-xs font-black text-white">
                    {owner?.stakedAmount ?? 0}
                  </span>
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                    Staked
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center">
                  <TrendingUp className="w-4 h-4 text-teal-400 mb-1" />
                  <span className="text-xs font-black text-white">
                    {owner?.earnings ?? 0}
                  </span>
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                    SOL
                  </span>
                </div>
              </div>
            </div>

            {/* Other Names Card */}
            {owner && owner.usernames.length > 1 && (
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">
                  Also Owns
                </p>
                <div className="space-y-3">
                  {owner.usernames
                    .filter((u) => u.name !== raw)
                    .slice(0, 4)
                    .map((u) => (
                      <Link
                        key={u.name}
                        href={`/username/${u.name}`}
                        className="flex items-center justify-between group p-2 rounded-xl hover:bg-white/[0.03] transition-all"
                      >
                        <span className="text-sm font-bold text-white/60 group-hover:text-teal-400 transition-colors">
                          @{u.name}
                        </span>
                        <div
                          className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase ${TIER_CONFIG[u.tier]?.cls || ""}`}
                        >
                          {u.tier}
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Listing Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* Username Hero */}
            <div
              className={`rounded-[32px] border border-white/[0.1] bg-gradient-to-br ${tierCfg.bg} p-10 shadow-2xl relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Crown size={120} />
              </div>

              <div className="relative z-10">
                <div
                  className={`inline-flex px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.15em] ${tierCfg.cls}`}
                >
                  {tierCfg.label}
                </div>
                <h1 className="text-6xl sm:text-7xl font-black text-white mt-6 tracking-tighter">
                  @{raw}
                </h1>
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-white/40">
                    <Activity size={14} className="text-teal-400" />
                    {raw.length} Characters
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <div className="flex items-center gap-1.5 text-sm font-bold text-white/40">
                    <Shield size={14} className="text-violet-400" />
                    Level {usernameLevel}
                  </div>
                  {staked && (
                    <>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <div className="flex items-center gap-1.5 text-sm font-bold text-teal-400">
                        <Zap size={14} />
                        Currently Staked
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Marketplace Section */}
            {listing.isListed ? (
              <div className="rounded-[32px] border border-teal-500/20 bg-teal-500/[0.03] p-8 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">
                      Listed for Sale
                    </span>
                  </div>
                  {listing.listedAt && (
                    <span className="text-xs font-bold text-white/20">
                      Since {new Date(listing.listedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-3 mb-10">
                  <span className="text-7xl font-black text-white tracking-tight">
                    {listing.price}
                  </span>
                  <span className="text-2xl font-black text-white/20 uppercase">
                    Sol
                  </span>
                </div>

                {/* Purchase States */}
                {buyStep === "detail" && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    {!phantomConnected ? (
                      <button
                        onClick={handleConnectWallet}
                        className="flex-1 py-5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-black font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                      >
                        <Wallet size={20} />
                        Connect Wallet to Buy
                      </button>
                    ) : (
                      <button
                        onClick={() => setBuyStep("confirm")}
                        className="flex-1 py-5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-black font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                      >
                        <ShoppingCart size={20} />
                        Purchase Username
                      </button>
                    )}
                    <button className="px-8 py-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-white/60 font-black transition-all">
                      Make Offer
                    </button>
                  </div>
                )}

                {buyStep === "confirm" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-4">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-white/30">Listing Price</span>
                        <span className="text-white">{listing.price} SOL</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-white/30">
                          Network Fee (2.5%)
                        </span>
                        <span className="text-white/60">
                          {((listing.price ?? 0) * 0.025).toFixed(4)} SOL
                        </span>
                      </div>
                      <div className="pt-4 border-t border-white/[0.05] flex justify-between items-center">
                        <span className="text-lg font-black text-white">
                          Total
                        </span>
                        <span className="text-3xl font-black text-teal-400 tracking-tight">
                          {((listing.price ?? 0) * 1.025).toFixed(4)} SOL
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setBuyStep("detail")}
                        className="flex-1 py-4 rounded-2xl border border-white/[0.1] bg-white/[0.02] text-white/40 font-black hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBuy}
                        disabled={buyLoading}
                        className="flex-[2] py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-black font-black transition-all flex items-center justify-center gap-2"
                      >
                        {buyLoading ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Check size={20} />
                        )}
                        Confirm Purchase
                      </button>
                    </div>
                  </div>
                )}

                {buyStep === "success" && (
                  <div className="text-center py-6 space-y-6">
                    <div className="w-20 h-20 rounded-full bg-teal-500/10 border-2 border-teal-500/30 flex items-center justify-center mx-auto">
                      <Check size={40} className="text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">
                        Purchase Successful!
                      </h3>
                      <p className="text-white/40 mt-2">@{raw} is now yours.</p>
                    </div>
                    <button
                      onClick={() => router.push("/dashboard?tab=names")}
                      className="w-full py-4 rounded-2xl bg-teal-500 text-black font-black"
                    >
                      View My Names
                    </button>
                  </div>
                )}

                {buyStep === "error" && (
                  <div className="text-center py-6 space-y-6">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto">
                      <AlertCircle size={40} className="text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">
                        Purchase Failed
                      </h3>
                      <p className="text-white/40 mt-2">{buyError}</p>
                    </div>
                    <button
                      onClick={() => setBuyStep("detail")}
                      className="w-full py-4 rounded-2xl border border-white/[0.1] text-white font-black"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[32px] border border-white/[0.06] bg-white/[0.02] p-12 text-center">
                <Shield size={48} className="text-white/10 mx-auto mb-4" />
                <p className="text-xl font-black text-white/40">
                  Not Listed for Sale
                </p>
                <p className="text-sm text-white/20 mt-2">
                  This username is currently held by its owner.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
