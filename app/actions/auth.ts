"use server";

import { redirect } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import {
  hashPassword,
  verifyPassword,
  createToken,
  setAuthCookie,
  removeAuthCookie,
} from "@/lib/auth";

export async function signupWithEmail(email: string, password: string) {
  try {
    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters" };
    }

    const client = await clientPromise;
    const db = client.db("dashboard");

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return { error: "User already exists with this email" };
    }

    // Create new user
    const hashedPassword = await hashPassword(password);
    const result = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    // Create token and set cookie
    const token = await createToken(result.insertedId.toString());
    await setAuthCookie(token);

    return { success: true };
  } catch (error) {
    console.error("[v0] Signup error:", error);
    return { error: "Failed to create account. Please try again." };
  }
}

export async function loginWithEmail(email: string, password: string) {
  try {
    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    const client = await clientPromise;
    const db = client.db("dashboard");

    // Find user
    const user = await db.collection("users").findOne({ email });
    if (!user || !user.password) {
      return { error: "Invalid email or password" };
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return { error: "Invalid email or password" };
    }

    // Create token and set cookie
    const token = await createToken(user._id.toString());
    await setAuthCookie(token);

    return { success: true };
  } catch (error) {
    console.error("[v0] Login error:", error);
    return { error: "Failed to login. Please try again." };
  }
}

export async function loginWithWallet(
  walletAddress: string,
  signature: string,
  message: string
) {
  try {
    if (!walletAddress || !signature || !message) {
      return { error: "Invalid wallet connection data" };
    }

    // Verify signature (basic check - in production, verify cryptographically)
    const client = await clientPromise;
    const db = client.db("dashboard");

    // Find or create wallet user
    let user = await db.collection("users").findOne({ walletAddress });

    if (!user) {
      const result = await db.collection("users").insertOne({
        walletAddress,
        createdAt: new Date(),
      });
      user = { _id: result.insertedId };
    }

    // Create token and set cookie
    const token = await createToken(user._id.toString());
    await setAuthCookie(token);

    return { success: true };
  } catch (error) {
    console.error("[v0] Wallet login error:", error);
    return { error: "Failed to connect wallet. Please try again." };
  }
}

export async function logout() {
  await removeAuthCookie();
  redirect("/login");
}
