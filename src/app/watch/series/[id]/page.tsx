import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TMDBProvider, TMDBSeason, TMDBMedia } from "@/lib/providers/tmdb.provider";
import WatchSeriesClient from "@/components/cinematic/WatchSeriesClient";

interface WatchSeriesPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ s?: string; e?: string }>;
}

export async function generateMetadata({ params }: WatchSeriesPageProps): Promise<Metadata> {
  const { id } = await params;
  const tmdb = new TMDBProvider();
  try {
    const series = await tmdb.getDetails(id);
    if (!series) return { title: "Watch Series — MUVIONT" };
    return {
      title: `Watch ${series.title} — MUVIONT`,
      description: `Stream ${series.title} all episodes online in HD on MUVIONT.`,
      openGraph: {
        title: `Watch ${series.title} — MUVIONT`,
        images: series.backdropPath ? [{ url: series.backdropPath }] : [],
      },
    };
  } catch {
    return { title: "Watch Series — MUVIONT" };
  }
}

export default async function WatchSeriesPage({ params, searchParams }: WatchSeriesPageProps) {
  const { id }     = await params;
  const { s, e }   = await searchParams;
  const season     = parseInt(s || "1", 10);
  const episode    = parseInt(e || "1", 10);
  const rawId      = id.startsWith("s-") || id.startsWith("m-") ? id.substring(2) : id;
  const tmdb       = new TMDBProvider();
  let series = null;
  let seasons: TMDBSeason[] = [];
  let recommendations: TMDBMedia[] = [];

  try {
    const [seriesData, seasonsData, recsData] = await Promise.all([
      tmdb.getDetails(rawId).catch(() => null),
      tmdb.getSeriesSeasons(rawId).catch(() => []),
      tmdb.getRecommendations(rawId).catch(() => []),
    ]);
    series = seriesData;
    seasons = seasonsData;
    recommendations = recsData;
  } catch {
    series = null;
  }

  if (!series) {
    series = {
      id: id,
      title: "Series Stream",
      overview: "Watch full series episodes online in HD on MUVIONT.",
      posterPath: "",
      backdropPath: "",
      mediaType: "series",
      rating: 8.8,
      releaseDate: new Date().getFullYear().toString(),
      genres: ["Drama", "Series"]
    };
  }

  return (
    <WatchSeriesClient
      series={series}
      seasons={seasons}
      recommendations={recommendations}
      initialSeason={season}
      initialEpisode={episode}
    />
  );
}
