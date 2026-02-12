"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
} from "lucide-react";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

const VYNSLogo = ({
  size = "md",
  animated = false,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}) => {
  const sizes = { sm: 32, md: 40, lg: 56, xl: 96 };
  const dim = sizes[size] || 40;

  return (
    <div className={`relative w-[${dim}px] h-[${dim}px]`}>
      <Image
        src="/vyns-logo.png"
        alt="VYNS"
        width={dim}
        height={dim}
        className={`object-contain ${animated ? "animate-pulse" : ""}`}
        priority={size === "xl" || size === "lg"}
      />
      {animated && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-teal-400 rounded-full animate-ping" />
      )}
    </div>
  );
};

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
  const [notifications] = useState(3);
  const [showPassword, setShowPassword] = useState(false);

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
      if (stored) setUserData(JSON.parse(stored));
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
    setShowAuthPage(false);
    setIsAuthenticated(true);
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
    };

    saveUserData(newData);
    setNewUsername("");
    setShowUsernameModal(false);
    setError("");
  };

  const toggleStake = (id: string) => {
    const u = userData.usernames.find((x) => x.id === id);
    if (!u) return;

    const newUsernames = userData.usernames.map((x) =>
      x.id === id ? { ...x, staked: !x.staked, yield: !x.staked ? 2.5 : 0 } : x,
    );

    const diff = u.staked ? -u.value : u.value;
    saveUserData({
      ...userData,
      usernames: newUsernames,
      stakedAmount: userData.stakedAmount + diff,
    });
  };

  const deleteUsername = (id: string) => {
    const u = userData.usernames.find((x) => x.id === id);
    const newUsernames = userData.usernames.filter((x) => x.id !== id);
    const newStaked = u?.staked
      ? userData.stakedAmount - u.value
      : userData.stakedAmount;

    saveUserData({
      ...userData,
      usernames: newUsernames,
      stakedAmount: newStaked,
    });
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
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

  // Authentication Page
  if (showAuthPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-3">
        {/* Wallet Connect Modal */}
        {showWalletModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {/* <VYNSLogo size="sm" /> */}
                  <h2 className="text-lg font-bold">Connect Wallet</h2>
                </div>
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              <div className="space-y-2">
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
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-700 hover:border-teal-500 hover:bg-slate-800/50 transition-all disabled:opacity-60 group cursor-pointer"
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                      <Image
                        src={w.src}
                        alt={`${w.name} wallet`}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-base">{w.name}</div>
                      <div className="text-xs text-gray-400">
                        Connect to {w.name}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-600 group-hover:text-teal-400 transition-colors" />
                  </button>
                ))}
              </div>

              {authLoading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-teal-400 p-3 bg-teal-500/10 rounded-lg border border-teal-500/20">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Connecting...</span>
                </div>
              )}

              {error && (
                <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <VYNSLogo size="xl" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
              {authMode === "signin" && "Welcome Back"}
              {authMode === "signup" && "Create Account"}
              {authMode === "forgot" && "Reset Password"}
            </h1>
            <p className="text-gray-400 text-sm">
              {authMode === "signin" && "Sign in to your VYNS dashboard"}
              {authMode === "signup" && "Join the VYNS ecosystem"}
              {authMode === "forgot" && "We'll send you a reset link"}
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl p-5 shadow-2xl">
            {/* Wallet Connect Button - Top */}
            <button
              onClick={() => setShowWalletModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl mb-4 cursor-pointer"
            >
              <Wallet className="h-5 w-5" />
              Connect Wallet
            </button>

            {authMode !== "forgot" && (
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-slate-900/50 text-gray-400">
                    Or continue with email
                  </span>
                </div>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {authMode === "signup" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>

              {authMode !== "forgot" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={
                        authMode === "signin"
                          ? showPassword
                            ? "text"
                            : "password"
                          : "password"
                      }
                      placeholder="••••••••••"
                      className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all pr-10"
                    />
                    {authMode === "signin" && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 cursor-pointer"
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
                <div className="flex items-center justify-end text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthMode("forgot")}
                    className="text-teal-400 hover:text-teal-300 font-medium transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500/50 text-white py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer"
              >
                {authMode === "signin" && "Sign In"}
                {authMode === "signup" && "Create Account"}
                {authMode === "forgot" && "Send Reset Link"}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
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

          {/* Terms */}
          <p className="text-center text-[10px] text-gray-500 mt-4 leading-relaxed">
            By continuing, you agree to VYNS's{" "}
            <a
              href="#"
              className="text-teal-400 hover:text-teal-300 cursor-pointer"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-teal-400 hover:text-teal-300 cursor-pointer"
            >
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100">
      {/* Wallet Connect Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {/* <VYNSLogo size="sm" /> */}
                <h2 className="text-lg font-bold">Connect Wallet</h2>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-2">
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
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-700 hover:border-teal-500 hover:bg-slate-800/50 transition-all disabled:opacity-60 group cursor-pointer"
                >
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                    <Image
                      src={w.src}
                      alt={`${w.name} wallet`}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-base">{w.name}</div>
                    <div className="text-xs text-gray-400">
                      Connect to {w.name}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-600 group-hover:text-teal-400 transition-colors" />
                </button>
              ))}
            </div>

            {authLoading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-teal-400 p-3 bg-teal-500/10 rounded-lg border border-teal-500/20">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Connecting...</span>
              </div>
            )}

            {error && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Username Claim Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-teal-400" />
                <h2 className="text-lg font-bold">Claim Username</h2>
              </div>
              <button
                onClick={() => {
                  setShowUsernameModal(false);
                  setError("");
                }}
                className="p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-300">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="@yourname"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
                />
                <p className="text-[10px] text-gray-500 mt-1.5">
                  Must start with @
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400">Fee</span>
                  <span className="font-medium">0.1 SOL</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Duration</span>
                  <span className="font-medium">1 Year</span>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={claimUsername}
                className="w-full h-10 rounded-lg bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 font-semibold text-sm shadow-lg cursor-pointer"
              >
                Claim Username
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-xl">
        <div className="w-full px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  {sidebarOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              )}

              <div className="flex items-center gap-2">
                <VYNSLogo size="xl" />
              </div>
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm">
                  <Coins className="h-4 w-4 text-teal-400 flex-shrink-0" />
                  {balanceLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                  ) : (
                    <span className="font-bold">{balance.toFixed(4)}</span>
                  )}
                </div>

                <button className="relative p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer">
                  <Bell className="h-4 w-4" />
                  {notifications > 0 && (
                    <span className="absolute right-1 top-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative rounded-full h-3.5 w-3.5 bg-teal-500 flex items-center justify-center text-[9px] font-bold">
                        {notifications}
                      </span>
                    </span>
                  )}
                </button>

                <div className="relative group">
                  <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-xs font-bold shadow-lg ring-2 ring-slate-800 flex-shrink-0">
                      {displayName[0].toUpperCase()}
                    </div>
                    <div className="hidden md:block text-left min-w-0">
                      <p className="text-xs font-semibold truncate">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-teal-400 truncate">
                        {walletProvider}
                      </p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 hidden sm:block" />
                  </button>

                  <div className="absolute right-0 mt-1.5 w-56 sm:w-64 rounded-lg border border-slate-800 bg-slate-900 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-2.5">
                      <div className="px-2 py-1.5 text-xs font-semibold border-b border-slate-800 pb-1.5">
                        Connected Wallet
                      </div>
                      {walletAddress && (
                        <div className="px-2 py-2 bg-slate-800/50 rounded-lg mt-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-gray-400 font-mono">
                              {walletAddress.slice(0, 10)}...
                              {walletAddress.slice(-10)}
                            </span>
                            <button
                              onClick={copyAddress}
                              className="p-1 hover:bg-slate-700 rounded cursor-pointer"
                            >
                              {copySuccess ? (
                                <Check className="h-3 w-3 text-green-400" />
                              ) : (
                                <Copy className="h-3 w-3 text-teal-400" />
                              )}
                            </button>
                          </div>
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                            <Coins className="h-3.5 w-3.5 text-teal-400" />
                            <span className="font-semibold">
                              {balance.toFixed(4)} SOL
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="mt-2 pt-1.5 border-t border-slate-800">
                        <button
                          onClick={() => setActiveTab("settings")}
                          className="flex w-full items-center gap-2 px-2 py-1.5 text-xs hover:bg-slate-800 rounded cursor-pointer"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          Settings
                        </button>
                        <div className="flex items-center justify-between px-2 py-1.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Award className="h-3.5 w-3.5 text-teal-400" />
                            Level {userData.level}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {userData.xp}/{userData.nextLevelXp} XP
                          </div>
                        </div>
                      </div>
                      <div className="mt-1.5 pt-1.5 border-t border-slate-800">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded cursor-pointer"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {isAuthenticated && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {isAuthenticated && (
          <aside
            className={`fixed lg:sticky top-14 left-0 z-50 h-[calc(100vh-3.5rem)] w-56 border-r border-slate-800/50 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex h-full flex-col gap-3 p-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border border-teal-500/20">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Award className="h-3.5 w-3.5 text-teal-400" />
                  <span className="text-xs font-semibold">Level Progress</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1.5">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400">
                  {userData.xp} / {userData.nextLevelXp} XP
                </p>
              </div>

              <nav className="flex-1 space-y-0.5">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full items-center justify-start gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      activeTab === item.id
                        ? "bg-slate-800 text-white shadow-lg"
                        : "text-gray-400 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-teal-500/20 text-teal-400">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="h-px bg-slate-800" />

              {walletAddress && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-teal-600/20 to-indigo-600/20 border border-teal-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                      Wallet Balance
                    </span>
                    <button
                      onClick={() => fetchBalance(walletAddress)}
                      disabled={balanceLoading}
                      className="p-0.5 hover:bg-slate-700/50 rounded cursor-pointer"
                    >
                      <RefreshCw
                        className={`h-3 w-3 text-gray-400 ${balanceLoading ? "animate-spin" : ""}`}
                      />
                    </button>
                  </div>
                  <div className="text-xl font-bold">
                    {balance.toFixed(4)} SOL
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    ≈ ${(balance * 180).toFixed(2)} USD
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-red-400 hover:bg-slate-900 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          </aside>
        )}

        <main className="flex-1 min-h-[calc(100vh-3.5rem)] p-3 sm:p-4 transition-all duration-300">
          <div className="mx-auto max-w-7xl space-y-4">
            {/* Dashboard content */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 p-4 shadow-2xl">
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
                      Welcome back! 👋
                    </h1>
                    <p className="text-white/90 text-sm sm:text-base">
                      Balance:{" "}
                      <span className="font-bold text-lg sm:text-xl">
                        {balance.toFixed(4)} SOL
                      </span>
                    </p>
                    <p className="text-white/70 text-xs mt-0.5">
                      ≈ ${(balance * 180).toFixed(2)} USD
                    </p>
                  </div>
                  <div className="hidden sm:block flex-shrink-0">
                    <VYNSLogo size="md" />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-3">
                  <div className="flex items-center gap-1.5 text-white/80 text-xs">
                    <Award className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Level {userData.level}</span>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-white/20 rounded-full h-1.5">
                      <div
                        className="bg-white h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-white/60 text-[10px] mt-0.5">
                      {userData.xp}/{userData.nextLevelXp} XP
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  {[
                    {
                      icon: Crown,
                      label: "Usernames",
                      value: userData.usernames.length,
                      color: "text-amber-400",
                      bg: "bg-amber-500/10",
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
                      className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 hover:border-teal-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`p-1.5 ${stat.bg} rounded-lg`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <span className="text-[10px] text-teal-400 flex items-center gap-0.5">
                          <TrendingUp className="h-2.5 w-2.5" /> +12%
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-bold truncate">
                        {stat.value}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-400">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                    <h3 className="text-sm font-semibold mb-3">
                      Recent Usernames
                    </h3>
                    {userData.usernames.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <Crown className="h-10 w-10 mx-auto mb-1.5 text-gray-600" />
                        <p className="text-xs">No usernames yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {userData.usernames.slice(0, 3).map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center">
                                <Crown className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  {u.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {u.tier} Tier
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-teal-400 text-sm">
                                {u.value} SOL
                              </div>
                              <div className="text-[10px] text-gray-500">
                                Value
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                    <h3 className="text-sm font-semibold mb-3">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
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
                          color: "text-gray-400",
                          action: () => setActiveTab("settings"),
                        },
                      ].map((action, i) => (
                        <button
                          key={i}
                          onClick={action.action}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/50 transition-all cursor-pointer"
                        >
                          <action.icon className={`h-5 w-5 ${action.color}`} />
                          <span className="text-xs font-medium text-center">
                            {action.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold">Recent Activity</h2>
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                  {userData.activity.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <Activity className="h-10 w-10 mx-auto mb-1.5 text-gray-600" />
                      <p className="text-xs">No activity yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userData.activity.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                item.type === "received"
                                  ? "bg-green-500/20"
                                  : item.type === "sent"
                                    ? "bg-red-500/20"
                                    : item.type === "staking"
                                      ? "bg-yellow-500/20"
                                      : "bg-indigo-500/20"
                              }`}
                            >
                              {item.type === "received" && (
                                <ArrowUpRight className="h-4 w-4 text-green-400 rotate-180" />
                              )}
                              {item.type === "sent" && (
                                <ArrowUpRight className="h-4 w-4 text-red-400" />
                              )}
                              {item.type === "staking" && (
                                <Zap className="h-4 w-4 text-yellow-400" />
                              )}
                              {item.type === "referral" && (
                                <Gift className="h-4 w-4 text-indigo-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium capitalize text-xs">
                                {item.type}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {item.date}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-sm">
                            {item.amount} {item.token}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
