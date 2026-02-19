import mongoose, { Schema, Document } from "mongoose";

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────
export interface IUser extends Document {
  wallet?: string;
  email?: string;
  name?: string;
  password?: string; // ← ADD THIS
  googleId?: string;
  username?: string;
  avatar?: string;
  xp: number;
  level: number;
  earnings: number;
  stakedAmount: number;
  referralCode: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    wallet: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    name: { type: String },
    password: { type: String }, // ← ADD THIS
    googleId: { type: String, unique: true, sparse: true },
    username: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    earnings: { type: Number, default: 0 },
    stakedAmount: { type: Number, default: 0 },
    referralCode: { type: String, unique: true },
    referredBy: { type: String },
  },
  { timestamps: true },
);

// ─────────────────────────────────────────────
// USERNAME
// ─────────────────────────────────────────────
export interface IUsername extends Document {
  username: string;
  walletAddress: string;
  level: number;
  xp: number;
  isPremium: boolean;
  isVerified: boolean;
  listedPrice?: number;
  totalTransactions: number;
  totalVolume: number;
  totalYield: number;
  profile?: {
    bio?: string;
    avatar?: string;
    twitter?: string;
    website?: string;
  };
  stats?: Record<string, unknown>;
  createdAt: Date;
}

const UsernameSchema = new Schema<IUsername>(
  {
    username: { type: String, required: true, unique: true },
    walletAddress: { type: String, required: true },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    listedPrice: { type: Number },
    totalTransactions: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 },
    totalYield: { type: Number, default: 0 },
    profile: {
      bio: { type: String },
      avatar: { type: String },
      twitter: { type: String },
      website: { type: String },
    },
    stats: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

// ─────────────────────────────────────────────
// TRANSACTION
// ─────────────────────────────────────────────
export interface ITransaction extends Document {
  fromUsername: string;
  toUsername: string;
  type: string;
  amount: number;
  token: string;
  txHash?: string;
  timestamp: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    fromUsername: { type: String, required: true },
    toUsername: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    token: { type: String, required: true },
    txHash: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// ─────────────────────────────────────────────
// ACTIVITY
// ─────────────────────────────────────────────
export interface IActivity extends Document {
  wallet: string;
  type: "stake" | "unstake" | "claim" | "referral" | "transaction";
  description: string;
  amount?: number;
  xpEarned?: number;
  txHash?: string;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    wallet: { type: String, required: true },
    type: {
      type: String,
      enum: ["stake", "unstake", "claim", "referral", "transaction"],
      required: true,
    },
    description: { type: String, required: true },
    amount: { type: Number },
    xpEarned: { type: Number, default: 0 },
    txHash: { type: String },
  },
  { timestamps: true },
);

// ─────────────────────────────────────────────
// REFERRAL
// ─────────────────────────────────────────────
export interface IReferral extends Document {
  referrerWallet: string;
  referredWallet: string;
  rewardEarned: number;
  createdAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerWallet: { type: String, required: true },
    referredWallet: { type: String, required: true, unique: true },
    rewardEarned: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export const Username =
  mongoose.models.Username ||
  mongoose.model<IUsername>("Username", UsernameSchema);

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export const Activity =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", ActivitySchema);

export const Referral =
  mongoose.models.Referral ||
  mongoose.model<IReferral>("Referral", ReferralSchema);
