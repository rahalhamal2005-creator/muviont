"use client";

import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import IntroOverlay from "./IntroOverlay";
import HeroSlider from "./HeroSlider";
import MediaCard from "./MediaCard";
import NewsCard from "./NewsCard";
import AISearchInput from "./AISearchInput";
import TrailerModal from "./TrailerModal";
import { TMDBMedia } from "@/lib/providers/tmdb.provider";
import { AniListMedia } from "@/lib/providers/anilist.provider";
import { NormalizedArticle } from "@/lib/news/news.types";
import { Sparkles, Play, BookOpen, Clock, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface HomeClientProps {
  trendingMovies: TMDBMedia[];
  trendingSeries: TMDBMedia[];
  trendingAnime: AniListMedia[];
  newsArticles: NormalizedArticle[];
}

export default function HomeClient({
  trendingMovies,
  trendingSeries,
  trendingAnime,
  newsArticles
}: HomeClientProps) {
  const [introCompleted, setIntroCompleted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [trailerVideoId, setTrailerVideoId] = useState<string | null>(null);
  
  // Personalization states
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [aiRecs, setAiRecs] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [lastWatchedTitle, setLastWatchedTitle] = useState<string | null>(null);

  useEffect(() => {
    // Check if intro has already been seen to skip layout offsets
    const seen = localStorage.getItem("muviont_intro_seen");
    if (seen === "true") {
      setIntroCompleted(true);
    }

    // Load personalization arrays from localStorage
    const savedWatchlist = JSON.parse(localStorage.getItem("muviont_watchlist") || "[]");
    const savedHistory = JSON.parse(localStorage.getItem("muviont_history") || "[]");

    // Default seed data for watchlist and history if user is on first load (to ensure beautiful layout)
    let finalWatchlist = savedWatchlist;
    if (savedWatchlist.length === 0 && trendingMovies.length > 0) {
      const defaultWatch = [
        { ...trendingMovies[0], type: "movie" },
        { ...trendingAnime[0], type: "anime" }
      ].filter(Boolean);
      finalWatchlist = defaultWatch;
      setWatchlist(defaultWatch);
      localStorage.setItem("muviont_watchlist", JSON.stringify(defaultWatch));
    } else {
      setWatchlist(savedWatchlist);
    }

    let finalHistory = savedHistory;
    if (savedHistory.length === 0 && trendingMovies.length > 1) {
      const defaultHistory = [
        { ...trendingMovies[1], type: "movie", progress: 1420, duration: 7200 },
        { ...trendingAnime[1], type: "anime", progress: 340, duration: 1440 }
      ];
      finalHistory = defaultHistory;
      setContinueWatching(defaultHistory);
      localStorage.setItem("muviont_history", JSON.stringify(defaultHistory));
    } else {
      setContinueWatching(savedHistory);
    }

    const initializeAndFetch = async () => {
      let activeUserId = "guest-user";
      try {
        const userRes = await fetch("/api/auth/session");
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user) {
            activeUserId = userData.user.id;
          }
        }
      } catch (e) {
        console.error("Failed to fetch session on home client:", e);
      }

      // Sync local storage history/watchlist
      try {
        await fetch("/api/history/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: activeUserId,
            history: finalHistory,
            watchlist: finalWatchlist
          })
        });
      } catch (err) {
        console.error("Failed to sync local storage history/watchlist", err);
      }

      // Fetch AI recommendations based on personalization profile
      setLoadingRecs(true);
      try {
        const res = await fetch(`/api/ai-recommend?userId=${activeUserId}`);
        if (res.ok) {
          const data = await res.json();
          setAiRecs(data.recommendations || []);
          setLastWatchedTitle(data.lastWatchedTitle || null);
        }
      } catch {
        setAiRecs(trendingMovies.slice(3, 7)); // Fallback
      } finally {
        setLoadingRecs(false);
      }
    };

    initializeAndFetch();
  }, [trendingMovies, trendingSeries, trendingAnime]);

  const handlePlayTrailer = async (id: string, title: string) => {
    setTrailerVideoId("loading");
    try {
      const res = await fetch(`/api/trailer?id=${id}&title=${encodeURIComponent(title)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.trailerUrl) {
          setTrailerVideoId(data.trailerUrl);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to load trailer:", err);
    }
    setTrailerVideoId("");
  };

  return (
    <div className="bg-black min-h-screen text-white relative">
      {/* 1. Fullscreen cinematic intro overlay */}
      <IntroOverlay onComplete={() => setIntroCompleted(true)} />

      {introCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Glassmorphic Navbar */}
          <Navbar onSearchClick={() => setShowSearch(true)} />

          {/* Featured Hero Slider */}
          <HeroSlider 
            items={trendingMovies.slice(0, 4)} 
            onPlayTrailer={handlePlayTrailer} 
          />

          {/* Main home categories feed */}
          <main className="relative z-20 pb-20 -mt-12 sm:-mt-24 space-y-12">
            
            {/* Continue Watching Section (Dynamic Progress Bars) */}
            {continueWatching.length > 0 && (
              <section className="max-w-7xl mx-auto px-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  Continue Watching
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-neutral-950">
                  {continueWatching.map((item) => (
                    <div 
                      key={item.id} 
                      className="w-48 sm:w-56 flex-shrink-0 group cursor-pointer"
                      onClick={() => handlePlayTrailer(item.id, item.title)}
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-neutral-900 bg-neutral-950">
                        {/* Hover Overlay Play button */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 z-20">
                          <Play className="w-8 h-8 text-white fill-current" />
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={item.backdropPath || item.posterPath} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        {/* Progress line indicator */}
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800 z-10">
                          <div 
                            className="h-full bg-red-600 shadow-[0_0_8px_#FF0000]" 
                            style={{ width: `${(item.progress / item.duration) * 100}%` }}
                          />
                        </div>
                      </div>
                      <h3 className="text-xs font-bold text-neutral-300 truncate mt-2 group-hover:text-red-500 transition-colors">
                        {item.title}
                      </h3>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* My Watchlist Section */}
            {watchlist.length > 0 && (
              <section className="max-w-7xl mx-auto px-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  My Watchlist
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {watchlist.map((item) => (
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
              </section>
            )}

            {/* Because You Watched AI recommendations */}
            {aiRecs.length > 0 && (
              <section className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-red-500" />
                    {lastWatchedTitle ? `Because You Watched ${lastWatchedTitle}` : "Recommended For You"} (AI Recommendations)
                  </h2>
                  {loadingRecs && <span className="text-xs text-neutral-500 animate-pulse">updating...</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {aiRecs.map((item) => (
                    <MediaCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      posterPath={item.posterPath}
                      rating={item.rating}
                      type={item.type || (item.id.startsWith("a-") ? "anime" : "movie")}
                      releaseDate={item.releaseDate}
                      onClick={() => {
                        fetch("/api/recommendations/click", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ mediaId: item.id })
                        }).catch(err => console.error("Click tracking failed", err));
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Trending Movies Category Row */}
            <section className="max-w-7xl mx-auto px-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4">
                Trending Movies This Week
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {trendingMovies.slice(0, 6).map((item) => (
                  <MediaCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    posterPath={item.posterPath}
                    rating={item.rating}
                    type="movie"
                    releaseDate={item.releaseDate}
                  />
                ))}
              </div>
            </section>

            {/* Trending Series Category Row */}
            <section className="max-w-7xl mx-auto px-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4">
                Popular TV Series
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {trendingSeries.slice(0, 6).map((item) => (
                  <MediaCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    posterPath={item.posterPath}
                    rating={item.rating}
                    type="series"
                    releaseDate={item.releaseDate}
                  />
                ))}
              </div>
            </section>

            {/* Top Anime Airing Now Category Row */}
            <section className="max-w-7xl mx-auto px-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                Top Anime Airing Now
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {trendingAnime.slice(0, 6).map((item) => (
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
            </section>

            {/* Latest Trailers Slider Row */}
            <section className="max-w-7xl mx-auto px-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4">
                Latest Trailers
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-neutral-950">
                {trendingMovies.slice(1, 5).map((item) => (
                  <div 
                    key={item.id} 
                    className="w-72 sm:w-80 flex-shrink-0 group cursor-pointer relative rounded-lg overflow-hidden border border-neutral-900 bg-neutral-950/60 aspect-video"
                    onClick={() => handlePlayTrailer(item.id, item.title)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.backdropPath} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/45 z-10 flex flex-col justify-end p-4">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 text-white fill-current" />
                        </div>
                        {item.title} Trailer
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Entertainment News Feed section */}
            <section className="max-w-7xl mx-auto px-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-500" />
                Entertainment Industry News
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newsArticles.slice(0, 4).map((art) => (
                  <NewsCard key={art.id} article={art} />
                ))}
              </div>
            </section>

          </main>

          {/* Luxury Footer */}
          <footer className="border-t border-neutral-900 bg-black/60 backdrop-blur-sm py-12 text-neutral-500 text-xs">
            <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="relative w-24 h-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="Muviont" className="object-contain w-full h-full" />
                </div>
                <span>© 2026 MUVIONT. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Help Center</a>
              </div>
            </div>
          </footer>

          {/* 2. Fullscreen AI Search interface overlay */}
          {showSearch && (
            <AISearchInput onClose={() => setShowSearch(false)} />
          )}

          {/* 3. Global Video Trailer modal component */}
          <TrailerModal
            videoId={trailerVideoId || ""}
            isOpen={!!trailerVideoId}
            onClose={() => setTrailerVideoId(null)}
          />
        </motion.div>
      )}
    </div>
  );
}
