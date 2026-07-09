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
      {/* Poster */}
      <Image
        src={posterPath || `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop`}
        alt={title}
        fill
        sizes="(max-width: 640px) 42vw, (max-width: 1024px) 22vw, 13vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        unoptimized={posterPath?.includes("unsplash") || posterPath?.includes("tmdb")}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent z-10 transition-opacity duration-300" />

      {/* Hover Action Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50">
        <Link
          href={watchHref}
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--red)] hover:bg-[var(--red)]/90 text-white text-sm font-bold rounded-full shadow-[0_0_20px_var(--red-glow)] transition-all hover:scale-105"
        >
          <Play className="w-4 h-4 fill-current" />
          {progressPct !== null ? "Resume" : "Watch Now"}
        </Link>
        <button
          onClick={handleWatchlist}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-full border border-white/20 backdrop-blur-sm transition-all"
        >
          {inList ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {inList ? "In List" : "+ List"}
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute inset-x-0 bottom-0 p-3 z-10 pointer-events-none">
        {/* Rating badge */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
            <Star className="w-2.5 h-2.5 text-[var(--red)] fill-current" />
            <span className="text-[10px] font-bold text-white">{rating.toFixed(1)}</span>
          </div>
          <span className="text-[8px] font-extrabold uppercase tracking-widest text-[var(--text-dim)] bg-black/60 px-1.5 py-0.5 rounded">
            {type}
          </span>
        </div>

        {/* Title */}
        <p className="text-xs font-bold text-white leading-tight line-clamp-2 group-hover:text-[var(--red)] transition-colors duration-200">
          {title}
        </p>

        {/* Year */}
        {releaseDate && (
          <p className="text-[9px] text-[var(--text-dim)] mt-0.5">
            {releaseDate.substring(0, 4)}
          </p>
        )}

        {/* Continue Watching progress bar */}
        {progressPct !== null && (
          <div className="mt-2 h-1 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--red)] rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Rank badge */}
      {rank && rank <= 10 && (
        <div className="absolute top-2 left-2 z-20 w-7 h-7 rounded-full bg-[var(--red)] flex items-center justify-center text-white text-[10px] font-black shadow-lg">
          {rank}
        </div>
      )}

      {/* Type color strip */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 z-20 ${
        type === "anime" ? "bg-purple-500" : type === "series" ? "bg-blue-500" : "bg-[var(--red)]"
      }`} />
    </Link>
  );
}
