// app/api/user/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { verifyAuth } from "@/lib/utils/auth";
import { put, del } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    let userId = "unknown";

    // Try NextAuth session first (web)
    const session = await getServerSession(authOptions).catch(() => null);
    if (session?.user) {
      userId =
        (session.user as any)?.id ?? (session.user as any)?.email ?? "unknown";
    } else {
      // Fall back to JWT Bearer token (mobile)
      const auth = await verifyAuth(req);
      if (!auth) {
        return NextResponse.json(
          { success: false, error: "Not authenticated" },
          { status: 401 },
        );
      }
      userId = auth.userId ?? "unknown";
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) ?? "avatar";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 },
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image must be under 5MB" },
        { status: 400 },
      );
    }

    const ext = file.type === "image/png" ? "png" : "jpg";
    const pathname = `users/${userId}/${type}-${Date.now()}.${ext}`;

    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (err: any) {
    console.error("[upload-image]", err);
    return NextResponse.json(
      { success: false, error: err.message },
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
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
