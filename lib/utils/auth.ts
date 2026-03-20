import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

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
    maxAge: 60 * 60 * 24 * 7,
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
// Priority order:
//   1. Bearer header — mobile JWT signed with NEXTAUTH_SECRET (Google OAuth mobile)
//   2. auth-token cookie — wallet / email users signed with JWT_SECRET (jose)
//   3. NextAuth session — Google OAuth on web
export async function verifyAuth(
  req: NextRequest,
): Promise<AuthPayload | null> {
  try {
    // 1. Bearer token — mobile Google JWT (signed with NEXTAUTH_SECRET via jsonwebtoken)
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const raw = authHeader.slice(7);
      try {
        const payload = verify(raw, process.env.NEXTAUTH_SECRET!) as any;
        if (payload?.userId) {
          return {
            userId: payload.userId,
            email: payload.email ?? undefined,
            wallet: payload.wallet ?? undefined,
          };
        }
      } catch {
        // not a NEXTAUTH_SECRET token, fall through
      }
    }

    // 2. Custom JWT cookie — wallet / email users (signed with JWT_SECRET via jose)
    const cookieToken = req.cookies.get("auth-token")?.value;
    if (cookieToken) {
      const payload = await verifyToken(cookieToken);
      if (payload) return payload;
    }

    // 3. NextAuth session — Google OAuth on web
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
