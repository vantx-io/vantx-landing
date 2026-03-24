# Project Research Summary

**Project:** Vantix Platform v1.1 — Platform Hardening & Admin
**Domain:** B2B SRE/performance client portal — testing, admin dashboard, notifications, file uploads
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

Vantix v1.1 is a hardening milestone layered on a fully-shipped v1.0 platform. The foundation is Next.js 14.2.18 + Supabase + Stripe, with auth, RLS, billing webhooks, Slack, Grafana, and a bilingual UI already in production. The four additions — testing infrastructure, an admin dashboard, in-app/email notifications, and task file attachments — are narrowly scoped integrations that must slot into the existing architecture without introducing new service layers. Research confirms that every required capability is already present in the stack (Supabase Storage, Supabase Realtime, existing role types, existing webhook handler, existing `attachments TEXT[]` column) and only needs wiring, UI, and a test harness to complete.

The recommended approach is to build in strict dependency order: database migrations and test infrastructure first, then server-side API routes, then shared UI components, then the admin dashboard, then file upload. This order is driven by hard architectural dependencies — nothing in the notification system works before the `notifications` table exists; no admin page is safe before middleware protection is in place; no upload UI is useful before the storage bucket and RLS policies exist. Each phase delivers a testable, demoable increment and does not require rework in subsequent phases.

The dominant risks are security and data isolation, not technical complexity. Admin route protection must use middleware (not client-side `useEffect`), Supabase Realtime subscriptions must include `user_id` filters to prevent cross-tenant data leakage, and the storage bucket must be private with signed URLs from day one. Cutting corners on any of these in the name of speed creates P0 incidents in a platform that handles confidential SRE data for paying clients at $5,995/month.

---

## Key Findings

### Recommended Stack

The stack requires minimal additions. All infrastructure for notifications, file uploads, and admin already exists in Supabase — no new services, no new WebSocket providers, no new storage vendors. The only net-new dependency is Resend + React Email for transactional email. For testing, Vitest replaces Jest (Next.js official recommendation; fewer transform dependencies) and Playwright handles E2E for async Server Components that Vitest cannot render.

**Core technologies:**
- `vitest` + `@testing-library/react`: unit and component tests — Next.js-official, ESM-native, zero transform config; replaces Jest cleanly on a codebase with no existing tests
- `@playwright/test`: E2E tests for auth flows, task creation, admin routes — Next.js-maintained `with-playwright` example; required for async RSC which Vitest cannot render
- `resend` + `@react-email/components`: transactional email — purpose-built for Next.js/App Router, React JSX templates, dead-simple API, free tier covers Vantix's scale
- `react-dropzone`: file upload UI — headless, 7KB, `useDropzone` hook fits existing Tailwind component style
- `@radix-ui/react-dialog` + `@radix-ui/react-dropdown-menu` + `@radix-ui/react-select`: admin UI primitives — headless, WCAG-compliant, avoids shadcn migration complexity on an already-styled codebase
- Supabase Storage (built-in): task attachment storage — same JWT auth as DB, same `createClient()`, no new credentials
- Supabase Realtime (built-in): live notification push — already in `@supabase/supabase-js` ^2.47, `supabase.channel()` API stable since v2.0

### Expected Features

**Must have (table stakes) — v1.1:**
- Admin dashboard: client list, subscription status, cross-client task view — team cannot operate without this visibility
- Admin route protection (`/admin` rejects non-admin/engineer roles) — security prerequisite before any admin page exists
- In-app notification bell + `notifications` table with unread count and mark-as-read — core portal UX; absence is conspicuous
- Email on payment success/failure — clients expect receipts; Stripe webhook handler already exists, just needs email trigger wired in
- Email on task status change — closes the async communication loop for clients who don't log in daily
- Slack message on new task created by client — highest-value notification for the Vantix team; lowest implementation cost (extends existing `slack.ts`)
- Vitest setup + unit tests for `stripe.ts` and `slack.ts` — protects the money path and communication path from regressions
- Playwright E2E: login + task creation — regression safety for the two most-used portal flows
- Supabase Storage bucket `task-attachments` + RLS policies — prerequisite for upload UI
- File upload UI in task comment form + attachment display — closes the visible schema gap (`attachments TEXT[]` exists but has no UI)

**Should have (competitive advantage) — v1.x after validation:**
- Admin MRR trend chart (Recharts already in deps) — operational visibility once admin baseline ships
- Image preview for attachments — low effort, once upload ships and usage confirms it matters
- Integration tests for API routes (`checkout`, `billing-portal`, `webhook`) — add incrementally after unit test foundation is stable
- Drag-and-drop file upload — once basic upload is in production and friction is confirmed

**Defer (v2+):**
- Weekly email digest to clients — requires cron job; meaningful only after notification system is proven
- Notification preferences per user — over-engineering at current team size
- Admin user management (invite/role change) — defer until Supabase dashboard management becomes painful
- Playwright visual regression tests — high maintenance burden, low immediate value
- Two-factor authentication — dedicated security hardening phase

### Architecture Approach

The v1.1 architecture is additive, not restructuring. The platform is all-client-component pages with `useEffect` Supabase calls and no global state. New features follow this same pattern. The three meaningful structural additions are: (1) a new `/admin` route group with its own layout and role guard; (2) a single `NotificationBell` shared component mounted in both portal and admin layouts, holding the only Supabase Realtime subscription in the platform; and (3) two new Supabase migrations (`notifications` table, storage bucket policy). Cross-user notification inserts (admin action notifying a client user) must route through a server API route using `createServiceClient()` because the browser client respects RLS and cannot write rows owned by a different `user_id`.

**Major components:**
1. `/admin` route group + layout — role-gated (admin/engineer/seller), separate from `/portal`, queries existing tables without `client_id` filter leveraging existing admin RLS policies
2. `NotificationBell.tsx` — shared component, Realtime subscription filtered to `user_id=eq.{userId}`, mounted in both layouts, persists across page navigation
3. `src/lib/email.ts` — Resend transactional email helper, called fire-and-forget from Stripe webhook and admin task/report routes
4. `supabase/migrations/002_notifications.sql` + `003_storage.sql` — unblock all notification and upload work
5. `__tests__/` + `playwright/` directories — Vitest unit/integration tests and Playwright E2E specs

### Critical Pitfalls

1. **Supabase mock missing in tests** — without `vi.mock('@/lib/supabase/client')` manual mocks, every test couples to a live DB; tests pass locally and fail in CI with `ECONNREFUSED`; establish mock infrastructure before writing any test

2. **Admin route protected only by `useEffect` client-side check** — clients briefly see admin UI before the check resolves and can navigate directly to `/admin` URLs; middleware must check session existence, admin `layout.tsx` must check role, neither alone is sufficient

3. **Realtime cross-tenant notification leak** — `postgres_changes` subscriptions without a `filter: 'user_id=eq.${userId}'` clause broadcast all table events to all subscribers; RLS controls SELECT but not Realtime broadcast; must enable `REPLICA IDENTITY FULL` and verify with a cross-tenant isolation test before shipping

4. **Storage bucket set to public or path/RLS mismatch** — define canonical path structure (`task-attachments/{client_id}/{task_id}/{filename}`) before writing any upload code, keep bucket private, generate signed URLs at display time; a public bucket on a confidential SRE platform is a P0 incident

5. **Webhook test with re-serialized body** — `stripe.webhooks.constructEvent` requires exact raw bytes; `JSON.stringify(JSON.parse(rawBody))` invalidates the HMAC signature; use `stripe.webhooks.generateTestHeaderString` with a pre-serialized raw fixture file

---

## Implications for Roadmap

The architecture research explicitly defines a dependency-driven build order. Phases map directly to that structure.

### Phase 1: Foundation — Database Migrations, Types, and Testing Infrastructure
**Rationale:** Everything downstream depends on this phase. The `notifications` table unblocks all notification work. The storage bucket migration unblocks all upload work. Vitest + mock infrastructure must exist before new code is written or tests become an afterthought. The i18n key-parity CI check must be in place from the start so every subsequent phase is automatically enforced.
**Delivers:** `002_notifications.sql` + `003_storage.sql` migrations applied; `Notification` type added to `types.ts`; Vitest configured with Supabase manual mocks; unit tests for `stripe.ts` and `slack.ts` passing; Playwright configured against local dev server; i18n key-parity CI check passing.
**Addresses:** Testing (all table-stakes), i18n gap prevention from day one.
**Avoids:** Pitfall 1 (mock infrastructure), Pitfall 2 (webhook test body), Pitfall 6 (translation key parity).

### Phase 2: Server-Side Integration — Email Helper and Notification API Routes
**Rationale:** `src/lib/email.ts` and the notifications API routes have no UI dependencies and can be built, unit-tested, and merged before any component needs them. The Stripe webhook extension (adding notification inserts + email sends) belongs here because it modifies existing server-side code and needs integration tests before UI is built on top.
**Delivers:** `src/lib/email.ts` with `sendTransactionalEmail()`; `POST /api/notifications` route; `POST /api/notifications/[id]/read` route; Stripe webhook updated to insert notifications and send payment emails (fire-and-forget); webhook integration tests passing with raw fixture files.
**Uses:** `resend` + `@react-email/components`, `createServiceClient()` pattern.
**Avoids:** Pitfall 2 (webhook body), Pitfall 3 (email sent synchronously blocking webhook response), email recipient derived from session not request body.

### Phase 3: Shared UI — NotificationBell Component
**Rationale:** `NotificationBell` is a dependency of both the portal layout and the admin layout. Build it as a standalone, testable component before either layout is modified. It holds the platform's only Realtime subscription, so the cross-tenant isolation test must pass before it is mounted in any layout.
**Delivers:** `NotificationBell.tsx` with Realtime subscription (filtered to `user_id`), unread badge, dropdown list, mark-as-read via API; Playwright `notifications.spec.ts` with cross-tenant isolation assertion; portal `layout.tsx` updated to include bell.
**Uses:** Supabase Realtime, `REPLICA IDENTITY FULL` on notifications table.
**Avoids:** Pitfall 4 (cross-tenant Realtime leak).

### Phase 4: Admin Dashboard
**Rationale:** Admin dashboard depends on the notifications infrastructure (Phase 3) to mount the bell. It also requires middleware protection be designed correctly before any admin page code is written. Admin task creation routes must call `POST /api/notifications` (Phase 2) to notify clients. Building this after Phases 1-3 means all dependencies are resolved.
**Delivers:** `/admin/layout.tsx` with role guard (admin/engineer/seller), middleware extended for `/admin` path auth; `/admin/page.tsx` overview; `/admin/clients/page.tsx`; `/admin/tasks/page.tsx` with notification dispatch; `/admin/billing/page.tsx`; Playwright `admin-clients.spec.ts` verifying redirect for client-role user navigating to `/admin`.
**Uses:** Radix UI primitives (dialog, dropdown, select), existing Recharts for MRR chart.
**Avoids:** Pitfall 3 (client-side-only admin route protection); service role misuse in admin API routes.

### Phase 5: File Uploads
**Rationale:** File upload UI modifies the existing `tasks/page.tsx`. All storage infrastructure (migration in Phase 1) and type definitions are already in place. Building last ensures changes to an existing production page are isolated after all other features are stable and tested.
**Delivers:** File upload UI in task comment form using `react-dropzone`; direct Supabase Storage upload with client-side size/type validation; attachment display in comment thread (image preview + download links); signed URL generation at display time; Playwright `portal-tasks.spec.ts` covering upload flow and cross-tenant access test returning 403.
**Uses:** `react-dropzone`, `supabase.storage.from('task-attachments')`.
**Avoids:** Pitfall 5 (public bucket, path/RLS mismatch, permanent public URLs stored in DB).

### Phase Ordering Rationale

- **Migrations first:** `notifications` table and storage bucket are hard prerequisites; nothing works without them; putting them in Phase 1 eliminates blocked waiting in every subsequent phase
- **Server before client:** email helper and notification API routes have no UI dependencies and can be independently tested; building them before any component reduces integration risk
- **Shared component before consumers:** `NotificationBell` is mounted in two layouts; building it in isolation with a cross-tenant test before either layout is modified is cleaner than building it inline with admin or portal layout work
- **Admin before file uploads:** admin dashboard has more security surface (role gating, cross-user writes) and higher business priority; file uploads touch one existing page and can ship last without blocking the team
- **Pitfall-driven ordering:** Pitfalls 1 and 6 (test mocks, i18n parity) are placed in Phase 1 precisely so they enforce discipline on every subsequent phase automatically

### Research Flags

All five phases follow well-documented patterns. No phase requires `/gsd:research-phase` before planning.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Vitest, Playwright, Supabase migration — official docs, no ambiguity
- **Phase 2:** Resend SDK, Supabase service client, Stripe test helpers — well-documented
- **Phase 3:** Supabase Realtime channel API — stable, well-documented v2 pattern
- **Phase 4:** Next.js App Router route groups, role-based layouts — established pattern
- **Phase 5:** Supabase Storage JS client, react-dropzone — stable, low-churn libraries

Implementation-time verification is needed only for Resend free tier limits and exact `react-dropzone` version at install time (see Gaps below).

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Vitest and Playwright from Next.js official docs; Supabase Storage and Realtime from direct codebase analysis; Resend is MEDIUM (training data only, no live docs fetch available during research) |
| Features | HIGH | Derived from direct codebase analysis of 13 DB tables, 4 role types, and existing code patterns; not from market inference |
| Architecture | HIGH | Based on direct codebase analysis; integration points verified against existing middleware, layout, and API route code |
| Pitfalls | HIGH | Testing/Supabase/Stripe patterns are well-documented; Realtime cross-tenant behavior and Storage RLS path matching are MEDIUM (verified in training data but benefit from live doc check at implementation) |

**Overall confidence:** HIGH

### Gaps to Address

- **Resend pricing and API surface:** WebFetch was blocked during research; verify free tier limits (currently understood as 3,000 emails/month) and exact SDK version at implementation time before committing to the provider
- **react-dropzone version:** Stable library but confirm exact npm version resolves to `^14.x` at install time; no hard incompatibilities expected with React 18.3
- **Supabase Realtime `REPLICA IDENTITY FULL`:** Must be enabled per table in the Supabase Dashboard for row-level filter matching to work in `postgres_changes` subscriptions; confirm in the project settings at the start of Phase 3
- **Supabase Storage RLS `storage.foldername` path syntax:** Verify array indexing syntax against current Supabase Storage docs at migration time (Phase 1); canonical path structure must be locked before any upload code is written
- **Email i18n for LATAM clients:** Research flags that `client.market` should determine email template locale; verify the `market` field exists on the `clients` table before Phase 2 email templates are authored — if absent, an alternative locale signal must be identified

---

## Sources

### Primary (HIGH confidence)
- `platform/package.json` — confirmed existing stack (Next.js 14.2.18, Supabase JS ^2.47, Stripe v17.4, next-intl 4.8, Recharts, Lucide)
- `platform/supabase/migrations/001_schema.sql` — 13 tables, RLS policies, `attachments TEXT[]` column confirmed
- `platform/src/lib/types.ts` — `TaskComment.attachments: string[] | null` confirmed
- `platform/src/middleware.ts` — existing auth guard scope confirmed (portal + login only)
- `platform/src/app/[locale]/portal/layout.tsx` — client-side role pattern confirmed
- `platform/src/app/api/webhooks/stripe/route.ts` — synchronous handler structure confirmed
- `platform/src/lib/supabase/client.ts` — `createBrowserClient` shared by storage + realtime
- [Next.js Vitest Testing Guide](https://nextjs.org/docs/app/guides/testing/vitest) — official, verified 2026-03-20
- [Next.js Playwright Testing Guide](https://nextjs.org/docs/app/guides/testing/playwright) — official, verified 2026-03-20

### Secondary (MEDIUM confidence)
- Resend + React Email ecosystem — training data through August 2025; designed for Next.js/App Router; verify free tier and SDK version at implementation
- Supabase Realtime `postgres_changes` filter syntax — training data; `REPLICA IDENTITY FULL` requirement confirmed in training data; verify in live docs
- Supabase Storage RLS `storage.foldername` path matching — training data; verify syntax in current Supabase Storage docs
- react-dropzone `^14.x` — training data; stable library; verify current npm version at install

### Tertiary (LOW confidence)
- Competitor feature analysis (Linear, Basecamp portals) — training data inference; used only for table-stakes validation, not for technical decisions

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
