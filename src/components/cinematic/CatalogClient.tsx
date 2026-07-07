"use client";

import { useState, useEffect, useCallback } from "react";
import { Film, SlidersHorizontal } from "lucide-react";
import Navbar from "@/components/cinematic/Navbar";
import BottomNav from "@/components/cinematic/BottomNav";
import AISearchInput from "@/components/cinematic/AISearchInput";
import MediaCard from "@/components/cinematic/MediaCard";
import { TMDBMedia } from "@/lib/providers/tmdb.provider";

interface Genre { id: number; name: string; }
interface CatalogClientProps {
  type: "movie" | "series";
  initialResults: TMDBMedia[];
  initialGenres: Genre[];
  initialTotal: number;
  title: string;
  icon: React.ReactNode;
}

const SORT_OPTIONS = [
  { value: "popularity.desc",    label: "Most Popular" },
  { value: "vote_average.desc",  label: "Top Rated" },
  { value: "release_date.desc",  label: "Newest" },
  { value: "release_date.asc",   label: "Oldest" },
];

export default function CatalogClient({
  type, initialResults, initialGenres, initialTotal, title, icon,
}: CatalogClientProps) {
  const [results,     setResults]     = useState<TMDBMedia[]>(initialResults);
  const [genres,      setGenres]      = useState<Genre[]>(initialGenres);
  const [totalPages,  setTotalPages]  = useState(initialTotal);
  const [page,        setPage]        = useState(1);
  const [genreId,     setGenreId]     = useState("");
  const [year,        setYear]        = useState("");
  const [sortBy,      setSortBy]      = useState("popularity.desc");
  const [loading,     setLoading]     = useState(false);
  const [showSearch,  setShowSearch]  = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loaderRef,   setLoaderRef]   = useState<HTMLDivElement | null>(null);

  const fetchResults = useCallback(async (p: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const url = new URL("/api/catalog", window.location.origin);
      url.searchParams.set("type", type);
      url.searchParams.set("page", String(p));
      url.searchParams.set("sort", sortBy);
      if (genreId) url.searchParams.set("genre", genreId);
      if (year)    url.searchParams.set("year",  year);

      const res  = await fetch(url.toString());
      const data = await res.json();
      
      if (append) {
        setResults(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = (data.results || []).filter((item: any) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      } else {
        setResults(data.results || []);
      }
      setTotalPages(data.totalPages || 1);
      if (data.genres?.length) setGenres(data.genres);
    } catch {
      // keep previous results
    } finally {
      setLoading(false);
    }
  }, [type, genreId, year, sortBy]);

  // Handle filter changes
  useEffect(() => {
    setPage(1);
    fetchResults(1, false);
  }, [genreId, year, sortBy, fetchResults]);

  // Handle page increment (infinite scroll)
  useEffect(() => {
    if (page === 1) return;
    fetchResults(page, true);
  }, [page, fetchResults]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (!loaderRef || page >= totalPages || loading) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage(p => p + 1);
      }
    }, { threshold: 0.25 });

    observer.observe(loaderRef);
    return () => observer.disconnect();
  }, [loaderRef, page, totalPages, loading]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 35 }, (_, i) => currentYear - i);

  return (
    <div className="bg-[var(--bg)] min-h-screen text-white">
      <Navbar onSearchClick={() => setShowSearch(true)} />
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      <div className="pt-[calc(var(--navbar-h)+24px)] pb-24 max-w-[1400px] mx-auto px-4 sm:px-6">

        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[var(--red)]">{icon}</span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Browse and stream {type === "movie" ? "movies" : "TV series"} by genre, year, and rating
            </p>
          </div>
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              filtersOpen
                ? "bg-[var(--red)]/15 border-[var(--red)]/30 text-[var(--red)]"
                : "bg-[var(--bg3)] border-[var(--border2)] text-[var(--text-muted)] hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Bar — CineVault pattern */}
        {filtersOpen && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--bg3)] border border-[var(--border2)] animate-in slide-in-from-top-2 duration-200">
            <div className="filter-bar">
              <select
                value={genreId}
                onChange={e => setGenreId(e.target.value)}
                className="filter-select"
              >
                <option value="">All Genres</option>
                {genres.map(g => (
                  <option key={g.id} value={String(g.id)}>{g.name}</option>
                ))}
              </select>

              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="filter-select"
              >
                <option value="">All Years</option>
                {years.map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="filter-select"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {(genreId || year || sortBy !== "popularity.desc") && (
                <button
                  onClick={() => { setGenreId(""); setYear(""); setSortBy("popularity.desc"); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--red)] border border-[var(--red)]/20 hover:bg-[var(--red)]/10 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="skeleton-base skeleton-card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {results.map(item => (
              <MediaCard
                key={item.id}
                id={item.id}
                title={item.title}
                posterPath={item.posterPath}
                rating={item.rating}
                type={type === "series" ? "series" : "movie"}
                releaseDate={item.releaseDate}
              />
            ))}
          </div>
        )}

        {results.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-[var(--text-muted)]">
            <Film className="w-12 h-12 opacity-30" />
            <p className="font-semibold">No results found</p>
            <button onClick={() => { setGenreId(""); setYear(""); setSortBy("popularity.desc"); }} className="text-[var(--red)] text-sm font-bold cursor-pointer">
              Reset filters
            </button>
          </div>
        )}

        {/* Loader ref for Infinite Scroll */}
        {page < totalPages && (
          <div
            ref={setLoaderRef}
            className="flex items-center justify-center py-10 mt-6"
          >
            {loading && (
              <div className="flex gap-2 flex-wrap justify-center max-w-[1400px]">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="w-[120px] sm:w-[150px] aspect-[2/3] rounded-xl skeleton-base" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
