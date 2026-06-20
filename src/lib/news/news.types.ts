export interface NormalizedArticle {
  id: string; // hashed URL / GUID
  title: string;
  description: string;
  imageUrl: string;
  source: string;
  category: "movie" | "anime" | "series" | "industry";
  publishedAt: string; // ISO string
  url: string;
}

export interface NewsProvider {
  name: string;
  getLatestNews(): Promise<NormalizedArticle[]>;
  getMovieNews(): Promise<NormalizedArticle[]>;
  getSeriesNews(): Promise<NormalizedArticle[]>;
  getAnimeNews(): Promise<NormalizedArticle[]>;
  getIndustryNews(): Promise<NormalizedArticle[]>;
}
