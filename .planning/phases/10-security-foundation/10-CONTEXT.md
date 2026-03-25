# Phase 10: Rate Limiting - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

All API routes protected against brute-force and abuse via Upstash Redis sliding-window rate limiting. Rate-limited users receive HTTP 429 with Retry-After header. Different thresholds per route type. Must work across concurrent Vercel serverless instances.

</domain>

<decisions>
## Implementation Decisions

### Identifier Strategy
- **D-01:** Use authenticated user ID (from Supabase session) as rate limit key when available; fall back to IP address (`x-forwarded-for` or `request.ip`) for anonymous/unauthenticated requests
- **D-02:** Stripe webhook route (`/api/webhooks/stripe`) is exempt from rate limiting — Stripe controls call frequency, and we already validate signatures
- **D-03:** Single identifier check per request (not dual IP+user), keeping it simple

### Rate Limit Thresholds
- **D-04:** Auth-adjacent routes (checkout, billing-portal): **5 requests per minute** — expensive Stripe operations, brute-force target
- **D-05:** Task mutation routes (POST `/api/tasks`, PATCH status, POST comments): **20 requests per minute** — normal usage won't exceed this
- **D-06:** General fallback for any future API routes: **60 requests per minute**
- **D-07:** Stripe webhook exempt (see D-02)

### Implementation Location
- **D-08:** Shared utility at `platform/src/lib/rate-limit.ts` that exports a `rateLimit(identifier, config)` function — NOT middleware-level. Existing middleware is already complex with next-intl + auth + admin role checks; adding rate limiting there would tangle concerns
- **D-09:** Each API route handler calls `rateLimit()` at the top of its handler with its specific config. This is explicit and keeps thresholds co-located with the routes they protect
- **D-10:** Upstash Redis client instantiated as lazy singleton (same pattern as `getStripe()` in `stripe.ts`)

### 429 Response Shape
- **D-11:** Response includes both `Retry-After` header (seconds) AND JSON body: `{ "error": "Rate limit exceeded", "retryAfter": <seconds> }`
- **D-12:** No i18n on rate limit error — API consumers get English-only machine-readable responses
- **D-13:** Include `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers on ALL responses (not just 429) for client observability

### Claude's Discretion
- Upstash Redis client initialization and connection pooling details
- Exact sliding window configuration parameters beyond the thresholds above
- Error handling when Upstash is unreachable (fail open vs fail closed)
- Test approach and mocking strategy

</decisions>

<specifics>
## Specific Ideas

- Upstash free tier is 10k requests/day — thresholds should be generous enough for real usage but protective against abuse at current scale (<20 concurrent users)
- Follow existing singleton pattern from `stripe.ts` for Redis client
- Keep rate limit config as a simple object/map, not an over-engineered abstraction

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing API routes (all need rate limiting)
- `platform/src/app/api/tasks/route.ts` — Task creation endpoint
- `platform/src/app/api/tasks/[taskId]/route.ts` — Task update endpoint
- `platform/src/app/api/tasks/[id]/status/route.ts` — Task status update
- `platform/src/app/api/tasks/[taskId]/comments/route.ts` — Task comments
- `platform/src/app/api/checkout/route.ts` — Stripe checkout session creation
- `platform/src/app/api/billing-portal/route.ts` — Stripe billing portal
- `platform/src/app/api/webhooks/stripe/route.ts` — Stripe webhook (EXEMPT)

### Existing patterns to follow
- `platform/src/lib/stripe.ts` — Lazy singleton pattern for SDK clients
- `platform/src/middleware.ts` — Current middleware (do NOT add rate limiting here)
- `platform/.env.local.example` — Env var template (add UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getStripe()` singleton in `stripe.ts` — same pattern for Upstash Redis client
- Supabase `createServiceClient()` — used in API routes to get user session for identifier

### Established Patterns
- API routes return `NextResponse.json()` with status codes
- Error responses follow `{ error: string }` shape
- Fire-and-forget async ops use `.catch()` logging

### Integration Points
- Each API route handler in `platform/src/app/api/` — add `rateLimit()` call at top
- `.env.local.example` — add Upstash environment variables
- `package.json` — add `@upstash/ratelimit` and `@upstash/redis`

</code_context>

<deferred>
## Deferred Ideas

- Per-client rate limiting (different limits per subscription tier) — future if needed
- Rate limit dashboard/monitoring in admin — not in scope

</deferred>

---

*Phase: 10-security-foundation*
*Context gathered: 2026-03-25*
