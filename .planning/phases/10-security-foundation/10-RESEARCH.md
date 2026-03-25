# Phase 10: Rate Limiting - Research

**Researched:** 2026-03-25
**Domain:** Upstash Redis rate limiting — Next.js App Router API routes
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use authenticated user ID (from Supabase session) as rate limit key when available; fall back to IP address (`x-forwarded-for` or `request.ip`) for anonymous/unauthenticated requests
- **D-02:** Stripe webhook route (`/api/webhooks/stripe`) is exempt from rate limiting
- **D-03:** Single identifier check per request (not dual IP+user)
- **D-04:** Auth-adjacent routes (checkout, billing-portal): **5 requests per minute**
- **D-05:** Task mutation routes (POST `/api/tasks`, PATCH status, POST comments): **20 requests per minute**
- **D-06:** General fallback for any future API routes: **60 requests per minute**
- **D-07:** Stripe webhook exempt (same as D-02)
- **D-08:** Shared utility at `platform/src/lib/rate-limit.ts` — NOT middleware-level
- **D-09:** Each API route handler calls `rateLimit()` at the top with its specific config
- **D-10:** Upstash Redis client instantiated as lazy singleton (same pattern as `getStripe()` in `stripe.ts`)
- **D-11:** Response includes both `Retry-After` header (seconds) AND JSON body: `{ "error": "Rate limit exceeded", "retryAfter": <seconds> }`
- **D-12:** No i18n on rate limit error — English-only machine-readable responses
- **D-13:** Include `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers on ALL responses (not just 429)

### Claude's Discretion

- Upstash Redis client initialization and connection pooling details
- Exact sliding window configuration parameters beyond the thresholds above
- Error handling when Upstash is unreachable (fail open vs fail closed)
- Test approach and mocking strategy

### Deferred Ideas (OUT OF SCOPE)

- Per-client rate limiting (different limits per subscription tier)
- Rate limit dashboard/monitoring in admin
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-04 | API routes are rate-limited via Upstash Redis sliding window | `@upstash/ratelimit` v2.0.8 + `@upstash/redis` v1.37.0 provide this directly; `Ratelimit.slidingWindow()` is the correct algorithm |
| SEC-05 | Rate-limited users receive 429 response with retry-after header | `limit()` returns `{ success, limit, remaining, reset }` — `reset` is Unix ms timestamp, convert to `Retry-After` seconds with `Math.ceil((reset - Date.now()) / 1000)` |
</phase_requirements>

---

## Summary

Phase 10 adds distributed rate limiting to all API routes except the Stripe webhook. The implementation is straightforward: install `@upstash/ratelimit` and `@upstash/redis`, create a `rateLimit()` helper in `platform/src/lib/rate-limit.ts` that wraps a lazy-singleton `Ratelimit` instance, and call it at the top of each route handler with route-specific config.

All decisions about thresholds, identifier strategy, response shape, and implementation location are pre-decided in CONTEXT.md (D-01 through D-13). The discretionary areas are: (1) whether to fail open or closed when Upstash is unreachable, (2) how to structure the helper so different routes pass different limits without creating multiple Ratelimit instances (use a single Redis singleton, create Ratelimit per call or per config), and (3) how to mock `rateLimit()` in unit tests without hitting Redis.

The `@upstash/ratelimit` sliding window algorithm uses a weighted approximation across the previous and current fixed window — accurate enough for all use cases at this scale. The library is HTTP-based (REST), which is why it works correctly across Vercel serverless instances that cannot share in-memory Maps.

**Primary recommendation:** Create a single Redis singleton with `Redis.fromEnv()`, export a `rateLimit(identifier, config)` helper that instantiates `Ratelimit` per config object (lightweight), add `X-RateLimit-*` headers on all responses, and fail **open** on Upstash timeout (return `{ success: true }` equivalent) — preventing Upstash outages from taking down the platform.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@upstash/ratelimit` | 2.0.8 | Sliding window rate limiting over Redis REST | HTTP-based, works on Vercel serverless; official Upstash library |
| `@upstash/redis` | 1.37.0 | Redis REST client (required peer) | HTTP client for Upstash Redis; no persistent TCP connection needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next` (existing) | already installed | `NextResponse` for 429 responses | Already in project |
| `@supabase/ssr` (existing) | already installed | `createServiceClient()` to read user session for identifier | Already used in API routes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@upstash/ratelimit` sliding window | Fixed window | Fixed window is cheaper on Redis commands but allows boundary bursts; sliding window prevents brute-force timing attacks — correct choice for auth routes |
| Per-call `new Ratelimit(...)` | Global singleton `Ratelimit` | Per-call allows different configs (different thresholds per route) without managing a config map; global singleton requires `prefix` differentiation — per-call is simpler given the small route count |
| Fail open on timeout | Fail closed | Fail closed stops abuse but also stops legitimate users if Upstash is down; fail open is correct for <20 concurrent users where Upstash outage risk > abuse risk |

**Installation:**

```bash
cd platform && npm install @upstash/ratelimit @upstash/redis
```

**Version verification:** Confirmed against npm registry on 2026-03-25:
- `@upstash/ratelimit@2.0.8` (published January 12, 2026)
- `@upstash/redis@1.37.0`

---

## Architecture Patterns

### Recommended Project Structure

```
platform/src/lib/
├── rate-limit.ts       # NEW — rateLimit() helper + Redis singleton
├── stripe.ts           # existing — lazy singleton reference pattern
├── supabase/
│   └── server.ts       # existing — createServiceClient() for user session

platform/src/app/api/
├── checkout/route.ts        # add rateLimit call (5/min)
├── billing-portal/route.ts  # add rateLimit call (5/min)
├── tasks/route.ts           # add rateLimit call (20/min)
├── tasks/[taskId]/route.ts  # add rateLimit call (20/min)
├── tasks/[id]/status/route.ts    # add rateLimit call (20/min)
├── tasks/[taskId]/comments/route.ts  # add rateLimit call (20/min)
└── webhooks/stripe/route.ts # NO change — exempt per D-02

platform/__tests__/
└── rate-limit.test.ts  # NEW — unit tests for helper logic

platform/.env.local.example  # add UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
```

### Pattern 1: Redis Lazy Singleton

Matches the established `getStripe()` pattern from `stripe.ts` exactly. The singleton is module-level; the function is exported for injection in tests.

```typescript
// platform/src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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
```

Note: `Redis.fromEnv()` is the shorthand for the above, but explicit env var names match the project's `.env.local.example` convention.

### Pattern 2: rateLimit() Helper Function

The helper creates a `Ratelimit` instance per call using the shared Redis singleton. This keeps each route's config co-located in the route file (D-09), avoids a global config map, and is lightweight since `Ratelimit` construction is synchronous and cheap.

```typescript
// platform/src/lib/rate-limit.ts (continued)

export interface RateLimitConfig {
  requests: number;   // e.g. 5, 20, 60
  window: string;     // e.g. "1 m", "60 s"
  prefix?: string;    // optional key namespace (default: "rl")
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;      // Unix timestamp ms — use for Retry-After
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  try {
    const rl = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      prefix: config.prefix ?? "rl",
    });
    const result = await rl.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    // Fail open: Upstash unreachable — allow request, do not block platform
    return { success: true, limit: config.requests, remaining: config.requests, reset: Date.now() + 60_000 };
  }
}
```

### Pattern 3: Route Handler Integration

Each route calls `rateLimit()` at the top before any business logic. The identifier is the user ID when a Supabase session is available, otherwise the first IP from `x-forwarded-for`.

```typescript
// Source: CONTEXT.md D-01, D-09, D-11, D-13
// platform/src/app/api/checkout/route.ts (updated)

import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/server";

const RATE_LIMIT_CONFIG = { requests: 5, window: "1 m", prefix: "rl:checkout" };

export async function POST(req: Request) {
  // --- Rate limiting (D-01, D-04, D-09) ---
  const supabase = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  const identifier =
    user?.id ??
    (req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous");

  const rl = await rateLimit(identifier, RATE_LIMIT_CONFIG);

  const rlHeaders = {
    "X-RateLimit-Limit": String(rl.limit),
    "X-RateLimit-Remaining": String(rl.remaining),
  };

  if (!rl.success) {
    const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter },
      {
        status: 429,
        headers: { ...rlHeaders, "Retry-After": String(retryAfter) },
      },
    );
  }

  // ... existing handler logic, passing rlHeaders to final response
}
```

**Important:** All `NextResponse.json()` success calls must also include the `rlHeaders` to satisfy D-13 (headers on ALL responses).

### Pattern 4: Identifier Extraction Helper

Extracting the identifier is duplicated across 6 routes. Extract to a named function in `rate-limit.ts`:

```typescript
// platform/src/lib/rate-limit.ts (continued)
export function getRateLimitIdentifier(
  req: Request,
  userId: string | undefined,
): string {
  if (userId) return userId;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0].trim();
  return ip ?? "anonymous";
}
```

### Pattern 5: Retry-After Calculation

```typescript
// reset is Unix ms timestamp from Upstash
const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
```

`Math.max(1, ...)` prevents a 0-second Retry-After when the window resets within the same millisecond.

### Anti-Patterns to Avoid

- **In-memory Map as rate limiter:** A `Map<string, { count, resetAt }>` in module scope is reset on every cold start; Vercel spins up a new instance per request. This is called out explicitly in REQUIREMENTS.md `Out of Scope` as "broken by design."
- **Rate limiting in `middleware.ts`:** The existing middleware is already doing next-intl + Supabase auth + admin role checks. Adding async Redis calls there increases middleware latency on every page load (including static pages). D-08 explicitly forbids this.
- **Multiple Redis connections:** Don't call `new Redis(...)` in each route file. The singleton in `rate-limit.ts` is shared across all routes in the same serverless instance.
- **Global `Ratelimit` singleton with a prefix map:** Tempting to do `const rateLimiters = { checkout: new Ratelimit(...), tasks: new Ratelimit(...) }` at module level — but this only exists if the module is hot. Per-call construction with the shared Redis singleton is safer and equivalent in practice.
- **Forgetting `X-RateLimit-*` headers on success responses:** D-13 requires these on ALL responses. The pattern of extracting to `rlHeaders` and spreading into the final response prevents this.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sliding window counting across instances | Custom Redis INCR + TTL script | `Ratelimit.slidingWindow()` | Requires Lua script + atomic eval; edge cases with clock drift, expiry timing |
| Distributed state across serverless functions | In-memory Map | Upstash Redis (HTTP REST) | Vercel instances don't share memory; each cold start resets any module-level Map |
| IP extraction from Vercel headers | Custom x-forwarded-for parsing | One-liner: `req.headers.get("x-forwarded-for")?.split(",")[0].trim()` | Vercel always populates this; no library needed but the split+trim is mandatory (may contain multiple IPs) |
| Retry-After seconds calculation | Custom date math | `Math.max(1, Math.ceil((reset - Date.now()) / 1000))` | Two-liner; `reset` is already returned by `ratelimit.limit()` |

**Key insight:** The only custom code needed is the thin wrapper that matches the project's singleton pattern and adds the response header logic. Everything else is `@upstash/ratelimit`.

---

## Common Pitfalls

### Pitfall 1: Identifier Collisions Across Routes

**What goes wrong:** Using prefix `"rl"` for all routes means checkout and tasks share the same counter for the same user — a user's 5 checkout requests consume their task quota too.
**Why it happens:** The `prefix` option defaults to `"@upstash/ratelimit"` globally; if you don't differentiate per route, keys collide.
**How to avoid:** Pass a route-specific `prefix` to each `Ratelimit` instance: `prefix: "rl:checkout"`, `prefix: "rl:tasks"`, etc.
**Warning signs:** In Redis, inspect keys — if all routes share the same key pattern for a user, this bug is present.

### Pitfall 2: x-forwarded-for Contains Multiple IPs

**What goes wrong:** Vercel (and proxies in general) append IPs: `"1.2.3.4, 10.0.0.1"`. Using the full string as an identifier means each comma-variant is a different key.
**Why it happens:** RFC 7239 — each proxy appends the connecting IP. Vercel prepends the real client IP first.
**How to avoid:** Always `.split(",")[0].trim()` — take only the first value.
**Warning signs:** Rate limit doesn't trigger because every request has a slightly different identifier string.

### Pitfall 3: Supabase `createServiceClient()` in API Routes Uses Service Role

**What goes wrong:** `createServiceClient()` bypasses RLS. Getting `user` from it returns `null` because the service role key doesn't carry a user session.
**Why it happens:** Confusing `createServiceClient` (server admin, service role) with `createServerClient` (user session from cookies).
**How to avoid:** For the identifier, use `createServerClient` (from `@supabase/ssr`) with the request cookies to get the actual session user — OR read the `Authorization` header directly. In practice, these API routes (checkout, billing-portal) receive the user's JWT in the session cookie; use `createServerClient` configured with the request's cookies. The existing `checkout/route.ts` uses `createServiceClient` for DB writes, which is fine — but you need `createServerClient` to identify the requesting user.
**Warning signs:** `user` is always `null` so every request falls back to IP-based limiting, defeating the purpose of user-ID limiting.

**Research note (MEDIUM confidence):** The existing `checkout/route.ts` uses `createServiceClient()` for Supabase operations. Whether it also has access to the user session via that client needs verification at implementation time. If `createServiceClient()` doesn't return a user, the route will need a separate `createServerClient()` call with the request cookies for the identifier lookup.

### Pitfall 4: Forgetting to Await `pending` in Serverless

**What goes wrong:** `ratelimit.limit()` returns `{ success, pending }` where `pending` is a Promise for analytics/background writes. If not awaited, Vercel terminates the function before the analytics write completes.
**Why it happens:** Serverless functions exit as soon as the response is sent; fire-and-forget Promises are abandoned.
**How to avoid:** Either `await result.pending` before returning, or use `waitUntil` (Next.js Edge Runtime). In practice at this scale, losing analytics data is acceptable — but the `pending` field must not be ignored if `analytics: true` is set in the `Ratelimit` constructor. Simplest fix: don't set `analytics: true` (omit it) unless you need the Upstash dashboard metrics.
**Warning signs:** Upstash analytics dashboard shows no data despite requests being rate limited.

### Pitfall 5: Upstash Free Tier Limits

**What goes wrong:** Upstash free tier is 10,000 commands/day. Each `ratelimit.limit()` call costs ~2 Redis commands (sliding window uses two GET+INCR operations). With 6 protected routes at normal usage, this is ~12 commands per full request cycle. At <20 concurrent users this is fine, but a burst test or bot scan could exhaust the daily quota.
**Why it happens:** Sliding window algorithm requires two Redis operations per check.
**How to avoid:** The `ephemeralCache` option caches blocked identifiers in-memory so repeated requests from a blocked IP skip the Redis call. Enable it: `ephemeralCache: new Map()` in the `Ratelimit` constructor. This is particularly important for bot traffic.
**Warning signs:** Upstash console shows daily command count approaching 10k; rate limit checks start returning errors.

### Pitfall 6: `reset` Timestamp Unit

**What goes wrong:** `result.reset` is a Unix timestamp in **milliseconds**. Dividing by 1000 without `Math.ceil()` gives a fractional seconds value that some HTTP clients don't accept for `Retry-After`.
**Why it happens:** JavaScript `Date.now()` is ms; the `reset` field matches this.
**How to avoid:** Always `Math.ceil((result.reset - Date.now()) / 1000)`.
**Warning signs:** `Retry-After: 59.7` in response headers instead of `Retry-After: 60`.

---

## Code Examples

Verified patterns from official sources and project conventions:

### Complete rate-limit.ts Helper

```typescript
// Source: @upstash/ratelimit v2.0.8 docs + project stripe.ts singleton pattern
// platform/src/lib/rate-limit.ts

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// --- Lazy singleton (same pattern as getStripe()) ---
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

// --- Public types ---
export interface RateLimitConfig {
  requests: number;  // max requests in window
  window: string;    // e.g. "1 m", "60 s"
  prefix: string;    // route-specific key namespace (required, no default)
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;  // Unix ms timestamp
}

// --- Identifier extraction helper ---
export function getRateLimitIdentifier(
  req: Request,
  userId: string | undefined,
): string {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0].trim();
  return ip ? `ip:${ip}` : "ip:anonymous";
}

// --- Core rate limit function ---
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  try {
    const rl = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      prefix: config.prefix,
      ephemeralCache: new Map(),  // avoid re-hitting Redis for already-blocked IDs
    });
    const result = await rl.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    // Fail open: Redis unreachable — allow request rather than taking down platform
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      reset: Date.now() + 60_000,
    };
  }
}

// --- 429 response helper ---
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

// --- Headers for success responses (D-13) ---
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
  };
}
```

### Route Handler Integration (checkout example)

```typescript
// Source: CONTEXT.md D-04, D-09; Upstash docs pattern
// platform/src/app/api/checkout/route.ts

import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getRateLimitIdentifier, rateLimitResponse, rateLimitHeaders } from "@/lib/rate-limit";

const RL_CONFIG = { requests: 5, window: "1 m", prefix: "rl:checkout" };

export async function POST(req: Request) {
  // Rate limit (D-04): 5/min for Stripe checkout — before any Stripe calls
  const supabase = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  const identifier = getRateLimitIdentifier(req, user?.id);

  const rl = await rateLimit(identifier, RL_CONFIG);
  if (!rl.success) {
    return rateLimitResponse(rl);
  }

  // --- existing handler logic ---
  try {
    const { clientId, priceId, successUrl, cancelUrl } = await req.json();
    // ... existing code ...
    return NextResponse.json(
      { url: session.url },
      { headers: rateLimitHeaders(rl) },  // D-13: headers on success too
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
```

### Unit Test Pattern (vi.mock)

```typescript
// Source: project convention from __tests__/notifications.test.ts
// platform/__tests__/rate-limit.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Upstash modules — never hit real Redis in unit tests
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: {
    slidingWindow: vi.fn(),
  },
}));
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(),
}));

// After mocking modules, import the module under test
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { Ratelimit } from "@upstash/ratelimit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required env vars
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  });

  it("returns success: true when under limit", async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60_000,
    });
    vi.mocked(Ratelimit).mockImplementation(() => ({ limit: mockLimit }) as any);

    const result = await rateLimit("user:123", { requests: 5, window: "1 m", prefix: "rl:test" });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("returns success: false when over limit", async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 45_000,
    });
    vi.mocked(Ratelimit).mockImplementation(() => ({ limit: mockLimit }) as any);

    const result = await rateLimit("user:123", { requests: 5, window: "1 m", prefix: "rl:test" });
    expect(result.success).toBe(false);
  });

  it("fails open when Redis throws", async () => {
    vi.mocked(Ratelimit).mockImplementation(() => ({
      limit: vi.fn().mockRejectedValue(new Error("Redis connection refused")),
    }) as any);

    const result = await rateLimit("user:123", { requests: 5, window: "1 m", prefix: "rl:test" });
    expect(result.success).toBe(true);  // fail open
  });
});

describe("getRateLimitIdentifier", () => {
  it("prefers userId over IP", () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    expect(getRateLimitIdentifier(req, "user-abc")).toBe("user:user-abc");
  });

  it("falls back to first IP from x-forwarded-for", () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" },
    });
    expect(getRateLimitIdentifier(req, undefined)).toBe("ip:1.2.3.4");
  });

  it("returns anonymous when no IP available", () => {
    const req = new Request("http://localhost/api/test");
    expect(getRateLimitIdentifier(req, undefined)).toBe("ip:anonymous");
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| In-memory Map rate limiter | Redis-backed distributed rate limiter | Vercel serverless adoption (2020+) | In-memory is per-instance, breaks on serverless; Redis required |
| Middleware-level rate limiting | Per-route rate limiting | Best practice evolved ~2023 | Middleware-level has higher cold-start cost; per-route is more granular and explicit |
| `@upstash/ratelimit` v1.x (single method signature) | v2.x (cleaner API, dynamic limits added) | January 2026 | v2.0.8 is current; v1 still works but v2 has better TypeScript types |

**Deprecated/outdated:**
- `rate-limiter-flexible` with Redis adapter: works but requires `ioredis` which is a TCP connection — incompatible with Vercel Edge/serverless at scale.
- `express-rate-limit`: Express middleware, not compatible with Next.js App Router.

---

## Open Questions

1. **`createServiceClient()` vs `createServerClient()` for user identity**
   - What we know: `createServiceClient()` uses the service role key (admin access). It can `.auth.getUser()` if a JWT is present in the request, but in App Router API routes the user session is in cookies, not auto-injected.
   - What's unclear: Whether `createServiceClient()` as used in existing routes (checkout, billing-portal) can return the requesting user's session, or if it always returns `null` for `user`.
   - Recommendation: At implementation time, verify with a `console.log(user)` in the checkout handler. If `null`, use `createServerClient` configured with `req` cookies for identifier lookup only (keep `createServiceClient` for DB writes). This is a 5-minute implementation decision, not a blocker.

2. **`ephemeralCache` lifetime in per-call `new Ratelimit()`**
   - What we know: `ephemeralCache` is a `Map` passed to the `Ratelimit` constructor. If a new `Ratelimit` is instantiated per call, the Map is fresh each time and provides no caching benefit.
   - What's unclear: Whether to hoist the `new Map()` to module scope (so it persists across calls within a serverless instance lifetime) or accept per-call construction with no cache benefit.
   - Recommendation: Hoist a module-level `const rateLimitCache = new Map()` and pass it to each `new Ratelimit(...)` call. This gives caching within a warm instance without a global Ratelimit singleton.

---

## Validation Architecture

> `nyquist_validation: true` in `.planning/config.json` — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (globals: true, jsdom environment) |
| Config file | `platform/vitest.config.mts` |
| Quick run command | `cd platform && npm run test:run -- __tests__/rate-limit.test.ts` |
| Full suite command | `cd platform && npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-04 | `rateLimit()` calls Redis sliding window with correct config | unit | `npm run test:run -- __tests__/rate-limit.test.ts` | ❌ Wave 0 |
| SEC-04 | Identifier uses userId when session available, IP as fallback | unit | `npm run test:run -- __tests__/rate-limit.test.ts` | ❌ Wave 0 |
| SEC-04 | Webhook route has no rate limit check | manual / code review | inspect `webhooks/stripe/route.ts` | N/A |
| SEC-05 | `rateLimit()` result `success: false` → caller returns HTTP 429 | unit | `npm run test:run -- __tests__/rate-limit.test.ts` | ❌ Wave 0 |
| SEC-05 | 429 response has `Retry-After` header with positive integer seconds | unit | `npm run test:run -- __tests__/rate-limit.test.ts` | ❌ Wave 0 |
| SEC-05 | Success responses include `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers | unit | `npm run test:run -- __tests__/rate-limit.test.ts` | ❌ Wave 0 |
| SEC-04 | Fail-open: Redis error → `success: true` returned | unit | `npm run test:run -- __tests__/rate-limit.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd platform && npm run test:run -- __tests__/rate-limit.test.ts`
- **Per wave merge:** `cd platform && npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `platform/__tests__/rate-limit.test.ts` — covers all SEC-04 and SEC-05 test cases above (vi.mock pattern for `@upstash/ratelimit` and `@upstash/redis`)
- [ ] No framework gaps — Vitest already installed and configured

---

## Sources

### Primary (HIGH confidence)

- `@upstash/ratelimit` GitHub README (github.com/upstash/ratelimit-js) — version 2.0.8, `Ratelimit.slidingWindow()` API, `limit()` return shape, ephemeralCache, timeout/fail-open
- Upstash official docs (upstash.com/docs/redis/sdks/ratelimit-ts) — sliding window algorithm explanation, features reference, constructor options
- npm registry: `npm view @upstash/ratelimit version` → `2.0.8`; `npm view @upstash/redis version` → `1.37.0` (verified 2026-03-25)

### Secondary (MEDIUM confidence)

- Upstash blog: "Rate Limiting Next.js API Routes using Upstash Redis" — Next.js App Router integration pattern, IP extraction, X-RateLimit headers
- Project `platform/src/lib/stripe.ts` — lazy singleton pattern confirmed in codebase
- Project `platform/__tests__/notifications.test.ts` — `vi.mock()` pattern confirmed in codebase

### Tertiary (LOW confidence)

- WebSearch results on `x-forwarded-for` multi-IP splitting — widely corroborated but not from Vercel official docs. Recommend verifying the specific header name in Vercel deployment (Vercel prepends, not appends, the client IP in `x-forwarded-for`).

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against npm registry on 2026-03-25
- Architecture: HIGH — patterns derived from official Upstash docs + project existing conventions
- Pitfalls: HIGH — identifier collision and x-forwarded-for splitting verified from multiple sources; `createServiceClient` user identity issue is MEDIUM (needs runtime verification)
- Test patterns: HIGH — vi.mock approach matches established project patterns in `__tests__/notifications.test.ts`

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable library, 30-day shelf life)
