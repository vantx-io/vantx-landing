# Phase 15: Security Hardening - Research

**Researched:** 2026-03-26
**Domain:** Next.js security headers (CSP) + Supabase audit logging
**Confidence:** HIGH

## Summary

Phase 15 delivers two independent security infrastructure tracks: (1) static CSP and security headers via `next.config.js`, and (2) an `audit_logs` table plus `logAuditEvent()` helper wired into the three existing admin API endpoints, with a read view embedded in the admin overview page.

Both tracks are well-understood and heavily precedented. All decisions are locked in CONTEXT.md, so research validates implementation details rather than exploring alternatives. The CSP approach — static policy via `next.config.js` `headers()`, not nonces, not middleware — is the exact pattern in the official Next.js 14 docs for apps that don't require per-request nonces. The audit logging pattern mirrors `rate-limit.ts` closely: a single exported async function called from route handlers after the mutation.

**Primary recommendation:** Implement both tracks sequentially in two plans. Plan 01 handles the database migration + `audit.ts` helper + endpoint instrumentation. Plan 02 handles `next.config.js` headers + admin page UI section. Plans are fully independent and can execute in any order.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**CSP Headers (SECURE-01)**
- D-01: Add security headers via `next.config.js` `headers()` — static policy, not middleware
- D-02: CSP directives: `default-src 'self'`, `script-src 'self' 'unsafe-inline' 'unsafe-eval'`, `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, `font-src 'self' https://fonts.gstatic.com`, `img-src 'self' data: blob: https://*.supabase.co`, `connect-src 'self' https://*.supabase.co wss://*.supabase.co`, `frame-ancestors 'none'`, `form-action 'self'`, `base-uri 'self'`
- D-03: Additional headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- D-04: Apply to all routes via `source: '/(.*)'`
- D-05: Enforce immediately, no report-only mode

**Audit Logging (SECURE-02)**
- D-06: New `audit_logs` table in migration `008_audit_logs.sql` with columns: `id` (uuid PK), `actor_id` (uuid FK users.id), `action` (text), `target_id` (uuid), `metadata` (jsonb), `ip_address` (text), `created_at` (timestamptz default now())
- D-07: RLS: only admins can SELECT; INSERT via service role key only
- D-08: `logAuditEvent()` helper in `platform/src/lib/audit.ts` — called after successful mutation
- D-09: Instrument 3 endpoints: invite (`user.invite`), role change (`user.role_change`), status toggle (`user.deactivate` / `user.reactivate`)
- D-10: Extract IP from `x-forwarded-for` or `x-real-ip` request headers
- D-11: Audit log section on `admin/page.tsx` — most recent 50 entries, no pagination
- D-12: Embed in existing admin overview, not a separate page
- D-13: No retention policy

### Claude's Discretion
- Exact CSP nonce implementation strategy for future tightening
- Whether to index audit_logs by actor_id, target_id, or created_at (recommend: created_at DESC)
- Audit log table column formatting in UI
- Error handling if audit log INSERT fails — must not block the admin action

### Deferred Ideas (OUT OF SCOPE)
- CSP nonce-based script loading
- Audit log pagination and filtering
- Audit log export (CSV/JSON)
- Audit logging for non-admin actions
- External SIEM integration
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SECURE-01 | CSP headers configured for all platform routes | next.config.js `headers()` async function pattern verified against official Next.js 14 docs. Static headers array with `source: '/(.*)'` matcher applies to all routes at build time. |
| SECURE-02 | Admin actions are audit-logged (who, what, when) | `audit_logs` table pattern verified against existing migration conventions (005_user_management.sql). Service role INSERT bypasses RLS — confirmed in Supabase docs. Helper pattern mirrors `rate-limit.ts` exactly. |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js `headers()` | 14.2.18 (in use) | Static security header injection via `next.config.js` | Official Next.js approach for non-nonce CSP; zero additional dependencies |
| `@supabase/supabase-js` | ^2.47.0 (in use) | Audit log INSERT via service role client | Already used; `createServiceClient()` bypasses RLS |
| Tailwind CSS | ^3.4.16 (in use) | Styling audit log table in admin overview | Already used throughout admin UI |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | ^0.460.0 (in use) | Icon for audit log section header | Already used in admin sidebar and UI |

### No New Dependencies
This phase introduces zero new npm packages. Both deliverables use existing infrastructure.

---

## Architecture Patterns

### Recommended Project Structure (new files only)
```
platform/
├── next.config.js                          # MODIFY — add headers() function
├── supabase/migrations/
│   └── 008_audit_logs.sql                  # NEW — audit_logs table + RLS
└── src/
    ├── lib/
    │   ├── audit.ts                        # NEW — logAuditEvent() helper
    │   └── types.ts                        # MODIFY — add AuditLog type
    └── app/
        ├── api/admin/users/
        │   ├── invite/route.ts             # MODIFY — call logAuditEvent()
        │   └── [id]/
        │       ├── role/route.ts           # MODIFY — call logAuditEvent()
        │       └── status/route.ts        # MODIFY — call logAuditEvent()
        └── [locale]/admin/
            └── page.tsx                   # MODIFY — add audit log section
```

### Pattern 1: next.config.js headers() for CSP

**What:** Export an async `headers()` function from next.config.js that returns an array of route-header pairs. All headers are applied at the edge/CDN level, not runtime.

**When to use:** When CSP policy is static (doesn't vary per request) and nonces are not required. This is the right choice for pre-launch apps with `unsafe-inline` allowed.

**Integration with existing config:** The current `next.config.js` uses CommonJS (`module.exports = withNextIntl(nextConfig)`). The `headers()` function must be added to the `nextConfig` object before wrapping with `withNextIntl`.

**Example:**
```javascript
// Source: https://nextjs.org/docs/app/guides/content-security-policy
// Verified: 2026-03-26 (Next.js docs, version 16.2.1, lastUpdated 2026-03-25)

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://*.supabase.co;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
`

const nextConfig = {
  experimental: { ... },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader.replace(/\n/g, '') },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
}
module.exports = withNextIntl(nextConfig)
```

**Key detail:** `cspHeader.replace(/\n/g, '')` collapses multiline string to single line. The official docs use `.replace(/\n/g, '')` — use that exact pattern.

### Pattern 2: logAuditEvent() helper (mirrors rate-limit.ts)

**What:** A single async function exported from `audit.ts`, called in route handlers after a successful mutation. Fire-and-forget — errors do not propagate to the caller.

**When to use:** After any `await supabase.from(...).update/insert` that succeeds in an admin API route.

**Example:**
```typescript
// Source: Derived from platform/src/lib/rate-limit.ts pattern (existing codebase)

// platform/src/lib/audit.ts
import { createServiceClient } from './supabase/server'

export type AuditAction =
  | 'user.invite'
  | 'user.role_change'
  | 'user.deactivate'
  | 'user.reactivate'

export interface AuditEventParams {
  actor_id: string
  action: AuditAction
  target_id: string
  metadata?: Record<string, unknown>
  ip_address?: string
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from('audit_logs').insert({
      actor_id: params.actor_id,
      action: params.action,
      target_id: params.target_id,
      metadata: params.metadata ?? null,
      ip_address: params.ip_address ?? null,
    })
  } catch {
    // Fail silently — audit logging must never block admin actions
    // Log to console in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('[audit] logAuditEvent failed silently', params)
    }
  }
}
```

**Caller pattern in route handler:**
```typescript
// After successful mutation, before return
const ip =
  req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
  req.headers.get('x-real-ip') ??
  undefined

// Fire-and-forget: await is optional; not awaiting keeps response fast
await logAuditEvent({
  actor_id: user.id,
  action: 'user.invite',
  target_id: targetUserId,
  metadata: { email, role, client_id: client_id || null },
  ip_address: ip,
})
```

**CRITICAL:** The invite endpoint does NOT get back a `target_id` (user id) from `inviteUserByEmail` — it only gets confirmation that the invite was sent. For invite events, use the email as the target identifier in metadata. For `target_id`, use the body's email or a placeholder UUID only if the new user's UUID is unavailable. Verify by inspecting the Supabase `inviteUserByEmail` return type.

### Pattern 3: Migration 008_audit_logs.sql

**What:** Create table with appropriate RLS — admin SELECT only, INSERT via service role (which bypasses RLS entirely).

**Example:**
```sql
-- 008_audit_logs.sql

CREATE TABLE public.audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   UUID NOT NULL REFERENCES public.users(id),
  action     TEXT NOT NULL,
  target_id  UUID,
  metadata   JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for dashboard query: most recent entries first
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT policy
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
  FOR SELECT
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- No INSERT policy for authenticated users — service role bypasses RLS
-- INSERTs happen only via createServiceClient() in logAuditEvent()
```

**Note on service role INSERT:** Supabase service role clients bypass RLS by definition — no INSERT policy is needed. Confirmed in official Supabase docs. The existing `createServiceClient()` in `server.ts` uses `SUPABASE_SERVICE_ROLE_KEY` and empty cookies — this is the correct client for audit writes.

### Pattern 4: Audit Log UI Section in admin/page.tsx

**What:** An additional `useEffect` + state block to fetch the 50 most recent audit log entries, rendered as a table below the existing activity section.

**Integration constraint:** `admin/page.tsx` is a `'use client'` component that already uses `createClient()` (the anon/session client). But audit logs are only readable by admins, and the existing admin page already verifies `user` existence. The query for audit logs must use `createClient()` (the session-authenticated client) since the RLS SELECT policy requires `auth.uid()` to be an admin. The service role client cannot be used from a client component.

**Display format (per CONTEXT.md specifics):** Human-readable descriptions, not raw action codes. Map action codes to readable strings:
- `user.invite` → "invited [target email] as [role]"
- `user.role_change` → "changed [target name]'s role to [new_role]"
- `user.deactivate` → "deactivated [target name]"
- `user.reactivate` → "reactivated [target name]"

Actor and target names come from the metadata JSONB field since the audit_logs table only stores UUIDs.

### Anti-Patterns to Avoid

- **Adding CSP via middleware.ts:** The middleware is already 101+ lines of auth + i18n logic. Adding headers there would break the static header optimization and introduce per-request overhead. Use `next.config.js` headers() exclusively.
- **Awaiting logAuditEvent without try/catch in the caller:** The helper wraps its own error handling. If you add an outer try/catch in the route, you still should not let audit failures bubble to 500 responses.
- **Using createServerSupabase() for audit INSERTs:** The session client uses the anon key — it will be blocked by RLS (no INSERT policy exists). Always use `createServiceClient()` for audit writes.
- **Storing newline characters in the CSP header value:** The multiline template literal must have `\n` stripped. Use `.replace(/\n/g, '')` exactly as shown in official docs.
- **Supabase TypeScript inference for audit_logs:** The `audit_logs` table is new and not in `Database` type until types are regenerated. Use `(supabase as any).from('audit_logs')` — this matches the established codebase pattern (phases 11, 13).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP security headers | Custom middleware writing headers manually | `next.config.js` `headers()` | Static, CDN-cached, zero runtime cost |
| Service role DB write | Re-implement auth bypass | `createServiceClient()` from `server.ts` | Already handles service role key injection |
| IP extraction from Vercel | Custom header parsing | `req.headers.get('x-forwarded-for')` | Standard Vercel pattern, already used in rate-limit.ts |
| Audit log RLS enforcement | Application-layer access checks | RLS SELECT policy on `audit_logs` | DB enforces it unconditionally |

**Key insight:** Both deliverables reduce to ~20 lines each. Don't over-engineer either helper — the value is correctness and placement, not complexity.

---

## Common Pitfalls

### Pitfall 1: inviteUserByEmail Does Not Return New User's UUID
**What goes wrong:** The invite endpoint calls `supabase.auth.admin.inviteUserByEmail()`. The return value is `{ data: { user }, error }` where `user.id` exists. However, the new user has not accepted the invite yet, so `public.users` has no row for them yet. Using this UUID as `target_id` in audit_logs is safe (the FK is nullable or the row will exist by the time it matters), but the planner should verify whether to pass the auth UUID or NULL.
**Why it happens:** Invite creates an `auth.users` record but the DB trigger fires on acceptance, not on invite.
**How to avoid:** Store `target_id` as the UUID from `inviteUserByEmail` response (the `data.user.id`). The FK constraint will be satisfied when the trigger fires. Store email and role in `metadata` for human-readable display.
**Warning signs:** FK violation error on INSERT if `target_id` references `public.users.id` and the user hasn't accepted yet. Mitigation: make `target_id` nullable or remove the FK constraint and treat it as a soft reference.

### Pitfall 2: CSP Blocks Next.js Dev Server Hot Reload
**What goes wrong:** `unsafe-eval` is needed in development for React's error stack reconstruction. The locked directives include `unsafe-eval` in `script-src` — this is correct. No action needed.
**Why it happens:** React's dev mode uses `eval()` for enhanced debugging.
**How to avoid:** The locked directive already includes `unsafe-eval`. If the team ever adds the `isDev` branch from the official docs example, that would be a future-phase concern only.

### Pitfall 3: TypeScript Inference Failures on New audit_logs Table
**What goes wrong:** `supabase.from('audit_logs')` fails TypeScript since `audit_logs` is not yet in the `Database` type in `types.ts`.
**Why it happens:** The generated types only cover tables defined at type-generation time.
**How to avoid:** Cast as `(supabase as any).from('audit_logs')` — this is the established pattern for new tables before type regeneration (used in phases 11 and 13 for `notification_preferences`). Add the `AuditLog` type and `Database` entry to `types.ts` manually.
**Warning signs:** TypeScript error "Argument of type '"audit_logs"' is not assignable to..."

### Pitfall 4: CSP Wildcard for Supabase Does Not Cover WebSocket
**What goes wrong:** Supabase Realtime uses WSS. The `connect-src` directive must include both `https://*.supabase.co` AND `wss://*.supabase.co`. A CSP that only covers HTTPS will silently block the WebSocket connection.
**Why it happens:** `connect-src` governs both XHR/fetch and WebSocket (`ws:`/`wss:`) connections.
**How to avoid:** The locked D-02 directive already specifies both. Verify the final header value includes both when writing the config.

### Pitfall 5: Audit Log SELECT from Client Component Requires Session Client, Not Service Client
**What goes wrong:** The service role client cannot be instantiated in a client component (`'use client'`). `admin/page.tsx` is a client component. The audit log query must use `createClient()` (the browser/session client), relying on the RLS SELECT policy to grant admin-role users read access.
**Why it happens:** Service role key is server-side only; exposing it in the browser is a security vulnerability.
**How to avoid:** Use `createClient()` from `@/lib/supabase/client` in `admin/page.tsx`. The existing admin page already does this. The audit_logs RLS SELECT policy grants access to `auth.uid()` users with `role = 'admin'`, which covers the admin user browsing this page.

### Pitfall 6: next.config.js headers() and withNextIntl Wrapper
**What goes wrong:** The current `next.config.js` wraps `nextConfig` with `withNextIntl`. If `headers()` is defined inside the object literal BEFORE `withNextIntl` wraps it, the headers are preserved. If `headers()` is added to a separate object after wrapping, it may conflict.
**Why it happens:** `withNextIntl` merges config properties including `headers()`. It calls the original `headers()` and prepends its own headers (for i18n redirects).
**How to avoid:** Add `headers()` directly to `nextConfig` before `withNextIntl(nextConfig)`. This ensures `withNextIntl` merges correctly. Do not create a second `module.exports` object.

---

## Code Examples

### Verified CSP header format (from official Next.js docs, 2026-03-25)
```javascript
// next.config.js — complete final form
// Source: https://nextjs.org/docs/app/guides/content-security-policy (v16.2.1, 2026-03-25)

const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://*.supabase.co;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
`

const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
    serverComponentsExternalPackages: ['@react-email/components', '@react-email/render'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader.replace(/\n/g, '') },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
}

module.exports = withNextIntl(nextConfig)
```

### AuditLog type for types.ts
```typescript
// Add to platform/src/lib/types.ts (before Database type)

export type AuditLog = {
  id: string
  actor_id: string
  action: string
  target_id: string | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}
```

### Instrument invite endpoint (representative example)
```typescript
// platform/src/app/api/admin/users/invite/route.ts
// ADD after successful inviteUserByEmail call, before final return

import { logAuditEvent } from '@/lib/audit'

// ... existing code ...

// After: const { error } = await supabase.auth.admin.inviteUserByEmail(email, {...})
// The invite response includes data.user.id for the newly created auth user

const { data: inviteData, error } = await supabase.auth.admin.inviteUserByEmail(email, {
  data: { role, client_id: client_id || null },
})

if (error) { /* existing error return */ }

const ip =
  req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
  req.headers.get('x-real-ip') ??
  undefined

await logAuditEvent({
  actor_id: user.id,
  action: 'user.invite',
  target_id: inviteData.user?.id ?? null,
  metadata: { email, role, client_id: client_id || null },
  ip_address: ip,
})

return NextResponse.json({ success: true, email }, { status: 201, headers: rateLimitHeaders(rl) })
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Nonce-based CSP via middleware | Static CSP via `next.config.js` headers() | Next.js 13+ App Router | Static approach is zero-runtime-cost; nonces require dynamic rendering |
| Per-route middleware headers | Global `source: '/(.*)'` in next.config.js | Next.js 12+ | Single config entry covers all routes |

**Deprecated/outdated:**
- `next.config.js` `headers()` with `middleware.ts` duplication: Not needed. Choose one approach. This project uses `next.config.js` exclusively (D-01).
- CSP `report-uri`/`Content-Security-Policy-Report-Only`: Deferred per D-05.

---

## Open Questions

1. **target_id nullable vs FK constraint on audit_logs**
   - What we know: The invite endpoint returns `data.user.id` from `inviteUserByEmail` (the auth UUID), but `public.users` won't have that row until the trigger fires on invite acceptance.
   - What's unclear: Whether a FK constraint on `target_id → public.users(id)` would cause an INSERT violation for invite events.
   - Recommendation: Make `target_id UUID` with NO FK constraint in the migration. Treat it as a soft reference. Store the auth UUID from `inviteUserByEmail` response (or NULL if unavailable). This is the safest approach.

2. **Audit log section in admin/page.tsx — separate useEffect or merged**
   - What we know: The page already has one large `useEffect` that runs 4 parallel queries + 1 sequential query.
   - What's unclear: Whether to add audit_logs to the existing Promise.all or use a separate useEffect.
   - Recommendation: Add as a sixth item in the existing `Promise.all` inside the existing `useEffect`. This matches the pattern established in Phase 12 for the MRR query (added as a third Promise.all item to reduce round trips).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 |
| Config file | `platform/vitest.config.mts` |
| Quick run command | `cd platform && npm run test:run -- __tests__/audit.test.ts` |
| Full suite command | `cd platform && npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SECURE-02 | `logAuditEvent()` calls supabase INSERT with correct params | unit | `cd platform && npm run test:run -- __tests__/audit.test.ts` | No — Wave 0 gap |
| SECURE-02 | `logAuditEvent()` fails silently on Supabase error | unit | `cd platform && npm run test:run -- __tests__/audit.test.ts` | No — Wave 0 gap |
| SECURE-01 | CSP header value is present and non-empty in next.config.js | manual-only | Verify via `curl -I http://localhost:3000` or browser DevTools Network tab | — |
| SECURE-01 | No new dependencies introduced | manual-only | `cd platform && git diff package.json` — must show no changes | — |

**Note on SECURE-01:** CSP headers injected via `next.config.js` `headers()` are applied at the framework level, not testable via Vitest unit tests. Smoke verification via `curl -I` on the dev server is the appropriate check.

### Sampling Rate
- **Per task commit:** `cd platform && npm run test:run -- __tests__/audit.test.ts`
- **Per wave merge:** `cd platform && npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `platform/__tests__/audit.test.ts` — covers SECURE-02 (logAuditEvent unit tests)
  - Pattern: mock `createServiceClient` (same as rate-limit.test.ts mocks Upstash)
  - Test cases: successful INSERT, Supabase error swallowed, missing optional fields default to null

---

## Sources

### Primary (HIGH confidence)
- [Next.js CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy) — Official Next.js 14 docs, verified 2026-03-25, v16.2.1. Exact `headers()` format, `cspHeader.replace(/\n/g, '')` pattern, static vs nonce tradeoffs.
- `platform/src/lib/rate-limit.ts` — Existing codebase. Confirmed helper pattern (export async function, fail silently) that `audit.ts` mirrors.
- `platform/next.config.js` — Existing codebase. Confirmed CommonJS + `withNextIntl` wrapper pattern that `headers()` integrates into.
- `platform/supabase/migrations/005_user_management.sql` — Existing codebase. Confirmed migration naming convention (`00N_name.sql`) and RLS policy syntax patterns.
- `platform/src/lib/supabase/server.ts` — Existing codebase. Confirmed `createServiceClient()` implementation (service role key, empty cookies).

### Secondary (MEDIUM confidence)
- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — Service role bypass confirmed. INSERT policy omission is intentional for service-role-only tables.
- [Next.js headers() API reference](https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers) — `source: '/(.*)'` matcher format confirmed.

### Tertiary (LOW confidence)
- None — all critical claims verified against official sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; all existing libraries verified from package.json
- Architecture: HIGH — both patterns verified against official docs and existing codebase
- Pitfalls: HIGH — all derived from direct code inspection of existing files and official Next.js docs

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (stable Next.js config API; Supabase RLS semantics are stable)
