import type { Metadata } from "next";
import { Tv } from "lucide-react";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";
import CatalogClient from "@/components/cinematic/CatalogClient";

export const metadata: Metadata = {
  title: "TV Series Catalog — Browse All Series | MUVIONT",
  description: "Browse thousands of TV series by genre, year, and rating. Stream episodes in HD on MUVIONT.",
  openGraph: {
    title: "TV Series Catalog — MUVIONT",
    description: "Browse and stream thousands of TV series on MUVIONT.",
  },
};

export const revalidate = 1800;

export default async function SeriesPage() {
  const tmdb = new TMDBProvider();
  const [{ results, totalPages }, genres] = await Promise.all([
    tmdb.discover("series", { sortBy: "popularity.desc", page: 1 }).catch(() => ({ results: [], totalPages: 1 })),
    tmdb.getGenreList("series").catch(() => []),
  ]);

  return (
    <CatalogClient
      type="series"
      initialResults={results}
      initialGenres={genres}
      initialTotal={totalPages}
      title="TV Series"
      icon={<Tv className="w-6 h-6" />}
    />
  );
}
