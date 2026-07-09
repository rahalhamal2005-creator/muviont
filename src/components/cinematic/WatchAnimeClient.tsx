"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Play, Download } from "lucide-react";
import StreamingPlayer from "@/components/cinematic/StreamingPlayer";
import MediaCard from "@/components/cinematic/MediaCard";
import Navbar from "@/components/cinematic/Navbar";
import BottomNav from "@/components/cinematic/BottomNav";
import DownloadModal from "@/components/cinematic/DownloadModal";
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
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

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
    <div className="bg-[#040405] min-h-screen text-white pb-24 font-sans selection:bg-red-600 selection:text-white relative overflow-x-hidden">
      
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 right-0 h-[80vh] pointer-events-none overflow-hidden z-0 opacity-20 select-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#040405] z-10" />
        <div className="absolute inset-0 bg-[#040405]/60 z-10" />
        <Image
          src={anime.backdropPath || anime.posterPath}
          alt=""
          fill
          className="object-cover blur-[100px] scale-110"
          unoptimized
        />
      </div>

      <Navbar onSearchClick={() => setShowSearch(true)} />
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      <div className="pt-24 max-w-6xl mx-auto px-4 sm:px-6 relative z-10 space-y-8">

        {/* Back Button & Download */}
        <div className="flex items-center justify-between">
          <Link 
            href={`/anime/${anime.id}`} 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-all duration-305"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Details
          </Link>
          <button
            onClick={() => setIsDownloadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--red-dim)] hover:bg-[var(--red)]/20 border border-[var(--red)]/30 text-xs font-bold uppercase tracking-wider text-[var(--red)] hover:text-white transition-all duration-300 shadow-[0_0_15px_var(--red-glow)]"
          >
            <Download className="w-3.5 h-3.5" />
            Download Episode {episode}
          </button>
        </div>

        {/* 1. Large Hero Video Player (Netflix/Disney style) */}
        <div className="relative z-10 bg-black rounded-2xl border border-white/[0.06] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.8)] transition-all duration-300">
          <StreamingPlayer
            embedUrl={embedUrl}
            title={`${anime.title} Episode ${episode}`}
            backdropUrl={anime.backdropPath || undefined}
            sourceIndex={sourceIndex}
            onSourceChange={setSourceIndex}
          />
        </div>

        {/* 2. Media Details & Info Section (Below Player) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          
          {/* Main Info (Left 2/3 columns) */}
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">{anime.title}</h1>
              
              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-semibold">
                <div className="flex items-center gap-1 bg-[var(--red)]/15 border border-[var(--red)]/30 px-2.5 py-0.5 rounded text-[10px] tracking-wide font-extrabold text-[var(--red)]">
                  <Star className="w-3 h-3 text-[var(--red)] fill-current" />
                  <span>{anime.rating.toFixed(1)}</span>
                </div>
                <span className="text-neutral-800">•</span>
                <span className="text-neutral-300">
                  Episode {episode} of {anime.episodes || "?"}
                </span>
                <span className="text-neutral-800">•</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-[10px] tracking-wider text-neutral-300 font-extrabold uppercase">
                  Anime
                </span>
                {anime.status && (
                  <>
                    <span className="text-neutral-800">•</span>
                    <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-[10px] tracking-wider text-neutral-300 font-extrabold uppercase">
                      {anime.status}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Synopsis */}
            {anime.overview && (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--red)]">
                  Synopsis
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed font-light">{anime.overview}</p>
              </div>
            )}
          </div>

          {/* Sidebar / Additional Info (Right 1/3 column) */}
          <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/[0.08] backdrop-blur-md space-y-4 text-xs h-fit shadow-xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--red)]">
              Anime Details
            </h4>
            <div className="space-y-3.5">
              {anime.studios.length > 0 && (
                <div className="flex justify-between pb-2 border-b border-white/[0.05]">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Studio</span>
                  <span className="font-semibold text-neutral-200 text-right">{anime.studios.slice(0, 2).join(", ")}</span>
                </div>
              )}
              {anime.status && (
                <div className="flex justify-between pb-2 border-b border-white/[0.05]">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Status</span>
                  <span className="font-semibold text-neutral-200">{anime.status}</span>
                </div>
              )}
              {anime.episodes && anime.episodes > 0 && (
                <div className="flex justify-between pb-2 border-b border-white/[0.05]">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Total Episodes</span>
                  <span className="font-semibold text-neutral-200">{anime.episodes} episodes</span>
                </div>
              )}
              {anime.genres && anime.genres.length > 0 && (
                <div className="flex flex-col gap-1 border-b border-white/[0.05] pb-2">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Genres</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {anime.genres.slice(0, 3).map((g) => (
                      <span key={g} className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] font-semibold text-neutral-350">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Episodes List Panel (Full Width) */}
        {anime.episodes && anime.episodes > 0 && (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--red)]">
                <Play className="w-3.5 h-3.5 fill-current" />
                Episodes ({anime.episodes})
              </div>
              {anime.episodes > 100 && (
                <div className="flex gap-1.5 overflow-x-auto max-w-full sm:max-w-[350px] scrollbar-none py-1" style={{ scrollbarWidth: "none" }}>
                  {Array.from({ length: Math.ceil(anime.episodes / 100) }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBatchIndex(idx)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 flex-shrink-0 ${
                        batchIndex === idx
                          ? "bg-[var(--red)] border-[var(--red)] text-white shadow-[0_0_15px_rgba(229,56,59,0.35)]"
                          : "bg-white/[0.03] border-white/[0.06] text-neutral-400 hover:text-white hover:border-white/[0.2]"
                      }`}
                    >
                      {idx * 100 + 1}-{Math.min((idx + 1) * 100, anime.episodes)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 gap-2 max-h-[260px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/[0.1] scrollbar-track-transparent">
              {Array.from(
                { length: Math.min(100, anime.episodes - batchIndex * 100) },
                (_, i) => batchIndex * 100 + i + 1
              ).map(ep => (
                <button
                  key={ep}
                  onClick={() => setEpisode(ep)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border ${
                    episode === ep
                      ? "bg-gradient-to-r from-[var(--red)] to-red-500 border-transparent text-white shadow-[0_0_15px_rgba(229,56,59,0.45)] scale-105"
                      : "bg-white/[0.03] border-white/[0.06] text-neutral-400 hover:text-white hover:border-white/[0.2] hover:scale-105 hover:bg-white/[0.06]"
                  }`}
                >
                  {ep}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Recommendations Rail (Full Width, Horizontal scroll - Netflix style) */}
        {recommendations.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--red)] flex items-center gap-2">
              <Play className="w-3.5 h-3.5 fill-current" />
              More Like This
            </h3>
            
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-thumb-white/[0.1] scrollbar-track-transparent">
                {recommendations.map(rec => (
                  <div key={rec.id} className="w-[160px] sm:w-[200px] flex-shrink-0 transition-transform duration-300 hover:scale-105">
                    <MediaCard
                      id={rec.id}
                      title={rec.title}
                      posterPath={rec.posterPath}
                      rating={rec.rating}
                      type="anime"
                      releaseDate={rec.releaseDate}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      <BottomNav />

      {/* Download Options Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        title={anime.title}
        mediaId={anime.id}
        mediaType="anime"
        season={1}
        episode={episode}
      />
    </div>
  );
}
