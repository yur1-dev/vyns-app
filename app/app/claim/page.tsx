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
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <Link
            href="/"
            className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-indigo-500 bg-clip-text text-transparent"
          >
            VYNS
          </Link>
          <WalletMultiButton className="!bg-gradient-to-r !from-teal-600 !to-indigo-700 !rounded-full !px-8 !py-3 !font-semibold" />
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/search?q=${username}`}
            className="inline-flex items-center gap-3 text-gray-400 hover:text-teal-400 mb-12 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
            Back to search
          </Link>

          {/* Success */}
          {success && (
            <div className="bg-gradient-to-br from-teal-900/60 via-black to-indigo-900/60 rounded-3xl border-2 border-teal-500/70 shadow-2xl shadow-teal-500/30 p-20 text-center">
              <CheckCircle className="w-36 h-36 text-teal-400 mx-auto mb-10 animate-bounce" />
              <h1 className="text-7xl font-bold mb-6">Success!</h1>
              <p className="text-4xl text-gray-200 mb-6">
                You now own{" "}
                <span className="text-teal-400 font-bold">@{username}</span>
              </p>
              <p className="text-2xl text-gray-400 mb-12">
                Your universal Web3 identity is live and earning yield.
              </p>

              {txHash && (
                <div className="bg-black/50 rounded-2xl p-8 max-w-lg mx-auto mb-12">
                  <p className="text-gray-400 mb-3">Transaction</p>
                  <p className="font-mono text-teal-300 break-all">{txHash}</p>
                </div>
              )}

              <p className="text-xl text-gray-400 animate-pulse">
                Redirecting to dashboard...
              </p>
            </div>
          )}

          {/* Claim Form */}
          {!success && (
            <div className="bg-gradient-to-br from-gray-900/80 via-black to-gray-900/80 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-teal-900/50 to-indigo-900/50 p-12 text-center border-b border-gray-800">
                <h1 className="text-6xl font-bold mb-6">
                  Claim <span className="text-teal-400">@{username}</span>
                </h1>
                <p className="text-2xl text-gray-300">
                  Secure your permanent Web3 identity in one click
                </p>
              </div>

              <div className="p-12 space-y-12">
                {/* Wallet */}
                <div className="bg-black/50 rounded-3xl p-10 border border-gray-800">
                  <h3 className="text-3xl font-bold mb-8 flex items-center gap-4 justify-center">
                    <WalletIcon className="w-9 h-9 text-teal-400" />
                    Wallet
                  </h3>
                  {connected && publicKey ? (
                    <div className="bg-teal-900/30 border border-teal-700 rounded-2xl p-8 text-center">
                      <CheckCircle className="w-16 h-16 text-teal-400 mx-auto mb-6" />
                      <p className="text-xl text-gray-300 mb-2">Connected</p>
                      <p className="font-mono text-teal-300 break-all text-lg">
                        {publicKey.toString()}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xl text-gray-400 mb-8">
                        Connect to continue
                      </p>
                      <WalletMultiButton className="!bg-gradient-to-r !from-teal-600 !to-indigo-700 !px-12 !py-5 !text-xl !rounded-2xl" />
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="bg-black/50 rounded-3xl p-10 border border-gray-800">
                  <h3 className="text-3xl font-bold mb-8 text-center">
                    Pricing
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="text-center">
                      <Coins className="w-12 h-12 text-teal-400 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">
                        One-Time Registration
                      </p>
                      <p className="text-5xl font-bold text-teal-400">
                        0.1 SOL
                      </p>
                    </div>
                    <div className="text-center">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">Annual Renewal</p>
                      <p className="text-4xl font-bold text-gray-300">
                        0.05 SOL
                      </p>
                    </div>
                  </div>
                  <div className="mt-10 text-center border-t border-gray-700 pt-8">
                    <p className="text-2xl text-gray-400 mb-2">Total Due Now</p>
                    <p className="text-6xl font-bold text-teal-400">0.1 SOL</p>
                  </div>
                </div>

                {/* Benefits */}
                <div className="bg-gradient-to-br from-teal-900/30 to-indigo-900/30 rounded-3xl p-10 border border-teal-700/50">
                  <h3 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-4">
                    <Sparkles className="w-10 h-10 text-yellow-400" />
                    What You Get
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 text-lg">
                    <div className="flex items-start gap-4">
                      <CheckCircle className="w-8 h-8 text-teal-400 flex-shrink-0 mt-1" />
                      <span>Permanent ownership of @{username}</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <CheckCircle className="w-8 h-8 text-teal-400 flex-shrink-0 mt-1" />
                      <span>Passive yield on every transaction</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <CheckCircle className="w-8 h-8 text-teal-400 flex-shrink-0 mt-1" />
                      <span>Trade or sell anytime</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <CheckCircle className="w-8 h-8 text-teal-400 flex-shrink-0 mt-1" />
                      <span>Works on Solana, Ethereum, Base+</span>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-900/40 border border-red-700 rounded-3xl p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-2xl font-bold text-red-400">{error}</p>
                  </div>
                )}

                {/* Claim Button */}
                <button
                  onClick={handleClaim}
                  disabled={!connected || loading}
                  className="w-full bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white py-8 rounded-3xl text-3xl font-bold shadow-2xl hover:shadow-teal-500/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-10 h-10 animate-spin" />
                      Processing Transaction...
                    </>
                  ) : (
                    <>
                      <Zap className="w-10 h-10" />
                      Claim @{username} Now
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
        </div>
      }
    >
      <ClaimPageInner />
    </Suspense>
  );
}
