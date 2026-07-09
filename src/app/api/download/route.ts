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

    // Extract raw ID
    let rawId = id;
    if (id.startsWith("m-") || id.startsWith("s-") || id.startsWith("a-")) {
      rawId = id.substring(2);
    }

    const cineproUrl = process.env.CINEPRO_API_URL;
    if (!cineproUrl || cineproUrl.trim() === "" || cineproUrl.includes("placeholder")) {
      // If CinePro is not configured, fallback to a public embed player that allows download/streaming
      return NextResponse.redirect(`https://vidsrc.to/embed/movie/${rawId}`);
    }

    // Normalize endpoint url
    const baseUrl = cineproUrl.endsWith("/") ? cineproUrl.slice(0, -1) : cineproUrl;
    
    let targetUrl = "";
    // OMSS supports 'movie' and 'tv'
    if (type === "movie") {
      targetUrl = `${baseUrl}/v1/movies/${rawId}`;
    } else {
      targetUrl = `${baseUrl}/v1/tv/${rawId}/seasons/${season}/episodes/${episode}`;
    }
    
    console.log(`Resolving download URL: ${targetUrl}`);
    const res = await fetch(targetUrl, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 1800 }
    });

    if (!res.ok) {
      // Fallback on resolver error
      return NextResponse.redirect(
        type === "movie"
          ? `https://vidsrc.to/embed/movie/${rawId}`
          : `https://vidsrc.to/embed/tv/${rawId}/${season}/${episode}`
      );
    }

    const data = await res.json();
    const sources = data.sources || [];
    const bestSource = sources.find((s: any) => s.url && s.url.trim() !== "");

    if (!bestSource || !bestSource.url) {
      return NextResponse.redirect(
        type === "movie"
          ? `https://vidsrc.to/embed/movie/${rawId}`
          : `https://vidsrc.to/embed/tv/${rawId}/${season}/${episode}`
      );
    }

    const isDirectMp4 = bestSource.url.toLowerCase().includes(".mp4") && !bestSource.url.includes("proxy");

    if (!isDirectMp4) {
      // Fallback to public player page if it's HLS/m3u8 or proxied stream
      return NextResponse.redirect(
        type === "movie"
          ? `https://vidsrc.to/embed/movie/${rawId}`
          : `https://vidsrc.to/embed/tv/${rawId}/${season}/${episode}`
      );
    }

    // Redirect directly to high-speed stream link
    return NextResponse.redirect(bestSource.url);
  } catch (err: any) {
    return NextResponse.json({ 
      error: "SERVER_ERROR", 
      message: err.message 
    }, { status: 500 });
  }
}
