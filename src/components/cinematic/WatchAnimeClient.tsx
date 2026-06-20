"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Play, Info } from "lucide-react";
import StreamingPlayer from "@/components/cinematic/StreamingPlayer";
import EpisodeSelector from "@/components/cinematic/EpisodeSelector";
import MediaCard from "@/components/cinematic/MediaCard";
import Navbar from "@/components/cinematic/Navbar";
import AISearchInput from "@/components/cinematic/AISearchInput";
import { AniListMedia } from "@/lib/providers/anilist.provider";
import { STREAMING_SOURCES, getRawAniListId } from "@/lib/streaming";

interface WatchAnimeClientProps {
  anime: AniListMedia;
  recommendations: AniListMedia[];
}

export default function WatchAnimeClient({ anime, recommendations }: WatchAnimeClientProps) {
  const [episode,     setEpisode]     = useState(1);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [showSearch,  setShowSearch]  = useState(false);

  // Anime uses AniList ID for embed; VidSrc supports anime via TMDB or MAL id
  // We'll use the series URL pattern with episode selection (season 1 for anime)
  const rawId    = getRawAniListId(anime.id);
  const source   = STREAMING_SOURCES[sourceIndex];
  // For anime, use the TV embed with season 1 (most anime are single-season)
  const embedUrl = source.seriesUrl(rawId, 1, episode);

  return (
    <div className="bg-[var(--bg)] min-h-screen text-white pb-12">
      <Navbar onSearchClick={() => setShowSearch(true)} />
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      <div className="pt-[var(--navbar-h)] max-w-[1400px] mx-auto px-4 sm:px-6">

        <div className="py-4">
          <Link href={`/anime/${anime.id}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Anime Details
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

          <div className="space-y-5">
            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{anime.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-[var(--gold)] fill-current" />
                  <span className="font-bold text-white">{anime.rating.toFixed(1)}</span>
                </span>
                <span className="text-xs">Episode {episode} of {anime.episodes || "?"}</span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 text-xs font-bold uppercase border border-purple-500/20">
                  Anime
                </span>
                {anime.status && (
                  <span className="px-2 py-0.5 rounded-md bg-[var(--bg3)] text-[var(--text-muted)] text-xs border border-[var(--border)]">
                    {anime.status}
                  </span>
                )}
              </div>
            </div>

            {/* Player */}
            <StreamingPlayer
              embedUrl={embedUrl}
              title={`${anime.title} Episode ${episode}`}
              sourceIndex={sourceIndex}
              onSourceChange={setSourceIndex}
            />

            {/* Episode Grid */}
            {anime.episodes && anime.episodes > 0 && (
              <div className="p-4 rounded-xl bg-[var(--bg3)] border border-[var(--border)]">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-3">
                  <Play className="w-3.5 h-3.5 text-purple-400" />
                  Episodes ({anime.episodes})
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                  {Array.from({ length: Math.min(anime.episodes, 200) }, (_, i) => i + 1).map(ep => (
                    <button
                      key={ep}
                      onClick={() => setEpisode(ep)}
                      className={`ep-btn ${episode === ep ? "active" : ""}`}
                    >
                      E{ep}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Overview */}
            {anime.overview && (
              <div className="p-4 rounded-xl bg-[var(--bg3)] border border-[var(--border)]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-purple-400" />
                  About
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{anime.overview}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)]">
              <div className="relative w-full aspect-[2/3]">
                <Image src={anime.posterPath} alt={anime.title} fill className="object-cover" unoptimized />
              </div>
              <div className="p-4 space-y-2">
                {anime.studios.length > 0 && (
                  <p className="text-[11px] text-[var(--text-muted)]">
                    <span className="text-[var(--text-dim)] uppercase tracking-wider text-[10px] font-bold">Studio:</span>{" "}
                    {anime.studios[0]}
                  </p>
                )}
                {anime.season && (
                  <p className="text-[11px] text-[var(--text-muted)]">
                    <span className="text-[var(--text-dim)] uppercase tracking-wider text-[10px] font-bold">Season:</span>{" "}
                    {anime.season}
                  </p>
                )}
                <Link
                  href={`/anime/${anime.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--bg3)] border border-[var(--border2)] text-sm font-semibold text-[var(--text-muted)] hover:text-white hover:bg-[var(--card-hover)] transition-colors mt-2"
                >
                  <Info className="w-4 h-4" />
                  Full Details
                </Link>
              </div>
            </div>

            {recommendations.length > 0 && (
              <div>
                <h3 className="section-title mb-3">
                  <Play className="w-3.5 h-3.5 text-purple-400" />
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
    </div>
  );
}
