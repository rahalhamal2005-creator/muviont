"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/cinematic/Navbar";
import MediaCard from "@/components/cinematic/MediaCard";
import AISearchInput from "@/components/cinematic/AISearchInput";
import { Heart, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    // Load watchlist from local storage
    const list = JSON.parse(localStorage.getItem("muviont_watchlist") || "[]");
    setWatchlist(list);
  }, []);

  return (
    <div className="bg-black min-h-screen text-white pb-20">
      <Navbar onSearchClick={() => setShowSearch(true)} />

      {/* Floating search layer */}
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      <main className="max-w-7xl mx-auto px-6 pt-28">
        {/* Title Heading */}
        <div className="mb-8 border-b border-neutral-900 pb-4">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500 fill-current" />
            My Watchlist
          </h1>
          <p className="text-xs text-neutral-400 mt-2">Manage your saved movies, TV shows, and anime series.</p>
        </div>

        {watchlist.length > 0 ? (
          /* Cards Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {watchlist.map((item) => (
              <MediaCard
                key={item.id}
                id={item.id}
                title={item.title}
                posterPath={item.posterPath}
                rating={item.rating}
                type={item.type}
                releaseDate={item.releaseDate}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20 max-w-md mx-auto">
            <HelpCircle className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-neutral-300">Your Watchlist is Empty</h2>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Find your next favorite film, series, or anime using the search button above and click "Add to Watchlist" on their details page.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => setShowSearch(true)}
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-750 text-xs font-bold transition-all duration-200"
              >
                Search AI Hub
              </button>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-full bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-xs font-bold transition-all duration-200"
              >
                Go to Home
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
