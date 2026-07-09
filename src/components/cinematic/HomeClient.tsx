"use client";

import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import HeroSlider from "./HeroSlider";
import MediaCard from "./MediaCard";
import ContentRail from "./ContentRail";
import NewsCard from "./NewsCard";
import AISearchInput from "./AISearchInput";
import BottomNav from "./BottomNav";
import { TMDBMedia } from "@/lib/providers/tmdb.provider";
import { AniListMedia } from "@/lib/providers/anilist.provider";
import { NormalizedArticle } from "@/lib/news/news.types";
import {
  Flame, Star, Tv, Clock, Sparkles,
  Film, BookOpen, Zap, TrendingUp, Calendar,
} from "lucide-react";

interface HomeClientProps {
  trendingMovies:  TMDBMedia[];
  trendingSeries:  TMDBMedia[];
  trendingAnime:   AniListMedia[];
  topRatedMovies?: TMDBMedia[];
  topRatedSeries?: TMDBMedia[];
  nowPlaying?:     TMDBMedia[];
  popularMovies?:  TMDBMedia[];
  upcomingMovies?: TMDBMedia[];
  newsArticles:    NormalizedArticle[];
}

function SkeletonRail() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton-base skeleton-card flex-shrink-0" style={{ width: 120 }} />
      ))}
    </div>
  );
}

export default function HomeClient({
  trendingMovies, trendingSeries, trendingAnime,
  topRatedMovies = [], topRatedSeries = [], nowPlaying = [], popularMovies = [], upcomingMovies = [],
  newsArticles,
}: HomeClientProps) {
  const [showSearch,       setShowSearch]       = useState(false);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [aiRecs,           setAiRecs]           = useState<any[]>([]);
  const [loadingRecs,      setLoadingRecs]      = useState(false);

  useEffect(() => {
    // Migration to clear old mock history
    if (typeof window !== "undefined" && !localStorage.getItem("muviont_history_cleaned")) {
      localStorage.removeItem("muviont_history");
      localStorage.setItem("muviont_history_cleaned", "true");
    }

    // Load history
    const loadHistory = async () => {
      try {
        const res = await fetch("/api/watch-progress");
        if (res.ok) {
          const data = await res.json();
          if (data.history && data.history.length > 0) {
            setContinueWatching(data.history);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch DB watch progress, falling back to local history", err);
      }

      // Load from localStorage
      const savedHistory = JSON.parse(localStorage.getItem("muviont_history") || "[]");
      setContinueWatching(savedHistory);
    };

    loadHistory();

    // Fetch AI recommendations
    const fetchRecs = async () => {
      setLoadingRecs(true);
      try {
        let userId = "guest-user";
        try {
          const s = await fetch("/api/auth/session");
          if (s.ok) {
            const sd = await s.json();
            if (sd?.user?.id) userId = sd.user.id;
          }
        } catch {}

        const res = await fetch(`/api/ai-recommend?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setAiRecs(data.recommendations || []);
        } else {
          setAiRecs(trendingMovies.slice(4, 9));
        }
      } catch {
        setAiRecs(trendingMovies.slice(4, 9));
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecs();
  }, [trendingMovies, trendingAnime]);

  const CARD_W = "w-[120px] sm:w-[140px] md:w-[160px] lg:w-[175px]";

  return (
    <div className="bg-[var(--bg)] min-h-screen text-white">
      <Navbar onSearchClick={() => setShowSearch(true)} />
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      {/* ── HERO ── */}
      <HeroSlider items={trendingMovies.slice(0, 5)} />

      {/* ── MAIN CONTENT RAILS ── */}
      <main className="space-y-10 pb-24 pt-8">

        {/* 1. Continue Watching */}
        {continueWatching.length > 0 && (
          <ContentRail
            title="Continue Watching"
            icon={<Clock className="w-3.5 h-3.5 text-[var(--red)]" />}
          >
            {continueWatching.map((item) => (
              <div key={item.id} className={CARD_W}>
                <MediaCard
                  id={item.id}
                  title={item.title}
                  posterPath={item.posterPath}
                  rating={item.rating}
                  type={item.type || "movie"}
                  releaseDate={item.releaseDate}
                  progress={item.progress}
                  duration={item.duration}
                />
              </div>
            ))}
          </ContentRail>
        )}

        {/* 2. 🔥 Trending Movies */}
        <ContentRail
          title="Trending Movies"
          icon={<Flame className="w-3.5 h-3.5 text-orange-500" />}
          seeAllHref="/movies"
        >
          {trendingMovies.map((item, i) => (
            <div key={item.id} className={CARD_W}>
              <MediaCard
                id={item.id}
                title={item.title}
                posterPath={item.posterPath}
                rating={item.rating}
                type="movie"
                releaseDate={item.releaseDate}
                rank={i + 1}
              />
            </div>
          ))}
        </ContentRail>

        {/* 3. ⭐ Top Rated Movies */}
        {topRatedMovies.length > 0 && (
          <ContentRail
            title="Top Rated Movies"
            icon={<Star className="w-3.5 h-3.5 text-[var(--gold)]" />}
            seeAllHref="/movies?sort=vote_average.desc"
          >
            {topRatedMovies.map((item) => (
              <div key={item.id} className={CARD_W}>
                <MediaCard
                  id={item.id}
                  title={item.title}
                  posterPath={item.posterPath}
                  rating={item.rating}
                  type="movie"
                  releaseDate={item.releaseDate}
                />
              </div>
            ))}
          </ContentRail>
        )}

        {/* 4. 📺 Trending Series */}
        <ContentRail
          title="Trending Series"
          icon={<Tv className="w-3.5 h-3.5 text-blue-400" />}
          seeAllHref="/series"
        >
          {trendingSeries.map((item, i) => (
            <div key={item.id} className={CARD_W}>
              <MediaCard
                id={item.id}
                title={item.title}
                posterPath={item.posterPath}
                rating={item.rating}
                type="series"
                releaseDate={item.releaseDate}
                rank={i + 1}
              />
            </div>
          ))}
        </ContentRail>

        {/* 5. ⭐ Top Rated Series */}
        {topRatedSeries.length > 0 && (
          <ContentRail
            title="Top Rated Series"
            icon={<Star className="w-3.5 h-3.5 text-[var(--gold)]" />}
            seeAllHref="/series?sort=vote_average.desc"
          >
            {topRatedSeries.map((item) => (
              <div key={item.id} className={CARD_W}>
                <MediaCard
                  id={item.id}
                  title={item.title}
                  posterPath={item.posterPath}
                  rating={item.rating}
                  type="series"
                  releaseDate={item.releaseDate}
                />
              </div>
            ))}
          </ContentRail>
        )}

        {/* 6. 🎌 Trending Anime */}
        <ContentRail
          title="Trending Anime"
          icon={<Zap className="w-3.5 h-3.5 text-purple-400" />}
          seeAllHref="/anime"
        >
          {trendingAnime.map((item, i) => (
            <div key={item.id} className={CARD_W}>
              <MediaCard
                id={item.id}
                title={item.title}
                posterPath={item.posterPath}
                rating={item.rating}
                type="anime"
                releaseDate={item.releaseDate}
                rank={i + 1}
              />
            </div>
          ))}
        </ContentRail>

        {/* 7. 🤖 AI Recommendations */}
        <ContentRail
          title="Recommended For You"
          icon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
        >
          {loadingRecs ? (
            <SkeletonRail />
          ) : aiRecs.length > 0 ? (
            aiRecs.map((item) => (
              <div key={item.id} className={CARD_W}>
                <MediaCard
                  id={item.id}
                  title={item.title}
                  posterPath={item.posterPath}
                  rating={item.rating}
                  type={item.type || "movie"}
                  releaseDate={item.releaseDate}
                />
              </div>
            ))
          ) : (
            trendingMovies.slice(5).map((item) => (
              <div key={item.id} className={CARD_W}>
                <MediaCard
                  id={item.id}
                  title={item.title}
                  posterPath={item.posterPath}
                  rating={item.rating}
                  type="movie"
                  releaseDate={item.releaseDate}
                />
              </div>
            ))
          )}
        </ContentRail>

        {/* 8. 🎬 Now Playing in Cinemas */}
        {nowPlaying.length > 0 && (
          <ContentRail
            title="Now Playing"
            icon={<Film className="w-3.5 h-3.5 text-[var(--red)]" />}
            seeAllHref="/movies?sort=popularity.desc"
          >
            {nowPlaying.map((item) => (
              <div key={item.id} className={CARD_W}>
                <MediaCard
                  id={item.id}
                  title={item.title}
                  posterPath={item.posterPath}
                  rating={item.rating}
                  type="movie"
                  releaseDate={item.releaseDate}
                />
              </div>
            ))}
          </ContentRail>
        )}
        {/* Upcoming Movies (Coming Soon) */}
        {upcomingMovies.length > 0 && (
          <ContentRail
            title="Coming Soon (Upcoming)"
            icon={<Calendar className="w-3.5 h-3.5 text-red-500" />}
            seeAllHref="/movies?sort=primary_release_date.asc"
          >
            {upcomingMovies.map((item) => (
              <div key={item.id} className={CARD_W}>
                <MediaCard
                  id={item.id}
                  title={item.title}
                  posterPath={item.posterPath}
                  rating={item.rating}
                  type="movie"
                  releaseDate={item.releaseDate}
                />
              </div>
            ))}
          </ContentRail>
        )}

        {/* 9. 📈 Popular This Week */}
        {popularMovies.length > 0 && (
          <ContentRail
            title="Popular This Week"
            icon={<TrendingUp className="w-3.5 h-3.5 text-green-400" />}
            seeAllHref="/movies"
          >
            {popularMovies.map((item) => (
              <div key={item.id} className={CARD_W}>
                <MediaCard
                  id={item.id}
                  title={item.title}
                  posterPath={item.posterPath}
                  rating={item.rating}
                  type="movie"
                  releaseDate={item.releaseDate}
                />
              </div>
            ))}
          </ContentRail>
        )}

        {/* 10. 📰 Entertainment News */}
        {newsArticles.length > 0 && (
          <section className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="section-header">
              <h2 className="section-title">
                <BookOpen className="w-3.5 h-3.5 text-yellow-400" />
                Entertainment News
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {newsArticles.slice(0, 8).map((article, i) => (
                <NewsCard key={i} article={article} />
              ))}
            </div>
          </section>
        )}

      </main>

      <BottomNav />
    </div>
  );
}
