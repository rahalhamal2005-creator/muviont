import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");
    const season = searchParams.get("season") || "1";
    const episode = searchParams.get("episode") || "1";

    if (!id || !type) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const cineproUrl = process.env.CINEPRO_API_URL;
    if (!cineproUrl || cineproUrl.trim() === "" || cineproUrl.includes("placeholder")) {
      return NextResponse.json({
        error: "NOT_CONFIGURED",
        message: "CinePro API is not configured. Please add CINEPRO_API_URL to your environment variables."
      }, { status: 503 });
    }

    // Normalize endpoint url
    const baseUrl = cineproUrl.endsWith("/") ? cineproUrl.slice(0, -1) : cineproUrl;
    const targetUrl = `${baseUrl}/api/stream?id=${id}&type=${type}&season=${season}&episode=${episode}`;
    
    console.log(`Forwarding stream request to CinePro: ${targetUrl}`);
    const res = await fetch(targetUrl, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 1800 } // Cache resolved stream for 30 minutes
    });

    if (!res.ok) {
      return NextResponse.json({ 
        error: "RESOLVER_ERROR",
        message: `CinePro instance returned error status ${res.status}`
      }, { status: res.status });
    }

    const data = await res.json();
    
    // Validate returned stream url
    if (!data.url) {
      return NextResponse.json({
        error: "NO_STREAM_FOUND",
        message: "No active stream file (.m3u8/.mp4) was found by the CinePro resolvers."
      }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ 
      error: "SERVER_ERROR", 
      message: err.message 
    }, { status: 500 });
  }
}
