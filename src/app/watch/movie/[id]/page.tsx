import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TMDBProvider, TMDBMedia } from "@/lib/providers/tmdb.provider";
import WatchMovieClient from "@/components/cinematic/WatchMovieClient";

interface WatchMoviePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WatchMoviePageProps): Promise<Metadata> {
  const { id } = await params;
  const tmdb = new TMDBProvider();
  try {
    const movie = await tmdb.getDetails(id);
    if (!movie) return { title: "Watch Movie — MUVIONT" };
    return {
      title: `Watch ${movie.title} — MUVIONT`,
      description: `Watch ${movie.title} online in HD on MUVIONT.`,
      openGraph: {
        title: `Watch ${movie.title} — MUVIONT`,
        description: `Watch ${movie.title} online in HD quality.`,
        images: movie.backdropPath ? [{ url: movie.backdropPath }] : [],
      },
    };
  } catch {
    return { title: "Watch Movie — MUVIONT" };
  }
}

export default async function WatchMoviePage({ params }: WatchMoviePageProps) {
  const { id } = await params;
  const rawId = id.startsWith("m-") || id.startsWith("s-") ? id.substring(2) : id;
  const tmdb = new TMDBProvider();
  let movie = null;
  let recommendations: TMDBMedia[] = [];

  try {
    const [movieData, recsData] = await Promise.all([
      tmdb.getDetails(rawId).catch(() => null),
      tmdb.getRecommendations(rawId).catch(() => []),
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
      releaseDate: new Date().getFullYear().toString(),
      genres: ["Action", "Cinema"]
    };
  }

  return <WatchMovieClient movie={movie} recommendations={recommendations} />;
}
