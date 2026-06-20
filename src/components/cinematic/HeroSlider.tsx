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

export default function HeroSlider({ items, onPlayTrailer }: HeroSliderProps) {
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
      className="relative w-full overflow-hidden select-none"
      style={{ height: "88vh", minHeight: 500 }}
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
          {/* Cinematic gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[var(--bg)] to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Hero Content */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 w-full pb-20 sm:pb-28">
          <div className="max-w-2xl">

            {/* Badges */}
            <motion.div
              key={`${current.id}-badges`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-wrap items-center gap-2 mb-3"
            >
              <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${
                current.type === "movie"
                  ? "text-[var(--red)] bg-[var(--red-dim)] border-[var(--red)]/20"
                  : "text-blue-400 bg-blue-500/10 border-blue-500/20"
              }`}>
                {current.type === "movie" ? "Movie" : "Series"}
              </span>
              {current.genres.slice(0, 3).map(g => (
                <span key={g} className="px-2.5 py-1 text-[10px] font-semibold text-[var(--text-muted)] bg-white/6 border border-[var(--border)] rounded-md uppercase tracking-wider">
                  {g}
                </span>
              ))}
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
              <span className="flex items-center gap-1.5 text-[var(--gold)] font-bold">
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
              className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed mb-6 max-w-lg"
            >
              {current.overview.length > 180
                ? `${current.overview.substring(0, 180)}…`
                : current.overview}
            </motion.p>

            {/* CTA Buttons — Watch Now is PRIMARY */}
            <motion.div
              key={`${current.id}-ctas`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap items-center gap-3"
            >
              {/* Primary: Watch Now */}
              <Link
                href={`/watch/${routeType}/${current.id}`}
                className="flex items-center gap-2.5 px-7 py-3.5 bg-[var(--red)] hover:bg-[var(--red)]/90 text-white font-black rounded-full transition-all duration-200 hover:scale-105 shadow-[0_0_30px_var(--red-glow)] text-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Now
              </Link>

              {/* Secondary: More Info */}
              <Link
                href={`/${routeType}/${current.id}`}
                className="flex items-center gap-2 px-6 py-3.5 bg-white/8 border border-[var(--border2)] text-white font-bold rounded-full hover:bg-white/14 transition-all duration-200 hover:scale-105 backdrop-blur-md text-sm"
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
