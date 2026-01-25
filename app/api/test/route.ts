import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("vyns_db");
    await db.command({ ping: 1 });

    return NextResponse.json({
      message: "MongoDB connected successfully!",
      database: "vyns_db",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "MongoDB connection failed",
        details: error,
      },
      { status: 500 }
    );
  }
}
