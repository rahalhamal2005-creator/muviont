"use client";

import { useState, useEffect } from "react";
import { Play, Info, ArrowLeft, ArrowRight, Star, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { TMDBMedia } from "@/lib/providers/tmdb.provider";

interface HeroSliderProps {
  items: TMDBMedia[];
  onPlayTrailer?: (id: string, title: string) => void;
}

export default function HeroSlider({ items, onPlayTrailer: _onPlayTrailer }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [items.length, paused]);

  if (items.length === 0) return null;

  const current = items[index];
  const routeType = current.type === "movie" ? "movie" : "series";

  return (
    <div
      className="relative w-full overflow-hidden select-none min-h-[85vh] sm:min-h-[75vh] md:min-h-[80vh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Backdrop Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-top bg-no-repeat"
            style={{ backgroundImage: `url(${current.backdropPath || current.posterPath})` }}
          />
          {/* Cinematic dark gradient overlay */}
          <div
            className="absolute inset-0 z-10"
            style={{
              background: "linear-gradient(180deg, rgba(15,15,15,0.2) 0%, rgba(15,15,15,0.65) 50%, #0f0f0f 100%)"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent z-10" />
        </motion.div>
      </AnimatePresence>

      {/* Hero Content */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 w-full pb-16 sm:pb-24">
          <div className="max-w-2xl">

            {/* Badges */}
            <motion.div
              key={`${current.id}-badges`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-wrap items-center gap-2 mb-3"
            >
              <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-md border text-[var(--red)] bg-[var(--red-dim)] border-[var(--red)]/20">
                {current.type === "movie" ? "Movie" : "Series"}
              </span>
              {current.genres.slice(0, 3).map(g => (
                <span key={g} className="px-2.5 py-1 text-[11px] font-semibold text-neutral-300 bg-white/10 border border-white/15 rounded-md uppercase tracking-wider backdrop-blur-md">
                  {g}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded-md border border-white/20 text-[11px] font-bold text-neutral-400 uppercase tracking-wider backdrop-blur-sm">
                4K UHD
              </span>
              <span className="px-2 py-0.5 rounded-md border border-white/20 text-[11px] font-bold text-neutral-400 uppercase tracking-wider backdrop-blur-sm">
                5.1 AUDIO
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              key={`${current.id}-title`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none mb-3 drop-shadow-2xl"
            >
              {current.title}
            </motion.h1>

            {/* Meta row */}
            <motion.div
              key={`${current.id}-meta`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 mb-3 text-sm"
            >
              <span className="flex items-center gap-1.5 text-[var(--red)] font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                {current.rating.toFixed(1)}
              </span>
              {current.releaseDate && (
                <span className="flex items-center gap-1 text-[var(--text-muted)]">
                  <Calendar className="w-3.5 h-3.5" />
                  {current.releaseDate.substring(0, 4)}
                </span>
              )}
            </motion.div>

            {/* Overview */}
            <motion.p
              key={`${current.id}-overview`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-sm sm:text-base text-neutral-300 leading-relaxed mb-6 max-w-lg line-clamp-3"
            >
              {current.overview}
            </motion.p>

            {/* Action Row — Enterprise Netflix Style */}
            <motion.div
              key={`${current.id}-ctas`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex items-center gap-3"
            >
              {/* Primary: Watch Now (Solid White, Black Bold Text, 6px Radius) */}
              <Link
                href={`/watch/${routeType}/${current.id}`}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-neutral-200 text-black font-black rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-95 text-sm shadow-xl"
              >
                <Play className="w-4 h-4 fill-black text-black" />
                Watch Now
              </Link>

              {/* Secondary: More Info (Frosted Glass 6px Radius) */}
              <Link
                href={`/${routeType}/${current.id}`}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold rounded-md backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 text-sm"
              >
                <Info className="w-4 h-4" />
                More Info
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Slide Controls */}
      {items.length > 1 && (
        <>
          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === index ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Arrow buttons */}
          <button
            onClick={() => setIndex(p => (p - 1 + items.length) % items.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60 transition-all backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIndex(p => (p + 1) % items.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60 transition-all backdrop-blur-sm"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
