import { db } from "../db";

export interface TMDBEpisode {
  episodeNumber: number;
  name: string;
  overview: string;
  stillPath: string;
  airDate: string;
  runtime: number;
}

export interface TMDBSeason {
  seasonNumber: number;
  episodeCount: number;
  name: string;
  posterPath: string;
  airDate: string;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface TMDBWatchProviders {
  US?: TMDBWatchProvider[];
  GB?: TMDBWatchProvider[];
  CA?: TMDBWatchProvider[];
  AU?: TMDBWatchProvider[];
}

export interface TMDBMediaCast {
  name: string;
  character: string;
  profilePath: string;
}

export interface TMDBProductionCompany {
  name: string;
  logoPath: string;
}

export interface TMDBMedia {
  id: string;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  rating: number; // 0.0 - 10.0
  type: "movie" | "series";
  genres: string[];
  director?: string;
  cast?: string[];
  detailedCast?: TMDBMediaCast[];
  productionCompanies?: TMDBProductionCompany[];
  runtime?: number;
  status?: string;
  language?: string;
  country?: string;
  trailerUrl?: string;
  popularity?: number;
  totalEpisodes?: number;
  seasonsCount?: number;
  nextEpisode?: { episodeNumber: number; airDate: string; name?: string };
  genreIds?: number[];
  originalLanguage?: string;
}

export class TMDBProvider {
  private apiKey: string | undefined = process.env.TMDB_API_KEY;
  private baseUrl = "https://api.themoviedb.org/3";

  private checkApiKey() {
    if (!this.apiKey || this.apiKey === "your_tmdb_api_key_here" || this.apiKey.trim() === "") {
      throw new Error("Critical Configuration Error: TMDB_API_KEY is not defined in environment variables.");
    }
  }

  private async logMetric(endpoint: string, latency: number, success: boolean, errorMsg?: string) {
    db.providerMetric.create({
      data: {
        provider: "TMDB",
        endpoint,
        latency,
        success,
        errorMsg: errorMsg || null,
      }
    }).catch(() => {});
  }

  private mapMedia(item: any, type: "movie" | "series"): TMDBMedia {
    return {
      id: `${type === "movie" ? "m" : "s"}-${item.id}`,
      title: item.title || item.name || "",
      overview: item.overview || "",
      posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop",
      backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop",
      releaseDate: item.release_date || item.first_air_date || "",
      rating: Math.round((item.vote_average || 0) * 10) / 10,
      type,
      genres: item.genre_ids ? [] : (item.genres ? item.genres.map((g: any) => g.name) : []),
      popularity: item.popularity || 0,
      genreIds: item.genre_ids || [],
      originalLanguage: item.original_language || ""
    };
  }

  async getTrending(type: "movie" | "series" | "all" = "all"): Promise<TMDBMedia[]> {
    this.checkApiKey();
    const endpoint = `/trending/${type === "all" ? "all" : type === "movie" ? "movie" : "tv"}/week`;
    const startTime = Date.now();

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}?api_key=${this.apiKey}`, {
        next: { revalidate: 3600 }, // 1 Hour Next.js cache (Level 2)
        signal: AbortSignal.timeout(10000)
      });

      if (!res.ok) throw new Error(`TMDB API Error: HTTP ${res.status}`);
      const data = await res.json();
      const mapped = (data.results || []).map((item: any) => {
        const itemType = item.media_type === "tv" || type === "series" ? "series" : "movie";
        return this.mapMedia(item, itemType as "movie" | "series");
      });

      await this.logMetric(endpoint, Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric(endpoint, Date.now() - startTime, false, err.message);
      throw err;
    }
  }

  async getTopRated(type: "movie" | "series"): Promise<TMDBMedia[]> {
    this.checkApiKey();
    const endpoint = type === "movie" ? "/movie/top_rated" : "/tv/top_rated";
    const startTime = Date.now();

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}?api_key=${this.apiKey}`, {
        next: { revalidate: 7200 }, // 2 Hours Next.js cache
        signal: AbortSignal.timeout(10000)
      });

      if (!res.ok) throw new Error(`TMDB API Error: HTTP ${res.status}`);
      const data = await res.json();
      const mapped = (data.results || []).slice(0, 10).map((item: any) => this.mapMedia(item, type));

      await this.logMetric(endpoint, Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric(endpoint, Date.now() - startTime, false, err.message);
      throw err;
    }
  }

  async search(query: string): Promise<TMDBMedia[]> {
    this.checkApiKey();
    const endpoint = `/search/multi`;
    const startTime = Date.now();

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error(`TMDB API Error: HTTP ${res.status}`);
      const data = await res.json();
      const mapped = (data.results || [])
        .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
        .map((item: any) => {
          const type = item.media_type === "tv" ? "series" : "movie";
          return this.mapMedia(item, type);
        });

      await this.logMetric(endpoint, Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric(endpoint, Date.now() - startTime, false, err.message);
      throw err;
    }
  }

  async getDetails(id: string): Promise<TMDBMedia | null> {
    this.checkApiKey();
    const type = id.startsWith("m-") ? "movie" : "series";
    const rawId = id.substring(2);
    const endpoint = type === "movie" ? `/movie/${rawId}` : `/tv/${rawId}`;
    const startTime = Date.now();

    if (isNaN(Number(rawId))) {
      return null;
    }

    try {
      const [detailsRes, creditsRes, videosRes] = await Promise.all([
        fetch(`${this.baseUrl}${endpoint}?api_key=${this.apiKey}`, { signal: AbortSignal.timeout(10000) }),
        fetch(`${this.baseUrl}${endpoint}/credits?api_key=${this.apiKey}`, { signal: AbortSignal.timeout(10000) }),
        fetch(`${this.baseUrl}${endpoint}/videos?api_key=${this.apiKey}`, { signal: AbortSignal.timeout(10000) })
      ]);

      if (!detailsRes.ok) throw new Error(`TMDB API Error: Details HTTP ${detailsRes.status}`);
      const details = await detailsRes.json();

      let cast: string[] = [];
      let detailedCast: TMDBMediaCast[] = [];
      let director = "";
      if (creditsRes.ok) {
        const credits = await creditsRes.json();
        cast = (credits.cast || []).slice(0, 8).map((c: any) => c.name);
        detailedCast = (credits.cast || []).slice(0, 8).map((c: any) => ({
          name: c.name,
          character: c.character || "",
          profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : ""
        }));
        const dirObj = (credits.crew || []).find((c: any) => c.job === "Director");
        if (dirObj) director = dirObj.name;
      }

      let trailerUrl = "";
      if (videosRes.ok) {
        const videos = await videosRes.json();
        const trailer = (videos.results || []).find((v: any) => v.site === "YouTube" && v.type === "Trailer");
        if (trailer) trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      }

      const mapped = this.mapMedia(details, type);
      mapped.director = director;
      mapped.cast = cast;
      mapped.detailedCast = detailedCast;
      mapped.productionCompanies = (details.production_companies || []).slice(0, 6).map((pc: any) => ({
        name: pc.name,
        logoPath: pc.logo_path ? `https://image.tmdb.org/t/p/w185${pc.logo_path}` : ""
      }));
      mapped.runtime = details.runtime || (details.episode_run_time ? details.episode_run_time[0] : 0) || 0;
      mapped.status = details.status || "";
      mapped.language = details.spoken_languages?.map((l: any) => l.english_name).join(", ") || details.original_language || "";
      mapped.country = details.production_countries?.map((c: any) => c.name).join(", ") || "";
      mapped.trailerUrl = trailerUrl;

      if (type === "series") {
        mapped.totalEpisodes = details.number_of_episodes || 0;
        mapped.seasonsCount = details.number_of_seasons || 0;
        if (details.next_episode_to_air) {
          mapped.nextEpisode = {
            episodeNumber: details.next_episode_to_air.episode_number,
            airDate: details.next_episode_to_air.air_date,
            name: details.next_episode_to_air.name || ""
          };
        }
      }

      await this.logMetric(endpoint, Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric(endpoint, Date.now() - startTime, false, err.message);
      throw err;
    }
  }

  async getRecommendations(id: string): Promise<TMDBMedia[]> {
    this.checkApiKey();
    const type = id.startsWith("m-") ? "movie" : "series";
    const rawId = id.substring(2);
    const endpoint = type === "movie" ? `/movie/${rawId}/recommendations` : `/tv/${rawId}/recommendations`;
    const startTime = Date.now();

    if (isNaN(Number(rawId))) {
      return [];
    }

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}?api_key=${this.apiKey}`, {
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error(`TMDB API Error: Recommendations HTTP ${res.status}`);
      const data = await res.json();
      const mapped = (data.results || []).slice(0, 6).map((item: any) => this.mapMedia(item, type));

      await this.logMetric(endpoint, Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric(endpoint, Date.now() - startTime, false, err.message);
      throw err;
    }
  }

  async getSimilar(id: string): Promise<TMDBMedia[]> {
    this.checkApiKey();
    const type = id.startsWith("m-") ? "movie" : "series";
    const rawId = id.substring(2);
    const endpoint = type === "movie" ? `/movie/${rawId}/similar` : `/tv/${rawId}/similar`;
    const startTime = Date.now();

    if (isNaN(Number(rawId))) {
      return [];
    }

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}?api_key=${this.apiKey}`, {
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error(`TMDB API Error: Similar HTTP ${res.status}`);
      const data = await res.json();
      const mapped = (data.results || []).slice(0, 10).map((item: any) => this.mapMedia(item, type));

      await this.logMetric(endpoint, Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric(endpoint, Date.now() - startTime, false, err.message);
      throw err;
    }
  }

  async getNowPlaying(): Promise<TMDBMedia[]> {
    this.checkApiKey();
    const endpoint = `/movie/now_playing`;
    const startTime = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}?api_key=${this.apiKey}`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error(`TMDB API Error: HTTP ${res.status}`);
      const data = await res.json();
      const mapped = (data.results || []).slice(0, 12).map((item: any) => this.mapMedia(item, "movie"));
      await this.logMetric(endpoint, Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric(endpoint, Date.now() - startTime, false, err.message);
      throw err;
    }
  }

  async getUpcoming(): Promise<TMDBMedia[]> {
    this.checkApiKey();
    const endpoint = `/movie/upcoming`;
    const startTime = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}?api_key=${this.apiKey}`, {
        next: { revalidate: 7200 },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error(`TMDB API Error: HTTP ${res.status}`);
      const data = await res.json();
      const mapped = (data.results || []).slice(0, 12).map((item: any) => this.mapMedia(item, "movie"));
      await this.logMetric(endpoint, Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric(endpoint, Date.now() - startTime, false, err.message);
      return [];
    }
  }

  async getPopular(type: "movie" | "series"): Promise<TMDBMedia[]> {
    this.checkApiKey();
    const endpoint = type === "movie" ? `/movie/popular` : `/tv/popular`;
    const startTime = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}?api_key=${this.apiKey}`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error(`TMDB API Error: HTTP ${res.status}`);
      const data = await res.json();
      const mapped = (data.results || []).slice(0, 12).map((item: any) => this.mapMedia(item, type));
      await this.logMetric(endpoint, Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric(endpoint, Date.now() - startTime, false, err.message);
      throw err;
    }
  }

  async getGenreList(type: "movie" | "series"): Promise<TMDBGenre[]> {
    this.checkApiKey();
    const endpoint = type === "movie" ? `/genre/movie/list` : `/genre/tv/list`;
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}?api_key=${this.apiKey}`, {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error(`TMDB API Error: HTTP ${res.status}`);
      const data = await res.json();
      return (data.genres || []) as TMDBGenre[];
    } catch {
      return [];
    }
  }

  async discover(
    type: "movie" | "series",
    options: {
      genreId?: string;
      year?: string;
      sortBy?: string;
      page?: number;
    } = {}
  ): Promise<{ results: TMDBMedia[]; totalPages: number }> {
    this.checkApiKey();
    const tmdbType = type === "series" ? "tv" : "movie";
    const endpoint = `/discover/${tmdbType}`;
    const startTime = Date.now();

    const params = new URLSearchParams({
      api_key: this.apiKey!,
      page: String(options.page || 1),
      sort_by: options.sortBy || "popularity.desc",
    });
    if (options.genreId) params.set("with_genres", options.genreId);
    if (options.year) {
      if (type === "series") params.set("first_air_date_year", options.year);
      else params.set("primary_release_year", options.year);
    }

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}?${params.toString()}`, {
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error(`TMDB API Error: HTTP ${res.status}`);
      const data = await res.json();
      const mapped = (data.results || []).map((item: any) => this.mapMedia(item, type));
      await this.logMetric(endpoint, Date.now() - startTime, true);
      return { results: mapped, totalPages: Math.min(data.total_pages || 1, 20) };
    } catch (err: any) {
      await this.logMetric(endpoint, Date.now() - startTime, false, err.message);
      throw err;
    }
  }

  async getWatchProviders(id: string): Promise<TMDBWatchProviders> {
    this.checkApiKey();
    const type = id.startsWith("m-") ? "movie" : "tv";
    const rawId = id.substring(2);
    const endpoint = type === "movie" ? `/movie/${rawId}/watch/providers` : `/tv/${rawId}/watch/providers`;
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}?api_key=${this.apiKey}`, {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) return {};
      const data = await res.json();
      const pr = data.results || {};

      const extractCountryProviders = (countryData: any) => {
        if (!countryData) return [];
        const providers = [
          ...(countryData.flatrate || []),
          ...(countryData.rent || []),
          ...(countryData.buy || []),
          ...(countryData.ads || []),
          ...(countryData.free || []),
        ];
        const unique: any[] = [];
        const seen = new Set();
        for (const p of providers) {
          if (!seen.has(p.provider_id)) {
            seen.add(p.provider_id);
            unique.push(p);
          }
        }
        return unique;
      };

      return {
        US: extractCountryProviders(pr.US),
        GB: extractCountryProviders(pr.GB),
        CA: extractCountryProviders(pr.CA),
        AU: extractCountryProviders(pr.AU),
      };
    } catch {
      return {};
    }
  }

  async getSeasonEpisodes(seriesId: string, season: number): Promise<TMDBEpisode[]> {
    this.checkApiKey();
    const rawId = seriesId.startsWith("s-") ? seriesId.substring(2) : seriesId;
    const endpoint = `/tv/${rawId}/season/${season}`;
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}?api_key=${this.apiKey}`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.episodes || []).map((ep: any) => ({
        episodeNumber: ep.episode_number,
        name: ep.name || `Episode ${ep.episode_number}`,
        overview: ep.overview || "",
        stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : "",
        airDate: ep.air_date || "",
        runtime: ep.runtime || 45,
      })) as TMDBEpisode[];
    } catch {
      // Fallback: return generic episode list
      return Array.from({ length: 12 }, (_, i) => ({
        episodeNumber: i + 1,
        name: `Episode ${i + 1}`,
        overview: "",
        stillPath: "",
        airDate: "",
        runtime: 45,
      }));
    }
  }

  async getSeriesSeasons(id: string): Promise<TMDBSeason[]> {
    this.checkApiKey();
    const rawId = id.startsWith("s-") ? id.substring(2) : id;
    try {
      const res = await fetch(`${this.baseUrl}/tv/${rawId}?api_key=${this.apiKey}`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.seasons || [])
        .filter((s: any) => s.season_number > 0)
        .map((s: any) => ({
          seasonNumber: s.season_number,
          episodeCount: s.episode_count || 0,
          name: s.name || `Season ${s.season_number}`,
          posterPath: s.poster_path ? `https://image.tmdb.org/t/p/w300${s.poster_path}` : "",
          airDate: s.air_date || "",
        })) as TMDBSeason[];
    } catch {
      return [];
    }
  }
}

