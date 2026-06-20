import { NextRequest, NextResponse } from "next/server";
import { newsService } from "@/lib/news/news.service";
import { rateLimit } from "@/lib/security/limiter";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  
  // Rate Limit: 45 requests per minute
  const limitRes = await rateLimit(ip, 45, 60);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "all";

  try {
    let articles = [];

    switch (category) {
      case "movie":
        articles = await newsService.getMovieNews();
        break;
      case "series":
        articles = await newsService.getSeriesNews();
        break;
      case "anime":
        articles = await newsService.getAnimeNews();
        break;
      case "industry":
        articles = await newsService.getIndustryNews();
        break;
      default:
        articles = await newsService.getLatestNews();
    }

    return NextResponse.json({
      activeProvider: newsService.getActiveProvider(),
      articles
    });
  } catch (err: any) {
    console.error("News API Router Error:", err.message);
    return NextResponse.json(
      { error: "Failed to load entertainment news" },
      { status: 500 }
    );
  }
}
