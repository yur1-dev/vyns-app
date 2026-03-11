"use client";

// app/settings/page.tsx

import { useState } from "react";
import {
  Shield,
  User,
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
} from "lucide-react";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useDashboard } from "@/hook/useDashboard";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "account" | "wallet" | "preferences" | "security";

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
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-10 h-5 rounded-full border transition-all cursor-pointer shrink-0 ${
        on
          ? "bg-teal-500/30 border-teal-500/40"
          : "bg-white/[0.05] border-white/[0.08]"
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "right-0.5" : "left-0.5"}`}
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

function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 px-4 pr-10 rounded-xl border border-white/[0.07] bg-white/[0.03] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/40 transition-all"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors cursor-pointer"
          >
            {show ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Tab content ───────────────────────────────────────────────────────────────

function AccountTab({
  session,
  wallet,
  provider,
  displayName,
}: {
  session: any;
  wallet: string | null;
  provider: string;
  displayName: string;
}) {
  return (
    <div className="space-y-4">
      <Card
        title="Account Details"
        desc="Your identity and profile information."
      >
        <Field
          label="Display name"
          value={session?.user?.name || displayName || "Wallet user"}
        />
        <Field label="Email address" value={session?.user?.email || "—"} />
        <Field label="Auth method" value={provider} />
        <Field
          label="Account type"
          aside={
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/20">
              Standard
            </span>
          }
        />
        <Field label="Member since" value="—" />
        {wallet && (
          <Field
            label="Wallet"
            value={`${wallet.slice(0, 8)}…${wallet.slice(-6)}`}
            mono
          />
        )}
      </Card>

      {session?.user?.image && (
        <Card title="Profile Picture" desc="Synced from your Google account.">
          <div className="p-5 flex items-center gap-4">
            <img
              src={session.user.image}
              alt="Avatar"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10"
            />
            <div>
              <p className="text-sm font-medium text-white/70">
                {session.user.name}
              </p>
              <p className="text-xs text-white/25 mt-0.5">
                Avatar pulled from Google OAuth
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function WalletTab({
  wallet,
  balance,
}: {
  wallet: string | null;
  balance: number;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!wallet) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-16 text-center">
        <Wallet className="h-8 w-8 mx-auto mb-3 text-white/10" />
        <p className="text-sm text-white/30">No wallet connected</p>
        <p className="text-xs text-white/20 mt-1">
          Sign in with a Solana wallet to see this section
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
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] text-sm text-white/50 hover:text-white/80 transition-all cursor-pointer"
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

function PreferencesTab() {
  const [prefs, setPrefs] = useState({
    staking: true,
    referrals: false,
    rewards: true,
    system: true,
  });
  const toggle = (k: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <Card
      title="Notifications"
      desc="Choose what you want to be notified about."
    >
      {[
        {
          key: "staking" as const,
          label: "Staking alerts",
          desc: "When positions unlock or need attention",
        },
        {
          key: "referrals" as const,
          label: "Referral activity",
          desc: "New signups through your referral link",
        },
        {
          key: "rewards" as const,
          label: "Reward earnings",
          desc: "When yield is credited to your account",
        },
        {
          key: "system" as const,
          label: "System updates",
          desc: "Protocol announcements and maintenance",
        },
      ].map((n) => (
        <div
          key={n.key}
          className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] last:border-0"
        >
          <div>
            <p className="text-sm text-white/70">{n.label}</p>
            <p className="text-xs text-white/25 mt-0.5">{n.desc}</p>
          </div>
          <Toggle on={prefs[n.key]} onChange={() => toggle(n.key)} />
        </div>
      ))}
    </Card>
  );
}

function SecurityTab({
  session,
  wallet,
  provider,
  onLogout,
}: {
  session: any;
  wallet: string | null;
  provider: string;
  onLogout: () => void;
}) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const handleChange = async () => {
    if (next !== confirm) {
      setErr("Passwords don't match");
      return;
    }
    if (next.length < 8) {
      setErr("Minimum 8 characters");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: cur, newPassword: next }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed");
      setDone(true);
      setCur("");
      setNext("");
      setConfirm("");
      setTimeout(() => setDone(false), 3000);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {session?.user?.email && !wallet && (
        <Card
          title="Change Password"
          desc="Update your account password for added security."
        >
          <div className="p-5 space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password"
              value={cur}
              onChange={setCur}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password (min 8 chars)"
              value={next}
              onChange={setNext}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={setConfirm}
            />
            {err && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {err}
              </div>
            )}
            <button
              onClick={handleChange}
              disabled={saving || !cur || !next || !confirm}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {done
                ? "Password updated!"
                : saving
                  ? "Updating..."
                  : "Update Password"}
            </button>
          </div>
        </Card>
      )}

      <Card title="Session" desc="Your current authentication session.">
        <Field
          label="Status"
          aside={
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Active
            </span>
          }
        />
        <Field label="Provider" value={provider} />
        {session?.user?.email && (
          <Field label="Email" value={session.user.email} />
        )}
        {wallet && (
          <Field
            label="Signing key"
            value={`${wallet.slice(0, 8)}…${wallet.slice(-8)}`}
            mono
          />
        )}
        <div className="px-5 py-4">
          <p className="text-xs text-white/30 leading-relaxed">
            {wallet
              ? "Authenticated via Solana wallet signature. No password stored — all sensitive actions require wallet signing."
              : "Authenticated via OAuth. Session managed by NextAuth.js with HTTP-only JWT cookies."}
          </p>
        </div>
      </Card>

      <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-red-500/[0.08] flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400/60" />
          <div>
            <p className="text-sm font-semibold text-red-400/70">Danger Zone</p>
            <p className="text-xs text-white/20 mt-0.5">
              Irreversible actions on your account.
            </p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-white/25 leading-relaxed">
            Signing out will clear your local session. You can sign back in at
            any time.
          </p>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.06] hover:bg-red-500/[0.12] text-sm text-red-400/70 hover:text-red-400 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tabs config ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "account", icon: User, label: "Account" },
  { id: "wallet", icon: Wallet, label: "Wallet" },
  { id: "preferences", icon: Bell, label: "Preferences" },
  { id: "security", icon: Shield, label: "Security" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPageRoute() {
  const dash = useDashboard();
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [notifications, setNotifications] = useState<any[]>([]);

  const visibleTabs = TABS.filter((t) => !(t.id === "wallet" && !dash.wallet));

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-200 antialiased">
      {/* Ambient */}
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
      />

      {/* Content */}
      <main className="relative z-10 px-4 sm:px-8 py-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-5 w-5 text-white/30" />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Settings
          </h1>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.05] mb-6 overflow-x-auto">
          {visibleTabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  whitespace-nowrap transition-all duration-150 cursor-pointer
                  ${
                    active
                      ? "bg-white/[0.08] text-white"
                      : "text-white/30 hover:text-white/60 hover:bg-white/[0.03]"
                  }
                `}
              >
                <t.icon
                  className={`h-3.5 w-3.5 shrink-0 ${active ? "text-teal-400" : ""}`}
                />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "account" && (
          <AccountTab
            session={dash.session}
            wallet={dash.wallet}
            provider={dash.provider}
            displayName={dash.displayName}
          />
        )}
        {activeTab === "wallet" && (
          <WalletTab wallet={dash.wallet} balance={dash.balance} />
        )}
        {activeTab === "preferences" && <PreferencesTab />}
        {activeTab === "security" && (
          <SecurityTab
            session={dash.session}
            wallet={dash.wallet}
            provider={dash.provider}
            onLogout={dash.logout}
          />
        )}
      </main>
    </div>
  );
}
