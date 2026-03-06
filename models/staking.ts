// models/staking.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IStakingPosition extends Document {
  userId?: string;
  wallet?: string;
  amount: number;
  lockPeriod: number; // days
  apy: number;
  startDate: Date;
  status: "active" | "unlocked" | "claimed";
  rewards: number;
  txSignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StakingPositionSchema = new Schema<IStakingPosition>(
  {
    userId: { type: String, index: true },
    wallet: { type: String, index: true },
    amount: { type: Number, required: true },
    lockPeriod: { type: Number, required: true },
    apy: { type: Number, required: true },
    startDate: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ["active", "unlocked", "claimed"],
      default: "active",
    },
    rewards: { type: Number, default: 0 },
    txSignature: { type: String },
  },
  { timestamps: true },
);

export const StakingPosition =
  mongoose.models.StakingPosition ||
  mongoose.model<IStakingPosition>("StakingPosition", StakingPositionSchema);
