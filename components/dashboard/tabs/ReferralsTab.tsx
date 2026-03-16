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
  Star,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card, SectionTitle, Pill } from "@/components/dashboard/ui";
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

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({
  label,
  color,
  bgColor,
  borderColor,
  active,
}: {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  active: boolean;
}) {
  return (
    <div
      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
        active
          ? `${bgColor} ${borderColor} ${color}`
          : "bg-white/[0.02] border-white/[0.05] text-white/15"
      }`}
    >
      {label}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  const link = `https://vyns.io/ref/${code}`;

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
    <div className="space-y-5">
      <SectionTitle>Referrals</SectionTitle>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total referrals",
            value: referrals,
            accent: "text-sky-400",
            icon: <Users className="h-3.5 w-3.5" />,
          },
          {
            label: "SOL earned",
            value: `${(userData.referralEarnings ?? 0).toFixed(4)} SOL`,
            accent: "text-teal-400",
            icon: <TrendingUp className="h-3.5 w-3.5" />,
          },
          {
            label: "VYNS earned",
            value: claimedVyns.toLocaleString(),
            accent: "text-violet-400",
            icon: <Coins className="h-3.5 w-3.5" />,
          },
          {
            label: "Current tier",
            value: currentTier.label,
            accent: currentTier.color,
            icon: <Star className="h-3.5 w-3.5" />,
          },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <div
              className={`flex items-center justify-center gap-1.5 mb-2 ${s.accent} opacity-40`}
            >
              {s.icon}
            </div>
            <p
              className={`text-xl font-semibold tabular-nums leading-none ${s.accent}`}
            >
              {s.value}
            </p>
            <p className="text-[10px] text-white/20 mt-1.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* ── Claim reward banner ────────────────────────────────────────────── */}
      {hasPending && !claimDone && (
        <div className="p-4 rounded-2xl bg-teal-500/[0.07] border border-teal-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
              <Gift className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-teal-400">
                Rewards ready to claim
              </p>
              <p className="text-xs text-teal-400/50 mt-0.5">
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

      {/* Claim success state */}
      {claimDone && lastReward && (
        <div className="p-4 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Check className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              Rewards claimed!
            </p>
            <p className="text-xs text-emerald-400/50 mt-0.5">
              +{lastReward.sol.toFixed(4)} SOL and +
              {lastReward.vyns.toLocaleString()} VYNS added to your account
            </p>
          </div>
        </div>
      )}

      {/* No pending state */}
      {!hasPending && !claimDone && (
        <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.05] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
            <Sparkles className="h-4.5 w-4.5 text-white/20" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/40">
              No rewards to claim yet
            </p>
            <p className="text-xs text-white/20 mt-0.5">
              Invite friends using your link — rewards appear here once they
              sign up
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
          <p className="text-sm font-semibold text-white/60">Referral tiers</p>
          <Pill
            className={`${currentTier.color} ${currentTier.bgColor} ${currentTier.borderColor}`}
          >
            {currentTier.label}
          </Pill>
        </div>

        {/* Tier ladder */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {REFERRAL_TIERS.map((tier) => (
            <TierBadge
              key={tier.id}
              label={tier.label}
              color={tier.color}
              bgColor={tier.bgColor}
              borderColor={tier.borderColor}
              active={referrals >= tier.minReferrals}
            />
          ))}
        </div>

        {/* Progress to next tier */}
        {nextTier ? (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/30">
                {referrals} / {nextTier.minReferrals} referrals
              </span>
              <span className="text-white/20">
                {nextTier.minReferrals - referrals} more to {nextTier.label}
              </span>
            </div>
            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-teal-400/60">
            🎉 You've reached the highest tier — Legend!
          </p>
        )}

        {/* Reward rates table */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] divide-y divide-white/[0.04] overflow-hidden">
          <div className="grid grid-cols-4 px-4 py-2 text-[10px] text-white/20 uppercase tracking-widest font-medium">
            <span>Tier</span>
            <span className="text-center">From</span>
            <span className="text-center">SOL / referral</span>
            <span className="text-right">VYNS / referral</span>
          </div>
          {REFERRAL_TIERS.map((tier) => {
            const isActive = currentTier.id === tier.id;
            return (
              <div
                key={tier.id}
                className={`grid grid-cols-4 px-4 py-2.5 text-xs transition-colors ${
                  isActive ? "bg-white/[0.03]" : ""
                }`}
              >
                <span
                  className={`font-semibold ${isActive ? tier.color : "text-white/30"}`}
                >
                  {tier.label}
                  {isActive && (
                    <span className="ml-1.5 text-[9px] text-white/20 font-normal">
                      ← you
                    </span>
                  )}
                </span>
                <span className="text-center text-white/25">
                  {tier.minReferrals === 0 ? "—" : `${tier.minReferrals}+`}
                </span>
                <span
                  className={`text-center font-medium ${isActive ? "text-teal-400" : "text-white/20"}`}
                >
                  {tier.solPerReferral} SOL
                </span>
                <span
                  className={`text-right font-medium ${isActive ? "text-violet-400" : "text-white/20"}`}
                >
                  {tier.vynsPerReferral} VYNS
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Your referral link ─────────────────────────────────────────────── */}
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

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <Card className="p-5">
        <p className="text-sm font-medium text-white/50 mb-4">How it works</p>
        <div className="space-y-3">
          {[
            `Share your link — earn ${currentTier.solPerReferral} SOL + ${currentTier.vynsPerReferral} VYNS per signup`,
            "They sign up and claim a username on VYNS",
            "Rewards appear in your dashboard instantly",
            "Reach higher tiers by inviting more friends for bigger rewards",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full border border-teal-500/30 text-teal-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-white/40">{step}</p>
            </div>
          ))}
        </div>

        {nextTier && (
          <div className="mt-4 flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.025] border border-white/[0.04]">
            <ChevronRight className="h-3.5 w-3.5 text-teal-400/40 shrink-0" />
            <p className="text-xs text-white/25">
              Reach <span className={nextTier.color}>{nextTier.label}</span> at{" "}
              {nextTier.minReferrals} referrals to earn{" "}
              <span className="text-teal-400/70">
                {nextTier.solPerReferral} SOL
              </span>{" "}
              +{" "}
              <span className="text-violet-400/70">
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
