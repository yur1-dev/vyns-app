// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface Username {
  id: string;
  name: string;
  level: number;
  yield: number;
  staked: boolean;
  value: number;
  tier: "Bronze" | "Silver" | "Gold" | "Diamond";
  createdAt: string;
  expiresAt: string;
}

export interface ActivityItem {
  id: string;
  type: "received" | "sent" | "staking" | "referral" | "claim";
  amount: number;
  token: string;
  description: string;
  date: string;
  timestamp: number;
  signature?: string; // on-chain tx signature
}

export interface StakingPosition {
  id: string;
  amount: number;
  startDate: string;
  lockPeriod: 30 | 90 | 180 | 365; // days
  apy: number;
  rewards: number;
  status: "active" | "unlocked" | "claimed";
}

export interface UserData {
  walletAddress: string;
  usernames: Username[];
  earnings: {
    today: number;
    week: number;
    allTime: number;
  };
  level: number;
  xp: number;
  nextLevelXp: number;
  referralCode: string;
  referrals: number;
  referralEarnings: number;
  stakedAmount: number;
  stakingRewards: number;
  stakingPositions: StakingPosition[];
  activity: ActivityItem[];
  isNewUser: boolean;
}

export type TabId =
  | "overview"
  | "usernames"
  | "earnings"
  | "staking"
  | "referrals"
  | "settings";
