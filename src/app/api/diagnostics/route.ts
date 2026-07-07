import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, provider, endpoint, latency = 0, errorMsg = "" } = body;

    if (!type || !provider) {
      return NextResponse.json({ error: "Missing required fields: type and provider" }, { status: 400 });
    }

    if (type === "stream_failure") {
      await db.providerMetric.create({
        data: {
          provider,
          endpoint: endpoint || "iframe_embed",
          latency: latency || 0,
          success: false,
          errorMsg: errorMsg || "Stream playback or load failed"
        }
      });
      return NextResponse.json({ success: true, message: "Stream failure recorded" });
    }

    if (type === "episode_fetch_failure") {
      await db.providerMetric.create({
        data: {
          provider: `${provider}_Episode`,
          endpoint: endpoint || "episode_api",
          latency: latency || 0,
          success: false,
          errorMsg: errorMsg || "Failed to fetch episode details"
        }
      });
      return NextResponse.json({ success: true, message: "Episode fetch failure recorded" });
    }

    return NextResponse.json({ error: "Unsupported diagnostic type" }, { status: 400 });
  } catch (err: any) {
    console.error("Diagnostics API error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
