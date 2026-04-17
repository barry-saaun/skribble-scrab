import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    BACKEND_URL: z.url().default("http://localhost:8080"),
  },
  client: {
    NEXT_PUBLIC_WS_BASE_URL: z.string().min(1),
    NEXT_PUBLIC_API_BASE_URL: z.string().min(1),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    BACKEND_URL: process.env.BACKEND_URL,
    NEXT_PUBLIC_WS_BASE_URL:
      process.env.NEXT_PUBLIC_WS_BASE_URL ||
      (process.env.NODE_ENV === "development"
        ? "ws://localhost:8080"
        : "wss://skribble-scrab-backend.fly.dev"),
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      (process.env.NODE_ENV === "development"
        ? "http://localhost:8080"
        : "https://skribble-scrab-backend.fly.dev"),
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
