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
  nextLevelXp: number; // alias used by some components
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

  // Referrals
  referrals: number;
  referralCode?: string;

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
