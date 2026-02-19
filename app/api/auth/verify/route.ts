import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { sign } from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import connectDB from "@/lib/mongodb";
import { User } from "@/models";
import { nanoid } from "nanoid";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET as string);

// POST /api/auth/verify — verify wallet signature and return JWT
export async function POST(req: NextRequest) {
  try {
    const { wallet, signature, message } = await req.json();

    if (!wallet || !signature || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Wallet, signature, and message are required",
        },
        { status: 400 },
      );
    }

    // Verify the Solana wallet signature
    const publicKey = new PublicKey(wallet);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Uint8Array.from(Buffer.from(signature, "base64"));
    const publicKeyBytes = publicKey.toBytes();

    const isValid = sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes,
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 },
      );
    }

    // Connect to DB and find or create user
    await connectDB();
    let user = await User.findOne({ wallet });
    const isNewUser = !user;

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

    // Generate JWT token
    const token = await new SignJWT({ wallet, userId: user._id.toString() })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      token,
      user,
      isNewUser,
    });

    // Set token as HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/verify error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 500 },
    );
  }
}
