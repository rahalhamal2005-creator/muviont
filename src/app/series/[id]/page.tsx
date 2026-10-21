import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";
import SeriesDetailClient from "@/components/cinematic/SeriesDetailClient";
import { isBlacklisted } from "@/lib/dmca-blacklist";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  if (isBlacklisted(id)) {
    return {
      title: "Content Unavailable — DMCA Notice | MUVIONT",
      robots: { index: false, follow: false },
    };
  }

  const tmdb = new TMDBProvider();

  try {
    const series = await tmdb.getDetails(id);
    if (!series) return { title: "Series Guide | MUVIONT" };

    const title       = `${series.title} — Cast, Episodes & Guide | MUVIONT`;
    const description = series.overview?.substring(0, 160) || `Explore ${series.title} cast, ratings, and episode overview on MUVIONT.`;
    const keywords    = ["MUVIONT", "series guide", "tv show", series.title, ...(series.genres || [])];
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
    return { title: "Series Guide | MUVIONT" };
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  // Handle DMCA takedown compliance
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

  const tmdb = new TMDBProvider();

  let [series, seasons, recommendations] = await Promise.all([
    tmdb.getDetails(id, "series").catch(() => null),
    tmdb.getSeriesSeasons(id).catch(() => []),
    tmdb.getRecommendations(id, "series").catch(() => []),
  ]);

  if (!series) {
    series = {
      id: id,
      title: "Series Details",
      overview: "Stream all episodes online in HD on MUVIONT.",
      posterPath: "",
      backdropPath: "",
      mediaType: "series",
      rating: 8.8,
      releaseDate: new Date().getFullYear().toString(),
      genres: ["Drama", "Series"]
    };
  }

  return (
    <SeriesDetailClient
      series={series}
      seasons={seasons}
      recommendations={recommendations}
    />
  );
}
