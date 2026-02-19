import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectDB from "@/lib/mongodb";
import { User } from "@/models";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET as string);

// GET /api/auth/session — get current logged-in user from token
export async function GET(req: NextRequest) {
  try {
    const token =
      req.cookies.get("auth-token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 401 },
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const wallet = payload.wallet as string;

    await connectDB();
    const user = await User.findOne({ wallet });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("GET /api/auth/session error:", error);
    return NextResponse.json(
      { success: false, error: "Invalid or expired token" },
      { status: 401 },
    );
  }
}

// DELETE /api/auth/session — logout
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
