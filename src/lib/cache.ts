/**
 * Edge-safe cache module.
 *
 * ioredis is Node-only and crashes at evaluation time inside edge runtimes.
 * We use a lazy-init pattern similar to db.ts: the Redis client is only
 * created on first access in a Node environment.  Inside edge runtimes
 * (or when REDIS_URL is missing) an in-memory Map-based cache is used.
 */

interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

// In-Memory cache fallback implementation with TTL checks
class MemoryCache implements ICache {
  private store = new Map<string, { value: any; expiresAt: number | null }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;

    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

let _cache: ICache | null = null;

function getCache(): ICache {
  if (_cache) return _cache;

  const isEdge =
    typeof globalThis !== "undefined" &&
    ((globalThis as any).__lagon !== undefined ||
      (globalThis as any).EdgeRuntime !== undefined ||
      (typeof (globalThis as any).caches !== "undefined" &&
        typeof (globalThis as any).HTMLRewriter !== "undefined"));

  if (isEdge || !process.env.REDIS_URL) {
    _cache = new MemoryCache();
    return _cache;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require("ioredis").default || require("ioredis");
    const fallback = new MemoryCache();
    let degraded = false;

    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 0,
      connectTimeout: 1000,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    client.on("error", (err: any) => {
      if (!degraded) {
        console.warn("Redis unavailable, falling back to in-memory cache:", err.message);
        degraded = true;
      }
    });

    client.on("connect", () => {
      degraded = false;
      console.info("Redis connected.");
    });

    _cache = {
      async get<T>(key: string): Promise<T | null> {
        if (degraded) return fallback.get<T>(key);
        try {
          const data = await client.get(key);
          if (!data) return null;
          return JSON.parse(data) as T;
        } catch {
          degraded = true;
          return fallback.get<T>(key);
        }
      },

      async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        if (degraded) return fallback.set(key, value, ttlSeconds);
        try {
          const serialized = JSON.stringify(value);
          if (ttlSeconds) {
            await client.set(key, serialized, "EX", ttlSeconds);
          } else {
            await client.set(key, serialized);
          }
        } catch {
          degraded = true;
          return fallback.set(key, value, ttlSeconds);
        }
      },

      async del(key: string): Promise<void> {
        if (degraded) return fallback.del(key);
        try {
          await client.del(key);
        } catch {
          degraded = true;
          return fallback.del(key);
        }
      },
    };
  } catch (e: any) {
    console.warn("Redis module unavailable, using in-memory cache:", e.message);
    _cache = new MemoryCache();
  }

  return _cache;
}

// Export a proxy so callers use `cache.get(...)` etc. transparently
export const cache: ICache = new Proxy({} as ICache, {
  get(_target, prop: string) {
    const c = getCache();
    const value = (c as any)[prop];
    if (typeof value === "function") {
      return value.bind(c);
    }
    return value;
  },
});

export type { ICache };
