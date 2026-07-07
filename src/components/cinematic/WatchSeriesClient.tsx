"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Play, Info, Tv } from "lucide-react";
import StreamingPlayer from "@/components/cinematic/StreamingPlayer";
import EpisodeSelector from "@/components/cinematic/EpisodeSelector";
import MediaCard from "@/components/cinematic/MediaCard";
import Navbar from "@/components/cinematic/Navbar";
import BottomNav from "@/components/cinematic/BottomNav";
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
    <div className="bg-black min-h-screen text-white pb-24 font-sans selection:bg-red-650 selection:text-white">
      <Navbar onSearchClick={() => setShowSearch(true)} />
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6">

        <div className="py-4">
          <Link href={`/series/${series.id}`} className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors duration-200">
            <ArrowLeft className="w-4 h-4" />
            Back to Details
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-neutral-950/40 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-none">{series.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-neutral-400 font-medium">
                <div className="flex items-center gap-1 bg-red-650/15 border border-red-500/30 px-2 py-0.5 rounded text-[10px] tracking-wide font-extrabold">
                  <Star className="w-3 h-3 text-red-500 fill-current" />
                  <span>{series.rating.toFixed(1)}</span>
                </div>
                <span className="text-neutral-700">•</span>
                <span className="flex items-center gap-1 text-neutral-300 font-semibold">
                  <Tv className="w-3.5 h-3.5 text-neutral-500" />
                  Season {season}, Episode {episode}
                </span>
                <span className="text-neutral-700">•</span>
                <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] tracking-wider text-neutral-300 font-extrabold uppercase">
                  Series
                </span>
              </div>
            </div>

            {/* Player */}
            <div className="bg-neutral-950/30 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-2xl">
              <StreamingPlayer
                embedUrl={embedUrl}
                title={`${series.title} S${season}E${episode}`}
                sourceIndex={sourceIndex}
                onSourceChange={setSourceIndex}
              />
            </div>

            {/* Episode Selector — CineVault architecture */}
            <div className="p-6 rounded-2xl bg-neutral-950/40 border border-white/5 backdrop-blur-sm shadow-lg">
              <EpisodeSelector
                seriesId={series.id}
                totalSeasons={seasons.length || 1}
                seasons={seasons}
                currentSeason={season}
                currentEpisode={episode}
                onEpisodeSelect={handleEpisodeSelect}
              />
            </div>

            {/* Overview */}
            {series.overview && (
              <div className="p-6 rounded-2xl bg-neutral-950/40 border border-white/5 backdrop-blur-sm space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Synopsis
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed font-light">{series.overview}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden border border-white/5 bg-neutral-950/40 backdrop-blur-md shadow-xl group">
              <div className="relative w-full aspect-[16/9] sm:aspect-[2/3] md:aspect-[16/9] lg:aspect-[2/3]">
                <Image src={series.backdropPath || series.posterPath} alt={series.title} fill className="object-cover transition-transform duration-500 group-hover:scale-103" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              </div>
              <div className="p-4">
                <Link
                  href={`/series/${series.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-900 border border-neutral-850 text-xs font-extrabold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <Info className="w-4 h-4" />
                  Full Details & Cast
                </Link>
              </div>
            </div>

            {/* Media Info Panel */}
            <div className="p-5 rounded-2xl border border-white/5 bg-neutral-950/40 backdrop-blur-md space-y-4 text-xs shadow-xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500">
                Media Info
              </h4>
              
              <div className="space-y-3">
                {series.status && (
                  <div className="flex justify-between pb-2 border-b border-neutral-900">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Status</span>
                    <span className="font-semibold text-neutral-200">{series.status}</span>
                  </div>
                )}
                {series.runtime && series.runtime > 0 && (
                  <div className="flex justify-between pb-2 border-b border-neutral-900">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Episode Runtime</span>
                    <span className="font-semibold text-neutral-200">{series.runtime} min</span>
                  </div>
                )}
                {series.genres && series.genres.length > 0 && (
                  <div className="flex flex-col gap-1.5 pb-2 border-b border-neutral-900">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Genres</span>
                    <div className="flex flex-wrap gap-1">
                      {series.genres.slice(0, 3).map((g) => (
                        <span key={g} className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-850 text-[9px] font-semibold text-neutral-400">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {series.language && (
                  <div className="flex justify-between pb-2 border-b border-neutral-900">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Language</span>
                    <span className="font-semibold text-neutral-200 truncate max-w-[150px]" title={series.language}>{series.language}</span>
                  </div>
                )}
                {series.country && (
                  <div className="flex justify-between pb-2 border-b border-neutral-900">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Country</span>
                    <span className="font-semibold text-neutral-200 truncate max-w-[150px]" title={series.country}>{series.country}</span>
                  </div>
                )}
              </div>
            </div>

            {recommendations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
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
                      type="series"
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
