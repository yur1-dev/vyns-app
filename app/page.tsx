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
  ChevronDown,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   FAQ Accordion
───────────────────────────────────────────────────────────────────────── */
interface FaqItemProps {
  q: string;
  a: string;
}

function FaqItem({ q, a }: FaqItemProps) {
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

/* ─────────────────────────────────────────────────────────────────────────
   Data
───────────────────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "How do I claim a username?",
    a: "Connect your Solana wallet, search for your desired @username, and pay the one-time registration fee starting at 0.1 SOL. The whole process takes under a minute.",
  },
  {
    q: "Can I transfer or sell my username?",
    a: "Yes. Your @username is fully owned by you as an on-chain NFT. Transfer it peer-to-peer or list it on our secondary marketplace at any price.",
  },
  {
    q: "How does the yield system work?",
    a: "You earn from transaction fees when payments are sent to your @username, staking rewards by locking your name, marketplace trading fees distributed to all holders, and referral bonuses.",
  },
  {
    q: "Does my username work on other chains?",
    a: "Yes. Your @username resolves on Solana, Ethereum, Base, Arbitrum and all other major chains — truly universal.",
  },
  {
    q: "What if I don't renew?",
    a: "Standard names carry a small optional renewal fee (0.05 SOL/yr). If not renewed within 30 days of expiry the name re-enters the open market.",
  },
];

const FEATURES = [
  {
    icon: Coins,
    teal: true,
    title: "Transaction Yield",
    desc: "Earn a percentage on every payment sent to your @username, automatically on-chain.",
  },
  {
    icon: TrendingUp,
    teal: false,
    title: "Marketplace Revenue",
    desc: "All holders share proportionally in trading fees from the secondary name marketplace.",
  },
  {
    icon: Zap,
    teal: true,
    title: "Staking Rewards",
    desc: "Lock your name to earn high APY. Premium shorter names earn amplified staking rates.",
  },
  {
    icon: Users,
    teal: false,
    title: "Referral Program",
    desc: "Invite friends and earn token rewards for every successful referral registration.",
  },
  {
    icon: Globe,
    teal: true,
    title: "Subdomains",
    desc: "Create and monetize subdomains like @yourname/nft or sell them to organizations.",
  },
  {
    icon: Shield,
    teal: false,
    title: "Value Appreciation",
    desc: "Premium and short names increase in floor price as supply is permanently constrained.",
  },
];

const SALES = [
  { name: "@gm", price: "68 SOL", date: "Dec 25" },
  { name: "@lfg", price: "55 SOL", date: "Dec 24" },
  { name: "@alpha", price: "42 SOL", date: "Dec 23" },
  { name: "@sol", price: "38 SOL", date: "Dec 22" },
];

const NAV_LINKS = [
  ["#how-it-works", "How It Works"],
  ["#features", "Features"],
  ["#ecosystem", "Ecosystem"],
  ["#pricing", "Pricing"],
  ["#faq", "FAQ"],
] as const;

/* ─────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  /* persist search history */
  useEffect(() => {
    try {
      const s = localStorage.getItem("vyns_sh");
      if (s) setHistory(JSON.parse(s));
    } catch {}
  }, []);

  const pushHistory = (v: string) => {
    const clean = v.trim().toLowerCase();
    const updated = [clean, ...history.filter((h) => h !== clean)].slice(0, 8);
    setHistory(updated);
    try {
      localStorage.setItem("vyns_sh", JSON.stringify(updated));
    } catch {}
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("vyns_sh");
    } catch {}
  };

  const handleSearch = async (e: React.FormEvent | null, override?: string) => {
    e?.preventDefault();
    const val = (override ?? query).trim().replace("@", "").toLowerCase();
    if (!val) return;
    setSearching(true);
    pushHistory(val);
    await new Promise((r) => setTimeout(r, 650));
    router.push(`/search?q=${encodeURIComponent(val)}`);
    setSearching(false);
    setQuery("");
    setShowHist(false);
  };

  /* close dropdown on outside click */
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

  return (
    <div className="min-h-screen bg-[#030811] text-slate-200 overflow-x-hidden font-sans antialiased">
      {/* ── ambient glow ───────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-52 -left-52 w-[700px] h-[700px] rounded-full bg-teal-500/[0.07] blur-[160px]" />
        <div className="absolute bottom-0 -right-40 w-[550px] h-[550px] rounded-full bg-indigo-500/[0.08] blur-[160px]" />
      </div>

      {/* ── NAV ────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 px-4 pt-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#080f1a]/80 backdrop-blur-2xl border border-white/[0.07] rounded-2xl px-5 py-3 flex items-center justify-between shadow-2xl">
            {/* Logo */}
            <Image
              src="/vyns-logo.png"
              alt="VYNS"
              width={120}
              height={32}
              className="object-contain"
            />

            {/* Desktop links */}
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

            {/* Desktop CTA */}
            <Link
              href="/app"
              className="hidden md:inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 hover:-translate-y-px transition-all shadow-lg shadow-teal-500/10"
            >
              Launch App <ArrowRight size={14} />
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile menu */}
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
                href="/app"
                onClick={() => setMobileOpen(false)}
                className="mt-1 bg-gradient-to-r from-teal-500 to-indigo-500 text-white text-sm font-semibold py-3 rounded-xl text-center"
              >
                Launch App
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pt-20 pb-28 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-teal-500/25 bg-teal-500/[0.05] text-teal-400 text-[10px] font-semibold tracking-[0.12em] uppercase px-4 py-2 rounded-lg mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          Universal Human-Readable Name Service
        </div>

        {/* Headline */}
        <h1 className="text-[clamp(48px,7vw,84px)] font-bold leading-[1.05] tracking-[-0.03em] text-white mb-4">
          Own Your{" "}
          <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            @Username
          </span>
        </h1>
        <p className="text-[clamp(22px,3.2vw,34px)] font-semibold text-slate-500 tracking-[-0.01em] mb-6">
          Earn While You Use It
        </p>

        {/* Sub */}
        <p className="text-[clamp(15px,1.7vw,17px)] text-slate-400 max-w-[520px] mx-auto leading-relaxed mb-10 font-normal">
          VYNS is the universal identity layer that turns your Web3 name into a{" "}
          <span className="text-slate-200 font-medium">
            yield-generating on-chain asset
          </span>{" "}
          — permanent, cross-chain, and always rewarding.
        </p>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="max-w-[540px] mx-auto relative"
        >
          <div className="flex items-center bg-[#0b1118] border border-white/[0.07] rounded-xl px-4 py-1.5 gap-3 focus-within:border-teal-500/50 focus-within:shadow-[0_0_0_3px_rgba(20,184,166,0.08)] transition-all">
            <Search
              size={16}
              className="text-slate-500 shrink-0 group-focus-within:text-teal-400 transition-colors"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowHist(true)}
              placeholder="Search for your @username..."
              className="flex-1 bg-transparent border-none outline-none text-slate-200 text-[15px] font-normal placeholder:text-slate-500 py-2"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="bg-gradient-to-r from-teal-500 to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 hover:-translate-y-px transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 whitespace-nowrap"
            >
              {searching ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Searching
                </>
              ) : (
                "Search"
              )}
            </button>
          </div>

          {/* History dropdown */}
          {showHist && history.length > 0 && (
            <div
              ref={dropRef}
              className="absolute top-full mt-2 left-0 right-0 bg-[#0d1520] border border-white/[0.07] rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05]">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold uppercase tracking-[0.08em]">
                  <History size={11} /> Recent
                </div>
                <button
                  type="button"
                  onClick={clearHistory}
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
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-300 font-normal hover:bg-white/[0.04] transition-colors group"
                >
                  <span>@{item}</span>
                  <ArrowRight
                    size={13}
                    className="text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all"
                  />
                </button>
              ))}
            </div>
          )}
        </form>

        {/* CTA row — two buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href="/app"
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 max-w-[520px] mx-auto mt-12">
          {[
            ["0.1 SOL", "Starting Price"],
            ["∞", "Permanent Ownership"],
            ["5%+", "Annual Yield"],
          ].map(([val, label]) => (
            <div
              key={label}
              className="bg-[#0b1118] border border-white/[0.07] rounded-xl p-4 hover:border-teal-500/30 transition-colors"
            >
              <div className="text-[clamp(20px,2.8vw,26px)] font-bold text-teal-400 tracking-[-0.01em]">
                {val}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1 leading-tight">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT IS VYNS ───────────────────────────────────────────── */}
      <section className="relative z-10 py-24 bg-white/[0.012]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-14">
            <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-teal-400 mb-3 block">
              About the Protocol
            </span>
            <h2 className="text-[clamp(32px,4.5vw,52px)] font-bold text-white tracking-[-0.02em] leading-tight mb-3">
              What is VYNS?
            </h2>
            <p className="text-slate-400 text-base max-w-md leading-relaxed font-normal">
              The first universal name service with built-in yield generation.
              Your identity. Your asset.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Features */}
            <div className="space-y-8">
              {[
                {
                  Icon: Shield,
                  teal: true,
                  h: "Permanent Ownership",
                  d: "One-time claim, forever yours. Your @username is a fully transferable on-chain NFT you control completely.",
                },
                {
                  Icon: Globe,
                  teal: false,
                  h: "Universal Cross-Chain",
                  d: "Works on Solana, Ethereum, Base, Arbitrum and all major chains. One name, every network.",
                },
                {
                  Icon: TrendingUp,
                  teal: true,
                  h: "Passive Yield Generation",
                  d: "Earn from transactions, staking, marketplace fees, referrals, and subdomain monetization automatically.",
                },
              ].map(({ Icon, teal, h, d }) => (
                <div key={h} className="flex gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center border ${
                      teal
                        ? "bg-teal-500/[0.06] border-teal-500/15 text-teal-400"
                        : "bg-indigo-500/[0.06] border-indigo-500/15 text-indigo-400"
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1">
                      {h}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed font-normal">
                      {d}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Address demo */}
            <div className="bg-[#0b1118] border border-white/[0.07] rounded-2xl p-7">
              <div className="bg-[#030811] border border-white/[0.06] rounded-xl p-5 mb-5">
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-600 mb-2">
                  Traditional Web3 Address
                </p>
                <p className="font-mono text-xs text-slate-500 break-all leading-relaxed">
                  7xKXy2hbsijWjwTzBkRJnr6qM3FaGNpmVoHxU1...
                </p>
              </div>
              <div className="text-center text-lg text-slate-600 my-4">↓</div>
              <div className="bg-gradient-to-br from-teal-500/[0.06] to-indigo-500/[0.06] border border-teal-500/20 rounded-xl p-5">
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-teal-500/60 mb-2">
                  With VYNS
                </p>
                <p className="text-[38px] font-bold text-teal-400 tracking-[-0.02em]">
                  @yourname
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-teal-400 mb-3 block">
            Getting Started
          </span>
          <h2 className="text-[clamp(32px,4.5vw,52px)] font-bold text-white tracking-[-0.02em] mb-3">
            How It Works
          </h2>
          <p className="text-slate-400 text-base mb-14 font-normal">
            Three simple steps to your universal Web3 identity
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                n: "1",
                t: "Connect Wallet",
                d: "Use Phantom, Solflare, or any Solana-compatible wallet. Takes under 10 seconds.",
              },
              {
                n: "2",
                t: "Claim @Username",
                d: "Search and register your desired name starting at 0.1 SOL. Shorter names hold higher value.",
              },
              {
                n: "3",
                t: "Earn Yield",
                d: "Receive passive income from usage, staking rewards, marketplace fees, and referral bonuses.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="relative overflow-hidden bg-[#0b1118] border border-white/[0.07] rounded-2xl p-8 text-left hover:border-teal-500/30 hover:-translate-y-1 transition-all"
              >
                <span className="absolute right-4 top-2 text-[80px] font-bold text-teal-400/[0.04] leading-none select-none">
                  {s.n}
                </span>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center text-white font-bold text-base mb-5">
                  {s.n}
                </div>
                <h3 className="text-[17px] font-semibold text-white mb-2">
                  {s.t}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-normal">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-24 bg-white/[0.012]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-teal-400 mb-3 block">
            Platform Features
          </span>
          <h2 className="text-[clamp(32px,4.5vw,52px)] font-bold text-white tracking-[-0.02em] mb-3">
            Powerful Features
          </h2>
          <p className="text-slate-400 text-base mb-14 font-normal">
            Your @username is more than a name — it's a yield-generating
            financial primitive
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map(({ icon: Icon, teal, title, desc }) => (
              <div
                key={title}
                className="bg-[#0b1118] border border-white/[0.07] rounded-2xl p-7 text-left hover:border-teal-500/30 hover:-translate-y-1 transition-all group"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center border mb-5 ${
                    teal
                      ? "bg-teal-500/[0.07] border-teal-500/15 text-teal-400"
                      : "bg-indigo-500/[0.07] border-indigo-500/15 text-indigo-400"
                  }`}
                >
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-normal">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ECOSYSTEM ──────────────────────────────────────────────── */}
      <section id="ecosystem" className="relative z-10 py-24">
        <div className="max-w-6xl mx-auto px-4">
          <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-teal-400 mb-3 block">
            Ecosystem
          </span>
          <h2 className="text-[clamp(32px,4.5vw,52px)] font-bold text-white tracking-[-0.02em] mb-2">
            Real Adoption. Real Growth.
          </h2>
          <p className="text-slate-400 text-base mb-12 font-normal">
            Live metrics from the VYNS protocol on Solana mainnet
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-14">
            {[
              { val: "250K+", label: "Registered Names", Icon: BarChart3 },
              { val: "180K", label: "Active Holders", Icon: Wallet },
              { val: "$420M", label: "Market Cap", Icon: Sparkles },
              { val: "150+", label: "Ecosystem Partners", Icon: Trophy },
            ].map(({ val, label, Icon }) => (
              <div
                key={label}
                className="bg-[#0b1118] border border-white/[0.07] rounded-2xl p-6 hover:border-teal-500/30 transition-colors"
              >
                <Icon size={20} className="text-teal-400 mb-3" />
                <div className="text-[clamp(24px,3.2vw,32px)] font-bold text-white tracking-[-0.01em]">
                  {val}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Sales table */}
          <h3 className="text-lg font-semibold text-white mb-4 tracking-[-0.01em]">
            Top Recent Sales
          </h3>
          <div className="bg-[#0b1118] border border-white/[0.07] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.05]">
                  <th className="text-left px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                    Name
                  </th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                    Sale Price
                  </th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {SALES.map(({ name, price, date }) => (
                  <tr
                    key={name}
                    className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-teal-400 text-base tracking-[-0.01em]">
                      {name}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white text-sm">
                      {price}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm font-normal">
                      {date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────── */}
      <section id="pricing" className="relative z-10 py-24 bg-white/[0.012]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-teal-400 mb-3 block">
            Pricing
          </span>
          <h2 className="text-[clamp(32px,4.5vw,52px)] font-bold text-white tracking-[-0.02em] mb-3">
            Simple &amp; Transparent
          </h2>
          <p className="text-slate-400 text-base mb-14 font-normal">
            One-time registration fee. Permanent ownership. No hidden costs.
          </p>

          <div className="grid md:grid-cols-3 gap-4 items-start">
            {/* Standard */}
            <div className="bg-[#0b1118] border border-white/[0.07] rounded-2xl p-8 text-left hover:border-teal-500/30 hover:-translate-y-1 transition-all">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-3">
                Standard
              </p>
              <p className="text-[42px] font-bold text-white tracking-[-0.02em] leading-none mb-1">
                0.1 SOL
              </p>
              <p className="text-sm text-slate-500 mb-6 font-normal">
                5+ characters
              </p>
              <ul className="space-y-2.5 mb-8">
                {[
                  "Permanent ownership",
                  "Cross-chain resolution",
                  "Transaction yield",
                  "Marketplace trading",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 text-sm text-slate-400 font-normal"
                  >
                    <span className="text-teal-400 font-semibold text-xs">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/app"
                className="block w-full text-center text-sm font-medium text-slate-300 border border-white/[0.08] py-3 rounded-xl hover:border-teal-500/40 hover:text-teal-400 transition-all"
              >
                Claim Now
              </Link>
            </div>

            {/* Premium — featured */}
            <div className="bg-gradient-to-b from-teal-500/[0.08] to-indigo-500/[0.06] border border-teal-500/30 rounded-2xl p-8 text-left relative -mt-0 md:-mt-2 shadow-xl shadow-teal-500/5">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-400 text-black text-[10px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full">
                Most Popular
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-400 mb-3">
                Premium
              </p>
              <p className="text-[42px] font-bold text-white tracking-[-0.02em] leading-none mb-1">
                1–10 SOL
              </p>
              <p className="text-sm text-teal-400/60 mb-6 font-normal">
                3–4 characters
              </p>
              <ul className="space-y-2.5 mb-8">
                {[
                  "Everything in Standard",
                  "2× staking rewards",
                  "5 free subdomains",
                  "Verified badge",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 text-sm text-slate-300 font-normal"
                  >
                    <span className="text-teal-400 font-semibold text-xs">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/app"
                className="block w-full text-center text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-indigo-500 py-3 rounded-xl hover:opacity-90 hover:-translate-y-px transition-all shadow-lg shadow-teal-500/20"
              >
                Claim Premium
              </Link>
            </div>

            {/* Legendary */}
            <div className="bg-[#0b1118] border border-white/[0.07] rounded-2xl p-8 text-left hover:border-teal-500/30 hover:-translate-y-1 transition-all">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-3">
                Legendary
              </p>
              <p className="text-[42px] font-bold text-white tracking-[-0.02em] leading-none mb-1">
                Auction
              </p>
              <p className="text-sm text-slate-500 mb-6 font-normal">
                1–2 characters
              </p>
              <ul className="space-y-2.5 mb-8">
                {[
                  "Everything in Premium",
                  "5× staking rewards",
                  "Unlimited subdomains",
                  "DAO voting power",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 text-sm text-slate-400 font-normal"
                  >
                    <span className="text-teal-400 font-semibold text-xs">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/app"
                className="block w-full text-center text-sm font-medium text-slate-300 border border-white/[0.08] py-3 rounded-xl hover:border-teal-500/40 hover:text-teal-400 transition-all"
              >
                View Auctions
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 py-24">
        <div className="max-w-3xl mx-auto px-4">
          <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-teal-400 mb-3 block">
            FAQ
          </span>
          <h2 className="text-[clamp(32px,4.5vw,52px)] font-bold text-white tracking-[-0.02em] mb-3">
            Common Questions
          </h2>
          <p className="text-slate-400 text-base mb-12 font-normal">
            Everything you need to know about VYNS
          </p>
          <div className="space-y-2.5">
            {FAQS.map((f, i) => (
              <FaqItem key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────────── */}
      <section className="relative z-10 overflow-hidden bg-gradient-to-br from-teal-500/[0.06] to-indigo-500/[0.06] border-y border-teal-500/[0.08] py-24 px-4 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(20,184,166,0.06),transparent)] pointer-events-none" />
        <h2 className="relative text-[clamp(34px,5.5vw,64px)] font-bold text-white tracking-[-0.02em] leading-tight mb-4">
          Ready to Own Your
          <br />
          <span className="text-teal-400">Universal Identity?</span>
        </h2>
        <p className="relative text-[17px] text-slate-400 mb-10 font-normal">
          Join thousands already earning passive yield from their @username
        </p>
        <Link
          href="/app"
          className="relative inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-500 text-white text-base font-semibold px-10 py-4 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-xl shadow-teal-500/20"
        >
          Launch App <ArrowRight size={17} />
        </Link>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="relative z-10 bg-[#080f1a] border-t border-white/[0.06] py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <Image
                src="/vyns-logo.png"
                alt="VYNS"
                width={120}
                height={32}
                className="object-contain mb-4"
              />
              <p className="text-sm text-slate-500 leading-relaxed max-w-[220px] font-normal">
                Universal Human-Readable Name Service with built-in yield
                generation. Own your identity on every chain.
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
                  ["#", "Marketplace"],
                ],
              },
              {
                title: "Resources",
                links: [
                  ["#", "Documentation"],
                  ["#faq", "FAQ"],
                  ["#", "Blog"],
                  ["#", "Support"],
                ],
              },
              {
                title: "Legal",
                links: [
                  ["#", "Privacy Policy"],
                  ["#", "Terms of Service"],
                  ["#", "Cookie Policy"],
                ],
              },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300 mb-4">
                  {title}
                </h4>
                <ul className="space-y-3">
                  {links.map(([href, label]) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="text-sm text-slate-500 hover:text-teal-400 transition-colors font-normal"
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
            <p className="text-xs text-slate-600 font-medium">
              © 2025 VYNS Protocol. All rights reserved.
            </p>
            <div className="inline-flex items-center gap-2 bg-teal-500/[0.05] border border-teal-500/[0.12] text-teal-400 text-[10px] font-semibold uppercase tracking-[0.08em] px-3 py-1.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Built on Solana
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
