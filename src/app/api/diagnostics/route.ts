import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, provider, endpoint, latency = 0, errorMsg = "" } = body;

    if (!type || !provider) {
      return NextResponse.json({ error: "Missing required fields: type and provider" }, { status: 400 });
    }

    // Metric logging disabled — providerMetric writes filled the Neon 512 MB limit
    // Just acknowledge the diagnostic without writing to DB
    if (type === "stream_failure") {
      return NextResponse.json({ success: true, message: "Stream failure acknowledged" });
    }

    if (type === "episode_fetch_failure") {
      return NextResponse.json({ success: true, message: "Episode fetch failure acknowledged" });
    }

    return NextResponse.json({ error: "Unsupported diagnostic type" }, { status: 400 });
  } catch (err: any) {
    console.error("Diagnostics API error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
