import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { TMDBProvider, TMDBMedia } from "@/lib/providers/tmdb.provider";
import WatchMovieClient from "@/components/cinematic/WatchMovieClient";
import { isBlacklisted } from "@/lib/dmca-blacklist";

interface WatchMoviePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WatchMoviePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Watch Movie — MUVIONT",
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

export default async function WatchMoviePage({ params }: WatchMoviePageProps) {
  const { id } = await params;

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

  const tmdb = new TMDBProvider();
  let movie = null;
  let recommendations: TMDBMedia[] = [];

  try {
    const [movieData, recsData] = await Promise.all([
      tmdb.getDetails(id, "movie").catch(() => null),
      tmdb.getRecommendations(id, "movie").catch(() => []),
    ]);
    movie = movieData;
    recommendations = recsData;
  } catch {
    movie = null;
  }

  if (!movie) {
    movie = {
      id: id,
      title: "Movie Stream",
      overview: "Watch full movie online in HD on MUVIONT.",
      posterPath: "",
      backdropPath: "",
      mediaType: "movie",
      rating: 8.5,
      genres: ["Action", "Cinema"]
    };
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": movie.title,
    "description": movie.overview,
    "image": movie.posterPath || movie.backdropPath,
    "dateCreated": movie.releaseDate,
    "potentialAction": {
      "@type": "WatchAction",
      "target": `https://muviont.com/watch/movie/${encodeURIComponent(movie.id)}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WatchMovieClient movie={movie} recommendations={recommendations} />
    </>
  );
}
