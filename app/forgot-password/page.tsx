"use client";
// app/forgot-password/page.tsx

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Mail,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to send email");
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Left branding — matches login page */}
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

      {/* Right form */}
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

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>

          {!sent ? (
            <>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Forgot password?
                </h1>
                <p className="text-sm text-white/40">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/70">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full h-10 px-3 rounded-md border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-10 rounded-md bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" /> Send reset link
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Check your email
                </h1>
                <p className="text-sm text-white/40">
                  We sent a reset link to your inbox.
                </p>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-teal-500/[0.08] border border-teal-500/20">
                <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-teal-300 font-medium">
                    Reset link sent
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Sent to <span className="text-white/70">{email}</span>.
                    Check your spam folder if you don't see it. The link expires
                    in 1 hour.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="text-sm text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              >
                Try a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
