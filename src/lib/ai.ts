import { GoogleGenAI } from "@google/genai";
import { TMDBProvider } from "./providers/tmdb.provider";
import { AniListProvider } from "./providers/anilist.provider";
import { db } from "./db";

export interface AIIntent {
  searchQuery: string;
  mediaType: "movie" | "series" | "anime" | "any";
  genres: string[];
  reasoning: string;
  similarTo?: string;
}

export class AIService {
  private ai: any;
  private tmdb = new TMDBProvider();
  private anilist = new AniListProvider();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "your_gemini_api_key_here" && apiKey.trim() !== "") {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  private hasValidKey(): boolean {
    return !!this.ai;
  }

  isConversationalQuery(query: string): boolean {
    const phrases = [
      "like", "similar to", "best", "dark", "recommend", 
      "what should i", "movies about", "shows about", "sci-fi", "anime like"
    ];
    const cleanQuery = query.toLowerCase();
    return phrases.some(phrase => cleanQuery.includes(phrase)) || query.split(" ").length > 3;
  }

  async parseSearchIntent(query: string): Promise<AIIntent> {
    // Log the search query in database metrics
    db.searchLog.create({
      data: {
        query,
        isAI: this.isConversationalQuery(query)
      }
    }).catch(() => {});

    if (!this.hasValidKey()) {
      throw new Error("Critical Configuration Error: GEMINI_API_KEY is not defined. AI Features are unavailable.");
    }

    try {
      const prompt = `Analyze this user streaming query: "${query}".
Return a JSON object matching this schema:
{
  "searchQuery": string (extracted core title or search keyword),
  "mediaType": "movie" | "series" | "anime" | "any",
  "genres": string[] (list of relevant genres like Sci-Fi, Action, Mystery, Drama, Fantasy, Horror, Thriller),
  "reasoning": string (a short 1-sentence explanation of why these recommendations fit),
  "similarTo": string (optional, title of the reference movie/anime if they said "like X" or "similar to Y")
}
Do not return any markdown wrappers, return raw JSON string.`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      const cleanedText = text.replace(/```json/i, "").replace(/```/g, "").trim();
      return JSON.parse(cleanedText) as AIIntent;
    } catch (err: any) {
      console.error("Gemini AI intent parsing failed:", err.message);
      throw err;
    }
  }

  async executeAISearch(query: string): Promise<{ intent: AIIntent; results: any[] }> {
    const intent = await this.parseSearchIntent(query);
    let results: any[] = [];

    if (intent.mediaType === "anime") {
      results = await this.anilist.search(intent.searchQuery);
      if (intent.genres.length > 0) {
        results = results.filter(item => 
          item.genres.some((g: string) => intent.genres.includes(g))
        );
      }
    } else {
      results = await this.tmdb.search(intent.searchQuery);
      if (intent.mediaType !== "any") {
        results = results.filter(item => item.type === intent.mediaType);
      }
      if (intent.genres.length > 0) {
        results = results.filter(item => 
          item.genres.some((g: string) => intent.genres.includes(g))
        );
      }
    }

    return { intent, results };
  }

  async getAIRecommendations(userId: string): Promise<any[]> {
    // Fetch user's watch history and watchlist from database
    const history = await db.history.findMany({
      where: { userId },
      take: 5,
      orderBy: { updatedAt: "desc" }
    });

    if (history.length === 0) {
      const trending = await this.tmdb.getTrending();
      return trending.slice(0, 6);
    }

    const lastWatched = history[0];
    if (lastWatched.mediaType === "anime") {
      const anime = await this.anilist.getDetails(lastWatched.mediaId);
      if (anime) {
        const allAnime = await this.anilist.getTrending();
        return allAnime.filter(a => a.id !== anime.id && a.genres.some(g => anime.genres.includes(g))).slice(0, 6);
      }
    } else {
      const movie = await this.tmdb.getDetails(lastWatched.mediaId);
      if (movie) {
        return this.tmdb.getRecommendations(movie.id);
      }
    }

    const trending = await this.tmdb.getTrending();
    return trending.slice(0, 6);
  }
}

export const aiService = new AIService();
