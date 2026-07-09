import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 });
  }

  const type = id.startsWith("m-") ? "movie" : "tv";
  const rawId = id.substring(2);
  const url = `https://api.themoviedb.org/3/${type}/${rawId}/reviews?api_key=${apiKey}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 14400 }, // 4 Hours cache
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      return NextResponse.json({ reviews: [] });
    }

    const data = await res.json();
    const reviews = (data.results || []).map((rev: any) => ({
      author: rev.author || "Anonymous",
      content: rev.content || "",
      rating: rev.author_details?.rating || null,
      id: rev.id
    })).slice(0, 4); // Limit to top 4 reviews for clean UI

    return NextResponse.json({ reviews }, {
      headers: { "Cache-Control": "public, s-maxage=14400, stale-while-revalidate=86400" }
    });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}
