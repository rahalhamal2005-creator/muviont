import { TMDBProvider } from "@/lib/providers/tmdb.provider";
import { AniListProvider } from "@/lib/providers/anilist.provider";
import TrendingClient from "@/components/cinematic/TrendingClient";

export const revalidate = 3600; // Cache page for 1 hour

export default async function TrendingPage() {
  const tmdb = new TMDBProvider();
  const anilist = new AniListProvider();

  // Run initial queries in parallel, catching errors
  const [moviesToday, seriesToday, animeToday] = await Promise.all([
    tmdb.getTrending("movie").catch(err => {
      console.error("Failed to fetch trending movies:", err.message);
      return [];
    }),
    tmdb.getTrending("series").catch(err => {
      console.error("Failed to fetch trending series:", err.message);
      return [];
    }),
    anilist.getTrending().catch(err => {
      console.error("Failed to fetch trending anime:", err.message);
      return [];
    })
  ]);

  return (
    <TrendingClient
      initialMovies={moviesToday}
      initialSeries={seriesToday}
      initialAnime={animeToday}
    />
  );
}
