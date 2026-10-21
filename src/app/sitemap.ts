import { MetadataRoute } from "next";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";

export const revalidate = 86400; // Refresh sitemap once every 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://muviont.com";

  // Core static pages
  const staticRoutes = [
    "",
    "/movies",
    "/series",
    "/anime",
    "/trending",
    "/watchlist",
    "/login",
    "/dmca",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: (route === "" ? "daily" : "weekly") as "daily" | "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  const dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const tmdb = new TMDBProvider();
    const [trending, popMovies, popSeries, topRated] = await Promise.all([
      tmdb.getTrending("all").catch(() => []),
      tmdb.getPopular("movie").catch(() => []),
      tmdb.getPopular("series").catch(() => []),
      tmdb.getTopRated("movie").catch(() => []),
    ]);

    const allMedia = [...trending, ...popMovies, ...popSeries, ...topRated];
    const seenIds = new Set<string>();

    for (const item of allMedia) {
      if (!item || !item.id || seenIds.has(item.id)) continue;
      seenIds.add(item.id);

      const isSeries = item.type === "series" || item.id.startsWith("s-");
      const basePath = isSeries ? "series" : "movie";

      // Discovery & Detail page URL only (NO watch URLs)
      dynamicRoutes.push({
        url: `${baseUrl}/${basePath}/${item.id}`,
        lastModified: new Date().toISOString(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (err) {
    console.warn("Dynamic sitemap generation error:", err);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
