import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { TMDBProvider, TMDBSeason, TMDBMedia } from "@/lib/providers/tmdb.provider";
import WatchSeriesClient from "@/components/cinematic/WatchSeriesClient";
import { isBlacklisted } from "@/lib/dmca-blacklist";

interface WatchSeriesPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ s?: string; e?: string }>;
}

export async function generateMetadata({ params }: WatchSeriesPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Watch Series — MUVIONT",
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

export default async function WatchSeriesPage({ params, searchParams }: WatchSeriesPageProps) {
  const { id }     = await params;
  const { s, e }   = await searchParams;

  // Check if content is disabled due to DMCA takedown
  const blacklisted = isBlacklisted(id);
  if (blacklisted) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-neutral-900/80 border border-red-500/30 rounded-2xl p-8 backdrop-blur-xl space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-lg font-black uppercase tracking-wider text-white">
            Content Unavailable (DMCA Notice)
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Access to <span className="text-white font-bold">{blacklisted.title}</span> has been permanently disabled in compliance with a Digital Millennium Copyright Act (DMCA) 512(c) notice submitted by the copyright owner.
          </p>
          <div className="text-[10px] text-neutral-500 border-t border-neutral-800 pt-3">
            Takedown Reference: {blacklisted.claimant}
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all text-white mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Catalog
          </Link>
        </div>
      </div>
    );
  }
  const season     = parseInt(s || "1", 10);
  const episode    = parseInt(e || "1", 10);
  const tmdb       = new TMDBProvider();
  let series = null;
  let seasons: TMDBSeason[] = [];
  let recommendations: TMDBMedia[] = [];

  try {
    const [seriesData, seasonsData, recsData] = await Promise.all([
      tmdb.getDetails(id, "series").catch(() => null),
      tmdb.getSeriesSeasons(id).catch(() => []),
      tmdb.getRecommendations(id, "series").catch(() => []),
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
