"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Plus, Check, Star, Calendar, ArrowLeft, MessageSquare } from "lucide-react";
import Navbar from "./Navbar";
import MediaCard from "./MediaCard";
import TrailerModal from "./TrailerModal";
import AISearchInput from "./AISearchInput";
import { TMDBMedia } from "@/lib/providers/tmdb.provider";

interface MovieDetailClientProps {
  movie: TMDBMedia;
  recommendations: TMDBMedia[];
}

export default function MovieDetailClient({ movie, recommendations }: MovieDetailClientProps) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [trailerId, setTrailerId] = useState<string>(movie.trailerUrl || "");

  useEffect(() => {
    // 1. Check if movie exists in local storage watchlist
    const watchlist = JSON.parse(localStorage.getItem("muviont_watchlist") || "[]");
    setInWatchlist(watchlist.some((item: any) => item.id === movie.id));

    // 2. Add movie to recently viewed local history logs
    const viewed = JSON.parse(localStorage.getItem("muviont_viewed") || "[]");
    const filtered = viewed.filter((item: any) => item.id !== movie.id);
    const updated = [movie, ...filtered].slice(0, 10);
    localStorage.setItem("muviont_viewed", JSON.stringify(updated));
  }, [movie]);

  const toggleWatchlist = () => {
    const watchlist = JSON.parse(localStorage.getItem("muviont_watchlist") || "[]");
    let updated = [];

    if (inWatchlist) {
      updated = watchlist.filter((item: any) => item.id !== movie.id);
      setInWatchlist(false);
    } else {
      updated = [...watchlist, movie];
      setInWatchlist(true);
    }

    localStorage.setItem("muviont_watchlist", JSON.stringify(updated));
  };

  const handlePlayTrailer = async () => {
    setIsTrailerOpen(true);
    if (trailerId) return;
    setTrailerId("loading");
    try {
      const res = await fetch(`/api/trailer?id=${movie.id}&title=${encodeURIComponent(movie.title)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.trailerUrl) {
          setTrailerId(data.trailerUrl);
          return;
        }
      }
    } catch {
      // ignore
    }
    setTrailerId("");
  };

  return (
    <div className="bg-black min-h-screen text-white pb-20">
      <Navbar onSearchClick={() => setShowSearch(true)} />

      {/* Floating search layer */}
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      {/* Fullscreen Backdrop Section */}
      <div className="relative w-full h-[55vh] sm:h-[65vh] bg-black">
        {/* Background Backdrop Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${movie.backdropPath})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />

        {/* Back navigation button */}
        <div className="absolute top-24 left-6 z-30">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-neutral-800 text-sm font-semibold hover:bg-neutral-900 backdrop-blur-sm transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Details Heading overlay */}
        <div className="absolute inset-x-0 bottom-0 z-20 max-w-7xl mx-auto px-6 pb-8 flex flex-col sm:flex-row items-end gap-6">
          {/* Poster image */}
          <div className="relative w-36 sm:w-48 aspect-[2/3] rounded-lg overflow-hidden border-2 border-neutral-800 shadow-2xl flex-shrink-0">
            <Image
              src={movie.posterPath}
              alt={movie.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="flex-grow pb-2">
            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
              {movie.title}
            </h1>

            {/* Badges metadata row */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-neutral-400 font-medium">
              <div className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-850">
                <Star className="w-3.5 h-3.5 text-red-500 fill-current" />
                <span className="font-bold text-white">{movie.rating.toFixed(1)}</span>
              </div>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {movie.releaseDate.substring(0, 4)}
              </span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 uppercase text-[10px] tracking-wider text-red-400 font-bold">
                {movie.type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details layout grid */}
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">
        
        {/* Left 2 Columns: Description, Cast, Reviews */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Action buttons bar */}
          <div className="flex flex-wrap items-center gap-4">
            {/* PRIMARY: Watch Now — streaming-first */}
            <Link
              href={`/watch/movie/${movie.id}`}
              className="flex items-center gap-2 px-8 py-3.5 bg-[var(--red)] hover:bg-[var(--red)]/90 text-white font-black rounded-full transition-all duration-300 shadow-[0_0_20px_var(--red-glow)] hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Now
            </Link>

            <button
              onClick={toggleWatchlist}
              className={`flex items-center gap-2 px-6 py-3.5 font-semibold rounded-full border transition-all duration-300 backdrop-blur-sm hover:scale-105 active:scale-95 ${
                inWatchlist
                  ? "bg-emerald-950/20 border-emerald-500/50 text-emerald-400"
                  : "bg-neutral-900/60 border-neutral-800 text-white hover:bg-neutral-800"
              }`}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
            </button>
          </div>

          {/* Storyline Overview */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-3">
              Storyline
            </h2>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              {movie.overview || "No storyline details are currently available for this title."}
            </p>
          </div>

          {/* Cast Details Section */}
          {movie.cast && movie.cast.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4">
                Principal Cast
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {movie.cast.map((actor: string, idx: number) => (
                  <div key={actor} className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-650/10 border border-red-900/30 flex items-center justify-center font-bold text-red-500 mx-auto mb-2 shadow-[0_0_10px_rgba(255,0,0,0.1)]">
                      {actor.substring(0, 2)}
                    </div>
                    <p className="text-xs font-bold text-white truncate">{actor}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">As Character {idx + 1}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar/Recommended Movies */}
          {recommendations.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4">
                More Like This
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {recommendations.slice(0, 3).map((rec) => (
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

        {/* Right 1 Column: Metadata & Reviews Panel */}
        <div className="space-y-8">
          
          {/* Metadata Block Card */}
          <div className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/40 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-red-500">
              Media Information
            </h3>
            
            {movie.director && (
              <div>
                <p className="text-[10px] uppercase text-neutral-500 font-bold">Director</p>
                <p className="text-sm font-bold text-white mt-0.5">{movie.director}</p>
              </div>
            )}

            <div>
              <p className="text-[10px] uppercase text-neutral-500 font-bold">Genres</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {movie.genres.map((g: string) => (
                  <span key={g} className="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 font-medium">
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase text-neutral-500 font-bold">Release Date</p>
              <p className="text-sm font-bold text-white mt-0.5">{movie.releaseDate}</p>
            </div>
          </div>

          {/* Reviews Row Panel */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-red-500" />
              Community Reviews
            </h3>

            {/* Static review mockups */}
            <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300">Cinephile_99</span>
                <span className="text-[10px] text-red-500 font-bold">★ 9.0</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Absolute masterpiece of cinematic storytelling. The visuals and sound design deserve all possible awards. Highly recommended.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300">ScreenWatcher</span>
                <span className="text-[10px] text-red-500 font-bold">★ 8.0</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Great pacing and solid direction from Villeneuve. A visual wonder.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Trailer Modal Player */}
      <TrailerModal
        videoId={movie.trailerUrl || trailerId || ""}
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
      />
    </div>
  );
}
