import { db } from "../db";
import { TMDBProvider } from "./tmdb.provider";

export interface AniListMedia {
  id: string;
  title: string;
  englishTitle?: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  rating: number; // 0.0 - 10.0 scale
  genres: string[];
  status: string; // "RELEASING" | "FINISHED" | "NOT_YET_RELEASED"
  episodes: number; // Total or latest episodes
  totalEpisodes?: number | null; // Explicit total episodes if defined
  latestEpisode?: number; // Explicit latest aired episode
  season?: string;
  studios: string[];
  characters: { name: string; image: string; role: string }[];
  trailerUrl?: string;
  nextAiringEpisode?: { episode: number; airingAt: number };
  popularity?: number;
  tmdbId?: string;
}

export class AniListProviderError extends Error {
  originalError?: any;
  constructor(message: string, originalError?: any) {
    super(message);
    this.name = "AniListProviderError";
    this.originalError = originalError;
  }
}

export class AniListProvider {
  private getEndpoint(): string {
    const endpoint = process.env.ANILIST_API_URL || "https://graphql.anilist.co";
    if (!endpoint || endpoint.trim() === "" || !endpoint.startsWith("http")) {
      return "https://graphql.anilist.co";
    }
    try {
      new URL(endpoint);
      return endpoint;
    } catch {
      return "https://graphql.anilist.co";
    }
  }

  private async logMetric(endpoint: string, latency: number, success: boolean, errorMsg?: string) {
    db.providerMetric.create({
      data: {
        provider: "AniList",
        endpoint,
        latency,
        success,
        errorMsg: errorMsg || null,
      }
    }).catch(() => {});
  }

  private mapMedia(media: any): AniListMedia {
    const totalEpisodes = media.episodes; // can be null for ongoing shows
    let latestEpisode = media.episodes || 0;
    
    if (media.status === "RELEASING" && media.nextAiringEpisode) {
      latestEpisode = media.nextAiringEpisode.episode - 1;
    }

    const finalEpisodes = totalEpisodes || latestEpisode || 0;

    return {
      id: `a-${media.id}`,
      title: media.title.romaji || media.title.english || "",
      englishTitle: media.title.english || undefined,
      overview: media.description ? media.description.replace(/<[^>]*>?/gm, "") : "", // strip HTML tags
      posterPath: media.coverImage.large || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop",
      backdropPath: media.bannerImage || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop",
      releaseDate: media.startDate.year ? `${media.startDate.year}-${String(media.startDate.month || 1).padStart(2, "0")}-${String(media.startDate.day || 1).padStart(2, "0")}` : "",
      rating: media.averageScore ? Math.round(media.averageScore) / 10 : 7.0,
      genres: media.genres || [],
      status: media.status || "FINISHED",
      episodes: finalEpisodes,
      totalEpisodes: totalEpisodes,
      latestEpisode: latestEpisode,
      season: media.season || undefined,
      studios: media.studios?.nodes?.map((s: any) => s.name) || [],
      characters: media.characters?.edges?.map((e: any) => ({
        name: e.node.name.full,
        image: e.node.image.medium,
        role: e.role
      })) || [],
      trailerUrl: media.trailer?.site === "youtube" ? `https://www.youtube.com/watch?v=${media.trailer.id}` : undefined,
      nextAiringEpisode: media.nextAiringEpisode ? {
        episode: media.nextAiringEpisode.episode,
        airingAt: media.nextAiringEpisode.airingAt
      } : undefined,
      popularity: media.popularity || 0
    };
  }

  private async fetchGraphQL(query: string, variables: any = {}): Promise<any> {
    const url = this.getEndpoint();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 21600 }, // Level 2 caching - 6 Hours
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      throw new Error(`AniList GraphQL HTTP Error ${res.status}`);
    }

    const json = await res.json();
    if (json.errors) {
      throw new Error(json.errors[0].message);
    }

    return json.data;
  }

  async getTrending(): Promise<AniListMedia[]> {
    const startTime = Date.now();
    const query = `
      query {
        Page(page: 1, perPage: 10) {
          media(type: ANIME, sort: TRENDING_DESC) {
            id
            title { romaji english }
            description
            coverImage { large }
            bannerImage
            startDate { year month day }
            averageScore
            genres
            status
            episodes
            season
            nextAiringEpisode { episode airingAt }
            studios(isMain: true) { nodes { name } }
          }
        }
      }
    `;

    try {
      const data = await this.fetchGraphQL(query);
      const mapped = (data.Page.media || []).map((m: any) => this.mapMedia(m));
      await this.logMetric("getTrending", Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric("getTrending", Date.now() - startTime, false, err.message);
      throw new AniListProviderError(err.message || "Failed to fetch trending anime", err);
    }
  }

  async getPopularAiring(): Promise<AniListMedia[]> {
    const startTime = Date.now();
    const query = `
      query {
        Page(page: 1, perPage: 10) {
          media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
            id
            title { romaji english }
            description
            coverImage { large }
            bannerImage
            startDate { year month day }
            averageScore
            genres
            status
            episodes
            season
            nextAiringEpisode { episode airingAt }
          }
        }
      }
    `;

    try {
      const data = await this.fetchGraphQL(query);
      const mapped = (data.Page.media || []).map((m: any) => this.mapMedia(m));
      await this.logMetric("getPopularAiring", Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric("getPopularAiring", Date.now() - startTime, false, err.message);
      throw new AniListProviderError(err.message || "Failed to fetch popular airing anime", err);
    }
  }

  async search(searchQuery: string): Promise<AniListMedia[]> {
    const startTime = Date.now();
    const query = `
      query ($search: String) {
        Page(page: 1, perPage: 12) {
          media(type: ANIME, search: $search) {
            id
            title { romaji english }
            description
            coverImage { large }
            bannerImage
            startDate { year month day }
            averageScore
            genres
            status
            episodes
            popularity
            nextAiringEpisode { episode airingAt }
          }
        }
      }
    `;

    try {
      const data = await this.fetchGraphQL(query, { search: searchQuery });
      const mapped = (data.Page.media || []).map((m: any) => this.mapMedia(m));
      await this.logMetric(`search?q=${searchQuery}`, Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric(`search?q=${searchQuery}`, Date.now() - startTime, false, err.message);
      throw new AniListProviderError(err.message || `Failed to search anime for query: ${searchQuery}`, err);
    }
  }

  async getDetails(id: string): Promise<AniListMedia | null> {
    const rawId = id.substring(2);
    const startTime = Date.now();
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title { romaji english }
          description
          coverImage { large }
          bannerImage
          startDate { year month day }
          averageScore
          genres
          status
          episodes
          season
          studios { nodes { name } }
          trailer { id site }
          characters(sort: ROLE, role: MAIN) {
            edges {
              role
              node {
                name { full }
                image { medium }
              }
            }
          }
          nextAiringEpisode { episode airingAt }
        }
      }
    `;

    try {
      const data = await this.fetchGraphQL(query, { id: parseInt(rawId) });
      if (!data.Media) return null;
      const mapped = this.mapMedia(data.Media);

      // Try to get TMDB details to enrich and override episode counts/status
      try {
        const tmdb = new TMDBProvider();
        const searchTitle = mapped.englishTitle || mapped.title;
        if (searchTitle) {
          const tmdbResults = await tmdb.search(searchTitle);
          // Look for a TV show match (series) prioritizing Animation (genre ID 16) and Japanese language
          let matchedSeries = tmdbResults.find(r => r.type === "series" && r.genreIds?.includes(16));
          if (!matchedSeries) {
            matchedSeries = tmdbResults.find(r => r.type === "series" && r.originalLanguage === "ja");
          }
          if (!matchedSeries) {
            matchedSeries = tmdbResults.find(r => r.type === "series");
          }
          if (matchedSeries) {
            mapped.tmdbId = matchedSeries.id;
            const tmdbDetails = await tmdb.getDetails(matchedSeries.id);
            if (tmdbDetails) {
              // Override mapped values with TMDB data
              mapped.totalEpisodes = tmdbDetails.totalEpisodes || mapped.totalEpisodes;
              mapped.latestEpisode = tmdbDetails.totalEpisodes || mapped.latestEpisode;
              mapped.episodes = tmdbDetails.totalEpisodes || mapped.episodes;
              mapped.status = tmdbDetails.status || mapped.status;
              if (tmdbDetails.nextEpisode) {
                mapped.nextAiringEpisode = {
                  episode: tmdbDetails.nextEpisode.episodeNumber,
                  airingAt: Math.floor(new Date(tmdbDetails.nextEpisode.airDate).getTime() / 1000)
                };
              }
            }
          }
        }
      } catch (err: any) {
        console.warn("Failed to enrich AniList media with TMDB data:", err.message);
      }

      await this.logMetric(`getDetails/${id}`, Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric(`getDetails/${id}`, Date.now() - startTime, false, err.message);
      throw new AniListProviderError(err.message || `Failed to fetch details for anime ID: ${id}`, err);
    }
  }

  async getAiringSchedule(startAt: number, endAt: number): Promise<AniListMedia[]> {
    const startTime = Date.now();
    const query = `
      query ($start: Int, $end: Int) {
        Page(page: 1, perPage: 30) {
          airingSchedules(airingAt_greater: $start, airingAt_lesser: $end) {
            episode
            airingAt
            media {
              id
              title { romaji english }
              description
              coverImage { large }
              bannerImage
              startDate { year month day }
              averageScore
              genres
              status
              episodes
            }
          }
        }
      }
    `;

    try {
      const data = await this.fetchGraphQL(query, { start: startAt, end: endAt });
      const mapped = (data.Page.airingSchedules || []).map((sched: any) => {
        const item = this.mapMedia(sched.media);
        item.nextAiringEpisode = {
          episode: sched.episode,
          airingAt: sched.airingAt
        };
        return item;
      });

      await this.logMetric(`getAiringSchedule`, Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric(`getAiringSchedule`, Date.now() - startTime, false, err.message);
      throw new AniListProviderError(err.message || "Failed to fetch airing schedule", err);
    }
  }

  async getRecommendations(id: string): Promise<AniListMedia[]> {
    const rawId = id.substring(2);
    const startTime = Date.now();
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          recommendations(sort: RATING_DESC) {
            nodes {
              mediaRecommendation {
                id
                title { romaji english }
                description
                coverImage { large }
                bannerImage
                startDate { year month day }
                averageScore
                genres
                status
                episodes
                popularity
                nextAiringEpisode { episode airingAt }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.fetchGraphQL(query, { id: parseInt(rawId) });
      if (!data.Media || !data.Media.recommendations || !data.Media.recommendations.nodes) {
        return [];
      }
      const mapped = data.Media.recommendations.nodes
        .filter((n: any) => n.mediaRecommendation !== null)
        .map((n: any) => this.mapMedia(n.mediaRecommendation));
      
      await this.logMetric(`getRecommendations/${id}`, Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      await this.logMetric(`getRecommendations/${id}`, Date.now() - startTime, false, err.message);
      throw new AniListProviderError(err.message || `Failed to fetch recommendations for anime ID: ${id}`, err);
    }
  }

  async discover(options: { genre?: string; year?: string; sort?: string; page?: number }): Promise<{ results: AniListMedia[]; totalPages: number }> {
    const query = `
      query ($page: Int, $genre: String, $year: Int, $sort: [MediaSort]) {
        Page(page: $page, perPage: 14) {
          pageInfo {
            total
            lastPage
          }
          media(type: ANIME, genre: $genre, startDate_like: $year, sort: $sort) {
            id
            title { romaji english }
            description
            coverImage { large }
            bannerImage
            startDate { year month day }
            averageScore
            genres
            status
            episodes
            popularity
            nextAiringEpisode { episode airingAt }
          }
        }
      }
    `;
    
    let sortVal = "POPULARITY_DESC";
    if (options.sort === "vote_average.desc") sortVal = "SCORE_DESC";
    else if (options.sort === "release_date.desc") sortVal = "START_DATE_DESC";
    else if (options.sort === "release_date.asc") sortVal = "START_DATE_ASC";

    const variables: any = {
      page: options.page || 1,
      sort: [sortVal]
    };
    if (options.genre) variables.genre = options.genre;
    if (options.year) variables.year = `${options.year}%`;

    try {
      const data = await this.fetchGraphQL(query, variables);
      const mapped = (data.Page.media || []).map((m: any) => this.mapMedia(m));
      return {
        results: mapped,
        totalPages: Math.min(data.Page.pageInfo.lastPage || 1, 50)
      };
    } catch (err: any) {
      console.error("AniList discover error:", err.message);
      return { results: [], totalPages: 1 };
    }
  }
}

