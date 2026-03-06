// File: app/app/claim/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Zap,
  WalletIcon,
  Coins,
  Clock,
} from "lucide-react";

// Add this export to prevent static generation during build
export const dynamic = "force-dynamic";

function ClaimPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = searchParams.get("username")?.toLowerCase().trim() || "";
  const { publicKey, connected } = useWallet();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    if (!username) router.push("/");
  }, [username, router]);

  const handleClaim = async () => {
    if (!connected || !publicKey) {
      setError("Connect your wallet to continue");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/usernames/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          walletAddress: publicKey.toString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTxHash(data.txSignature || "simulated-success-tx");
        setTimeout(() => router.push("/app/dashboard"), 5000);
      } else {
        setError(data.error || "Failed to register. Try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />

      {/* Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            VYNS
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </Link>
        </div>
      </nav>

      {/* Success */}
      {success && (
        <div className="relative z-10 max-w-2xl mx-auto px-6 pt-32 pb-20 text-center">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-3xl p-12 backdrop-blur-xl">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Success!</h1>
            <p className="text-xl text-gray-300 mb-8">
              You now own{" "}
              <span className="text-purple-400 font-bold">@{username}</span>
            </p>
            <p className="text-gray-400 mb-8">
              Your universal Web3 identity is live and earning yield.
            </p>

            {txHash && (
              <div className="bg-black/30 rounded-xl p-4 mb-8">
                <p className="text-sm text-gray-400 mb-2">Transaction</p>
                <p className="text-xs text-purple-400 font-mono break-all">
                  {txHash}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting to dashboard...
            </div>
          </div>
        </div>
      )}

      {/* Claim Form */}
      {!success && (
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-20">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Claim @{username}</h1>
            <p className="text-xl text-gray-400">
              Secure your permanent Web3 identity in one click
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Wallet */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <WalletIcon className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold">Wallet</h2>
              </div>

              {connected && publicKey ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
                  <p className="text-sm text-green-400 mb-2">Connected</p>
                  <p className="text-xs text-gray-400 font-mono break-all">
                    {publicKey.toString()}
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
                  <p className="text-sm text-yellow-400">Connect to continue</p>
                </div>
              )}

              <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-500 hover:!from-purple-600 hover:!to-pink-600 !rounded-xl !h-12 !w-full !text-white !font-semibold !transition" />
            </div>

            {/* Pricing */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Coins className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold">Pricing</h2>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">One-Time Registration</span>
                  <span className="font-semibold">0.1 SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Annual Renewal</span>
                  <span className="font-semibold">0.05 SOL</span>
                </div>
                <div className="border-t border-white/10 pt-4 flex justify-between">
                  <span className="font-bold">Total Due Now</span>
                  <span className="font-bold text-purple-400">0.1 SOL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-3xl p-8 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold">What You Get</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300">
                  Permanent ownership of @{username}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300">
                  Passive yield on every transaction
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Coins className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300">Trade or sell anytime</p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300">
                  Works on Solana, Ethereum, Base+
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={loading || !connected}
            className="mt-8 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold text-lg py-6 rounded-2xl transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing Transaction...
              </>
            ) : (
              <>
                <Zap className="w-6 h-6" />
                Claim @{username} Now
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      }
    >
      <ClaimPageInner />
    </Suspense>
  );
}
