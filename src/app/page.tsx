import HomeClient from "@/components/cinematic/HomeClient";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";
import { AniListProvider } from "@/lib/providers/anilist.provider";
import { newsService } from "@/lib/news/news.service";

// ISR: Rebuild every 15 minutes
export const revalidate = 900;

export default async function Page() {
  const tmdb    = new TMDBProvider();
  const anilist = new AniListProvider();

  // Fetch all sections in parallel
  const [
    trendingMovies,
    trendingSeries,
    trendingAnime,
    topRatedMovies,
    topRatedSeries,
    nowPlaying,
    popularMovies,
    upcomingMovies,
    newsArticles,
  ] = await Promise.all([
    tmdb.getTrending("movie").catch(() => []),
    tmdb.getTrending("series").catch(() => []),
    anilist.getTrending().catch(() => []),
    tmdb.getTopRated("movie").catch(() => []),
    tmdb.getTopRated("series").catch(() => []),
    tmdb.getNowPlaying().catch(() => []),
    tmdb.getPopular("movie").catch(() => []),
    tmdb.getUpcoming().catch(() => []),
    newsService.getLatestNews().catch(() => []),
  ]);

  return (
    <HomeClient
      trendingMovies={trendingMovies}
      trendingSeries={trendingSeries}
      trendingAnime={trendingAnime}
      topRatedMovies={topRatedMovies}
      topRatedSeries={topRatedSeries}
      nowPlaying={nowPlaying}
      popularMovies={popularMovies}
      upcomingMovies={upcomingMovies}
      newsArticles={newsArticles}
    />
  );
}
