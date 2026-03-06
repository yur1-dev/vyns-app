"use client";

// components/dashboard/tabs/MarketplaceTab.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  TrendingUp,
  Tag,
  Zap,
  Crown,
  ChevronRight,
  Loader2,
  Check,
} from "lucide-react";
import { SectionTitle } from "@/components/dashboard/ui";

const TIER_CONFIG = {
  Diamond: {
    cls: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    label: "💎 Diamond",
    chars: "1–3",
  },
  Platinum: {
    cls: "text-purple-300 bg-purple-500/10 border-purple-500/25",
    label: "⬡ Platinum",
    chars: "4–5",
  },
  Gold: {
    cls: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    label: "✦ Gold",
    chars: "6–8",
  },
  Silver: {
    cls: "text-slate-300 bg-slate-500/10 border-slate-500/25",
    label: "◈ Silver",
    chars: "9–15",
  },
  Bronze: {
    cls: "text-orange-300/70 bg-orange-500/[0.08] border-orange-500/20",
    label: "◉ Bronze",
    chars: "16+",
  },
} as const;

function getTier(username: string) {
  const n = username.replace(/^@/, "").length;
  if (n <= 3) return "Diamond";
  if (n <= 5) return "Platinum";
  if (n <= 8) return "Gold";
  if (n <= 15) return "Silver";
  return "Bronze";
}

interface MarketplaceListing {
  username: string;
  price: number;
  owner: string;
  level: number;
  listedAt: string;
  tier?: string;
}

const FILTERS = [
  { id: "recent", label: "Recent", icon: <Clock className="w-3.5 h-3.5" /> },
  {
    id: "price-low",
    label: "Price: Low → High",
    icon: <Tag className="w-3.5 h-3.5" />,
  },
  {
    id: "price-high",
    label: "Price: High → Low",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
  },
  {
    id: "level",
    label: "Highest Level",
    icon: <Zap className="w-3.5 h-3.5" />,
  },
] as const;

function ListingCard({
  listing,
  currentUserId,
}: {
  listing: MarketplaceListing;
  currentUserId: string | null;
}) {
  const clean = listing.username.replace(/^@/, "");
  const tier = (listing.tier as keyof typeof TIER_CONFIG) ?? getTier(clean);
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.Bronze;
  const listedDate = new Date(listing.listedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Owner check — listing.owner stores userId for email users
  const isOwner = !!(
    currentUserId &&
    listing.owner &&
    (listing.owner === currentUserId ||
      listing.owner.slice(0, 8) === currentUserId.slice(0, 8))
  );

  return (
    <Link
      href={`/username/${clean}`}
      className="group flex flex-col p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10] hover:bg-white/[0.03] transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${cfg.cls}`}
        >
          {cfg.label}
        </span>
        <span className="text-[10px] text-white/20">{listedDate}</span>
      </div>

      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white group-hover:text-teal-300 transition-colors truncate">
          @{clean}
        </h3>
        <p className="text-xs text-white/30 mt-1">
          {clean.length} chars · Level {listing.level}
        </p>
      </div>

      <div className="mt-auto space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">Price</span>
          <span className="text-lg font-bold text-white tabular-nums">
            {listing.price}{" "}
            <span className="text-sm font-normal text-white/40">SOL</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">Owner</span>
          <span className="font-mono text-xs text-white/40">
            {isOwner ? (
              <span className="text-teal-400 font-medium not-mono">You</span>
            ) : (
              `${listing.owner.slice(0, 4)}…${listing.owner.slice(-4)}`
            )}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
        {isOwner ? (
          <>
            <span className="text-xs text-white/30 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-teal-400" /> Your listing
            </span>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
          </>
        ) : (
          <>
            <span className="text-xs text-teal-400 font-medium group-hover:text-teal-300 transition-colors">
              View & Buy
            </span>
            <ChevronRight className="w-4 h-4 text-teal-400/50 group-hover:text-teal-300 group-hover:translate-x-0.5 transition-all" />
          </>
        )}
      </div>
    </Link>
  );
}

export default function MarketplaceTab() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "recent" | "price-low" | "price-high" | "level"
  >("recent");
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Fetch current user ID for ownership checks
    fetch("/api/user/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setCurrentUserId(data.user?._id ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchListings();
  }, [filter]);

  async function fetchListings() {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketplace?sort=${filter}`);
      const data = await res.json();
      setListings(data.listings ?? []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = listings.filter((l) =>
    l.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <SectionTitle>Marketplace</SectionTitle>

      {/* Tier reference strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Object.entries(TIER_CONFIG).map(([tier, cfg]) => (
          <div
            key={tier}
            className={`px-3 py-2.5 rounded-xl border text-center ${cfg.cls}`}
          >
            <p className="text-[10px] font-semibold opacity-80">{cfg.label}</p>
            <p className="text-[10px] opacity-40">{cfg.chars} chars</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search usernames…"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 px-4 pl-10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-teal-500/40 focus:ring-2 focus:ring-teal-500/10 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                filter === f.id
                  ? "bg-teal-500/15 border-teal-500/30 text-teal-300"
                  : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/[0.12]"
              }`}
            >
              {f.icon}
              <span className="hidden sm:inline">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/25">
        {filtered.length} {filtered.length === 1 ? "listing" : "listings"}
        {search ? ` matching "${search}"` : ""}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-teal-400/40 animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.username}
              listing={listing}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-white/15" />
          </div>
          <p className="text-sm text-white/40 font-medium">No listings found</p>
          <p className="text-xs text-white/20 mt-1">
            {search
              ? "Try a different search term"
              : "Check back soon or try changing filters"}
          </p>
        </div>
      )}
    </div>
  );
}
