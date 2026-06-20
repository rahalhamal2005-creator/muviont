import { Metadata } from "next";
import { notFound } from "next/navigation";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";
import SeriesDetailClient from "@/components/cinematic/SeriesDetailClient";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const tmdb = new TMDBProvider();

  try {
    const series = await tmdb.getDetails(id);
    if (!series) return { title: "Series Not Found | MUVIONT" };

    const title       = `${series.title} — Watch Online Free | MUVIONT`;
    const description = series.overview?.substring(0, 160) || `Stream ${series.title} in HD on MUVIONT.`;
    const keywords    = ["MUVIONT", "watch series online", "streaming", series.title, ...(series.genres || [])];
    const image       = series.backdropPath || series.posterPath || "/logo.png";

    return {
      title,
      description,
      keywords,
      alternates: { canonical: `/series/${id}` },
      openGraph: {
        title,
        description,
        url: `/series/${id}`,
        type: "video.tv_show",
        images: [{ url: image, width: 1200, height: 630, alt: `${series.title} backdrop` }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return { title: "Watch Series | MUVIONT" };
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const tmdb   = new TMDBProvider();

  const [series, seasons, recommendations] = await Promise.all([
    tmdb.getDetails(id).catch(() => null),
    tmdb.getSeriesSeasons(id).catch(() => []),
    tmdb.getRecommendations(id).catch(() => []),
  ]);

  if (!series) return notFound();

  return (
    <SeriesDetailClient
      series={series}
      seasons={seasons}
      recommendations={recommendations}
    />
  );
}
