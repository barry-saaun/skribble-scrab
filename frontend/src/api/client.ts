import createClient from "openapi-fetch";
import type { paths } from "./v1";

/**
 * Typed API client generated from openapi.yaml.
 *
 * Server-side (server actions, server components): uses BACKEND_URL env var.
 * Client-side: uses NEXT_PUBLIC_API_BASE_URL env var.
 *
 * Run `npm run generate:api` after updating openapi.yaml to refresh types.
 */
export const api = createClient<paths>({
  baseUrl:
    process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080",
});
