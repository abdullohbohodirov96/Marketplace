/**
 * Sliding-window rate limiter.
 *
 * Production: backed by Upstash Redis when UPSTASH_REDIS_REST_URL /
 * UPSTASH_REDIS_REST_TOKEN are set — shared across every server instance, so
 * a limit actually holds under real (multi-instance) traffic.
 *
 * Dev/local fallback: in-memory Map, per server instance. Used automatically
 * when the Upstash env vars are absent (e.g. local dev, tests) so nothing
 * else needs to change to run without Redis. This is NOT safe across
 * multiple serverless instances — don't rely on it in production.
 *
 * Callers never need to know which store is active; only the return became
 * a Promise when Redis support was added.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// One Ratelimit instance per distinct (limit, windowMs) preset — cheap to
// construct, but keeping them around avoids rebuilding on every call.
const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  const existing = limiters.get(cacheKey);
  if (existing) return existing;

  const windowSeconds = Math.max(1, Math.round(windowMs / 1000));
  const rl = new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: false,
    prefix: "telefy-rl",
  });
  limiters.set(cacheKey, rl);
  return rl;
}

function checkRateLimitInMemory(
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

export async function checkRateLimit(
  key: string,
  preset: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  if (!redis) {
    return checkRateLimitInMemory(key, preset);
  }

  const rl = getLimiter(preset.limit, preset.windowMs);
  const result = await rl.limit(key);
  return { success: result.success, remaining: result.remaining, resetAt: result.reset };
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
