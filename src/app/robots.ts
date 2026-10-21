import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://muviont.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/movie/", "/series/", "/anime/", "/dmca"],
        disallow: ["/watch/", "/admin/", "/api/", "/api/auth/"],
      },
      {
        userAgent: ["Googlebot", "Bingbot", "Applebot"],
        allow: ["/", "/movie/", "/series/", "/anime/", "/dmca"],
        disallow: ["/watch/", "/admin/", "/api/"],
      },
      {
        // Explicitly block known automated DMCA and copyright scraping bots
        userAgent: [
          "Piracymeter",
          "MarkMonitor",
          "Digimarc",
          "AudioEye",
          "Bytespider",
          "GPTBot",
          "CCBot",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
