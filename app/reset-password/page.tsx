"use client";
// app/reset-password/page.tsx

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token)
      setError("Invalid or missing reset token. Please request a new link.");
  }, [token]);

  const passwordsMatch = password && confirm && password === confirm;
  const passwordTooShort = password.length > 0 && password.length < 8;

  // Password strength
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const strengthColors = [
    "bg-red-500",
    "bg-red-400",
    "bg-amber-400",
    "bg-teal-400",
    "bg-emerald-400",
  ];
  const strengthLabels = ["", "Weak", "Fair", "Strong", "Very strong"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error ?? "Failed to reset password");
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
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

      {!done ? (
        <>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Set new password
            </h1>
            <p className="text-sm text-white/40">
              Choose a strong password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="At least 8 characters"
                  required
                  className={`w-full h-10 px-3 pr-10 rounded-md border text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 transition-all bg-white/[0.03] ${
                    passwordTooShort
                      ? "border-red-500/40 focus:ring-red-500/40"
                      : "border-white/[0.08] focus:ring-teal-500/40 focus:border-teal-500/40"
                  }`}
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

              {/* Strength meter */}
              {password && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? strengthColors[score] : "bg-white/[0.06]"}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <span
                      className={`text-xs ${score >= 3 ? "text-teal-400" : "text-white/30"}`}
                    >
                      {strengthLabels[score]}
                    </span>
                    <div className="flex gap-2 text-xs">
                      {[
                        { key: "length", label: "8+" },
                        { key: "uppercase", label: "A-Z" },
                        { key: "number", label: "0-9" },
                        { key: "special", label: "!@#" },
                      ].map((c) => (
                        <span
                          key={c.key}
                          className={
                            checks[c.key as keyof typeof checks]
                              ? "text-teal-400"
                              : "text-white/20"
                          }
                        >
                          {c.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError("");
                  }}
                  placeholder="Confirm new password"
                  required
                  className={`w-full h-10 px-3 pr-10 rounded-md border text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 transition-all bg-white/[0.03] ${
                    confirm && !passwordsMatch
                      ? "border-red-500/40 focus:ring-red-500/40"
                      : confirm && passwordsMatch
                        ? "border-teal-500/40 focus:ring-teal-500/40"
                        : "border-white/[0.08] focus:ring-teal-500/40 focus:border-teal-500/40"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirm && (
                <p
                  className={`text-xs ${passwordsMatch ? "text-teal-400" : "text-red-400"}`}
                >
                  {passwordsMatch
                    ? "✓ Passwords match"
                    : "Passwords don't match"}
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                !password ||
                !confirm ||
                !passwordsMatch ||
                password.length < 8 ||
                !token
              }
              className="w-full h-10 rounded-md bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Set new password
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-white/30">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-white/70 hover:text-white font-medium transition-colors underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Password updated!
            </h1>
            <p className="text-sm text-white/40">
              Your password has been changed successfully.
            </p>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-teal-500/[0.08] border border-teal-500/20">
            <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-teal-300 font-medium">All done!</p>
              <p className="text-xs text-white/40 mt-0.5">
                Redirecting you to sign in...
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full h-10 rounded-md bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all"
          >
            Go to sign in
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Left branding */}
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
        <Suspense
          fallback={
            <div className="flex items-center gap-2 text-white/40">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
