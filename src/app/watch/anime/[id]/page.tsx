import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AniListProvider } from "@/lib/providers/anilist.provider";
import WatchAnimeClient from "@/components/cinematic/WatchAnimeClient";

interface WatchAnimePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WatchAnimePageProps): Promise<Metadata> {
  const { id } = await params;
  const anilist = new AniListProvider();
  try {
    const anime = await anilist.getDetails(id);
    if (!anime) return { title: "Watch Anime — MUVIONT" };
    return {
      title: `Watch ${anime.title} — MUVIONT`,
      description: `Stream ${anime.title} all episodes online in HD on MUVIONT.`,
      openGraph: {
        title: `Watch ${anime.title} — MUVIONT`,
        images: anime.backdropPath ? [{ url: anime.backdropPath }] : [],
      },
    };
  } catch {
    return { title: "Watch Anime — MUVIONT" };
  }
}

export default async function WatchAnimePage({ params }: WatchAnimePageProps) {
  const { id } = await params;
  const anilist = new AniListProvider();
  let anime = null;
  let recommendations: AniListMedia[] = [];

  try {
    const [animeData, recsData] = await Promise.all([
      anilist.getDetails(id),
      anilist.getRecommendations(id).catch(() => []),
    ]);
    anime = animeData;
    recommendations = recsData;
  } catch {
    notFound();
  }

  if (!anime) {
    notFound();
  }

  return <WatchAnimeClient anime={anime} recommendations={recommendations} />;
}
