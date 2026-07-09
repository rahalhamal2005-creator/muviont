import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.BETTER_AUTH_URL && !process.env.BETTER_AUTH_URL.includes("localhost") 
    ? process.env.BETTER_AUTH_URL 
    : "https://muviont.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/api/auth/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
