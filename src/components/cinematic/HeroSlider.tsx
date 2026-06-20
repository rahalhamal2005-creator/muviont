"use client";

import { useState, useEffect } from "react";
import { Play, Info, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { TMDBMedia } from "@/lib/providers/tmdb.provider";

interface HeroSliderProps {
  items: TMDBMedia[];
  onPlayTrailer: (id: string, title: string) => void;
}

export default function HeroSlider({ items, onPlayTrailer }: HeroSliderProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Auto-advance slides every 7 seconds
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[index];

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <div className="relative w-full h-[85vh] sm:h-[90vh] bg-black overflow-hidden select-none">
      {/* Dynamic Slide Background with Fade Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${current.backdropPath})` }}
          />

          {/* Premium Gradient Overlay mapping Netflix/AppleTV+ aesthetics */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40 z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-radial-at-b from-transparent via-transparent to-black/60 z-10" />
        </motion.div>
      </AnimatePresence>

      {/* Slide Text Content & Controls */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end pb-16 sm:pb-24 max-w-7xl mx-auto px-6 w-full pointer-events-none">
        <div className="max-w-2xl pointer-events-auto">
          {/* Genre Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mb-4"
          >
            {current.genres.map((g: string) => (
              <span
                key={g}
                className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-500 bg-red-950/30 border border-red-800/30 rounded-full"
              >
                {g}
              </span>
            ))}
            <span className="px-2 py-0.5 text-xs font-bold text-neutral-400 border border-neutral-700 rounded bg-neutral-900/60 uppercase">
              {current.type === "movie" ? "Movie" : "Series"}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md font-sans"
          >
            {current.title}
          </motion.h1>

          {/* Overview */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm sm:text-base text-neutral-300 leading-relaxed mb-8 drop-shadow-sm max-w-xl"
          >
            {current.overview.length > 200 
              ? `${current.overview.substring(0, 200)}...` 
              : current.overview}
          </motion.p>

          {/* Premium Glassmorphic Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center gap-4"
          >
            {/* Play Trailer Button */}
            <button
              onClick={() => onPlayTrailer(current.id, current.title)}
              className="flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_25px_rgba(255,0,0,0.4)]"
            >
              <Play className="w-5 h-5 fill-current" />
              Play Trailer
            </button>

            {/* More Info */}
            <Link
              href={`/${current.type}/${current.id}`}
              className="flex items-center gap-2 px-6 py-4 bg-zinc-900/80 text-white border border-zinc-800 font-bold rounded-full hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-md"
            >
              <Info className="w-5 h-5" />
              More Info
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Manual Slide Controls */}
      {items.length > 1 && (
        <div className="absolute bottom-8 right-6 z-20 flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="p-3 rounded-full bg-neutral-900/60 border border-neutral-800 text-white/80 hover:bg-neutral-800 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 backdrop-blur-sm"
            aria-label="Previous Slide"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-3 rounded-full bg-neutral-900/60 border border-neutral-800 text-white/80 hover:bg-neutral-800 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 backdrop-blur-sm"
            aria-label="Next Slide"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
