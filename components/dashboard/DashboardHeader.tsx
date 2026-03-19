"use client";
// components/dashboard/DashboardHeader.tsx

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  LogOut,
  Wallet,
  X,
  Menu,
  Settings,
  ExternalLink,
  Zap,
  Crown,
  Gift,
  Clock,
  AlertCircle,
  ChevronRight,
  Bell as BellIcon,
  LayoutDashboard,
  Link as LinkIcon,
  WifiOff,
  User,
} from "lucide-react";

import { type ProfileCustomization } from "@/components/dashboard/modals/ProfileCustomizeModal";

async function fetchSolBalance(pk: string): Promise<number> {
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
        params: [pk],
      }),
    });
    const data = await res.json();
    return data.result?.value ? data.result.value / 1e9 : 0;
  } catch {
    return 0;
  }
}

function PixelAvatar({
  seed,
  size = 28,
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
    const GRID = 8;
    canvas.width = GRID;
    canvas.height = GRID;
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
    ctx.fillRect(0, 0, GRID, GRID);
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < Math.ceil(GRID / 2); x++) {
        if (rand(3) !== 0) {
          ctx.fillStyle =
            rand(4) === 0
              ? themeColor
              : `hsl(${x % 2 === 0 ? hue : hue2},65%,${40 + rand(35)}%)`;
          ctx.fillRect(x, y, 1, 1);
          ctx.fillRect(GRID - 1 - x, y, 1, 1);
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

export interface Notification {
  id: string;
  type: "staking" | "referral" | "claim" | "system" | "reward";
  title: string;
  body: string;
  time: string;
  read: boolean;
  link?: string;
}

interface Props {
  session: any;
  wallet: string | null;
  provider: string;
  displayName: string;
  activeUsername?: string | null;
  customization?: ProfileCustomization;
  notifications: Notification[];
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onMarkNotifsRead: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onWalletLinked?: (walletAddress: string) => void;
  onOpenProfile?: () => void;
}

const NOTIF_ICONS = {
  staking: { icon: Zap, cls: "text-violet-400 bg-violet-500/10" },
  referral: { icon: Gift, cls: "text-sky-400 bg-sky-500/10" },
  claim: { icon: Crown, cls: "text-teal-400 bg-teal-500/10" },
  reward: { icon: Zap, cls: "text-emerald-400 bg-emerald-500/10" },
  system: { icon: AlertCircle, cls: "text-white/30 bg-white/[0.05]" },
};

export default function DashboardHeader({
  session,
  wallet,
  provider,
  displayName,
  activeUsername,
  customization,
  notifications,
  sidebarOpen,
  onToggleSidebar,
  onMarkNotifsRead,
  onOpenSettings,
  onLogout,
  onWalletLinked,
  onOpenProfile,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [balLoading, setBalLoading] = useState(false);
  const [linkingWallet, setLinkingWallet] = useState(false);
  const [unlinkingWallet, setUnlinkingWallet] = useState(false);
  const [linkError, setLinkError] = useState("");

  const notifRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const notifList = Array.isArray(notifications) ? notifications : [];
  const unread = notifList.filter((n) => !n.read).length;
  const themeColor = THEME_COLORS[customization?.theme ?? "teal"] ?? "#2dd4bf";
  const avatarSeed = customization?.avatarSeed || displayName || "vyns";
  const hasLinkedWallet = !!session && !!wallet;
  const isGoogleOrEmail = !!session;
  const displayUsername = activeUsername || displayName;
  const truncatedName =
    displayUsername.length > 16
      ? displayUsername.slice(0, 14) + "…"
      : displayUsername;

  const refreshBalance = useCallback(async () => {
    if (!wallet) return;
    setBalLoading(true);
    setBalance(await fetchSolBalance(wallet));
    setBalLoading(false);
  }, [wallet]);

  useEffect(() => {
    if (!wallet) {
      setBalance(0);
      return;
    }
    refreshBalance();
  }, [wallet, refreshBalance]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const copy = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectWallet = async () => {
    setLinkError("");
    setDropOpen(false);
    setLinkingWallet(true);
    try {
      const solana = (window as any).phantom?.solana ?? (window as any).solana;
      if (!solana) {
        setLinkError("Phantom not found. Please install it.");
        return;
      }
      const resp = await solana.connect();
      const pk = resp.publicKey.toString();
      const res = await fetch("/api/user/link-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ wallet: pk }),
      });
      const data = await res.json();
      if (data.success) onWalletLinked?.(pk);
      else setLinkError(data.error ?? "Failed to link wallet");
    } catch (err: any) {
      if (err.code !== 4001) setLinkError(err.message ?? "Connection failed");
    } finally {
      setLinkingWallet(false);
    }
  };

  const handleUnlinkWallet = async () => {
    setUnlinkingWallet(true);
    try {
      try {
        await (window as any).solana?.disconnect();
      } catch {}
      await fetch("/api/user/link-wallet", {
        method: "DELETE",
        credentials: "include",
      });
      onWalletLinked?.("");
    } catch (err) {
      console.error("[unlink-wallet]", err);
    } finally {
      setUnlinkingWallet(false);
    }
  };

  // ── Avatar render — checks uploaded avatarImage first ──────────────────────
  const renderAvatar = (size = 28) => {
    const avatarImage = (customization as any)?.avatarImage;
    if (avatarImage)
      return (
        <div
          className="rounded-full overflow-hidden shrink-0"
          style={{
            width: size,
            height: size,
            boxShadow: `0 0 8px ${themeColor}50`,
          }}
        >
          <img
            src={avatarImage}
            alt="avatar"
            style={{ width: size, height: size, objectFit: "cover" }}
          />
        </div>
      );
    if (session?.user?.image)
      return (
        <div
          className="rounded-full overflow-hidden shrink-0"
          style={{ width: size, height: size }}
        >
          <Image
            src={session.user.image}
            alt="avatar"
            width={size}
            height={size}
            className="rounded-full object-cover"
          />
        </div>
      );
    return (
      <div
        style={{ boxShadow: `0 0 8px ${themeColor}50` }}
        className="rounded-full overflow-hidden shrink-0"
      >
        <PixelAvatar seed={avatarSeed} size={size} themeColor={themeColor} />
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#060b14]/80 backdrop-blur-xl">
      <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <Link href="/dashboard">
            <Image
              src="/vyns-logo.png"
              alt="VYNS"
              width={90}
              height={26}
              className="object-contain opacity-90 hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {/* SOL balance */}
          {wallet && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-sm">
              <Wallet className="h-3.5 w-3.5 text-teal-400 shrink-0" />
              {balLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white/20" />
              ) : (
                <span className="text-white/60 tabular-nums">
                  {balance.toFixed(4)}
                </span>
              )}
              <span className="text-white/20 text-xs">SOL</span>
              <button
                onClick={refreshBalance}
                className="text-white/20 hover:text-teal-400 transition-colors cursor-pointer ml-0.5"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Connect wallet CTA */}
          {isGoogleOrEmail && !wallet && (
            <button
              onClick={handleConnectWallet}
              disabled={linkingWallet}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium hover:bg-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {linkingWallet ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LinkIcon className="h-3.5 w-3.5" />
              )}
              Connect Wallet
            </button>
          )}

          {/* Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen((v) => !v);
                if (!notifOpen && unread > 0) onMarkNotifsRead();
              }}
              className="relative p-2 text-white/30 hover:text-white/60 transition-colors cursor-pointer rounded-lg hover:bg-white/[0.04]"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-teal-400" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/[0.07] bg-[#0a0f1a]/98 backdrop-blur-2xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
                  <p className="text-sm font-semibold text-white">
                    Notifications
                  </p>
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-500/15 text-teal-400">
                        {unread} new
                      </span>
                    )}
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="p-1 text-white/20 hover:text-white/50 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifList.length === 0 ? (
                    <div className="py-10 text-center">
                      <BellIcon className="h-5 w-5 mx-auto mb-2 text-white/10" />
                      <p className="text-xs text-white/20">
                        No notifications yet
                      </p>
                    </div>
                  ) : (
                    notifList.map((n) => {
                      const { icon: Icon, cls } = NOTIF_ICONS[n.type];
                      return (
                        <div
                          key={n.id}
                          className={`flex gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors ${!n.read ? "bg-white/[0.015]" : ""}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cls}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-xs font-medium leading-tight ${n.read ? "text-white/50" : "text-white/80"}`}
                              >
                                {n.title}
                              </p>
                              <span className="text-[10px] text-white/20 shrink-0 flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {n.time}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/30 mt-0.5 leading-relaxed">
                              {n.body}
                            </p>
                          </div>
                          {!n.read && (
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-1" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                {notifList.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-white/[0.05]">
                    <button
                      onClick={() => {
                        onMarkNotifsRead();
                        setNotifOpen(false);
                      }}
                      className="text-xs text-white/25 hover:text-teal-400 transition-colors cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropOpen((v) => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="shrink-0">{renderAvatar(28)}</div>
              <span className="hidden md:block text-sm text-white/60 max-w-[160px] truncate whitespace-nowrap">
                {truncatedName}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-white/20 hidden sm:block shrink-0 transition-transform duration-150 ${dropOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/[0.07] bg-[#0a0f1a]/98 backdrop-blur-2xl shadow-2xl z-50 overflow-hidden">
                {/* Profile info */}
                <div className="p-3 border-b border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-full overflow-hidden shrink-0"
                      style={{
                        width: 44,
                        height: 44,
                        boxShadow: `0 0 12px ${themeColor}40`,
                      }}
                    >
                      {/* Priority: uploaded avatarImage > OAuth > pixel */}
                      {(customization as any)?.avatarImage ? (
                        <img
                          src={(customization as any).avatarImage}
                          alt="avatar"
                          style={{ width: 44, height: 44, objectFit: "cover" }}
                        />
                      ) : session?.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt="avatar"
                          width={44}
                          height={44}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <PixelAvatar
                          seed={avatarSeed}
                          size={44}
                          themeColor={themeColor}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white/80 truncate">
                        {displayUsername}
                      </p>
                      <p className="text-[11px] text-white/25 font-mono truncate mt-0.5">
                        {session?.user?.email
                          ? session.user.email
                          : wallet
                            ? `${wallet.slice(0, 8)}…${wallet.slice(-4)}`
                            : ""}
                      </p>
                    </div>
                  </div>

                  {/* Wallet */}
                  {wallet ? (
                    <div className="mt-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] overflow-hidden">
                      <div className="flex items-center justify-between px-2.5 py-2">
                        <div className="flex items-center gap-1.5">
                          <Wallet className="h-3.5 w-3.5 text-teal-400" />
                          <span className="text-sm font-semibold text-white tabular-nums">
                            {balance.toFixed(4)}
                          </span>
                          <span className="text-xs text-white/25">SOL</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={copy}
                            className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all cursor-pointer"
                          >
                            {copied ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          <a
                            href={`https://solscan.io/account/${wallet}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                      {isGoogleOrEmail && (
                        <button
                          onClick={handleUnlinkWallet}
                          disabled={unlinkingWallet}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 border-t border-white/[0.05] text-[11px] text-white/25 hover:text-orange-400 hover:bg-orange-500/[0.06] transition-all cursor-pointer disabled:opacity-40"
                        >
                          {unlinkingWallet ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <WifiOff className="h-3 w-3" />
                          )}
                          Disconnect wallet
                        </button>
                      )}
                    </div>
                  ) : isGoogleOrEmail ? (
                    <div className="mt-2.5">
                      <button
                        onClick={handleConnectWallet}
                        disabled={linkingWallet}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium hover:bg-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {linkingWallet ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <LinkIcon className="h-3.5 w-3.5" />
                        )}
                        Connect Wallet
                      </button>
                      {linkError && (
                        <p className="text-[11px] text-red-400/70 mt-1.5 text-center">
                          {linkError}
                        </p>
                      )}
                    </div>
                  ) : null}

                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-white/20">
                      Connected via {provider}
                      {hasLinkedWallet ? " + Wallet" : ""}
                    </span>
                  </div>
                </div>

                {/* Menu */}
                <div className="p-2 space-y-0.5">
                  <button
                    onClick={() => {
                      setDropOpen(false);
                      router.push("/dashboard");
                    }}
                    className="flex w-full items-center gap-2.5 px-2.5 py-2 text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      setDropOpen(false);
                      onOpenProfile?.();
                    }}
                    className="flex w-full items-center gap-2.5 px-2.5 py-2 text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setDropOpen(false);
                      onOpenSettings();
                    }}
                    className="flex w-full items-center gap-2.5 px-2.5 py-2 text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">Settings</span>
                    <ChevronRight className="h-3.5 w-3.5 text-white/15" />
                  </button>
                  <div className="h-px bg-white/[0.04] my-1" />
                  <button
                    onClick={() => {
                      setDropOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2.5 px-2.5 py-2 text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
