"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MediaCard from "./MediaCard";
import { AIIntent } from "@/lib/ai";

interface AISearchInputProps {
  onClose: () => void;
}

export default function AISearchInput({ onClose }: AISearchInputProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isAI, setIsAI] = useState(false);
  const [aiIntent, setAiIntent] = useState<AIIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus search box on load
    inputRef.current?.focus();
    // Disable body scroll when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
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
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query);
    }
  };

  const suggestions = [
    "anime like Solo Leveling",
    "movies similar to Interstellar",
    "dark mystery series",
    "best sci-fi movies",
    " বুধবার"
  ];

  const handleSuggestionClick = (sug: string) => {
    setQuery(sug);
    handleSearch(sug);
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
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-red-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            AI Smart Search Engine
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-white/80 hover:bg-neutral-800 hover:text-white transition-all duration-200"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Input Container */}
        <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
          <div className="relative w-full rounded-full border border-neutral-800 bg-neutral-950 p-2 shadow-[0_0_30px_rgba(255,0,0,0.1)] focus-within:shadow-[0_0_30px_rgba(255,0,0,0.25)] focus-within:border-red-600/50 transition-all duration-300 flex items-center">
            <Search className="w-6 h-6 text-neutral-500 ml-4" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask MUVIONT AI (e.g. 'dark mystery series' or 'anime like Solo Leveling')..."
              className="w-full bg-transparent border-0 outline-none text-white text-base sm:text-lg px-4 py-3 placeholder-neutral-500"
            />
            <button
              onClick={() => handleSearch(query)}
              disabled={loading || !query.trim()}
              className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-red-600 flex items-center gap-1 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,0,0,0.2)]"
            >
              Search
            </button>
          </div>

          {/* Prompt Suggestions */}
          {!query && results.length === 0 && (
            <div className="w-full mt-6 text-center">
              <p className="text-xs text-neutral-500 mb-3">Or try these conversational prompts:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    onClick={() => handleSuggestionClick(sug)}
                    className="px-4 py-2 rounded-full border border-neutral-800 bg-neutral-900/40 text-neutral-300 text-xs hover:border-red-600/40 hover:text-red-500 hover:bg-neutral-900 transition-all duration-200"
                  >
                    "{sug}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loader status */}
          {loading && (
            <div className="flex flex-col items-center justify-center mt-20 gap-3">
              <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
              <p className="text-sm text-neutral-400">Muviont AI is parsing query and indexing catalogs...</p>
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
                  {/* Decorative glowing gradient */}
                  <div className="absolute -top-12 -left-12 w-24 h-24 bg-red-600/10 rounded-full blur-2xl" />
                  
                  <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-widest mb-2">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
          {!loading && !error && query && results.length === 0 && (
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
