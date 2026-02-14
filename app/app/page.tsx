"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Coins,
  Users,
  Zap,
  Settings,
  LogOut,
  ArrowUpRight,
  Award,
  Crown,
  Bell,
  ChevronDown,
  BarChart3,
  DollarSign,
  Loader2,
  Plus,
  AlertCircle,
  Menu,
  X,
  Wallet,
  Activity,
  Gift,
  Copy,
  Trash2,
  TrendingUp,
  Clock,
  Check,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

interface Username {
  id: string;
  name: string;
  level: number;
  yield: number;
  staked: boolean;
  value: number;
  tier: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: "received" | "sent" | "staking" | "referral";
  amount: number;
  token: string;
  date: string;
  timestamp: number;
}

interface UserData {
  walletAddress: string;
  usernames: Username[];
  earnings: { today: number; week: number; allTime: number };
  level: number;
  xp: number;
  nextLevelXp: number;
  referrals: number;
  referralEarnings: number;
  stakedAmount: number;
  stakingRewards: number;
  activity: ActivityItem[];
  isNewUser: boolean;
}

export default function VYNSDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(true);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">(
    "signin",
  );
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletProvider, setWalletProvider] = useState("");
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [showPassword, setShowPassword] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [userData, setUserData] = useState<UserData>({
    walletAddress: "",
    usernames: [],
    earnings: { today: 0, week: 0, allTime: 0 },
    level: 1,
    xp: 0,
    nextLevelXp: 1000,
    referrals: 0,
    referralEarnings: 0,
    stakedAmount: 0,
    stakingRewards: 0,
    activity: [],
    isNewUser: true,
  });

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (walletAddress) {
      fetchBalance(walletAddress);
      const key = `vyns_user_${walletAddress}`;
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const parsedData = JSON.parse(stored);
        setUserData(parsedData);
      } else {
        const newUserData = {
          ...userData,
          walletAddress,
          isNewUser: true,
        };
        setUserData(newUserData);
      }
    }
  }, [walletAddress]);

  const saveUserData = (data: UserData) => {
    if (walletAddress) {
      sessionStorage.setItem(
        `vyns_user_${walletAddress}`,
        JSON.stringify(data),
      );
      setUserData(data);
    }
  };

  const fetchBalance = async (publicKey: string) => {
    setBalanceLoading(true);
    try {
      const res = await fetch(SOLANA_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [publicKey],
        }),
      });
      const data = await res.json();
      if (data.result?.value !== undefined) {
        setBalance(data.result.value / 1_000_000_000);
      }
    } catch (err) {
      console.error("Balance fetch failed:", err);
      setBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const connectWallet = async (
    walletType: "phantom" | "solflare" | "backpack",
  ) => {
    setAuthLoading(true);
    setError("");
    setShowWalletModal(false);

    try {
      const w = window as any;
      let provider: any = null;
      let name = "";

      if (walletType === "phantom") {
        provider = w.phantom?.solana;
        name = "Phantom";
        if (!provider) throw new Error("Phantom not installed");
      } else if (walletType === "solflare") {
        provider = w.solflare;
        name = "Solflare";
        if (!provider) throw new Error("Solflare not installed");
      } else {
        provider = w.backpack;
        name = "Backpack";
        if (!provider) throw new Error("Backpack not installed");
      }

      const response = await provider.connect();
      const publicKey = response.publicKey.toString();

      setWalletAddress(publicKey);
      setWalletProvider(name);
      setIsAuthenticated(true);
      setShowAuthPage(false);
      await fetchBalance(publicKey);
    } catch (err: any) {
      setError(err.message || "Connection failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (walletAddress) {
      try {
        const w = window as any;
        if (w.phantom?.solana?.disconnect) await w.phantom.solana.disconnect();
        if (w.solflare?.disconnect) await w.solflare.disconnect();
        if (w.backpack?.disconnect) await w.backpack.disconnect();
      } catch (err) {
        console.error("Disconnect error:", err);
      }
    }
    setIsAuthenticated(false);
    setShowAuthPage(true);
    setWalletAddress(null);
    setWalletProvider("");
    setBalance(0);
    setSidebarOpen(false);
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const isSignup = authMode === "signup";
    setShowAuthPage(false);
    setIsAuthenticated(true);

    setUserData({
      ...userData,
      isNewUser: isSignup,
    });
  };

  const claimUsername = () => {
    const trimmed = newUsername.trim();
    if (!trimmed || !trimmed.startsWith("@")) {
      setError("Username must start with @");
      return;
    }

    const username: Username = {
      id: Date.now().toString(),
      name: trimmed,
      level: 1,
      yield: 0,
      staked: false,
      value: 0.1,
      tier: "Bronze",
      createdAt: new Date().toISOString(),
    };

    const newData = {
      ...userData,
      usernames: [...userData.usernames, username],
      xp: userData.xp + 100,
      isNewUser: false,
    };

    saveUserData(newData);
    setNewUsername("");
    setShowUsernameModal(false);
    setError("");
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleRefreshBalance = () => {
    if (walletAddress) {
      fetchBalance(walletAddress);
    }
  };

  const displayName = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : "User";

  const progressPercentage = (userData.xp / userData.nextLevelXp) * 100;

  const navItems = [
    { id: "overview", icon: BarChart3, label: "Overview" },
    {
      id: "usernames",
      icon: Crown,
      label: "My Usernames",
      badge: userData.usernames.length,
    },
    { id: "earnings", icon: DollarSign, label: "Earnings" },
    { id: "staking", icon: Zap, label: "Staking" },
    {
      id: "referrals",
      icon: Users,
      label: "Referrals",
      badge: userData.referrals,
    },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const getWelcomeMessage = () => {
    if (userData.isNewUser) {
      return "Welcome to VYNS! 🎉";
    }
    return "Welcome back! 👋";
  };

  const getWelcomeSubtext = () => {
    if (userData.isNewUser) {
      return "Let's get you started. Claim your first username to begin earning!";
    }
    return `You have ${userData.usernames.length} username${userData.usernames.length !== 1 ? "s" : ""} and ${balance.toFixed(4)} SOL`;
  };

  // Authentication Page
  if (showAuthPage) {
    return (
      <div className="min-h-screen bg-[#030811] text-slate-200 overflow-x-hidden font-sans antialiased relative">
        {/* Ambient glow background */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute -top-52 -left-52 w-[700px] h-[700px] rounded-full bg-teal-500/[0.07] blur-[160px]" />
          <div className="absolute bottom-0 -right-40 w-[550px] h-[550px] rounded-full bg-indigo-500/[0.08] blur-[160px]" />
        </div>

        {/* Glassmorphic Background Pattern */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-transparent to-slate-900/20" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.05) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Wallet Connect Modal */}
        {showWalletModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowWalletModal(false)}
            />
            <div
              className="w-full max-w-sm rounded-2xl border border-white/[0.1] bg-slate-900/80 backdrop-blur-2xl p-6 shadow-2xl relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white">
                  Connect Wallet
                </h2>
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    type: "phantom",
                    name: "Phantom",
                    src: "/phantom-wallet.png",
                  },
                  {
                    type: "solflare",
                    name: "Solflare",
                    src: "/solflare-wallet.png",
                  },
                  {
                    type: "backpack",
                    name: "Backpack",
                    src: "/backpack-wallet.png",
                  },
                ].map((w) => (
                  <button
                    key={w.type}
                    onClick={() => connectWallet(w.type as any)}
                    disabled={authLoading}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/[0.07] bg-slate-800/50 hover:border-teal-500/50 hover:bg-slate-800 transition-all disabled:opacity-60 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden">
                      <Image
                        src={w.src}
                        alt={w.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-base text-white">
                        {w.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        Connect to {w.name}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
                  </button>
                ))}
              </div>

              {authLoading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-teal-400 p-3 bg-teal-500/10 rounded-lg border border-teal-500/20">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Connecting...</span>
                </div>
              )}

              {error && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auth Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md relative z-10">
            {/* Logo and Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-5">
                <Link href="/" className="cursor-pointer">
                  <Image
                    src="/vyns-logo.png"
                    alt="VYNS"
                    width={120}
                    height={40}
                    className="object-contain hover:opacity-80 transition-opacity"
                  />
                </Link>
              </div>
              <h1 className="text-[clamp(24px,4vw,32px)] font-bold text-white mb-2">
                {authMode === "signin" && "Welcome Back"}
                {authMode === "signup" && "Welcome to VYNS!"}
                {authMode === "forgot" && "Reset Your Password"}
              </h1>
              <p className="text-slate-400 text-base font-normal">
                {authMode === "signin" && "Sign in to your VYNS dashboard"}
                {authMode === "signup" &&
                  "Create your account and start earning"}
                {authMode === "forgot" && "We'll send you a reset link"}
              </p>
            </div>

            {/* Auth Card */}
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/[0.1] rounded-2xl p-6 shadow-2xl">
              <button
                type="button"
                onClick={() => setShowWalletModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-500 hover:opacity-90 text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-teal-500/20 mb-5 cursor-pointer"
              >
                <Wallet className="h-5 w-5" />
                Connect Wallet
              </button>

              {authMode !== "forgot" && (
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.07]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-slate-900/80 text-slate-500 font-medium">
                      Or continue with email
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.07] rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.07] rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>

                {authMode !== "forgot" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.07] rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all pr-12"
                      />
                      {authMode === "signin" && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {authMode === "signin" && (
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setAuthMode("forgot")}
                      className="text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-white/[0.08] hover:border-teal-500/50 text-white py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer"
                >
                  {authMode === "signin" && "Sign In"}
                  {authMode === "signup" && "Create Account"}
                  {authMode === "forgot" && "Send Reset Link"}
                </button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-sm text-slate-400 font-normal">
                  {authMode === "signin" && (
                    <>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setAuthMode("signup")}
                        className="text-teal-400 hover:text-teal-300 font-semibold transition-colors cursor-pointer"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                  {authMode === "signup" && (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setAuthMode("signin")}
                        className="text-teal-400 hover:text-teal-300 font-semibold transition-colors cursor-pointer"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                  {authMode === "forgot" && (
                    <>
                      Remember your password?{" "}
                      <button
                        type="button"
                        onClick={() => setAuthMode("signin")}
                        className="text-teal-400 hover:text-teal-300 font-semibold transition-colors cursor-pointer"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 mt-5 leading-relaxed font-normal">
              By continuing, you agree to VYNS's{" "}
              <a
                href="#"
                className="text-teal-400 hover:text-teal-300 transition-colors"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-teal-400 hover:text-teal-300 transition-colors"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard with Fixed Layout
  return (
    <div className="min-h-screen bg-[#030811] text-slate-200 font-sans antialiased">
      {/* Ambient glow background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-52 -left-52 w-[700px] h-[700px] rounded-full bg-teal-500/[0.07] blur-[160px]" />
        <div className="absolute bottom-0 -right-40 w-[550px] h-[550px] rounded-full bg-indigo-500/[0.08] blur-[160px]" />
      </div>

      {/* Glassmorphic Background Pattern */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-transparent to-slate-900/20" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.05) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Username Claim Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.1] bg-slate-900/80 backdrop-blur-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-teal-400" />
                <h2 className="text-lg font-semibold text-white">
                  Claim Username
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowUsernameModal(false);
                  setError("");
                }}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="@yourname"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/[0.07] focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm text-slate-200 placeholder-slate-500 transition-all"
                />
                <p className="text-xs text-slate-500 mt-2 font-normal">
                  Must start with @
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-white/[0.07]">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400 font-normal">Fee</span>
                  <span className="font-semibold text-white">0.1 SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-normal">Duration</span>
                  <span className="font-semibold text-white">1 Year</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={claimUsername}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-500 hover:opacity-90 font-semibold text-sm shadow-lg shadow-teal-500/20 transition-all text-white cursor-pointer"
              >
                Claim Username
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-[#030811]/80 backdrop-blur-xl border-b border-white/[0.07]">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
              <Link href="/" className="cursor-pointer">
                <Image
                  src="/vyns-logo.png"
                  alt="VYNS"
                  width={100}
                  height={28}
                  className="object-contain hover:opacity-80 transition-opacity"
                />
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-white/[0.07] text-sm">
                <Coins className="h-4 w-4 text-teal-400" />
                {balanceLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : (
                  <span className="font-semibold">{balance.toFixed(4)}</span>
                )}
                <button
                  onClick={handleRefreshBalance}
                  className="p-1 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                  title="Refresh balance"
                >
                  <RefreshCw className="h-3 w-3 text-slate-400 hover:text-teal-400" />
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Bell className="h-4 w-4" />
                  {notifications > 0 && (
                    <span className="absolute right-1 top-1 w-2 h-2 bg-teal-400 rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl border border-white/[0.07] bg-slate-900/95 backdrop-blur-xl shadow-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">
                        Notifications
                      </h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-xs text-teal-400 hover:text-teal-300 cursor-pointer"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-2">
                      {notifications > 0 ? (
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-sm text-white mb-1">
                            Welcome to VYNS!
                          </p>
                          <p className="text-xs text-slate-400">
                            Get started by claiming your first username
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 text-center py-4">
                          No new notifications
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative group">
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-xs font-bold shadow-lg">
                    {displayName[0].toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold">{displayName}</p>
                    <p className="text-[10px] text-teal-400">
                      {walletProvider || "Email"}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
                </button>

                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/[0.07] bg-slate-900/95 backdrop-blur-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-3">
                    {walletAddress && (
                      <div className="px-3 py-2 bg-slate-800/50 rounded-lg mb-2">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs text-slate-400 font-mono">
                            {walletAddress.slice(0, 10)}...
                            {walletAddress.slice(-10)}
                          </span>
                          <button
                            onClick={copyAddress}
                            className="p-1 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                          >
                            {copySuccess ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3 text-teal-400" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Coins className="h-4 w-4 text-teal-400" />
                          <span className="font-semibold">
                            {balance.toFixed(4)} SOL
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="border-t border-white/[0.07] pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex relative z-10">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-16 left-0 z-50 h-[calc(100vh-4rem)] w-64 border-r border-white/[0.07] bg-slate-900/80 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col p-4">
            <div className="p-4 mb-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border border-teal-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-teal-400" />
                <span className="text-sm font-semibold">
                  Level {userData.level}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-teal-500 to-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 font-normal">
                {userData.xp} / {userData.nextLevelXp} XP
              </p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeTab === item.id
                      ? "bg-slate-800 text-white shadow-lg"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-500/20 text-teal-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3 mt-4 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800/50 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        </aside>

        {/* Main Content - Fixed Width Container */}
        <main className="flex-1 w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Welcome Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-purple-500/10 border border-white/[0.07] p-6 backdrop-blur-sm">
                <div className="relative z-10">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {getWelcomeMessage()}
                  </h1>
                  <p className="text-base text-slate-300 font-normal mb-4">
                    {getWelcomeSubtext()}
                  </p>

                  {userData.isNewUser && (
                    <button
                      onClick={() => setShowUsernameModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-indigo-500 hover:opacity-90 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer"
                    >
                      <Crown className="h-4 w-4" />
                      Claim Your First Username
                    </button>
                  )}

                  {!userData.isNewUser && (
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-teal-400" />
                      <div className="flex-1 max-w-md">
                        <div className="w-full bg-white/10 rounded-full h-2 mb-1">
                          <div
                            className="bg-gradient-to-r from-teal-500 to-indigo-500 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 font-normal">
                          Level {userData.level} • {userData.xp}/
                          {userData.nextLevelXp} XP
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        icon: Crown,
                        label: "Usernames",
                        value: userData.usernames.length,
                        color: "text-teal-400",
                        bg: "bg-teal-500/10",
                      },
                      {
                        icon: DollarSign,
                        label: "Total Earnings",
                        value: userData.earnings.allTime.toFixed(2),
                        color: "text-emerald-400",
                        bg: "bg-emerald-500/10",
                      },
                      {
                        icon: Zap,
                        label: "Staked",
                        value: `${userData.stakedAmount.toFixed(1)} SOL`,
                        color: "text-purple-400",
                        bg: "bg-purple-500/10",
                      },
                      {
                        icon: Users,
                        label: "Referrals",
                        value: userData.referrals,
                        color: "text-blue-400",
                        bg: "bg-blue-500/10",
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-white/[0.07] bg-slate-900/50 backdrop-blur-sm p-5 hover:border-teal-500/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2.5 ${stat.bg} rounded-lg`}>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                          </div>
                          <span className="text-xs text-teal-400 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> +12%
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {stat.value}
                        </div>
                        <div className="text-sm text-slate-400 font-normal">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="rounded-xl border border-white/[0.07] bg-slate-900/50 backdrop-blur-sm p-6">
                    <h3 className="text-lg font-semibold mb-4 text-white">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        {
                          icon: Plus,
                          label: "Claim Username",
                          color: "text-teal-400",
                          action: () => setShowUsernameModal(true),
                        },
                        {
                          icon: Zap,
                          label: "Stake Tokens",
                          color: "text-purple-400",
                          action: () => setActiveTab("staking"),
                        },
                        {
                          icon: Users,
                          label: "Invite Friends",
                          color: "text-blue-400",
                          action: () => setActiveTab("referrals"),
                        },
                        {
                          icon: Settings,
                          label: "Settings",
                          color: "text-slate-400",
                          action: () => setActiveTab("settings"),
                        },
                      ].map((action, i) => (
                        <button
                          key={i}
                          onClick={action.action}
                          className="flex flex-col items-center gap-3 p-5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/[0.07] hover:border-teal-500/50 transition-all cursor-pointer"
                        >
                          <action.icon className={`h-6 w-6 ${action.color}`} />
                          <span className="text-sm font-medium text-center text-white">
                            {action.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="rounded-xl border border-white/[0.07] bg-slate-900/50 backdrop-blur-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-lg font-semibold text-white">
                        Recent Activity
                      </h2>
                      <Clock className="h-5 w-5 text-slate-400" />
                    </div>
                    {userData.activity.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <Activity className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                        <p className="text-sm font-medium mb-1">
                          No activity yet
                        </p>
                        <p className="text-xs text-slate-500">
                          Start by claiming a username or staking tokens
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userData.activity.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                                {item.type === "received" && (
                                  <ArrowUpRight className="h-5 w-5 text-green-400 rotate-180" />
                                )}
                                {item.type === "sent" && (
                                  <ArrowUpRight className="h-5 w-5 text-red-400" />
                                )}
                                {item.type === "staking" && (
                                  <Zap className="h-5 w-5 text-yellow-400" />
                                )}
                                {item.type === "referral" && (
                                  <Gift className="h-5 w-5 text-indigo-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium capitalize text-sm text-white">
                                  {item.type}
                                </p>
                                <p className="text-xs text-slate-400 font-normal">
                                  {item.date}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-sm text-white">
                              {item.amount} {item.token}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Other Tabs */}
              {activeTab !== "overview" && (
                <div className="rounded-xl border border-white/[0.07] bg-slate-900/50 backdrop-blur-sm p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/10 flex items-center justify-center">
                      {activeTab === "usernames" && (
                        <Crown className="h-8 w-8 text-teal-400" />
                      )}
                      {activeTab === "earnings" && (
                        <DollarSign className="h-8 w-8 text-emerald-400" />
                      )}
                      {activeTab === "staking" && (
                        <Zap className="h-8 w-8 text-purple-400" />
                      )}
                      {activeTab === "referrals" && (
                        <Users className="h-8 w-8 text-blue-400" />
                      )}
                      {activeTab === "settings" && (
                        <Settings className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2 capitalize">
                      {activeTab}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      This section is coming soon. We're working hard to bring
                      you amazing features!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
