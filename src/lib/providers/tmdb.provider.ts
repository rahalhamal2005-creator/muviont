import { db } from "../db";

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
  trailerUrl?: string;
  popularity?: number;
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
      popularity: item.popularity || 0
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
      let director = "";
      if (creditsRes.ok) {
        const credits = await creditsRes.json();
        cast = (credits.cast || []).slice(0, 5).map((c: any) => c.name);
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
      mapped.trailerUrl = trailerUrl;

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
}

