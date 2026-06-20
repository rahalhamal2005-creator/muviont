import { NormalizedArticle, NewsProvider } from "../news/news.types";
import { db } from "../db";

export class NewsAPIProvider implements NewsProvider {
  name = "NewsAPI";
  private apiKey = process.env.NEWS_API_KEY;
  private baseUrl = "https://newsapi.org/v2";

  private async logMetric(endpoint: string, latency: number, success: boolean, errorMsg?: string) {
    db.providerMetric.create({
      data: {
        provider: "NewsAPI",
        endpoint,
        latency,
        success,
        errorMsg: errorMsg || null,
      }
    }).catch(() => {});
  }

  private hasValidKey(): boolean {
    return !!this.apiKey && this.apiKey !== "your_news_api_key_here" && this.apiKey.trim() !== "";
  }

  private async fetchFromNewsAPI(query: string, category: NormalizedArticle["category"]): Promise<NormalizedArticle[]> {
    const start = Date.now();
    const endpoint = `/everything`;

    if (!this.hasValidKey()) {
      const err = new Error("NewsAPI Key is missing or invalid");
      await this.logMetric(endpoint, Date.now() - start, false, err.message);
      throw err;
    }

    const url = `${this.baseUrl}${endpoint}?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${this.apiKey}`;

    try {
      const res = await fetch(url, {
        next: { revalidate: 900 },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error(`NewsAPI HTTP Error ${res.status}`);
      const data = await res.json();

      if (data.status !== "ok" || !data.articles) {
        throw new Error(data.message || "NewsAPI call returned an error status");
      }

      const normalized: NormalizedArticle[] = data.articles.map((art: any, index: number) => ({
        id: `newsapi-${art.source?.id || "src"}-${index}-${Date.parse(art.publishedAt || "") || 0}`,
        title: art.title || "Entertainment Update",
        description: art.description || "",
        imageUrl: art.urlToImage || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop",
        source: art.source?.name || "NewsAPI",
        category,
        publishedAt: art.publishedAt ? new Date(art.publishedAt).toISOString() : new Date().toISOString(),
        url: art.url
      }));

      await this.logMetric(endpoint, Date.now() - start, true);
      return normalized;
    } catch (err: any) {
      await this.logMetric(endpoint, Date.now() - start, false, err.message);
      throw err;
    }
  }

  async getLatestNews(): Promise<NormalizedArticle[]> {
    return this.fetchFromNewsAPI("movie OR tv OR anime", "industry");
  }

  async getMovieNews(): Promise<NormalizedArticle[]> {
    return this.fetchFromNewsAPI("movie OR Hollywood", "movie");
  }

  async getSeriesNews(): Promise<NormalizedArticle[]> {
    return this.fetchFromNewsAPI("tv series OR Netflix", "series");
  }

  async getAnimeNews(): Promise<NormalizedArticle[]> {
    return this.fetchFromNewsAPI("anime OR manga", "anime");
  }

  async getIndustryNews(): Promise<NormalizedArticle[]> {
    return this.fetchFromNewsAPI("entertainment streaming industry", "industry");
  }
}
