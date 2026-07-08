/**
 * MUVIONT Streaming Sources
 * Extracted & adapted from CineVault's proven embed architecture.
 * These are public embed providers that aggregate streaming content.
 */

export interface StreamSource {
  name: string;
  key: string;
  movieUrl: (tmdbId: string | number) => string;
  seriesUrl: (tmdbId: string | number, season: number, episode: number) => string;
  animeUrl?: (malId: string | number, episode: number) => string;
}

/**
 * Multi-source streaming providers ordered by reliability.
 * Users can switch between sources if one fails to load.
 */
export const STREAMING_SOURCES: StreamSource[] = [
  {
    name: "Direct HLS Stream",
    key: "direct-stream",
    movieUrl:  (id) => `/api/stream?id=${id}&type=movie`,
    seriesUrl: (id, s, e) => `/api/stream?id=${id}&type=series&season=${s}&episode=${e}`,
  },
  {
    name: "VidLink",
    key: "vidlink",
    movieUrl:  (id) => `https://vidlink.pro/movie/${id}`,
    seriesUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    name: "VidSrc Pro",
    key: "vidsrc-pro",
    movieUrl:  (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    seriesUrl: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: "VidSrc",
    key: "vidsrc",
    movieUrl:  (id) => `https://vidsrc.to/embed/movie/${id}`,
    seriesUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: "SuperEmbed",
    key: "superembed",
    movieUrl:  (id) => `https://play.superembed.xyz/?video_id=${id}&tmdb=1`,
    seriesUrl: (id, s, e) => `https://play.superembed.xyz/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    name: "MultiEmbed",
    key: "multiembed",
    movieUrl:  (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    seriesUrl: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    name: "2Embed",
    key: "2embed",
    movieUrl:  (id) => `https://www.2embed.cc/embed/${id}`,
    seriesUrl: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    name: "MoviesAPI",
    key: "moviesapi",
    movieUrl:  (id) => `https://moviesapi.club/movie/${id}`,
    seriesUrl: (id, s, e) => `https://moviesapi.club/tv/${id}-${s}-${e}`,
  },
];

/**
 * Get the raw TMDB numeric ID from MUVIONT prefixed IDs.
 * MUVIONT uses "m-12345" for movies, "s-12345" for series.
 */
export function getRawTmdbId(muviontId: string): string {
  if (muviontId.startsWith("m-") || muviontId.startsWith("s-")) {
    return muviontId.substring(2);
  }
  return muviontId;
}

/**
 * Get the raw AniList numeric ID from MUVIONT anime IDs.
 * MUVIONT uses "a-12345" for anime.
 */
export function getRawAniListId(muviontId: string): string {
  if (muviontId.startsWith("a-")) {
    return muviontId.substring(2);
  }
  return muviontId;
}

/**
 * Build movie embed URL for a given source index.
 */
export function buildMovieEmbedUrl(tmdbId: string, sourceIndex: number = 0): string {
  const source = STREAMING_SOURCES[sourceIndex] ?? STREAMING_SOURCES[0];
  return source.movieUrl(tmdbId);
}

/**
 * Build series embed URL for a given source index.
 */
export function buildSeriesEmbedUrl(
  tmdbId: string,
  season: number,
  episode: number,
  sourceIndex: number = 0
): string {
  const source = STREAMING_SOURCES[sourceIndex] ?? STREAMING_SOURCES[0];
  return source.seriesUrl(tmdbId, season, episode);
}
