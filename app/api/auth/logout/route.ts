// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  // Clear the custom wallet JWT cookie
  res.cookies.set("auth-token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return res;
}
