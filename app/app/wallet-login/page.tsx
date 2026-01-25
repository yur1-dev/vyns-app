"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ArrowUpRight } from "lucide-react";

const wallets = [
  {
    type: "phantom" as const,
    name: "Phantom",
    image: "/phantom-wallet.png",
    description: "Most popular Solana wallet",
  },
  {
    type: "solflare" as const,
    name: "Solflare",
    image: "/solflare-wallet.png",
    description: "Advanced Solana wallet",
  },
  {
    type: "backpack" as const,
    name: "Backpack",
    image: "/backpack-wallet.png",
    description: "Multi-chain xNFT wallet",
  },
];

export default function WalletLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState("");

  const connectWallet = async (type: "phantom" | "solflare" | "backpack") => {
    setLoading(true);
    setConnectingWallet(type);
    setError("");

    try {
      let provider: any = null;

      if (type === "phantom" && (window as any).solana?.isPhantom) {
        provider = (window as any).solana;
      } else if (type === "solflare" && (window as any).solflare?.isSolflare) {
        provider = (window as any).solflare;
      } else if (type === "backpack" && (window as any).backpack) {
        provider = (window as any).backpack;
      }

      if (!provider) {
        setError(
          `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } wallet not found. Please install it.`
        );
        setLoading(false);
        setConnectingWallet(null);
        return;
      }

      const response = await provider.connect();
      const address = response.publicKey.toString();

      localStorage.setItem("vyns_auth", "true");
      localStorage.setItem("vyns_wallet", address);
      localStorage.setItem("vyns_provider", type);

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      setLoading(false);
      setConnectingWallet(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-teal-950/20 via-slate-950 to-indigo-950/20" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl">
          {/* Back Button */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-lg shadow-teal-500/20">
              <Image
                src="/vyns-logo.png"
                alt="VYNS"
                width={80}
                height={80}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Connect Wallet
            </h1>
            <p className="text-gray-400">Choose a Solana wallet to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Wallet Options */}
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <button
                key={wallet.type}
                onClick={() => connectWallet(wallet.type)}
                disabled={loading}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:border-teal-500/50 hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0">
                  <Image
                    src={wallet.image || "/placeholder.svg"}
                    alt={wallet.name}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white group-hover:text-teal-400 transition-colors">
                    {wallet.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {wallet.description}
                  </div>
                </div>
                {connectingWallet === wallet.type ? (
                  <Loader2 className="h-5 w-5 text-teal-400 animate-spin" />
                ) : (
                  <ArrowUpRight className="h-5 w-5 text-gray-500 group-hover:text-teal-400 transition-colors" />
                )}
              </button>
            ))}
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-400 mt-8 text-sm">
            New to VYNS?{" "}
            <Link
              href="/signup"
              className="text-teal-400 font-semibold hover:text-teal-300 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
