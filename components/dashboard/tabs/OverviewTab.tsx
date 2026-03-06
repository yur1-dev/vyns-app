"use client";

// components/dashboard/tabs/OverviewTab.tsx

import { useState } from "react";
import {
  Zap,
  Crown,
  ArrowUpRight,
  Gift,
  Activity,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import {
  Card,
  SectionTitle,
  StatCard,
  tierFromLen,
  priceFromLen,
  TIER_CONFIG,
  Pill,
} from "@/components/dashboard/ui";
import type { UserData, TabId } from "@/types/dashboard";

// ── Claim Modal ───────────────────────────────────────────────────────────────
// Does NOT make its own fetch — delegates entirely to onClaim prop
// which comes from useDashboard.claimUsername

function ClaimModal({
  onClose,
  onClaim,
  onSuccess,
}: {
  onClose: () => void;
  onClaim: (username: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
}) {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errMsg, setErrMsg] = useState("");

  const clean = input.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const tier = clean.length >= 2 ? tierFromLen(clean.length) : null;
  const tierCfg = tier ? TIER_CONFIG[tier] : null;
  const isValid = clean.length >= 2 && clean.length <= 30;

  const handleClaim = async () => {
    if (!isValid) return;
    setStatus("loading");
    setErrMsg("");
    const res = await onClaim(clean);
    if (res.success) {
      setStatus("success");
      onSuccess();
    } else {
      setStatus("error");
      setErrMsg(res.error || "Something went wrong");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={status === "loading" ? undefined : onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0a0f1a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <Crown className="h-4 w-4 text-teal-400" />
            <p className="text-sm font-semibold text-white">Claim Username</p>
          </div>
          {status !== "loading" && (
            <button
              onClick={onClose}
              className="p-1.5 text-white/20 hover:text-white/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Success */}
        {status === "success" ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-teal-500/15 border border-teal-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7 text-teal-400" />
            </div>
            <p className="text-lg font-semibold text-white">
              @{clean} claimed!
            </p>
            <p className="text-sm text-white/40">
              Your username is now registered on VYNS.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full h-11 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-400 text-sm font-medium hover:bg-teal-500/25 transition-all cursor-pointer"
            >
              View in My Usernames →
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-sm font-medium select-none">
                  @
                </span>
                <input
                  autoFocus
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setStatus("idle");
                    setErrMsg("");
                  }}
                  placeholder="yourname"
                  maxLength={30}
                  disabled={status === "loading"}
                  className="w-full h-11 pl-8 pr-4 rounded-xl border border-white/[0.07] bg-white/[0.03] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/40 transition-all disabled:opacity-50"
                />
              </div>
              <p className="text-xs text-white/25">
                Letters, numbers, and underscores only · 2–30 characters
              </p>
            </div>

            {/* Tier + price preview */}
            {tierCfg && isValid && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="space-y-0.5">
                  <p className="text-xs text-white/30">Tier</p>
                  <Pill className={tierCfg.cls}>{tierCfg.label}</Pill>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-xs text-white/30">Price</p>
                  <p className="text-sm font-semibold text-white/40 line-through">
                    {priceFromLen(clean.length)} SOL
                  </p>
                  <p className="text-[11px] text-teal-400 font-medium">
                    Free during beta
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {status === "error" && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-xs">
                <X className="h-3.5 w-3.5 shrink-0" /> {errMsg}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleClaim}
              disabled={!isValid || status === "loading"}
              className="w-full h-11 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 text-sm font-semibold hover:bg-teal-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Claiming...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4" /> Claim @{clean || "username"}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  userData: UserData;
  session: any;
  onTabChange: (tab: TabId) => void;
  onClaimSuccess: () => void;
  // Comes from useDashboard.claimUsername — handles API + refresh
  onClaim: (username: string) => Promise<{ success: boolean; error?: string }>;
}

export default function OverviewTab({
  userData,
  session,
  onTabChange,
  onClaimSuccess,
  onClaim,
}: Props) {
  const [claimOpen, setClaimOpen] = useState(false);

  const QUICK_ACTIONS = [
    {
      label: "Claim Username",
      desc: "Register a new @handle",
      icon: Crown,
      accent: "text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/15 hover:border-teal-500/30 hover:bg-teal-500/15",
      action: () => setClaimOpen(true),
    },
    {
      label: "Stake Tokens",
      desc: "Lock SOL to earn yield",
      icon: Zap,
      accent: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/15 hover:border-violet-500/30 hover:bg-violet-500/15",
      action: () => onTabChange("staking"),
    },
    {
      label: "Invite Friends",
      desc: "Share your referral link",
      icon: Users,
      accent: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/15 hover:border-sky-500/30 hover:bg-sky-500/15",
      action: () => onTabChange("referrals"),
    },
    {
      label: "View Earnings",
      desc: "Track your yield history",
      icon: TrendingUp,
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/15 hover:border-emerald-500/30 hover:bg-emerald-500/15",
      action: () => onTabChange("earnings"),
    },
  ];

  return (
    <>
      {claimOpen && (
        <ClaimModal
          onClose={() => setClaimOpen(false)}
          onClaim={onClaim}
          onSuccess={() => {
            setClaimOpen(false);
            onClaimSuccess();
          }}
        />
      )}

      <div className="space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Usernames"
            value={userData.usernames.length}
            sub="registered"
            accent="text-teal-400"
          />
          <StatCard
            label="Total Earnings"
            value={`${(userData.earnings?.allTime ?? 0).toFixed(4)} SOL`}
            sub="all time"
            accent="text-emerald-400"
          />
          <StatCard
            label="Staked"
            value={`${userData.stakedAmount.toFixed(2)} SOL`}
            sub="currently locked"
            accent="text-violet-400"
          />
          <StatCard
            label="Referrals"
            value={userData.referrals}
            sub="users invited"
            accent="text-sky-400"
          />
        </div>

        {/* First-time CTA banner */}
        {userData.usernames.length === 0 && (
          <div className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-500/[0.07] to-indigo-500/[0.05] p-5">
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-400/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  Get your identity on-chain
                </p>
                <p className="text-xs text-white/40 leading-relaxed max-w-xs">
                  Short usernames earn more yield. Grab yours before someone
                  else does — free during beta.
                </p>
              </div>
              <button
                onClick={() => setClaimOpen(true)}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-semibold hover:bg-teal-500/30 transition-all cursor-pointer whitespace-nowrap"
              >
                <Crown className="h-3.5 w-3.5" /> Claim username
              </button>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <Card className="p-5">
          <SectionTitle>Quick actions</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={a.action}
                className={`flex flex-col items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer text-left ${a.bg}`}
              >
                <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center">
                  <a.icon className={`h-4 w-4 ${a.accent}`} />
                </div>
                <div>
                  <p className={`text-xs font-semibold ${a.accent}`}>
                    {a.label}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">{a.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Usernames summary — only shown once you have some */}
        {userData.usernames.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Your usernames</SectionTitle>
              <button
                onClick={() => onTabChange("usernames")}
                className="text-xs text-white/25 hover:text-teal-400 transition-colors cursor-pointer"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {userData.usernames.slice(0, 3).map((u: any) => {
                const name = u.name ?? u.username ?? "";
                const tier = (u.tier ??
                  tierFromLen(name.length)) as keyof typeof TIER_CONFIG;
                const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.Bronze;
                return (
                  <div
                    key={name}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Crown className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                      <span className="text-sm font-medium text-white/80">
                        @{name}
                      </span>
                    </div>
                    <Pill className={cfg.cls}>{cfg.label}</Pill>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Activity */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Recent activity</SectionTitle>
            <Clock className="h-3.5 w-3.5 text-white/15 -mt-4" />
          </div>
          {userData.activity.length === 0 ? (
            <div className="py-10 text-center">
              <Activity className="h-6 w-6 mx-auto mb-3 text-white/10" />
              <p className="text-sm text-white/20">No activity yet</p>
              <p className="text-xs text-white/15 mt-1">
                Claim a username or stake to get started
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {userData.activity.slice(0, 6).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        item.type === "staking"
                          ? "bg-violet-500/10"
                          : item.type === "referral"
                            ? "bg-sky-500/10"
                            : item.type === "claim"
                              ? "bg-teal-500/10"
                              : item.type === "received"
                                ? "bg-emerald-500/10"
                                : "bg-red-500/10"
                      }`}
                    >
                      {item.type === "staking" && (
                        <Zap className="h-3.5 w-3.5 text-violet-400" />
                      )}
                      {item.type === "referral" && (
                        <Gift className="h-3.5 w-3.5 text-sky-400" />
                      )}
                      {item.type === "claim" && (
                        <Crown className="h-3.5 w-3.5 text-teal-400" />
                      )}
                      {item.type === "received" && (
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400 rotate-180" />
                      )}
                      {item.type === "sent" && (
                        <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-white/70">
                        {item.description || item.type}
                      </p>
                      <p className="text-xs text-white/25">{item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white tabular-nums">
                      {item.amount > 0 ? `+${item.amount}` : item.amount}{" "}
                      <span className="text-white/30 text-xs">
                        {item.token}
                      </span>
                    </p>
                    {item.signature && (
                      <a
                        href={`https://solscan.io/tx/${item.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
