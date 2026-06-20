import type { Metadata } from "next";
import { Film } from "lucide-react";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";
import CatalogClient from "@/components/cinematic/CatalogClient";

export const metadata: Metadata = {
  title: "Movies Catalog — Browse All Movies | MUVIONT",
  description: "Browse thousands of movies by genre, year, and rating. Stream in HD on MUVIONT.",
  openGraph: {
    title: "Movies Catalog — MUVIONT",
    description: "Browse and stream thousands of movies on MUVIONT.",
  },
};

export const revalidate = 1800;

export default async function MoviesPage() {
  const tmdb = new TMDBProvider();
  const [{ results, totalPages }, genres] = await Promise.all([
    tmdb.discover("movie", { sortBy: "popularity.desc", page: 1 }).catch(() => ({ results: [], totalPages: 1 })),
    tmdb.getGenreList("movie").catch(() => []),
  ]);

  return (
    <CatalogClient
      type="movie"
      initialResults={results}
      initialGenres={genres}
      initialTotal={totalPages}
      title="Movies"
      icon={<Film className="w-6 h-6" />}
    />
  );
}
