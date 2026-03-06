"use client";

// components/dashboard/tabs/ReferralsTab.tsx

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Card, SectionTitle } from "@/components/dashboard/ui";
import type { UserData } from "@/types/dashboard";

interface Props {
  userData: UserData;
  wallet: string | null;
}

export default function ReferralsTab({ userData, wallet }: Props) {
  const [copied, setCopied] = useState(false);

  const code = userData.referralCode || wallet?.slice(0, 8) || "VYNS0000";
  const link = `https://vyns.io/ref/${code}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <SectionTitle>Referrals</SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total referrals",
            value: userData.referrals,
            accent: "text-sky-400",
          },
          {
            label: "Earnings",
            value: `${userData.referralEarnings.toFixed(4)} SOL`,
            accent: "text-teal-400",
          },
          { label: "Per referral", value: "0.01 SOL", accent: "text-white/40" },
        ].map((s) => (
          <Card key={s.label} className="p-5 text-center">
            <p className="text-xs text-white/30 mb-2">{s.label}</p>
            <p className={`text-xl font-semibold tabular-nums ${s.accent}`}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Link */}
      <Card className="p-5 space-y-4">
        <p className="text-sm font-medium text-white/50">Your referral link</p>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <span className="text-sm text-white/40 font-mono truncate flex-1">
            {link}
          </span>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400 text-xs font-medium transition-colors cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              window.open(
                `https://twitter.com/intent/tweet?text=Join+VYNS!+${encodeURIComponent(link)}`,
                "_blank",
              )
            }
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-sm text-white/40 hover:text-white/70 transition-all cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Share on X
          </button>
          <button
            onClick={() =>
              window.open(
                `https://t.me/share/url?url=${encodeURIComponent(link)}`,
                "_blank",
              )
            }
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-sm text-white/40 hover:text-white/70 transition-all cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Telegram
          </button>
        </div>
      </Card>

      {/* How it works */}
      <Card className="p-5">
        <p className="text-sm font-medium text-white/50 mb-4">How it works</p>
        <div className="space-y-3">
          {[
            "Share your link with friends",
            "They sign up and claim a username",
            "You earn 0.01 SOL per signup",
            "Bonus rewards for 10+ referrals",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border border-teal-500/30 text-teal-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <p className="text-sm text-white/40">{step}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
