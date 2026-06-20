import { cache } from "../cache";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // timestamp
}

export async function rateLimit(ip: string, limit = 60, windowSeconds = 60): Promise<RateLimitResult> {
  const cacheKey = `ratelimit:${ip}`;
  const now = Math.floor(Date.now() / 1000);

  try {
    interface RateData {
      count: number;
      resetTime: number;
    }

    const current = await cache.get<RateData>(cacheKey);

    if (!current) {
      const resetTime = now + windowSeconds;
      await cache.set(cacheKey, { count: 1, resetTime }, windowSeconds);
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: resetTime,
      };
    }

    if (now > current.resetTime) {
      // Window expired, start new
      const resetTime = now + windowSeconds;
      await cache.set(cacheKey, { count: 1, resetTime }, windowSeconds);
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: resetTime,
      };
    }

    if (current.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: current.resetTime,
      };
    }

    const newCount = current.count + 1;
    const remainingTime = current.resetTime - now;
    await cache.set(cacheKey, { count: newCount, resetTime: current.resetTime }, remainingTime > 0 ? remainingTime : 1);

    return {
      success: true,
      limit,
      remaining: limit - newCount,
      reset: current.resetTime,
    };
  } catch {
    // If cache fails, fail open to avoid blocking legitimate users but log warning
    console.warn("Rate limiter failed to check cache, failing open.");
    return {
      success: true,
      limit,
      remaining: 1,
      reset: now + windowSeconds,
    };
  }
}
