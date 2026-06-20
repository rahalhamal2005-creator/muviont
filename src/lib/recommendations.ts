import { db } from "./db";
import { cache } from "./cache";
import { TMDBProvider } from "./providers/tmdb.provider";
import { AniListProvider } from "./providers/anilist.provider";

const tmdb = new TMDBProvider();
const anilist = new AniListProvider();

const CACHE_TTL = 30 * 60; // 30 minutes in seconds

export interface RecommendedMedia {
  id: string;
  title: string;
  posterPath: string;
  rating: number;
  type: "movie" | "series" | "anime";
  releaseDate: string;
  genres: string[];
  popularity: number;
  score?: number;
}

export async function getPersonalizedRecommendations(userId: string): Promise<{ recommendations: RecommendedMedia[]; lastWatchedTitle: string | null }> {
  const cacheKey = `recommendations:${userId}`;
  const cached = await cache.get<{ recommendations: RecommendedMedia[]; lastWatchedTitle: string | null }>(cacheKey);
  if (cached) {
    return cached;
  }

  // 1. Fetch User Watch History
  const history = await db.history.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 10 // Take top 10 watch history items
  });

  // Fallback to trending content if watch history is empty
  if (history.length === 0) {
    const [trendingMovies, trendingSeries, trendingAnime] = await Promise.all([
      tmdb.getTrending("movie").catch(() => []),
      tmdb.getTrending("series").catch(() => []),
      anilist.getTrending().catch(() => [])
    ]);

    const candidates: RecommendedMedia[] = [
      ...trendingMovies.map(m => ({ ...m, type: "movie" as const, popularity: m.popularity || 0 })),
      ...trendingSeries.map(s => ({ ...s, type: "series" as const, popularity: s.popularity || 0 })),
      ...trendingAnime.map(a => ({ ...a, type: "anime" as const, popularity: a.popularity || 0 }))
    ];

    // Deduplicate and select top 20
    const seenIds = new Set<string>();
    const deduplicated: RecommendedMedia[] = [];
    for (const item of candidates) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        deduplicated.push(item);
      }
    }

    // Sort by rating & popularity
    deduplicated.sort((a, b) => (b.rating * 10 + b.popularity / 10) - (a.rating * 10 + a.popularity / 10));

    const finalResult = {
      recommendations: deduplicated.slice(0, 20),
      lastWatchedTitle: null
    };

    await cache.set(cacheKey, finalResult, CACHE_TTL);
    return finalResult;
  }

  // 2. Genre Extraction and candidate generation
  const watchedMediaIds = new Set(history.map(h => h.mediaId));
  
  // Extract user preferred genres
  const genreFrequency = new Map<string, number>();
  
  // Resolve details of watched history in parallel
  const watchedDetails = await Promise.all(
    history.map(async (item) => {
      try {
        if (item.mediaType === "anime" || item.mediaId.startsWith("a-")) {
          const detail = await anilist.getDetails(item.mediaId).catch(() => null);
          return { media: detail, type: "anime" as const, rawHistory: item };
        } else {
          const detail = await tmdb.getDetails(item.mediaId).catch(() => null);
          return { media: detail, type: item.mediaType as "movie" | "series", rawHistory: item };
        }
      } catch {
        return null;
      }
    })
  );

  let lastWatchedTitle: string | null = null;
  const validDetails = watchedDetails.filter(Boolean);

  if (validDetails.length > 0 && validDetails[0]?.media) {
    lastWatchedTitle = validDetails[0].media.title;
  }

  // Populate genre frequencies
  for (const detail of validDetails) {
    if (detail && detail.media && detail.media.genres) {
      for (const genre of detail.media.genres) {
        genreFrequency.set(genre, (genreFrequency.get(genre) || 0) + 1);
      }
    }
  }

  // 3. Query Recommendation APIs per history item in parallel
  const recommendationPromises = validDetails.map(async (detail) => {
    if (!detail || !detail.media) return [];
    
    const candidates: (RecommendedMedia & { sourceType: string })[] = [];
    try {
      if (detail.type === "anime") {
        const recs = await anilist.getRecommendations(detail.media.id).catch(() => []);
        candidates.push(...recs.map(item => ({
          id: item.id,
          title: item.title,
          posterPath: item.posterPath,
          rating: item.rating,
          type: "anime" as const,
          releaseDate: item.releaseDate,
          genres: item.genres || [],
          popularity: item.popularity || 0,
          sourceType: "anilist_recs"
        })));
      } else {
        const [recs, similar] = await Promise.all([
          tmdb.getRecommendations(detail.media.id).catch(() => []),
          tmdb.getSimilar(detail.media.id).catch(() => [])
        ]);
        
        candidates.push(...recs.map(item => ({
          id: item.id,
          title: item.title,
          posterPath: item.posterPath,
          rating: item.rating,
          type: detail.type as "movie" | "series",
          releaseDate: item.releaseDate,
          genres: item.genres || [],
          popularity: item.popularity || 0,
          sourceType: "tmdb_recs"
        })));

        candidates.push(...similar.map(item => ({
          id: item.id,
          title: item.title,
          posterPath: item.posterPath,
          rating: item.rating,
          type: detail.type as "movie" | "series",
          releaseDate: item.releaseDate,
          genres: item.genres || [],
          popularity: item.popularity || 0,
          sourceType: "tmdb_similar"
        })));
      }
    } catch (e) {
      console.error(`Failed to fetch recommendations for ${detail.media.id}:`, e);
    }
    return candidates;
  });

  const allRecommendationsArrays = await Promise.all(recommendationPromises);
  const rawCandidates = allRecommendationsArrays.flat();

  // Deduplicate candidates (keep highest score candidate)
  // Also filter out any candidate already in user watch history
  const candidateMap = new Map<string, any>();
  for (const c of rawCandidates) {
    if (watchedMediaIds.has(c.id)) continue;
    
    const existing = candidateMap.get(c.id);
    if (!existing) {
      candidateMap.set(c.id, c);
    }
  }

  const uniqueCandidates = Array.from(candidateMap.values());

  // 4. Scoring and ranking
  const scoredCandidates = uniqueCandidates.map(c => {
    // Base score
    let baseScore = 0;
    if (c.sourceType === "anilist_recs" || c.sourceType === "tmdb_recs") {
      baseScore = 5;
    } else if (c.sourceType === "tmdb_similar") {
      baseScore = 4;
    }

    // Genre overlap bonus
    let genreBonus = 0;
    if (c.genres) {
      for (const g of c.genres) {
        if (genreFrequency.has(g)) {
          const freq = genreFrequency.get(g) || 0;
          genreBonus += freq * 2;
        }
      }
    }

    // Popularity and rating bonuses
    const popularityBonus = c.popularity / 1000;
    const ratingBonus = c.rating * 1.5;

    const totalScore = baseScore + genreBonus + popularityBonus + ratingBonus;
    return {
      id: c.id,
      title: c.title,
      posterPath: c.posterPath,
      rating: c.rating,
      type: c.type,
      releaseDate: c.releaseDate,
      genres: c.genres,
      popularity: c.popularity,
      score: totalScore
    };
  });

  // Sort descending by score
  scoredCandidates.sort((a, b) => b.score - a.score);

  const finalRecommendations = scoredCandidates.slice(0, 20);

  // If we have less than 20 items, pad with trending content
  if (finalRecommendations.length < 20) {
    const [trendingMovies, trendingAnime] = await Promise.all([
      tmdb.getTrending("all").catch(() => []),
      anilist.getTrending().catch(() => [])
    ]);

    const trendingCandidates: RecommendedMedia[] = [
      ...trendingMovies.map(m => ({ ...m, type: m.type, popularity: m.popularity || 0 })),
      ...trendingAnime.map(a => ({ ...a, type: "anime" as const, popularity: a.popularity || 0 }))
    ];

    const finalIds = new Set(finalRecommendations.map(r => r.id));
    for (const t of trendingCandidates) {
      if (finalRecommendations.length >= 20) break;
      if (!finalIds.has(t.id) && !watchedMediaIds.has(t.id)) {
        finalIds.add(t.id);
        finalRecommendations.push({
          id: t.id,
          title: t.title,
          posterPath: t.posterPath,
          rating: t.rating,
          type: t.type,
          releaseDate: t.releaseDate,
          genres: t.genres || [],
          popularity: t.popularity,
          score: 0
        });
      }
    }
  }

  const finalResult = {
    recommendations: finalRecommendations.map(r => ({
      id: r.id,
      title: r.title,
      posterPath: r.posterPath,
      rating: r.rating,
      type: r.type,
      releaseDate: r.releaseDate,
      genres: r.genres,
      popularity: r.popularity,
      score: Math.round((r.score || 0) * 100) / 100
    })),
    lastWatchedTitle
  };

  await cache.set(cacheKey, finalResult, CACHE_TTL);
  return finalResult;
}
