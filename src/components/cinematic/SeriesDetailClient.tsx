"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play, Plus, Check, Star, Calendar, ArrowLeft, Tv, Clock,
} from "lucide-react";
import Navbar from "./Navbar";
import MediaCard from "./MediaCard";
import ContentRail from "./ContentRail";
import AISearchInput from "./AISearchInput";
import BottomNav from "./BottomNav";
import { TMDBMedia, TMDBSeason } from "@/lib/providers/tmdb.provider";

interface SeriesDetailClientProps {
  series: TMDBMedia;
  seasons: TMDBSeason[];
  recommendations: TMDBMedia[];
}

export default function SeriesDetailClient({ series, seasons, recommendations }: SeriesDetailClientProps) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showSearch,  setShowSearch]  = useState(false);

  useEffect(() => {
    const wl = JSON.parse(localStorage.getItem("muviont_watchlist") || "[]");
    setInWatchlist(wl.some((item: any) => item.id === series.id));
    // Track viewed
    const viewed = JSON.parse(localStorage.getItem("muviont_viewed") || "[]");
    const updated = [series, ...viewed.filter((i: any) => i.id !== series.id)].slice(0, 10);
    localStorage.setItem("muviont_viewed", JSON.stringify(updated));
  }, [series]);

  const toggleWatchlist = () => {
    const wl = JSON.parse(localStorage.getItem("muviont_watchlist") || "[]");
    const updated = inWatchlist
      ? wl.filter((i: any) => i.id !== series.id)
      : [...wl, series];
    setInWatchlist(!inWatchlist);
    localStorage.setItem("muviont_watchlist", JSON.stringify(updated));
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen text-white pb-24">
      <Navbar onSearchClick={() => setShowSearch(true)} />
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      {/* Backdrop Hero */}
      <div className="relative w-full h-[55vh] sm:h-[65vh] bg-[var(--bg2)] overflow-hidden">
        {series.backdropPath && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${series.backdropPath})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/20 to-transparent" />

        {/* Back button */}
        <div className="absolute top-24 left-4 sm:left-6 z-30">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-[var(--border)] text-sm font-semibold hover:bg-black/80 backdrop-blur-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
        </div>

        {/* Poster + Title */}
        <div className="absolute inset-x-0 bottom-0 z-20 max-w-[1400px] mx-auto px-4 sm:px-6 pb-8 flex flex-col sm:flex-row items-end gap-6">
          <div className="relative w-32 sm:w-44 aspect-[2/3] rounded-xl overflow-hidden border-2 border-[var(--border)] shadow-2xl flex-shrink-0">
            <Image src={series.posterPath} alt={series.title} fill className="object-cover" priority />
          </div>
          <div className="flex-grow pb-2">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">{series.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-[var(--gold)] fill-current" />
                <span className="font-bold text-white">{series.rating.toFixed(1)}</span>
              </span>
              {series.releaseDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {series.releaseDate.substring(0, 4)}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/20 text-blue-400 font-bold uppercase text-[10px] tracking-wider">
                Series
              </span>
              {seasons.length > 0 && (
                <span className="flex items-center gap-1 text-[var(--text-muted)]">
                  <Tv className="w-3.5 h-3.5" />
                  {seasons.length} Season{seasons.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left 2 cols */}
        <div className="lg:col-span-2 space-y-8">

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* PRIMARY: Watch Now */}
            <Link
              href={`/watch/series/${series.id}`}
              className="flex items-center gap-2.5 px-8 py-3.5 bg-[var(--red)] hover:bg-[var(--red)]/90 text-white font-black rounded-full transition-all duration-200 hover:scale-105 shadow-[0_0_20px_var(--red-glow)] text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Now
            </Link>

            {/* Watchlist */}
            <button
              onClick={toggleWatchlist}
              className={`flex items-center gap-2 px-6 py-3.5 font-bold rounded-full border transition-all hover:scale-105 text-sm ${
                inWatchlist
                  ? "bg-green-950/20 border-green-500/40 text-green-400"
                  : "bg-[var(--bg3)] border-[var(--border2)] text-white hover:bg-[var(--card-hover)]"
              }`}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
            </button>
          </div>

          {/* Overview */}
          {series.overview && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Overview</h2>
              <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">{series.overview}</p>
            </div>
          )}

          {/* Genres */}
          {series.genres.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Genres</h2>
              <div className="flex flex-wrap gap-2">
                {series.genres.map(g => (
                  <span key={g} className="px-3 py-1.5 rounded-lg bg-[var(--bg3)] border border-[var(--border2)] text-xs font-semibold text-[var(--text-muted)]">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Seasons List */}
          {seasons.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-2">
                <Tv className="w-3.5 h-3.5 text-blue-400" />
                Seasons
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {seasons.map(season => (
                  <Link
                    key={season.seasonNumber}
                    href={`/watch/series/${series.id}?s=${season.seasonNumber}&e=1`}
                    className="p-3 rounded-xl bg-[var(--bg3)] border border-[var(--border)] hover:border-[var(--border2)] hover:bg-[var(--card-hover)] transition-all group"
                  >
                    {season.posterPath ? (
                      <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden mb-2 border border-[var(--border)]">
                        <Image src={season.posterPath} alt={season.name} fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-[2/3] rounded-lg bg-[var(--bg2)] mb-2 flex items-center justify-center border border-[var(--border)]">
                        <Tv className="w-8 h-8 text-[var(--text-dim)]" />
                      </div>
                    )}
                    <p className="text-xs font-bold text-white truncate">{season.name}</p>
                    <p className="text-[10px] text-[var(--text-dim)]">{season.episodeCount} ep</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Quick start CTA */}
          <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg3)] p-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[var(--red)]" />
              Start Watching
            </h3>
            <Link
              href={`/watch/series/${series.id}?s=1&e=1`}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[var(--red)] hover:bg-[var(--red)]/90 text-white font-black text-sm transition-all hover:scale-[1.02] shadow-[0_0_16px_var(--red-glow)]"
            >
              <Play className="w-4 h-4 fill-current" />
              Season 1, Episode 1
            </Link>
            {seasons.length > 1 && (
              <p className="text-[11px] text-[var(--text-dim)] text-center">
                {seasons.length} seasons available
              </p>
            )}
          </div>

          {/* Details info */}
          <div className="rounded-xl bg-[var(--bg3)] border border-[var(--border)] p-5 space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Details</h3>
            {series.releaseDate && (
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-dim)] font-semibold uppercase tracking-wider">First Air</span>
                <span className="text-[var(--text-muted)]">{series.releaseDate.substring(0, 10)}</span>
              </div>
            )}
            {seasons.length > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-dim)] font-semibold uppercase tracking-wider">Seasons</span>
                <span className="text-[var(--text-muted)]">{seasons.length}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-dim)] font-semibold uppercase tracking-wider">Rating</span>
              <span className="text-[var(--gold)] font-bold">★ {series.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Recommendations rail */}
      {recommendations.length > 0 && (
        <div className="mt-12">
          <ContentRail
            title="More Like This"
            icon={<Play className="w-3.5 h-3.5 text-blue-400" />}
          >
            {recommendations.slice(0, 12).map(rec => (
              <div key={rec.id} className="w-[120px] sm:w-[140px] md:w-[160px] flex-shrink-0">
                <MediaCard
                  id={rec.id}
                  title={rec.title}
                  posterPath={rec.posterPath}
                  rating={rec.rating}
                  type="series"
                  releaseDate={rec.releaseDate}
                />
              </div>
            ))}
          </ContentRail>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
