import AnimeHubClient from "@/components/cinematic/AnimeHubClient";
import { AniListProvider } from "@/lib/providers/anilist.provider";

export const revalidate = 21600; // Cache hub data for 6 hours

/** Compute a 7-day airing schedule window at module load time (server-side, recomputed each ISR cycle). */
function getAiringWindow() {
  const nowSec = Math.floor(Date.now() / 1000);
  return { startSec: nowSec - 3 * 24 * 3600, endSec: nowSec + 4 * 24 * 3600 };
}

export default async function Page() {
  const anilist = new AniListProvider();
  const { startSec, endSec } = getAiringWindow();

  // Run queries in parallel, catching errors to prevent build-time failures
  const [trendingAnime, popularAiring, airingSchedule] = await Promise.all([
    anilist.getTrending().catch(err => { console.error("Trending anime fetch failed:", err.message); return []; }),
    anilist.getPopularAiring().catch(err => { console.error("Popular airing anime fetch failed:", err.message); return []; }),
    anilist.getAiringSchedule(startSec, endSec).catch(err => { console.error("Airing schedule fetch failed:", err.message); return []; })
  ]);

  return (
    <AnimeHubClient
      trendingAnime={trendingAnime}
      popularAiring={popularAiring}
      airingSchedule={airingSchedule}
    />
  );
}
