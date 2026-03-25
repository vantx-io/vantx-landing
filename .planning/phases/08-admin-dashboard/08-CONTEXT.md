# Phase 8: Admin Dashboard - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Internal admin dashboard for Vantx team (admin, engineer, seller roles). Middleware role guard on /admin routes, dedicated admin layout with sidebar, four operational pages (overview, clients, tasks, billing), and NotificationBell mount. Client-role users are blocked at middleware — never see admin routes.

</domain>

<decisions>
## Implementation Decisions

### Middleware & Role Guard
- **D-01:** Extend existing middleware.ts to check `/admin` routes — query `users.role` from Supabase, redirect client-role to `/{locale}/portal`. Admin, engineer, and seller roles pass through.
- **D-02:** Middleware uses the same `createServerClient` pattern already in place for portal auth. No new auth library.
- **D-03:** Fallback: if user has no profile row or role is null, redirect to portal (deny by default)

### Admin Layout & Sidebar
- **D-04:** Same dark sidebar aesthetic as portal layout (bg-brand-sidebar, text-[#A3A39B], border-white/10) — visual consistency, no new design system
- **D-05:** Sidebar header: Vantx logo + "ADMIN" badge (bg-brand-accent/20 text-brand-accent, same style as portal plan badges) + user's role badge (admin/engineer/seller)
- **D-06:** Nav items: Overview, Clients, Tasks, Billing — maps 1:1 to ADMIN-03/04/05/06
- **D-07:** NotificationBell mounted in sidebar header (completes NOTIF-09 — component already exists, self-manages auth)
- **D-08:** Sidebar footer: user name, logout button, and "Back to Portal" link for users who have both portal and admin access
- **D-09:** Keep i18n infrastructure (useTranslations) for consistency, but admin i18n namespace is English-only content (internal tool, no ES translation needed in v1)

### Overview Page (ADMIN-03)
- **D-10:** 4 stat cards across the top: Active Clients (count of clients with status=active), Current MRR (sum of price_monthly from active subscriptions), Open Tasks (count of tasks not completed/cancelled), Pending Payments (count of payments with status=pending or failed)
- **D-11:** Activity feed below stat cards: last 20 mixed events queried from recent records — new clients (created_at), payments (created_at), task status changes (updated_at). Each item: type icon + description text + relative timestamp
- **D-12:** No charts — ADMIN-08 (MRR trend with Recharts) is deferred to v2
- **D-13:** Stat cards use white background (bg-white rounded-xl border border-gray-100) matching existing portal dashboard MetricCard pattern
- **D-14:** Activity feed: single column list, each row is a clickable item that could link to the relevant admin page section

### Client List Page (ADMIN-04)
- **D-15:** Table layout with columns: Name, Status (color badge), Plan, Monthly Price, Active Tasks (count). Table, not cards — admin needs data density
- **D-16:** Search input at top filters by client name (client-side filter, <50 clients)
- **D-17:** Click client row — no separate detail page in v1. Could expand inline or simply highlight. Keep it minimal: view-only list with search

### Cross-Client Task View (ADMIN-05)
- **D-18:** Table with columns: Title, Client Name, Priority (badge), Status (badge), Assigned To, Created date
- **D-19:** Three filter dropdowns above table: Client (all + each client name), Priority (all/critical/high/medium/low), Status (all/open/in_progress/waiting_client/completed/cancelled)
- **D-20:** All filters are client-side (dataset is small: <50 clients, likely <500 tasks). No server-side pagination needed in v1
- **D-21:** Table sorted by created_at descending by default

### Billing Overview (ADMIN-06)
- **D-22:** 4 stat cards: Total MRR, Active Subscriptions (count), Pending Payments (count), Failed Payments (count)
- **D-23:** Recent payments table: Client Name, Amount, Currency, Status (badge), Date. Last 50 payments, ordered by created_at descending
- **D-24:** Active subscriptions table: Client Name, Plan, Status (badge), Monthly Price, Period End date
- **D-25:** No MRR trend chart (ADMIN-08, v2)

### E2E Test (TEST-08)
- **D-26:** Playwright test: login as client-role user, navigate to /admin, assert redirect to /portal. Proves middleware enforcement at E2E level.
- **D-27:** Uses existing Playwright auth setup pattern (storageState). May need a third test user with admin role, or reuse existing E2E user if their role is admin.

### Claude's Discretion
- Exact stat card layout (grid columns, spacing)
- Activity feed query strategy (single query vs multiple merged)
- Table styling details (hover states, row padding)
- Whether to use a shared admin table component or inline per page
- Admin i18n key structure within the "admin" namespace
- Filter dropdown component implementation (native select vs custom)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Middleware & Auth
- `platform/src/middleware.ts` — Current middleware to extend; shows locale extraction, route matching, Supabase server client, portal auth guard pattern
- `platform/src/lib/supabase/server.ts` — Server-side Supabase client factory

### Layout & UI Patterns
- `platform/src/app/[locale]/portal/layout.tsx` — Portal sidebar layout to mirror for admin; shows sidebar structure, nav pattern, client data loading, NotificationBell mount
- `platform/src/app/[locale]/portal/page.tsx` — Dashboard with MetricCard pattern, Recharts, Badge component, data loading via useEffect
- `platform/src/app/[locale]/portal/billing/page.tsx` — Billing page patterns: subscription display, payment table, Badge component, status colors
- `platform/src/app/[locale]/portal/tasks/page.tsx` — Task list with filters, comment expansion, Badge, priority/status color maps

### Data Model
- `platform/src/lib/types.ts` — Client, User (role field), Subscription, Payment, Task types — all needed for admin pages
- `platform/supabase/migrations/001_schema.sql` — Core schema, RLS policies (admin must bypass client-scoped RLS for cross-client views)

### Notification Bell
- `platform/src/components/NotificationBell.tsx` — Self-managing component, no props needed. Mount in admin layout to complete NOTIF-09

### Testing
- `platform/e2e/auth.setup.ts` — Existing Playwright auth setup pattern
- `platform/playwright.config.ts` — Test project configuration (add admin redirect test project)

### Prior Phase Context
- `.planning/phases/07-notification-ui/07-CONTEXT.md` — NotificationBell decisions, cross-tenant isolation approach
- `.planning/phases/06-server-side-integration/06-CONTEXT.md` — API route patterns, notification orchestrator

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NotificationBell` component: Self-managing, mount directly in admin layout (NOTIF-09)
- `Badge` component pattern: Repeated in portal/dashboard, billing, tasks — extract or copy for admin pages
- `MetricCard` component in portal/page.tsx: Stat card with delta comparison — admin overview can adapt this
- Priority/status color maps: `pColors`, `sColors` in tasks and billing pages — reuse in admin task/billing views
- `createClient()` from `@/lib/supabase/client`: Same browser client for admin pages

### Established Patterns
- **Page structure**: `"use client"` + useState + useEffect load + createClient() at component scope
- **Data loading**: `supabase.auth.getUser()` → profile lookup → scoped queries. Admin pages skip client_id scoping (cross-client access)
- **Styling**: White cards (bg-white rounded-xl border border-gray-100) on light main area, dark sidebar
- **i18n**: `useTranslations("namespace")` per page, keys in en.json/es.json
- **Middleware**: Locale-aware routing with `next-intl`, auth check via `createServerClient`

### Integration Points
- `platform/src/middleware.ts` — Add `/admin` route check with role validation
- `platform/src/app/[locale]/admin/layout.tsx` — New admin layout (mirrors portal layout structure)
- `platform/src/app/[locale]/admin/page.tsx` — Overview page (ADMIN-03)
- `platform/src/app/[locale]/admin/clients/page.tsx` — Client list (ADMIN-04)
- `platform/src/app/[locale]/admin/tasks/page.tsx` — Cross-client task view (ADMIN-05)
- `platform/src/app/[locale]/admin/billing/page.tsx` — Billing overview (ADMIN-06)
- `platform/src/messages/en.json` — New "admin" i18n namespace
- `platform/e2e/` — Admin redirect E2E test (TEST-08)

### Key Consideration
- Admin pages query across ALL clients (no client_id filter). RLS policies may need a check: ensure admin/engineer/seller roles can SELECT across all rows. If current RLS is client-scoped only, admin pages may need to use service role client or add role-based RLS policies.

</code_context>

<specifics>
## Specific Ideas

- Mirror portal dark sidebar exactly — admin is internal but same brand experience
- Admin is English-only internal tool but keep i18n wiring for technical consistency
- Data volume is small (<50 clients) — client-side filtering is fine, no need for server pagination
- Badge component and color maps already exist in multiple portal pages — reuse pattern directly
- "Back to Portal" link in admin sidebar for team members who also act as client contacts

</specifics>

<deferred>
## Deferred Ideas

- Admin user management UI — invite, role change, deactivate (ADMIN-07, v2)
- MRR trend chart with Recharts (ADMIN-08, v2)
- Client detail page with full history
- Admin settings page
- Audit log of admin actions
- Export functionality (CSV/PDF) for client list, payments

</deferred>

---

*Phase: 08-admin-dashboard*
*Context gathered: 2026-03-25*
