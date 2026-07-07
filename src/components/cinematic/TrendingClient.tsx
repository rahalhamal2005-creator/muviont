"use client";

import { useState, useEffect, useCallback } from "react";
import { Flame, Film, Tv, Star, Sliders, TrendingUp } from "lucide-react";
import Navbar from "@/components/cinematic/Navbar";
import BottomNav from "@/components/cinematic/BottomNav";
import AISearchInput from "@/components/cinematic/AISearchInput";
import MediaCard from "@/components/cinematic/MediaCard";

interface TrendingClientProps {
  initialMovies: any[];
  initialSeries: any[];
  initialAnime: any[];
}

const TABS = [
  { id: "movies-today",    label: "Movies Today",     type: "movie",  sort: "popularity.desc" },
  { id: "series-today",    label: "Series Today",     type: "series", sort: "popularity.desc" },
  { id: "anime-today",     label: "Anime Today",      type: "anime",  sort: "popularity.desc" },
  { id: "watched-week",    label: "Watched This Week",type: "movie",  sort: "popularity.desc" }, // fall back to popular movies
  { id: "top-rated",       label: "Top Rated",        type: "movie",  sort: "vote_average.desc" },
  { id: "new-releases",    label: "New Releases",     type: "movie",  sort: "release_date.desc" },
];

export default function TrendingClient({
  initialMovies,
  initialSeries,
  initialAnime
}: TrendingClientProps) {
  const [activeTab, setActiveTab] = useState("movies-today");
  const [results, setResults] = useState<any[]>(initialMovies);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loaderRef, setLoaderRef] = useState<HTMLDivElement | null>(null);

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];

  const fetchResults = useCallback(async (p: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const url = new URL("/api/catalog", window.location.origin);
      url.searchParams.set("type", currentTab.type);
      url.searchParams.set("sort", currentTab.sort);
      url.searchParams.set("page", String(p));
      
      const res = await fetch(url.toString());
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
      console.error("Failed to fetch trending catalog:", e);
    } finally {
      setLoading(false);
    }
  }, [currentTab]);

  // When tab changes, load initial or fetch new
  useEffect(() => {
    setPage(1);
    if (activeTab === "movies-today") {
      setResults(initialMovies);
      setTotalPages(5);
    } else if (activeTab === "series-today") {
      setResults(initialSeries);
      setTotalPages(5);
    } else if (activeTab === "anime-today") {
      setResults(initialAnime);
      setTotalPages(5);
    } else {
      fetchResults(1, false);
    }
  }, [activeTab, initialMovies, initialSeries, initialAnime, fetchResults]);

  // When page increments
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

  const getTabIcon = (id: string) => {
    switch (id) {
      case "movies-today": return <Film className="w-3.5 h-3.5" />;
      case "series-today": return <Tv className="w-3.5 h-3.5" />;
      case "anime-today": return <Star className="w-3.5 h-3.5" />;
      case "watched-week": return <TrendingUp className="w-3.5 h-3.5" />;
      case "top-rated": return <Star className="w-3.5 h-3.5 text-[var(--gold)]" fill="currentColor" />;
      default: return <Flame className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen text-white pb-24">
      <Navbar onSearchClick={() => setShowSearch(true)} />
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      <div className="pt-[calc(var(--navbar-h)+24px)] max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[var(--red)]"><Flame className="w-6 h-6 animate-pulse" /></span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Trending Platform Hits</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Explore now playing, most watched, top rated, and new releases updated live
          </p>
        </div>

        {/* Cinematic Tab selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6 border-b border-[var(--border2)]" style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 cursor-pointer flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-[var(--red)] border-[var(--red)] text-white shadow-[0_0_16px_var(--red-glow)]"
                  : "bg-[var(--bg3)] border-[var(--border2)] text-[var(--text-muted)] hover:text-white"
              }`}
            >
              {getTabIcon(tab.id)}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {results.map(item => (
            <MediaCard
              key={item.id}
              id={item.id}
              title={item.title}
              posterPath={item.posterPath}
              rating={item.rating}
              type={item.type === "series" ? "series" : item.type === "anime" ? "anime" : "movie"}
              releaseDate={item.releaseDate}
            />
          ))}
          {loading && results.length === 0 && Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="skeleton-base skeleton-card" />
          ))}
        </div>

        {results.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-[var(--text-muted)]">
            <Sliders className="w-12 h-12 opacity-30" />
            <p className="font-semibold">No trending items loaded</p>
            <button onClick={() => fetchResults(1, false)} className="text-[var(--red)] text-sm font-bold cursor-pointer">
              Retry Load
            </button>
          </div>
        )}

        {/* Infinite Scroll Trigger */}
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
