// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { sign } from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { nanoid } from "nanoid";
import connectDB from "@/lib/db/mongodb";
import { User } from "@/models";
import { verifyPassword } from "@/lib/utils/auth";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    // ── Google ──────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ── Email / Password ────────────────────────────────────
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

    // ── Wallet Signature ────────────────────────────────────
    CredentialsProvider({
      id: "wallet",
      name: "Wallet",
      credentials: {
        wallet: { label: "Wallet", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" },
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
          if (!user) {
            user = await User.create({
              wallet,
              xp: 0,
              level: 1,
              earnings: 0,
              stakedAmount: 0,
              referralCode: nanoid(8),
            });
          }
          return {
            id: user._id.toString(),
            wallet: user.wallet,
            name: user.username ?? null,
            email: user.email ?? null,
            isNewUser: !user.username,
          };
        } catch (err) {
          console.error("[NextAuth] wallet authorize error:", err);
          throw err;
        }
      },
    }),
  ],

  callbacks: {
    // ── signIn: create Google user in DB ────────────────────
    // IMPORTANT: wrap in try/catch — if this throws, NextAuth wipes the session cookie
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          const existing = await User.findOne({ email: user.email });
          if (!existing) {
            const newUser = await User.create({
              email: user.email,
              name: user.name,
              googleId: account.providerAccountId,
              xp: 0,
              level: 1,
              earnings: 0,
              stakedAmount: 0,
              referralCode: nanoid(8),
            });
            // Store the new user's DB id on the user object so jwt callback gets it
            user.id = newUser._id.toString();
          } else {
            user.id = existing._id.toString();
          }
        } catch (err) {
          console.error("[NextAuth] signIn Google DB error:", err);
          // Return true anyway — don't block login if DB write fails.
          // The user will still be authenticated via Google, just won't have DB record yet.
          return true;
        }
      }
      return true;
    },

    // ── jwt: store userId + wallet in token (runs once at login, then cached) ──
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

    // ── session: expose token fields to client ──────────────
    // DO NOT make DB calls here — this runs on every request and any error
    // will cause NextAuth to invalidate the session cookie, creating a redirect loop.
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.wallet = (token.wallet as string | null) ?? null;
        session.user.isNewUser = (token.isNewUser as boolean) ?? false;
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
