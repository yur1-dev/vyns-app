// models/trending.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITrending extends Document {
  keyword: string; // e.g. "mrbeast", "67", "taylor"
  matchedUsernames: string[]; // Username docs that matched
  source: "google" | "twitter" | "manual";
  category: "viral" | "celebrity" | "sports" | "event" | "meme";
  duration: "weekly" | "monthly"; // weekly = hot meme, monthly = big cultural moment
  yieldBoost: number; // multiplier e.g. 1.5 = +50% APY
  priceFloorMultiplier: number; // e.g. 1.3 = listed price can't drop below 1.3x base
  expiresAt: Date;
  createdAt: Date;
  isActive: boolean;
}

const TrendingSchema = new Schema<ITrending>(
  {
    keyword: { type: String, required: true, lowercase: true },
    matchedUsernames: [{ type: String }],
    source: {
      type: String,
      enum: ["google", "twitter", "manual"],
      default: "google",
    },
    category: {
      type: String,
      enum: ["viral", "celebrity", "sports", "event", "meme"],
      default: "viral",
    },
    duration: {
      type: String,
      enum: ["weekly", "monthly"],
      default: "weekly",
    },
    yieldBoost: { type: Number, default: 1.5 }, // +50% yield
    priceFloorMultiplier: { type: Number, default: 1.3 }, // +30% price floor
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

TrendingSchema.index({ keyword: 1 });
TrendingSchema.index({ expiresAt: 1 });
TrendingSchema.index({ isActive: 1 });

export const Trending =
  mongoose.models.Trending ||
  mongoose.model<ITrending>("Trending", TrendingSchema);
