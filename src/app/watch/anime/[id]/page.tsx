import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AniListProvider, AniListMedia } from "@/lib/providers/anilist.provider";
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
  const rawId = id.startsWith("a-") ? id.substring(2) : id;
  const anilist = new AniListProvider();
  let anime = null;
  let recommendations: AniListMedia[] = [];

  try {
    const [animeData, recsData] = await Promise.all([
      anilist.getDetails(rawId).catch(() => null),
      anilist.getRecommendations(rawId).catch(() => []),
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
      posterPath: "",
      backdropPath: "",
      mediaType: "anime",
      rating: 9.0,
      releaseDate: new Date().getFullYear().toString(),
      genres: ["Action", "Anime"]
    };
  }

  return <WatchAnimeClient anime={anime} recommendations={recommendations} />;
}
