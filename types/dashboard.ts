// types/dashboard.ts

export type TabId =
  | "overview"
  | "usernames"
  | "earnings"
  | "staking"
  | "referrals"
  | "settings"
  | "marketplace"
  | "profile";

export type UsernameTier =
  | "Diamond"
  | "Platinum"
  | "Gold"
  | "Silver"
  | "Bronze";

export interface UsernameItem {
  id: string;
  name: string;
  tier: UsernameTier;
  yield: number;
  value: number;
  expiresAt: string;
  claimedAt: string;
  staked: boolean;
  stakedAmount?: number;
  views?: number;
  transfers?: number;
}

export interface StakingPosition {
  id: string;
  amount: number;
  lockPeriod: number;
  apy: number;
  startDate: string;
  status: "active" | "unlocked" | "claimed";
  rewards: number;
  txSignature?: string;
}

export interface ActivityItem {
  id: string;
  type:
    | "claim"
    | "staking"
    | "referral"
    | "received"
    | "sent"
    | "unstake"
    | "reward";
  description: string;
  amount: number;
  token: string;
  date: string;
  timestamp: number;
  signature?: string;
}

export interface EarningsBreakdown {
  today: number;
  week: number;
  month: number;
  allTime: number;
}

export interface UserData {
  // Identity
  level: number;
  xp: number;
  xpToNextLevel: number;
  nextLevelXp: number;
  joinedAt?: string;
  isNewUser?: boolean;

  // Usernames
  usernames: UsernameItem[];

  // Earnings
  earnings: EarningsBreakdown;
  referralEarnings: number;
  stakingRewards: number;

  // Staking
  stakedAmount: number;
  stakingPositions: StakingPosition[];

  // Referrals — base
  referrals: number;
  referralCode?: string;

  // Referrals — reward tracking (populated from /api/user/me)
  unclaimedReferralSol: number;
  unclaimedVyns: number;
  claimedVyns: number;
  referralClaimPending: boolean;

  // Activity
  activity: ActivityItem[];
}

export interface LockOption {
  days: number;
  label: string;
  apy: number;
  best?: boolean;
  badge?: string;
}

export const LOCK_OPTIONS: LockOption[] = [
  { days: 30, label: "30 days", apy: 5.2 },
  { days: 90, label: "90 days", apy: 8.5 },
  { days: 180, label: "6 months", apy: 12.0 },
  { days: 365, label: "1 year", apy: 18.0, best: true, badge: "BEST APY" },
];

export const TIER_PRICING: Record<
  UsernameTier,
  { price: number; chars: string }
> = {
  Diamond: { price: 1.0, chars: "1–3 chars" },
  Platinum: { price: 0.5, chars: "4–5 chars" },
  Gold: { price: 0.25, chars: "6–8 chars" },
  Silver: { price: 0.1, chars: "9–15 chars" },
  Bronze: { price: 0.05, chars: "16+ chars" },
};

export function getTierFromLength(length: number): UsernameTier {
  if (length <= 3) return "Diamond";
  if (length <= 5) return "Platinum";
  if (length <= 8) return "Gold";
  if (length <= 15) return "Silver";
  return "Bronze";
}

// ─── Referral tier config ──────────────────────────────────────────────────────
// Each tier is reached by hitting the referral count threshold.
// Rewards are per-referral — cumulative totals are calculated in the UI.

export interface ReferralTier {
  id: string;
  label: string;
  minReferrals: number;
  solPerReferral: number;
  vynsPerReferral: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const REFERRAL_TIERS: ReferralTier[] = [
  {
    id: "starter",
    label: "Starter",
    minReferrals: 0,
    solPerReferral: 0.005,
    vynsPerReferral: 10,
    color: "text-white/50",
    bgColor: "bg-white/[0.04]",
    borderColor: "border-white/[0.08]",
  },
  {
    id: "bronze",
    label: "Bronze",
    minReferrals: 5,
    solPerReferral: 0.007,
    vynsPerReferral: 15,
    color: "text-amber-600",
    bgColor: "bg-amber-900/10",
    borderColor: "border-amber-700/20",
  },
  {
    id: "silver",
    label: "Silver",
    minReferrals: 15,
    solPerReferral: 0.01,
    vynsPerReferral: 25,
    color: "text-slate-300",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-400/20",
  },
  {
    id: "gold",
    label: "Gold",
    minReferrals: 30,
    solPerReferral: 0.015,
    vynsPerReferral: 40,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-400/25",
  },
  {
    id: "legend",
    label: "Legend",
    minReferrals: 75,
    solPerReferral: 0.025,
    vynsPerReferral: 75,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-400/25",
  },
];

export function getCurrentReferralTier(referrals: number): ReferralTier {
  for (let i = REFERRAL_TIERS.length - 1; i >= 0; i--) {
    if (referrals >= REFERRAL_TIERS[i].minReferrals) return REFERRAL_TIERS[i];
  }
  return REFERRAL_TIERS[0];
}

export function getNextReferralTier(referrals: number): ReferralTier | null {
  for (const tier of REFERRAL_TIERS) {
    if (referrals < tier.minReferrals) return tier;
  }
  return null;
}
