import { NextRequest, NextResponse } from "next/server";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";
import { AniListProvider } from "@/lib/providers/anilist.provider";

export const runtime = "nodejs";

const ANIME_GENRES = [
  { id: 1, name: "Action" },
  { id: 2, name: "Adventure" },
  { id: 3, name: "Comedy" },
  { id: 4, name: "Drama" },
  { id: 5, name: "Fantasy" },
  { id: 6, name: "Horror" },
  { id: 7, name: "Mystery" },
  { id: 8, name: "Psychological" },
  { id: 9, name: "Romance" },
  { id: 10, name: "Sci-Fi" },
  { id: 11, name: "Slice of Life" },
  { id: 12, name: "Sports" },
  { id: 13, name: "Supernatural" },
  { id: 14, name: "Thriller" }
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type    = searchParams.get("type") || "movie";
  const genreId = searchParams.get("genre") || undefined;
  const year    = searchParams.get("year") || undefined;
  const sortBy  = searchParams.get("sort") || "popularity.desc";
  const page    = parseInt(searchParams.get("page") || "1", 10);

  try {
    if (type === "anime") {
      const anilist = new AniListProvider();
      let genreName = genreId;
      const matchedGenre = ANIME_GENRES.find(g => String(g.id) === genreId);
      if (matchedGenre) {
        genreName = matchedGenre.name;
      }
      
      const { results, totalPages } = await anilist.discover({ genre: genreName, year, sort: sortBy, page });
      return NextResponse.json({ results, totalPages, genres: ANIME_GENRES }, {
        headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
      });
    } else {
      const tmdb = new TMDBProvider();
      const { results, totalPages } = await tmdb.discover(type as "movie" | "series", { genreId, year, sortBy, page });
      const genres = await tmdb.getGenreList(type as "movie" | "series");
      return NextResponse.json({ results, totalPages, genres }, {
        headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
