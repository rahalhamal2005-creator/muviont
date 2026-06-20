import Redis from "ioredis";

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

// Redis cache wrapper — degrades to MemoryCache on connection failure
class RedisCache implements ICache {
  private client: Redis;
  private fallback: MemoryCache = new MemoryCache();
  private degraded = false;

  constructor(url: string) {
    this.client = new Redis(url, {
      maxRetriesPerRequest: 0,   // fail immediately, don't retry
      connectTimeout: 1000,       // 1 second connection timeout
      lazyConnect: true,
      enableOfflineQueue: false,  // reject commands instantly when disconnected
    });

    this.client.on("error", (err) => {
      if (!this.degraded) {
        console.warn("Redis unavailable, falling back to in-memory cache:", err.message);
        this.degraded = true;
      }
    });

    this.client.on("connect", () => {
      this.degraded = false;
      console.info("Redis connected.");
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.degraded) return this.fallback.get<T>(key);
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      this.degraded = true;
      return this.fallback.get<T>(key);
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (this.degraded) return this.fallback.set(key, value, ttlSeconds);
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.set(key, serialized, "EX", ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
    } catch {
      this.degraded = true;
      return this.fallback.set(key, value, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    if (this.degraded) return this.fallback.del(key);
    try {
      await this.client.del(key);
    } catch {
      this.degraded = true;
      return this.fallback.del(key);
    }
  }
}

// Instantiate cache client based on environment configuration
let cacheInstance: ICache;

if (process.env.REDIS_URL) {
  cacheInstance = new RedisCache(process.env.REDIS_URL);
} else {
  cacheInstance = new MemoryCache();
}

export const cache = cacheInstance;
export type { ICache };

