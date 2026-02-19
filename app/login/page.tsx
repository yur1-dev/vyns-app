"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    setLoadingType("google");
    await signIn("google", { callbackUrl: "/app" });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingType("email");
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      setLoadingType(null);
    } else {
      router.push("/app");
    }
  };

  const connectWallet = async (type: "phantom" | "solflare" | "backpack") => {
    setLoading(true);
    setLoadingType(type);
    setError("");
    setShowWalletModal(false);

    try {
      const w = window as any;
      let provider: any = null;

      if (type === "phantom") {
        provider = w.phantom?.solana;
        if (!provider)
          throw new Error("Phantom wallet not found. Please install it.");
      } else if (type === "solflare") {
        provider = w.solflare;
        if (!provider)
          throw new Error("Solflare wallet not found. Please install it.");
      } else if (type === "backpack") {
        provider = w.backpack;
        if (!provider)
          throw new Error("Backpack wallet not found. Please install it.");
      }

      const response = await provider.connect();
      const wallet = response.publicKey.toString();
      const message = `Sign in to VYNS\nWallet: ${wallet}\nTimestamp: ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);

      let signed: any;
      try {
        signed = await provider.signMessage(encodedMessage, "utf8");
      } catch (signErr: any) {
        if (signErr.message?.includes("rejected") || signErr.code === 4001) {
          throw new Error(
            "Signature cancelled. Please approve the request in your wallet.",
          );
        }
        throw signErr;
      }

      const signature = Buffer.from(signed.signature).toString("base64");

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, signature, message }),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to verify wallet");

      localStorage.setItem("vyns_wallet", wallet);
      localStorage.setItem("vyns_provider", type);
      localStorage.setItem("vyns_token", data.token);
      router.push(data.isNewUser ? "/register" : "/app");
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      setLoading(false);
      setLoadingType(null);
      setShowWalletModal(true);
    }
  };

  const wallets = [
    {
      type: "phantom" as const,
      name: "Phantom",
      src: "/phantom-wallet.png",
      desc: "Connect to Phantom",
    },
    {
      type: "solflare" as const,
      name: "Solflare",
      src: "/solflare-wallet.png",
      desc: "Connect to Solflare",
    },
    {
      type: "backpack" as const,
      name: "Backpack",
      src: "/backpack-wallet.png",
      desc: "Connect to Backpack",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-white/[0.06] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(20,184,166,0.08),transparent_60%)]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <Link href="/">
          <Image
            src="/vyns-logo.png"
            alt="VYNS"
            width={100}
            height={32}
            className="object-contain relative z-10"
          />
        </Link>
        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-3">
            <p className="text-xl font-medium text-white/90 leading-relaxed">
              "Your Web3 identity should work for you — earning yield, building
              reputation, and resolving across every chain."
            </p>
            <footer className="text-sm text-white/40 font-medium">
              VYNS Protocol
            </footer>
          </blockquote>
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[
              ["250K+", "Names"],
              ["5%+", "Annual Yield"],
              ["15+", "Chains"],
            ].map(([val, label]) => (
              <div
                key={label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="text-lg font-bold text-teal-400">{val}</div>
                <div className="text-xs text-white/40 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/20 relative z-10">
          © 2026 VYNS Protocol
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex justify-center mb-2">
            <Link href="/">
              <Image
                src="/vyns-logo.png"
                alt="VYNS"
                width={90}
                height={28}
                className="object-contain"
              />
            </Link>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Sign in
            </h1>
            <p className="text-sm text-white/40">
              Enter your credentials or connect your wallet
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setError("");
                setShowWalletModal(true);
              }}
              disabled={loading}
              className="flex items-center justify-center gap-2 h-10 rounded-md border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-sm font-medium text-white transition-all disabled:opacity-40 cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <rect
                  x="2"
                  y="6"
                  width="20"
                  height="14"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M16 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
                  fill="currentColor"
                />
                <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Wallet
            </button>
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="flex items-center justify-center gap-2 h-10 rounded-md border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-sm font-medium text-white transition-all disabled:opacity-40 cursor-pointer"
            >
              {loadingType === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Google
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#09090b] text-white/30 uppercase tracking-widest">
                or
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-10 px-3 rounded-md border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white/70">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-3 pr-10 rounded-md border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-md bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loadingType === "email" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-white/30">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-white/70 hover:text-white font-medium transition-colors underline underline-offset-4"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Wallet Modal — matches screenshot style */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowWalletModal(false);
              setError("");
            }}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d0d0f] shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Connect Wallet
              </h2>
              <button
                onClick={() => {
                  setShowWalletModal(false);
                  setError("");
                }}
                className="text-white/30 hover:text-white transition-colors cursor-pointer p-1 rounded-md hover:bg-white/[0.06]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {wallets.map((w) => (
                <button
                  key={w.type}
                  onClick={() => connectWallet(w.type)}
                  disabled={loading}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.14] transition-all disabled:opacity-40 cursor-pointer group"
                >
                  <Image
                    src={w.src}
                    alt={w.name}
                    width={44}
                    height={44}
                    className="rounded-xl"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-white">{w.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{w.desc}</p>
                  </div>
                  {loadingType === w.type ? (
                    <Loader2 className="h-4 w-4 text-teal-400 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
                  )}
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-center text-xs text-white/20 mt-5">
              New to Solana wallets?{" "}
              <a
                href="https://phantom.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 transition-colors"
              >
                Get Phantom
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
