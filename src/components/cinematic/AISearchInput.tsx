"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, Sparkles, AlertCircle, RefreshCw, Clock, Flame, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MediaCard from "./MediaCard";
import { AIIntent } from "@/lib/ai";

interface AISearchInputProps {
  onClose: () => void;
}

const TRENDING_SEARCHES = [
  "One Piece",
  "Solo Leveling",
  "Naruto Shippuden",
  "Bleach",
  "Solo Leveling Season 2"
];

const POPULAR_SEARCHES = [
  "Interstellar",
  "Dune",
  "Wednesday",
  "Stranger Things",
  "Avatar"
];

export default function AISearchInput({ onClose }: AISearchInputProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isAI, setIsAI] = useState(false);
  const [aiIntent, setAiIntent] = useState<AIIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (searchQuery: string, saveToRecent = true) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setIsAI(false);
    setAiIntent(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a minute.");
        }
        throw new Error("Failed to load search results.");
      }
      const data = await res.json();
      
      setResults(data.results || []);
      setIsAI(!!data.isAI);
      setAiIntent(data.intent || null);

      // Save to recent searches if search was successful
      if (saveToRecent && data.results?.length > 0) {
        setRecentSearches(prev => {
          const filtered = prev.filter(s => s.toLowerCase() !== searchQuery.toLowerCase());
          const updated = [searchQuery, ...filtered].slice(0, 5);
          localStorage.setItem("muviont_recent_searches", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Focus and local history check on mount
  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    
    // Load recent searches
    const saved = JSON.parse(localStorage.getItem("muviont_recent_searches") || "[]");
    setRecentSearches(saved);

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Debouncing effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);

    return () => clearTimeout(handler);
  }, [query]);

  // Execute Search automatically on debounced query change
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      handleSearch(debouncedQuery, false);
    } else if (debouncedQuery.trim().length === 0) {
      setResults([]);
      setError(null);
    }
  }, [debouncedQuery, handleSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query, true);
    }
  };

  const handleSuggestionClick = (sug: string) => {
    setQuery(sug);
    handleSearch(sug, true);
  };

  const clearRecent = () => {
    localStorage.removeItem("muviont_recent_searches");
    setRecentSearches([]);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl p-6 overflow-y-auto"
      >
        {/* Header Control */}
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--red)] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 animate-pulse" />
            AI Smart Search Engine
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-white/80 hover:bg-neutral-850 hover:text-white transition-all duration-200 cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
          <div className="relative w-full rounded-full border border-neutral-800 bg-neutral-950 p-2 shadow-[0_0_30px_rgba(255,0,0,0.1)] focus-within:shadow-[0_0_30px_rgba(255,0,0,0.25)] focus-within:border-[var(--red)]/50 transition-all duration-300 flex items-center">
            <Search className="w-6 h-6 text-neutral-500 ml-4" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask MUVIONT AI or type a title (e.g. 'anime like Solo Leveling' or 'One Piece')..."
              className="w-full bg-transparent border-0 outline-none text-white text-base sm:text-lg px-4 py-3 placeholder-neutral-500"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-850 transition-colors mr-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleSearch(query, true)}
              disabled={loading || !query.trim()}
              className="px-6 py-3 rounded-full bg-[var(--red)] hover:bg-[var(--red-hover)] text-white font-bold transition-all duration-300 disabled:opacity-50 flex items-center gap-1 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,0,0,0.2)] cursor-pointer"
            >
              Search
            </button>
          </div>

          {/* Autocomplete Suggestions Box (when query is short or empty) */}
          {!query && results.length === 0 && (
            <div className="w-full max-w-3xl mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Recent Searches */}
              <div>
                <div className="flex items-center justify-between mb-3 text-neutral-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Recent Searches
                  </span>
                  {recentSearches.length > 0 && (
                    <button onClick={clearRecent} className="text-[9px] font-extrabold uppercase text-[var(--red)] hover:underline cursor-pointer">
                      Clear
                    </button>
                  )}
                </div>
                {recentSearches.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {recentSearches.map(term => (
                      <button
                        key={term}
                        onClick={() => handleSuggestionClick(term)}
                        className="text-left py-2 px-3 rounded-lg hover:bg-neutral-900/60 text-xs font-semibold text-neutral-300 hover:text-white transition-colors duration-150 flex items-center gap-2 cursor-pointer"
                      >
                        <Clock className="w-3 h-3 opacity-55" />
                        {term}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-600 italic py-2">No recent search logs</p>
                )}
              </div>

              {/* Trending Searches */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-[var(--red)] animate-pulse" />
                  Trending Searches
                </span>
                <div className="flex flex-col gap-1">
                  {TRENDING_SEARCHES.map(term => (
                    <button
                      key={term}
                      onClick={() => handleSuggestionClick(term)}
                      className="text-left py-2 px-3 rounded-lg hover:bg-neutral-900/60 text-xs font-semibold text-neutral-300 hover:text-white transition-colors duration-150 flex items-center gap-2 cursor-pointer"
                    >
                      <Flame className="w-3 h-3 text-[var(--red)]" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Searches */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1">
                  <Film className="w-3.5 h-3.5" />
                  Popular Suggestions
                </span>
                <div className="flex flex-col gap-1">
                  {POPULAR_SEARCHES.map(term => (
                    <button
                      key={term}
                      onClick={() => handleSuggestionClick(term)}
                      className="text-left py-2 px-3 rounded-lg hover:bg-neutral-900/60 text-xs font-semibold text-neutral-300 hover:text-white transition-colors duration-150 flex items-center gap-2 cursor-pointer"
                    >
                      <Search className="w-3 h-3 opacity-55" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loader status */}
          {loading && (
            <div className="flex flex-col items-center justify-center mt-20 gap-3">
              <RefreshCw className="w-8 h-8 text-[var(--red)] animate-spin" />
              <p className="text-sm text-neutral-400">Searching catalogs...</p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="w-full max-w-md mt-10 p-4 rounded-lg bg-red-950/20 border border-red-800/40 flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Search Result Grid */}
          {!loading && results.length > 0 && (
            <div className="w-full mt-10">
              {/* AI intent/reasoning block if search was AI routed */}
              {isAI && aiIntent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-6 rounded-xl border border-neutral-800 bg-neutral-900/30 backdrop-blur-md relative overflow-hidden"
                >
                  <div className="absolute -top-12 -left-12 w-24 h-24 bg-red-600/10 rounded-full blur-2xl" />
                  
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--red)] uppercase tracking-widest mb-2">
                    <Sparkles className="w-4 h-4" />
                    AI Reasoning
                  </div>
                  <p className="text-sm text-neutral-200 leading-relaxed font-medium">
                    {aiIntent.reasoning}
                  </p>
                  
                  {aiIntent.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {aiIntent.genres.map((g) => (
                        <span key={g} className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-[10px] text-neutral-400 border border-neutral-700">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Title Result Count */}
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-6">
                Found {results.length} results matching search parameters
              </h2>

              {/* Cards Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 animate-in fade-in duration-200">
                {results.map((item) => (
                  <MediaCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    posterPath={item.posterPath}
                    rating={item.rating}
                    type={item.type || (item.id.startsWith("a-") ? "anime" : "movie")}
                    releaseDate={item.releaseDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty search results state */}
          {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
            <div className="text-center mt-20">
              <p className="text-base font-bold text-neutral-400">No titles match your query</p>
              <p className="text-xs text-neutral-600 mt-2">Try searching using keywords, genres, or actors.</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
