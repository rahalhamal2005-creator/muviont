import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.BETTER_AUTH_URL && !process.env.BETTER_AUTH_URL.includes("localhost") 
    ? process.env.BETTER_AUTH_URL 
    : "https://muviont.com";

  // Base pages
  const routes = ["", "/anime", "/watchlist"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Dynamic movie routes (pre-mapped popular movies)
  const popularMovies = ["m-1", "m-2", "m-3", "m-4"].map((id) => ({
    url: `${baseUrl}/movie/${id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic anime routes (pre-mapped popular anime)
  const popularAnime = ["a-1", "a-2", "a-3", "a-4"].map((id) => ({
    url: `${baseUrl}/anime/${id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...routes, ...popularMovies, ...popularAnime];
}
