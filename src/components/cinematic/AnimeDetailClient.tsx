"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Plus, Check, Star, Tv, ArrowLeft } from "lucide-react";
import Navbar from "./Navbar";
import TrailerModal from "./TrailerModal";
import AISearchInput from "./AISearchInput";
import BottomNav from "./BottomNav";
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
    <div className="bg-black min-h-screen text-white pb-24 font-sans selection:bg-purple-650 selection:text-white">
      <Navbar onSearchClick={() => setShowSearch(true)} />

      {/* Floating search layer */}
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      {/* Anime Banner */}
      <div className="relative w-full h-[70vh] sm:h-[80vh] bg-neutral-950 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 filter blur-[1px] md:blur-0 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: `url(${anime.backdropPath})` }}
        />
        
        {/* Premium Cinematic Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/35 to-transparent z-10" />
        <div className="absolute inset-0 bg-radial-at-b from-transparent via-black/20 to-black/90 z-10" />

        {/* Back navigation button */}
        <div className="absolute top-24 left-6 z-35">
          <Link
            href="/anime"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-900/80 hover:border-neutral-700 backdrop-blur-md transition-all duration-300 active:scale-95 shadow-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Anime Hub
          </Link>
        </div>

        {/* Header content overlay */}
        <div className="absolute inset-x-0 bottom-0 z-20 max-w-7xl mx-auto px-6 pb-12 flex flex-col md:flex-row items-end gap-8">
          {/* Poster image */}
          <div className="relative w-40 md:w-56 aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex-shrink-0 group hidden md:block">
            <Image
              src={anime.posterPath}
              alt={anime.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
              unoptimized
            />
            {anime.trailerUrl && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                <button 
                  onClick={() => setIsTrailerOpen(true)}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-bold backdrop-blur-sm transition-all"
                >
                  Play Trailer
                </button>
              </div>
            )}
          </div>

          <div className="flex-grow pb-2 z-20">
            {/* Romaji & English Titles */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              {anime.title}
            </h1>
            {anime.englishTitle && anime.englishTitle !== anime.title && (
              <p className="text-sm sm:text-base text-neutral-400 font-medium mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {anime.englishTitle}
              </p>
            )}

            {/* Badges metadata row */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-neutral-400 font-medium">
              <div className="flex items-center gap-1 bg-purple-650/15 border border-purple-500/30 px-2.5 py-0.5 rounded-md backdrop-blur-sm">
                <Star className="w-3.5 h-3.5 text-purple-500 fill-current" />
                <span className="font-extrabold text-purple-400">{anime.rating.toFixed(1)}</span>
              </div>
              <span className="text-neutral-700">•</span>
              <span className="flex items-center gap-1 font-semibold text-neutral-300">
                <Tv className="w-3.5 h-3.5 text-neutral-500" />
                {anime.episodes} Episode{anime.episodes !== 1 ? "s" : ""}
              </span>
              <span className="text-neutral-700">•</span>
              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] tracking-wider text-neutral-300 font-extrabold uppercase">
                Anime
              </span>
              <span className="text-neutral-700">•</span>
              <span className="px-1.5 py-0.5 rounded border border-neutral-850 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                SUB & DUB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details grid */}
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
        
        {/* Left Columns: Storyline, Roster */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-4 bg-neutral-950/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            {/* PRIMARY: Watch Now — streaming-first */}
            <Link
              href={`/watch/anime/${anime.id}`}
              className="flex items-center gap-2.5 px-8 py-4 bg-purple-650 hover:bg-purple-600 text-white font-black rounded-full transition-all duration-300 shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.6)] hover:scale-[1.03] active:scale-95 text-sm uppercase tracking-wider"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Now
            </Link>

            <button
              onClick={toggleWatchlist}
              className={`flex items-center gap-2 px-6 py-4 font-bold rounded-full border text-sm uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] active:scale-95 ${
                inWatchlist
                  ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400"
                  : "bg-neutral-900/80 border-neutral-855 text-white hover:bg-neutral-800"
              }`}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
            </button>

            {anime.trailerUrl && (
              <button
                onClick={() => setIsTrailerOpen(true)}
                className="flex items-center gap-2 px-6 py-4 font-bold rounded-full border border-neutral-800 bg-transparent text-neutral-300 hover:text-white hover:bg-neutral-900/50 text-sm uppercase tracking-wider transition-all duration-300 hover:scale-[1.03]"
              >
                Trailer
              </button>
            )}
          </div>

          {/* Storyline */}
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-purple-500">
              Synopsis
            </h2>
            <p className="text-neutral-300 text-base leading-relaxed font-normal">
              {anime.overview || "No synopsis is currently available."}
            </p>
          </div>

          {/* Airing Information Calendar Widget if Airing Now */}
          {anime.nextAiringEpisode && (
            <div className="p-5 rounded-2xl border border-purple-550/20 bg-purple-950/5 flex items-center justify-between backdrop-blur-sm shadow-md">
              <div>
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-1">
                  Next Airing Episode
                </span>
                <span className="text-sm font-bold text-white">
                  Episode {anime.nextAiringEpisode.episode}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-0.5">Airing At</span>
                <span className="text-sm font-semibold text-neutral-300">
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
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-purple-500">
                Featured Characters
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {anime.characters.slice(0, 8).map((char: any) => (
                  <div key={char.name} className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/40 hover:bg-neutral-900/30 hover:border-neutral-800 transition-all duration-300 text-center flex flex-col items-center group">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border border-neutral-800 group-hover:border-purple-500/40 mb-3 transition-colors duration-300">
                      <Image
                        src={char.image}
                        alt={char.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <p className="text-xs font-bold text-neutral-100 group-hover:text-white truncate w-full transition-colors">{char.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1 truncate w-full font-medium">{char.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar Columns */}
        <div className="space-y-8">
          <div className="p-6 rounded-2xl border border-white/5 bg-neutral-950/40 backdrop-blur-md space-y-5 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-purple-500">
              Anime Metadata
            </h3>

            <div className="space-y-3.5 text-xs">
              {anime.studios && anime.studios.length > 0 && (
                <div className="flex justify-between pb-2.5 border-b border-neutral-900">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Studio</span>
                  <span className="text-neutral-200 font-bold max-w-[150px] truncate text-right" title={anime.studios.join(", ")}>{anime.studios[0]}</span>
                </div>
              )}

              <div className="flex justify-between pb-2.5 border-b border-neutral-900">
                <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Airing Status</span>
                <span className="text-neutral-200 font-bold uppercase tracking-wide">{anime.status}</span>
              </div>

              <div className="flex justify-between pb-2.5 border-b border-neutral-900">
                <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Total Episodes</span>
                <span className="text-neutral-200 font-bold">{anime.totalEpisodes ? anime.totalEpisodes : "Ongoing"}</span>
              </div>

              <div className="flex justify-between pb-2.5 border-b border-neutral-900">
                <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Latest Episode</span>
                <span className="text-neutral-200 font-bold">{anime.latestEpisode || anime.episodes || "1"}</span>
              </div>

              {anime.season && (
                <div className="flex justify-between pb-2.5 border-b border-neutral-900">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Season</span>
                  <span className="text-neutral-200 font-bold uppercase">{anime.season}</span>
                </div>
              )}

              <div className="flex justify-between pb-2.5 border-b border-neutral-900">
                <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Start Date</span>
                <span className="text-neutral-200 font-bold">{anime.releaseDate}</span>
              </div>

              <div className="flex justify-between pb-2.5 border-b border-neutral-900">
                <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Rating</span>
                <span className="text-purple-400 font-bold flex items-center gap-0.5">
                  <span>★</span>
                  <span>{anime.rating.toFixed(1)}</span>
                </span>
              </div>

              {anime.genres.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Genres</span>
                  <div className="flex flex-wrap gap-1.5">
                    {anime.genres.map((g: string) => (
                      <span key={g} className="px-2.5 py-0.5 rounded bg-neutral-900 border border-neutral-850 text-[10px] text-neutral-400 font-semibold">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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

      <BottomNav />
    </div>
  );
}
