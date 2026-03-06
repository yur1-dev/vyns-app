import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

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
export async function verifyAuth(
  req: NextRequest,
): Promise<AuthPayload | null> {
  try {
    const token =
      req.cookies.get("auth-token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}
