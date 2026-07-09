"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play, Plus, Check, Star, Calendar, ArrowLeft, Tv, Clock, MessageSquare, Loader2, Sparkles, AlertCircle, Download
} from "lucide-react";
import Navbar from "./Navbar";
import MediaCard from "./MediaCard";
import AISearchInput from "./AISearchInput";
import BottomNav from "./BottomNav";
import { TMDBMedia, TMDBSeason } from "@/lib/providers/tmdb.provider";

interface SeriesDetailClientProps {
  series: TMDBMedia;
  seasons: TMDBSeason[];
  recommendations: TMDBMedia[];
}

export default function SeriesDetailClient({ series, seasons, recommendations }: SeriesDetailClientProps) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showSearch,  setShowSearch]  = useState(false);
  const [watchProviders, setWatchProviders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [nextEpisodeData, setNextEpisodeData] = useState<any | null>(null);

  useEffect(() => {
    const wl = JSON.parse(localStorage.getItem("muviont_watchlist") || "[]");
    setInWatchlist(wl.some((item: any) => item.id === series.id));
    // Track viewed
    const viewed = JSON.parse(localStorage.getItem("muviont_viewed") || "[]");
    const updated = [series, ...viewed.filter((i: any) => i.id !== series.id)].slice(0, 10);
    localStorage.setItem("muviont_viewed", JSON.stringify(updated));
  }, [series]);

  useEffect(() => {
    // Fetch Watch Providers
    fetch(`/api/watch-providers?id=${series.id}`)
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
    fetch(`/api/reviews?id=${series.id}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: any) => {
        setReviews(data.reviews || []);
        setReviewsLoading(false);
      })
      .catch(() => {
        setReviewsLoading(false);
      });

    // Fetch TVMaze Next Episode
    fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(series.title)}&embed=nextepisode`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: any) => {
        const nextEp = data._embedded?.nextepisode;
        if (nextEp) {
          setNextEpisodeData({
            name: nextEp.name,
            season: nextEp.season,
            number: nextEp.number,
            airdate: nextEp.airdate,
            airtime: nextEp.airtime
          });
        }
      })
      .catch(() => {});
  }, [series.id, series.title]);

  const toggleWatchlist = () => {
    const wl = JSON.parse(localStorage.getItem("muviont_watchlist") || "[]");
    const updated = inWatchlist
      ? wl.filter((i: any) => i.id !== series.id)
      : [...wl, series];
    setInWatchlist(!inWatchlist);
    localStorage.setItem("muviont_watchlist", JSON.stringify(updated));
  };

  return (
    <div className="bg-black min-h-screen text-white pb-24 font-sans selection:bg-red-650 selection:text-white">
      <Navbar onSearchClick={() => setShowSearch(true)} />
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      {/* Backdrop Hero */}
      <div className="relative w-full h-[70vh] sm:h-[80vh] bg-neutral-950 overflow-hidden">
        {series.backdropPath && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 filter blur-[1px] md:blur-0 transition-transform duration-1000 ease-out"
            style={{ backgroundImage: `url(${series.backdropPath})` }}
          />
        )}
        
        {/* Premium Cinematic Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/35 to-transparent z-10" />
        <div className="absolute inset-0 bg-radial-at-b from-transparent via-black/20 to-black/90 z-10" />

        {/* Back button */}
        <div className="absolute top-24 left-6 z-35">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-900/80 hover:border-neutral-700 backdrop-blur-md transition-all duration-300 active:scale-95 shadow-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        {/* Poster + Title */}
        <div className="absolute inset-x-0 bottom-0 z-20 max-w-7xl mx-auto px-6 pb-12 flex flex-col md:flex-row items-end gap-8">
          <div className="relative w-40 md:w-56 aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex-shrink-0 group hidden md:block">
            <Image src={series.posterPath} alt={series.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" priority unoptimized />
          </div>
          <div className="flex-grow pb-2 z-20">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">{series.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-neutral-400 font-medium">
              <div className="flex items-center gap-1 bg-[var(--red-dim)] border border-[var(--red)]/20 px-2.5 py-0.5 rounded-md backdrop-blur-sm">
                <Star className="w-3.5 h-3.5 text-[var(--red)] fill-current" />
                <span className="font-extrabold text-[var(--red)]">{series.rating.toFixed(1)}</span>
              </div>
              {series.releaseDate && (
                <>
                  <span className="text-neutral-700">•</span>
                  <span className="flex items-center gap-1 font-semibold text-neutral-300">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    {series.releaseDate.substring(0, 4)}
                  </span>
                </>
              )}
              <span className="text-neutral-700">•</span>
              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] tracking-wider text-neutral-300 font-extrabold uppercase">
                Series
              </span>
              {seasons.length > 0 && (
                <>
                  <span className="text-neutral-700">•</span>
                  <span className="flex items-center gap-1 text-neutral-300 font-semibold">
                    <Tv className="w-3.5 h-3.5 text-neutral-500" />
                    {seasons.length} Season{seasons.length !== 1 ? "s" : ""}
                  </span>
                </>
              )}
              <span className="text-neutral-700">•</span>
              <span className="px-1.5 py-0.5 rounded border border-neutral-850 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                HD
              </span>
              <span className="px-1.5 py-0.5 rounded border border-neutral-850 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                DOLBY 5.1
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* Left 2 cols */}
        <div className="lg:col-span-2 space-y-12">

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-4 bg-neutral-950/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            {/* PRIMARY: Watch Now */}
            <Link
              href={`/watch/series/${series.id}`}
              className="flex items-center gap-2.5 px-8 py-4 bg-[var(--red)] hover:bg-red-600 text-white font-black rounded-full transition-all duration-300 shadow-[0_0_25px_var(--red-glow)] hover:shadow-[0_0_35px_var(--red-glow)] hover:scale-[1.03] active:scale-95 text-sm uppercase tracking-wider"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Now
            </Link>

            <a
              href={`/api/download?id=${series.id}&type=series&season=1&episode=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-4 font-bold rounded-full border border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:text-white hover:bg-neutral-800 text-sm uppercase tracking-wider transition-all duration-300 hover:scale-[1.03]"
            >
              <Download className="w-4 h-4" />
              Download S1 E1
            </a>

            {/* Watchlist */}
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
          </div>

          {/* TVMaze Next Episode Airing Banner */}
          {nextEpisodeData && (
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--red)]/20 bg-[var(--red-dim)] shadow-lg select-none">
              <div className="p-2.5 rounded-xl bg-[var(--red-dim)] border border-[var(--red)]/35 text-[var(--red)] shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-black text-[var(--red)] uppercase tracking-widest leading-none">
                  Airing Live via TVMaze
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  Next Episode: Season {nextEpisodeData.season} Episode {nextEpisodeData.number}
                  {nextEpisodeData.name && ` - "${nextEpisodeData.name}"`}
                </div>
                <div className="text-xs text-neutral-400 font-semibold mt-0.5">
                  Scheduled for: {new Date(nextEpisodeData.airdate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {nextEpisodeData.airtime}
                </div>
              </div>
            </div>
          )}

          {/* Overview */}
          {series.overview && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-[var(--red)]">Overview</h2>
              <p className="text-neutral-355 text-base leading-relaxed font-normal">{series.overview}</p>
            </div>
          )}

          {/* Principal Cast */}
          {((series.detailedCast && series.detailedCast.length > 0) || (series.cast && series.cast.length > 0)) && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-red-500">
                Principal Cast
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {(series.detailedCast && series.detailedCast.length > 0
                  ? series.detailedCast
                  : (series.cast || []).map((actor, idx) => ({
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

          {/* Seasons List */}
          {seasons.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                <Tv className="w-3.5 h-3.5" />
                Seasons
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {seasons.map(season => (
                  <Link
                    key={season.seasonNumber}
                    href={`/watch/series/${series.id}?s=${season.seasonNumber}&e=1`}
                    className="p-3 rounded-2xl bg-neutral-950/40 border border-neutral-900 hover:border-neutral-850 hover:bg-neutral-900/20 transition-all duration-300 group"
                  >
                    {season.posterPath ? (
                      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden mb-3 border border-neutral-900 group-hover:border-neutral-800 transition-colors">
                        <Image src={season.posterPath} alt={season.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-[2px]">
                          <div className="w-10 h-10 rounded-full bg-red-650 flex items-center justify-center text-white shadow-lg">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-[2/3] rounded-xl bg-neutral-900 mb-3 flex items-center justify-center border border-neutral-800">
                        <Tv className="w-8 h-8 text-neutral-700" />
                      </div>
                    )}
                    <p className="text-xs font-bold text-neutral-100 group-hover:text-white truncate transition-colors">{season.name}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{season.episodeCount} episode{season.episodeCount !== 1 ? "s" : ""}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Quick start CTA */}
          <div className="rounded-2xl border border-white/5 bg-neutral-950/40 p-6 space-y-4 backdrop-blur-md shadow-xl">
            <h3 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Start Watching
            </h3>
            <Link
              href={`/watch/series/${series.id}?s=1&e=1`}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-red-650 hover:bg-red-600 text-white font-extrabold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] shadow-[0_0_16px_rgba(229,9,20,0.3)] hover:shadow-[0_0_24px_rgba(229,9,20,0.5)]"
            >
              <Play className="w-4 h-4 fill-current" />
              Season 1, Episode 1
            </Link>
            {seasons.length > 1 && (
              <p className="text-[10px] text-neutral-500 text-center tracking-wide font-medium">
                {seasons.length} seasons available for streaming
              </p>
            )}
          </div>

          {/* Details info */}
          <div className="rounded-2xl bg-neutral-950/40 border border-white/5 p-6 space-y-4 backdrop-blur-md shadow-xl">
            <h3 className="text-xs font-black text-red-500 uppercase tracking-widest">Details</h3>
            
            <div className="space-y-3.5 text-xs">
              {series.releaseDate && (
                <div className="flex justify-between pb-2.5 border-b border-neutral-900">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">First Aired</span>
                  <span className="text-neutral-300 font-semibold">{series.releaseDate.substring(0, 10)}</span>
                </div>
              )}
              {series.status && (
                <div className="flex justify-between pb-2.5 border-b border-neutral-900">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Status</span>
                  <span className="text-neutral-300 font-semibold">{series.status}</span>
                </div>
              )}
              {series.runtime && series.runtime > 0 && (
                <div className="flex justify-between pb-2.5 border-b border-neutral-900">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Episode Runtime</span>
                  <span className="text-neutral-300 font-semibold">{series.runtime} min</span>
                </div>
              )}
              {seasons.length > 0 && (
                <div className="flex justify-between pb-2.5 border-b border-neutral-900">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Seasons</span>
                  <span className="text-neutral-300 font-semibold">{seasons.length}</span>
                </div>
              )}
              <div className="flex justify-between pb-2.5 border-b border-neutral-900">
                <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Rating</span>
                <span className="text-[var(--red)] font-bold flex items-center gap-0.5">
                  <span>★</span>
                  <span>{series.rating.toFixed(1)}</span>
                </span>
              </div>
              {series.language && (
                <div className="flex flex-col gap-1 pb-2.5 border-b border-neutral-900">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Language</span>
                  <span className="text-neutral-300 font-semibold truncate" title={series.language}>{series.language}</span>
                </div>
              )}
              {series.country && (
                <div className="flex flex-col gap-1 pb-2.5 border-b border-neutral-900">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Country</span>
                  <span className="text-neutral-300 font-semibold truncate" title={series.country}>{series.country}</span>
                </div>
              )}
              {series.genres.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Genres</span>
                  <div className="flex flex-wrap gap-1.5">
                    {series.genres.map(g => (
                      <span key={g} className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-850 text-[10px] text-neutral-400 font-semibold">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {series.productionCompanies && series.productionCompanies.length > 0 && (
              <div className="pt-3 border-t border-neutral-900">
                <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider block mb-2.5">Production</span>
                <div className="flex flex-wrap gap-2.5 items-center bg-black/40 p-2.5 rounded-xl border border-neutral-900">
                  {series.productionCompanies.map((pc: any) => (
                    <div key={pc.name} className="flex items-center gap-2">
                      {pc.logoPath ? (
                        <div className="relative w-5 h-5 bg-white/5 rounded-sm overflow-hidden flex-shrink-0">
                          <Image src={pc.logoPath} alt={pc.name} fill className="object-contain p-0.5" unoptimized />
                        </div>
                      ) : null}
                      <span className="text-[10px] font-bold text-neutral-400 truncate max-w-[80px]" title={pc.name}>{pc.name}</span>
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

      {/* Recommendations rail */}
      {recommendations.length > 0 && (
        <div className="mt-16 max-w-7xl mx-auto px-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-[var(--red)] mb-6 flex items-center gap-2">
            <Play className="w-3.5 h-3.5 fill-current" />
            More Like This
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {recommendations.slice(0, 6).map(rec => (
              <MediaCard
                key={rec.id}
                id={rec.id}
                title={rec.title}
                posterPath={rec.posterPath}
                rating={rec.rating}
                type="series"
                releaseDate={rec.releaseDate}
              />
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
