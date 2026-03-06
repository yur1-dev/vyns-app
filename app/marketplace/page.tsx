"use client";

// app/marketplace/page.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Clock,
  TrendingUp,
  ArrowLeft,
  Filter,
  Zap,
  Crown,
  Diamond,
  Tag,
  ChevronRight,
  Loader2,
} from "lucide-react";

// ── Tier config (mirrors dashboard) ──────────────────────────────────────────

const TIER_CONFIG = {
  Diamond: {
    cls: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    label: "Diamond",
    chars: "1–3",
  },
  Platinum: {
    cls: "text-purple-300 bg-purple-500/10 border-purple-500/25",
    label: "Platinum",
    chars: "4–5",
  },
  Gold: {
    cls: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    label: "Gold",
    chars: "6–8",
  },
  Silver: {
    cls: "text-slate-300 bg-slate-500/10 border-slate-500/25",
    label: "Silver",
    chars: "9–15",
  },
  Bronze: {
    cls: "text-orange-400/70 bg-orange-500/8 border-orange-500/20",
    label: "Bronze",
    chars: "16+",
  },
} as const;

function getTier(username: string) {
  const n = username.replace("@", "").length;
  if (n <= 3) return "Diamond";
  if (n <= 5) return "Platinum";
  if (n <= 8) return "Gold";
  if (n <= 15) return "Silver";
  return "Bronze";
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Logo ──────────────────────────────────────────────────────────────────────

function VYNSLogo({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const dim = { sm: 32, md: 40, lg: 56, xl: 64 }[size];
  return (
    <div style={{ width: dim, height: dim }} className="relative shrink-0">
      <Image
        src="/vyns-logo.png"
        alt="VYNS"
        width={dim}
        height={dim}
        className="object-contain"
        priority
      />
    </div>
  );
}

// ── Listing Card ──────────────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const clean = listing.username.replace("@", "");
  const tier = (listing.tier as keyof typeof TIER_CONFIG) ?? getTier(clean);
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.Bronze;
  const listedDate = new Date(listing.listedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/username/${clean}`}
      className="group relative flex flex-col p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200"
    >
      {/* Tier badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${cfg.cls}`}
        >
          <Crown className="w-2.5 h-2.5" /> {cfg.label}
        </span>
        <span className="text-[10px] text-white/20">{listedDate}</span>
      </div>

      {/* Username */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white group-hover:text-teal-300 transition-colors truncate">
          @{clean}
        </h3>
        <p className="text-xs text-white/30 mt-1">
          {clean.length} chars · Level {listing.level}
        </p>
      </div>

      {/* Price + owner */}
      <div className="mt-auto space-y-2.5">
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
            {listing.owner.slice(0, 4)}…{listing.owner.slice(-4)}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <span className="text-xs text-teal-400 font-medium group-hover:text-teal-300 transition-colors">
            View & Buy
          </span>
          <ChevronRight className="w-4 h-4 text-teal-400/50 group-hover:text-teal-300 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const router = useRouter();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "recent" | "price-low" | "price-high" | "level"
  >("recent");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchListings();
  }, [filter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketplace?sort=${filter}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setListings(data.listings || []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = listings.filter((l) =>
    l.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#060b14]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <VYNSLogo size="md" />
            </Link>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white/60 hover:text-white hover:border-white/[0.14] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs text-teal-400 font-semibold tracking-widest uppercase mb-3">
              Marketplace
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
              Premium username
              <br />
              marketplace
            </h1>
            <p className="text-base text-white/40 mb-8">
              Discover, buy, and trade rare @usernames on Solana. Short names
              earn more yield.
            </p>

            {/* Search */}
            <div className="relative max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search usernames…"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 px-4 pl-11 text-sm text-white placeholder-white/20 focus:outline-none focus:border-teal-500/40 focus:ring-2 focus:ring-teal-500/10 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Tier info strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
          {Object.entries(TIER_CONFIG).map(([tier, cfg]) => (
            <div
              key={tier}
              className={`px-3 py-2.5 rounded-xl border text-center ${cfg.cls}`}
            >
              <p className="text-[10px] font-semibold opacity-80">
                {cfg.label}
              </p>
              <p className="text-[10px] opacity-40">{cfg.chars} chars</p>
            </div>
          ))}
        </div>

        {/* Filters + count */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <p className="text-sm text-white/30">
            {filtered.length} {filtered.length === 1 ? "listing" : "listings"}{" "}
            {search ? `matching "${search}"` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                  filter === f.id
                    ? "bg-teal-500/15 border-teal-500/30 text-teal-300"
                    : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/[0.12]"
                }`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-teal-400/50 animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((listing) => (
              <ListingCard key={listing.username} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-white/15" />
            </div>
            <p className="text-sm text-white/40 font-medium">
              No listings found
            </p>
            <p className="text-xs text-white/20 mt-1">
              {search
                ? "Try a different search term"
                : "Check back soon or try changing filters"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
