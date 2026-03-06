"use client";

// components/dashboard/modals/UsernameModal.tsx

import { useState, useEffect } from "react";
import {
  Crown,
  X,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  tierFromLen,
  priceFromLen,
  TIER_CONFIG,
  Pill,
} from "@/components/dashboard/ui";

interface Props {
  open: boolean;
  balance: number;
  onClose: () => void;
  // onClaim handles everything: auth check, API call, refresh
  onClaim: (username: string) => Promise<{ success: boolean; error?: string }>;
}

type Step = "input" | "confirm" | "claiming" | "success" | "error";

export default function UsernameModal({
  open,
  balance,
  onClose,
  onClaim,
}: Props) {
  const [input, setInput] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [errMsg, setErrMsg] = useState("");

  const clean = input.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const tier = clean.length >= 2 ? tierFromLen(clean.length) : null;
  const tierCfg = tier ? TIER_CONFIG[tier] : null;
  const price = clean.length >= 2 ? priceFromLen(clean.length) : 0;
  const isValid = clean.length >= 2 && clean.length <= 30;

  // Reset on open
  useEffect(() => {
    if (open) {
      setInput("");
      setStep("input");
      setErrMsg("");
    }
  }, [open]);

  if (!open) return null;

  const handleClaim = async () => {
    if (!isValid) return;
    setStep("claiming");
    setErrMsg("");

    const res = await onClaim(clean);

    if (res.success) {
      setStep("success");
    } else {
      setErrMsg(res.error || "Something went wrong");
      setStep("error");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={step === "claiming" ? undefined : onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0a0f1a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <Crown className="h-4 w-4 text-teal-400" />
            <p className="text-sm font-semibold text-white">Claim Username</p>
          </div>
          {step !== "claiming" && (
            <button
              onClick={onClose}
              className="p-1.5 text-white/20 hover:text-white/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Input step ── */}
        {step === "input" && (
          <div className="p-6 space-y-5">
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
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="yourname"
                  maxLength={30}
                  className="w-full h-11 pl-8 pr-4 rounded-xl border border-white/[0.07] bg-white/[0.03] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/40 transition-all"
                />
              </div>
              <p className="text-xs text-white/25">
                Letters, numbers, underscores · 2–30 characters
              </p>
            </div>

            {/* Tier + price preview */}
            {tierCfg && isValid && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                <div className="space-y-1">
                  <p className="text-[11px] text-white/30 uppercase tracking-widest">
                    Tier
                  </p>
                  <Pill className={tierCfg.cls}>{tierCfg.label}</Pill>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[11px] text-white/30 uppercase tracking-widest">
                    Price
                  </p>
                  <p className="text-lg font-bold text-white tabular-nums">
                    {price} SOL
                  </p>
                  <p className="text-[10px] text-teal-400">Free during beta</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 rounded-xl bg-sky-500/[0.06] border border-sky-500/15 text-sky-400 text-xs leading-relaxed">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Usernames are free during beta. Payment will be required at
              launch.
            </div>

            <button
              onClick={() => setStep("confirm")}
              disabled={!isValid}
              className="w-full h-11 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 text-sm font-semibold hover:bg-teal-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <Crown className="h-4 w-4" />
              Continue with @{clean || "username"}
            </button>
          </div>
        )}

        {/* ── Confirm step ── */}
        {step === "confirm" && (
          <div className="p-6 space-y-5">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-xs text-white/40">Username</p>
                <p className="text-sm font-semibold text-white">@{clean}</p>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-xs text-white/40">Tier</p>
                {tierCfg && (
                  <Pill className={tierCfg.cls}>{tierCfg.label}</Pill>
                )}
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-xs text-white/40">Cost</p>
                <div className="text-right">
                  <p className="text-sm font-bold text-white line-through opacity-30 tabular-nums">
                    {price} SOL
                  </p>
                  <p className="text-xs text-teal-400 font-medium">
                    Free during beta
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep("input")}
                className="flex-1 h-11 rounded-xl border border-white/[0.07] bg-white/[0.02] text-white/40 text-sm hover:text-white/70 hover:bg-white/[0.05] transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleClaim}
                className="flex-[2] h-11 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 text-sm font-semibold hover:bg-teal-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Crown className="h-4 w-4" /> Claim @{clean}
              </button>
            </div>
          </div>
        )}

        {/* ── Claiming step ── */}
        {step === "claiming" && (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Registering @{clean}…
              </p>
              <p className="text-xs text-white/30 mt-1">
                This will only take a moment
              </p>
            </div>
          </div>
        )}

        {/* ── Success step ── */}
        {step === "success" && (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-teal-400" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-white">@{clean} is yours!</p>
              <p className="text-xs text-white/35">
                Your username is now registered on VYNS.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full h-10 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-400 text-sm font-medium hover:bg-teal-500/25 transition-all cursor-pointer"
            >
              View in My Usernames →
            </button>
          </div>
        )}

        {/* ── Error step ── */}
        {step === "error" && (
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/[0.07] border border-red-500/15">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400">
                  Claim failed
                </p>
                <p className="text-xs text-white/40 mt-1 leading-relaxed">
                  {errMsg}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("input")}
                className="flex-1 h-10 rounded-xl border border-white/[0.07] bg-white/[0.02] text-white/50 text-sm hover:text-white/70 transition-all cursor-pointer"
              >
                Try again
              </button>
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-xl border border-white/[0.07] text-white/30 text-sm hover:text-white/60 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
