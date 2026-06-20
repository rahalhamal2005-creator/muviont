import { NextRequest, NextResponse } from "next/server";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type    = (searchParams.get("type") as "movie" | "series") || "movie";
  const genreId = searchParams.get("genre") || undefined;
  const year    = searchParams.get("year") || undefined;
  const sortBy  = searchParams.get("sort") || "popularity.desc";
  const page    = parseInt(searchParams.get("page") || "1", 10);

  const tmdb = new TMDBProvider();
  try {
    const { results, totalPages } = await tmdb.discover(type, { genreId, year, sortBy, page });
    const genres = await tmdb.getGenreList(type);
    return NextResponse.json({ results, totalPages, genres }, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
