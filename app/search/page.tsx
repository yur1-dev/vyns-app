"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

// ────────────────────────────────────────────────
// Same VYNSLogo component used in dashboard & marketplace
// ────────────────────────────────────────────────
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="flex items-center hover:opacity-90 transition-opacity"
            >
              <VYNSLogo size="xl" />
            </Link>

            <div className="flex items-center gap-6 sm:gap-8">
              <Link
                href="/marketplace"
                className="text-sm sm:text-base text-gray-300 hover:text-white transition"
              >
                Marketplace
              </Link>
              <Link
                href="/app"
                className="bg-gradient-to-r from-teal-600 to-indigo-700 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-semibold hover:shadow-lg transition-all"
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
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl sm:rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mb-4"></div>
                <p className="text-gray-400 text-sm sm:text-base">
                  Searching for @{query}...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-900/20 border border-red-800 rounded-xl sm:rounded-2xl p-6 sm:p-8">
                <div className="flex items-start gap-3 sm:gap-4">
                  <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-red-400 mb-2">
                      Error
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Result - Available */}
            {result && !loading && result.available && (
              <div className="bg-gradient-to-br from-green-900/20 to-teal-900/20 border border-green-800/50 rounded-xl sm:rounded-2xl p-6 sm:p-8">
                <div className="flex items-start gap-3 sm:gap-4 mb-6">
                  <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-green-400 mb-2">
                      Available!
                    </h2>
                    <p className="text-gray-300 text-sm sm:text-base">
                      This username is available for registration.
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Wallet className="w-4 h-4" />
                      <span>Registration Price</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {result.price || 10} VYNS
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Starting Level</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      Level {result.level || 1}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/app?register=${query}`}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  Register @{query}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}

            {/* Result - Taken */}
            {result && !loading && !result.available && (
              <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-800/50 rounded-xl sm:rounded-2xl p-6 sm:p-8">
                <div className="flex items-start gap-3 sm:gap-4 mb-6">
                  <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-2">
                      Already Registered
                    </h2>
                    <p className="text-gray-300 text-sm sm:text-base">
                      This username is owned by another user.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {result.owner && (
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Wallet className="w-4 h-4" />
                          <span>Owner Address</span>
                        </div>
                        <button
                          onClick={copyOwnerAddress}
                          className="text-teal-400 hover:text-teal-300 transition-colors"
                          title="Copy address"
                        >
                          {copiedOwner ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm font-mono text-white break-all">
                        {result.owner}
                      </p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-3 gap-4">
                    {result.level && (
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                          <Sparkles className="w-4 h-4" />
                          <span>Level</span>
                        </div>
                        <p className="text-lg font-bold text-white">
                          {result.level}
                        </p>
                      </div>
                    )}
                    {result.totalYield !== undefined && (
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>Total Yield</span>
                        </div>
                        <p className="text-lg font-bold text-white">
                          {result.totalYield} VYNS
                        </p>
                      </div>
                    )}
                    {result.registeredAt && (
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                          <Calendar className="w-4 h-4" />
                          <span>Registered</span>
                        </div>
                        <p className="text-sm font-bold text-white">
                          {new Date(result.registeredAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {result.price && (
                    <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">
                          Listed for Sale
                        </span>
                        <span className="text-xl font-bold text-orange-400">
                          {result.price} VYNS
                        </span>
                      </div>
                      <Link
                        href={`/marketplace/${query}`}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                      >
                        View on Marketplace
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Recommended Alternatives */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4 sm:space-y-6">
              {/* Similar Names */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-300">
                  Similar Usernames
                </h3>
                <div className="space-y-2">
                  {similarNames.slice(0, 6).map((name) => (
                    <Link
                      key={name.username}
                      href={`/search?q=${name.username}`}
                      className="block bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg p-3 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            @{name.username}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {name.available ? (
                              <span className="text-green-400">Available</span>
                            ) : (
                              <span className="text-red-400">
                                Taken • {name.price} VYNS
                              </span>
                            )}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-teal-400 transition-colors flex-shrink-0 ml-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-teal-900/20 to-indigo-900/20 border border-teal-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-300">
                  Platform Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      Total Usernames
                    </span>
                    <span className="text-base font-semibold text-white">
                      12,847
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Available Now</span>
                    <span className="text-base font-semibold text-green-400">
                      8,432
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      Listed for Sale
                    </span>
                    <span className="text-base font-semibold text-orange-400">
                      234
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                    <span className="text-sm text-gray-400">Floor Price</span>
                    <span className="text-base font-semibold text-teal-400">
                      15 VYNS
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
