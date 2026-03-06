"use client";

// components/dashboard/tabs/EarningsTab.tsx

import { DollarSign } from "lucide-react";
import { Card, SectionTitle } from "@/components/dashboard/ui";
import type { UserData } from "@/types/dashboard";

export default function EarningsTab({ userData }: { userData: UserData }) {
  const total = userData.earnings.allTime;

  const sources = [
    { label: "Username yield", value: total * 0.6, color: "bg-teal-500" },
    {
      label: "Staking rewards",
      value: userData.stakingRewards,
      color: "bg-violet-500",
    },
    {
      label: "Referral bonus",
      value: userData.referralEarnings,
      color: "bg-sky-500",
    },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle>Earnings</SectionTitle>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Today", value: userData.earnings.today },
          { label: "This week", value: userData.earnings.week },
          { label: "All time", value: total },
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
            {sources.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-white/50">{s.label}</span>
                  <span className="text-white font-medium tabular-nums">
                    {s.value.toFixed(4)} SOL
                  </span>
                </div>
                <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded-full`}
                    style={{
                      width: `${Math.min(100, total > 0 ? (s.value / total) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
