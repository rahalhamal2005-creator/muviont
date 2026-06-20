import { NextRequest, NextResponse } from "next/server";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";
import { AniListProvider } from "@/lib/providers/anilist.provider";
import { YouTubeProvider } from "@/lib/providers/youtube.provider";
import { rateLimit } from "@/lib/security/limiter";

const tmdb = new TMDBProvider();
const anilist = new AniListProvider();
const youtube = new YouTubeProvider();

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  
  // Rate Limit: 30 requests per minute
  const limitRes = await rateLimit(ip, 30, 60);
  if (!limitRes.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const title = searchParams.get("title");

  try {
    // 1. If we have an ID, try fetching details first to get the official trailer
    if (id) {
      if (id.startsWith("a-")) {
        const details = await anilist.getDetails(id);
        if (details?.trailerUrl) {
          return NextResponse.json({ trailerUrl: details.trailerUrl });
        }
      } else {
        const details = await tmdb.getDetails(id);
        if (details?.trailerUrl) {
          return NextResponse.json({ trailerUrl: details.trailerUrl });
        }
      }
    }

    // 2. Fallback to searching YouTube directly for the trailer using YouTubeProvider
    if (title) {
      try {
        const videoId = await youtube.getTrailerVideoId(title);
        return NextResponse.json({ trailerUrl: `https://www.youtube.com/watch?v=${videoId}` });
      } catch (err: any) {
        console.warn(`YouTube trailer search failed for ${title}:`, err.message);
      }
    }

    return NextResponse.json({ trailerUrl: "" });
  } catch (err: any) {
    console.error("Trailer API Error:", err.message);
    return NextResponse.json({ trailerUrl: "" });
  }
}
