import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),
  REDIS_URL: z.string().url().optional(),
  TMDB_API_KEY: z.string().min(1, "TMDB_API_KEY is required"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  YOUTUBE_API_KEY: z.string().optional(),
  NEWSAPI_KEY: z.string().optional(),
  THENEWSAPI_KEY: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(10, "BETTER_AUTH_SECRET must be at least 10 characters long"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid base URL"),
});

// Run validation
export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.warn("⚠️ MUVIONT Environment Configuration Warnings:\n", result.error.format());
    return false;
  }
  return true;
}

// Call validation in dev mode
if (process.env.NODE_ENV !== "production") {
  validateEnv();
}
