"use client";

// components/dashboard/tabs/OverviewTab.tsx

import { useState, useEffect, useRef } from "react";
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
  Send,
  Wallet,
  AlertCircle,
  ExternalLink,
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
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// ── Claim Modal ───────────────────────────────────────────────────────────────

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

            {status === "error" && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-xs">
                <X className="h-3.5 w-3.5 shrink-0" /> {errMsg}
              </div>
            )}

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

// ── Transfer Modal ────────────────────────────────────────────────────────────

type TransferStep = "input" | "confirm" | "sending" | "success" | "error";

function TransferModal({
  senderUsername,
  onClose,
  onSuccess,
  onRefreshBalance,
}: {
  senderUsername: string | null;
  onClose: () => void;
  onSuccess: () => void;
  onRefreshBalance?: () => void;
}) {
  const [step, setStep] = useState<TransferStep>("input");
  const [toInput, setToInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [resolvedWallet, setResolvedWallet] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const cleanTo = toInput.toLowerCase().replace(/^@/, "").trim();
  const amount = parseFloat(amountInput);
  const isValidAmount = !isNaN(amount) && amount > 0;
  const canConfirm = resolvedWallet && isValidAmount && !resolveError;

  // Auto-resolve username as user types
  useEffect(() => {
    if (cleanTo.length < 2) {
      setResolvedWallet(null);
      setResolveError("");
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setResolving(true);
      setResolveError("");
      setResolvedWallet(null);
      try {
        const res = await fetch(
          `/api/transfer/resolve?username=${encodeURIComponent(cleanTo)}`,
        );
        const data = await res.json();
        if (data.wallet) {
          setResolvedWallet(data.wallet);
        } else {
          setResolveError(data.error ?? "Username not found");
        }
      } catch {
        setResolveError("Failed to resolve username");
      } finally {
        setResolving(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cleanTo]);

  const handleSend = async () => {
    if (!resolvedWallet || !isValidAmount) return;
    setStep("sending");
    setErrorMsg("");

    try {
      // Get Phantom
      const solana = (window as any).phantom?.solana ?? (window as any).solana;
      if (!solana?.isPhantom) {
        throw new Error("Phantom wallet not found. Please install Phantom.");
      }
      if (!solana.isConnected) {
        await solana.connect();
      }

      const fromPubkey = new PublicKey(solana.publicKey.toString());
      const toPubkey = new PublicKey(resolvedWallet);

      const rpcUrl =
        process.env.NEXT_PUBLIC_SOLANA_RPC ||
        "https://rpc.ankr.com/solana_devnet";
      const connection = new Connection(rpcUrl, {
        commitment: "confirmed",
        wsEndpoint: undefined,
      });

      const lamports = Math.round(amount * LAMPORTS_PER_SOL);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: fromPubkey,
      }).add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        }),
      );

      // Sign via Phantom
      const signed = await solana.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signed.serialize());

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      // Record in DB
      await fetch("/api/transfer/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fromUsername: senderUsername ?? solana.publicKey.toString(),
          toUsername: cleanTo,
          amount,
          txHash: signature,
        }),
      });

      setTxHash(signature);
      setStep("success");
      onSuccess();
      onRefreshBalance?.();
    } catch (err: any) {
      // User rejected
      if (err.code === 4001 || err.message?.includes("User rejected")) {
        setStep("confirm");
        return;
      }
      setErrorMsg(err.message ?? "Transaction failed");
      setStep("error");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={step === "sending" ? undefined : onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0a0f1a] shadow-2xl overflow-hidden">
        {/* Top accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <Send className="h-4 w-4 text-indigo-400" />
            <p className="text-sm font-semibold text-white">Send SOL</p>
          </div>
          {step !== "sending" && (
            <button
              onClick={onClose}
              className="p-1.5 text-white/20 hover:text-white/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Success ── */}
        {step === "success" && (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-white mb-1">
                Sent successfully!
              </p>
              <p className="text-sm text-white/35">
                {amount} SOL → @{cleanTo}
              </p>
            </div>
            {txHash && (
              <a
                href={`https://solscan.io/tx/${txHash}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                View on Solscan
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {step === "error" && (
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/[0.06] border border-red-500/20">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400 mb-1">
                  Transaction failed
                </p>
                <p className="text-xs text-red-400/70 leading-relaxed">
                  {errorMsg}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("confirm")}
                className="flex-1 h-10 rounded-xl border border-white/[0.07] text-white/40 text-sm hover:text-white/70 transition-all cursor-pointer"
              >
                Try again
              </button>
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-xl bg-white/[0.04] text-white/50 text-sm hover:text-white/70 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ── Sending ── */}
        {step === "sending" && (
          <div className="p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
              <Loader2 className="h-7 w-7 text-indigo-400 animate-spin" />
            </div>
            <div>
              <p className="text-base font-semibold text-white mb-1">
                Sending…
              </p>
              <p className="text-sm text-white/35">
                Confirm in Phantom, then waiting for confirmation
              </p>
            </div>
          </div>
        )}

        {/* ── Confirm ── */}
        {step === "confirm" && (
          <div className="p-6 space-y-4">
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] divide-y divide-white/[0.04]">
              {[
                ["To", `@${cleanTo}`],
                [
                  "Wallet",
                  `${resolvedWallet!.slice(0, 8)}…${resolvedWallet!.slice(-6)}`,
                ],
                ["Amount", `${amount} SOL`],
                ["Network fee", "~0.000005 SOL"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-xs text-white/30">{k}</span>
                  <span className="text-sm text-white/70 font-mono">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400/80 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-400/70 leading-relaxed">
                This is a real on-chain transaction. Double-check the recipient
                before confirming.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep("input")}
                className="flex-1 h-11 rounded-xl border border-white/[0.07] text-white/35 text-sm hover:text-white/60 transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleSend}
                className="flex-1 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-sm font-semibold hover:bg-indigo-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                Confirm & Send
              </button>
            </div>
          </div>
        )}

        {/* ── Input ── */}
        {step === "input" && (
          <div className="p-6 space-y-5">
            {/* Recipient */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
                Recipient
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-sm font-medium select-none">
                  @
                </span>
                <input
                  autoFocus
                  type="text"
                  value={toInput}
                  onChange={(e) => {
                    setToInput(e.target.value);
                    setResolveError("");
                  }}
                  placeholder="username"
                  className="w-full h-11 pl-8 pr-10 rounded-xl border border-white/[0.07] bg-white/[0.03] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {resolving && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white/20" />
                  )}
                  {!resolving && resolvedWallet && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  {!resolving && resolveError && cleanTo.length >= 2 && (
                    <X className="h-3.5 w-3.5 text-red-400" />
                  )}
                </div>
              </div>

              {/* Wallet preview */}
              {resolvedWallet && !resolveError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15">
                  <Wallet className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {resolvedWallet.slice(0, 10)}…{resolvedWallet.slice(-8)}
                  </span>
                </div>
              )}
              {resolveError && cleanTo.length >= 2 && (
                <p className="text-[11px] text-red-400/70">{resolveError}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 pl-4 pr-16 rounded-xl border border-white/[0.07] bg-white/[0.03] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/25 font-medium">
                  SOL
                </span>
              </div>
              {/* Quick amount buttons */}
              <div className="flex gap-2">
                {["0.01", "0.1", "0.5", "1"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmountInput(v)}
                    className="flex-1 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/30 hover:text-white/60 hover:border-white/[0.12] transition-all cursor-pointer"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep("confirm")}
              disabled={!canConfirm}
              className="w-full h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-sm font-semibold hover:bg-indigo-500/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              Review Transfer
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
  onClaim: (username: string) => Promise<{ success: boolean; error?: string }>;
  wallet?: string | null;
  activeUsername?: string | null;
}

export default function OverviewTab({
  userData,
  session,
  onTabChange,
  onClaimSuccess,
  onClaim,
  wallet,
  activeUsername,
}: Props) {
  const [claimOpen, setClaimOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

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
      label: "Send SOL",
      desc: "Transfer to any @handle",
      icon: Send,
      accent: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/15 hover:border-indigo-500/30 hover:bg-indigo-500/15",
      action: () => setTransferOpen(true),
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

      {transferOpen && (
        <TransferModal
          senderUsername={activeUsername ?? null}
          onClose={() => setTransferOpen(false)}
          onSuccess={() => {
            onClaimSuccess();
          }}
          onRefreshBalance={() => {
            // Trigger balance refresh via useDashboard visibilitychange
            document.dispatchEvent(new Event("vyns:refresh-balance"));
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

        {/* Usernames summary */}
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
                                : item.type === "transaction"
                                  ? "bg-indigo-500/10"
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
                      {item.type === "transaction" && (
                        <Send className="h-3.5 w-3.5 text-indigo-400" />
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
                        href={`https://solscan.io/tx/${item.signature}?cluster=devnet`}
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
