// lib/utils/get-auth.ts
// Unified auth resolver — works for both wallet (custom JWT) and email/Google (NextAuth)
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyAuth } from "@/lib/utils/auth";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models";

export interface ResolvedAuth {
  userId: string;
  email?: string;
  wallet?: string;
}

export async function getAuth(req: NextRequest): Promise<ResolvedAuth | null> {
  // Strategy 1: custom JWT cookie (wallet + email/password users via custom login)
  const jwtAuth = await verifyAuth(req);
  if (jwtAuth?.userId) {
    return {
      userId: jwtAuth.userId,
      email: jwtAuth.email,
      wallet: jwtAuth.wallet,
    };
  }

  // Strategy 2: NextAuth session (Google + email/password via NextAuth)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const userId = (session.user as any).id;
    if (userId) {
      return {
        userId,
        email: session.user.email ?? undefined,
        wallet: (session.user as any).wallet ?? undefined,
      };
    }

    // Fallback: look up user by email
    if (session.user.email) {
      await connectDB();
      const user = (await User.findOne({
        email: session.user.email,
      }).lean()) as any;
      if (user) {
        return {
          userId: user._id.toString(),
          email: user.email,
          wallet: user.wallet ?? undefined,
        };
      }
    }
  }

  return null;
}
