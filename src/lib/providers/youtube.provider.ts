import { db } from "../db";

export class YouTubeProvider {
  private apiKey = process.env.YOUTUBE_API_KEY;

  private checkApiKey() {
    if (!this.apiKey || this.apiKey === "your_youtube_api_key_here" || this.apiKey.trim() === "") {
      throw new Error("Critical Configuration Error: YOUTUBE_API_KEY is not defined in environment variables.");
    }
  }

  private async logMetric(endpoint: string, latency: number, success: boolean, errorMsg?: string) {
    db.providerMetric.create({
      data: {
        provider: "YouTube",
        endpoint,
        latency,
        success,
        errorMsg: errorMsg || null,
      }
    }).catch(() => {});
  }

  private async searchYouTube(searchQuery: string): Promise<string> {
    this.checkApiKey();
    const start = Date.now();
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&key=${this.apiKey}`;

    try {
      const res = await fetch(url, {
        next: { revalidate: 43200 }, // 12 Hours Cache
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error(`YouTube API Error: HTTP ${res.status}`);
      const data = await res.json();
      
      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;
        await this.logMetric(`api/search?q=${searchQuery}`, Date.now() - start, true);
        return videoId;
      }
      throw new Error(`No YouTube video results found for: "${searchQuery}"`);
    } catch (err: any) {
      await this.logMetric(`api/search?q=${searchQuery}`, Date.now() - start, false, err.message);
      throw err;
    }
  }

  async getTrailerVideoId(query: string): Promise<string> {
    return this.searchYouTube(`${query} official trailer`);
  }

  async getClipVideoId(query: string): Promise<string> {
    return this.searchYouTube(`${query} official clip`);
  }

  async getTeaserVideoId(query: string): Promise<string> {
    return this.searchYouTube(`${query} official teaser`);
  }
}
