import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // adjust path if yours differs

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET as string);

export interface AuthPayload {
  wallet?: string;
  userId: string;
  email?: string;
}

// ─── Password Hashing ─────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ─── JWT Token ────────────────────────────────────────────
export async function createToken(payload: AuthPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

// ─── Cookie Management ────────────────────────────────────
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set("auth-token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
}

// ─── Get Current User ─────────────────────────────────────
export async function getUser(): Promise<AuthPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

// ─── Request Auth Verification ────────────────────────────
// Handles three session types in priority order:
//   1. Custom JWT cookie (auth-token)  — wallet + email/password users
//   2. Authorization header Bearer     — API clients
//   3. NextAuth session token          — Google OAuth users
export async function verifyAuth(
  req: NextRequest,
): Promise<AuthPayload | null> {
  try {
    // 1 & 2 — custom JWT (wallet / email users)
    const token =
      req.cookies.get("auth-token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (token) {
      const payload = await verifyToken(token);
      if (payload) return payload;
    }

    // 3 — NextAuth session (Google OAuth users)
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const user = session.user as any;
      return {
        userId: user.id ?? user._id ?? user.email ?? "",
        email: user.email ?? undefined,
        wallet: user.wallet ?? undefined,
      };
    }

    return null;
  } catch {
    return null;
  }
}
