import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { mediaId } = await req.json();
    if (!mediaId) {
      return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
    }

    await db.recommendationClick.create({
      data: { mediaId }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Click Tracking Error:", err.message);
    return NextResponse.json({ error: "Failed to log click" }, { status: 500 });
  }
}
