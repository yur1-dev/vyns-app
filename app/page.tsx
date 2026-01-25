"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Coins,
  Shield,
  Zap,
  TrendingUp,
  Users,
  Globe,
  Search,
  BarChart3,
  Trophy,
  Wallet,
  Sparkles,
  Twitter,
  Github,
  Menu,
  X,
  History,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load search history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("vyns_search_history");
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  // Save to history (max 8 items)
  const addToHistory = (query: string) => {
    if (!query.trim()) return;
    const clean = query.trim().toLowerCase();
    const updated = [clean, ...searchHistory.filter((h) => h !== clean)].slice(
      0,
      8
    );
    setSearchHistory(updated);
    localStorage.setItem("vyns_search_history", JSON.stringify(updated));
  };

  // Clear all history
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("vyns_search_history");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    const cleanUsername = searchQuery.trim().replace("@", "").toLowerCase();
    addToHistory(cleanUsername);

    // Small delay for nice loading feel
    await new Promise((resolve) => setTimeout(resolve, 600));

    router.push(`/search?q=${encodeURIComponent(cleanUsername)}`);

    setIsSearching(false);
    setSearchQuery("");
    setShowHistory(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-black text-gray-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-5 z-50 px-4 sm:px-6 lg:px-8 mt-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Image
                  src="/vyns-logo.png"
                  alt="VYNS Logo"
                  width={160}
                  height={40}
                  className="object-contain"
                />
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-8">
                <a
                  href="#how-it-works"
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                >
                  How It Works
                </a>
                <a
                  href="#features"
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Features
                </a>
                <a
                  href="#ecosystem"
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Ecosystem
                </a>
                <a
                  href="#pricing"
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                >
                  FAQ
                </a>
                <Link
                  href="/app"
                  className="bg-gradient-to-r from-teal-600 to-indigo-700 text-white px-7 py-3 rounded-full font-semibold hover:shadow-xl hover:shadow-teal-500/30 transition-all"
                >
                  Launch App
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-300 hover:text-white"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <div className="md:hidden mt-6 pb-4">
                <div className="flex flex-col space-y-4">
                  <a
                    href="#how-it-works"
                    className="text-gray-300 hover:text-white transition-colors font-medium text-center"
                  >
                    How It Works
                  </a>
                  <a
                    href="#features"
                    className="text-gray-300 hover:text-white transition-colors font-medium text-center"
                  >
                    Features
                  </a>
                  <a
                    href="#ecosystem"
                    className="text-gray-300 hover:text-white transition-colors font-medium text-center"
                  >
                    Ecosystem
                  </a>
                  <a
                    href="#pricing"
                    className="text-gray-300 hover:text-white transition-colors font-medium text-center"
                  >
                    Pricing
                  </a>
                  <a
                    href="#faq"
                    className="text-gray-300 hover:text-white transition-colors font-medium text-center"
                  >
                    FAQ
                  </a>
                  <Link
                    href="/app"
                    className="bg-gradient-to-r from-teal-600 to-indigo-700 text-white py-3 rounded-full font-semibold text-center"
                  >
                    Launch App
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 text-center">
        <div className="space-y-8">
          <span className="inline-block bg-teal-900/40 text-teal-300 px-5 py-2.5 rounded-full text-sm font-medium border border-teal-800/30">
            Universal Human-Readable Name Service
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
            Own Your{" "}
            <span className="bg-gradient-to-r from-teal-400 to-indigo-500 bg-clip-text text-transparent">
              @Username{" "}
            </span>
            <br className="sm:hidden" />
            Earn While You Use It
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            VYNS is the universal human-readable name service that turns your
            Web3 identity into a yield-generating asset.
          </p>

          {/* Search with History Dropdown */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mt-10">
            <div className="relative">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-400 transition-colors duration-300" />

                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowHistory(true)}
                  placeholder="Search for your @username..."
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-full py-4 px-6 pl-14 pr-32 text-gray-100 placeholder-gray-500 
                             focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/30 
                             transition-all duration-300 ease-in-out 
                             group-focus-within:shadow-lg group-focus-within:shadow-teal-500/20"
                />

                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-teal-600 to-indigo-700 text-white px-8 py-3 rounded-full font-medium 
                             hover:shadow-lg hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100
                             transition-all duration-300 flex items-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>

              {/* History Dropdown */}
              {showHistory && searchHistory.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full mt-2 w-full bg-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-10"
                >
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <History className="w-4 h-4" />
                      Recent Searches
                    </div>
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {searchHistory.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSearchQuery(item);
                          setShowHistory(false);
                          handleSearch(new Event("submit") as any);
                        }}
                        className="w-full px-5 py-3 text-left hover:bg-gray-700/50 transition-colors flex items-center justify-between group"
                      >
                        <span className="text-gray-300">@{item}</span>
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-teal-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mt-8">
            <Link
              href="/app"
              className="group bg-gradient-to-r from-teal-600 to-indigo-700 text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-xl hover:shadow-teal-500/40 transition-all flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              Claim Your Username
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="border border-gray-700 text-gray-300 px-10 py-4 rounded-full text-lg font-semibold hover:border-teal-500 hover:text-teal-400 transition-all w-full sm:w-auto text-center"
            >
              Learn More
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
            <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-8">
              <div className="text-4xl font-bold text-teal-400">0.1 SOL</div>
              <div className="text-gray-400 mt-3 text-lg">Starting Price</div>
            </div>
            <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-8">
              <div className="text-4xl font-bold text-teal-400">∞</div>
              <div className="text-gray-400 mt-3 text-lg">
                Permanent Ownership
              </div>
            </div>
            <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-8">
              <div className="text-4xl font-bold text-teal-400">5%+</div>
              <div className="text-gray-400 mt-3 text-lg">Annual Yield</div>
            </div>
          </div>
        </div>
      </section>

      {/* What is VYNS */}
      <section className="py-24 bg-gray-950/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-5">
              What is VYNS?
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              VYNS (Vinculum Yield Name Service) is the first universal
              human-readable name service with built-in yield generation.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="flex items-start gap-5">
                <div className="bg-teal-900/40 p-4 rounded-xl border border-teal-800/40 flex-shrink-0">
                  <Shield className="w-8 h-8 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">
                    Permanent Ownership
                  </h3>
                  <p className="text-gray-300 text-lg">
                    One-time claim. Forever yours. Fully transferable.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="bg-indigo-900/40 p-4 rounded-xl border border-indigo-800/40 flex-shrink-0">
                  <Globe className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">
                    Universal Cross-Chain
                  </h3>
                  <p className="text-gray-300 text-lg">
                    Works on Solana, Ethereum, Base, and all major chains.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="bg-gradient-to-br from-teal-900/40 to-indigo-900/40 p-4 rounded-xl border border-teal-800/40 flex-shrink-0">
                  <TrendingUp className="w-8 h-8 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">
                    Passive Yield Generation
                  </h3>
                  <p className="text-gray-300 text-lg">
                    Earn from transactions, staking, marketplace fees,
                    referrals, and subdomains.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-900/20 to-indigo-900/20 p-12 rounded-3xl border border-gray-700">
              <div className="space-y-10">
                <div className="bg-gray-800/60 p-8 rounded-2xl border border-gray-700">
                  <div className="text-gray-500 mb-4 text-lg">
                    Traditional Web3 Addresses
                  </div>
                  <div className="font-mono text-base text-gray-500 break-all">
                    7xKXy2hbsijWjwTzBkRJnr6qM3FaGN...
                  </div>
                </div>
                <div className="text-center text-3xl font-bold text-gray-400">
                  ↓
                </div>
                <div className="bg-gradient-to-br from-teal-800 to-indigo-800 p-8 rounded-2xl border-2 border-teal-600 shadow-xl">
                  <div className="text-teal-200 mb-4 text-lg">With VYNS</div>
                  <div className="text-4xl font-bold text-teal-400">
                    @yourname
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-5">
              How It Works
            </h2>
            <p className="text-xl text-gray-300">
              Three simple steps to your universal identity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-gradient-to-br from-teal-900 to-teal-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <span className="text-4xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Connect Wallet</h3>
              <p className="text-gray-300 text-lg">
                Use Phantom, Solflare, or any Solana-compatible wallet.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <span className="text-4xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Claim @Username</h3>
              <p className="text-gray-300 text-lg">
                Search and register your desired name starting at 0.1 SOL.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-teal-800 to-indigo-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <span className="text-4xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Earn Yield</h3>
              <p className="text-gray-300 text-lg">
                Start receiving passive income from usage, staking, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-950/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-5">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-300">
              Your @username is more than just a name
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="bg-gray-800/30 border border-gray-700 rounded-3xl p-10 hover:border-teal-500 transition-all">
              <Coins className="w-12 h-12 text-teal-400 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Transaction Yield</h3>
              <p className="text-gray-300 text-lg">
                Earn a percentage on every payment sent to your @username.
              </p>
            </div>

            <div className="bg-gray-800/30 border border-gray-700 rounded-3xl p-10 hover:border-teal-500 transition-all">
              <TrendingUp className="w-12 h-12 text-indigo-400 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Marketplace Revenue</h3>
              <p className="text-gray-300 text-lg">
                All holders share in trading fees from the secondary market.
              </p>
            </div>

            <div className="bg-gray-800/30 border border-gray-700 rounded-3xl p-10 hover:border-teal-500 transition-all">
              <Zap className="w-12 h-12 text-teal-400 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Staking Rewards</h3>
              <p className="text-gray-300 text-lg">
                Lock your name to earn high APY — premium names earn more.
              </p>
            </div>

            <div className="bg-gray-800/30 border border-gray-700 rounded-3xl p-10 hover:border-teal-500 transition-all">
              <Users className="w-12 h-12 text-indigo-400 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Referral Program</h3>
              <p className="text-gray-300 text-lg">
                Invite friends and earn tokens for every successful referral.
              </p>
            </div>

            <div className="bg-gray-800/30 border border-gray-700 rounded-3xl p-10 hover:border-teal-500 transition-all">
              <Globe className="w-12 h-12 text-teal-400 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Subdomains</h3>
              <p className="text-gray-300 text-lg">
                Create and monetize subdomains like @yourname/nft.
              </p>
            </div>

            <div className="bg-gray-800/30 border border-gray-700 rounded-3xl p-10 hover:border-teal-500 transition-all">
              <Shield className="w-12 h-12 text-indigo-400 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Value Appreciation</h3>
              <p className="text-gray-300 text-lg">
                Premium and short names increase in value over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section id="ecosystem" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-5">
              Ecosystem Stats
            </h2>
            <p className="text-xl text-gray-300">Real adoption. Real growth.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-teal-400 mx-auto mb-4" />
              <div className="text-4xl font-bold">250K+</div>
              <div className="text-gray-400 mt-3 text-lg">Registered Names</div>
            </div>
            <div className="text-center">
              <Wallet className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <div className="text-4xl font-bold">180K</div>
              <div className="text-gray-400 mt-3 text-lg">Active Holders</div>
            </div>
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-teal-400 mx-auto mb-4" />
              <div className="text-4xl font-bold">$420M</div>
              <div className="text-gray-400 mt-3 text-lg">Market Cap</div>
            </div>
            <div className="text-center">
              <Trophy className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <div className="text-4xl font-bold">150+</div>
              <div className="text-gray-400 mt-3 text-lg">
                Ecosystem Partners
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-3xl font-bold text-center mb-10">
              Top Recent Sales
            </h3>
            <div className="bg-gray-800/30 border border-gray-700 rounded-3xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="text-left p-6 font-semibold">Name</th>
                    <th className="text-left p-6 font-semibold">Price</th>
                    <th className="text-left p-6 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-6 font-mono">@gm</td>
                    <td className="p-6">68 SOL</td>
                    <td className="p-6 text-gray-400">Dec 25</td>
                  </tr>
                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-6 font-mono">@lfg</td>
                    <td className="p-6">55 SOL</td>
                    <td className="p-6 text-gray-400">Dec 24</td>
                  </tr>
                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-6 font-mono">@alpha</td>
                    <td className="p-6">42 SOL</td>
                    <td className="p-6 text-gray-400">Dec 23</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-950/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-5">
              Simple & Transparent Pricing
            </h2>
            <p className="text-xl text-gray-300">
              One-time registration. Permanent ownership.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-gray-800/40 border border-gray-700 rounded-3xl p-10 hover:border-teal-500 transition-all">
              <div className="text-center">
                <div className="text-gray-400 mb-5 text-lg">STANDARD</div>
                <div className="text-5xl font-bold mb-5">0.1 SOL</div>
                <div className="text-gray-400 mb-10 text-lg">5+ characters</div>
                <ul className="space-y-5 text-left mb-10 text-lg">
                  <li className="flex items-center gap-3">
                    <span className="text-teal-400">✓</span> Permanent ownership
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-teal-400">✓</span> Cross-chain
                    resolution
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-teal-400">✓</span> Transaction yield
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-teal-400">✓</span> Marketplace trading
                  </li>
                </ul>
                <Link
                  href="/app"
                  className="block w-full bg-gray-700 text-white py-4 rounded-2xl font-bold hover:bg-gray-600 transition-all"
                >
                  Claim Now
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-900/80 to-indigo-900/80 rounded-3xl p-10 relative border border-teal-700 shadow-2xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-600 text-black px-6 py-2 rounded-full text-base font-bold">
                MOST POPULAR
              </div>
              <div className="text-center">
                <div className="text-teal-200 mb-5 text-lg">PREMIUM</div>
                <div className="text-5xl font-bold mb-5">1–10 SOL</div>
                <div className="text-teal-200 mb-10 text-lg">
                  3–4 characters
                </div>
                <ul className="space-y-5 text-left mb-10 text-lg text-teal-100">
                  <li className="flex items-center gap-3">
                    <span className="text-white">✓</span> Everything in Standard
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-white">✓</span> 2× staking rewards
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-white">✓</span> 5 free subdomains
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-white">✓</span> Verified badge
                  </li>
                </ul>
                <Link
                  href="/app"
                  className="block w-full bg-white text-teal-700 py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-teal-500/50 transition-all"
                >
                  Claim Premium
                </Link>
              </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700 rounded-3xl p-10 hover:border-teal-500 transition-all">
              <div className="text-center">
                <div className="text-gray-400 mb-5 text-lg">LEGENDARY</div>
                <div className="text-5xl font-bold mb-5">Auction</div>
                <div className="text-gray-400 mb-10 text-lg">
                  1–2 characters
                </div>
                <ul className="space-y-5 text-left mb-10 text-lg">
                  <li className="flex items-center gap-3">
                    <span className="text-teal-400">✓</span> Everything in
                    Premium
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-teal-400">✓</span> 5× staking rewards
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-teal-400">✓</span> Unlimited
                    subdomains
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-teal-400">✓</span> DAO voting power
                  </li>
                </ul>
                <Link
                  href="/app"
                  className="block w-full bg-gray-700 text-white py-4 rounded-2xl font-bold hover:bg-gray-600 transition-all"
                >
                  View Auctions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-5">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "How do I claim a username?",
                a: "Connect your Solana wallet, search for your desired @username, and if it's available, pay the one-time registration fee starting at 0.1 SOL.",
              },
              {
                q: "Can I transfer or sell my username?",
                a: "Yes! Your @username is fully owned by you. Transfer it or list it for sale on our marketplace at any price.",
              },
              {
                q: "How does the yield system work?",
                a: "You earn from transaction fees when people send to your @username, staking rewards, marketplace trading fees, and referral bonuses.",
              },
              {
                q: "Does my username work on other chains?",
                a: "Yes! Your @username resolves to wallet addresses on Solana, Ethereum, Base, and other chains.",
              },
              {
                q: "What if I don't renew?",
                a: "Standard names have a small annual renewal fee (0.05 SOL). If not renewed within 30 days, it becomes available again.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6"
              >
                <summary className="font-bold text-xl cursor-pointer text-teal-400 list-none">
                  {faq.q}
                </summary>
                <p className="mt-4 text-gray-300 text-lg">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-gradient-to-r from-teal-900 to-indigo-900">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-8">
            Ready to Claim Your Universal Identity?
          </h2>
          <p className="text-2xl text-teal-200 mb-12">
            Join thousands earning passive yield from their @username
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-5 bg-white text-teal-700 px-14 py-6 rounded-full text-2xl font-bold hover:shadow-2xl hover:shadow-teal-500/50 transition-all"
          >
            Launch App
            <ArrowRight className="w-8 h-8" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="mb-8">
                <Image
                  src="/vyns-logo.png"
                  alt="VYNS Logo"
                  width={180}
                  height={48}
                  className="object-contain"
                />
              </div>
              <p className="text-gray-400 text-lg">
                VYNS — Universal Human-Readable Name Service with built-in yield
                generation.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">Product</h4>
              <ul className="space-y-5 text-gray-400 text-lg">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <Link
                    href="/app"
                    className="hover:text-white transition-colors"
                  >
                    Launch App
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Marketplace
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">
                Resources
              </h4>
              <ul className="space-y-5 text-gray-400 text-lg">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">
                Community
              </h4>
              <div className="flex space-x-6">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Twitter className="w-7 h-7" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Github className="w-7 h-7" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-gray-800 text-center text-gray-500 text-base">
            <p>© 2025 VYNS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
