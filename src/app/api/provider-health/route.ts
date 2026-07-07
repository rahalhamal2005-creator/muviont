import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simple in-memory cache for provider health
let cachedHealth: Record<string, "ONLINE" | "OFFLINE"> | null = null;
let lastCheckTime = 0;
const CACHE_TTL = 300000; // 5 minutes cache

const PROVIDERS = [
  { key: "vidsrc-pro", url: "https://vidsrc.cc" },
  { key: "vidsrc",     url: "https://vidsrc.to" },
  { key: "2embed",     url: "https://www.2embed.cc" },
  { key: "moviesapi",  url: "https://moviesapi.club" }
];

async function checkUrl(url: string): Promise<"ONLINE" | "OFFLINE"> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const res = await fetch(url, {
      method: "HEAD", // Use HEAD to minimize bandwidth
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: controller.signal,
      next: { revalidate: 0 } // Bypass Next.js caching
    });
    
    clearTimeout(timeoutId);
    
    if (res.status >= 200 && res.status < 400) {
      return "ONLINE";
    }
    
    // Fallback: try GET if HEAD is not supported/blocked
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 3500);
    const res2 = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: controller2.signal,
      next: { revalidate: 0 }
    });
    clearTimeout(timeoutId2);
    
    return res2.status >= 200 && res2.status < 400 ? "ONLINE" : "OFFLINE";
  } catch {
    return "OFFLINE";
  }
}

export async function GET() {
  const now = Date.now();
  
  if (cachedHealth && (now - lastCheckTime < CACHE_TTL)) {
    return NextResponse.json(cachedHealth, {
      headers: { "Cache-Control": "public, max-age=60" }
    });
  }

  const results: Record<string, "ONLINE" | "OFFLINE"> = {};
  
  // Run checks in parallel
  await Promise.all(
    PROVIDERS.map(async (p) => {
      const start = Date.now();
      const status = await checkUrl(p.url);
      results[p.key] = status;

      // Log status to ProviderMetric
      await db.providerMetric.create({
        data: {
          provider: p.key,
          endpoint: p.url,
          latency: Date.now() - start,
          success: status === "ONLINE",
          errorMsg: status === "OFFLINE" ? "Provider OFFLINE" : null
        }
      }).catch(() => {});
    })
  );

  cachedHealth = results;
  lastCheckTime = now;

  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, max-age=60" }
  });
}
