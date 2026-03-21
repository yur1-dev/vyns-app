import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { verifyAuth } from "@/lib/utils/auth";
import { put, del } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null;

    // Try NextAuth session first (web)
    const session = await getServerSession(authOptions).catch(() => null);
    if (session?.user) {
      userId =
        (session.user as any)?.id ?? (session.user as any)?.email ?? null;
    }

    // Fall back to Bearer JWT (mobile Google auth)
    if (!userId) {
      const auth = await verifyAuth(req);
      if (!auth) {
        return NextResponse.json(
          { success: false, error: "Not authenticated" },
          { status: 401 },
        );
      }
      userId = auth.userId;
    }

    // Accept base64 JSON body — avoids React Native FormData header-stripping bug
    const { type, base64, contentType } = await req.json();

    if (!["avatar", "cover"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid type. Must be avatar or cover." },
        { status: 400 },
      );
    }

    if (!base64 || typeof base64 !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing base64 image data" },
        { status: 400 },
      );
    }

    if (!contentType?.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Invalid content type. Must be an image." },
        { status: 400 },
      );
    }

    // ~5MB limit (base64 is ~33% larger than raw, so 7MB base64 ≈ 5MB file)
    if (base64.length > 7 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image must be under 5MB" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(base64, "base64");
    const ext = contentType === "image/png" ? "png" : "jpg";
    const pathname = `users/${userId}/${type}-${Date.now()}.${ext}`;

    const blob = await put(pathname, buffer, {
      access: "public",
      contentType,
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (err: any) {
    console.error("[upload-image]", err);
    return NextResponse.json(
      { success: false, error: err.message ?? "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    const auth = !session?.user ? await verifyAuth(req) : null;

    if (!session?.user && !auth) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json(
        { success: false, error: "No URL provided" },
        { status: 400 },
      );
    }

    await del(url);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message ?? "Server error" },
      { status: 500 },
    );
  }
}
