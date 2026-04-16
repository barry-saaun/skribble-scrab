import createClient from "openapi-fetch";
import type { paths } from "./v1";
import { env } from "~/env";

/**
 * Typed API client generated from openapi.yaml.
 *
 * Uses NEXT_PUBLIC_API_BASE_URL env var with automatic dev/prod differentiation.
 *
 * Run `npm run generate:api` after updating openapi.yaml to refresh types.
 */
export const api = createClient<paths>({
  baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
});
