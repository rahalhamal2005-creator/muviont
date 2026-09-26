/**
 * Edge-safe Prisma client wrapper.
 *
 * Prisma's module crashes at evaluation time inside edge runtimes (e.g.,
 * Cloudflare Workers / Next.js edge routes) because it uses Node-only APIs
 * like `fs` and `path`.  Rather than importing PrismaClient at the top level
 * we use a Proxy that lazily resolves the real client on first property
 * access **only when running in Node**.  Inside an edge runtime the proxy
 * returns no-op stubs so the build and cold-start succeed.
 */

const isEdgeRuntime =
  typeof globalThis !== "undefined" &&
  ((globalThis as any).__lagon !== undefined ||
    (globalThis as any).EdgeRuntime !== undefined ||
    // Cloudflare Workers
    typeof (globalThis as any).caches !== "undefined" &&
      typeof (globalThis as any).HTMLRewriter !== "undefined");

// Stub that silently resolves every chained call to null / []
function createNoopProxy(): any {
  return new Proxy(function () {}, {
    get(_target, prop) {
      // Allow common Prisma methods to be chainable
      if (
        typeof prop === "string" &&
        [
          "findUnique",
          "findFirst",
          "findMany",
          "create",
          "update",
          "upsert",
          "delete",
          "deleteMany",
          "count",
          "aggregate",
          "groupBy",
          "createMany",
          "updateMany",
        ].includes(prop)
      ) {
        return (..._args: any[]) => Promise.resolve(null);
      }
      // Model access (e.g., db.user) returns a chainable proxy
      return createNoopProxy();
    },
    apply() {
      return Promise.resolve(null);
    },
  });
}

let _client: any = null;

function getClient(): any {
  if (_client) return _client;

  if (isEdgeRuntime) {
    _client = createNoopProxy();
    return _client;
  }

  try {
    // Dynamic require so the module is never evaluated in edge bundles
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("@prisma/client");
    const globalForPrisma = globalThis as unknown as { prisma: any | undefined };

    _client =
      globalForPrisma.prisma ??
      new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = _client;
    }
  } catch (e: any) {
    console.warn("Prisma client unavailable, using no-op proxy:", e.message);
    _client = createNoopProxy();
  }

  return _client;
}

// Export a proxy that defers everything to the lazily-resolved real client
export const db: any = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getClient();
      const value = client[prop];
      if (typeof value === "function") {
        return value.bind(client);
      }
      return value;
    },
  },
);
