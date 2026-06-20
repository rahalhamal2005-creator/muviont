"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Calendar, Play, Info, Heart } from "lucide-react";
import StreamingPlayer from "@/components/cinematic/StreamingPlayer";
import MediaCard from "@/components/cinematic/MediaCard";
import Navbar from "@/components/cinematic/Navbar";
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

  const rawId  = getRawTmdbId(movie.id);
  const embedUrl = buildMovieEmbedUrl(rawId, sourceIndex);

  return (
    <div className="bg-[var(--bg)] min-h-screen text-white pb-12">
      <Navbar onSearchClick={() => setShowSearch(true)} />
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      <div className="pt-[var(--navbar-h)] max-w-[1400px] mx-auto px-4 sm:px-6">

        {/* Back button */}
        <div className="py-4">
          <Link
            href={`/movie/${movie.id}`}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Details
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

          {/* Main: Player + info */}
          <div className="space-y-5">
            {/* Title row */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{movie.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-[var(--gold)] fill-current" />
                  <span className="font-bold text-white">{movie.rating.toFixed(1)}</span>
                </span>
                {movie.releaseDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {movie.releaseDate.substring(0, 4)}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md bg-[var(--red)]/15 text-[var(--red)] text-xs font-bold uppercase border border-[var(--red)]/20">
                  Movie
                </span>
                {movie.genres.slice(0, 3).map(g => (
                  <span key={g} className="px-2 py-0.5 rounded-md bg-[var(--bg3)] text-[var(--text-muted)] text-xs border border-[var(--border)]">
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Streaming Player */}
            <StreamingPlayer
              embedUrl={embedUrl}
              title={movie.title}
              sourceIndex={sourceIndex}
              onSourceChange={setSourceIndex}
            />

            {/* Overview */}
            {movie.overview && (
              <div className="p-4 rounded-xl bg-[var(--bg3)] border border-[var(--border)]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-[var(--red)]" />
                  About
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{movie.overview}</p>
              </div>
            )}
          </div>

          {/* Sidebar: Poster + Meta + Recommendations */}
          <div className="space-y-6">
            {/* Movie Poster Card */}
            <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)]">
              <div className="relative w-full aspect-[2/3]">
                <Image
                  src={movie.posterPath}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="p-4 space-y-3">
                <Link
                  href={`/movie/${movie.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--bg3)] border border-[var(--border2)] text-sm font-semibold text-[var(--text-muted)] hover:text-white hover:bg-[var(--card-hover)] transition-colors"
                >
                  <Info className="w-4 h-4" />
                  Full Details
                </Link>
              </div>
            </div>

            {/* More Like This */}
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
                      type="movie"
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
