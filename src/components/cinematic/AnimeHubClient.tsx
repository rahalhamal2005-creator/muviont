"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Calendar, Tv, Flame, Play, SlidersHorizontal, Film } from "lucide-react";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import MediaCard from "./MediaCard";
import AISearchInput from "./AISearchInput";
import TrailerModal from "./TrailerModal";
import { AniListMedia } from "@/lib/providers/anilist.provider";

interface AnimeHubClientProps {
  trendingAnime: AniListMedia[];
  popularAiring: AniListMedia[];
  airingSchedule: AniListMedia[];
}

const ANIME_GENRES = [
  { id: 1, name: "Action" },
  { id: 2, name: "Adventure" },
  { id: 3, name: "Comedy" },
  { id: 4, name: "Drama" },
  { id: 5, name: "Fantasy" },
  { id: 6, name: "Horror" },
  { id: 7, name: "Mystery" },
  { id: 8, name: "Psychological" },
  { id: 9, name: "Romance" },
  { id: 10, name: "Sci-Fi" },
  { id: 11, name: "Slice of Life" },
  { id: 12, name: "Sports" },
  { id: 13, name: "Supernatural" },
  { id: 14, name: "Thriller" }
];

const SORT_OPTIONS = [
  { value: "popularity.desc",    label: "Most Popular" },
  { value: "vote_average.desc",  label: "Top Rated" },
  { value: "release_date.desc",  label: "Newest" },
  { value: "release_date.asc",   label: "Oldest" },
];

export default function AnimeHubClient({
  trendingAnime,
  popularAiring,
  airingSchedule
}: AnimeHubClientProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [trailerVideoId, setTrailerVideoId] = useState<string | null>(null);

  // Weekly Schedule Filtering
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay()); // 0 = Sun, 1 = Mon ...
  const [filteredSchedule, setFilteredSchedule] = useState<AniListMedia[]>([]);

  const days = [
    { label: "Sun", value: 0 },
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 }
  ];

  // Catalog Section State
  const [results, setResults] = useState<AniListMedia[]>(trendingAnime);
  const [totalPages, setTotalPages] = useState(5);
  const [page, setPage] = useState(1);
  const [genreId, setGenreId] = useState("");
  const [year, setYear] = useState("");
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loaderRef, setLoaderRef] = useState<HTMLDivElement | null>(null);

  const fetchResults = useCallback(async (p: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const url = new URL("/api/catalog", window.location.origin);
      url.searchParams.set("type", "anime");
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
    } catch (e) {
      console.error("Failed to fetch anime catalog results:", e);
    } finally {
      setLoading(false);
    }
  }, [genreId, year, sortBy]);

  // Triggered when filters change
  useEffect(() => {
    setPage(1);
    fetchResults(1, false);
  }, [genreId, year, sortBy, fetchResults]);

  // Triggered when page increments
  useEffect(() => {
    if (page === 1) return;
    fetchResults(page, true);
  }, [page, fetchResults]);

  // Airing schedule filter
  useEffect(() => {
    const filtered = airingSchedule.filter((item) => {
      if (!item.nextAiringEpisode) return false;
      const date = new Date(item.nextAiringEpisode.airingAt * 1000);
      return date.getDay() === selectedDay;
    });
    setFilteredSchedule(filtered);
  }, [selectedDay, airingSchedule]);

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

  const handlePlayTrailer = (videoId: string) => {
    setTrailerVideoId(videoId);
  };

  const featured = trendingAnime[0] || popularAiring[0];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 35 }, (_, i) => currentYear - i);

  return (
    <div className="bg-[var(--bg)] min-h-screen text-white pb-24">
      <Navbar onSearchClick={() => setShowSearch(true)} />

      {/* Floating search layer */}
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      {/* Featured Anime Banner */}
      {featured && (
        <div className="relative w-full h-[60vh] sm:h-[70vh] bg-black overflow-hidden select-none">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${featured.backdropPath})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/30 to-[var(--bg)]/50 z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/30 to-transparent z-10" />

          {/* Featured Content Details */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end pb-12 max-w-[1400px] mx-auto px-4 sm:px-6 pointer-events-none">
            <div className="max-w-2xl pointer-events-auto">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--red)] bg-[var(--red)]/10 border border-[var(--red)]/20 rounded-full mb-3 inline-block">
                Featured Anime
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-2 font-sans tracking-tight">
                {featured.title}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-6 max-w-xl line-clamp-3">
                {featured.overview}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePlayTrailer(featured.trailerUrl ? featured.trailerUrl.split("v=")[1] : "KzZz1gP1z2I")}
                  disabled={!featured.trailerUrl}
                  className="flex items-center gap-2 px-6 py-3 bg-[var(--red)] text-white font-bold rounded-full hover:bg-[var(--red-hover)] active:scale-95 transition-all duration-300 disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Watch Trailer
                </button>
                <Link
                  href={`/anime/${featured.id}`}
                  className="px-5 py-3 bg-neutral-900/80 text-white border border-neutral-800 font-bold rounded-full hover:bg-neutral-800 transition-all duration-300"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content hub */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 space-y-16 -mt-6 relative z-30">
        
        {/* Weekly Airing Calendar Schedule Block */}
        <section className="p-6 rounded-xl border border-[var(--border2)] bg-[var(--bg2)]/60 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--red)] flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Airing Schedule
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">Weekly release calendar parsed dynamically from AniList</p>
            </div>
            
            {/* Days Tab selector */}
            <div className="flex flex-wrap gap-1 bg-[var(--bg3)] p-1 rounded-lg border border-[var(--border2)] self-start">
              {days.map((day) => (
                <button
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    selectedDay === day.value
                      ? "bg-[var(--red)] text-white shadow-md"
                      : "text-[var(--text-muted)] hover:text-white"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule list grid */}
          {filteredSchedule.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {filteredSchedule.map((item) => (
                <div key={item.id} className="relative group">
                  <MediaCard
                    id={item.id}
                    title={item.title}
                    posterPath={item.posterPath}
                    rating={item.rating}
                    type="anime"
                    releaseDate={item.releaseDate}
                  />
                  {item.nextAiringEpisode && (
                    <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-[var(--red)]/90 text-[9px] font-bold text-white border border-[var(--red)]/30">
                      Ep {item.nextAiringEpisode.episode} Airing
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Tv className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs text-neutral-500 font-semibold">No episodes airing on this day</p>
            </div>
          )}
        </section>

        {/* Browse Anime Catalog Section (Replacing static rails) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border2)] pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Flame className="w-6 h-6 text-[var(--red)] animate-pulse" />
                Browse Anime Catalog
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Filter and sort through hundreds of anime series from AniList
              </p>
            </div>
            <button
              onClick={() => setFiltersOpen(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                filtersOpen
                  ? "bg-[var(--red)]/15 border-[var(--red)]/30 text-[var(--red)]"
                  : "bg-[var(--bg3)] border-[var(--border2)] text-[var(--text-muted)] hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filter Bar */}
          {filtersOpen && (
            <div className="p-4 rounded-xl bg-[var(--bg3)] border border-[var(--border2)] animate-in slide-in-from-top-2 duration-200">
              <div className="filter-bar">
                <select
                  value={genreId}
                  onChange={e => setGenreId(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Genres</option>
                  {ANIME_GENRES.map(g => (
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

          {/* Results Grid */}
          {loading && results.length === 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {Array.from({ length: 14 }).map((_, i) => (
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
                  type="anime"
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

          {/* Infinite Scroll Loader Trigger */}
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
        </section>

      </main>

      {/* Dynamic Trailer Player modal */}
      <TrailerModal
        videoId={trailerVideoId || ""}
        isOpen={!!trailerVideoId}
        onClose={() => setTrailerVideoId(null)}
      />

      <BottomNav />
    </div>
  );
}
