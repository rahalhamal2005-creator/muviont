import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/security/limiter";
import { aiService } from "@/lib/ai";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";
import { AniListProvider } from "@/lib/providers/anilist.provider";
import { db } from "@/lib/db";

const tmdb = new TMDBProvider();
const anilist = new AniListProvider();

function getJaroWinklerSimilarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  const s1Matches = new Array(str1.length).fill(false);
  const s2Matches = new Array(str2.length).fill(false);

  let matches = 0;
  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(str2.length - 1, i + matchWindow);
    for (let j = start; j <= end; j++) {
      if (!s2Matches[j] && str1[i] === str2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0.0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }
  }

  const jaro = (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;
  
  let prefixLength = 0;
  const maxPrefix = Math.min(4, Math.min(str1.length, str2.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (str1[i] === str2[i]) prefixLength++;
    else break;
  }

  return jaro + prefixLength * 0.1 * (1.0 - jaro);
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  
  // 1. Enforce API Rate Limiting (Level 1 Protection)
  const limitRes = await rateLimit(ip, 30, 60); // 30 requests per minute
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: {
          "X-RateLimit-Limit": limitRes.limit.toString(),
          "X-RateLimit-Remaining": limitRes.remaining.toString(),
          "X-RateLimit-Reset": limitRes.reset.toString()
        }
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const userId = searchParams.get("userId") || null;

  if (!query || query.trim() === "") {
    return NextResponse.json({ results: [] });
  }

  try {
    // 2. Hybrid AI Search Router
    if (aiService.isConversationalQuery(query)) {
      // Natural language conversational request -> execute Gemini AI parsing and retrieval
      const { intent, results } = await aiService.executeAISearch(query);

      const responseTimeMs = Date.now() - startTime;
      db.searchLog.create({
        data: {
          query,
          isAI: true,
          resultCount: results.length,
          responseTimeMs,
          userId
        }
      }).catch(err => console.error("Failed to log search analytics:", err));

      return NextResponse.json({
        isAI: true,
        intent,
        results
      });
    }

    // Standard search query -> execute direct provider queries in parallel to reduce latency
    const [movieResults, animeResults] = await Promise.all([
      tmdb.search(query).catch(() => []),
      anilist.search(query).catch(() => [])
    ]);

    const tmdbResultsMapped = movieResults.map(item => ({
      ...item,
      provider: "tmdb" as const,
    }));

    const aniListResultsMapped = animeResults.map(item => ({
      ...item,
      provider: "anilist" as const,
      type: "anime" as const,
    }));

    const merged = [...tmdbResultsMapped, ...aniListResultsMapped];

    // Compute Min/Max popularity for normalization
    const tmdbPops = movieResults.map(m => m.popularity || 0);
    const maxTMDBPop = tmdbPops.length > 0 ? Math.max(...tmdbPops) : 1;
    const minTMDBPop = tmdbPops.length > 0 ? Math.min(...tmdbPops) : 0;

    const aniListPops = animeResults.map(a => a.popularity || 0);
    const maxAniListPop = aniListPops.length > 0 ? Math.max(...aniListPops) : 1;
    const minAniListPop = aniListPops.length > 0 ? Math.min(...aniListPops) : 0;

    const q = query.trim().toLowerCase();

    const scoredResults = merged.map(item => {
      const titleLower = (item.title || "").trim().toLowerCase();
      const englishLower = ("englishTitle" in item ? (item.englishTitle as string) || "" : "").trim().toLowerCase();

      let matchType: "exact_title" | "exact_english" | "starts_with" | "contains" | "fuzzy" | "none" = "none";
      let matchTypeScore = 0;
      let exactTitleBonus = 0;

      if (titleLower === q) {
        matchType = "exact_title";
        matchTypeScore = 100;
        exactTitleBonus = 100;
      } else if (englishLower && englishLower === q) {
        matchType = "exact_english";
        matchTypeScore = 90;
        exactTitleBonus = 100;
      } else if (titleLower.startsWith(q) || (englishLower && englishLower.startsWith(q))) {
        matchType = "starts_with";
        matchTypeScore = 60;
      } else if (titleLower.includes(q) || (englishLower && englishLower.includes(q))) {
        matchType = "contains";
        matchTypeScore = 30;
      } else {
        const simTitle = getJaroWinklerSimilarity(titleLower, q);
        const simEnglish = englishLower ? getJaroWinklerSimilarity(englishLower, q) : 0;
        const similarity = Math.max(simTitle, simEnglish);

        if (similarity > 0.4) {
          matchType = "fuzzy";
          matchTypeScore = similarity * 20;
        }
      }

      // Provider weights
      let providerWeight = 0;
      if (item.provider === "tmdb") {
        if (item.type === "movie") {
          providerWeight = 40;
        } else if (item.type === "series") {
          providerWeight = 35;
        }
      } else if (item.provider === "anilist") {
        providerWeight = 30;
      }

      // Normalized popularity score
      let popularityBonus = 0;
      if (item.provider === "tmdb") {
        const popRange = maxTMDBPop - minTMDBPop;
        popularityBonus = popRange > 0 ? ((item.popularity || 0) - minTMDBPop) / popRange : 0.5;
      } else {
        const popRange = maxAniListPop - minAniListPop;
        popularityBonus = popRange > 0 ? ((item.popularity || 0) - minAniListPop) / popRange : 0.5;
      }

      // Normalized rating score
      const ratingBonus = (item.rating || 0) / 10;

      const score = providerWeight + matchTypeScore + exactTitleBonus + popularityBonus + ratingBonus;

      return {
        ...item,
        score,
        matchType
      };
    });

    // Phase 2: Deduplication
    const getYear = (dateStr: string) => {
      if (!dateStr) return "";
      const match = dateStr.match(/^\d{4}/);
      return match ? match[0] : "";
    };

    const uniqueMap = new Map<string, typeof scoredResults[0]>();
    for (const item of scoredResults) {
      const year = getYear(item.releaseDate);
      const titleKey = (item.title || "").trim().toLowerCase();
      const typeKey = item.type || "";
      const dedupKey = `${titleKey}_${year}_${typeKey}`;
      
      const existing = uniqueMap.get(dedupKey);
      if (!existing || item.score > existing.score) {
        uniqueMap.set(dedupKey, item);
      }
    }
    const deduplicated = Array.from(uniqueMap.values());

    // Sort descending by score
    deduplicated.sort((a, b) => b.score - a.score);

    // Limit to top 20 and map to final format
    const results = deduplicated.slice(0, 20).map(item => {
      const isDev = process.env.NODE_ENV === "development";
      const finalScore = Math.round(item.score * 100) / 100;
      return {
        id: item.id,
        score: finalScore,
        provider: item.provider,
        type: item.type,
        title: item.title,
        releaseDate: item.releaseDate,
        rating: item.rating,
        posterPath: item.posterPath,
        overview: item.overview,
        backdropPath: item.backdropPath,
        ...(isDev ? {
          searchScore: finalScore,
          matchType: item.matchType
        } : {})
      };
    });

    const responseTimeMs = Date.now() - startTime;
    db.searchLog.create({
      data: {
        query,
        isAI: false,
        resultCount: results.length,
        responseTimeMs,
        userId
      }
    }).catch(err => console.error("Failed to log search analytics:", err));

    return NextResponse.json({
      isAI: false,
      results
    });
  } catch (err: any) {
    console.error("Search API Error:", err);
    return NextResponse.json(
      { error: "Failed to process search query" },
      { status: 500 }
    );
  }
}

