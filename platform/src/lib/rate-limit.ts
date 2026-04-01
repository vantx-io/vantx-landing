import { Ratelimit } from "@upstash/ratelimit";
import type { Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy singleton for Redis (same pattern as getStripe() in stripe.ts)
let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

// Module-level ephemeral cache — persists across calls within same warm instance
const rateLimitCache = new Map();

export interface RateLimitConfig {
  requests: number;
  window: Duration;
  prefix: string; // required, route-specific to prevent key collisions
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix ms timestamp
}

export function getRateLimitIdentifier(
  req: Request,
  userId: string | undefined,
): string {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0].trim();
  return ip ? `ip:${ip}` : "ip:anonymous";
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  try {
    const rl = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      prefix: config.prefix,
      ephemeralCache: rateLimitCache,
    });
    const result = await rl.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    // Fail open — Upstash outage must not take down the platform
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      reset: Date.now() + 60_000,
    };
  }
}

export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded", retryAfter }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}

export function rateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
  };
}
