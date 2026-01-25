"use server";

import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export interface User {
  _id: string;
  email?: string;
  walletAddress?: string;
  username: string;
  createdAt: Date;
}

export async function loginWithEmail(email: string, password: string) {
  try {
    const client = await clientPromise;
    const db = client.db("vyns");

    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return { success: false, error: "Invalid credentials" };
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return { success: false, error: "Invalid credentials" };
    }

    // Set auth cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Login failed" };
  }
}

export async function signupWithEmail(
  email: string,
  password: string,
  username: string
) {
  try {
    const client = await clientPromise;
    const db = client.db("vyns");

    // Check if user exists
    const existingUser = await db.collection("users").findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return { success: false, error: "User already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.collection("users").insertOne({
      email,
      username,
      password: hashedPassword,
      createdAt: new Date(),
    });

    // Set auth cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", result.insertedId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: "Signup failed" };
  }
}

export async function connectWallet(walletAddress: string) {
  try {
    const client = await clientPromise;
    const db = client.db("vyns");

    let user = await db.collection("users").findOne({ walletAddress });

    if (!user) {
      // Create new user
      const result = await db.collection("users").insertOne({
        walletAddress,
        username: `user_${walletAddress.slice(0, 8)}`,
        createdAt: new Date(),
      });

      const cookieStore = await cookies();
      cookieStore.set("auth-token", result.insertedId.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    } else {
      const cookieStore = await cookies();
      cookieStore.set("auth-token", user._id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Wallet connect error:", error);
    return { success: false, error: "Connection failed" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
  return { success: true };
}

export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token) return null;

    const client = await clientPromise;
    const db = client.db("vyns");

    const user = await db.collection("users").findOne({
      _id: token.value as any,
    });

    if (!user) return null;

    return {
      _id: user._id.toString(),
      email: user.email,
      walletAddress: user.walletAddress,
      username: user.username,
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}
