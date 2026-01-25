"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate login
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Store auth state and redirect
    localStorage.setItem("vyns_auth", "true");
    router.push("/dashboard");
  };

  const connectWallet = async (type: "phantom" | "solflare" | "backpack") => {
    setLoading(true);
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
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-teal-950/20 via-slate-950 to-indigo-950/20" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl">
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
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to your VYNS account</p>
          </div>

          {/* Wallet Connect Button */}
          <button
            onClick={() => connectWallet("phantom")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 mb-6"
          >
            <Image
              src="/phantom-wallet.png"
              alt="Phantom"
              width={24}
              height={24}
              className="rounded-md"
            />
            Continue with Phantom
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-900 text-gray-500 uppercase tracking-wider text-xs">
                Or continue with
              </span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-gray-100 transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-teal-400 font-semibold hover:text-teal-300 transition-colors"
            >
              Sign up
            </Link>
          </p>

          {/* Other Wallet Options */}
          <p className="text-center text-gray-500 mt-4 text-sm">
            Or continue with{" "}
            <Link
              href="/wallet-login"
              className="text-teal-400 font-medium hover:text-teal-300 transition-colors"
            >
              Other Wallets
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
