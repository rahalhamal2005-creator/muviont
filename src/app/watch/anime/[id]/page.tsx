import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AniListProvider, AniListMedia } from "@/lib/providers/anilist.provider";
import WatchAnimeClient from "@/components/cinematic/WatchAnimeClient";


interface WatchAnimePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WatchAnimePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Watch Anime — MUVIONT",
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default async function WatchAnimePage({ params }: WatchAnimePageProps) {
  const { id } = await params;
  const anilist = new AniListProvider();
  let anime = null;
  let recommendations: AniListMedia[] = [];

  try {
    const [animeData, recsData] = await Promise.all([
      anilist.getDetails(id).catch(() => null),
      anilist.getRecommendations(id).catch(() => []),
    ]);
    anime = animeData;
    recommendations = recsData;
  } catch {
    anime = null;
  }

  if (!anime) {
    anime = {
      id: id,
      title: "Anime Stream",
      overview: "Watch full anime episodes online in HD on MUVIONT.",
      posterPath: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop",
      backdropPath: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop",
      rating: 8.5,
      releaseDate: new Date().getFullYear().toString(),
      genres: ["Action", "Adventure", "Animation"],
      episodes: 24,
      totalEpisodes: 24,
      latestEpisode: 24,
      status: "FINISHED",
      studios: ["Studio Pierrot"],
      characters: []
    };
  }

  return <WatchAnimeClient anime={anime} recommendations={recommendations} />;
}
