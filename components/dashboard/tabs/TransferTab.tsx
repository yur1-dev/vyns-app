"use client";

// components/dashboard/tabs/TransferTab.tsx

import { useState, useEffect, useRef } from "react";
import {
  Send,
  Loader2,
  X,
  Check,
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
  Wallet,
  Clock,
  Activity,
} from "lucide-react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

type TransferStep = "input" | "confirm" | "sending" | "success" | "error";

interface RecentTx {
  to: string;
  amount: number;
  txHash: string;
  date: string;
}

interface Props {
  wallet: string | null;
  activeUsername: string | null;
  onSendSuccess: () => void;
}

export default function TransferTab({
  wallet,
  activeUsername,
  onSendSuccess,
}: Props) {
  const [step, setStep] = useState<TransferStep>("input");
  const [toInput, setToInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [resolvedWallet, setResolvedWallet] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [recentTxs, setRecentTxs] = useState<RecentTx[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const cleanTo = toInput.toLowerCase().replace(/^@/, "").trim();
  const amount = parseFloat(amountInput);
  const isValidAmount = !isNaN(amount) && amount > 0;
  const canConfirm = resolvedWallet && isValidAmount && !resolveError;
  const platformFee = isValidAmount ? amount * 0.025 : 0;
  const totalDeducted = isValidAmount ? amount * 1.025 + 0.000005 : 0;
  const isDevnet = !(process.env.NEXT_PUBLIC_SOLANA_RPC || "").includes(
    "mainnet",
  );

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
        if (data.wallet) setResolvedWallet(data.wallet);
        else setResolveError(data.error ?? "Username not found");
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
      const solana = (window as any).phantom?.solana ?? (window as any).solana;
      if (!solana?.isPhantom)
        throw new Error("Phantom wallet not found. Please install Phantom.");
      if (!solana.isConnected) await solana.connect();
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
      }).add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports }));
      const signed = await solana.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });
      await fetch("/api/transfer/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fromUsername: activeUsername ?? solana.publicKey.toString(),
          toUsername: cleanTo,
          amount,
          txHash: signature,
        }),
      });
      setTxHash(signature);
      setRecentTxs((prev) => [
        {
          to: cleanTo,
          amount,
          txHash: signature,
          date: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 4),
      ]);
      setStep("success");
      onSendSuccess();
      document.dispatchEvent(new Event("vyns:refresh-balance"));
    } catch (err: any) {
      if (err.code === 4001 || err.message?.includes("User rejected")) {
        setStep("confirm");
        return;
      }
      setErrorMsg(err.message ?? "Transaction failed");
      setStep("error");
    }
  };

  const resetForm = () => {
    setToInput("");
    setAmountInput("");
    setResolvedWallet(null);
    setResolveError("");
    setTxHash("");
    setErrorMsg("");
    setStep("input");
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-[8px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Send className="h-[15px] w-[15px] text-indigo-400/90" />
          </div>
          <h1 className="text-lg font-medium text-white/90">Send SOL</h1>
        </div>
        <p className="text-sm text-white/30 ml-11">
          Transfer SOL to any @username instantly
        </p>
      </div>

      {/* No wallet warning */}
      {!wallet && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/15">
          <AlertCircle className="h-4 w-4 text-amber-400/80 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400/80 mb-0.5">
              Wallet not connected
            </p>
            <p className="text-xs text-amber-400/50 leading-relaxed">
              Connect your Phantom wallet from the header to send SOL.
            </p>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0a0f1a] overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        {/* Step indicator */}
        {step !== "success" && step !== "error" && (
          <div className="flex items-center px-5 pt-4 pb-0 gap-1">
            {["input", "confirm", "sending"].map((s, i) => {
              const cur = step === "input" ? 0 : step === "confirm" ? 1 : 2;
              return (
                <div
                  key={s}
                  className="flex items-center"
                  style={{ flex: i < 2 ? 1 : 0 }}
                >
                  <div
                    className="h-1 rounded-full transition-all duration-300"
                    style={{
                      width: i === cur ? 20 : 6,
                      background:
                        i < cur
                          ? "rgba(52,211,153,0.5)"
                          : i === cur
                            ? "rgba(99,120,255,0.8)"
                            : "rgba(255,255,255,0.08)",
                    }}
                  />
                  {i < 2 && (
                    <div className="flex-1 h-px bg-white/[0.05] mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Input ── */}
        {step === "input" && (
          <div className="p-5 space-y-5">
            {/* Recipient */}
            <div>
              <p className="text-[10px] font-medium text-white/25 uppercase tracking-[0.08em] mb-2">
                Recipient
              </p>
              <div className="relative">
                <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-sm text-white/20 font-medium pointer-events-none z-10">
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
                  disabled={!wallet}
                  className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-[10px] pl-7 pr-10 text-sm text-white/85 placeholder-white/[0.18] outline-none transition-all focus:border-indigo-500/40 focus:bg-indigo-500/[0.04] disabled:opacity-40 font-sans"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {resolving && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white/20" />
                  )}
                  {!resolving && resolvedWallet && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                  {!resolving && resolveError && cleanTo.length >= 2 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  )}
                </div>
              </div>
              {resolvedWallet && !resolveError && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-[8px] bg-emerald-500/[0.06] border border-emerald-500/15">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[11px] font-mono text-emerald-400/80">
                    {resolvedWallet.slice(0, 12)}…{resolvedWallet.slice(-8)}
                  </span>
                  <span className="text-[10px] text-emerald-400/40 ml-auto">
                    verified
                  </span>
                </div>
              )}
              {resolveError && cleanTo.length >= 2 && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-[8px] bg-red-500/[0.06] border border-red-500/15">
                  <AlertCircle className="h-3 w-3 text-red-400/80 shrink-0" />
                  <span className="text-[11px] text-red-400/70">
                    {resolveError}
                  </span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <p className="text-[10px] font-medium text-white/25 uppercase tracking-[0.08em] mb-2">
                Amount
              </p>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0.00"
                  disabled={!wallet}
                  className="w-full h-16 bg-white/[0.02] border border-white/[0.07] rounded-[10px] px-4 pr-16 text-[28px] font-medium text-white/90 placeholder-white/10 outline-none transition-all focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-sans"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-white/20 tracking-[0.05em]">
                  SOL
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {["0.01", "0.1", "0.5", "1"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmountInput(v)}
                    disabled={!wallet}
                    className={`h-8 rounded-[8px] text-xs transition-all cursor-pointer font-sans disabled:opacity-30 ${
                      amountInput === v
                        ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400/90"
                        : "bg-white/[0.03] border border-white/[0.07] text-white/40 hover:bg-indigo-500/[0.08] hover:border-indigo-500/25 hover:text-indigo-400/70"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Fee breakdown */}
            <div className="rounded-[10px] bg-white/[0.02] border border-white/[0.05] divide-y divide-white/[0.04]">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-white/25">
                  Platform fee (2.5%)
                </span>
                <span className="text-xs font-mono text-white/40">
                  {isValidAmount ? `${platformFee.toFixed(6)} SOL` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-white/25">Network fee</span>
                <span className="text-xs font-mono text-white/40">
                  ~0.000005 SOL
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-medium text-white/50">
                  Total deducted
                </span>
                <span className="text-xs font-mono font-medium text-white/65">
                  {isValidAmount ? `${totalDeducted.toFixed(6)} SOL` : "—"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setStep("confirm")}
              disabled={!canConfirm || !wallet}
              className="w-full h-[46px] rounded-[12px] bg-indigo-500/[0.85] text-white text-sm font-medium hover:bg-indigo-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 font-sans"
            >
              <ArrowUpRight className="h-4 w-4" />
              Review Transfer
            </button>
          </div>
        )}

        {/* ── Confirm ── */}
        {step === "confirm" && (
          <div className="p-5 space-y-3">
            <div className="rounded-[12px] bg-white/[0.02] border border-white/[0.07] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.05]">
                <div className="w-10 h-10 rounded-[10px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-base font-medium text-indigo-400/80 shrink-0">
                  {cleanTo.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/85">
                    @{cleanTo}
                  </p>
                  <p className="text-[10px] font-mono text-white/25 mt-0.5">
                    {resolvedWallet?.slice(0, 10)}…{resolvedWallet?.slice(-8)}
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 px-4 py-4">
                <span className="text-[32px] font-medium text-white">
                  {amount.toFixed(amount < 1 ? 4 : 2)}
                </span>
                <span className="text-sm text-white/35">SOL</span>
              </div>
              <div className="px-4 pb-3.5 divide-y divide-white/[0.04]">
                {[
                  ["Platform fee (2.5%)", `${platformFee.toFixed(6)} SOL`],
                  ["Network fee", "~0.000005 SOL"],
                  ["Total deducted", `${totalDeducted.toFixed(6)} SOL`],
                ].map(([k, v], i) => (
                  <div
                    key={k}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span
                      className={`text-[11px] ${i === 2 ? "text-white/45 font-medium" : "text-white/25"}`}
                    >
                      {k}
                    </span>
                    <span
                      className={`text-[11px] font-mono ${i === 2 ? "text-white/65 font-medium" : "text-white/50"}`}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-[8px] bg-amber-500/[0.05] border border-amber-500/[0.12]">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400/70 shrink-0 mt-px" />
              <p className="text-[11px] text-amber-400/60 leading-relaxed">
                Verify the recipient — on-chain transfers cannot be reversed.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStep("input")}
                className="h-[42px] rounded-[10px] border border-white/[0.08] bg-transparent text-sm text-white/35 hover:text-white/60 hover:bg-white/[0.04] transition-all cursor-pointer font-sans"
              >
                ← Back
              </button>
              <button
                onClick={handleSend}
                className="h-[42px] rounded-[10px] bg-indigo-500/[0.85] border-none text-sm font-medium text-white hover:bg-indigo-500 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-sans"
              >
                <Send className="h-3.5 w-3.5" />
                Confirm & Send
              </button>
            </div>
          </div>
        )}

        {/* ── Sending ── */}
        {step === "sending" && (
          <div className="px-5 pb-10 text-center">
            <div className="py-8">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500/10 border-t-indigo-500/80 animate-spin mx-auto mb-4" />
              <p className="text-[15px] font-medium text-white/85 mb-1.5">
                Waiting for Phantom
              </p>
              <p className="text-xs text-white/30 leading-relaxed">
                Approve the transaction in your
                <br />
                Phantom wallet to continue
              </p>
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {step === "success" && (
          <div className="p-5">
            <div className="text-center py-4">
              <div className="w-[52px] h-[52px] rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3.5">
                <Check
                  className="h-[22px] w-[22px] text-emerald-400"
                  strokeWidth={2.5}
                />
              </div>
              <p className="text-base font-medium text-white/90 mb-1">
                Sent successfully
              </p>
              <p className="text-[28px] font-medium text-emerald-400 my-2.5">
                {amount.toFixed(amount < 1 ? 4 : 2)} SOL
              </p>
              <p className="text-xs text-white/30">→ @{cleanTo}</p>
              {txHash && (
                <a
                  href={`https://solscan.io/tx/${txHash}?cluster=${isDevnet ? "devnet" : ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-[11px] text-indigo-400/70 hover:text-indigo-400/90 transition-colors"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  View on Solscan
                </a>
              )}
            </div>
            <button
              onClick={resetForm}
              className="w-full h-[42px] rounded-[10px] bg-emerald-500/[0.08] border border-emerald-500/20 text-sm font-medium text-emerald-400/80 hover:bg-emerald-500/[0.12] transition-all cursor-pointer mt-1 font-sans"
            >
              Send another
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {step === "error" && (
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-[12px] bg-red-500/[0.06] border border-red-500/20">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-px" />
              <div>
                <p className="text-sm font-medium text-red-400 mb-1">
                  Transaction failed
                </p>
                <p className="text-xs text-red-400/70 leading-relaxed">
                  {errorMsg}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStep("confirm")}
                className="h-[42px] rounded-[10px] border border-white/[0.08] text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all cursor-pointer font-sans"
              >
                Try again
              </button>
              <button
                onClick={resetForm}
                className="h-[42px] rounded-[10px] bg-white/[0.04] text-sm text-white/50 hover:text-white/70 transition-all cursor-pointer font-sans"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent transfers */}
      {recentTxs.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-3.5 w-3.5 text-white/25" />
            <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
              This session
            </span>
          </div>
          <div className="space-y-0 divide-y divide-white/[0.04]">
            {recentTxs.map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-[6px] bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Send className="h-3 w-3 text-indigo-400/70" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">@{tx.to}</p>
                    <p className="text-[10px] text-white/25 flex items-center gap-1 mt-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {tx.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-red-400/70">
                    -{tx.amount} SOL
                  </span>
                  <a
                    href={`https://solscan.io/tx/${tx.txHash}?cluster=${isDevnet ? "devnet" : ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/15 hover:text-indigo-400/60 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
