"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Plus, Check, Star, Tv, ArrowLeft, Users } from "lucide-react";
import Navbar from "./Navbar";
import TrailerModal from "./TrailerModal";
import AISearchInput from "./AISearchInput";
import { AniListMedia } from "@/lib/providers/anilist.provider";

interface AnimeDetailClientProps {
  anime: AniListMedia;
}

export default function AnimeDetailClient({ anime }: AnimeDetailClientProps) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    // Check if anime exists in watchlist
    const watchlist = JSON.parse(localStorage.getItem("muviont_watchlist") || "[]");
    setInWatchlist(watchlist.some((item: any) => item.id === anime.id));

    // Log recently viewed anime
    const viewed = JSON.parse(localStorage.getItem("muviont_viewed") || "[]");
    const filtered = viewed.filter((item: any) => item.id !== anime.id);
    const updated = [anime, ...filtered].slice(0, 10);
    localStorage.setItem("muviont_viewed", JSON.stringify(updated));
  }, [anime]);

  const toggleWatchlist = () => {
    const watchlist = JSON.parse(localStorage.getItem("muviont_watchlist") || "[]");
    let updated = [];

    if (inWatchlist) {
      updated = watchlist.filter((item: any) => item.id !== anime.id);
      setInWatchlist(false);
    } else {
      updated = [...watchlist, {
        id: anime.id,
        title: anime.title,
        posterPath: anime.posterPath,
        rating: anime.rating,
        type: "anime",
        releaseDate: anime.releaseDate
      }];
      setInWatchlist(true);
    }

    localStorage.setItem("muviont_watchlist", JSON.stringify(updated));
  };

  return (
    <div className="bg-black min-h-screen text-white pb-20">
      <Navbar onSearchClick={() => setShowSearch(true)} />

      {/* Floating search layer */}
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      {/* Anime Banner */}
      <div className="relative w-full h-[55vh] sm:h-[65vh] bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${anime.backdropPath})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />

        {/* Back navigation button */}
        <div className="absolute top-24 left-6 z-30">
          <Link
            href="/anime"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-neutral-800 text-sm font-semibold hover:bg-neutral-900 backdrop-blur-sm transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Anime Hub
          </Link>
        </div>

        {/* Header content overlay */}
        <div className="absolute inset-x-0 bottom-0 z-20 max-w-7xl mx-auto px-6 pb-8 flex flex-col sm:flex-row items-end gap-6">
          {/* Poster image */}
          <div className="relative w-36 sm:w-48 aspect-[2/3] rounded-lg overflow-hidden border-2 border-neutral-800 shadow-2xl flex-shrink-0">
            <Image
              src={anime.posterPath}
              alt={anime.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="flex-grow pb-2">
            {/* Romaji & English Titles */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-1">
              {anime.title}
            </h1>
            {anime.englishTitle && anime.englishTitle !== anime.title && (
              <p className="text-sm sm:text-base text-neutral-400 font-medium mb-3">
                {anime.englishTitle}
              </p>
            )}

            {/* Badges metadata row */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-neutral-400 font-medium">
              <div className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-850">
                <Star className="w-3.5 h-3.5 text-red-500 fill-current" />
                <span className="font-bold text-white">{anime.rating.toFixed(1)}</span>
              </div>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Tv className="w-3.5 h-3.5" />
                {anime.episodes} Episodes
              </span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 uppercase text-[10px] tracking-wider text-red-400 font-bold">
                ANIME
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details grid */}
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">
        
        {/* Left Columns: Storyline, Roster */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-4">
            {/* PRIMARY: Watch Now — streaming-first */}
            <Link
              href={`/watch/anime/${anime.id}`}
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

          {/* Storyline */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-3">
              Synopsis
            </h2>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              {anime.overview || "No synopsis is currently available."}
            </p>
          </div>

          {/* Airing Information Calendar Widget if Airing Now */}
          {anime.nextAiringEpisode && (
            <div className="p-5 rounded-xl border border-red-950/30 bg-red-950/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-1">
                  Next Airing Episode
                </span>
                <span className="text-sm font-bold text-white">
                  Episode {anime.nextAiringEpisode.episode}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-400 block">Airing At</span>
                <span className="text-xs font-semibold text-neutral-300">
                  {new Date(anime.nextAiringEpisode.airingAt * 1000).toLocaleString("en-US", {
                    weekday: "short",
                    hour: "numeric",
                    minute: "2-digit"
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Character Roster */}
          {anime.characters && anime.characters.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Featured Characters
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {anime.characters.map((char: any) => (
                  <div key={char.name} className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 text-center flex flex-col items-center">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border border-neutral-800 mb-2">
                      <Image
                        src={char.image}
                        alt={char.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs font-bold text-white truncate w-full">{char.name}</p>
                    <p className="text-[9px] uppercase tracking-wider text-neutral-500 mt-1">{char.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Metadata Column */}
        <div className="space-y-8">
          
          <div className="p-6 rounded-xl border border-neutral-900 bg-neutral-950/40 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-red-500">
              Anime Metadata
            </h3>

            {anime.studios && anime.studios.length > 0 && (
              <div>
                <p className="text-[10px] uppercase text-neutral-500 font-bold">Studio</p>
                <p className="text-sm font-bold text-white mt-0.5">{anime.studios.join(", ")}</p>
              </div>
            )}

            <div>
              <p className="text-[10px] uppercase text-neutral-500 font-bold">Status</p>
              <p className="text-sm font-bold text-white mt-0.5 uppercase tracking-wide">{anime.status}</p>
            </div>

            {anime.season && (
              <div>
                <p className="text-[10px] uppercase text-neutral-500 font-bold">Season</p>
                <p className="text-sm font-bold text-white mt-0.5 uppercase">{anime.season}</p>
              </div>
            )}

            <div>
              <p className="text-[10px] uppercase text-neutral-500 font-bold">Genres</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {anime.genres.map((g: string) => (
                  <span key={g} className="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 font-medium">
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase text-neutral-500 font-bold">Start Date</p>
              <p className="text-sm font-bold text-white mt-0.5">{anime.releaseDate}</p>
            </div>
          </div>

        </div>
      </main>

      {/* Trailer Modal Player */}
      <TrailerModal
        videoId={anime.trailerUrl || ""}
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
      />
    </div>
  );
}
