"use server";

import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import { User } from "@/models";
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

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: "User already exists with this email" };
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    const token = await createToken({
      userId: user._id.toString(),
      email,
    });
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

    await connectDB();

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return { error: "Invalid email or password" };
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return { error: "Invalid email or password" };
    }

    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
    });
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
  message: string,
) {
  try {
    if (!walletAddress || !signature || !message) {
      return { error: "Invalid wallet connection data" };
    }

    await connectDB();

    let user = await User.findOne({ wallet: walletAddress });

    if (!user) {
      user = await User.create({
        wallet: walletAddress,
        createdAt: new Date(),
      });
    }

    const token = await createToken({
      userId: user._id.toString(),
      wallet: walletAddress,
    });
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
