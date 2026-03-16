// lib/referral.ts
// Call this inside your signup API route after creating the new user.
// It reads the ref cookie, finds the referrer, and increments their count.

import { User } from "@/models/index";

export async function processReferral(
  newUserId: string,
  refCode: string | null | undefined
): Promise<void> {
  if (!refCode) return;

  try {
    // Find the user who owns this referral code
    const referrer = await User.findOne({ referralCode: refCode });
    if (!referrer) return;

    // Don't let someone refer themselves
    if (referrer._id.toString() === newUserId) return;

    // Increment their referral count
    await User.findByIdAndUpdate(referrer._id, {
      $inc: { referrals: 1 },
    });

    // Mark the new user as referred (prevents double-counting)
    await User.findByIdAndUpdate(newUserId, {
      $set: { referredBy: referrer._id },
    });
  } catch (err) {
    // Never block signup if referral tracking fails
    console.error("[processReferral] error:", err);
  }
}