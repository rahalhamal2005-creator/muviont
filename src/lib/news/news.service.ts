import { NormalizedArticle } from "./news.types";
import { NewsAPIProvider } from "../providers/news.provider";
import { cache } from "../cache";

export class NewsService {
  private activeProviderName = "None";
  private provider = new NewsAPIProvider();

  // Track provider health states in memory for the admin dashboard
  private providerHealth: Record<string, { healthy: boolean; responseTime: number; lastError?: string }> = {
    "NewsAPI": { healthy: true, responseTime: 0 }
  };

  getActiveProvider(): string {
    return this.activeProviderName;
  }

  getProviderHealth() {
    return this.providerHealth;
  }

  private getTTLForCategory(category: NormalizedArticle["category"]): number {
    switch (category) {
      case "movie":
        return 900; // 15 Minutes (Entertainment news)
      case "series":
        return 900; // 15 Minutes
      case "anime":
        return 1800; // 30 Minutes
      case "industry":
        return 1800; // 30 Minutes
      default:
        return 900;
    }
  }

  private async fetchWithFailover(
    method: "getLatestNews" | "getMovieNews" | "getSeriesNews" | "getAnimeNews" | "getIndustryNews",
    category: NormalizedArticle["category"]
  ): Promise<NormalizedArticle[]> {
    const cacheKey = `news:${method}`;
    const ttl = this.getTTLForCategory(category);

    // 1. Try to serve from Cache layer (Level 3 - Redis / Local Memory)
    const cachedData = await cache.get<NormalizedArticle[]>(cacheKey);
    if (cachedData && cachedData.length > 0) {
      this.activeProviderName = "Redis Cache";
      return cachedData;
    }

    // 2. Query NewsAPI
    const startTime = Date.now();
    try {
      const articles = await this.provider[method]();
      
      this.activeProviderName = "NewsAPI";
      this.providerHealth["NewsAPI"] = {
        healthy: true,
        responseTime: Date.now() - startTime
      };

      if (articles && articles.length > 0) {
        // Store in Cache layer with category-specific TTL
        await cache.set(cacheKey, articles, ttl);
        // Also store backup cache with long expiration (1 day) for disaster recovery
        await cache.set(`${cacheKey}:backup`, articles, 86400);
        return articles;
      }
    } catch (err: any) {
      console.warn(`News Provider NewsAPI failed on ${method}:`, err.message);
      this.providerHealth["NewsAPI"] = {
        healthy: false,
        responseTime: Date.now() - startTime,
        lastError: err.message
      };
    }

    // 3. Disaster Recovery: If NewsAPI fails, try to fetch last valid backup from cache
    const backupCache = await cache.get<NormalizedArticle[]>(`${cacheKey}:backup`);
    if (backupCache && backupCache.length > 0) {
      this.activeProviderName = "Disaster Recovery Cache";
      return backupCache;
    }

    // 4. Throw service error when all fail
    this.activeProviderName = "Service Failed";
    throw new Error(`Critical News Service Failure: NewsAPI provider and backup caches failed for ${method}.`);
  }

  async getLatestNews(): Promise<NormalizedArticle[]> {
    return this.fetchWithFailover("getLatestNews", "industry");
  }

  async getMovieNews(): Promise<NormalizedArticle[]> {
    return this.fetchWithFailover("getMovieNews", "movie");
  }

  async getSeriesNews(): Promise<NormalizedArticle[]> {
    return this.fetchWithFailover("getSeriesNews", "series");
  }

  async getAnimeNews(): Promise<NormalizedArticle[]> {
    return this.fetchWithFailover("getAnimeNews", "anime");
  }

  async getIndustryNews(): Promise<NormalizedArticle[]> {
    return this.fetchWithFailover("getIndustryNews", "industry");
  }
}

// Export a singleton service instance
export const newsService = new NewsService();
