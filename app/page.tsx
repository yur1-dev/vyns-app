"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Search,
  Menu,
  X,
  ChevronDown,
  History,
  AtSign,
  Layers,
  TrendingUp,
  Users,
  ShoppingBag,
  Send,
  Zap,
  Shield,
  Check,
  Twitter,
  Github,
  Coins,
  Globe,
  Sparkles,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────── */
interface LiveStats {
  totalUsernames: number;
  totalUsers: number;
  totalStaked: number;
  totalEarnings: number;
}

interface MarketplaceListing {
  username: string;
  price: number;
  tier: string;
  seller?: string;
}

/* ── FAQ ──────────────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-colors duration-200 ${open ? "border-teal-500/40 bg-white/[0.03]" : "border-white/[0.07] bg-white/[0.02]"}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
      >
        <span
          className={`font-semibold text-[15px] transition-colors ${open ? "text-white" : "text-slate-300 group-hover:text-white"}`}
        >
          {q}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 transition-all duration-300 ${open ? "rotate-180 text-teal-400" : "text-slate-500"}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? "max-h-48" : "max-h-0"}`}
      >
        <p className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ── Stat counter animation ───────────────────────────────────────── */
function AnimatedCount({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number | null;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (value === null) return;
    const start = display;
    const end = value;
    const duration = 1200;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  const formatted =
    display >= 1000
      ? `${(display / 1000).toFixed(decimals === 0 ? 1 : decimals)}K`
      : display.toFixed(decimals);

  return (
    <span>
      {prefix}
      {value === null ? "—" : formatted}
      {suffix}
    </span>
  );
}

/* ── Data ─────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  ["#how-it-works", "How It Works"],
  ["#features", "Features"],
  ["#pricing", "Pricing"],
  ["#faq", "FAQ"],
] as const;

const FAQS = [
  {
    q: "How do I claim a username?",
    a: "Sign up or log in, search for your desired @username, and pay the one-time registration fee. The whole process takes under a minute.",
  },
  {
    q: "How does staking work?",
    a: "Lock your @username to earn APY. Diamond (1–3 chars) earns 5%, Platinum (4–5 chars) earns 3%, Gold (6–8 chars) earns 1.5%. Silver and Bronze can lock for protection but don't earn yield.",
  },
  {
    q: "Can I sell my username?",
    a: "Yes. List any unstaked @username on the marketplace at any price. Buyers can purchase it directly from the marketplace page.",
  },
  {
    q: "How do I send SOL to a username?",
    a: "Connect your Phantom wallet, go to Send SOL, enter the recipient's @username and amount. VYNS resolves the username to their wallet address automatically.",
  },
  {
    q: "How does the referral program work?",
    a: "Share your referral link. You earn SOL and VYNS tokens for every user who signs up through your link. Higher referral tiers (Bronze, Silver, Gold, Legend) earn more per referral.",
  },
];

const TIERS = [
  {
    name: "Diamond",
    chars: "1–3 chars",
    apy: "5% APY",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    name: "Platinum",
    chars: "4–5 chars",
    apy: "3% APY",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    name: "Gold",
    chars: "6–8 chars",
    apy: "1.5% APY",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  {
    name: "Silver",
    chars: "9–15 chars",
    apy: "Lock only",
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
  },
  {
    name: "Bronze",
    chars: "16+ chars",
    apy: "Lock only",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
];

const FEATURES = [
  {
    icon: AtSign,
    title: "Claim @Username",
    desc: "Register your unique @username on-chain. One-time fee, permanent ownership. Shorter names are rarer and more valuable.",
  },
  {
    icon: Zap,
    title: "Stake & Earn Yield",
    desc: "Lock your username to earn passive APY. Diamond names earn 5% yearly — the shorter the name, the higher the yield.",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    desc: "Buy and sell @usernames on the secondary market. List your unstaked names at any price for other users to purchase.",
  },
  {
    icon: Send,
    title: "Send SOL",
    desc: "Transfer SOL to any @username instantly. No need to copy-paste wallet addresses — just type the username.",
  },
  {
    icon: TrendingUp,
    title: "Track Earnings",
    desc: "View all-time earnings, staking rewards, and referral income from a single dashboard. Full visibility into your yield.",
  },
  {
    icon: Users,
    title: "Referral Program",
    desc: "Earn SOL and VYNS tokens for every friend you invite. Level up from Starter to Legend tier as your referrals grow.",
  },
];

const FALLBACK_LISTINGS: MarketplaceListing[] = [
  { username: "xia", price: 2, tier: "Diamond", seller: "—" },
  { username: "alpha", price: 8, tier: "Platinum", seller: "—" },
  { username: "sol", price: 42, tier: "Diamond", seller: "—" },
  { username: "gm", price: 68, tier: "Diamond", seller: "—" },
];

/* ── Page ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Live data
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [listings, setListings] =
    useState<MarketplaceListing[]>(FALLBACK_LISTINGS);
  const [statsLoaded, setStatsLoaded] = useState(false);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Fetch live stats — GET /api/stats (new public route)
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.stats) {
          setStats(data.stats);
        }
        setStatsLoaded(true);
      })
      .catch(() => setStatsLoaded(true));
  }, []);

  // Fetch live marketplace listings — GET /api/marketplace?limit=4&sort=price-high
  // Response shape: { listings: [{ username, price, tier, ... }] }
  useEffect(() => {
    fetch("/api/marketplace?limit=4&sort=price-high")
      .then((r) => r.json())
      .then((data) => {
        if (data?.listings?.length) {
          setListings(
            data.listings.slice(0, 4).map((l: any) => ({
              username: l.username?.replace("@", "") ?? "—",
              price: l.price ?? 0,
              tier: l.tier ?? "Bronze",
              seller: null,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const s = localStorage.getItem("vyns_sh");
      if (s) setHistory(JSON.parse(s));
    } catch {}
  }, []);

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      const progress = Math.min(window.scrollY / 80, 1);
      setScrollProgress(progress);
    };
    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const pushHistory = (v: string) => {
    const clean = v.trim().toLowerCase();
    const updated = [clean, ...history.filter((h) => h !== clean)].slice(0, 8);
    setHistory(updated);
    try {
      localStorage.setItem("vyns_sh", JSON.stringify(updated));
    } catch {}
  };

  const handleSearch = async (e: React.FormEvent | null, override?: string) => {
    e?.preventDefault();
    const val = (override ?? query).trim().replace("@", "").toLowerCase();
    if (!val) return;
    setSearching(true);
    pushHistory(val);
    await new Promise((r) => setTimeout(r, 600));
    router.push(`/search?q=${encodeURIComponent(val)}`);
    setSearching(false);
    setQuery("");
    setShowHist(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropRef.current &&
        !dropRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      )
        setShowHist(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const tierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "diamond":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "platinum":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "gold":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "silver":
        return "text-slate-300 bg-slate-500/10 border-slate-500/20";
      default:
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-[#030811] text-slate-200 overflow-x-hidden font-sans antialiased">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-teal-500/[0.06] blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-500/[0.07] blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-teal-500/[0.03] blur-[120px]" />
      </div>

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className="max-w-6xl mx-auto">
          <div
            style={{
              backgroundColor: `rgba(8,15,26,${scrollProgress * 0.92})`,
              borderColor: `rgba(255,255,255,${scrollProgress * 0.1})`,
              backdropFilter:
                scrollProgress > 0.3
                  ? `blur(${scrollProgress * 20}px)`
                  : "none",
            }}
            className="rounded-2xl px-5 py-3 flex items-center justify-between border border-transparent"
          >
            <Link
              href="/"
              onClick={(e) => {
                if (window.location.pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              <Image
                src="/vyns-logo.png"
                alt="VYNS"
                width={110}
                height={30}
                className="object-contain"
              />
            </Link>

            <div className="hidden md:flex items-center gap-7">
              {NAV_LINKS.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="hidden md:inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 hover:-translate-y-px transition-all shadow-lg shadow-teal-500/10"
              >
                Launch App <ArrowRight size={14} />
              </Link>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {mobileOpen && (
            <div className="md:hidden mt-2 bg-[#080f1a]/95 backdrop-blur-2xl border border-white/[0.07] rounded-2xl px-5 py-4 flex flex-col gap-3 shadow-2xl">
              {NAV_LINKS.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors text-center py-1"
                >
                  {label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-1 bg-gradient-to-r from-teal-500 to-indigo-500 text-white text-sm font-semibold py-3 rounded-xl text-center"
              >
                Launch App
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pt-36 pb-24 text-center">
        <div className="inline-flex items-center gap-2 border border-teal-500/25 bg-teal-500/[0.05] text-teal-400 text-[10px] font-bold tracking-[0.14em] uppercase px-4 py-2 rounded-lg mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          Vincu Yield Name Service · Built on Solana
        </div>

        <h1 className="text-[clamp(44px,7vw,72px)] font-bold leading-[1.06] tracking-[-0.03em] text-white mb-6">
          <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            Own Once.
          </span>
          <br />
          Farm Forever.
        </h1>

        <p className="text-[clamp(15px,1.8vw,18px)] text-slate-400 max-w-[520px] mx-auto leading-relaxed mb-3">
          VYNS is the universal identity layer that turns your{" "}
          <span className="text-slate-200 font-medium">
            Web3 name into a yield-generating on-chain asset
          </span>{" "}
          — claim it, stake it, trade it, send SOL with it.
        </p>
        <p className="text-sm text-slate-500 mb-10 max-w-[420px] mx-auto">
          Permanent. Cross-chain. Always rewarding.
        </p>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="max-w-[520px] mx-auto relative mb-8"
        >
          <div className="flex items-center bg-[#0b1118] border border-white/[0.08] rounded-xl px-4 py-1.5 gap-3 focus-within:border-teal-500/50 focus-within:shadow-[0_0_0_3px_rgba(20,184,166,0.08)] transition-all">
            <span className="text-teal-400 font-bold text-lg shrink-0 select-none">
              @
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) =>
                setQuery(
                  e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase(),
                )
              }
              onFocus={() => setShowHist(true)}
              placeholder="search for your username..."
              className="flex-1 bg-transparent border-none outline-none text-slate-200 text-[15px] placeholder:text-slate-500 py-2.5"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              {searching ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  Searching
                </>
              ) : (
                "Search"
              )}
            </button>
          </div>

          {showHist && history.length > 0 && (
            <div
              ref={dropRef}
              className="absolute top-full mt-2 left-0 right-0 bg-[#0d1520] border border-white/[0.07] rounded-xl overflow-hidden shadow-2xl z-50"
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05]">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-[0.08em]">
                  <History size={11} /> Recent
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHistory([]);
                    try {
                      localStorage.removeItem("vyns_sh");
                    } catch {}
                  }}
                  className="text-xs text-slate-500 hover:text-white font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>
              {history.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQuery(item);
                    setShowHist(false);
                    handleSearch(null, item);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors group"
                >
                  <span>@{item}</span>
                  <ArrowRight
                    size={13}
                    className="text-slate-600 group-hover:text-teal-400 transition-colors"
                  />
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-500 text-white text-[15px] font-semibold px-8 py-3.5 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg shadow-teal-500/15"
          >
            Claim Your Username <ArrowRight size={16} />
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center text-[15px] font-medium text-slate-400 border border-white/[0.08] px-8 py-3.5 rounded-xl hover:border-teal-500/40 hover:text-teal-400 transition-all"
          >
            Learn How It Works
          </a>
        </div>

        {/* Live stats — real numbers or skeleton */}
        <div className="grid grid-cols-3 gap-3 max-w-[500px] mx-auto mt-12">
          {[
            {
              val: stats ? (
                <AnimatedCount value={stats.totalUsernames} suffix="+" />
              ) : (
                <span className="text-slate-600">—</span>
              ),
              label: "Usernames claimed",
            },
            {
              val: stats ? (
                <AnimatedCount value={stats.totalUsers} suffix="+" />
              ) : (
                <span className="text-slate-600">—</span>
              ),
              label: "Active holders",
            },
            {
              val: "5% APY",
              label: "Diamond staking",
            },
          ].map(({ val, label }, i) => (
            <div
              key={i}
              className="bg-[#0b1118] border border-white/[0.07] rounded-xl p-4 hover:border-teal-500/25 transition-colors"
            >
              <div className="text-[clamp(18px,2.5vw,24px)] font-bold text-teal-400 tracking-tight">
                {val}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT IS VYNS ────────────────────────────────────────── */}
      <section className="relative z-10 py-24 bg-white/[0.012]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-teal-400 mb-3 block">
                About the Protocol
              </span>
              <h2 className="text-[clamp(32px,4.5vw,52px)] font-bold text-white tracking-tight leading-tight mb-4">
                What is VYNS?
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-8">
                The{" "}
                <span className="text-slate-200">Vincu Yield Name Service</span>{" "}
                is a username registry on Solana where every @name is a
                yield-bearing financial primitive. Claim it once, own it
                forever, earn from it indefinitely.
              </p>

              <div className="space-y-7">
                {[
                  {
                    Icon: Shield,
                    teal: true,
                    h: "Permanent Ownership",
                    d: "One-time claim, forever yours. No renewals, no annual fees — just perpetual ownership on-chain.",
                  },
                  {
                    Icon: Globe,
                    teal: false,
                    h: "Universal Identity Layer",
                    d: "Send SOL, receive payments, and resolve across every major chain with a single human-readable @username.",
                  },
                  {
                    Icon: Coins,
                    teal: true,
                    h: "Passive Yield Generation",
                    d: "Earn from staking rewards, marketplace fees, referral bonuses, and transaction yield automatically.",
                  },
                ].map(({ Icon, teal, h, d }) => (
                  <div key={h} className="flex gap-4">
                    <div
                      className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center border ${teal ? "bg-teal-500/[0.06] border-teal-500/15 text-teal-400" : "bg-indigo-500/[0.06] border-indigo-500/15 text-indigo-400"}`}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white mb-1">
                        {h}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {d}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Address demo */}
            <div className="bg-[#0b1118] border border-white/[0.07] rounded-2xl p-7">
              <div className="bg-[#030811] border border-white/[0.06] rounded-xl p-5 mb-5">
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-600 mb-2">
                  Traditional Web3 Address
                </p>
                <p className="font-mono text-xs text-slate-500 break-all leading-relaxed">
                  7xKXy2hbsijWjwTzBkRJnr6qM3FaGNpmVoHxU1cZnYp...
                </p>
              </div>
              <div className="text-center text-lg text-slate-600 my-4">↓</div>
              <div className="bg-gradient-to-br from-teal-500/[0.06] to-indigo-500/[0.06] border border-teal-500/20 rounded-xl p-5">
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-teal-500/60 mb-2">
                  With VYNS
                </p>
                <p className="text-[42px] font-bold text-teal-400 tracking-[-0.02em]">
                  @yourname
                </p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-center">
                  <p className="text-teal-400 font-bold text-xl">∞</p>
                  <p className="text-slate-500 text-xs mt-1">Permanent</p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-center">
                  <p className="text-teal-400 font-bold text-xl">5%</p>
                  <p className="text-slate-500 text-xs mt-1">Max APY</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-teal-400 mb-3 block">
            Getting Started
          </span>
          <h2 className="text-[clamp(30px,4vw,48px)] font-bold text-white tracking-tight mb-3">
            How it works
          </h2>
          <p className="text-slate-400 text-base mb-14">
            Up and running in under 2 minutes
          </p>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                n: "1",
                t: "Create account",
                d: "Sign up with email or Google. No wallet required to get started.",
              },
              {
                n: "2",
                t: "Claim @username",
                d: "Search for your name, pay the one-time fee starting at 0.1 SOL.",
              },
              {
                n: "3",
                t: "Stake to earn",
                d: "Lock your username to earn APY based on its tier and character length.",
              },
              {
                n: "4",
                t: "Trade & send",
                d: "List on the marketplace or send SOL directly to any @username.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="relative overflow-hidden bg-[#0b1118] border border-white/[0.07] rounded-2xl p-7 text-left hover:border-teal-500/25 transition-all"
              >
                <span className="absolute right-4 top-1 text-[72px] font-bold text-teal-400/[0.04] leading-none select-none">
                  {s.n}
                </span>
                <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center text-black font-bold text-sm mb-5">
                  {s.n}
                </div>
                <h3 className="text-[16px] font-semibold text-white mb-2">
                  {s.t}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIER TIERS ──────────────────────────────────────────── */}
      <section className="relative z-10 py-24 bg-white/[0.012]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-teal-400 mb-3 block">
            Staking Tiers
          </span>
          <h2 className="text-[clamp(30px,4vw,48px)] font-bold text-white tracking-tight mb-3">
            Shorter = more valuable
          </h2>
          <p className="text-slate-400 text-base mb-14">
            Username tier determines staking yield. Diamond names earn the most.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`border rounded-2xl p-6 text-left ${tier.bg}`}
              >
                <p
                  className={`text-[11px] font-bold uppercase tracking-[0.12em] mb-2 ${tier.color}`}
                >
                  {tier.name}
                </p>
                <p className="text-white font-semibold text-base mb-1">
                  {tier.chars}
                </p>
                <p
                  className={`text-2xl font-bold tracking-tight mt-3 ${tier.apy === "Lock only" ? "text-slate-400" : tier.color}`}
                >
                  {tier.apy}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-6">
            Silver and Bronze names can be locked for marketplace protection but
            don't earn yield
          </p>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-teal-400 mb-3 block">
            Platform Features
          </span>
          <h2 className="text-[clamp(30px,4vw,48px)] font-bold text-white tracking-tight mb-3">
            Everything in one place
          </h2>
          <p className="text-slate-400 text-base mb-14">
            Claim, stake, trade, send, and earn — all from your VYNS dashboard
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-[#0b1118] border border-white/[0.07] rounded-2xl p-7 text-left hover:border-teal-500/25 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-500/[0.08] border border-teal-500/15 flex items-center justify-center text-teal-400 mb-5">
                  <Icon size={20} />
                </div>
                <h3 className="text-[16px] font-semibold text-white mb-2">
                  {title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARKETPLACE PREVIEW with live data ─────────────────── */}
      <section className="relative z-10 py-24 bg-white/[0.012]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-teal-400 mb-3 block">
                Marketplace
              </span>
              <h2 className="text-[clamp(28px,3.5vw,44px)] font-bold text-white tracking-tight mb-4">
                Buy & sell usernames
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-8">
                Browse hundreds of listed @usernames. List your own at any
                price. Shorter, rarer names command higher floor prices as
                supply is permanently constrained.
              </p>
              <div className="flex flex-col gap-3 mb-8">
                {[
                  "No auction delays — buy at listed price instantly",
                  "Unstake anytime, list immediately",
                  "Filter by tier: Diamond, Platinum, Gold, Silver, Bronze",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} className="text-teal-400" />
                    </div>
                    <p className="text-sm text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-teal-400 font-semibold text-sm hover:text-teal-300 transition-colors"
              >
                Browse Marketplace <ArrowRight size={14} />
              </Link>
            </div>

            {/* Live listings */}
            <div className="bg-[#0b1118] border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Live Listings
                </p>
                <span className="flex items-center gap-1.5 text-[10px] text-teal-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  Live
                </span>
              </div>
              {listings.map(({ username, price, tier }, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">
                      {username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-[15px]">
                        @{username}
                      </p>
                      <p className="text-xs text-slate-500">
                        {username.length} chars
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="font-bold text-white text-[15px]">
                      {price} SOL
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tierColor(tier)}`}
                    >
                      {tier}
                    </span>
                  </div>
                </div>
              ))}
              <div className="px-6 py-4">
                <Link
                  href="/dashboard"
                  className="text-sm text-teal-400 font-semibold hover:text-teal-300 transition-colors"
                >
                  View all listings →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" className="relative z-10 py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-teal-400 mb-3 block">
            Pricing
          </span>
          <h2 className="text-[clamp(30px,4vw,48px)] font-bold text-white tracking-tight mb-3">
            One-time fee, yours forever
          </h2>
          <p className="text-slate-400 text-base mb-14">
            Price is determined by username length. No renewals, no hidden fees.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                tier: "Standard",
                price: "0.1 SOL",
                chars: "5+ characters",
                highlight: false,
                apy: null,
                features: [
                  "Permanent ownership",
                  "Marketplace trading",
                  "Send & receive SOL",
                  "Lock for protection",
                ],
              },
              {
                tier: "Premium",
                price: "1–10 SOL",
                chars: "3–4 characters",
                highlight: true,
                apy: "Up to 3% APY",
                features: [
                  "Everything in Standard",
                  "3% APY staking (Platinum)",
                  "Higher resale value",
                  "Rarer supply",
                ],
              },
              {
                tier: "Diamond",
                price: "10 SOL+",
                chars: "1–2 characters",
                highlight: false,
                apy: "5% APY",
                features: [
                  "Everything in Premium",
                  "5% APY staking",
                  "Highest floor value",
                  "Most scarce supply",
                ],
              },
            ].map((p) => (
              <div
                key={p.tier}
                className={`rounded-2xl p-8 text-left relative ${p.highlight ? "bg-gradient-to-b from-teal-500/[0.08] to-transparent border-2 border-teal-500/30 -mt-2 shadow-xl" : "bg-[#0b1118] border border-white/[0.07] hover:border-white/[0.12]"} transition-all`}
              >
                {p.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-400 text-black text-[10px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <p
                  className={`text-[10px] font-bold uppercase tracking-[0.14em] mb-3 ${p.highlight ? "text-teal-400" : "text-slate-500"}`}
                >
                  {p.tier}
                </p>
                <p className="text-[40px] font-bold text-white tracking-tight leading-none mb-1">
                  {p.price}
                </p>
                <p
                  className={`text-sm mb-1 ${p.highlight ? "text-teal-400/60" : "text-slate-500"}`}
                >
                  {p.chars}
                </p>
                {p.apy && (
                  <p
                    className={`text-sm font-semibold mb-6 ${p.highlight ? "text-teal-400" : "text-teal-400/70"}`}
                  >
                    {p.apy}
                  </p>
                )}
                {!p.apy && <div className="mb-6" />}
                <ul className="space-y-2.5 mb-8">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-sm text-slate-400"
                    >
                      <span className="text-teal-400 font-bold text-xs">✓</span>{" "}
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full text-center text-sm font-semibold py-3 rounded-xl transition-all ${p.highlight ? "bg-gradient-to-r from-teal-500 to-indigo-500 text-white hover:opacity-90 shadow-lg shadow-teal-500/20" : "border border-white/[0.08] text-slate-300 hover:border-teal-500/40 hover:text-teal-400"}`}
                >
                  Claim Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 py-24 bg-white/[0.012]">
        <div className="max-w-3xl mx-auto px-4">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-teal-400 mb-3 block">
            FAQ
          </span>
          <h2 className="text-[clamp(30px,4vw,48px)] font-bold text-white tracking-tight mb-3">
            Common questions
          </h2>
          <p className="text-slate-400 text-base mb-12">
            Everything you need to know about VYNS
          </p>
          <div className="space-y-2.5">
            {FAQS.map((f, i) => (
              <FaqItem key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="relative z-10 overflow-hidden border-y border-teal-500/[0.08] py-24 px-4 text-center bg-gradient-to-br from-teal-500/[0.05] to-indigo-500/[0.05]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(20,184,166,0.05),transparent)] pointer-events-none" />
        <h2 className="relative text-[clamp(34px,5vw,60px)] font-bold text-white tracking-tight leading-tight mb-4">
          Ready to own your
          <br />
          <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
            universal identity?
          </span>
        </h2>
        <p className="relative text-[17px] text-slate-400 mb-10">
          Join the VYNS protocol. Own once. Farm forever.
        </p>
        <Link
          href="/register"
          className="relative inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-500 text-white text-base font-semibold px-10 py-4 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-xl shadow-teal-500/20"
        >
          Get Started Free <ArrowRight size={17} />
        </Link>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="relative z-10 bg-[#080f1a] border-t border-white/[0.06] py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <Image
                src="/vyns-logo.png"
                alt="VYNS"
                width={110}
                height={30}
                className="object-contain mb-4"
              />
              <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">
                Vincu Yield Name Service. Claim, stake, and trade @usernames on
                Solana.
              </p>
              <div className="flex gap-3 mt-5">
                {[Twitter, Github].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-9 h-9 rounded-lg bg-[#030811] border border-white/[0.06] flex items-center justify-center text-slate-500 hover:text-teal-400 hover:border-teal-500/30 transition-all"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>
            {[
              {
                title: "Product",
                links: [
                  ["#features", "Features"],
                  ["#pricing", "Pricing"],
                  ["/dashboard", "Marketplace"],
                  ["/dashboard", "Staking"],
                ],
              },
              {
                title: "Account",
                links: [
                  ["/register", "Sign Up"],
                  ["/login", "Sign In"],
                  ["/dashboard", "Dashboard"],
                  ["/dashboard", "My Usernames"],
                ],
              },
              {
                title: "Legal",
                links: [
                  ["#", "Privacy Policy"],
                  ["#", "Terms of Service"],
                ],
              },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-300 mb-4">
                  {title}
                </h4>
                <ul className="space-y-3">
                  {links.map(([href, label]) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="text-sm text-slate-500 hover:text-teal-400 transition-colors"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              © 2026 VYNS Protocol. All rights reserved.
            </p>
            <div className="inline-flex items-center gap-2 bg-teal-500/[0.05] border border-teal-500/[0.12] text-teal-400 text-[10px] font-bold uppercase tracking-[0.08em] px-3 py-1.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Built on Solana
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
