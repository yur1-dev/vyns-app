/**
 * VYNS UsernameDetailPage - Premium Username Marketplace
 * Next.js App Router Component with Hero Background & Sidebar Profile
 *
 * Design System:
 * - Dark theme with deep navy/black backgrounds (#0a0a0f)
 * - Full-width hero background image with overlay
 * - Left sidebar: Profile card with owner info and stats
 * - Right content: Username hero section with listing details
 * - Tier-based color coding: Diamond (cyan), Platinum (purple), Gold (amber), Silver (slate), Bronze (orange)
 * - Glassmorphism: backdrop blur + semi-transparent borders
 * - Premium spacing, typography, and smooth interactions
 */

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

// ── Tier Configuration ────────────────────────────────────────────────────────

const TIER_CONFIG: Record<
  string,
  {
    cls: string;
    bg: string;
    label: string;
    glow: string;
    hex: string;
    borderCls: string;
  }
> = {
  Diamond: {
    cls: "text-cyan-400 border-cyan-500/40",
    bg: "from-cyan-500/20 to-cyan-900/10",
    label: "💎 Diamond",
    glow: "shadow-cyan-500/20",
    hex: "#22d3ee",
    borderCls: "border-cyan-500/30",
  },
  Platinum: {
    cls: "text-purple-300 border-purple-500/40",
    bg: "from-purple-500/20 to-purple-900/10",
    label: "⬡ Platinum",
    glow: "shadow-purple-500/20",
    hex: "#a78bfa",
    borderCls: "border-purple-500/30",
  },
  Gold: {
    cls: "text-amber-400 border-amber-500/40",
    bg: "from-amber-500/20 to-amber-900/10",
    label: "✦ Gold",
    glow: "shadow-amber-500/20",
    hex: "#fbbf24",
    borderCls: "border-amber-500/30",
  },
  Silver: {
    cls: "text-slate-300 border-slate-500/40",
    bg: "from-slate-500/20 to-slate-900/10",
    label: "◈ Silver",
    glow: "shadow-slate-500/20",
    hex: "#94a3b8",
    borderCls: "border-slate-500/30",
  },
  Bronze: {
    cls: "text-orange-400 border-orange-500/40",
    bg: "from-orange-500/20 to-orange-900/10",
    label: "◉ Bronze",
    glow: "shadow-orange-500/20",
    hex: "#f97316",
    borderCls: "border-orange-500/30",
  },
};

// ── Pixel Avatar Component ────────────────────────────────────────────────────

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

// ── Main Page Component ──────────────────────────────────────────────────────

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
      try {
        await fetch("/api/user/link-wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ wallet: pk }),
        });
        fetchMe();
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

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(`@${raw}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // Extract data for easier access
  const owner = data?.owner;
  const listing = data?.listing || { isListed: false };
  const usernameLevel = data?.level || 0;
  const staked = data?.staked || false;
  const tierCfg = TIER_CONFIG[data?.tier || "Silver"] || TIER_CONFIG.Silver;

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        {user && <DashboardHeader {...headerProps} />}
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full opacity-20 blur-lg animate-pulse" />
              <Loader2 className="w-12 h-12 text-teal-400 animate-spin relative z-10" />
            </div>
            <p className="text-sm font-semibold text-white/40">
              Loading @{raw}…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Not Found State ────────────────────────────────────────────────────────
  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        {user && <DashboardHeader {...headerProps} />}
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-6 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">
                Username Not Found
              </h2>
              <p className="text-white/40 mb-6">
                @{raw} does not exist or has been removed.
              </p>
            </div>
            <button
              onClick={() => router.push("/marketplace")}
              className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-black transition-all"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Content ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {user && <DashboardHeader {...headerProps} />}

      {/* Hero Background Section */}
      <div className="relative h-96 bg-gradient-to-b from-slate-900 via-slate-800 to-[#0a0a0f] overflow-hidden">
        {/* Background Overlay */}
        {owner?.coverPhoto && (
          <img
            src={owner.coverPhoto}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#0a0a0f]" />

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/30 backdrop-blur-md border border-white/10 text-white/70 hover:text-white transition-all"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold">Back</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="relative -mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Profile Card */}
          <div className="lg:col-span-4">
            {owner && (
              <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-2xl p-8 space-y-8 shadow-2xl hover:border-white/[0.12] transition-all duration-300">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-6 ring-4 ring-offset-4 ring-offset-[#0a0a0f] ring-teal-500/30 rounded-full p-1">
                    {owner.avatar ? (
                      <img
                        src={owner.avatar}
                        alt={owner.displayName || "User"}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <PixelAvatar
                        seed={owner._id || "default"}
                        size={96}
                        themeColor={tierCfg.hex}
                      />
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-white">
                    {owner.displayName || owner.name || "Anonymous"}
                  </h3>
                  {owner.socials?.x && (
                    <a
                      href={`https://x.com/${owner.socials.x}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-400 hover:text-teal-300 transition-colors mt-1"
                    >
                      @{owner.socials.x}
                    </a>
                  )}
                  {owner.bio && (
                    <p className="text-sm text-white/50 mt-3 line-clamp-2">
                      {owner.bio}
                    </p>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center hover:bg-white/[0.05] transition-all">
                    <Users className="w-5 h-5 text-teal-400 mb-2" />
                    <span className="text-lg font-black text-white">
                      {owner.usernames?.length ?? 0}
                    </span>
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">
                      Names
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center hover:bg-white/[0.05] transition-all">
                    <Zap className="w-5 h-5 text-violet-400 mb-2" />
                    <span className="text-lg font-black text-white">
                      {owner.stakedAmount ?? 0}
                    </span>
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">
                      Staked
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center hover:bg-white/[0.05] transition-all">
                    <TrendingUp className="w-5 h-5 text-teal-400 mb-2" />
                    <span className="text-lg font-black text-white">
                      {owner.earnings ?? 0}
                    </span>
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">
                      SOL
                    </span>
                  </div>
                </div>

                {/* Social Links */}
                {owner.socials &&
                  (owner.socials.x || owner.socials.telegram) && (
                    <div className="flex gap-3 justify-center pt-4 border-t border-white/[0.05]">
                      {owner.socials.x && (
                        <a
                          href={`https://x.com/${owner.socials.x}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white/40 hover:text-teal-400 hover:border-teal-500/30 transition-all"
                        >
                          𝕏
                        </a>
                      )}
                      {owner.socials.telegram && (
                        <a
                          href={`https://t.me/${owner.socials.telegram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white/40 hover:text-teal-400 hover:border-teal-500/30 transition-all"
                        >
                          ✈
                        </a>
                      )}
                    </div>
                  )}
              </div>
            )}

            {/* Other Names Card */}
            {owner && owner.usernames.length > 1 && (
              <div className="mt-8 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-2xl p-6 hover:border-white/[0.12] transition-all duration-300">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
                  Also Owns
                </p>
                <div className="space-y-2">
                  {owner.usernames
                    .filter((u) => u.name !== raw)
                    .slice(0, 4)
                    .map((u) => {
                      const cfg = TIER_CONFIG[u.tier] || TIER_CONFIG.Silver;
                      return (
                        <Link
                          key={u.name}
                          href={`/username/${u.name}`}
                          className="flex items-center justify-between group p-3 rounded-xl hover:bg-white/[0.05] transition-all"
                        >
                          <span className="text-sm font-bold text-white/60 group-hover:text-teal-400 transition-colors">
                            @{u.name}
                          </span>
                          <div
                            className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase ${cfg.cls}`}
                          >
                            {u.tier}
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Listing Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* Username Hero Card */}
            <div
              className={`rounded-3xl border ${tierCfg.borderCls} bg-gradient-to-br ${tierCfg.bg} p-10 shadow-2xl relative overflow-hidden group hover:border-white/[0.15] transition-all duration-300`}
            >
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-8 right-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Crown size={120} />
              </div>

              <div className="relative z-10">
                <div
                  className={`inline-flex px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.15em] ${tierCfg.cls} bg-white/[0.02] backdrop-blur-sm`}
                >
                  {tierCfg.label}
                </div>
                <h1 className="text-6xl sm:text-7xl font-black text-white mt-6 tracking-tighter leading-tight">
                  @{raw}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-6 text-sm">
                  <div className="flex items-center gap-2 text-white/50">
                    <Activity size={16} className="text-teal-400" />
                    <span className="font-semibold">
                      {raw.length} Characters
                    </span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <div className="flex items-center gap-2 text-white/50">
                    <Shield size={16} className="text-violet-400" />
                    <span className="font-semibold">Level {usernameLevel}</span>
                  </div>
                  {staked && (
                    <>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <div className="flex items-center gap-2 text-teal-400 font-semibold">
                        <Zap size={16} />
                        Staked
                      </div>
                    </>
                  )}
                </div>

                {/* Copy Button */}
                <button
                  onClick={handleCopyUsername}
                  className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white/60 hover:text-teal-400 hover:border-teal-500/30 hover:bg-white/[0.08] transition-all text-sm font-semibold"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy Username
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Marketplace Section */}
            {listing.isListed ? (
              <div
                className={`rounded-3xl border ${tierCfg.borderCls} bg-gradient-to-br ${tierCfg.bg} p-10 shadow-2xl hover:border-white/[0.15] transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 animate-pulse shadow-lg shadow-teal-500/50" />
                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">
                      Listed for Sale
                    </span>
                  </div>
                  {listing.listedAt && (
                    <span className="text-xs font-semibold text-white/30">
                      Since {new Date(listing.listedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="mb-10">
                  <span className="text-7xl sm:text-8xl font-black text-white tracking-tighter">
                    {listing.price}
                  </span>
                  <span className="text-2xl font-black text-white/30 uppercase ml-3">
                    SOL
                  </span>
                </div>

                {/* Purchase States */}
                {buyStep === "detail" && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    {!phantomConnected ? (
                      <button
                        onClick={handleConnectWallet}
                        className="flex-1 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105 active:scale-95"
                      >
                        <Wallet size={20} />
                        Connect Wallet to Buy
                      </button>
                    ) : (
                      <button
                        onClick={() => setBuyStep("confirm")}
                        className="flex-1 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105 active:scale-95"
                      >
                        <ShoppingCart size={20} />
                        Purchase Username
                      </button>
                    )}
                    <button className="px-8 py-4 rounded-xl border border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.05] text-white/60 hover:text-white font-black transition-all hover:border-white/[0.2]">
                      Make Offer
                    </button>
                  </div>
                )}

                {buyStep === "confirm" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-4">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-white/40">Listing Price</span>
                        <span className="text-white">{listing.price} SOL</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-white/40">
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
                        className="flex-1 py-3 rounded-xl border border-white/[0.1] bg-white/[0.02] text-white/40 hover:text-white font-black hover:bg-white/[0.05] transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBuy}
                        disabled={buyLoading}
                        className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                      >
                        {buyLoading ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <Check size={20} />
                        )}
                        Confirm Purchase
                      </button>
                    </div>
                  </div>
                )}

                {buyStep === "success" && (
                  <div className="text-center py-8 space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border-2 border-teal-500/30 flex items-center justify-center mx-auto">
                      <Check size={40} className="text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">
                        🎉 Purchase Successful!
                      </h3>
                      <p className="text-white/40 mt-2">@{raw} is now yours.</p>
                    </div>
                    <button
                      onClick={() => router.push("/dashboard?tab=names")}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-black hover:from-teal-400 hover:to-cyan-400 transition-all hover:scale-105 active:scale-95"
                    >
                      View My Names
                    </button>
                  </div>
                )}

                {buyStep === "error" && (
                  <div className="text-center py-8 space-y-6 animate-in fade-in duration-300">
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
                      className="w-full py-4 rounded-xl border border-white/[0.1] bg-white/[0.02] text-white font-black hover:bg-white/[0.05] transition-all"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-12 text-center hover:border-white/[0.12] transition-all duration-300">
                <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <Shield size={32} className="text-white/20" />
                </div>
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
