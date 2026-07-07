"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Play, Info } from "lucide-react";
import StreamingPlayer from "@/components/cinematic/StreamingPlayer";
import MediaCard from "@/components/cinematic/MediaCard";
import Navbar from "@/components/cinematic/Navbar";
import BottomNav from "@/components/cinematic/BottomNav";
import AISearchInput from "@/components/cinematic/AISearchInput";
import { AniListMedia } from "@/lib/providers/anilist.provider";
import { STREAMING_SOURCES, getRawAniListId, getRawTmdbId } from "@/lib/streaming";

interface WatchAnimeClientProps {
  anime: AniListMedia;
  recommendations: AniListMedia[];
}

export default function WatchAnimeClient({ anime, recommendations }: WatchAnimeClientProps) {
  const [episode,     setEpisode]     = useState(1);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [showSearch,  setShowSearch]  = useState(false);
  const [batchIndex,  setBatchIndex]  = useState(0);

  useEffect(() => {
    const saveProgress = async (prog: number) => {
      // 1. Update localStorage
      const savedHistory = JSON.parse(localStorage.getItem("muviont_history") || "[]");
      const filtered = savedHistory.filter((item: any) => item.id !== anime.id);
      
      const historyItem = {
        id: anime.id,
        title: anime.title,
        posterPath: anime.posterPath,
        rating: anime.rating,
        type: "anime",
        releaseDate: anime.releaseDate,
        season: 1,
        episode,
        progress: prog,
        duration: 1440, // 24 minutes standard episode duration mockup
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem("muviont_history", JSON.stringify([historyItem, ...filtered].slice(0, 20)));

      // 2. Update DB
      try {
        await fetch("/api/watch-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaId: anime.id,
            mediaType: "anime",
            season: 1,
            episode,
            progress: prog,
            duration: 1440
          })
        });
      } catch (err) {
        console.error("Failed to save progress to DB", err);
      }
    };

    saveProgress(60); // Mock initial minute viewed

    let currentProgress = 60;
    const interval = setInterval(() => {
      currentProgress += 15;
      saveProgress(currentProgress);
    }, 15000);

    return () => clearInterval(interval);
  }, [anime, episode]);

  const tmdbId = anime.tmdbId ? getRawTmdbId(anime.tmdbId) : null;
  const rawId = tmdbId || getRawAniListId(anime.id);
  const source   = STREAMING_SOURCES[sourceIndex];
  const embedUrl = source.seriesUrl(rawId, 1, episode);

  return (
    <div className="bg-black min-h-screen text-white pb-24 font-sans selection:bg-purple-650 selection:text-white">
      <Navbar onSearchClick={() => setShowSearch(true)} />
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6">

        <div className="py-4">
          <Link href={`/anime/${anime.id}`} className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors duration-200">
            <ArrowLeft className="w-4 h-4" />
            Back to Details
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-neutral-950/40 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-none">{anime.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-neutral-400 font-medium">
                <div className="flex items-center gap-1 bg-purple-650/15 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] tracking-wide font-extrabold">
                  <Star className="w-3 h-3 text-purple-500 fill-current" />
                  <span>{anime.rating.toFixed(1)}</span>
                </div>
                <span className="text-neutral-700">•</span>
                <span className="flex items-center gap-1 text-neutral-305 font-semibold">
                  Episode {episode} of {anime.episodes || "?"}
                </span>
                <span className="text-neutral-700">•</span>
                <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] tracking-wider text-neutral-300 font-extrabold uppercase">
                  Anime
                </span>
                {anime.status && (
                  <>
                    <span className="text-neutral-700">•</span>
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] tracking-wider text-neutral-300 font-extrabold uppercase">
                      {anime.status}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Player */}
            <div className="bg-neutral-950/30 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-2xl">
              <StreamingPlayer
                embedUrl={embedUrl}
                title={`${anime.title} Episode ${episode}`}
                sourceIndex={sourceIndex}
                onSourceChange={setSourceIndex}
              />
            </div>

            {/* Episode Grid */}
            {anime.episodes && anime.episodes > 0 && (
              <div className="p-6 rounded-2xl bg-neutral-950/40 border border-white/5 backdrop-blur-sm space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-400">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Episodes ({anime.episodes})
                  </div>
                  {anime.episodes > 100 && (
                    <div className="flex gap-1.5 overflow-x-auto max-w-full sm:max-w-[350px] scrollbar-none py-1" style={{ scrollbarWidth: "none" }}>
                      {Array.from({ length: Math.ceil(anime.episodes / 100) }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setBatchIndex(idx)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors flex-shrink-0 ${
                            batchIndex === idx
                              ? "bg-purple-650 border-purple-650 text-white"
                              : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-750"
                          }`}
                        >
                          {idx * 100 + 1}-{Math.min((idx + 1) * 100, anime.episodes)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                  {Array.from(
                    { length: Math.min(100, anime.episodes - batchIndex * 100) },
                    (_, i) => batchIndex * 100 + i + 1
                  ).map(ep => (
                    <button
                      key={ep}
                      onClick={() => setEpisode(ep)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        episode === ep
                          ? "bg-purple-650 border-purple-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.25)]"
                          : "bg-neutral-900/60 border-neutral-850 text-neutral-400 hover:text-white hover:border-neutral-700"
                      }`}
                    >
                      {ep}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Overview */}
            {anime.overview && (
              <div className="p-6 rounded-2xl bg-neutral-950/40 border border-white/5 backdrop-blur-sm space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-purple-500 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Synopsis
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed font-light">{anime.overview}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden border border-white/5 bg-neutral-950/40 backdrop-blur-md shadow-xl group">
              <div className="relative w-full aspect-[16/9] sm:aspect-[2/3] md:aspect-[16/9] lg:aspect-[2/3]">
                <Image src={anime.backdropPath || anime.posterPath} alt={anime.title} fill className="object-cover transition-transform duration-500 group-hover:scale-103" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              </div>
              <div className="p-4 space-y-3">
                {anime.studios.length > 0 && (
                  <div className="text-xs text-neutral-400">
                    <span className="text-neutral-500 uppercase tracking-wider text-[10px] font-extrabold block">Studio</span>
                    <span className="font-bold text-neutral-200 mt-1 block">{anime.studios.join(", ")}</span>
                  </div>
                )}
                <Link
                  href={`/anime/${anime.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-900 border border-neutral-850 text-xs font-extrabold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <Info className="w-4 h-4" />
                  Full Details & Roster
                </Link>
              </div>
            </div>

            {/* Media Info Panel */}
            <div className="p-5 rounded-2xl border border-white/5 bg-neutral-950/40 backdrop-blur-md space-y-4 text-xs shadow-xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-500">
                Media Info
              </h4>
              
              <div className="space-y-3">
                {anime.status && (
                  <div className="flex justify-between pb-2 border-b border-neutral-900">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Status</span>
                    <span className="font-semibold text-neutral-200">{anime.status}</span>
                  </div>
                )}
                {anime.episodes && anime.episodes > 0 && (
                  <div className="flex justify-between pb-2 border-b border-neutral-900">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Total Episodes</span>
                    <span className="font-semibold text-neutral-200">{anime.episodes} episodes</span>
                  </div>
                )}
                {anime.genres && anime.genres.length > 0 && (
                  <div className="flex flex-col gap-1.5 pb-2 border-b border-neutral-900">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Genres</span>
                    <div className="flex flex-wrap gap-1">
                      {anime.genres.slice(0, 3).map((g) => (
                        <span key={g} className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-850 text-[9px] font-semibold text-neutral-400">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {anime.season && (
                  <div className="flex justify-between pb-2 border-b border-neutral-900">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Season</span>
                    <span className="font-semibold text-neutral-200 uppercase">{anime.season}</span>
                  </div>
                )}
              </div>
            </div>

            {recommendations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-purple-500 flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  More Like This
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {recommendations.slice(0, 6).map(rec => (
                    <MediaCard
                      key={rec.id}
                      id={rec.id}
                      title={rec.title}
                      posterPath={rec.posterPath}
                      rating={rec.rating}
                      type="anime"
                      releaseDate={rec.releaseDate}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
