"use client";

// components/dashboard/tabs/EarningsTab.tsx
import {
  DollarSign,
  TrendingUp,
  Zap,
  Users,
  ArrowUpRight,
  Coins,
} from "lucide-react";
import { Card, SectionTitle } from "@/components/dashboard/ui";
import type { UserData } from "@/types/dashboard";

export default function EarningsTab({ userData }: { userData: UserData }) {
  // Normalize: DB stores earnings as Number, frontend type is EarningsBreakdown.
  // After the useDashboard fix this will always be an object, but keep the
  // defensive fallback here too so the tab never breaks regardless.
  const allTime =
    typeof userData.earnings === "number"
      ? (userData.earnings as number)
      : (userData.earnings?.allTime ?? 0);

  const stakingRewards = userData.stakingRewards ?? 0;
  const referralEarnings = userData.referralEarnings ?? 0;

  // Username yield = whatever's left after staking + referrals
  const usernameYield = Math.max(
    0,
    allTime - stakingRewards - referralEarnings,
  );

  const total = allTime;

  const sources = [
    {
      label: "Username yield",
      sublabel: "Marketplace sales & yield",
      value: usernameYield,
      color: "from-teal-500 to-teal-400",
      glowColor: "shadow-teal-500/20",
      iconBg: "bg-teal-500/10 border-teal-500/20",
      iconColor: "text-teal-400",
      icon: TrendingUp,
    },
    {
      label: "Staking rewards",
      sublabel: "Yield from locked positions",
      value: stakingRewards,
      color: "from-violet-500 to-violet-400",
      glowColor: "shadow-violet-500/20",
      iconBg: "bg-violet-500/10 border-violet-500/20",
      iconColor: "text-violet-400",
      icon: Zap,
    },
    {
      label: "Referral bonus",
      sublabel: "Rewards from referred users",
      value: referralEarnings,
      color: "from-sky-500 to-sky-400",
      glowColor: "shadow-sky-500/20",
      iconBg: "bg-sky-500/10 border-sky-500/20",
      iconColor: "text-sky-400",
      icon: Users,
    },
  ];

  const statCards = [
    { label: "All time", value: total, accent: "text-white" },
    { label: "Staking", value: stakingRewards, accent: "text-violet-400" },
    { label: "Referrals", value: referralEarnings, accent: "text-sky-400" },
  ];

  return (
    <div className="space-y-4">
      {/* ── Hero total ──────────────────────────────────────────────────── */}
      <Card className="relative overflow-hidden p-6">
        {/* ambient glow */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/30 mb-1">
              Total Earned
            </p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white tabular-nums leading-none">
                {total.toFixed(4)}
              </span>
              <span className="mb-0.5 text-sm font-medium text-white/30">
                SOL
              </span>
            </div>
            {total > 0 && (
              <p className="mt-1.5 text-xs text-teal-400/80 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                Across {sources.filter((s) => s.value > 0).length} earning
                source
                {sources.filter((s) => s.value > 0).length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-teal-400" />
          </div>
        </div>
      </Card>

      {/* ── Stat row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/25 mb-2">
              {s.label}
            </p>
            <p className={`text-lg font-semibold tabular-nums ${s.accent}`}>
              {s.value.toFixed(4)}
            </p>
            <p className="text-[10px] text-white/20 mt-0.5">SOL</p>
          </Card>
        ))}
      </div>

      {/* ── By source ───────────────────────────────────────────────────── */}
      <Card className="p-5">
        <SectionTitle>By source</SectionTitle>

        {total === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <Coins className="h-5 w-5 text-white/15" />
            </div>
            <p className="text-sm font-medium text-white/20">No earnings yet</p>
            <p className="text-xs text-white/12 mt-1 max-w-[180px] mx-auto leading-relaxed">
              Sell a username or claim staking rewards to see earnings here
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {sources.map((s) => {
              const Icon = s.icon;
              const pct =
                total > 0 ? Math.min(100, (s.value / total) * 100) : 0;

              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${s.iconBg}`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${s.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white/70 leading-none">
                          {s.label}
                        </p>
                        <p className="text-[10px] text-white/25 mt-0.5 leading-none">
                          {s.sublabel}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white tabular-nums">
                        {s.value.toFixed(4)}
                      </p>
                      <p className="text-[10px] text-white/25">
                        {pct.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${s.color} rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── VYNS balance (only shown when nonzero) ───────────────────────── */}
      {(userData.claimedVyns ?? 0) > 0 && (
        <Card className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/25 mb-1">
              VYNS Earned
            </p>
            <p className="text-2xl font-bold text-teal-400 tabular-nums">
              {(userData.claimedVyns ?? 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-white/20 mt-0.5">VYNS tokens</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-teal-400" />
          </div>
        </Card>
      )}
    </div>
  );
}
