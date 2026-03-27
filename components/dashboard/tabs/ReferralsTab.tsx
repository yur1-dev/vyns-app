"use client";

// components/dashboard/tabs/ReferralsTab.tsx

import { useState } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  Gift,
  Loader2,
  AlertCircle,
  Coins,
  TrendingUp,
  Users,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Card, SectionTitle } from "@/components/dashboard/ui";
import type { UserData } from "@/types/dashboard";
import {
  REFERRAL_TIERS,
  getCurrentReferralTier,
  getNextReferralTier,
} from "@/types/dashboard";

interface Props {
  userData: UserData;
  wallet: string | null;
  onClaimReferralRewards: () => Promise<{
    success: boolean;
    error?: string;
    solRewarded?: number;
    vynsRewarded?: number;
  }>;
}

export default function ReferralsTab({
  userData,
  wallet,
  onClaimReferralRewards,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimDone, setClaimDone] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [lastReward, setLastReward] = useState<{
    sol: number;
    vyns: number;
  } | null>(null);

  const code = userData.referralCode || wallet?.slice(0, 8) || "VYNS0000";
  const link = `https://vyns-app.vercel.app/ref/${code}`;

  const referrals = userData.referrals ?? 0;
  const unclaimedSol = userData.unclaimedReferralSol ?? 0;
  const unclaimedVyns = userData.unclaimedVyns ?? 0;
  const claimedVyns = userData.claimedVyns ?? 0;
  const isPending = userData.referralClaimPending ?? false;
  const hasPending = unclaimedSol > 0 || unclaimedVyns > 0;

  const currentTier = getCurrentReferralTier(referrals);
  const nextTier = getNextReferralTier(referrals);
  const progress = nextTier
    ? Math.min(
        100,
        ((referrals - currentTier.minReferrals) /
          (nextTier.minReferrals - currentTier.minReferrals)) *
          100,
      )
    : 100;

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaim = async () => {
    if (claiming || isPending || !hasPending) return;
    setClaiming(true);
    setClaimError("");
    setLastReward(null);
    const result = await onClaimReferralRewards();
    setClaiming(false);
    if (result.success) {
      setClaimDone(true);
      setLastReward({
        sol: result.solRewarded ?? 0,
        vyns: result.vynsRewarded ?? 0,
      });
      setTimeout(() => setClaimDone(false), 4000);
    } else {
      setClaimError(result.error ?? "Claim failed. Please try again.");
    }
  };

  const isBusy = claiming || isPending;

  return (
    <div className="space-y-4">
      <SectionTitle>Referrals</SectionTitle>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white tabular-nums leading-none">
              {referrals}
            </p>
            <p className="text-[11px] text-white/30 mt-0.5">Total referrals</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4 text-teal-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-teal-400 tabular-nums leading-none">
              {(userData.referralEarnings ?? 0).toFixed(4)}
            </p>
            <p className="text-[11px] text-white/30 mt-0.5">SOL earned</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Coins className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-violet-400 tabular-nums leading-none">
              {claimedVyns.toLocaleString()}
            </p>
            <p className="text-[11px] text-white/30 mt-0.5">VYNS earned</p>
          </div>
        </Card>

        <Card
          className={`p-4 flex items-center gap-3 ${currentTier.bgColor} ${currentTier.borderColor}`}
        >
          <div
            className={`w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0`}
          >
            <Zap className={`h-4 w-4 ${currentTier.color}`} />
          </div>
          <div>
            <p
              className={`text-xl font-bold tabular-nums leading-none ${currentTier.color}`}
            >
              {currentTier.label}
            </p>
            <p className="text-[11px] text-white/30 mt-0.5">Current tier</p>
          </div>
        </Card>
      </div>

      {/* ── Claim banner ──────────────────────────────────────────────────── */}
      {hasPending && !claimDone && (
        <div className="p-4 rounded-2xl bg-teal-500/[0.07] border border-teal-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
              <Gift className="h-4 w-4 text-teal-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-teal-400 truncate">
                Rewards ready
              </p>
              <p className="text-[11px] text-teal-400/50 mt-0.5 truncate">
                {unclaimedSol.toFixed(4)} SOL + {unclaimedVyns.toLocaleString()}{" "}
                VYNS
              </p>
            </div>
          </div>
          <button
            onClick={handleClaim}
            disabled={isBusy}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-400 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Claiming…
              </>
            ) : (
              <>
                <Gift className="h-3.5 w-3.5" /> Claim
              </>
            )}
          </button>
        </div>
      )}

      {claimDone && lastReward && (
        <div className="p-4 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Check className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">Claimed!</p>
            <p className="text-[11px] text-emerald-400/50 mt-0.5">
              +{lastReward.sol.toFixed(4)} SOL · +
              {lastReward.vyns.toLocaleString()} VYNS
            </p>
          </div>
        </div>
      )}

      {!hasPending && !claimDone && (
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center shrink-0">
            <Gift className="h-4 w-4 text-white/15" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/30">No rewards yet</p>
            <p className="text-[11px] text-white/15 mt-0.5">
              Share your link — rewards appear once friends sign up
            </p>
          </div>
        </div>
      )}

      {claimError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {claimError}
        </div>
      )}

      {/* ── Tier progression ──────────────────────────────────────────────── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white/60">Tier progress</p>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${currentTier.color} ${currentTier.bgColor} ${currentTier.borderColor}`}
          >
            {currentTier.label}
          </span>
        </div>

        {/* Segmented progress */}
        <div className="flex items-center gap-1">
          {REFERRAL_TIERS.map((tier, i) => {
            const unlocked = referrals >= tier.minReferrals;
            const isCurrent = currentTier.id === tier.id;
            return (
              <div
                key={tier.id}
                className="flex-1 flex flex-col items-center gap-1.5"
              >
                <div
                  className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                    unlocked ? "bg-teal-500" : "bg-white/[0.06]"
                  } ${isCurrent ? "ring-1 ring-teal-400/30 ring-offset-1 ring-offset-transparent" : ""}`}
                />
                <span
                  className={`text-[9px] font-medium ${unlocked ? tier.color : "text-white/15"}`}
                >
                  {tier.label}
                </span>
              </div>
            );
          })}
        </div>

        {nextTier ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-white/30">{referrals} referrals</span>
              <span className="text-white/20">
                {nextTier.minReferrals - referrals} to {nextTier.label}
              </span>
            </div>
            <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-teal-400/60">Max tier reached — Legend!</p>
        )}

        {/* Rate table — compact */}
        <div className="rounded-xl overflow-hidden border border-white/[0.05]">
          <div className="grid grid-cols-4 px-3 py-2 bg-white/[0.02] text-[10px] text-white/20 uppercase tracking-wider">
            <span>Tier</span>
            <span className="text-center">Min</span>
            <span className="text-center">SOL</span>
            <span className="text-right">VYNS</span>
          </div>
          {REFERRAL_TIERS.map((tier) => {
            const isActive = currentTier.id === tier.id;
            const unlocked = referrals >= tier.minReferrals;
            return (
              <div
                key={tier.id}
                className={`grid grid-cols-4 px-3 py-2.5 text-xs border-t border-white/[0.04] transition-colors ${
                  isActive ? "bg-white/[0.03]" : ""
                }`}
              >
                <span
                  className={`font-semibold ${unlocked ? tier.color : "text-white/20"}`}
                >
                  {tier.label}
                  {isActive && (
                    <span className="ml-1 text-[9px] text-white/15 font-normal">
                      you
                    </span>
                  )}
                </span>
                <span
                  className={`text-center ${unlocked ? "text-white/40" : "text-white/15"}`}
                >
                  {tier.minReferrals === 0 ? "—" : `${tier.minReferrals}+`}
                </span>
                <span
                  className={`text-center font-medium ${isActive ? "text-teal-400" : unlocked ? "text-white/30" : "text-white/15"}`}
                >
                  {tier.solPerReferral}
                </span>
                <span
                  className={`text-right font-medium ${isActive ? "text-violet-400" : unlocked ? "text-white/30" : "text-white/15"}`}
                >
                  {tier.vynsPerReferral}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Referral link ─────────────────────────────────────────────────── */}
      <Card className="p-5 space-y-3">
        <p className="text-sm font-medium text-white/50">Your referral link</p>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <span className="text-sm text-white/35 font-mono truncate flex-1 text-[12px]">
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
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-sm text-white/35 hover:text-white/60 transition-all cursor-pointer"
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
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-sm text-white/35 hover:text-white/60 transition-all cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Telegram
          </button>
        </div>
      </Card>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <Card className="p-5">
        <p className="text-sm font-medium text-white/40 mb-4">How it works</p>
        <div className="space-y-3">
          {[
            `Share your link — earn ${currentTier.solPerReferral} SOL + ${currentTier.vynsPerReferral} VYNS per signup`,
            "They claim a username on VYNS",
            "Rewards drop into your dashboard instantly",
            "More referrals = higher tier = bigger rewards",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full border border-teal-500/25 text-teal-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-white/35 leading-snug">{step}</p>
            </div>
          ))}
        </div>

        {nextTier && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <ChevronRight className="h-3.5 w-3.5 text-white/15 shrink-0" />
            <p className="text-[11px] text-white/20 leading-relaxed">
              Reach <span className={nextTier.color}>{nextTier.label}</span> at{" "}
              {nextTier.minReferrals} referrals for{" "}
              <span className="text-teal-400/60">
                {nextTier.solPerReferral} SOL
              </span>{" "}
              +{" "}
              <span className="text-violet-400/60">
                {nextTier.vynsPerReferral} VYNS
              </span>{" "}
              per referral
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
