// db import removed — metric logging disabled
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

export const CURATED_FALLBACK_ANIME: AniListMedia[] = [
  {
    id: "a-151807",
    title: "Solo Leveling",
    englishTitle: "Solo Leveling",
    overview: "10 years ago, after 'the Gate' that connected the real world with the monster world opened, some of the ordinary, everyday people received the power to hunt monsters within the Gate. They are known as 'Hunters'.",
    posterPath: "https://image.tmdb.org/t/p/w500/geCRueV3ElhRTr0xtJuEWJt6dJ1.jpg",
    backdropPath: "https://image.tmdb.org/t/p/w1280/xMNH87maNLt9n2bMDYeI6db5VFm.jpg",
    releaseDate: "2024-01-06",
    rating: 8.7,
    genres: ["Action", "Adventure", "Fantasy"],
    status: "RELEASING",
    episodes: 24,
    totalEpisodes: 24,
    latestEpisode: 12,
    studios: ["A-1 Pictures"],
    characters: [],
    popularity: 98000
  },
  {
    id: "a-145064",
    title: "Jujutsu Kaisen Season 2",
    englishTitle: "Jujutsu Kaisen Season 2",
    overview: "The past comes to light when Satoru Gojo and Suguru Geto are tasked with escorting the Star Plasma Vessel, Riko Amanai.",
    posterPath: "https://image.tmdb.org/t/p/w500/6qQzMJG27XOJsyAEEIisoJB45j2.jpg",
    backdropPath: "https://image.tmdb.org/t/p/w1280/qpin8cASXEVtwhzNsprHYFiOAGk.jpg",
    releaseDate: "2023-07-06",
    rating: 8.9,
    genres: ["Action", "Fantasy", "Supernatural"],
    status: "FINISHED",
    episodes: 23,
    totalEpisodes: 23,
    latestEpisode: 23,
    studios: ["MAPPA"],
    characters: [],
    popularity: 95000
  },
  {
    id: "a-101922",
    title: "Kimetsu no Yaiba",
    englishTitle: "Demon Slayer: Kimetsu no Yaiba",
    overview: "It is the Taisho Period in Japan. Tanjiro, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon.",
    posterPath: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
    backdropPath: "https://image.tmdb.org/t/p/w1280/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg",
    releaseDate: "2019-04-06",
    rating: 8.6,
    genres: ["Action", "Adventure", "Fantasy", "Supernatural"],
    status: "FINISHED",
    episodes: 26,
    totalEpisodes: 26,
    latestEpisode: 26,
    studios: ["ufotable"],
    characters: [],
    popularity: 97000
  },
  {
    id: "a-16498",
    title: "Shingeki no Kyojin",
    englishTitle: "Attack on Titan",
    overview: "Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans, forcing humans to hide within enormous concentric walls.",
    posterPath: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
    backdropPath: "https://image.tmdb.org/t/p/w1280/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg",
    releaseDate: "2013-04-07",
    rating: 8.9,
    genres: ["Action", "Drama", "Fantasy", "Mystery"],
    status: "FINISHED",
    episodes: 25,
    totalEpisodes: 25,
    latestEpisode: 25,
    studios: ["WIT Studio"],
    characters: [],
    popularity: 99000
  },
  {
    id: "a-21",
    title: "ONE PIECE",
    englishTitle: "One Piece",
    overview: "Gol D. Roger, a man referred to as the 'Pirate King,' is set to be executed by the World Government. But just before his demise, he confirms the existence of a great treasure, the One Piece.",
    posterPath: "https://image.tmdb.org/t/p/w500/dB4EDhre2dsC2kxYDavyKWqLQwi.jpg",
    backdropPath: "https://image.tmdb.org/t/p/w1280/v38qp4bySLTXYu3MF8r5GD51FN3.jpg",
    releaseDate: "1999-10-20",
    rating: 8.8,
    genres: ["Action", "Adventure", "Comedy", "Fantasy"],
    status: "RELEASING",
    episodes: 1120,
    totalEpisodes: 1120,
    latestEpisode: 1120,
    studios: ["Toei Animation"],
    characters: [],
    popularity: 99900
  },
  {
    id: "a-154587",
    title: "Sousou no Frieren",
    englishTitle: "Frieren: Beyond Journey's End",
    overview: "The demon king has been defeated, and the victorious hero party returns home before disbanding. The four—mage Frieren, hero Himmel, priest Heiter, and warrior Eisen—reminisce about their decade-long journey.",
    posterPath: "https://image.tmdb.org/t/p/w500/dqZENchTd7lp5zht7BdlqM7RBhD.jpg",
    backdropPath: "https://image.tmdb.org/t/p/w1280/rBOnrVlck7BIlGeWVlzYiZeg4l2.jpg",
    releaseDate: "2023-09-29",
    rating: 9.3,
    genres: ["Adventure", "Drama", "Fantasy"],
    status: "FINISHED",
    episodes: 28,
    totalEpisodes: 28,
    latestEpisode: 28,
    studios: ["Madhouse"],
    characters: [],
    popularity: 96000
  },
  {
    id: "a-116674",
    title: "BLEACH: Sennen Kessen-hen",
    englishTitle: "Bleach: Thousand-Year Blood War",
    overview: "Was all this just a coincidence, or was it inevitable? Ichigo Kurosaki, who became a Substitute Soul Reaper through a chance encounter...",
    posterPath: "https://image.tmdb.org/t/p/w500/2EewmxXe72ogD0EaWM8gqa0ccIw.jpg",
    backdropPath: "https://image.tmdb.org/t/p/w1280/o0NsbcIvsllg6CJX0FBFY8wWbsn.jpg",
    releaseDate: "2022-10-11",
    rating: 9.0,
    genres: ["Action", "Adventure", "Supernatural"],
    status: "FINISHED",
    episodes: 26,
    totalEpisodes: 26,
    latestEpisode: 26,
    studios: ["Studio Pierrot"],
    characters: [],
    popularity: 91000
  },
  {
    id: "a-127230",
    title: "Chainsaw Man",
    englishTitle: "Chainsaw Man",
    overview: "Denji is a teenage boy living with a Chainsaw Devil named Pochita. Due to the debt his father left behind, he has been living a rock-bottom life while repaying his debt by harvesting devil corpses with Pochita.",
    posterPath: "https://image.tmdb.org/t/p/w500/npdB6eFzizki0WaZ1OvKcJrWe97.jpg",
    backdropPath: "https://image.tmdb.org/t/p/w1280/5DUMPBSnHOZsbBv81GFXZXvDpo6.jpg",
    releaseDate: "2022-10-12",
    rating: 8.5,
    genres: ["Action", "Comedy", "Horror", "Supernatural"],
    status: "FINISHED",
    episodes: 12,
    totalEpisodes: 12,
    latestEpisode: 12,
    studios: ["MAPPA"],
    characters: [],
    popularity: 94000
  },
  {
    id: "a-171018",
    title: "Dandadan",
    englishTitle: "DAN DA DAN",
    overview: "Momo Ayase strikes up an unusual friendship with her school's UFO fanatic, whom she nicknames 'Okarun'.",
    posterPath: "https://image.tmdb.org/t/p/w500/6qfZAOEUFIrbUH3JvePclx1nXzz.jpg",
    backdropPath: "https://image.tmdb.org/t/p/w1280/uNTrRKIOyKYISthoeizghtXPEOK.jpg",
    releaseDate: "2024-10-04",
    rating: 8.8,
    genres: ["Action", "Comedy", "Sci-Fi", "Supernatural"],
    status: "RELEASING",
    episodes: 12,
    totalEpisodes: 12,
    latestEpisode: 12,
    studios: ["Science SARU"],
    characters: [],
    popularity: 92000
  },
  {
    id: "a-1535",
    title: "Death Note",
    englishTitle: "Death Note",
    overview: "A shinigami, as a god of death, can kill any person—provided they see their victim's face and write their victim's name in a notebook called a Death Note.",
    posterPath: "https://image.tmdb.org/t/p/w500/tCZFfYTIwrR7n94J6G14Y4hAFU6.jpg",
    backdropPath: "https://image.tmdb.org/t/p/w1280/z8IPicmEKXUO4I2UDdMEqw7RqOE.jpg",
    releaseDate: "2006-10-04",
    rating: 8.7,
    genres: ["Mystery", "Psychological", "Supernatural", "Thriller"],
    status: "FINISHED",
    episodes: 37,
    totalEpisodes: 37,
    latestEpisode: 37,
    studios: ["Madhouse"],
    characters: [],
    popularity: 98500
  }
];

// In-memory cache for GraphQL responses to eliminate rate limits and provide instant page loads
const GQL_CACHE = new Map<string, { data: any; expiresAt: number }>();

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

  // Metric logging disabled — was filling Neon 512 MB limit
  private async logMetric(_endpoint: string, _latency: number, _success: boolean, _errorMsg?: string) {
    // no-op: telemetry writes exceeded database storage capacity
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
      posterPath: media.coverImage?.large || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop",
      backdropPath: media.bannerImage || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop",
      releaseDate: media.startDate?.year ? `${media.startDate.year}-${String(media.startDate.month || 1).padStart(2, "0")}-${String(media.startDate.day || 1).padStart(2, "0")}` : "",
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
        image: e.node.image?.medium,
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
    const cacheKey = JSON.stringify({ query, variables });
    const cached = GQL_CACHE.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const url = this.getEndpoint();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      throw new Error(`AniList GraphQL HTTP Error ${res.status}`);
    }

    const json = await res.json();
    if (json.errors) {
      throw new Error(json.errors[0].message);
    }

    // Cache valid response for 20 minutes
    GQL_CACHE.set(cacheKey, {
      data: json.data,
      expiresAt: Date.now() + 20 * 60 * 1000
    });

    return json.data;
  }

  async getTrending(): Promise<AniListMedia[]> {
    const startTime = Date.now();
    const query = `
      query {
        Page(page: 1, perPage: 12) {
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
            trailer { id site }
          }
        }
      }
    `;

    try {
      const data = await this.fetchGraphQL(query);
      const mapped = (data.Page.media || []).map((m: any) => this.mapMedia(m));
      if (mapped.length === 0) return CURATED_FALLBACK_ANIME;
      await this.logMetric("getTrending", Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      console.warn("AniList getTrending failed, returning curated fallback:", err.message);
      await this.logMetric("getTrending", Date.now() - startTime, false, err.message);
      return CURATED_FALLBACK_ANIME;
    }
  }

  async getPopularAiring(): Promise<AniListMedia[]> {
    const startTime = Date.now();
    const query = `
      query {
        Page(page: 1, perPage: 12) {
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
            trailer { id site }
          }
        }
      }
    `;

    try {
      const data = await this.fetchGraphQL(query);
      const mapped = (data.Page.media || []).map((m: any) => this.mapMedia(m));
      if (mapped.length === 0) return CURATED_FALLBACK_ANIME.filter(a => a.status === "RELEASING");
      await this.logMetric("getPopularAiring", Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      console.warn("AniList getPopularAiring failed, returning curated fallback:", err.message);
      await this.logMetric("getPopularAiring", Date.now() - startTime, false, err.message);
      return CURATED_FALLBACK_ANIME.filter(a => a.status === "RELEASING");
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
    const rawId = id.startsWith("a-") ? id.substring(2) : id;
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
      console.warn(`getDetails/${id} failed, checking curated fallback:`, err.message);
      await this.logMetric(`getDetails/${id}`, Date.now() - startTime, false, err.message);
      const cleanId = id.startsWith("a-") ? id : `a-${id}`;
      const found = CURATED_FALLBACK_ANIME.find(a => a.id === cleanId || a.id === id);
      if (found) return found;
      return null;
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

      if (mapped.length > 0) {
        await this.logMetric(`getAiringSchedule`, Date.now() - startTime, true);
        return mapped;
      }
      throw new Error("No airing schedules found in window");
    } catch (err: any) {
      console.warn("AniList getAiringSchedule fallback active:", err.message);
      await this.logMetric(`getAiringSchedule`, Date.now() - startTime, false, err.message);
      const now = Math.floor(Date.now() / 1000);
      return CURATED_FALLBACK_ANIME.slice(0, 10).map((anime, idx) => {
        const dayOffset = (idx % 7) - 3;
        const airingTime = now + (dayOffset * 86400) + (idx * 3600);
        return {
          ...anime,
          nextAiringEpisode: {
            episode: (anime.latestEpisode || 1) + 1,
            airingAt: airingTime,
          }
        };
      });
    }
  }

  async getRecommendations(id: string): Promise<AniListMedia[]> {
    const rawId = id.startsWith("a-") ? id.substring(2) : id;
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
        return CURATED_FALLBACK_ANIME.filter(a => a.id !== id).slice(0, 6);
      }
      const mapped = data.Media.recommendations.nodes
        .filter((n: any) => n.mediaRecommendation !== null)
        .map((n: any) => this.mapMedia(n.mediaRecommendation));
      
      if (mapped.length === 0) return CURATED_FALLBACK_ANIME.filter(a => a.id !== id).slice(0, 6);
      await this.logMetric(`getRecommendations/${id}`, Date.now() - startTime, true);
      return mapped;
    } catch (err: any) {
      console.warn(`AniList getRecommendations/${id} failed:`, err.message);
      await this.logMetric(`getRecommendations/${id}`, Date.now() - startTime, false, err.message);
      return CURATED_FALLBACK_ANIME.filter(a => a.id !== id).slice(0, 6);
    }
  }

  async discover(options: { genre?: string; year?: string; sort?: string; page?: number }): Promise<{ results: AniListMedia[]; totalPages: number }> {
    const query = `
      query ($page: Int, $genre: String, $year: String, $sort: [MediaSort]) {
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
            trailer { id site }
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
      if (mapped.length === 0) {
        return {
          results: CURATED_FALLBACK_ANIME,
          totalPages: 1
        };
      }
      return {
        results: mapped,
        totalPages: Math.min(data.Page.pageInfo.lastPage || 1, 50)
      };
    } catch (err: any) {
      console.warn("AniList discover error, returning curated fallback:", err.message);
      let list = CURATED_FALLBACK_ANIME;
      if (options.genre) {
        const filtered = list.filter(a => a.genres.some(g => g.toLowerCase() === options.genre?.toLowerCase()));
        if (filtered.length > 0) list = filtered;
      }
      return { results: list, totalPages: 5 };
    }
  }
}

