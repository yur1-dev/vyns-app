"use client";

// components/dashboard/tabs/StakingTab.tsx

import { useState, useMemo } from "react";
import {
  Zap,
  Lock,
  Check,
  Loader2,
  AlertCircle,
  Info,
  TrendingUp,
  Calendar,
  ChevronRight,
  Unlock,
  Sparkles,
  Crown,
  ShieldCheck,
  X,
  Coins,
  Gift,
  Clock,
} from "lucide-react";
import {
  Card,
  SectionTitle,
  Pill,
  EmptyState,
  NumberInput,
} from "@/components/dashboard/ui";
import { TIER_CONFIG, tierFromLen } from "@/components/dashboard/ui";
import type {
  UserData,
  StakingPosition,
  LockOption,
  UsernameItem,
} from "@/types/dashboard";
import { LOCK_OPTIONS } from "@/types/dashboard";

// ─── Constants ────────────────────────────────────────────────────────────────

const USERNAME_YIELD: Record<string, number> = {
  Diamond: 5,
  Platinum: 3,
  Gold: 1.5,
  Silver: 0,
  Bronze: 0,
};

const TIER_CHARS: Record<string, string> = {
  Diamond: "1–3 chars",
  Platinum: "4–5 chars",
  Gold: "6–8 chars",
  Silver: "9–15 chars",
  Bronze: "16+ chars",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  userData: UserData;
  balance: number;
  walletAddress?: string;
  onStake: (
    amount: number,
    period: number,
  ) => Promise<{ success: boolean; error?: string }>;
  onClaim: (
    positionId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onStakeUsername?: (
    id: string,
    username: string,
    sig: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onUnstakeUsername?: (
    id: string,
    username: string,
    sig: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

// ─── Lock period card ─────────────────────────────────────────────────────────

function LockCard({
  opt,
  selected,
  onSelect,
}: {
  opt: LockOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
        selected
          ? "border-teal-500/50 bg-teal-500/[0.08]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
      }`}
    >
      {opt.badge && (
        <span className="absolute -top-2 right-2 text-[9px] font-bold text-teal-400 bg-[#060b14] px-1.5 border border-teal-500/30 rounded-full tracking-wider">
          {opt.badge}
        </span>
      )}
      <p
        className={`text-xs font-semibold mb-1 ${selected ? "text-white" : "text-white/60"}`}
      >
        {opt.label}
      </p>
      <p
        className={`text-base font-bold tabular-nums ${selected ? "text-teal-400" : "text-white/30"}`}
      >
        {opt.apy}%
        <span className="text-[10px] font-normal text-white/25 ml-1">APY</span>
      </p>
    </button>
  );
}

// ─── Position card ────────────────────────────────────────────────────────────
// Guard: claim button only appears when status === "unlocked".
// Shows a countdown + unlock date when still locked.

function PositionCard({
  pos,
  onClaim,
  claiming,
}: {
  pos: StakingPosition;
  onClaim: (id: string) => void;
  claiming: boolean;
}) {
  const [done, setDone] = useState(false);

  const start = new Date(pos.startDate).getTime();
  const end = start + pos.lockPeriod * 86_400_000;
  const now = Date.now();
  const progress = Math.min(
    100,
    Math.max(0, ((now - start) / (end - start)) * 100),
  );
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86_400_000));
  const unlockDate = new Date(end).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Derive unlock state purely from status field — never trust client-side date alone
  const isUnlocked = pos.status === "unlocked";
  // If already claimed we hide this card entirely (caller should filter)
  const isClaimed = pos.status === "claimed";

  if (isClaimed) return null;

  async function handleClaim() {
    if (!isUnlocked || claiming || done) return;
    onClaim(pos.id);
    // optimistic done state; parent will re-render with updated status
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  }

  return (
    <div
      className={`p-4 rounded-2xl border space-y-3.5 transition-all ${
        isUnlocked
          ? "bg-emerald-500/[0.04] border-emerald-500/20 hover:border-emerald-500/30"
          : "bg-white/[0.025] border-white/[0.06] hover:border-white/[0.10]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-white tabular-nums">
            {pos.amount}{" "}
            <span className="text-white/30 text-sm font-normal">SOL</span>
          </p>
          <p className="text-xs text-white/30 mt-0.5">
            {pos.lockPeriod}d lock · {pos.apy}% APY
          </p>
        </div>
        <Pill
          className={
            isUnlocked
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : "text-teal-400 bg-teal-500/10 border-teal-500/20"
          }
        >
          {isUnlocked ? (
            <>
              <Unlock className="h-2.5 w-2.5" /> Unlocked
            </>
          ) : (
            <>
              <Lock className="h-2.5 w-2.5" /> {daysLeft}d left
            </>
          )}
        </Pill>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[10px] text-white/20 mb-1.5">
          <span>Lock progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isUnlocked ? "bg-emerald-500" : "bg-teal-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Rewards row */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-emerald-400/60" />
          <span className="text-xs text-white/30">
            Rewards:{" "}
            <span className="text-emerald-400 font-medium">
              +{pos.rewards.toFixed(4)} SOL
            </span>
          </span>
        </div>

        {/* Claim button — only shown when unlocked */}
        {isUnlocked ? (
          <button
            onClick={handleClaim}
            disabled={claiming || done}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              done
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            {done ? (
              <>
                <Check className="h-3 w-3" /> Claimed!
              </>
            ) : claiming ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Claiming…
              </>
            ) : (
              <>
                <Gift className="h-3 w-3" /> Claim
              </>
            )}
          </button>
        ) : (
          /* Locked — show unlock date, no claim button */
          <div className="flex items-center gap-1 text-xs text-white/20">
            <Clock className="h-3 w-3" />
            <span>Unlocks {unlockDate}</span>
          </div>
        )}
      </div>

      {pos.txSignature && (
        <a
          href={`https://solscan.io/tx/${pos.txSignature}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-teal-400/50 hover:text-teal-400 flex items-center gap-0.5 transition-colors"
        >
          View transaction <ChevronRight className="h-2.5 w-2.5" />
        </a>
      )}
    </div>
  );
}

// ─── Collateral modal ─────────────────────────────────────────────────────────

function CollateralModal({
  username,
  isStaking,
  onConfirm,
  onClose,
  loading,
  error,
}: {
  username: UsernameItem;
  isStaking: boolean;
  onConfirm: (sig: string) => Promise<void>;
  onClose: () => void;
  loading: boolean;
  error: string;
}) {
  const [sigStatus, setSigStatus] = useState<
    "idle" | "signing" | "confirming" | "error"
  >("idle");
  const [sigError, setSigError] = useState("");
  const displayName = (username as any).username ?? username.name ?? "";
  const tierKey = username.tier ?? tierFromLen(displayName.length);
  const yieldPct = USERNAME_YIELD[tierKey] ?? 0;
  const annualEarning =
    yieldPct > 0 ? ((username.value ?? 0) * yieldPct) / 100 : 0;
  const busy = sigStatus === "signing" || sigStatus === "confirming" || loading;

  async function handleSign() {
    setSigStatus("signing");
    setSigError("");
    try {
      const provider = (window as any).solana;
      if (!provider?.isPhantom) throw new Error("Phantom wallet not found.");
      const msg = `Vyns collateral ${isStaking ? "stake" : "unstake"}: ${displayName} | ${Date.now()}`;
      const { signature } = await provider.signMessage(
        new TextEncoder().encode(msg),
        "utf8",
      );
      const sig = Buffer.from(signature).toString("base64");
      setSigStatus("confirming");
      await onConfirm(sig);
    } catch (e: any) {
      setSigError(e?.message ?? "Wallet signing failed");
      setSigStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0a0f1a] shadow-2xl overflow-hidden">
        <div
          className={`px-6 pt-6 pb-5 ${
            isStaking ? "bg-violet-500/[0.06]" : "bg-red-500/[0.04]"
          }`}
        >
          {!busy && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/20 hover:text-white/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${
              isStaking ? "bg-violet-500/20" : "bg-red-500/10"
            }`}
          >
            {isStaking ? (
              <Coins className="h-5 w-5 text-violet-400" />
            ) : (
              <Unlock className="h-5 w-5 text-red-400" />
            )}
          </div>
          <p className="text-base font-semibold text-white">
            {isStaking ? "Stake as collateral" : `Unstake @${displayName}`}
          </p>
          <p className="text-xs text-white/40 mt-1">
            {isStaking
              ? `@${displayName} will be locked and start earning yield. It cannot be sold while staked.`
              : "Unstaking stops earnings and makes this username available to sell."}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {isStaking && (
            <div
              className={`rounded-xl border p-4 space-y-3 ${
                yieldPct > 0
                  ? "bg-violet-500/[0.04] border-violet-500/15"
                  : "bg-white/[0.02] border-white/[0.05]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Username value</span>
                <span className="text-sm text-white font-semibold">
                  {username.value ?? 0} SOL
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Yield rate</span>
                <span
                  className={`text-sm font-bold ${
                    yieldPct > 0 ? "text-teal-400" : "text-white/20"
                  }`}
                >
                  {yieldPct > 0 ? `${yieldPct}% APY` : "No yield"}
                </span>
              </div>
              {yieldPct > 0 ? (
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <span className="text-xs text-white/40">
                    Est. annual earnings
                  </span>
                  <span className="text-sm text-emerald-400 font-bold">
                    +{annualEarning.toFixed(4)} SOL/yr
                  </span>
                </div>
              ) : (
                <p className="text-[10px] text-white/25 pt-1 border-t border-white/[0.06]">
                  Silver and Bronze lock for protection only — no yield.
                </p>
              )}
            </div>
          )}

          <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] divide-y divide-white/[0.04]">
            {[
              ["Username", `@${displayName}`],
              ["Tier", `${tierKey} · ${TIER_CHARS[tierKey] ?? ""}`],
              [
                "Action",
                isStaking ? "Lock as collateral" : "Unlock & withdraw",
              ],
              [
                "Marketplace",
                isStaking ? "🔒 Cannot be listed" : "✓ Can be listed",
              ],
              ["Network fee", "~0.000005 SOL"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <span className="text-xs text-white/35">{k}</span>
                <span className="text-xs text-white font-medium">{v}</span>
              </div>
            ))}
          </div>

          {sigStatus === "signing" && (
            <div className="flex items-center justify-center gap-2 py-1">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              <span className="text-xs text-white/60">
                Waiting for Phantom…
              </span>
            </div>
          )}
          {sigStatus === "confirming" && (
            <div className="flex items-center justify-center gap-2 py-1">
              <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
              <span className="text-xs text-white/60">
                Confirming on-chain…
              </span>
            </div>
          )}
          {(error || sigError) && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />{" "}
              {error || sigError}
            </div>
          )}

          {(sigStatus === "idle" || sigStatus === "error") && (
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/40 text-sm hover:text-white/70 hover:border-white/20 transition-all cursor-pointer disabled:opacity-30"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={busy}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isStaking
                    ? "bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30"
                    : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                }`}
              >
                {isStaking ? (
                  <>
                    <Coins className="h-3.5 w-3.5" /> Sign & Stake
                  </>
                ) : (
                  <>
                    <Unlock className="h-3.5 w-3.5" /> Sign & Unstake
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Claim summary banner ─────────────────────────────────────────────────────
// Shown at top of positions list when ≥1 position is unlocked.

function ClaimBanner({
  count,
  totalRewards,
}: {
  count: number;
  totalRewards: number;
}) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/25 mb-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Gift className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-400">
            {count} position{count !== 1 ? "s" : ""} ready to claim
          </p>
          <p className="text-[10px] text-emerald-400/50 mt-0.5">
            +{totalRewards.toFixed(4)} SOL total rewards available
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StakingTab({
  userData,
  balance,
  walletAddress,
  onStake,
  onClaim,
  onStakeUsername,
  onUnstakeUsername,
}: Props) {
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<LockOption>(LOCK_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    u: UsernameItem;
    isStaking: boolean;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const num = parseFloat(amount) || 0;
  const estimate = useMemo(
    () => ((num * period.apy) / 100) * (period.days / 365),
    [num, period],
  );
  const canStake = num >= 0.1 && num <= balance && !loading;
  const unlockDate = useMemo(
    () =>
      new Date(Date.now() + period.days * 86_400_000).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric" },
      ),
    [period.days],
  );

  // Partition positions by status
  const activePositions =
    userData.stakingPositions?.filter((p) => p.status === "active") ?? [];
  const unlockedPositions =
    userData.stakingPositions?.filter((p) => p.status === "unlocked") ?? [];
  const totalClaimable = unlockedPositions.reduce(
    (acc, p) => acc + p.rewards,
    0,
  );

  // Username partitions — staked usernames cannot be staked again
  const stakedUsernames = userData.usernames?.filter((u) => u.staked) ?? [];
  const unstakedUsernames = userData.usernames?.filter((u) => !u.staked) ?? [];
  const totalYield = stakedUsernames.reduce(
    (acc, u) => acc + ((u.value ?? 0) * (USERNAME_YIELD[u.tier] ?? 0)) / 100,
    0,
  );

  const handleStake = async () => {
    setLoading(true);
    setError("");
    const r = await onStake(num, period.days);
    setLoading(false);
    if (r.success) {
      setDone(true);
      setAmount("");
      setTimeout(() => setDone(false), 3000);
    } else {
      setError(r.error || "Transaction failed.");
    }
  };

  // Claim guard: only one claim in-flight at a time; ignore if already claiming
  const handleClaim = async (id: string) => {
    if (claimingId) return; // one at a time
    setClaimingId(id);
    await onClaim(id);
    setClaimingId(null);
  };

  async function handleModalConfirm(sig: string) {
    if (!modal) return;
    setModalLoading(true);
    setModalError("");
    const { u, isStaking } = modal;
    const displayName = (u as any).username ?? u.name ?? "";
    const fn = isStaking ? onStakeUsername : onUnstakeUsername;
    const r = await fn?.(u.id ?? displayName, displayName, sig);
    setModalLoading(false);
    if (r?.success) setModal(null);
    else setModalError(r?.error || "Something went wrong");
  }

  return (
    <>
      {modal && (
        <CollateralModal
          username={modal.u}
          isStaking={modal.isStaking}
          onConfirm={handleModalConfirm}
          onClose={() => {
            setModal(null);
            setModalError("");
          }}
          loading={modalLoading}
          error={modalError}
        />
      )}

      <div className="space-y-5">
        <SectionTitle>Staking</SectionTitle>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "SOL staked",
              value: `${(userData.stakedAmount ?? 0).toFixed(2)} SOL`,
              sub: "currently locked",
              accent: "text-white",
              icon: <Lock className="h-3.5 w-3.5" />,
            },
            {
              label: "SOL rewards",
              value: `+${(userData.stakingRewards ?? 0).toFixed(4)} SOL`,
              sub: "accumulated",
              accent: "text-emerald-400",
              icon: <Sparkles className="h-3.5 w-3.5" />,
            },
            {
              label: "Username collateral",
              value: stakedUsernames.length,
              sub: `of ${userData.usernames?.length ?? 0} names`,
              accent: "text-violet-400",
              icon: <Coins className="h-3.5 w-3.5" />,
            },
            {
              label: "Collateral yield",
              value: `+${totalYield.toFixed(4)} SOL`,
              sub: "est. per year",
              accent: "text-teal-400",
              icon: <TrendingUp className="h-3.5 w-3.5" />,
            },
          ].map((s) => (
            <Card key={s.label} className="p-4 text-center">
              <div
                className={`flex items-center justify-center gap-1.5 mb-2 ${s.accent} opacity-40`}
              >
                {s.icon}
              </div>
              <p
                className={`text-xl font-semibold tabular-nums leading-none ${s.accent}`}
              >
                {s.value}
              </p>
              <p className="text-[10px] text-white/20 mt-1.5">{s.label}</p>
              <p className="text-[10px] text-white/15">{s.sub}</p>
            </Card>
          ))}
        </div>

        {/* Username collateral section */}
        {(userData.usernames?.length ?? 0) > 0 && (
          <Card className="p-5 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Username collateral
                </p>
                <p className="text-xs text-white/30 mt-0.5">
                  Stake your usernames to earn passive yield. Staked usernames
                  cannot be sold on the marketplace.
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/15 shrink-0 ml-4">
                <Coins className="h-3 w-3 text-violet-400" />
                <span className="text-xs text-violet-400 font-medium">
                  {stakedUsernames.length}/{userData.usernames.length} staked
                </span>
              </div>
            </div>

            {/* Yield rate reference */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  tier: "Diamond",
                  chars: "1–3 chars",
                  yield: "5% APY",
                  cls: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
                },
                {
                  tier: "Platinum",
                  chars: "4–5 chars",
                  yield: "3% APY",
                  cls: "text-purple-300 bg-purple-500/10 border-purple-500/20",
                },
                {
                  tier: "Gold",
                  chars: "6–8 chars",
                  yield: "1.5% APY",
                  cls: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                },
                {
                  tier: "Silver/Bronze",
                  chars: "9+ chars",
                  yield: "Lock only",
                  cls: "text-white/20 bg-white/[0.03] border-white/[0.06]",
                },
              ].map((row) => (
                <div
                  key={row.tier}
                  className={`px-3 py-3 rounded-xl border text-center ${row.cls}`}
                >
                  <p className="text-[10px] font-semibold opacity-80 mb-0.5">
                    {row.tier}
                  </p>
                  <p className="text-[10px] opacity-40 mb-1.5">{row.chars}</p>
                  <p className="text-sm font-bold">{row.yield}</p>
                </div>
              ))}
            </div>

            {/* Staked — already staked, cannot stake again */}
            {stakedUsernames.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                  Earning now
                </p>
                {stakedUsernames.map((u, i) => {
                  const name = (u as any).username ?? u.name ?? "";
                  const tierKey = u.tier ?? tierFromLen(name.length);
                  const cfg =
                    TIER_CONFIG[tierKey as keyof typeof TIER_CONFIG] ??
                    TIER_CONFIG.Bronze;
                  const yp = USERNAME_YIELD[tierKey] ?? 0;
                  const earn = yp > 0 ? ((u.value ?? 0) * yp) / 100 : 0;
                  return (
                    <div
                      key={name ?? i}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-violet-500/[0.05] border border-violet-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                          <ShieldCheck className="h-4 w-4 text-violet-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">
                              @{name}
                            </p>
                            <Pill className={cfg.cls}>{cfg.label}</Pill>
                          </div>
                          <p className="text-[10px] text-white/30 mt-0.5">
                            {u.value ?? 0} SOL value · {name.length} chars
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        {yp > 0 ? (
                          <div className="text-right">
                            <p className="text-xs text-teal-400 font-bold">
                              +{earn.toFixed(4)} SOL
                            </p>
                            <p className="text-[10px] text-white/25">
                              per year
                            </p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-white/20">
                            Lock only
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setModal({ u, isStaking: false });
                            setModalError("");
                          }}
                          className="text-[10px] px-2.5 py-1.5 rounded-lg border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/30 cursor-pointer transition-all"
                        >
                          Unstake
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Unstaked — available to stake */}
            {unstakedUsernames.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                  Available to stake
                </p>
                {unstakedUsernames.map((u, i) => {
                  const name = (u as any).username ?? u.name ?? "";
                  const tierKey = u.tier ?? tierFromLen(name.length);
                  const cfg =
                    TIER_CONFIG[tierKey as keyof typeof TIER_CONFIG] ??
                    TIER_CONFIG.Bronze;
                  const yp = USERNAME_YIELD[tierKey] ?? 0;
                  const earn = yp > 0 ? ((u.value ?? 0) * yp) / 100 : 0;
                  return (
                    <div
                      key={name ?? i}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.10] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                          <Crown className="h-4 w-4 text-white/30" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">
                              @{name}
                            </p>
                            <Pill className={cfg.cls}>{cfg.label}</Pill>
                          </div>
                          <p className="text-[10px] text-white/30 mt-0.5">
                            {u.value ?? 0} SOL value · {name.length} chars ·{" "}
                            {yp > 0 ? (
                              <span className="text-teal-400">
                                {yp}% APY → +{earn.toFixed(4)} SOL/yr
                              </span>
                            ) : (
                              <span>No yield</span>
                            )}
                          </p>
                        </div>
                      </div>
                      {/* Stake button — only shown for unstaked usernames */}
                      <button
                        onClick={() => {
                          setModal({ u, isStaking: true });
                          setModalError("");
                        }}
                        className="text-[10px] px-3 py-1.5 rounded-lg border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 cursor-pointer transition-all shrink-0 ml-3 font-medium"
                      >
                        Stake
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-500/[0.03] border border-violet-500/10">
              <Info className="h-3.5 w-3.5 text-violet-400/40 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-300/30 leading-relaxed">
                Staked usernames earn yield based on their tier. They cannot be
                listed or sold while staked. Unstaking is instant.
              </p>
            </div>
          </Card>
        )}

        {/* SOL Staking + Positions */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Left: stake form */}
          <Card className="p-5 space-y-5">
            <p className="text-sm font-semibold text-white/60">Stake SOL</p>
            <div>
              <label className="text-xs text-white/30 block mb-1.5 font-medium">
                Amount (SOL)
              </label>
              <NumberInput
                value={amount}
                onChange={(v) => {
                  setAmount(v);
                  setError("");
                }}
                placeholder="0.00"
                suffix="SOL"
                hint={`Balance: ${balance.toFixed(4)} SOL · Minimum 0.1 SOL`}
                max={balance}
                onMax={() => setAmount((balance * 0.95).toFixed(4))}
              />
            </div>
            <div>
              <label className="text-xs text-white/30 block mb-2 font-medium">
                Lock period
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LOCK_OPTIONS.map((o) => (
                  <LockCard
                    key={o.days}
                    opt={o}
                    selected={period.days === o.days}
                    onSelect={() => setPeriod(o)}
                  />
                ))}
              </div>
            </div>

            {num > 0 && (
              <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06] space-y-2.5">
                <p className="text-[10px] text-white/25 uppercase tracking-widest font-medium">
                  Estimate
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-white/35">Expected yield</span>
                  <span className="text-emerald-400 font-semibold tabular-nums">
                    +{estimate.toFixed(4)} SOL
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/35">Unlock date</span>
                  <span className="text-white/60">{unlockDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/35">Effective APY</span>
                  <span className="text-teal-400 font-medium">
                    {period.apy}%
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-xs">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
              </div>
            )}

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <Info className="h-3.5 w-3.5 text-white/20 shrink-0 mt-0.5" />
              <p className="text-xs text-white/25 leading-relaxed">
                Staked SOL is locked for the full period. No early withdrawal.
                Rewards accumulate daily and can be claimed once unlocked.
              </p>
            </div>

            <button
              onClick={handleStake}
              disabled={!canStake}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 hover:border-teal-500/50 text-teal-400"
            >
              {done ? (
                <>
                  <Check className="h-4 w-4" /> Staked!
                </>
              ) : loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" /> Stake
                  {num > 0 ? ` ${num} SOL` : " SOL"}
                </>
              )}
            </button>
          </Card>

          {/* Right: positions */}
          <div className="space-y-4">
            {/* Unlocked — claimable */}
            {unlockedPositions.length > 0 && (
              <div>
                <ClaimBanner
                  count={unlockedPositions.length}
                  totalRewards={totalClaimable}
                />
                <div className="space-y-3">
                  {unlockedPositions.map((p) => (
                    <PositionCard
                      key={p.id}
                      pos={p}
                      onClaim={handleClaim}
                      claiming={claimingId === p.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Active — locked, no claim */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/25 mb-3">
                Active positions ({activePositions.length})
              </p>
              {activePositions.length === 0 ? (
                <Card className="p-0">
                  <EmptyState
                    icon={<Lock className="h-5 w-5" />}
                    title="No active positions"
                    sub="Stake SOL to start earning yield"
                  />
                </Card>
              ) : (
                <div className="space-y-3">
                  {activePositions.map((p) => (
                    <PositionCard
                      key={p.id}
                      pos={p}
                      onClaim={handleClaim}
                      claiming={claimingId === p.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
