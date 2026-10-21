import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import MovieDetailClient from "@/components/cinematic/MovieDetailClient";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";
import { isBlacklisted } from "@/lib/dmca-blacklist";

export const revalidate = 3600; // Cache details for 1 hour

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
    const movie = await tmdb.getDetails(id);
    if (!movie) {
      return {
        title: "Movie Guide | MUVIONT",
        description: "Explore movies and cinematic guides on MUVIONT."
      };
    }

    const title = `${movie.title} — Overview & Guide | MUVIONT`;
    const description = movie.overview || `Explore cast, ratings, and synopsis for ${movie.title} on MUVIONT.`;
    const keywords = ["Muviont", "movie guide", "film discovery", movie.title, ...(movie.genres || [])];
    const canonical = `/movie/${id}`;
    const image = movie.backdropPath || movie.posterPath || "/logo.png";

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
        type: "video.movie",
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: `${movie.title} Backdrop`
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
    return {
      title: "Movie Guide | MUVIONT",
      description: "Explore movies on MUVIONT."
    };
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

  // Fetch details and recommendations in parallel
  let [movie, recommendations] = await Promise.all([
    tmdb.getDetails(id, "movie").catch(() => null),
    tmdb.getRecommendations(id, "movie").catch(() => [])
  ]);

  if (!movie) {
    movie = {
      id: id,
      title: "Movie Details",
      overview: "Watch full movie online in HD quality on MUVIONT.",
      posterPath: "",
      backdropPath: "",
      mediaType: "movie",
      rating: 8.5,
      releaseDate: new Date().getFullYear().toString(),
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
    "aggregateRating": movie.rating ? {
      "@type": "AggregateRating",
      "ratingValue": movie.rating,
      "bestRating": "10",
      "worstRating": "1",
      "ratingCount": 150
    } : undefined
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MovieDetailClient 
        movie={movie} 
        recommendations={recommendations} 
      />
    </>
  );
}
