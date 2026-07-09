"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Play, Tv, Download } from "lucide-react";
import StreamingPlayer from "@/components/cinematic/StreamingPlayer";
import EpisodeSelector from "@/components/cinematic/EpisodeSelector";
import MediaCard from "@/components/cinematic/MediaCard";
import Navbar from "@/components/cinematic/Navbar";
import BottomNav from "@/components/cinematic/BottomNav";
import DownloadModal from "@/components/cinematic/DownloadModal";
import AISearchInput from "@/components/cinematic/AISearchInput";
import { TMDBMedia, TMDBSeason } from "@/lib/providers/tmdb.provider";
import { buildSeriesEmbedUrl, getRawTmdbId } from "@/lib/streaming";

interface WatchSeriesClientProps {
  series: TMDBMedia;
  seasons: TMDBSeason[];
  recommendations: TMDBMedia[];
  initialSeason?: number;
  initialEpisode?: number;
}

export default function WatchSeriesClient({
  series, seasons, recommendations,
  initialSeason = 1, initialEpisode = 1,
}: WatchSeriesClientProps) {
  const [season,      setSeason]      = useState(initialSeason);
  const [episode,     setEpisode]     = useState(initialEpisode);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [showSearch,  setShowSearch]  = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  useEffect(() => {
    const saveProgress = async (prog: number) => {
      // 1. Update localStorage
      const savedHistory = JSON.parse(localStorage.getItem("muviont_history") || "[]");
      const filtered = savedHistory.filter((item: any) => item.id !== series.id);
      
      const historyItem = {
        id: series.id,
        title: series.title,
        posterPath: series.posterPath,
        rating: series.rating,
        type: "series",
        releaseDate: series.releaseDate,
        season,
        episode,
        progress: prog,
        duration: 2700, // 45 minutes standard episode duration mockup
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem("muviont_history", JSON.stringify([historyItem, ...filtered].slice(0, 20)));

      // 2. Update DB
      try {
        await fetch("/api/watch-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaId: series.id,
            mediaType: "series",
            season,
            episode,
            progress: prog,
            duration: 2700
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
  }, [series, season, episode]);

  const rawId    = getRawTmdbId(series.id);
  const embedUrl = buildSeriesEmbedUrl(rawId, season, episode, sourceIndex);

  const handleEpisodeSelect = (s: number, e: number) => {
    setSeason(s);
    setEpisode(e);
  };

  return (
    <div className="bg-[#040405] min-h-screen text-white pb-24 font-sans selection:bg-red-650 selection:text-white relative overflow-x-hidden">
      
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 right-0 h-[80vh] pointer-events-none overflow-hidden z-0 opacity-20 select-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#040405] z-10" />
        <div className="absolute inset-0 bg-[#040405]/60 z-10" />
        <Image
          src={series.backdropPath || series.posterPath}
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
            href={`/series/${series.id}`} 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-all duration-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Details
          </Link>
          <button
            onClick={() => setIsDownloadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--red-dim)] hover:bg-[var(--red)]/20 border border-[var(--red)]/30 text-xs font-bold uppercase tracking-wider text-[var(--red)] hover:text-white transition-all duration-300 shadow-[0_0_15px_var(--red-glow)]"
          >
            <Download className="w-3.5 h-3.5" />
            Download S{season}E{episode}
          </button>
        </div>

        {/* 1. Large Hero Video Player (Netflix/Disney style) */}
        <div className="relative z-10 bg-black rounded-2xl border border-white/[0.06] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.8)] transition-all duration-300">
          <StreamingPlayer
            embedUrl={embedUrl}
            title={`${series.title} S${season}E${episode}`}
            backdropUrl={series.backdropPath || undefined}
            sourceIndex={sourceIndex}
            onSourceChange={setSourceIndex}
          />
        </div>

        {/* 2. Media Details & Info Section (Below Player) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          
          {/* Main Info (Left 2/3 columns) */}
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">{series.title}</h1>
              
              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-semibold">
                <div className="flex items-center gap-1 bg-[var(--red)]/15 border border-[var(--red)]/30 px-2.5 py-0.5 rounded text-[10px] tracking-wide font-extrabold text-[var(--red)]">
                  <Star className="w-3 h-3 text-[var(--red)] fill-current" />
                  <span>{series.rating.toFixed(1)}</span>
                </div>
                <span className="text-neutral-800">•</span>
                <span className="flex items-center gap-1 text-neutral-300 font-semibold">
                  <Tv className="w-3.5 h-3.5 text-neutral-500" />
                  Season {season}, Episode {episode}
                </span>
                <span className="text-neutral-800">•</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-[10px] tracking-wider text-neutral-300 font-extrabold uppercase">
                  Series
                </span>
              </div>
            </div>

            {/* Synopsis */}
            {series.overview && (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--red)]">
                  Synopsis
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed font-light">{series.overview}</p>
              </div>
            )}
          </div>

          {/* Sidebar / Additional Info (Right 1/3 column) */}
          <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/[0.08] backdrop-blur-md space-y-4 text-xs h-fit shadow-xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--red)]">
              Series Details
            </h4>
            
            <div className="space-y-3.5">
              {series.status && (
                <div className="flex justify-between pb-2.5 border-b border-white/[0.05]">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Status</span>
                  <span className="font-semibold text-neutral-200">{series.status}</span>
                </div>
              )}
              {series.runtime && series.runtime > 0 && (
                <div className="flex justify-between pb-2.5 border-b border-white/[0.05]">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Episode Runtime</span>
                  <span className="font-semibold text-neutral-200">{series.runtime} min</span>
                </div>
              )}
              {series.genres && series.genres.length > 0 && (
                <div className="flex flex-col gap-1 border-b border-white/[0.05] pb-2">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Genres</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {series.genres.slice(0, 3).map((g) => (
                      <span key={g} className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] font-semibold text-neutral-350">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {series.language && (
                <div className="flex justify-between pb-2.5 border-b border-white/[0.05]">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Language</span>
                  <span className="font-semibold text-neutral-200 truncate max-w-[150px]" title={series.language}>{series.language}</span>
                </div>
              )}
              {series.country && (
                <div className="flex justify-between pb-2.5 border-b border-white/[0.05]">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Country</span>
                  <span className="font-semibold text-neutral-200 truncate max-w-[150px]" title={series.country}>{series.country}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Episode Selector (Full Width) */}
        <div className="relative z-10 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md shadow-2xl">
          <EpisodeSelector
            seriesId={series.id}
            totalSeasons={seasons.length || 1}
            seasons={seasons}
            currentSeason={season}
            currentEpisode={episode}
            onEpisodeSelect={handleEpisodeSelect}
          />
        </div>

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
                      key={rec.id}
                      id={rec.id}
                      title={rec.title}
                      posterPath={rec.posterPath}
                      rating={rec.rating}
                      type="series"
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
        title={series.title}
        mediaId={series.id}
        mediaType="series"
        season={season}
        episode={episode}
      />
    </div>
  );
}
