import HomeClient from "@/components/cinematic/HomeClient";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";
import { AniListProvider } from "@/lib/providers/anilist.provider";
import { newsService } from "@/lib/news/news.service";

// Enable dynamic static regeneration (ISR) - Page rebuilds in background every 15 minutes
export const revalidate = 900;

export default async function Page() {
  const tmdb = new TMDBProvider();
  const anilist = new AniListProvider();

  // Run initial fetches in parallel, catching errors to prevent build-time failures
  const [trendingMovies, trendingSeries, trendingAnime, newsArticles] = await Promise.all([
    tmdb.getTrending("movie").catch(err => { console.error("Trending movies fetch failed:", err.message); return []; }),
    tmdb.getTrending("series").catch(err => { console.error("Trending series fetch failed:", err.message); return []; }),
    anilist.getTrending().catch(err => { console.error("Trending anime fetch failed:", err.message); return []; }),
    newsService.getLatestNews().catch(err => { console.error("Latest news fetch failed:", err.message); return []; })
  ]);

  return (
    <HomeClient
      trendingMovies={trendingMovies}
      trendingSeries={trendingSeries}
      trendingAnime={trendingAnime}
      newsArticles={newsArticles}
    />
  );
}
