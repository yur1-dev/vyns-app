// lib/auth/authOptions.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { sign } from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models";
import { verifyPassword } from "@/lib/utils/auth";
import { processReferral } from "@/lib/referral";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          await connectDB();
          const user = await User.findOne({ email: credentials.email });
          if (!user || !user.password) return null;
          const valid = await verifyPassword(
            credentials.password,
            user.password,
          );
          if (!valid) return null;
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            wallet: null,
          };
        } catch (err) {
          console.error("[NextAuth] credentials authorize error:", err);
          return null;
        }
      },
    }),

    CredentialsProvider({
      id: "wallet",
      name: "Wallet",
      credentials: {
        wallet: { label: "Wallet", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" },
        refCode: { label: "Ref Code", type: "text" },
      },
      async authorize(credentials) {
        if (
          !credentials?.wallet ||
          !credentials?.signature ||
          !credentials?.message
        ) {
          throw new Error("Missing wallet credentials");
        }
        try {
          const { wallet, signature, message } = credentials;
          const publicKey = new PublicKey(wallet);
          const messageBytes = new TextEncoder().encode(message);
          const signatureBytes = Uint8Array.from(
            Buffer.from(signature, "base64"),
          );
          const isValid = sign.detached.verify(
            messageBytes,
            signatureBytes,
            publicKey.toBytes(),
          );
          if (!isValid) throw new Error("Invalid wallet signature");

          await connectDB();
          let user = await User.findOne({ wallet });
          const isNew = !user;

          if (!user) {
            user = await User.create({
              wallet,
              xp: 0,
              level: 1,
              earnings: 0,
              stakedAmount: 0,
              referralCode: nanoid(8),
            });

            const refCode = credentials.refCode ?? readRefCookie();
            await processReferral(user._id.toString(), refCode);
          }

          return {
            id: user._id.toString(),
            wallet: user.wallet,
            name: user.username ?? null,
            email: user.email ?? null,
            isNewUser: isNew,
          };
        } catch (err) {
          console.error("[NextAuth] wallet authorize error:", err);
          throw err;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectDB();

          const googleId = account.providerAccountId;
          const email = user.email?.toLowerCase();

          // FIX: search by googleId first, then fall back to email
          let existing = await User.findOne({ googleId });

          if (!existing && email) {
            existing = await User.findOne({ email });
          }

          if (!existing) {
            // Brand new user — create with googleId saved
            const newUser = await User.create({
              email,
              name: user.name,
              googleId,
              xp: 0,
              level: 1,
              earnings: 0,
              stakedAmount: 0,
              referralCode: nanoid(8),
            });
            user.id = newUser._id.toString();

            const refCode = readRefCookie();
            await processReferral(newUser._id.toString(), refCode);
          } else {
            user.id = existing._id.toString();

            // FIX: always save googleId if it wasn't saved before
            // This fixes accounts that signed up via email first
            if (!existing.googleId) {
              existing.googleId = googleId;
              await existing.save();
            }
          }
        } catch (err) {
          console.error("[NextAuth] signIn Google DB error:", err);
          return true;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.wallet =
          account?.provider === "google"
            ? null
            : ((user as any).wallet ?? null);
        token.isNewUser = (user as any).isNewUser ?? false;
        token.provider = account?.provider ?? "credentials";
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.wallet = (token.wallet as string | null) ?? null;
        session.user.isNewUser = (token.isNewUser as boolean) ?? false;
        session.user.provider = token.provider ?? "credentials";
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
};

function readRefCookie(): string | null {
  try {
    const cookieStore = cookies();
    const val = (cookieStore as any).get("ref")?.value;
    return val ? decodeURIComponent(val) : null;
  } catch {
    return null;
  }
}
