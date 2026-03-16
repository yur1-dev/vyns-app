"use client";

// app/ref/[code]/page.tsx
// Handles referral links like https://vyns-app.vercel.app/ref/cFsH-IeO
// Stores the referral code in a cookie, then redirects to signup.

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RefPage() {
  const router = useRouter();
  const params = useParams();
  const code = params?.code as string;

  useEffect(() => {
    if (!code) {
      router.replace("/signup");
      return;
    }

    // Store referral code in a cookie for 30 days
    // The signup API will read this and credit the referrer
    document.cookie = `ref=${encodeURIComponent(code)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;

    // Also store in localStorage as a fallback
    try {
      localStorage.setItem("vyns_ref", code);
    } catch {}

    // Small delay so the cookie is set before redirect
    const t = setTimeout(() => {
      router.replace("/signup");
    }, 800);

    return () => clearTimeout(t);
  }, [code, router]);

  return (
    <div className="min-h-screen bg-[#060b14] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-teal-400 animate-spin" />
      </div>
      <p className="text-white/40 text-sm">Setting up your referral…</p>
    </div>
  );
}
