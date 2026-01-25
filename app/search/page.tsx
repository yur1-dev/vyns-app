"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  Calendar,
  Wallet,
  Sparkles,
  Search,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

interface UsernameResult {
  username: string;
  available: boolean;
  owner?: string;
  price?: number;
  level?: number;
  totalYield?: number;
  registeredAt?: string;
}

interface SimilarUsername {
  username: string;
  available: boolean;
  price?: number;
  level?: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q")?.toLowerCase() || "";

  const [result, setResult] = useState<UsernameResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [similarNames, setSimilarNames] = useState<SimilarUsername[]>([]);
  const [newSearch, setNewSearch] = useState(query);
  const [copiedOwner, setCopiedOwner] = useState(false);

  useEffect(() => {
    if (query) {
      searchUsername(query);
      generateSimilarNames(query);
    } else {
      setLoading(false);
    }
  }, [query]);

  const searchUsername = async (username: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/usernames/search?q=${encodeURIComponent(username)}`,
      );
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Username not found");
      }
    } catch (err) {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateSimilarNames = (username: string) => {
    const alternatives: SimilarUsername[] = [
      { username: `${username}hub`, available: true, level: 1 },
      { username: `${username}dao`, available: true, level: 1 },
      { username: `${username}labs`, available: false, price: 20, level: 5 },
      { username: `${username}ai`, available: true, level: 1 },
      { username: `${username}nft`, available: false, price: 15, level: 3 },
      { username: `${username}xyz`, available: true, level: 1 },
      { username: `the${username}`, available: true, level: 1 },
      {
        username: `${username}official`,
        available: false,
        price: 25,
        level: 8,
      },
      { username: `${username}alpha`, available: true, level: 1 },
      { username: `${username}degen`, available: true, level: 1 },
    ];
    setSimilarNames(alternatives);
  };

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(newSearch.trim())}`);
    }
  };

  const copyOwnerAddress = () => {
    if (result?.owner) {
      navigator.clipboard.writeText(result.owner);
      setCopiedOwner(true);
      setTimeout(() => setCopiedOwner(false), 2000);
    }
  };

  if (!query) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center px-4">
        <div className="text-center">
          <Search className="w-16 h-16 md:w-24 md:h-24 text-gray-600 mx-auto mb-6" />
          <p className="text-xl md:text-2xl text-gray-400">
            No username searched yet.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-teal-400 hover:text-teal-300"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-gray-100">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-400 to-indigo-500 bg-clip-text text-transparent"
            >
              VYNS
            </Link>
            <div className="flex items-center gap-3 sm:gap-6">
              <Link
                href="/marketplace"
                className="text-sm sm:text-base text-gray-300 hover:text-white transition"
              >
                Marketplace
              </Link>
              <Link
                href="/app"
                className="bg-gradient-to-r from-teal-600 to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-semibold hover:shadow-lg transition-all"
              >
                Launch App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column: Search Result */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Search Again Box */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-300">
                Search another username
              </h3>
              <form onSubmit={handleNewSearch} className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <input
                  type="text"
                  value={newSearch}
                  onChange={(e) => setNewSearch(e.target.value)}
                  placeholder="Enter username..."
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg sm:rounded-xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-20 sm:pr-24 text-sm sm:text-base text-gray-100 focus:outline-none focus:border-teal-500 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 bg-teal-600 hover:bg-teal-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-sm sm:text-base font-medium transition-all"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Search Result Header */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-gray-800 rounded-lg px-2.5 sm:px-3 py-1 text-xs sm:text-sm text-gray-400">
                  Search result
                </div>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                <div className="text-xs sm:text-sm text-gray-500">
                  Your search
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold break-all">
                <span className="text-teal-400">@{query}</span>
              </h1>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl sm:rounded-2xl p-12 sm:p-16 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 sm:mb-6" />
                <p className="text-lg sm:text-xl text-gray-300">
                  Searching blockchain...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
                <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-3 sm:mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-red-400">
                  Error
                </h2>
                <p className="text-sm sm:text-base text-gray-300">{error}</p>
              </div>
            )}

            {/* Available Result */}
            {result && !loading && result.available && (
              <div className="bg-gradient-to-br from-teal-900/30 to-indigo-900/30 border-2 border-teal-500/50 rounded-xl sm:rounded-2xl overflow-hidden">
                <div className="p-5 sm:p-8">
                  <div className="mb-4 sm:mb-6">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                      <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-teal-400 flex-shrink-0" />
                      <span className="bg-teal-900/50 text-teal-300 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold border border-teal-700">
                        AVAILABLE
                      </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 break-all">
                      @{result.username}
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-gray-300">
                      Be the first owner of this username
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-black/40 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">
                        Registration
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-teal-400">
                        0.1 SOL
                      </p>
                    </div>
                    <div className="bg-black/40 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">
                        Annual Fee
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-teal-400">
                        0.05 SOL
                      </p>
                    </div>
                    <div className="bg-black/40 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">
                        Est. Yield
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-yellow-400">
                        5%+ APY
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/app/claim?username=${result.username}`}
                    className="flex items-center justify-center gap-2 sm:gap-3 w-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:shadow-xl hover:shadow-teal-500/50 transition-all group"
                  >
                    Claim @{result.username}
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </Link>
                </div>
              </div>
            )}

            {/* Taken Result */}
            {result && !loading && !result.available && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl sm:rounded-2xl overflow-hidden">
                <div className="p-5 sm:p-8">
                  <div className="mb-4 sm:mb-6">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                      <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-400 flex-shrink-0" />
                      <span className="bg-red-900/50 text-red-300 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold border border-red-700">
                        TAKEN
                      </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 break-all">
                      @{result.username}
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-gray-400">
                      This username is already registered
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-black/40 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-gray-700">
                      <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400 mb-2 sm:mb-3" />
                      <p className="text-xs sm:text-sm text-gray-400 mb-2">
                        Owner
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs sm:text-sm text-teal-300 truncate flex-1">
                          {result.owner
                            ? `${result.owner.slice(
                                0,
                                6,
                              )}...${result.owner.slice(-4)}`
                            : "Unknown"}
                        </p>
                        {result.owner && (
                          <button
                            onClick={copyOwnerAddress}
                            className="flex-shrink-0 p-1.5 hover:bg-gray-700 rounded transition-colors"
                            title="Copy address"
                          >
                            {copiedOwner ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-black/40 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-gray-700">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 mb-2 sm:mb-3" />
                      <p className="text-xs sm:text-sm text-gray-400 mb-2">
                        Level
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-indigo-300">
                        {result.level || 1}
                      </p>
                    </div>

                    <div className="bg-black/40 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-gray-700">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400 mb-2 sm:mb-3" />
                      <p className="text-xs sm:text-sm text-gray-400 mb-2">
                        Registered
                      </p>
                      <p className="text-base sm:text-lg font-semibold text-gray-300">
                        {result.registeredAt || "N/A"}
                      </p>
                    </div>

                    <div className="bg-black/40 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-gray-700">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mb-2 sm:mb-3" />
                      <p className="text-xs sm:text-sm text-gray-400 mb-2">
                        Price
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-yellow-300 truncate">
                        {result.price ? `${result.price} SOL` : "Not Listed"}
                      </p>
                    </div>
                  </div>

                  {result.price ? (
                    <Link
                      href={`/username/${result.username}`}
                      className="flex items-center justify-center gap-2 sm:gap-3 w-full bg-gradient-to-r from-teal-600 to-indigo-700 text-white py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:shadow-xl transition-all group"
                    >
                      View Details & Make Offer
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    </Link>
                  ) : (
                    <div className="text-center py-4 sm:py-6 text-gray-400">
                      <p className="text-base sm:text-lg">
                        Not currently for sale
                      </p>
                      <p className="text-xs sm:text-sm mt-2">
                        Check the marketplace for similar names
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Recommended Alternatives */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4 sm:space-y-6">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400 flex-shrink-0" />
                  <h3 className="text-lg sm:text-xl font-bold">
                    Recommended Alternatives
                  </h3>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {similarNames.map((name, index) => (
                    <Link
                      key={index}
                      href={`/search?q=${name.username}`}
                      className="block bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-teal-600 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                        <span className="font-bold text-base sm:text-lg text-teal-400 group-hover:text-teal-300 truncate flex-1">
                          @{name.username}
                        </span>
                        {name.available ? (
                          <span className="bg-teal-900/50 text-teal-300 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold border border-teal-700 flex-shrink-0">
                            Available
                          </span>
                        ) : (
                          <span className="bg-gray-700 text-gray-300 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold flex-shrink-0">
                            Taken
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-400 truncate">
                          {name.available
                            ? "0.1 SOL"
                            : name.price
                              ? `${name.price} SOL`
                              : "Not listed"}
                        </span>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 group-hover:text-teal-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>

                <Link
                  href="/marketplace"
                  className="mt-4 sm:mt-6 flex items-center justify-center gap-2 w-full border-2 border-gray-700 hover:border-teal-600 text-gray-300 hover:text-teal-400 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all"
                >
                  Browse All Names
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-teal-900/20 to-indigo-900/20 border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-400 mb-3 sm:mb-4">
                  VYNS STATS
                </h4>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm sm:text-base text-gray-400">
                      Total Names
                    </span>
                    <span className="font-bold text-sm sm:text-base text-teal-400">
                      250K+
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm sm:text-base text-gray-400">
                      Avg Price
                    </span>
                    <span className="font-bold text-sm sm:text-base text-indigo-400">
                      2.5 SOL
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm sm:text-base text-gray-400">
                      Market Cap
                    </span>
                    <span className="font-bold text-sm sm:text-base text-yellow-400">
                      $420M
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-teal-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
