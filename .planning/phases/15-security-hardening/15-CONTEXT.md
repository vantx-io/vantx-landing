# Phase 15: Security Hardening - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

The platform has defense-in-depth headers and an audit trail for admin actions. Two deliverables: (1) CSP + security headers on all platform responses, and (2) audit logging for admin user management actions. No new UI features — this is a security infrastructure pass.

</domain>

<decisions>
## Implementation Decisions

### CSP Headers (SECURE-01)
- **D-01:** Add security headers via `next.config.js` `headers()` function — static policy, not dynamic middleware. Middleware is already complex (101 lines of auth + i18n) and CSP policy doesn't vary per request
- **D-02:** CSP directives:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval'` — Next.js requires inline scripts for hydration and eval for dev mode; tighten with nonces in a future phase if needed
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — Tailwind generates inline styles; Google Fonts CSS loaded via @import in globals.css
  - `font-src 'self' https://fonts.gstatic.com` — Google Fonts served from gstatic
  - `img-src 'self' data: blob: https://*.supabase.co` — Supabase Storage for file attachments and avatars
  - `connect-src 'self' https://*.supabase.co wss://*.supabase.co` — Supabase REST + Realtime WebSocket
  - `frame-ancestors 'none'` — prevent clickjacking (replaces X-Frame-Options)
  - `form-action 'self'`
  - `base-uri 'self'`
- **D-03:** Additional security headers beyond CSP:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` (fallback for browsers that don't support frame-ancestors)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS)
- **D-04:** Headers apply to all routes via `source: '/(.*)'` matcher in next.config.js
- **D-05:** Enforce immediately — no report-only mode. The platform is pre-launch, so we can fix any breakage before real users hit it

### Audit Logging (SECURE-02)
- **D-06:** New `audit_logs` table in migration `008_audit_logs.sql` with columns: `id` (uuid, PK), `actor_id` (uuid, FK to users.id), `action` (text — e.g. 'user.invite', 'user.role_change', 'user.deactivate', 'user.reactivate'), `target_id` (uuid — the affected user's id), `metadata` (jsonb — previous/new role, email, etc.), `ip_address` (text — from request headers), `created_at` (timestamptz, default now())
- **D-07:** RLS policy: only admins can SELECT; INSERT via service role key (server-side only). No client-side access
- **D-08:** Reusable `logAuditEvent()` helper in `platform/src/lib/audit.ts` — called from each admin API route after the mutation succeeds. Parameters: `actor_id`, `action`, `target_id`, `metadata`, `ip_address`
- **D-09:** Instrument 3 existing admin endpoints: invite (`user.invite`), role change (`user.role_change`), status toggle (`user.deactivate` or `user.reactivate` based on new state)
- **D-10:** Extract IP from `request.headers.get('x-forwarded-for')` or `request.headers.get('x-real-ip')` — standard for Vercel deployments
- **D-11:** Audit log viewable on admin dashboard — add a new "Activity" or "Audit Log" section to the existing admin overview page (`admin/page.tsx`). Simple table: timestamp, actor name, action description, target name. Most recent 50 entries, no pagination in v1
- **D-12:** No separate admin audit page — embed in the existing admin overview as a section below the current stats/activity feed
- **D-13:** No retention policy or cleanup — table grows indefinitely at this scale (<20 users). Revisit if needed at v2

### Claude's Discretion
- Exact CSP nonce implementation strategy for future tightening
- Whether to index audit_logs by actor_id, target_id, or created_at (recommend: created_at DESC for the dashboard query)
- Audit log table column formatting (e.g. how to display action names in the UI)
- Error handling if audit log INSERT fails — should not block the admin action itself

</decisions>

<specifics>
## Specific Ideas

- CSP should be strict enough to pass a basic security scanner but not so strict it breaks the app — we can tighten later
- Audit log should show human-readable descriptions, not raw action codes (e.g. "Juan invited maria@example.com as client" not "user.invite")
- The admin overview already has a "Recent Activity" section — audit log can complement or replace it

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Middleware & config (CSP goes here)
- `platform/next.config.js` — Current config (no headers yet)
- `platform/src/middleware.ts` — Auth + i18n middleware (do NOT add headers here)

### Admin endpoints to instrument
- `platform/src/app/api/admin/users/invite/route.ts` — Invite endpoint (admin-only, rate limited 5/min)
- `platform/src/app/api/admin/users/[id]/role/route.ts` — Role change endpoint (admin-only, rate limited 20/min)
- `platform/src/app/api/admin/users/[id]/status/route.ts` — Status toggle endpoint (admin-only, rate limited 20/min)

### Admin dashboard (audit log display)
- `platform/src/app/[locale]/admin/page.tsx` — Admin overview with stats + recent activity feed
- `platform/src/app/[locale]/admin/layout.tsx` — Admin sidebar navigation

### Existing patterns
- `platform/src/lib/rate-limit.ts` — Rate limiting pattern (similar helper pattern for audit.ts)
- `platform/src/lib/types.ts` — Type definitions (extend with AuditLog type)
- `platform/src/lib/supabase/server.ts` — Server-side Supabase client (use for audit writes)

### External sources for CSP
- `platform/src/styles/globals.css` — Google Fonts @import (fonts.googleapis.com + fonts.gstatic.com)
- Supabase client connections (*.supabase.co for REST + WSS for Realtime)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `platform/src/lib/rate-limit.ts` — Same helper pattern for `audit.ts` (export a function, call from route handlers)
- `platform/src/lib/supabase/server.ts` — Server-side Supabase client for audit log INSERTs
- Admin overview page already has stats cards + activity feed — audit log section fits below

### Established Patterns
- Admin API routes: auth check → rate limit → business logic → response. Add audit log after business logic, before response
- Server-side Supabase: `createClient()` with service role key for privileged operations
- next.config.js: CommonJS module.exports with withNextIntl wrapper

### Integration Points
- `next.config.js` — add `headers()` function returning security headers
- 3 admin API routes — add `logAuditEvent()` call after successful mutation
- `admin/page.tsx` — add audit log section with SectionErrorBoundary wrapping
- New migration `008_audit_logs.sql` — audit_logs table + RLS
- New helper `platform/src/lib/audit.ts` — reusable logging function
- `platform/src/lib/types.ts` — AuditLog type definition

</code_context>

<deferred>
## Deferred Ideas

- CSP nonce-based script loading (tighter than 'unsafe-inline') — future security pass
- Audit log pagination and filtering — overkill for <20 users
- Audit log export (CSV/JSON) — not needed yet
- Audit logging for non-admin actions (task creation, file uploads) — scope creep
- External SIEM integration — enterprise feature, not v1.2

</deferred>

---

*Phase: 15-security-hardening*
*Context gathered: 2026-03-26*
