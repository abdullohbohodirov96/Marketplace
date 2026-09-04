/**
 * Minimal sliding-window rate limiter.
 *
 * Dev/local fallback: in-memory Map, per server instance. This is enough for
 * a single Vercel dev/preview instance but does NOT work across multiple
 * serverless instances in production. Before launch, swap the store for
 * Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`) behind this same
 * `checkRateLimit` function signature — callers never need to change.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** Common presets used across the app (auth, reviews, chat, reports). */
export const RATE_LIMITS = {
  login: { limit: 5, windowMs: 5 * 60 * 1000 }, // 5 attempts / 5 min per identifier+ip
  register: { limit: 3, windowMs: 60 * 60 * 1000 },
  passwordReset: { limit: 3, windowMs: 60 * 60 * 1000 },
  review: { limit: 5, windowMs: 60 * 60 * 1000 },
  message: { limit: 30, windowMs: 60 * 1000 },
  report: { limit: 10, windowMs: 60 * 60 * 1000 },
} as const;
