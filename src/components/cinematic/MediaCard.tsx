"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Plus, Check, Star } from "lucide-react";
import { useState } from "react";

interface MediaCardProps {
  id: string;
  title: string;
  posterPath: string;
  rating: number;
  type: "movie" | "series" | "anime";
  releaseDate?: string;
  rank?: number;
  progress?: number;
  duration?: number;
  onClick?: () => void;
}

export default function MediaCard({
  id, title, posterPath, rating, type, releaseDate,
  rank, progress, duration, onClick,
}: MediaCardProps) {
  const routeType = type === "anime" ? "anime" : type === "series" ? "series" : "movie";
  const watchHref = `/watch/${routeType}/${id}`;
  const detailHref = `/${routeType}/${id}`;
  const [inList, setInList] = useState(false);

  const progressPct = (progress && duration && duration > 0)
    ? Math.min(100, Math.round((progress / duration) * 100))
    : null;

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const key = "muviont_watchlist";
    const wl = JSON.parse(localStorage.getItem(key) || "[]");
    if (inList) {
      localStorage.setItem(key, JSON.stringify(wl.filter((i: any) => i.id !== id)));
      setInList(false);
    } else {
      localStorage.setItem(key, JSON.stringify([...wl, { id, title, posterPath, rating, type, releaseDate }]));
      setInList(true);
    }
    if (onClick) onClick();
  };

  return (
    <Link
      href={detailHref}
      className="relative block rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] select-none group cursor-pointer flex-shrink-0 card-glow-hover transition-all duration-300"
      style={{ aspectRatio: "2/3" }}
    >
      {/* Top Overlay Badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
        {/* Rating Badge */}
        <div className={`flex items-center gap-1 bg-black/75 border border-white/15 px-2 py-0.5 rounded-md backdrop-blur-md shadow-md ${rank && rank <= 10 ? 'ml-[34px]' : ''}`}>
          <Star className="w-3 h-3 text-[var(--red)] fill-current" />
          <span className="text-[10px] font-extrabold text-white">{rating.toFixed(1)}</span>
        </div>

        {/* Type Badge */}
        <span className="text-[9px] font-black uppercase tracking-wider text-neutral-200 bg-black/75 border border-white/15 px-1.5 py-0.5 rounded-md backdrop-blur-md">
          {type}
        </span>
      </div>

      {/* Rank badge overlay */}
      {rank && rank <= 10 && (
        <div className="absolute top-2.5 left-2.5 z-25 w-7 h-7 rounded-md bg-[var(--red)] flex items-center justify-center text-white text-[11px] font-black shadow-xl border border-white/20">
          {rank}
        </div>
      )}

      {/* Poster */}
      <Image
        src={posterPath || `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop`}
        alt={title}
        fill
        sizes="(max-width: 640px) 42vw, (max-width: 1024px) 22vw, 13vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        unoptimized
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10 transition-opacity duration-300" />

      {/* Hover Action Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/65 backdrop-blur-[2px]">
        <Link
          href={watchHref}
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-black rounded-md transition-all duration-200 hover:scale-105 shadow-xl"
        >
          <Play className="w-3.5 h-3.5 fill-black text-black" />
          {progressPct !== null ? "Resume" : "Watch Now"}
        </Link>
        <button
          onClick={handleWatchlist}
          className="flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-md border border-white/20 backdrop-blur-md transition-all active:scale-95"
        >
          {inList ? <Check className="w-3 h-3 text-red-400" /> : <Plus className="w-3 h-3" />}
          {inList ? "In List" : "+ Watchlist"}
        </button>
      </div>

      {/* Bottom Title & Meta Info */}
      <div className="absolute inset-x-0 bottom-0 p-3 z-10 pointer-events-none">
        {/* Title with clean multi-line truncation */}
        <p className="text-xs font-extrabold text-white leading-snug line-clamp-2 break-words group-hover:text-[var(--red)] transition-colors duration-200 drop-shadow-md">
          {title}
        </p>

        {/* Year */}
        {releaseDate && (
          <p className="text-[10px] text-neutral-400 font-medium mt-1">
            {releaseDate.substring(0, 4)}
          </p>
        )}

        {/* Continue Watching progress bar */}
        {progressPct !== null && (
          <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--red)] rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Top Type Accent Strip */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 z-20 ${
        type === "anime" ? "bg-purple-500" : type === "series" ? "bg-blue-500" : "bg-[var(--red)]"
      }`} />
    </Link>
  );
}
