import { Metadata } from "next";
import { notFound } from "next/navigation";
import AnimeDetailClient from "@/components/cinematic/AnimeDetailClient";
import { AniListProvider } from "@/lib/providers/anilist.provider";

export const revalidate = 21600; // Cache details for 6 hours

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const anilist = new AniListProvider();
  
  try {
    const anime = await anilist.getDetails(id);
    if (!anime) {
      return {
        title: "Anime Not Found | MUVIONT",
        description: "The requested anime could not be found."
      };
    }

    const title = `${anime.title} | MUVIONT`;
    const description = anime.overview || `Watch ${anime.title} on MUVIONT's premium anime catalog.`;
    const keywords = ["Muviont", "streaming", "anime", anime.title, ...(anime.genres || [])];
    const canonical = `/anime/${id}`;
    const image = anime.backdropPath || anime.posterPath || "/logo.png";

    return {
      title,
      description,
      keywords,
      alternates: {
        canonical
      },
      openGraph: {
        title,
        description,
        url: canonical,
        type: "website",
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: `${anime.title} Backdrop`
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image]
      }
    };
  } catch (err: any) {
    console.error(`Metadata generation failed for anime ${id}:`, err.message);
    return {
      title: "Watch Anime | MUVIONT",
      description: "Experience premium visual streaming on MUVIONT."
    };
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const anilist = new AniListProvider();

  const anime = await anilist.getDetails(id).catch(err => { console.error(`Anime details fetch failed for ${id}:`, err.message); return null; });

  if (!anime) {
    return notFound();
  }

  return (
    <AnimeDetailClient anime={anime} />
  );
}
