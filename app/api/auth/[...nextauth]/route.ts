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

        await connectDB();
        const user = await User.findOne({ email: credentials.email });
        if (!user || !user.password) return null;

        const valid = await verifyPassword(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          // FIX: explicitly null — don't inherit any wallet for email users
          wallet: null,
        };
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

        const { wallet, signature, message } = credentials;

        const publicKey = new PublicKey(wallet);
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = Uint8Array.from(
          Buffer.from(signature, "base64"),
        );
        const publicKeyBytes = publicKey.toBytes();

        const isValid = sign.detached.verify(
          messageBytes,
          signatureBytes,
          publicKeyBytes,
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
      },
    }),
  ],

  callbacks: {
    // ── signIn: handle Google user creation ─────────────────
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();
        const existing = await User.findOne({ email: user.email });
        if (!existing) {
          await User.create({
            email: user.email,
            name: user.name,
            googleId: account.providerAccountId,
            xp: 0,
            level: 1,
            earnings: 0,
            stakedAmount: 0,
            referralCode: nanoid(8),
          });
        }
      }
      return true;
    },

    // ── jwt: persist wallet + userId into the token ─────────
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        // FIX: Google users never get a wallet in the token
        token.wallet =
          account?.provider === "google"
            ? null
            : ((user as any).wallet ?? null);
        token.isNewUser = (user as any).isNewUser ?? false;
      }
      return token;
    },

    // ── session: expose fields to the client ─────────────────
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        // FIX: use token.wallet (never overwrite with DB wallet for Google users)
        session.user.wallet = (token.wallet as string | null) ?? null;
        session.user.isNewUser = token.isNewUser as boolean;
      }

      // Hydrate latest user data from DB
      if (session.user?.id) {
        await connectDB();
        const user = await User.findById(session.user.id).lean();
        if (user) {
          session.user.username = (user as any).username ?? null;
          session.user.level = (user as any).level ?? 1;
          session.user.xp = (user as any).xp ?? 0;
          // FIX: only hydrate wallet from DB if session already has one (wallet users)
          // Google/email users stay wallet=null — never pull wallet from DB
          if (session.user.wallet) {
            session.user.wallet = (user as any).wallet ?? session.user.wallet;
          }
        }
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
    // FIX: longer maxAge helps mobile not lose session on tab switches
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Let NextAuth handle cookie naming automatically.
  // DO NOT override cookies config — it fights with NextAuth's built-in
  // __Secure- prefix logic on Vercel and causes the middleware to miss the token.
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
