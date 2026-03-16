// models/otp.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IOtpCode extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

const OtpCodeSchema = new Schema<IOtpCode>(
  {
    email: { type: String, required: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Auto-delete expired codes via MongoDB TTL index
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpCode =
  mongoose.models.OtpCode || mongoose.model<IOtpCode>("OtpCode", OtpCodeSchema);
