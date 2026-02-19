"use server";

import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { User } from "@/models";
import bcrypt from "bcryptjs";

export async function loginWithEmail(email: string, password: string) {
  try {
    await connectDB();
    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return { success: false, error: "Invalid credentials" };
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { success: false, error: "Invalid credentials" };
    }

    const cookieStore = await cookies();
    cookieStore.set("auth-token", user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
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
  username: string,
) {
  try {
    await connectDB();

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return { success: false, error: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
    });

    const cookieStore = await cookies();
    cookieStore.set("auth-token", user._id.toString(), {
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
    await connectDB();

    let user = await User.findOne({ wallet: walletAddress });

    if (!user) {
      user = await User.create({
        wallet: walletAddress,
        username: `user_${walletAddress.slice(0, 8)}`,
      });
    }

    const cookieStore = await cookies();
    cookieStore.set("auth-token", user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

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

export async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");
    if (!token) return null;

    await connectDB();
    const user = (await User.findById(token.value).lean()) as any;
    if (!user) return null;

    return {
      _id: user._id.toString(),
      email: user.email,
      wallet: user.wallet,
      username: user.username,
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}
