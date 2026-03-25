/**
 * VYNS UsernameDetailPage - Compact & Balanced Premium UI
 * Next.js App Router Component
 *
 * Design Philosophy:
 * - Tight, proportional spacing throughout
 * - Balanced visual hierarchy with refined typography
 * - Compact profile sidebar and listing details
 * - No oversized elements - everything fits perfectly
 * - Premium glassmorphism with subtle effects
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
  Users,
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
  { cls: string; bg: string; label: string; hex: string }
> = {
  Diamond: {
    cls: "text-cyan-400",
    bg: "from-cyan-500/10 to-cyan-900/5",
    label: "💎 Diamond",
    hex: "#22d3ee",
  },
  Platinum: {
    cls: "text-purple-300",
    bg: "from-purple-500/10 to-purple-900/5",
    label: "⬡ Platinum",
    hex: "#a78bfa",
  },
  Gold: {
    cls: "text-amber-400",
    bg: "from-amber-500/10 to-amber-900/5",
    label: "✦ Gold",
    hex: "#fbbf24",
  },
  Silver: {
    cls: "text-slate-300",
    bg: "from-slate-500/10 to-slate-900/5",
    label: "◈ Silver",
    hex: "#94a3b8",
  },
  Bronze: {
    cls: "text-orange-400",
    bg: "from-orange-500/10 to-orange-900/5",
    label: "◉ Bronze",
    hex: "#f97316",
  },
};

// ── Pixel Avatar Component ────────────────────────────────────────────────────

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
    if (solana?.isPhantom && solana.isConnected) {
      setPhantomConnected(true);
    }
  }, []);

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
      } catch {}
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
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
            <p className="text-xs text-white/30">Loading @{raw}…</p>
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
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle size={24} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white mb-1">
                Username Not Found
              </h2>
              <p className="text-xs text-white/40">@{raw} does not exist.</p>
            </div>
            <button
              onClick={() => router.push("/marketplace")}
              className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold text-sm transition-all"
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/50 hover:text-teal-400 transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          <span className="font-semibold">Marketplace</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Profile Card (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {owner && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 ring-2 ring-offset-2 ring-offset-[#0a0a0f] ring-teal-500/20 rounded-full p-0.5">
                    {owner.avatar ? (
                      <img
                        src={owner.avatar}
                        alt={owner.displayName || "User"}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <PixelAvatar
                        seed={owner._id || "default"}
                        size={64}
                        themeColor={tierCfg.hex}
                      />
                    )}
                  </div>
                  <h3 className="text-base font-black text-white">
                    {owner.displayName || owner.name || "Anonymous"}
                  </h3>
                  {owner.socials?.x && (
                    <a
                      href={`https://x.com/${owner.socials.x}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      @{owner.socials.x}
                    </a>
                  )}
                  {owner.bio && (
                    <p className="text-xs text-white/40 mt-2 line-clamp-2">
                      {owner.bio}
                    </p>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex flex-col items-center hover:bg-white/[0.05] transition-all">
                    <Users className="w-3.5 h-3.5 text-teal-400 mb-1" />
                    <span className="text-sm font-black text-white">
                      {owner.usernames?.length ?? 0}
                    </span>
                    <span className="text-[7px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                      Names
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex flex-col items-center hover:bg-white/[0.05] transition-all">
                    <Zap className="w-3.5 h-3.5 text-violet-400 mb-1" />
                    <span className="text-sm font-black text-white">
                      {owner.stakedAmount ?? 0}
                    </span>
                    <span className="text-[7px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                      Staked
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex flex-col items-center hover:bg-white/[0.05] transition-all">
                    <TrendingUp className="w-3.5 h-3.5 text-teal-400 mb-1" />
                    <span className="text-sm font-black text-white">
                      {owner.earnings ?? 0}
                    </span>
                    <span className="text-[7px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                      SOL
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Other Names Card */}
            {owner && owner.usernames.length > 1 && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-4">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.15em] mb-3">
                  Also Owns
                </p>
                <div className="space-y-2">
                  {owner.usernames
                    .filter((u) => u.name !== raw)
                    .slice(0, 3)
                    .map((u) => {
                      const cfg = TIER_CONFIG[u.tier] || TIER_CONFIG.Silver;
                      return (
                        <Link
                          key={u.name}
                          href={`/username/${u.name}`}
                          className="flex items-center justify-between group p-2 rounded-lg hover:bg-white/[0.03] transition-all"
                        >
                          <span className="text-xs font-bold text-white/60 group-hover:text-teal-400 transition-colors">
                            @{u.name}
                          </span>
                          <div
                            className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${cfg.cls}`}
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

          {/* RIGHT: Listing Details (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Username Hero Card */}
            <div
              className={`rounded-2xl border border-white/[0.1] bg-gradient-to-br ${tierCfg.bg} p-6 shadow-xl relative overflow-hidden group hover:border-white/[0.15] transition-all duration-300`}
            >
              <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
                <Crown size={80} />
              </div>

              <div className="relative z-10">
                <div
                  className={`inline-flex px-2.5 py-1 rounded-full border border-white/20 text-[9px] font-black uppercase tracking-[0.1em] ${tierCfg.cls}`}
                >
                  {tierCfg.label}
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-white mt-3 tracking-tighter">
                  @{raw}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-white/50">
                    <Activity size={12} className="text-teal-400" />
                    <span className="font-semibold">{raw.length} Chars</span>
                  </div>
                  <div className="w-0.5 h-0.5 rounded-full bg-white/10" />
                  <div className="flex items-center gap-1.5 text-white/50">
                    <Shield size={12} className="text-violet-400" />
                    <span className="font-semibold">Lvl {usernameLevel}</span>
                  </div>
                  {staked && (
                    <>
                      <div className="w-0.5 h-0.5 rounded-full bg-white/10" />
                      <div className="flex items-center gap-1.5 text-teal-400 font-semibold">
                        <Zap size={12} />
                        Staked
                      </div>
                    </>
                  )}
                </div>

                {/* Copy Button */}
                <button
                  onClick={handleCopyUsername}
                  className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white/60 hover:text-teal-400 transition-all text-xs font-semibold"
                >
                  {copied ? (
                    <>
                      <Check size={12} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Marketplace Section */}
            {listing.isListed ? (
              <div
                className={`rounded-2xl border border-white/[0.1] bg-gradient-to-br ${tierCfg.bg} p-6 shadow-xl hover:border-white/[0.15] transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-[9px] font-black text-teal-400 uppercase tracking-[0.1em]">
                      Listed for Sale
                    </span>
                  </div>
                  {listing.listedAt && (
                    <span className="text-[10px] font-semibold text-white/20">
                      {new Date(listing.listedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="mb-5">
                  <span className="text-5xl font-black text-white tracking-tight">
                    {listing.price}
                  </span>
                  <span className="text-lg font-black text-white/30 uppercase ml-2">
                    SOL
                  </span>
                </div>

                {/* Purchase States */}
                {buyStep === "detail" && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    {!phantomConnected ? (
                      <button
                        onClick={handleConnectWallet}
                        className="flex-1 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black font-black transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40"
                      >
                        <Wallet size={16} />
                        Connect Wallet
                      </button>
                    ) : (
                      <button
                        onClick={() => setBuyStep("confirm")}
                        className="flex-1 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black font-black transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40"
                      >
                        <ShoppingCart size={16} />
                        Purchase
                      </button>
                    )}
                    <button className="px-4 py-3 rounded-lg border border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.05] text-white/60 hover:text-white font-bold transition-all text-sm">
                      Offer
                    </button>
                  </div>
                )}

                {buyStep === "confirm" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-white/40">Price</span>
                        <span className="text-white">{listing.price} SOL</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-white/40">Fee (2.5%)</span>
                        <span className="text-white/60">
                          {((listing.price ?? 0) * 0.025).toFixed(4)} SOL
                        </span>
                      </div>
                      <div className="pt-3 border-t border-white/[0.05] flex justify-between items-center">
                        <span className="text-sm font-black text-white">
                          Total
                        </span>
                        <span className="text-2xl font-black text-teal-400">
                          {((listing.price ?? 0) * 1.025).toFixed(4)} SOL
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setBuyStep("detail")}
                        className="flex-1 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.02] text-white/40 font-bold hover:text-white transition-all text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBuy}
                        disabled={buyLoading}
                        className="flex-[2] py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black font-black transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                      >
                        {buyLoading ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Check size={16} />
                        )}
                        Confirm
                      </button>
                    </div>
                  </div>
                )}

                {buyStep === "success" && (
                  <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in duration-500">
                    <div className="w-14 h-14 rounded-full bg-teal-500/10 border-2 border-teal-500/30 flex items-center justify-center mx-auto">
                      <Check size={28} className="text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">
                        Success!
                      </h3>
                      <p className="text-xs text-white/40 mt-1">
                        @{raw} is now yours.
                      </p>
                    </div>
                    <button
                      onClick={() => router.push("/dashboard?tab=names")}
                      className="w-full py-2.5 rounded-lg bg-teal-500 text-black font-black text-sm"
                    >
                      View My Names
                    </button>
                  </div>
                )}

                {buyStep === "error" && (
                  <div className="text-center py-4 space-y-4 animate-in fade-in duration-300">
                    <div className="w-14 h-14 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto">
                      <AlertCircle size={28} className="text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Failed</h3>
                      <p className="text-xs text-white/40 mt-1">{buyError}</p>
                    </div>
                    <button
                      onClick={() => setBuyStep("detail")}
                      className="w-full py-2.5 rounded-lg border border-white/[0.1] text-white font-black text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6 text-center">
                <Shield size={32} className="text-white/10 mx-auto mb-2" />
                <p className="text-sm font-black text-white/40">Not Listed</p>
                <p className="text-xs text-white/20 mt-1">Held by owner</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
