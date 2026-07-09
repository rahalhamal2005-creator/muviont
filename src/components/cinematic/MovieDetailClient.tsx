"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Plus, Check, Star, Calendar, ArrowLeft, MessageSquare, Sparkles, Loader2, Download } from "lucide-react";
import Navbar from "./Navbar";
import MediaCard from "./MediaCard";
import TrailerModal from "./TrailerModal";
import AISearchInput from "./AISearchInput";
import BottomNav from "./BottomNav";
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
  const [watchProviders, setWatchProviders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

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

  useEffect(() => {
    // Fetch Watch Providers
    fetch(`/api/watch-providers?id=${movie.id}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: any) => {
        const providers = data.providers || {};
        const combined = [
          ...(providers.US || []),
          ...(providers.GB || []),
          ...(providers.CA || []),
          ...(providers.AU || []),
        ];
        const unique: any[] = [];
        const seen = new Set();
        for (const p of combined) {
          if (!seen.has(p.provider_id)) {
            seen.add(p.provider_id);
            unique.push(p);
          }
        }
        setWatchProviders(unique.slice(0, 6)); // show top 6 streaming providers
      })
      .catch(() => {});

    // Fetch TMDB Reviews
    setReviewsLoading(true);
    fetch(`/api/reviews?id=${movie.id}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: any) => {
        setReviews(data.reviews || []);
        setReviewsLoading(false);
      })
      .catch(() => {
        setReviewsLoading(false);
      });
  }, [movie.id]);

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
    <div className="bg-black min-h-screen text-white pb-24 font-sans selection:bg-red-650 selection:text-white">
      <Navbar onSearchClick={() => setShowSearch(true)} />

      {/* Floating search layer */}
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      {/* Fullscreen Backdrop Section */}
      <div className="relative w-full h-[70vh] sm:h-[80vh] bg-black overflow-hidden">
        {/* Background Backdrop Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 filter blur-[1px] md:blur-0 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: `url(${movie.backdropPath})` }}
        />
        
        {/* Premium Cinematic Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/35 to-transparent z-10" />
        <div className="absolute inset-0 bg-radial-at-b from-transparent via-black/20 to-black/90 z-10" />

        {/* Back navigation button */}
        <div className="absolute top-24 left-6 z-35">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-900/80 hover:border-neutral-700 backdrop-blur-md transition-all duration-300 active:scale-95 shadow-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        {/* Details Heading overlay */}
        <div className="absolute inset-x-0 bottom-0 z-20 max-w-7xl mx-auto px-6 pb-12 flex flex-col md:flex-row items-end gap-8">
          {/* Poster image */}
          <div className="relative w-40 md:w-56 aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex-shrink-0 group hidden md:block">
            <Image
              src={movie.posterPath}
              alt={movie.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
              <button 
                onClick={handlePlayTrailer}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-bold backdrop-blur-sm transition-all"
              >
                Play Trailer
              </button>
            </div>
          </div>

          <div className="flex-grow pb-2 z-20">
            {/* Title */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              {movie.title}
            </h1>

            {/* Badges metadata row */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-neutral-400 font-medium">
              <div className="flex items-center gap-1 bg-[var(--red-dim)] border border-[var(--red)]/20 px-2.5 py-0.5 rounded-md backdrop-blur-sm">
                <Star className="w-3.5 h-3.5 text-[var(--red)] fill-current" />
                <span className="font-extrabold text-[var(--red)]">{movie.rating.toFixed(1)}</span>
              </div>
              <span className="text-neutral-700">•</span>
              <span className="flex items-center gap-1 font-semibold text-neutral-300">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                {movie.releaseDate.substring(0, 4)}
              </span>
              <span className="text-neutral-700">•</span>
              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] tracking-wider text-neutral-300 font-extrabold uppercase">
                {movie.type}
              </span>
              <span className="text-neutral-700">•</span>
              <span className="px-1.5 py-0.5 rounded border border-neutral-800 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                4K UHD
              </span>
              <span className="px-1.5 py-0.5 rounded border border-neutral-800 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                HDR
              </span>
              <span className="px-1.5 py-0.5 rounded border border-neutral-800 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                5.1 AUDIO
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details layout grid */}
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
        
        {/* Left 2 Columns: Description, Cast, Reviews */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Action buttons bar */}
          <div className="flex flex-wrap items-center gap-4 bg-neutral-950/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            {/* PRIMARY: Watch Now — streaming-first */}
            <Link
              href={`/watch/movie/${movie.id}`}
              className="flex items-center gap-2.5 px-8 py-4 bg-[var(--red)] hover:bg-red-600 text-white font-black rounded-full transition-all duration-300 shadow-[0_0_25px_var(--red-glow)] hover:shadow-[0_0_35px_var(--red-glow)] hover:scale-[1.03] active:scale-95 text-sm uppercase tracking-wider"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Now
            </Link>

            <a
              href={`/api/download?id=${movie.id}&type=movie`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-4 font-bold rounded-full border border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:text-white hover:bg-neutral-800 text-sm uppercase tracking-wider transition-all duration-300 hover:scale-[1.03]"
            >
              <Download className="w-4 h-4" />
              Download
            </a>

            <button
              onClick={toggleWatchlist}
              className={`flex items-center gap-2 px-6 py-4 font-bold rounded-full border text-sm uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] active:scale-95 ${
                inWatchlist
                  ? "bg-red-950/20 border-red-500/40 text-red-400"
                  : "bg-neutral-900/80 border-neutral-850 text-white hover:bg-neutral-800"
              }`}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
            </button>

            {movie.trailerUrl && (
              <button
                onClick={handlePlayTrailer}
                className="flex items-center gap-2 px-6 py-4 font-bold rounded-full border border-neutral-800 bg-transparent text-neutral-300 hover:text-white hover:bg-neutral-900/50 text-sm uppercase tracking-wider transition-all duration-300 hover:scale-[1.03]"
              >
                Trailer
              </button>
            )}
          </div>

          {/* Storyline Overview */}
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-red-500">
              Storyline
            </h2>
            <p className="text-neutral-300 text-base leading-relaxed font-normal">
              {movie.overview || "No storyline details are currently available for this title."}
            </p>
          </div>

          {/* Cast Details Section */}
          {movie.cast && movie.cast.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-red-500">
                Principal Cast
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {(movie.detailedCast && movie.detailedCast.length > 0
                  ? movie.detailedCast
                  : (movie.cast || []).map((actor, idx) => ({
                      name: actor,
                      character: `Actor ${idx + 1}`,
                      profilePath: ""
                    }))
                ).slice(0, 10).map((actor: any) => (
                  <div key={actor.name} className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/40 hover:bg-neutral-900/30 hover:border-neutral-800 transition-all duration-300 text-center flex flex-col items-center group">
                    {actor.profilePath ? (
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border border-neutral-800 group-hover:border-red-500/40 mb-3 transition-colors duration-300">
                        <Image src={actor.profilePath} alt={actor.name} fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-red-650/10 border border-red-900/30 group-hover:border-red-500/50 flex items-center justify-center font-bold text-red-500 mb-3 shadow-[0_0_10px_rgba(255,0,0,0.05)] transition-all duration-300">
                        {actor.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <p className="text-xs font-bold text-neutral-100 truncate w-full group-hover:text-white transition-colors">{actor.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1 truncate w-full font-medium" title={actor.character}>
                      {actor.character}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar/Recommended Movies */}
          {recommendations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-red-500">
                More Like This
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {recommendations.slice(0, 6).map((rec) => (
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
          <div className="p-6 rounded-2xl border border-white/5 bg-neutral-950/40 backdrop-blur-md space-y-5 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-red-500">
              Media Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {movie.director && (
                <div className="col-span-2 border-b border-neutral-900 pb-3">
                  <span className="text-[10px] uppercase text-neutral-500 font-extrabold tracking-wider block">Director</span>
                  <span className="text-sm font-bold text-white mt-1 block">{movie.director}</span>
                </div>
              )}

              {movie.status && (
                <div className="border-b border-neutral-900 pb-3">
                  <span className="text-[10px] uppercase text-neutral-500 font-extrabold tracking-wider block">Status</span>
                  <span className="text-sm font-bold text-neutral-200 mt-1 block">{movie.status}</span>
                </div>
              )}

              {movie.runtime && movie.runtime > 0 && (
                <div className="border-b border-neutral-900 pb-3">
                  <span className="text-[10px] uppercase text-neutral-500 font-extrabold tracking-wider block">Runtime</span>
                  <span className="text-sm font-bold text-neutral-200 mt-1 block">{movie.runtime} min</span>
                </div>
              )}

              <div className="col-span-2 border-b border-neutral-900 pb-3">
                <span className="text-[10px] uppercase text-neutral-500 font-extrabold tracking-wider block mb-1.5">Genres</span>
                <div className="flex flex-wrap gap-1.5">
                  {movie.genres.map((g: string) => (
                    <span key={g} className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-850 text-[10px] text-neutral-400 font-semibold transition-colors hover:border-neutral-700">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-b border-neutral-900 pb-3">
                <span className="text-[10px] uppercase text-neutral-500 font-extrabold tracking-wider block">Release Date</span>
                <span className="text-sm font-bold text-neutral-200 mt-1 block">{movie.releaseDate}</span>
              </div>

              {movie.language && (
                <div className="border-b border-neutral-900 pb-3">
                  <span className="text-[10px] uppercase text-neutral-500 font-extrabold tracking-wider block">Language</span>
                  <span className="text-sm font-bold text-neutral-200 mt-1 block truncate" title={movie.language}>{movie.language}</span>
                </div>
              )}

              {movie.country && (
                <div className="col-span-2 border-b border-neutral-900 pb-3">
                  <span className="text-[10px] uppercase text-neutral-500 font-extrabold tracking-wider block">Country</span>
                  <span className="text-sm font-bold text-neutral-200 mt-1 block">{movie.country}</span>
                </div>
              )}
            </div>

            {movie.productionCompanies && movie.productionCompanies.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] uppercase text-neutral-500 font-extrabold tracking-wider block mb-3">Production</span>
                <div className="flex flex-wrap gap-3 items-center bg-black/40 p-3 rounded-xl border border-neutral-900">
                  {movie.productionCompanies.map((pc: any) => (
                    <div key={pc.name} className="flex items-center gap-2">
                      {pc.logoPath ? (
                        <div className="relative w-6 h-6 bg-white/5 p-0.5 rounded flex-shrink-0">
                          <Image src={pc.logoPath} alt={pc.name} fill className="object-contain p-0.5" unoptimized />
                        </div>
                      ) : null}
                      <span className="text-[10px] font-bold text-neutral-400 truncate max-w-[90px]" title={pc.name}>{pc.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Watch Providers Card (Streaming info from JustWatch / TMDB) */}
          {watchProviders.length > 0 && (
            <div className="p-6 rounded-2xl border border-white/5 bg-neutral-950/40 backdrop-blur-md space-y-4 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--red)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Where to Stream
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {watchProviders.map((provider) => (
                  <div key={provider.provider_id} className="flex flex-col items-center gap-1 text-center bg-black/35 p-2 rounded-xl border border-neutral-900 hover:border-neutral-800 transition-colors">
                    <img
                      src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                      alt={provider.provider_name}
                      className="w-8 h-8 rounded-lg object-contain shadow-md"
                    />
                    <span className="text-[8px] font-black text-neutral-400 truncate max-w-[65px] uppercase mt-1 leading-none">
                      {provider.provider_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Row Panel */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--red)]" />
              Community Reviews
            </h3>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-[var(--red)] animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/40 text-center text-xs text-neutral-500 italic">
                No reviews found for this title.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/40 space-y-2.5 shadow-md hover:border-neutral-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-200">{rev.author}</span>
                      {rev.rating && (
                        <div className="flex items-center gap-0.5 text-[var(--red)] text-[10px] font-black uppercase">
                          <span>★</span>
                          <span>{rev.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed font-light line-clamp-4">
                      "{rev.content.replace(/<\/?[^>]+(>|$)/g, "")}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Trailer Modal Player */}
      <TrailerModal
        videoId={movie.trailerUrl || trailerId || ""}
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
      />

      <BottomNav />
    </div>
  );
}
