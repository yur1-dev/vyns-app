"use client";

// app/search/page.tsx

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  CheckCircle2,
  XCircle,
  Crown,
  Wallet,
  TrendingUp,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  tierFromLen,
  priceFromLen,
  TIER_CONFIG,
  Pill,
} from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

interface UsernameResult {
  username: string;
  available: boolean;
  owner?: string;
  price?: number;
  level?: number;
  totalYield?: number;
  registeredAt?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SimilarChip({
  username,
  available,
  onClick,
}: {
  username: string;
  available: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.10] transition-all cursor-pointer group w-full text-left"
    >
      <div>
        <p className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
          @{username}
        </p>
        <p
          className={`text-[11px] mt-0.5 ${available ? "text-teal-400" : "text-white/25"}`}
        >
          {available ? "Available" : "Taken"}
        </p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-white/15 group-hover:text-teal-400 transition-colors shrink-0" />
    </button>
  );
}

// ── Inner page ────────────────────────────────────────────────────────────────

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query =
    searchParams
      .get("q")
      ?.toLowerCase()
      .replace(/[^a-z0-9_]/g, "") || "";

  const [result, setResult] = useState<UsernameResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [similar, setSimilar] = useState<
    { username: string; available: boolean }[]
  >([]);
  const [input, setInput] = useState(query);
  const [copiedOwner, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimErr, setClaimErr] = useState("");

  const tier = query.length > 0 ? tierFromLen(query.length) : null;
  const tierCfg = tier ? TIER_CONFIG[tier] : null;

  useEffect(() => {
    if (!query) return;
    setInput(query);
    search(query);
    setSimilar(generateSimilar(query));
  }, [query]);

  const search = async (q: string) => {
    setLoading(true);
    setError("");
    setResult(null);
    setClaimed(false);
    setClaimErr("");
    try {
      const res = await fetch(
        `/api/usernames/search?q=${encodeURIComponent(q)}`,
      );
      const data = await res.json();
      if (res.ok) setResult(data);
      else setError(data.error || "Not found");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateSimilar = (u: string) => [
    { username: `${u}hub`, available: true },
    { username: `${u}dao`, available: true },
    { username: `${u}labs`, available: false },
    { username: `${u}ai`, available: true },
    { username: `the${u}`, available: true },
    { username: `${u}xyz`, available: true },
    { username: `${u}alpha`, available: true },
    { username: `${u}official`, available: false },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = input.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (clean) router.push(`/search?q=${encodeURIComponent(clean)}`);
  };

  const handleClaim = async () => {
    if (!query) return;
    setClaiming(true);
    setClaimErr("");
    try {
      const res = await fetch("/api/usernames/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: query }),
      });
      const data = await res.json();
      if (data.success) setClaimed(true);
      else setClaimErr(data.error || "Failed to claim");
    } catch {
      setClaimErr("Connection error");
    } finally {
      setClaiming(false);
    }
  };

  const copyOwner = () => {
    if (result?.owner) {
      navigator.clipboard.writeText(result.owner);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-200 antialiased">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-64 -left-64 w-[800px] h-[800px] rounded-full bg-teal-600/[0.04] blur-[200px]" />
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.05] blur-[180px]" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#060b14]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/vyns-logo.png"
              alt="VYNS"
              width={80}
              height={24}
              className="object-contain opacity-90 hover:opacity-100 transition-opacity"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-400 text-sm font-medium hover:bg-teal-500/25 transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-8">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search any username…"
              className="w-full h-12 pl-11 pr-28 rounded-2xl border border-white/[0.07] bg-white/[0.03] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/40 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 text-sm font-medium hover:bg-teal-500/30 transition-all cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>

        {!query && (
          <div className="text-center py-20">
            <Search className="h-10 w-10 mx-auto mb-4 text-white/10" />
            <p className="text-white/30 text-sm">
              Enter a username above to check availability
            </p>
          </div>
        )}

        {query && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Query heading */}
              <div>
                <p className="text-xs text-white/25 uppercase tracking-widest mb-1">
                  Searching for
                </p>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  <span className="text-white/30">@</span>
                  {query}
                </h1>
                {tierCfg && (
                  <div className="flex items-center gap-2 mt-2">
                    <Pill className={tierCfg.cls}>{tierCfg.label}</Pill>
                    <span className="text-xs text-white/25">
                      · {priceFromLen(query.length)} SOL base price
                    </span>
                  </div>
                )}
              </div>

              {/* Loading */}
              {loading && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
                  <p className="text-sm text-white/30">
                    Checking availability…
                  </p>
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                  <p className="text-sm text-white/60">{error}</p>
                </div>
              )}

              {/* Available */}
              {result?.available && !loading && (
                <div className="rounded-2xl border border-teal-500/20 bg-teal-500/[0.04] overflow-hidden">
                  <div className="p-5 flex items-start gap-3 border-b border-teal-500/10">
                    <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-teal-400">
                        Available
                      </p>
                      <p className="text-xs text-white/35 mt-0.5">
                        This username is ready to be claimed.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <p className="text-xs text-white/30 mb-1">Price</p>
                        <p className="text-lg font-bold text-white tabular-nums">
                          {priceFromLen(query.length)} SOL
                        </p>
                        <p className="text-[10px] text-teal-400 mt-0.5">
                          Free during beta
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <p className="text-xs text-white/30 mb-1">Tier</p>
                        {tierCfg && (
                          <Pill className={`${tierCfg.cls} mt-1`}>
                            {tierCfg.label}
                          </Pill>
                        )}
                      </div>
                    </div>

                    {claimed ? (
                      <div className="flex items-center gap-2 p-3.5 rounded-xl bg-teal-500/[0.08] border border-teal-500/20 text-teal-400 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>
                          @{query} successfully claimed!{" "}
                          <Link
                            href="/dashboard"
                            className="underline underline-offset-2"
                          >
                            Go to dashboard →
                          </Link>
                        </span>
                      </div>
                    ) : (
                      <>
                        {claimErr && (
                          <p className="text-xs text-red-400 px-1">
                            {claimErr} ·{" "}
                            <Link href="/login" className="underline">
                              Sign in first
                            </Link>
                          </p>
                        )}
                        <button
                          onClick={handleClaim}
                          disabled={claiming}
                          className="w-full h-11 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 text-sm font-semibold hover:bg-teal-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                        >
                          {claiming ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Crown className="h-4 w-4" />
                          )}
                          {claiming ? "Claiming…" : `Claim @${query}`}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Taken */}
              {result && !result.available && !loading && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="p-5 flex items-start gap-3 border-b border-white/[0.04]">
                    <XCircle className="h-5 w-5 text-red-400/70 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-400/80">
                        Already Registered
                      </p>
                      <p className="text-xs text-white/35 mt-0.5">
                        This username is owned by another user.
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-white/[0.04]">
                    {result.owner && (
                      <div className="flex items-center justify-between px-5 py-3.5">
                        <div>
                          <p className="text-xs text-white/30">Owner</p>
                          <p className="text-xs font-mono text-white/50 mt-0.5">
                            {result.owner.slice(0, 12)}…{result.owner.slice(-8)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={copyOwner}
                            className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer"
                          >
                            {copiedOwner ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <a
                            href={`https://solscan.io/account/${result.owner}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.05] transition-all"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 divide-x divide-white/[0.04]">
                      {result.level && (
                        <div className="px-5 py-3.5">
                          <p className="text-xs text-white/30">Level</p>
                          <p className="text-lg font-bold text-white mt-0.5">
                            {result.level}
                          </p>
                        </div>
                      )}
                      {result.totalYield !== undefined && (
                        <div className="px-5 py-3.5">
                          <p className="text-xs text-white/30">Yield earned</p>
                          <p className="text-lg font-bold text-white mt-0.5">
                            {result.totalYield} SOL
                          </p>
                        </div>
                      )}
                      {result.registeredAt && (
                        <div className="px-5 py-3.5">
                          <p className="text-xs text-white/30">Registered</p>
                          <p className="text-sm font-semibold text-white mt-0.5">
                            {new Date(result.registeredAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {result.price && (
                      <div className="p-5">
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05]">
                          <div>
                            <p className="text-xs text-white/30">
                              Listed for sale
                            </p>
                            <p className="text-lg font-bold text-amber-400 tabular-nums mt-0.5">
                              {result.price} SOL
                            </p>
                          </div>
                          <Link
                            href={`/marketplace/${query}`}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-all"
                          >
                            Buy now <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Similar names */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="px-4 pt-4 pb-3 border-b border-white/[0.04]">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                    Similar usernames
                  </p>
                </div>
                <div className="p-3 space-y-1.5">
                  {similar.slice(0, 6).map((s) => (
                    <SimilarChip
                      key={s.username}
                      username={s.username}
                      available={s.available}
                      onClick={() => router.push(`/search?q=${s.username}`)}
                    />
                  ))}
                </div>
              </div>

              {/* Platform stats */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="px-4 pt-4 pb-3 border-b border-white/[0.04]">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                    Platform stats
                  </p>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {[
                    {
                      label: "Total registered",
                      value: "12,847",
                      accent: "text-white/70",
                    },
                    {
                      label: "Available now",
                      value: "8,432",
                      accent: "text-teal-400",
                    },
                    {
                      label: "Listed for sale",
                      value: "234",
                      accent: "text-amber-400",
                    },
                    {
                      label: "Floor price",
                      value: "0.05 SOL",
                      accent: "text-emerald-400",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <p className="text-xs text-white/35">{s.label}</p>
                      <p
                        className={`text-sm font-semibold tabular-nums ${s.accent}`}
                      >
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060b14] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
