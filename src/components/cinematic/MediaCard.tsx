"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

interface MediaCardProps {
  id: string;
  title: string;
  posterPath: string;
  rating: number;
  type: "movie" | "series" | "anime";
  releaseDate?: string;
  onClick?: () => void;
}

export default function MediaCard({ id, title, posterPath, rating, type, releaseDate, onClick }: MediaCardProps) {
  // Determine standard route type for Next.js router
  const routeType = type === "anime" ? "anime" : type === "movie" ? "movie" : "series";

  return (
    <Link
      href={`/${routeType}/${id}`}
      onClick={onClick}
      className="block relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-neutral-900 bg-neutral-950/40 select-none group cursor-pointer"
    >
      {/* Background Poster Image */}
      <Image
        src={posterPath}
        alt={title}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        priority={false}
      />

      {/* Cinematic dark shade gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 z-10 transition-opacity duration-300 group-hover:opacity-95" />

      {/* Media Details Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 z-20 flex flex-col justify-end transform transition-transform duration-300">
        {/* Rating and Type Badges */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded border border-neutral-800 backdrop-blur-sm">
            <Star className="w-3 h-3 text-red-500 fill-current" />
            <span className="text-[10px] font-bold text-white">{rating.toFixed(1)}</span>
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-800">
            {type}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-white leading-tight truncate group-hover:text-red-500 transition-colors duration-200">
          {title}
        </h3>

        {/* Release Year if present */}
        {releaseDate && (
          <p className="text-[10px] text-neutral-500 mt-1">
            {releaseDate.substring(0, 4)}
          </p>
        )}
      </div>

      {/* Premium Glow Highlight Border on Hover */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-red-600/50 rounded-lg pointer-events-none transition-all duration-300 shadow-[inset_0_0_20px_rgba(255,0,0,0)] group-hover:shadow-[inset_0_0_15px_rgba(255,0,0,0.3)] z-30" />
    </Link>
  );
}
