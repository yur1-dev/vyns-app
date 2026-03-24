// app/api/notifications/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongodb";
import NotificationState from "@/models/NotificationState";

// DELETE /api/notifications/delete
// Body: { id: string }         → delete one notification
// Body: { ids: string[] }      → delete multiple
// Body: { all: true }          → clear all (pass current IDs from client)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const body = await req.json();

    let idsToDelete: string[] = [];

    if (body?.all === true && Array.isArray(body?.ids)) {
      // Client sends all currently visible notification IDs
      idsToDelete = body.ids as string[];
    } else if (typeof body?.id === "string") {
      idsToDelete = [body.id];
    } else if (Array.isArray(body?.ids)) {
      idsToDelete = body.ids as string[];
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: "No IDs provided" },
        { status: 400 },
      );
    }

    await NotificationState.findOneAndUpdate(
      { userId },
      {
        $addToSet: { deletedIds: { $each: idsToDelete } },
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({ success: true, deleted: idsToDelete.length });
  } catch (error) {
    console.error("DELETE /api/notifications/delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete notifications" },
      { status: 500 },
    );
  }
}
