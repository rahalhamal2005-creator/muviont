"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Calendar, Play } from "lucide-react";
import StreamingPlayer from "@/components/cinematic/StreamingPlayer";
import MediaCard from "@/components/cinematic/MediaCard";
import Navbar from "@/components/cinematic/Navbar";
import BottomNav from "@/components/cinematic/BottomNav";
import AISearchInput from "@/components/cinematic/AISearchInput";
import { TMDBMedia } from "@/lib/providers/tmdb.provider";
import { buildMovieEmbedUrl, getRawTmdbId } from "@/lib/streaming";

interface WatchMovieClientProps {
  movie: TMDBMedia;
  recommendations: TMDBMedia[];
}

export default function WatchMovieClient({ movie, recommendations }: WatchMovieClientProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [showSearch,  setShowSearch]  = useState(false);

  useEffect(() => {
    const saveProgress = async (prog: number) => {
      // 1. Update localStorage
      const savedHistory = JSON.parse(localStorage.getItem("muviont_history") || "[]");
      const filtered = savedHistory.filter((item: any) => item.id !== movie.id);
      
      const historyItem = {
        id: movie.id,
        title: movie.title,
        posterPath: movie.posterPath,
        rating: movie.rating,
        type: "movie",
        releaseDate: movie.releaseDate,
        progress: prog,
        duration: 7200,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem("muviont_history", JSON.stringify([historyItem, ...filtered].slice(0, 20)));

      // 2. Update DB
      try {
        await fetch("/api/watch-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaId: movie.id,
            mediaType: "movie",
            progress: prog,
            duration: 7200
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
  }, [movie]);

  const rawId  = getRawTmdbId(movie.id);
  const embedUrl = buildMovieEmbedUrl(rawId, sourceIndex);

  return (
    <div className="bg-[#040405] min-h-screen text-white pb-24 font-sans selection:bg-red-650 selection:text-white relative overflow-x-hidden">
      
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 right-0 h-[80vh] pointer-events-none overflow-hidden z-0 opacity-20 select-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#040405] z-10" />
        <div className="absolute inset-0 bg-[#040405]/60 z-10" />
        <Image
          src={movie.backdropPath || movie.posterPath}
          alt=""
          fill
          className="object-cover blur-[100px] scale-110"
          unoptimized
        />
      </div>

      <Navbar onSearchClick={() => setShowSearch(true)} />
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      <div className="pt-24 max-w-6xl mx-auto px-4 sm:px-6 relative z-10 space-y-8">

        {/* Back Button */}
        <div>
          <Link
            href={`/movie/${movie.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-all duration-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Details
          </Link>
        </div>

        {/* 1. Large Hero Video Player (Netflix/Disney style) */}
        <div className="relative z-10 bg-black rounded-2xl border border-white/[0.06] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.8)] transition-all duration-300">
          <StreamingPlayer
            embedUrl={embedUrl}
            title={movie.title}
            backdropUrl={movie.backdropPath || undefined}
            sourceIndex={sourceIndex}
            onSourceChange={setSourceIndex}
          />
        </div>

        {/* 2. Media Details & Info Section (Below Player) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          
          {/* Main Info (Left 2/3 columns) */}
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">{movie.title}</h1>
              
              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-semibold">
                <div className="flex items-center gap-1 bg-[var(--red)]/15 border border-[var(--red)]/30 px-2.5 py-0.5 rounded text-[10px] tracking-wide font-extrabold text-[var(--red)]">
                  <Star className="w-3 h-3 text-[var(--red)] fill-current" />
                  <span>{movie.rating.toFixed(1)}</span>
                </div>
                <span className="text-neutral-800">•</span>
                {movie.releaseDate && (
                  <span className="flex items-center gap-1 font-semibold text-neutral-350">
                    <Calendar className="w-3.5 h-3.5 text-neutral-555" />
                    {movie.releaseDate.substring(0, 4)}
                  </span>
                )}
                <span className="text-neutral-800">•</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-[10px] tracking-wider text-neutral-300 font-extrabold uppercase">
                  Movie
                </span>
                <span className="text-neutral-800">•</span>
                <span className="px-1.5 py-0.5 rounded border border-neutral-800 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                  4K ULTRA HD
                </span>
              </div>
            </div>

            {/* Synopsis */}
            {movie.overview && (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--red)]">
                  Synopsis
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed font-light">{movie.overview}</p>
              </div>
            )}
          </div>

          {/* Sidebar / Additional Info (Right 1/3 column) */}
          <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/[0.08] backdrop-blur-md space-y-4 text-xs h-fit shadow-xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--red)]">
              Movie Details
            </h4>
            
            <div className="space-y-3.5">
              {movie.status && (
                <div className="flex justify-between pb-2.5 border-b border-white/[0.05]">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Status</span>
                  <span className="font-semibold text-neutral-200">{movie.status}</span>
                </div>
              )}
              {movie.runtime && movie.runtime > 0 && (
                <div className="flex justify-between pb-2.5 border-b border-white/[0.05]">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Runtime</span>
                  <span className="font-semibold text-neutral-200">{movie.runtime} min</span>
                </div>
              )}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-col gap-1 border-b border-white/[0.05] pb-2">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Genres</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {movie.genres.slice(0, 3).map((g) => (
                      <span key={g} className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] font-semibold text-neutral-350">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {movie.language && (
                <div className="flex justify-between pb-2.5 border-b border-white/[0.05]">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Language</span>
                  <span className="font-semibold text-neutral-200 truncate max-w-[150px]" title={movie.language}>{movie.language}</span>
                </div>
              )}
              {movie.country && (
                <div className="flex justify-between pb-2.5 border-b border-white/[0.05]">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Country</span>
                  <span className="font-semibold text-neutral-200 truncate max-w-[150px]" title={movie.country}>{movie.country}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Recommendations Rail (Full Width, Horizontal scroll - Netflix style) */}
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
                      type="movie"
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
    </div>
  );
}
