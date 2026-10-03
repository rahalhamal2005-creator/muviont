import { NextRequest, NextResponse } from "next/server";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";


export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id     = searchParams.get("id");
  const season = parseInt(searchParams.get("season") || "1", 10);

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const tmdb = new TMDBProvider();
  try {
    const episodes = await tmdb.getSeasonEpisodes(id, season);
    return NextResponse.json({ episodes }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch (err: any) {
    console.error(`Episode fetch failed for id=${id}, season=${season}:`, err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
