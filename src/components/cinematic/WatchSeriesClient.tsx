"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Calendar, Play, Info, Tv } from "lucide-react";
import StreamingPlayer from "@/components/cinematic/StreamingPlayer";
import EpisodeSelector from "@/components/cinematic/EpisodeSelector";
import MediaCard from "@/components/cinematic/MediaCard";
import Navbar from "@/components/cinematic/Navbar";
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

  const rawId    = getRawTmdbId(series.id);
  const embedUrl = buildSeriesEmbedUrl(rawId, season, episode, sourceIndex);

  const handleEpisodeSelect = (s: number, e: number) => {
    setSeason(s);
    setEpisode(e);
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen text-white pb-12">
      <Navbar onSearchClick={() => setShowSearch(true)} />
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      <div className="pt-[var(--navbar-h)] max-w-[1400px] mx-auto px-4 sm:px-6">

        <div className="py-4">
          <Link href={`/series/${series.id}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Series Details
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

          {/* Main column */}
          <div className="space-y-5">
            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{series.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-[var(--gold)] fill-current" />
                  <span className="font-bold text-white">{series.rating.toFixed(1)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Tv className="w-3.5 h-3.5" />
                  S{season}E{episode}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-xs font-bold uppercase border border-blue-500/20">
                  Series
                </span>
              </div>
            </div>

            {/* Player */}
            <StreamingPlayer
              embedUrl={embedUrl}
              title={`${series.title} S${season}E${episode}`}
              sourceIndex={sourceIndex}
              onSourceChange={setSourceIndex}
            />

            {/* Episode Selector — CineVault architecture */}
            <div className="p-4 rounded-xl bg-[var(--bg3)] border border-[var(--border)]">
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
              <div className="p-4 rounded-xl bg-[var(--bg3)] border border-[var(--border)]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-[var(--red)]" />
                  About
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{series.overview}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)]">
              <div className="relative w-full aspect-[2/3]">
                <Image src={series.posterPath} alt={series.title} fill className="object-cover" unoptimized />
              </div>
              <div className="p-4">
                <Link
                  href={`/series/${series.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--bg3)] border border-[var(--border2)] text-sm font-semibold text-[var(--text-muted)] hover:text-white hover:bg-[var(--card-hover)] transition-colors"
                >
                  <Info className="w-4 h-4" />
                  Full Details
                </Link>
              </div>
            </div>

            {recommendations.length > 0 && (
              <div>
                <h3 className="section-title mb-3">
                  <Play className="w-3.5 h-3.5 text-[var(--red)]" />
                  More Like This
                </h3>
                <div className="grid grid-cols-3 gap-2">
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
    </div>
  );
}
