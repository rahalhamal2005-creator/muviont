import { Metadata } from "next";
import { notFound } from "next/navigation";
import { AniListProvider } from "@/lib/providers/anilist.provider";
import AnimeDetailClient from "@/components/cinematic/AnimeDetailClient";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const anilist = new AniListProvider();

  try {
    const anime = await anilist.getDetails(id);
    if (!anime) return { title: "Anime Not Found | MUVIONT" };

    const title       = `${anime.title} — Watch Anime Online | MUVIONT`;
    const description = anime.overview?.substring(0, 160) || `Stream ${anime.title} in HD on MUVIONT.`;
    const keywords    = ["MUVIONT", "watch anime online", "streaming", anime.title, ...(anime.genres || [])];
    const image       = anime.backdropPath || anime.posterPath || "/logo.png";

    return {
      title,
      description,
      keywords,
      alternates: { canonical: `/anime/${id}` },
      openGraph: {
        title,
        description,
        url: `/anime/${id}`,
        type: "video.tv_show",
        images: [{ url: image, width: 1200, height: 630, alt: `${anime.title} backdrop` }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return { title: "Watch Anime | MUVIONT" };
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const anilist = new AniListProvider();

  let anime = await anilist.getDetails(id).catch(() => null);

  if (!anime) {
    anime = {
      id: id,
      title: "Anime Details",
      overview: "Stream all anime episodes online in HD on MUVIONT.",
      posterPath: "",
      backdropPath: "",
      mediaType: "anime",
      rating: 9.0,
      releaseDate: new Date().getFullYear().toString(),
      genres: ["Action", "Anime"],
      episodes: 12,
      status: "FINISHED"
    };
  }

  return <AnimeDetailClient anime={anime} />;
}
