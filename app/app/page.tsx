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
} from "lucide-react";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

const VYNSLogo = ({
  size = "md",
  animated = false,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}) => {
  const sizes = { sm: 40, md: 48, lg: 80, xl: 128 };
  const dim = sizes[size] || 48;

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
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full animate-ping" />
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
  const [loading, setLoading] = useState(true);
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
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

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
    setWalletAddress(null);
    setWalletProvider("");
    setBalance(0);
    setSidebarOpen(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative text-center space-y-6">
          <VYNSLogo size="xl" animated />
          <div className="space-y-2">
            {/* <p className="text-gray-400 font-medium text-lg">Loading VYNS...</p> */}
            <div className="flex justify-center gap-2">
              <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" />
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100">
      {/* Wallet Connect Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <VYNSLogo size="sm" />
                <h2 className="text-xl font-bold">Connect Wallet</h2>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
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
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-700 hover:border-teal-500 hover:bg-slate-800/50 transition-all disabled:opacity-60 group"
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                    <Image
                      src={w.src || "/placeholder.svg"}
                      alt={`${w.name} wallet`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-lg">{w.name}</div>
                    <div className="text-sm text-gray-400">
                      Connect to {w.name}
                    </div>
                  </div>
                  <ExternalLink className="h-5 w-5 text-gray-600 group-hover:text-teal-400 transition-colors" />
                </button>
              ))}
            </div>

            {authLoading && (
              <div className="mt-6 flex items-center justify-center gap-2 text-teal-400 p-4 bg-teal-500/10 rounded-xl border border-teal-500/20">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Connecting...</span>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Username Claim Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-teal-400" />
                <h2 className="text-xl font-bold">Claim Username</h2>
              </div>
              <button
                onClick={() => {
                  setShowUsernameModal(false);
                  setError("");
                }}
                className="p-2 hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="@yourname"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <p className="text-xs text-gray-500 mt-2">Must start with @</p>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Fee</span>
                  <span className="font-medium">0.1 SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Duration</span>
                  <span className="font-medium">1 Year</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={claimUsername}
                className="w-full h-12 rounded-lg bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 font-semibold shadow-lg"
              >
                Claim Username
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-xl">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
              {isAuthenticated && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"
                >
                  {sidebarOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              )}

              <div className="flex items-center gap-3">
                <VYNSLogo size="lg" />
              </div>
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm sm:text-base">
                  <Coins className="h-4 sm:h-5 w-4 sm:w-5 text-teal-400 flex-shrink-0" />
                  {balanceLoading ? (
                    <Loader2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 animate-spin text-gray-400" />
                  ) : (
                    <span className="font-bold">{balance.toFixed(4)} SOL</span>
                  )}
                </div>

                <button className="relative p-2 hover:bg-slate-800 rounded-lg">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative rounded-full h-4 w-4 bg-teal-500 flex items-center justify-center text-[10px] font-bold">
                        {notifications}
                      </span>
                    </span>
                  )}
                </button>

                <div className="relative group">
                  <button className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                    <div className="h-8 sm:h-9 w-8 sm:w-9 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg ring-2 ring-slate-800 flex-shrink-0">
                      {displayName[0].toUpperCase()}
                    </div>
                    <div className="hidden md:block text-left min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-teal-400 truncate">
                        {walletProvider}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 hidden sm:block" />
                  </button>

                  <div className="absolute right-0 mt-2 w-64 sm:w-72 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-3">
                      <div className="px-2 py-2 text-sm font-semibold border-b border-slate-800 pb-2">
                        Connected Wallet
                      </div>
                      {walletAddress && (
                        <div className="px-2 py-3 bg-slate-800/50 rounded-lg mt-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-400 font-mono">
                              {walletAddress.slice(0, 12)}...
                              {walletAddress.slice(-12)}
                            </span>
                            <button
                              onClick={copyAddress}
                              className="p-1.5 hover:bg-slate-700 rounded"
                            >
                              {copySuccess ? (
                                <Check className="h-3.5 w-3.5 text-green-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-teal-400" />
                              )}
                            </button>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <Coins className="h-4 w-4 text-teal-400" />
                            <span className="font-semibold">
                              {balance.toFixed(4)} SOL
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => setActiveTab("settings")}
                          className="flex w-full items-center gap-2 px-2 py-2 text-sm hover:bg-slate-800 rounded"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </button>
                        <div className="flex items-center justify-between px-2 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-teal-400" />
                            Level {userData.level}
                          </div>
                          <div className="text-xs text-gray-500">
                            {userData.xp}/{userData.nextLevelXp} XP
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-2 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded"
                        >
                          <LogOut className="h-4 w-4" />
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
            className={`fixed lg:sticky top-16 left-0 z-50 h-[calc(100vh-4rem)] w-64 border-r border-slate-800/50 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex h-full flex-col gap-4 p-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border border-teal-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-teal-400" />
                  <span className="text-sm font-semibold">Level Progress</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {userData.xp} / {userData.nextLevelXp} XP
                </p>
              </div>

              <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === item.id
                        ? "bg-slate-800 text-white shadow-lg"
                        : "text-gray-400 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 text-xs font-semibold rounded-full bg-teal-500/20 text-teal-400">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="h-px bg-slate-800" />

              {walletAddress && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-teal-600/20 to-indigo-600/20 border border-teal-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">
                      Wallet Balance
                    </span>
                    <button
                      onClick={() => fetchBalance(walletAddress)}
                      disabled={balanceLoading}
                      className="p-1 hover:bg-slate-700/50 rounded"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 text-gray-400 ${balanceLoading ? "animate-spin" : ""}`}
                      />
                    </button>
                  </div>
                  <div className="text-2xl font-bold">
                    {balance.toFixed(4)} SOL
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    ≈ ${(balance * 180).toFixed(2)} USD
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-slate-900"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </aside>
        )}

        <main
          className="flex-1 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 transition-all duration-300"
          style={{
            marginLeft: isAuthenticated && !sidebarOpen ? 0 : 0,
            paddingTop: "1rem",
          }}
        >
          {!isAuthenticated ? (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
              <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-6">
                    <VYNSLogo size="xl" animated />
                  </div>
                  <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Welcome to VYNS
                  </h1>
                  <p className="text-gray-400">
                    Connect your Solana wallet to get started
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-400">Error</p>
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowWalletModal(true)}
                  className="w-full flex items-center justify-center gap-3 h-14 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 font-semibold text-lg shadow-lg"
                >
                  <Wallet className="h-6 w-6" />
                  Connect Wallet
                </button>
                <p className="text-center text-sm text-gray-500 mt-4">
                  Phantom, Solflare, Backpack supported
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-7xl space-y-6">
              {/* Dashboard content */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 p-4 sm:p-6 lg:p-8 shadow-2xl">
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
                        Welcome back! 👋
                      </h1>
                      <p className="text-white/90 text-base sm:text-lg">
                        Balance:{" "}
                        <span className="font-bold text-xl sm:text-2xl">
                          {balance.toFixed(4)} SOL
                        </span>
                      </p>
                      <p className="text-white/70 text-xs sm:text-sm mt-1">
                        ≈ ${(balance * 180).toFixed(2)} USD
                      </p>
                    </div>
                    <div className="hidden sm:block flex-shrink-0">
                      <VYNSLogo size="lg" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-4">
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <Award className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
                      <span className="font-medium">
                        Level {userData.level}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                          className="bg-white h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <p className="text-white/60 text-xs mt-1">
                        {userData.xp}/{userData.nextLevelXp} XP
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
              </div>

              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                        className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:p-4 lg:p-6 hover:border-teal-500/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div className={`p-1.5 sm:p-2 ${stat.bg} rounded-lg`}>
                            <stat.icon
                              className={`h-5 sm:h-6 lg:h-8 w-5 sm:w-6 lg:w-8 ${stat.color}`}
                            />
                          </div>
                          <span className="text-xs text-teal-400 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> +12%
                          </span>
                        </div>
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                          {stat.value}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                        Recent Usernames
                      </h3>
                      {userData.usernames.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Crown className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                          <p>No usernames yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {userData.usernames.slice(0, 3).map((u) => (
                            <div
                              key={u.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center">
                                  <Crown className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium">{u.name}</div>
                                  <div className="text-sm text-gray-400">
                                    {u.tier} Tier
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-teal-400">
                                  {u.value} SOL
                                </div>
                                <div className="text-xs text-gray-500">
                                  Value
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                        Quick Actions
                      </h3>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/50 transition-all"
                          >
                            <action.icon
                              className={`h-6 w-6 ${action.color}`}
                            />
                            <span className="text-sm font-medium">
                              {action.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">Recent Activity</h2>
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    {userData.activity.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Activity className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                        <p>No activity yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userData.activity.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
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
                                <p className="font-medium capitalize">
                                  {item.type}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {item.date}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold">
                              {item.amount} {item.token}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ... other tabs (usernames, earnings, staking, referrals, settings) */}
              {/* Paste them here if you want them in this version too */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
