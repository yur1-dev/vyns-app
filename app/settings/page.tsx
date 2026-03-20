"use client";
// app/settings/page.tsx

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Wallet,
  Bell,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  KeyRound,
  Mail,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useDashboard } from "@/hook/useDashboard";

type Tab = "security" | "wallet" | "preferences";
type PrefKey = "staking" | "referrals" | "rewards" | "system";

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl text-sm font-medium backdrop-blur-xl ${
        type === "success"
          ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
          : "bg-red-950/90 border-red-500/30 text-red-300"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0" />
      )}
      {message}
    </div>
  );
}

// ── Primitives ────────────────────────────────────────────────────────────────
function Field({
  label,
  value,
  mono,
  aside,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] last:border-0">
      <p className="text-sm text-white/50 shrink-0">{label}</p>
      <div className="flex items-center gap-2 ml-4">
        {aside}
        {value && (
          <p
            className={`text-sm text-right ${mono ? "font-mono text-white/40 text-xs" : "text-white/70"}`}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      role="switch"
      aria-checked={on}
      className={`relative w-10 h-5 rounded-full border transition-all cursor-pointer shrink-0 ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${on ? "bg-teal-500/30 border-teal-500/40" : "bg-white/[0.05] border-white/[0.08]"}`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-all duration-200 ${on ? "right-0.5 bg-teal-400" : "left-0.5 bg-white"}`}
      />
    </button>
  );
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.04]">
        <p className="text-sm font-semibold text-white/80">{title}</p>
        {desc && <p className="text-xs text-white/30 mt-0.5">{desc}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-11 px-4 pr-10 rounded-xl border bg-white/[0.03] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
            error
              ? "border-red-500/40 focus:ring-red-500/20"
              : "border-white/[0.07] focus:ring-teal-500/30 focus:border-teal-500/40"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors cursor-pointer"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const colors = [
    "bg-red-500",
    "bg-red-400",
    "bg-amber-400",
    "bg-teal-400",
    "bg-emerald-400",
  ];
  const labels = ["Too short", "Weak", "Fair", "Strong", "Very strong"];
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : "bg-white/[0.06]"}`}
          />
        ))}
      </div>
      <div className="flex justify-between">
        <span
          className={`text-xs ${score >= 3 ? "text-teal-400" : "text-white/25"}`}
        >
          {labels[score]}
        </span>
        <div className="flex gap-3 text-xs">
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
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab({
  session,
  wallet,
  provider,
  onLogout,
  onToast,
}: {
  session: any;
  wallet: string | null;
  provider: string;
  onLogout: () => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleChange = async () => {
    const errs: Record<string, string> = {};
    if (!cur) errs.cur = "Required";
    if (!next) errs.next = "Required";
    else if (next.length < 8) errs.next = "Minimum 8 characters";
    if (!confirm) errs.confirm = "Required";
    else if (next && confirm && next !== confirm)
      errs.confirm = "Passwords don't match";
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: cur, newPassword: next }),
      });
      const data = await res.json();
      if (!data.success) {
        setFieldErrors({ cur: data.error });
        onToast(data.error, "error");
      } else {
        onToast("Password updated successfully!", "success");
        setCur("");
        setNext("");
        setConfirm("");
      }
    } catch {
      onToast("Something went wrong. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!session?.user?.email) return;
    setSendingReset(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });
      const data = await res.json();
      if (data.success) {
        setResetSent(true);
        onToast(`Reset link sent to ${session.user.email}`, "success");
      } else onToast(data.error ?? "Failed to send reset email", "error");
    } catch {
      onToast("Failed to send reset email", "error");
    } finally {
      setSendingReset(false);
    }
  };

  const isEmailUser =
    !!session?.user?.email &&
    provider !== "google" &&
    provider !== "github" &&
    !wallet;
  const isOAuthUser = provider === "google" || provider === "github";

  return (
    <div className="space-y-4">
      <Card title="Active Session" desc="Your current authentication status.">
        <Field
          label="Status"
          aside={
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Active
            </span>
          }
        />
        <Field label="Auth provider" value={provider || "email"} />
        {session?.user?.email && (
          <Field label="Email" value={session.user.email} />
        )}
        {wallet && (
          <Field
            label="Wallet"
            value={`${wallet.slice(0, 8)}…${wallet.slice(-8)}`}
            mono
          />
        )}
        <div className="px-5 py-4">
          <p className="text-xs text-white/25 leading-relaxed">
            {wallet
              ? "Authenticated via Solana wallet signature."
              : isOAuthUser
                ? `Authenticated via ${provider} OAuth. Session managed via NextAuth.js.`
                : "Authenticated via email/password. Session managed via NextAuth.js with HTTP-only JWT cookies."}
          </p>
        </div>
      </Card>

      {isEmailUser && (
        <Card title="Change Password" desc="Update your login password.">
          <div className="p-5 space-y-4">
            <PasswordInput
              label="Current Password"
              placeholder="Enter current password"
              value={cur}
              onChange={(v) => {
                setCur(v);
                setFieldErrors((e) => ({ ...e, cur: "" }));
              }}
              error={!!fieldErrors.cur}
            />
            {fieldErrors.cur && (
              <p className="text-xs text-red-400 -mt-2">{fieldErrors.cur}</p>
            )}

            <PasswordInput
              label="New Password"
              placeholder="At least 8 characters"
              value={next}
              onChange={(v) => {
                setNext(v);
                setFieldErrors((e) => ({ ...e, next: "" }));
              }}
              error={!!fieldErrors.next}
            />
            {next && <PasswordStrength password={next} />}
            {fieldErrors.next && (
              <p className="text-xs text-red-400 -mt-2">{fieldErrors.next}</p>
            )}

            <PasswordInput
              label="Confirm New Password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                setFieldErrors((e) => ({ ...e, confirm: "" }));
              }}
              error={!!fieldErrors.confirm}
            />
            {next && confirm && (
              <div
                className={`flex items-center gap-1.5 text-xs ${next === confirm ? "text-teal-400" : "text-red-400"}`}
              >
                {next === confirm ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {next === confirm ? "Passwords match" : "Passwords don't match"}
              </div>
            )}
            {fieldErrors.confirm && (
              <p className="text-xs text-red-400 -mt-2">
                {fieldErrors.confirm}
              </p>
            )}

            <button
              onClick={handleChange}
              disabled={saving || !cur || !next || !confirm}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {saving ? "Updating..." : "Update Password"}
            </button>

            <div className="pt-1 border-t border-white/[0.05]">
              <p className="text-xs text-white/30 mb-2">
                Forgot your current password?
              </p>
              {resetSent ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-500/[0.08] border border-teal-500/20 text-teal-400 text-xs">
                  <Check className="h-3.5 w-3.5 shrink-0" /> Reset link sent to{" "}
                  {session?.user?.email}
                </div>
              ) : (
                <button
                  onClick={handleForgotPassword}
                  disabled={sendingReset}
                  className="flex items-center gap-2 text-xs text-white/30 hover:text-teal-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {sendingReset ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Mail className="h-3.5 w-3.5" />
                  )}
                  Send password reset email
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      {isOAuthUser && (
        <Card title="Password" desc="Your account uses OAuth authentication.">
          <div className="p-5">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <KeyRound className="h-4 w-4 text-white/20 mt-0.5 shrink-0" />
              <p className="text-xs text-white/35 leading-relaxed">
                Your account is linked to {provider}. Manage your password from
                your {provider} account settings.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-red-500/[0.08] flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400/60" />
          <div>
            <p className="text-sm font-semibold text-red-400/70">Danger Zone</p>
            <p className="text-xs text-white/20 mt-0.5">
              Signing out will clear your local session.
            </p>
          </div>
        </div>
        <div className="p-5">
          {!showLogoutConfirm ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.06] hover:bg-red-500/[0.12] text-sm text-red-400/70 hover:text-red-400 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-white/40">
                Are you sure you want to sign out?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-sm text-red-400 font-medium hover:bg-red-500/30 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Yes, sign out
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Wallet Tab ────────────────────────────────────────────────────────────────
function WalletTab({
  wallet,
  balance,
  onToast,
}: {
  wallet: string | null;
  balance: number;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!wallet) return;
    navigator.clipboard
      .writeText(wallet)
      .then(() => {
        setCopied(true);
        onToast("Address copied to clipboard", "success");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => onToast("Failed to copy", "error"));
  };

  if (!wallet) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-16 text-center">
        <Wallet className="h-8 w-8 mx-auto mb-3 text-white/10" />
        <p className="text-sm text-white/30">No wallet connected</p>
        <p className="text-xs text-white/20 mt-1">
          Connect a Solana wallet from the dashboard
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card title="Wallet Address" desc="Your connected Solana wallet.">
        <div className="p-5 space-y-3">
          <p className="text-xs font-mono text-white/40 break-all leading-relaxed bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            {wallet}
          </p>
          <div className="flex gap-2">
            <button
              onClick={copy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] text-sm text-white/50 hover:text-white/80 transition-all cursor-pointer active:scale-[0.97]"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy address"}
            </button>
            <a
              href={`https://solscan.io/account/${wallet}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] text-sm text-white/50 hover:text-white/80 transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View on Solscan
            </a>
          </div>
        </div>
      </Card>
      <Card title="Balance" desc="Live balance from Solana mainnet.">
        <div className="p-5 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white tabular-nums tracking-tight">
            {balance.toFixed(4)}
          </span>
          <span className="text-lg text-white/30">SOL</span>
        </div>
        <Field label="Network" value="Solana Mainnet Beta" />
      </Card>
    </div>
  );
}

// ── Preferences Tab ───────────────────────────────────────────────────────────
const NOTIF_ITEMS: { key: PrefKey; label: string; desc: string }[] = [
  {
    key: "staking",
    label: "Staking alerts",
    desc: "When positions unlock or need attention",
  },
  {
    key: "referrals",
    label: "Referral activity",
    desc: "New signups through your referral link",
  },
  {
    key: "rewards",
    label: "Reward earnings",
    desc: "When yield is credited to your account",
  },
  {
    key: "system",
    label: "System updates",
    desc: "Protocol announcements and maintenance",
  },
];

function PreferencesTab({
  onToast,
}: {
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({
    staking: true,
    referrals: false,
    rewards: true,
    system: true,
  });
  const [loaded, setLoaded] = useState(false);
  const [savingKey, setSavingKey] = useState<PrefKey | null>(null);

  useEffect(() => {
    fetch("/api/user/preferences", { credentials: "include" })
      .then((r) => r.json())
      .then(({ preferences }) => {
        if (preferences) setPrefs((p) => ({ ...p, ...preferences }));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const toggle = async (key: PrefKey) => {
    const updated = { [key]: !prefs[key] };
    setPrefs((p) => ({ ...p, ...updated }));
    setSavingKey(key);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (data.preferences) setPrefs((p) => ({ ...p, ...data.preferences }));
      onToast(
        `${NOTIF_ITEMS.find((n) => n.key === key)?.label} ${!prefs[key] ? "enabled" : "disabled"}`,
        "success",
      );
    } catch {
      setPrefs((p) => ({ ...p, [key]: prefs[key] }));
      onToast("Failed to save preference", "error");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Card
      title="Notifications"
      desc="Choose what you want to be notified about."
    >
      {!loaded ? (
        <div className="p-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-white/20" />
        </div>
      ) : (
        NOTIF_ITEMS.map((n) => (
          <div
            key={n.key}
            className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] last:border-0 group"
          >
            <div>
              <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                {n.label}
              </p>
              <p className="text-xs text-white/25 mt-0.5">{n.desc}</p>
            </div>
            <div className="flex items-center gap-2">
              {savingKey === n.key && (
                <Loader2 className="h-3 w-3 animate-spin text-white/20" />
              )}
              <Toggle
                on={prefs[n.key]}
                onChange={() => toggle(n.key)}
                disabled={savingKey !== null}
              />
            </div>
          </div>
        ))
      )}
      {loaded && (
        <div className="px-5 py-3 border-t border-white/[0.04]">
          <p className="text-xs text-white/20">
            {Object.values(prefs).filter(Boolean).length} of{" "}
            {Object.keys(prefs).length} notifications enabled
          </p>
        </div>
      )}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "security", icon: Shield, label: "Security" },
  { id: "wallet", icon: Wallet, label: "Wallet" },
  { id: "preferences", icon: Bell, label: "Preferences" },
];

export default function SettingsPageRoute() {
  const dash = useDashboard();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("security");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const showToast = useCallback(
    (message: string, type: "success" | "error") => setToast({ message, type }),
    [],
  );
  const visibleTabs = TABS.filter((t) => !(t.id === "wallet" && !dash.wallet));

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-200 antialiased">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-64 -left-64 w-[800px] h-[800px] rounded-full bg-teal-600/[0.05] blur-[200px]" />
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.06] blur-[180px]" />
      </div>

      <DashboardHeader
        session={dash.session}
        wallet={dash.wallet}
        provider={dash.provider}
        displayName={dash.displayName}
        activeUsername={dash.activeUsername}
        customization={dash.customization}
        notifications={notifications}
        sidebarOpen={false}
        onToggleSidebar={() => {}}
        onMarkNotifsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onOpenSettings={() => {}}
        onLogout={dash.logout}
        onOpenProfile={() => router.push("/profile")}
      />

      <main className="relative z-10 px-4 sm:px-8 py-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-5 w-5 text-white/30" />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-white/25 ml-1">
            ·{" "}
            <button
              onClick={() => router.push("/profile")}
              className="hover:text-teal-400 transition-colors cursor-pointer"
            >
              Edit profile →
            </button>
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.05] mb-6 overflow-x-auto">
          {visibleTabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${active ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/60 hover:bg-white/[0.03]"}`}
              >
                <t.icon
                  className={`h-3.5 w-3.5 shrink-0 ${active ? "text-teal-400" : ""}`}
                />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "security" && (
          <SecurityTab
            session={dash.session}
            wallet={dash.wallet}
            provider={dash.provider}
            onLogout={dash.logout}
            onToast={showToast}
          />
        )}
        {activeTab === "wallet" && (
          <WalletTab
            wallet={dash.wallet}
            balance={dash.balance}
            onToast={showToast}
          />
        )}
        {activeTab === "preferences" && <PreferencesTab onToast={showToast} />}
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
