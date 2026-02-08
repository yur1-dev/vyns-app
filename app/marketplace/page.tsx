"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Clock, TrendingUp, ArrowLeft } from "lucide-react";

// Reuse the same VYNSLogo component from your dashboard
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

interface MarketplaceListing {
  username: string;
  price: number;
  owner: string;
  level: number;
  listedAt: string;
}

export default function MarketplacePage() {
  const router = useRouter();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "recent" | "price-low" | "price-high" | "level"
  >("recent");

  useEffect(() => {
    fetchListings();
  }, [filter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/marketplace?sort=${filter}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error("Failed to fetch listings:", error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Header with the SAME logo style as dashboard */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-lg border-b border-gray-800/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo – exactly the same way as in dashboard header (size="lg") */}
            <Link
              href="/"
              className="flex items-center gap-3 sm:gap-4 hover:opacity-90 transition-opacity"
            >
              <VYNSLogo size="xl" />
              {/* <span className="hidden sm:block text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                VYNS
              </span> */}
            </Link>

            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/70 hover:bg-gray-700/80 border border-gray-700 rounded-lg text-sm font-medium transition-all hover:shadow-md hover:shadow-teal-500/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-950/40 via-indigo-950/30 to-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 tracking-tight">
            Username <span className="text-teal-400">Marketplace</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Discover, buy, sell, and trade premium @usernames on Solana
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative px-2">
            <Search className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search usernames..."
              className="w-full bg-gray-900/60 border border-gray-700 rounded-full py-3.5 sm:py-4 px-5 sm:px-7 pl-12 sm:pl-14 text-sm sm:text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-6 mb-8">
          <div className="text-sm sm:text-base text-gray-400 font-medium">
            {listings.length} {listings.length === 1 ? "username" : "usernames"}{" "}
            listed
          </div>

          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <button
              onClick={() => setFilter("recent")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === "recent"
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1.5" />
              Recent
            </button>

            <button
              onClick={() => setFilter("price-low")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === "price-low"
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
              }`}
            >
              Price: Low to High
            </button>

            <button
              onClick={() => setFilter("level")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === "level"
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1.5" />
              Highest Level
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-14 h-14 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {listings.map((listing) => (
              <Link
                key={listing.username}
                href={`/username/${listing.username.replace("@", "")}`}
                className="group bg-gray-900/40 border border-gray-800 rounded-2xl p-5 sm:p-6 hover:border-teal-600/60 hover:shadow-xl hover:shadow-teal-900/20 transition-all duration-300"
              >
                <div className="flex justify-between items-start gap-4 mb-5">
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-teal-400 group-hover:text-teal-300 truncate">
                      {listing.username}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Level {listing.level}
                    </p>
                  </div>
                  <div className="bg-teal-950/50 px-3 py-1 rounded-full text-sm text-teal-300 border border-teal-800/50 whitespace-nowrap">
                    For Sale
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price</span>
                    <span className="font-bold text-white text-lg">
                      {listing.price} SOL
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Owner</span>
                    <span className="font-mono text-gray-300">
                      {listing.owner.slice(0, 4)}...{listing.owner.slice(-4)}
                    </span>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white py-3 rounded-xl font-semibold text-base transition-all group-hover:shadow-lg group-hover:shadow-teal-500/20">
                  View & Buy
                </button>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400">
              No listings found at the moment.
            </p>
            <p className="text-gray-500 mt-2">
              Check back soon or try changing filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
