"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, TrendingUp, Clock } from "lucide-react";

interface MarketplaceListing {
  username: string;
  price: number;
  owner: string;
  level: number;
  listedAt: string;
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("recent"); // recent, price-low, price-high, level

  useEffect(() => {
    fetchListings();
  }, [filter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/marketplace?sort=${filter}`);
      const data = await response.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-900/20 to-indigo-900/20 border-b border-gray-800">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Username <span className="text-teal-400">Marketplace</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8 sm:mb-10 px-2">
            Buy, sell, and trade premium @usernames
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative px-2">
            <Search className="absolute left-7 sm:left-5 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search marketplace..."
              className="w-full bg-gray-800/60 border border-gray-700 rounded-full py-3 sm:py-4 px-4 sm:px-6 pl-11 sm:pl-14 text-sm sm:text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Filters & Listings */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="text-sm sm:text-base text-gray-400">
            {listings.length} usernames listed
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setFilter("recent")}
              className={`px-3 sm:px-4 py-2 rounded-full transition-all text-xs sm:text-sm font-medium whitespace-nowrap ${
                filter === "recent"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <Clock className="w-3.5 sm:w-4 h-3.5 sm:h-4 inline mr-1.5 sm:mr-2" />
              Recent
            </button>
            <button
              onClick={() => setFilter("price-low")}
              className={`px-3 sm:px-4 py-2 rounded-full transition-all text-xs sm:text-sm font-medium whitespace-nowrap ${
                filter === "price-low"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Price Low
            </button>
            <button
              onClick={() => setFilter("level")}
              className={`px-3 sm:px-4 py-2 rounded-full transition-all text-xs sm:text-sm font-medium whitespace-nowrap ${
                filter === "level"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <TrendingUp className="w-3.5 sm:w-4 h-3.5 sm:h-4 inline mr-1.5 sm:mr-2" />
              Level
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-16 sm:py-20">
            <div className="inline-block w-12 sm:w-16 h-12 sm:h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {listings.map((listing) => (
              <Link
                key={listing.username}
                href={`/username/${listing.username.replace("@", "")}`}
                className="bg-gray-800/40 border border-gray-700 rounded-2xl p-4 sm:p-6 hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/20 transition-all group"
              >
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-2xl font-bold text-teal-400 group-hover:text-teal-300 truncate">
                      {listing.username}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                      Level {listing.level}
                    </p>
                  </div>
                  <div className="bg-teal-900/40 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm text-teal-300 border border-teal-800 whitespace-nowrap flex-shrink-0">
                    For Sale
                  </div>
                </div>

                <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-400">Price:</span>
                    <span className="font-bold text-lg sm:text-xl text-white">
                      {listing.price} SOL
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-400">Owner:</span>
                    <span className="font-mono text-xs text-gray-300">
                      {listing.owner.slice(0, 4)}...{listing.owner.slice(-4)}
                    </span>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-teal-600 to-indigo-700 text-white py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base group-hover:shadow-lg transition-all">
                  View Details
                </button>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && listings.length === 0 && (
          <div className="text-center py-16 sm:py-20">
            <p className="text-lg sm:text-xl text-gray-400">
              No listings found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
