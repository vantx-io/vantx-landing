# Phase 5: Foundation - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

DB migrations (notifications table + task-attachments storage bucket with RLS) and test infrastructure (Vitest with Supabase mocks, Playwright with auth helpers, i18n key-parity CI check, unit tests for stripe.ts/slack.ts/onboard.ts). No feature code — only schema and test harness.

</domain>

<decisions>
## Implementation Decisions

### File Upload Storage
- **D-01:** Max file size: 50 MB per file — allows HAR files, performance reports, and short video reproductions
- **D-02:** Allowed types: everything except executables (.exe, .sh, .bat, .cmd, .ps1, .msi, .dll, .so)
- **D-03:** No limit on number of files per comment — trust total size constraint
- **D-04:** Bucket must be private; only signed URLs with expiry for downloads (decided in research)
- **D-05:** Canonical path structure: `task-attachments/{client_id}/{task_id}/{filename}` — RLS scoped to client_id

### Notification Schema
- **D-06:** Notification types: `payment_success`, `payment_failed`, `task_updated`, `task_created`
- **D-07:** Each notification stores: user_id, type, title, body, read (boolean), action_link (nullable), created_at
- **D-08:** Retention: 90 days — implement cleanup via scheduled SQL or Supabase cron
- **D-09:** RLS: users see only their own notifications; admins see all

### Testing Framework
- **D-10:** Vitest for unit/component tests — ESM-native, no transform config (decided in research)
- **D-11:** Playwright for e2e — required for async RSC pages (decided in research)
- **D-12:** Supabase client mocked via `vi.mock('@/lib/supabase/client')` manual mocks — no live DB in unit tests

### CI Pipeline
- **D-13:** GitHub Actions as CI platform — repo already on GitHub
- **D-14:** Tests gate PR merges — run on every PR, block merge on failure
- **D-15:** Full pipeline: lint + type-check + Vitest unit tests + Playwright e2e + i18n key parity check
- **D-16:** Playwright runs in CI too (not just local) — headless Chromium in GitHub Actions

### Claude's Discretion
- Action links on notifications — Claude decides per notification type whether to include a link to the relevant resource (billing page, task page, etc.)
- Test file organization — co-located vs top-level `__tests__/` directory
- Vitest configuration details (coverage thresholds, reporters)
- Playwright auth helper implementation (fixture vs setup project)
- GitHub Actions workflow file structure (single vs multiple jobs)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema
- `platform/supabase/migrations/001_schema.sql` — Existing 13-table schema with RLS policies; new migrations must follow same patterns (CREATE TABLE, ALTER TABLE ENABLE RLS, CREATE POLICY)
- `platform/src/lib/types.ts` — TypeScript type definitions matching DB schema; must be updated with new Notification type

### Existing Code Patterns
- `platform/src/lib/supabase/client.ts` — Browser client factory (`createClient()`) — mocking target for Vitest
- `platform/src/lib/supabase/server.ts` — Server client factories (`createServerSupabase()`, `createServiceClient()`) — service client for cross-user writes
- `platform/src/lib/stripe.ts` — Unit test target (getPriceId, formatCurrency)
- `platform/src/lib/slack.ts` — Unit test target (channel creation, message posting)
- `platform/src/lib/onboard.ts` — Unit test target (orchestration flow)

### Codebase Analysis
- `.planning/codebase/TESTING.md` — Current test landscape (none), k6 patterns, seed data approach
- `.planning/codebase/CONVENTIONS.md` — Naming patterns, import order, module design, error handling
- `.planning/research/SUMMARY.md` — Stack decisions, pitfalls, architecture for v1.1

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/seed-demo.js`: Existing seed script pattern — test fixtures can follow same approach
- `platform/src/lib/supabase/client.ts`: `createClient()` factory — mock target for all unit tests
- `platform/src/lib/supabase/server.ts`: `createServiceClient()` — for notification inserts across users
- `platform/src/middleware.ts`: Auth routing — Playwright needs to work with this flow

### Established Patterns
- **Supabase client pattern**: Browser client via `createBrowserClient`, server via `createServerClient` — mocks must match these interfaces
- **API route pattern**: `export async function POST(req: Request)` with try/catch + `NextResponse.json()`
- **Type definitions**: All in `src/lib/types.ts` — new `Notification` type goes here
- **Migration naming**: `001_schema.sql` — new migrations continue as `002_notifications.sql`, `003_storage.sql`
- **i18n files**: `platform/src/messages/en.json` and `es.json` — 199 keys each, flat JSON structure

### Integration Points
- `supabase/migrations/` — new migration files
- `src/lib/types.ts` — new Notification type + Storage path types
- `package.json` — new dev dependencies (vitest, playwright, testing-library)
- `.github/workflows/` — new CI workflow file
- `src/messages/*.json` — i18n parity check targets

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude's discretion on infrastructure decisions within the captured constraints.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-foundation*
*Context gathered: 2026-03-24*
