import { NextRequest, NextResponse } from "next/server";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const tmdb = new TMDBProvider();
  try {
    const providers = await tmdb.getWatchProviders(id);
    return NextResponse.json({ providers }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
