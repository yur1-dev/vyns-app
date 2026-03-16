"use client";

// app/signup/page.tsx
import { useState, useEffect, useRef } from "react";
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
  Mail,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { signIn, useSession } from "next-auth/react";

const WALLETS = [
  {
    type: "phantom" as const,
    name: "Phantom",
    src: "/phantom-wallet.png",
    desc: "Most popular Solana wallet",
  },
  {
    type: "solflare" as const,
    name: "Solflare",
    src: "/solflare-wallet.png",
    desc: "Advanced Solana wallet",
  },
  {
    type: "backpack" as const,
    name: "Backpack",
    src: "/backpack-wallet.png",
    desc: "Multi-chain xNFT wallet",
  },
];

type Step = "form" | "otp" | "done";

export default function SignupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Cooldown timer ────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── After Google OAuth returns, track referral then redirect ──────────────
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    // Only run if we're not already in the middle of email signup
    if (step !== "form") return;

    const trackAndRedirect = async () => {
      try {
        const refCode =
          localStorage.getItem("vyns_ref") || getCookieValue("ref");
        if (refCode) {
          fetch("/api/referrals/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ refCode }),
          }).catch(() => {});
          localStorage.removeItem("vyns_ref");
          document.cookie = "ref=; path=/; max-age=0";
        }
      } catch {}
      router.push("/dashboard");
    };

    trackAndRedirect();
  }, [status, session, router, step]);

  // ── Step 1: Send OTP ──────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingType("email");
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to send code");
        return;
      }

      setStep("otp");
      setResendCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  // ── OTP input handling ────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    // Allow paste of full code
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      const digits = value.split("");
      setOtpDigits(digits);
      otpRefs.current[5]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ── Step 2: Verify OTP + create account ──────────────────
  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setLoadingType("verify");
    setError("");

    try {
      const refCode = localStorage.getItem("vyns_ref") || getCookieValue("ref");

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, otpCode, refCode }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Verification failed");
        return;
      }

      // Clean up ref
      localStorage.removeItem("vyns_ref");
      document.cookie = "ref=; path=/; max-age=0";

      // Auto sign-in
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
      });
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setOtpDigits(["", "", "", "", "", ""]);
    setResendCooldown(60);

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!data.success) setError(data.error ?? "Failed to resend");
    else setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  // ── Google ────────────────────────────────────────────────
  const handleGoogle = async () => {
    setLoading(true);
    setLoadingType("google");
    await signIn("google", { redirect: false });
  };

  // ── Wallet ────────────────────────────────────────────────
  const connectWallet = async (type: "phantom" | "solflare" | "backpack") => {
    setLoading(true);
    setLoadingType(type);
    setError("");
    setShowWalletModal(false);

    try {
      const w = window as any;
      let provider: any = null;
      if (type === "phantom") provider = w.phantom?.solana ?? w.solana;
      if (type === "solflare") provider = w.solflare;
      if (type === "backpack") provider = w.backpack;

      if (!provider)
        throw new Error(
          `${type.charAt(0).toUpperCase() + type.slice(1)} not found.`,
        );

      const response = await provider.connect();
      const wallet = response.publicKey.toString();
      const nonce = Date.now();
      const message = `Sign in to VYNS | Wallet: ${wallet} | Nonce: ${nonce}`;
      const encoded = new TextEncoder().encode(message);

      let signed: any;
      try {
        signed = await provider.signMessage(encoded, "utf8");
      } catch (err: any) {
        if (err.code === 4001 || err.message?.includes("rejected"))
          throw new Error("Signature cancelled.");
        throw err;
      }

      const sigBytes: Uint8Array = signed.signature ?? signed;
      const signature = Buffer.from(sigBytes).toString("base64");
      const refCode =
        localStorage.getItem("vyns_ref") || getCookieValue("ref") || "";

      const result = await signIn("wallet", {
        wallet,
        signature,
        message,
        refCode,
        redirect: false,
      });

      if (result?.error) throw new Error("Wallet verification failed.");

      localStorage.removeItem("vyns_ref");
      document.cookie = "ref=; path=/; max-age=0";
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      setShowWalletModal(true);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  // ── Shared left panel ─────────────────────────────────────
  const LeftPanel = () => (
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
  );

  // ── OTP step UI ───────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="min-h-screen bg-[#09090b] flex">
        <LeftPanel />
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

            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <Mail className="h-6 w-6 text-teal-400" />
              </div>
            </div>

            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Check your email
              </h1>
              <p className="text-sm text-white/40">
                We sent a 6-digit code to
                <br />
                <span className="text-white/70 font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyAndCreate} className="space-y-5">
              {/* OTP input boxes */}
              <div className="flex gap-2 justify-center">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-13 text-center text-xl font-bold rounded-xl border border-white/[0.08] bg-white/[0.03] text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all py-3"
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otpDigits.join("").length !== 6}
                className="w-full h-10 rounded-md bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingType === "verify" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Verify & Create Account
                  </>
                )}
              </button>
            </form>

            {/* Resend + back */}
            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => {
                  setStep("form");
                  setError("");
                  setOtpDigits(["", "", "", "", "", ""]);
                }}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="flex items-center gap-1.5 text-teal-400 hover:text-teal-300 disabled:text-white/20 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend code"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main signup form ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#09090b] flex">
      <LeftPanel />
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
              Create account
            </h1>
            <p className="text-sm text-white/40">
              Join thousands earning yield from their @username
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

          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full h-10 px-3 rounded-md border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full h-10 px-3 rounded-md border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="w-full h-10 px-3 pr-10 rounded-md border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all"
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
              <div className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-md bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loadingType === "email" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending code...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" /> Continue with Email
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-white/20 leading-relaxed">
            By creating an account, you agree to our{" "}
            <a
              href="#"
              className="text-white/40 hover:text-white underline underline-offset-4 transition-colors"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-white/40 hover:text-white underline underline-offset-4 transition-colors"
            >
              Privacy Policy
            </a>
          </p>

          <p className="text-center text-sm text-white/30">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-white/70 hover:text-white font-medium transition-colors underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Wallet Modal */}
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
              {WALLETS.map((w) => (
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

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}
