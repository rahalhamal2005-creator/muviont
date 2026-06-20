"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "./Navbar";
import MediaCard from "./MediaCard";
import AISearchInput from "./AISearchInput";
import TrailerModal from "./TrailerModal";
import { AniListMedia } from "@/lib/providers/anilist.provider";
import { Calendar, Tv, Flame, Award, Play } from "lucide-react";

interface AnimeHubClientProps {
  trendingAnime: AniListMedia[];
  popularAiring: AniListMedia[];
  airingSchedule: AniListMedia[];
}

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

  useEffect(() => {
    // Filter airing schedule by chosen weekday
    const filtered = airingSchedule.filter((item) => {
      if (!item.nextAiringEpisode) return false;
      const date = new Date(item.nextAiringEpisode.airingAt * 1000);
      return date.getDay() === selectedDay;
    });
    setFilteredSchedule(filtered);
  }, [selectedDay, airingSchedule]);

  const handlePlayTrailer = (videoId: string) => {
    setTrailerVideoId(videoId);
  };

  const featured = trendingAnime[0] || popularAiring[0];

  return (
    <div className="bg-black min-h-screen text-white pb-20">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50 z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent z-10" />

          {/* Featured Content Details */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end pb-12 max-w-7xl mx-auto px-6 pointer-events-none">
            <div className="max-w-2xl pointer-events-auto">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-500 bg-red-950/30 border border-red-800/30 rounded-full mb-3 inline-block">
                Featured Release
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-2 font-sans tracking-tight">
                {featured.title}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300 mb-6 max-w-xl line-clamp-3">
                {featured.overview}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePlayTrailer(featured.trailerUrl || "KzZz1gP1z2I")}
                  disabled={!featured.trailerUrl}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-750 active:scale-95 transition-all duration-300 disabled:opacity-50"
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
      <main className="max-w-7xl mx-auto px-6 space-y-16 -mt-6 relative z-30">
        
        {/* Weekly Airing Calendar Schedule Block */}
        <section className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Airing Schedule
              </h2>
              <p className="text-xs text-neutral-400 mt-1">Weekly release calendar parsed dynamically from AniList</p>
            </div>
            
            {/* Days Tab selector */}
            <div className="flex flex-wrap gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 self-start">
              {days.map((day) => (
                <button
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                    selectedDay === day.value
                      ? "bg-red-600 text-white shadow-md"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule list grid */}
          {filteredSchedule.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                    <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-red-600/90 text-[9px] font-bold text-white border border-red-500/30">
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

        {/* Trending Anime section */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500 animate-pulse" />
            Trending Anime Series
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

        {/* Popular Anime category row */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
            <Award className="w-4 h-4 text-red-500" />
            Highest Rated Airing Now
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularAiring.slice(0, 6).map((item) => (
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

      </main>

      {/* Dynamic Trailer Player modal */}
      <TrailerModal
        videoId={trailerVideoId || ""}
        isOpen={!!trailerVideoId}
        onClose={() => setTrailerVideoId(null)}
      />
    </div>
  );
}
