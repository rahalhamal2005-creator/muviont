import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://muviont.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/movie/", "/series/", "/anime/", "/watch/"],
        disallow: ["/admin/", "/api/", "/api/auth/"],
      },
      {
        userAgent: ["Googlebot", "Bingbot", "Applebot"],
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
