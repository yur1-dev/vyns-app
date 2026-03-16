"use client";

// components/dashboard/tabs/EarningsTab.tsx
import { DollarSign, TrendingUp, Zap, Users } from "lucide-react";
import { Card, SectionTitle } from "@/components/dashboard/ui";
import type { UserData } from "@/types/dashboard";

export default function EarningsTab({ userData }: { userData: UserData }) {
  // earnings is a plain number in the schema — not an object
  const total =
    typeof userData.earnings === "number"
      ? userData.earnings
      : ((userData.earnings as any)?.allTime ?? 0);

  const stakingRewards = userData.stakingRewards ?? 0;
  const referralEarnings = userData.referralEarnings ?? 0;
  const usernameYield = Math.max(0, total - stakingRewards - referralEarnings);

  const sources = [
    {
      label: "Username yield",
      value: usernameYield,
      color: "bg-teal-500",
      icon: TrendingUp,
    },
    {
      label: "Staking rewards",
      value: stakingRewards,
      color: "bg-violet-500",
      icon: Zap,
    },
    {
      label: "Referral bonus",
      value: referralEarnings,
      color: "bg-sky-500",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle>Earnings</SectionTitle>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "All time", value: total },
          { label: "Staking", value: stakingRewards },
          { label: "Referrals", value: referralEarnings },
        ].map((e) => (
          <Card key={e.label} className="p-5 text-center">
            <p className="text-xs text-white/30 mb-2">{e.label}</p>
            <p className="text-2xl font-semibold text-white tabular-nums">
              {e.value.toFixed(4)}
            </p>
            <p className="text-xs text-white/25 mt-0.5">SOL</p>
          </Card>
        ))}
      </div>

      {/* By source */}
      <Card className="p-5">
        <SectionTitle>By source</SectionTitle>
        {total === 0 ? (
          <div className="py-10 text-center">
            <DollarSign className="h-6 w-6 mx-auto mb-3 text-white/10" />
            <p className="text-sm text-white/20">No earnings yet</p>
            <p className="text-xs text-white/15 mt-1">
              Claim a username or stake to start earning
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <div className="flex items-center gap-2 text-white/50">
                      <Icon className="h-3.5 w-3.5" />
                      <span>{s.label}</span>
                    </div>
                    <span className="text-white font-medium tabular-nums">
                      {s.value.toFixed(4)} SOL
                    </span>
                  </div>
                  <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.color} rounded-full transition-all duration-500`}
                      style={{
                        width: `${Math.min(100, total > 0 ? (s.value / total) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* VYNS balance */}
      {(userData.claimedVyns ?? 0) > 0 && (
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/30 mb-1">VYNS earned</p>
            <p className="text-2xl font-semibold text-teal-400 tabular-nums">
              {(userData.claimedVyns ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-teal-400" />
          </div>
        </Card>
      )}
    </div>
  );
}
