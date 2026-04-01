# Phase 8: Admin Dashboard - Research

**Researched:** 2026-03-25
**Domain:** Next.js App Router admin routing, Supabase RLS cross-client access, role-based middleware
**Confidence:** HIGH

## Summary

Phase 8 builds an internal admin dashboard for Vantx team members (roles: admin, engineer, seller). All source code was read directly, making most findings HIGH confidence. The primary technical complexity is threefold: extending the existing middleware to do a DB role lookup without breaking performance, fixing a known RLS gap where `seller` role and most tables have no admin bypass policies, and mirroring the portal layout pattern with minimal deviation.

The current middleware only calls `supabase.auth.getUser()` — it does not query the `users` table for role. Adding a DB lookup in middleware is technically possible but carries a performance cost on every request to every route. The correct pattern for this project (given existing code) is: DB query in middleware is acceptable because (a) routes are protected by cookie session before the role query fires, (b) the query is a single-row point lookup by primary key (`eq("id", user.id)`), and (c) the alternative — JWT custom claims — requires an Auth Hook and a dashboard configuration step that is out of scope per the locked decisions. D-01 and D-02 explicitly require extending middleware.ts with `createServerClient`.

**Primary recommendation:** Add a one-row `users` table query in middleware for `/admin` routes. Fix RLS with a new migration that adds bypass policies for all three internal roles. Use `createClient()` (anon key) in admin pages — do NOT use `createServiceClient()` in page components, which would expose service role key behavior on the client side.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Extend existing middleware.ts to check `/admin` routes — query `users.role` from Supabase, redirect client-role to `/{locale}/portal`. Admin, engineer, and seller roles pass through.
- **D-02:** Middleware uses the same `createServerClient` pattern already in place for portal auth. No new auth library.
- **D-03:** Fallback: if user has no profile row or role is null, redirect to portal (deny by default)
- **D-04:** Same dark sidebar aesthetic as portal layout (bg-brand-sidebar, text-[#A3A39B], border-white/10) — visual consistency, no new design system
- **D-05:** Sidebar header: Vantx logo + "ADMIN" badge (bg-brand-accent/20 text-brand-accent) + user's role badge
- **D-06:** Nav items: Overview, Clients, Tasks, Billing — maps 1:1 to ADMIN-03/04/05/06
- **D-07:** NotificationBell mounted in sidebar header (completes NOTIF-09)
- **D-08:** Sidebar footer: user name, logout button, and "Back to Portal" link
- **D-09:** Keep i18n infrastructure (useTranslations) for consistency, but admin i18n namespace is English-only content
- **D-10:** 4 stat cards: Active Clients, Current MRR, Open Tasks, Pending Payments
- **D-11:** Activity feed: last 20 mixed events from recent records (new clients, payments, task status changes)
- **D-12:** No charts on overview (ADMIN-08 deferred to v2)
- **D-13:** Stat cards use white background (bg-white rounded-xl border border-gray-100) matching portal MetricCard pattern
- **D-14:** Activity feed: single column list, each row links to relevant admin page
- **D-15:** Client list table columns: Name, Status (badge), Plan, Monthly Price, Active Tasks (count)
- **D-16:** Search input at top filters by client name (client-side)
- **D-17:** Click client row — no separate detail page in v1
- **D-18:** Cross-client task table columns: Title, Client Name, Priority (badge), Status (badge), Assigned To, Created date
- **D-19:** Three filter dropdowns: Client, Priority, Status
- **D-20:** All filters client-side
- **D-21:** Default sort: created_at descending
- **D-22:** Billing stat cards: Total MRR, Active Subscriptions, Pending Payments, Failed Payments
- **D-23:** Recent payments table: Client Name, Amount, Currency, Status, Date. Last 50 ordered by created_at DESC
- **D-24:** Active subscriptions table: Client Name, Plan, Status, Monthly Price, Period End
- **D-25:** No MRR trend chart (v2)
- **D-26:** Playwright test: login as client-role user, navigate to /admin, assert redirect to /portal
- **D-27:** Uses existing Playwright auth setup pattern (storageState)

### Claude's Discretion
- Exact stat card layout (grid columns, spacing)
- Activity feed query strategy (single query vs multiple merged)
- Table styling details (hover states, row padding)
- Whether to use a shared admin table component or inline per page
- Admin i18n key structure within the "admin" namespace
- Filter dropdown component implementation (native select vs custom)

### Deferred Ideas (OUT OF SCOPE)
- Admin user management UI (ADMIN-07, v2)
- MRR trend chart (ADMIN-08, v2)
- Client detail page
- Admin settings page
- Audit log of admin actions
- Export functionality (CSV/PDF)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADMIN-01 | Middleware extended to protect /admin routes (admin/engineer/seller only) | Middleware pattern documented; DB query approach verified |
| ADMIN-02 | Admin layout with role-gated sidebar navigation | Portal layout code read; mirror pattern documented |
| ADMIN-03 | Admin overview page with active clients count, MRR, recent activity | Cross-client query needs RLS migration; stat card pattern from portal |
| ADMIN-04 | Client list page with search, subscription status, plan details | Cross-client clients+subscriptions query; RLS migration required |
| ADMIN-05 | Cross-client task view with filtering by client, priority, status | Cross-client tasks query; RLS migration required; filter pattern from portal tasks page |
| ADMIN-06 | Billing overview with MRR trend, recent payments, subscription statuses | Cross-client payments+subscriptions query; RLS migration required |
| TEST-08 | E2E test: admin route redirects client-role users to portal | auth.setup.ts + playwright.config.ts patterns read; new admin-redirect project needed |
| NOTIF-09 | NotificationBell mounted in both portal and admin layouts | Component already exists; mount in admin layout |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/ssr | ^0.5.x (installed) | Server-side Supabase client for middleware and SSR | Already in use; `createServerClient` is the correct pattern for Next.js middleware |
| next-intl | ^3.x (installed) | i18n routing and translations | Already in use; admin namespace added to en.json |
| Tailwind CSS | ^3.x (installed) | Styling | Already in use throughout portal |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @playwright/test | (installed) | E2E test for admin redirect | TEST-08 requirement |
| Recharts | (installed) | Charts (deferred) | Not used in Phase 8 per D-12 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DB role query in middleware | JWT custom claims | Claims don't need a DB hit, but require an Auth Hook + dashboard setup — out of scope per D-02 |
| anon key in admin pages | service role key in page components | Service role bypasses RLS from browser — never do this; use anon key + correct RLS policies |

**No new packages to install.** All dependencies are already present.

---

## Architecture Patterns

### Recommended Project Structure
```
platform/src/app/[locale]/admin/
├── layout.tsx          # Admin layout (mirrors portal layout; "use client")
├── page.tsx            # Overview — ADMIN-03
├── clients/
│   └── page.tsx        # Client list — ADMIN-04
├── tasks/
│   └── page.tsx        # Cross-client tasks — ADMIN-05
└── billing/
    └── page.tsx        # Billing overview — ADMIN-06

platform/supabase/migrations/
└── 002_admin_rls.sql   # New RLS policies for admin cross-client access

platform/src/messages/
└── en.json             # Add "admin" namespace
└── es.json             # Add "admin" namespace (English content, keys required for parity)

platform/e2e/
└── admin-redirect.spec.ts  # TEST-08 Playwright test
```

### Pattern 1: Middleware Role Guard

The current middleware in `platform/src/middleware.ts` only checks if a user is authenticated (line 52: `supabase.auth.getUser()`). It does NOT check the user's role from the `users` table.

For `/admin` routes, extend the existing auth block to also query `users.role`:

```typescript
// After supabase.auth.getUser() confirms a user exists...

// Protect /admin routes — require admin/engineer/seller role
if (pathWithoutLocale.startsWith('/admin')) {
  if (!user) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
  // Query role from users table (single-row point lookup by PK)
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const adminRoles = ['admin', 'engineer', 'seller'];
  if (!profile || !adminRoles.includes(profile.role)) {
    return NextResponse.redirect(new URL(`/${locale}/portal`, request.url));
  }
}
```

**Critical detail:** The route guard condition in the current middleware only runs auth checks when `pathWithoutLocale.startsWith('/portal') || pathWithoutLocale === '/login'` (lines 24-29). The `/admin` route check must be added to this condition — otherwise middleware returns early and never checks auth for admin routes at all.

Updated condition:
```typescript
if (
  !pathWithoutLocale.startsWith('/portal') &&
  !pathWithoutLocale.startsWith('/admin') &&  // ADD THIS
  pathWithoutLocale !== '/login'
) {
  return response;
}
```

### Pattern 2: Admin Layout (mirrors portal layout)

The portal layout (`platform/src/app/[locale]/portal/layout.tsx`) is a `"use client"` component that loads user/client/subscription data in a `useEffect`. The admin layout follows the same pattern but loads user data only (no client_id needed — admins are not scoped to one client).

```typescript
"use client";
// Same imports as portal layout
// useEffect: getUser() -> profile lookup -> setUser(profile)
// handleLogout: same pattern
// Sidebar: same bg-brand-sidebar, text-[#A3A39B], border-white/10
// Nav items: Overview /admin, Clients /admin/clients, Tasks /admin/tasks, Billing /admin/billing
// Header: Vantx logo + "ADMIN" badge + role badge + NotificationBell
// Footer: user.full_name + logout + "Back to Portal" link to /{locale}/portal
```

**NotificationBell** (`platform/src/components/NotificationBell.tsx`) is a self-managing component — no props needed. Mount it exactly as in portal layout (line 121 of portal/layout.tsx): `<NotificationBell />`.

### Pattern 3: Cross-Client Data Queries in Page Components

Admin pages use `createClient()` (the browser anon key client) — same as portal pages. The difference is they omit the `.eq("client_id", ...)` filter. This works only when RLS policies allow it (see RLS Migration below).

```typescript
// Portal pattern (client-scoped):
const { data } = await supabase.from('tasks').select('*').eq('client_id', cid)

// Admin pattern (cross-client, no filter):
const { data } = await supabase.from('tasks').select('*, clients(name)').order('created_at', { ascending: false })
```

Use Supabase foreign key joins (`.select('*, clients(name)')`) to fetch client names alongside tasks and payments without a second query.

### Pattern 4: Activity Feed Query Strategy

The activity feed (D-11) requires "last 20 mixed events" from clients, payments, and tasks. Three separate queries merged client-side is the correct approach for this data volume:

```typescript
const [clients, payments, tasks] = await Promise.all([
  supabase.from('clients').select('id, name, created_at').order('created_at', { ascending: false }).limit(20),
  supabase.from('payments').select('id, amount, status, created_at, clients(name)').order('created_at', { ascending: false }).limit(20),
  supabase.from('tasks').select('id, title, status, updated_at, clients(name)').order('updated_at', { ascending: false }).limit(20),
])

// Merge into unified event list, sort by timestamp, take first 20
const events = [
  ...(clients.data || []).map(c => ({ type: 'client', ts: c.created_at, ...c })),
  ...(payments.data || []).map(p => ({ type: 'payment', ts: p.created_at, ...p })),
  ...(tasks.data || []).map(t => ({ type: 'task', ts: t.updated_at, ...t })),
].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 20)
```

### Pattern 5: Client-Side Filtering (tasks and clients pages)

The portal tasks page uses a simple `filter === "all" ? tasks : tasks.filter(tk => tk.status === filter)` pattern. The admin tasks page extends this to three dimensions (client, priority, status) using the same approach. Load all records once in `useEffect`, filter in component body:

```typescript
const filtered = tasks
  .filter(t => clientFilter === 'all' || t.client_id === clientFilter)
  .filter(t => priorityFilter === 'all' || t.priority === priorityFilter)
  .filter(t => statusFilter === 'all' || t.status === statusFilter)
```

### Pattern 6: Playwright Admin Redirect Test

Following the existing `auth.setup.ts` and `portal.spec.ts` patterns, the admin redirect test needs a client-role user's storageState. The existing `user.json` storageState (from `auth.setup.ts`) authenticates as `juan@novapay.com` — this user needs to have `role = 'client'` in the `users` table for the test to be meaningful.

```typescript
// e2e/admin-redirect.spec.ts
import { test, expect } from '@playwright/test'

test('client-role user is redirected from /admin to /portal', async ({ page }) => {
  // page uses storageState from setup project (client-role user)
  await page.goto('/en/admin')
  await expect(page).toHaveURL(/.*portal.*/)
})
```

This test uses the existing `chromium` project (which depends on `setup` and uses `playwright/.auth/user.json`). No new setup project is required IF the existing E2E user has `role = 'client'`.

### Anti-Patterns to Avoid

- **DB query in middleware without route guard:** If the route check condition isn't updated to include `/admin`, the middleware returns `response` before ever reaching the role check — the guard silently does nothing.
- **`createServiceClient()` in browser/page components:** `createServiceClient()` uses the service role key. Using it in `"use client"` components exposes it to the browser bundle. Only use it in server-side API routes or server actions.
- **Filtering client-side without loading all data first:** Admin pages load ALL rows (no `.eq("client_id", ...)`) — confirm RLS migration has been applied before testing, otherwise queries return empty arrays silently.
- **Missing RLS policies for seller role:** Current policies only grant admin/engineer. Seller role gets empty results for all cross-client queries without a migration.
- **Using `getSession()` instead of `getUser()` in middleware:** The project already uses `getUser()` correctly. Keep this — `getUser()` validates the token server-side; `getSession()` reads from cookie and can be stale.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-client joins | Manual multi-query merge for client names | Supabase `.select('*, clients(name)')` FK join | Single query, no N+1 |
| Role check in every page | Repeat auth check in each admin page component | Middleware guard (D-01) + layout auth check | DRY; middleware is the enforcement layer |
| Badge component | New badge component per admin page | Copy the `Badge` function from portal pages (pColors, sColors already defined) | Portal already has the exact pattern; no extraction needed |
| Custom filter UI | Third-party filter component | Native `<select>` (existing pattern from tasks/page.tsx lines 167-195) | Already established; consistent with portal |
| Activity feed timestamp formatting | Custom date library | `new Date(ts).toLocaleString('en-US')` | Already used in task_comments; no date library in stack |

**Key insight:** Every UI primitive needed for admin pages already exists in the portal — Badge, MetricCard, color maps (pColors, sColors), filter selects, table rows. Copy the pattern, don't extract into shared components in this phase.

---

## RLS Gap Analysis (CRITICAL)

This is the most important finding in this research. Admin pages query across all clients, but the current RLS schema (`platform/supabase/migrations/001_schema.sql`) has two categories of gaps:

### Gap 1: Seller Role Not Covered

Lines 284-288 of the migration:
```sql
CREATE POLICY "Admins see all clients" ON clients FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer'));

CREATE POLICY "Admins see all tasks" ON tasks FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer'));
```

The `seller` role is excluded. Per D-01, seller role must pass through admin routes. Seller users will get empty results on clients and tasks queries.

### Gap 2: No Admin Bypass on Payments, Subscriptions, and Metrics Tables

The following tables only have client-scoped policies; there are NO admin bypass policies at all:
- `subscriptions` — "Users see own subscriptions" scoped by `client_id`
- `payments` — "Users see own payments" scoped by `client_id`
- `test_results`, `monthly_metrics`, `weekly_metrics`, `reports`, `incidents` — same pattern

An admin/engineer/seller user querying these tables gets an EMPTY result set because their `users.client_id` is `NULL` (internal team members have no client_id).

### Required Migration

A new migration file `platform/supabase/migrations/002_admin_rls.sql` must be created as part of this phase:

```sql
-- Add seller to existing admin policies
DROP POLICY "Admins see all clients" ON clients;
CREATE POLICY "Admin roles see all clients" ON clients FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));

DROP POLICY "Admins see all tasks" ON tasks FOR ALL;
CREATE POLICY "Admin roles see all tasks" ON tasks FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));

-- Add admin bypass for subscriptions
CREATE POLICY "Admin roles see all subscriptions" ON subscriptions FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));

-- Add admin bypass for payments
CREATE POLICY "Admin roles see all payments" ON payments FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));

-- Add admin bypass for test_results (needed for future admin views)
CREATE POLICY "Admin roles see all test results" ON test_results FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));

-- Add admin bypass for monthly/weekly metrics
CREATE POLICY "Admin roles see all monthly metrics" ON monthly_metrics FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));

CREATE POLICY "Admin roles see all weekly metrics" ON weekly_metrics FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));

-- Add admin bypass for reports
CREATE POLICY "Admin roles see all reports" ON reports FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));
```

**Confidence:** HIGH — verified against actual migration file lines 261-288 and types.ts lines 165-173 showing `client_id: string | null` on User.

---

## Common Pitfalls

### Pitfall 1: Middleware Route Condition Not Updated

**What goes wrong:** The middleware exits early (line 25-30 in current code) if the path is not `/portal` or `/login`. Adding a role check for `/admin` after line 55 does nothing because the function has already returned `response` at line 29.

**Why it happens:** Developer adds the role check logic but forgets to update the early-exit condition at the top of the function.

**How to avoid:** Update the early-exit condition to include `/admin`:
```typescript
if (
  !pathWithoutLocale.startsWith('/portal') &&
  !pathWithoutLocale.startsWith('/admin') &&
  pathWithoutLocale !== '/login'
) {
  return response;
}
```
**Warning signs:** Admin pages load without redirecting anyone. The E2E test (TEST-08) fails immediately.

### Pitfall 2: Empty Query Results Without RLS Error

**What goes wrong:** Admin pages show "0 clients", "0 tasks", "0 payments" — no error thrown, just empty arrays. Supabase RLS silently filters rows the current user can't see.

**Why it happens:** Internal team users have `client_id = NULL`. The existing policies use `client_id = (SELECT client_id FROM users WHERE id = auth.uid())` — with NULL client_id, this matches zero rows.

**How to avoid:** Run the 002_admin_rls.sql migration BEFORE testing admin pages. Verify with: `supabase db push` or execute via Supabase dashboard SQL editor.

**Warning signs:** Page renders without error but stat cards show 0 and tables are empty.

### Pitfall 3: Locale Prefix on Redirect Target

**What goes wrong:** Middleware redirects to `/admin` instead of `/{locale}/admin`, or to `/portal` instead of `/{locale}/portal`, causing next-intl to do a second redirect.

**Why it happens:** Hardcoding the path without locale prefix.

**How to avoid:** Always use `/${locale}/portal` for the redirect URL (same pattern as existing line 62 in middleware.ts: `new URL(\`/${locale}/portal\`, request.url)`).

### Pitfall 4: NotificationBell NOTIF-09 Already Done Elsewhere

**What goes wrong:** Developer sees NOTIF-09 in REQUIREMENTS.md as "Pending" and tries to implement something new.

**Why it happens:** NOTIF-09 says "NotificationBell mounted in both portal and admin layouts" — the portal side was already done in Phase 7. Phase 8 only mounts it in the admin layout.

**How to avoid:** Mount `<NotificationBell />` in admin layout.tsx exactly as in portal/layout.tsx line 121. No implementation needed — the component already exists.

### Pitfall 5: Playwright Test User Role Mismatch

**What goes wrong:** TEST-08 passes trivially because the E2E user (`juan@novapay.com`) actually has `role = 'admin'` in the database, so they're NOT redirected.

**Why it happens:** Seed user may have been created with admin role for earlier testing.

**How to avoid:** Before writing TEST-08, verify `juan@novapay.com` has `role = 'client'` in the local dev database. If not, either update their role for testing or create an explicit client-role test user. Add the role verification as a setup note in the plan.

### Pitfall 6: MRR Calculation on NULL price_monthly

**What goes wrong:** `SUM(price_monthly)` query returns null or throws TypeScript error when some subscriptions have `price_monthly = NULL` (the column is `NUMERIC(10,2)` nullable per migration line 48 and types.ts line 181).

**Why it happens:** PostgreSQL `SUM()` ignores NULLs but returns NULL for all-NULL input; JavaScript receives `null` from the Supabase response.

**How to avoid:** Use `COALESCE(SUM(price_monthly), 0)` in a DB function, OR handle null client-side:
```typescript
const mrr = subs.reduce((acc, s) => acc + (s.price_monthly || 0), 0)
```

---

## Code Examples

Verified patterns from reading actual project source files.

### Middleware Extension — Role Check
```typescript
// Source: platform/src/middleware.ts (extend existing pattern)

// 1. Update early-exit condition (around line 25):
if (
  !pathWithoutLocale.startsWith('/portal') &&
  !pathWithoutLocale.startsWith('/admin') &&
  pathWithoutLocale !== '/login'
) {
  return response;
}

// 2. After the existing /portal and /login guards, add:
if (pathWithoutLocale.startsWith('/admin')) {
  if (!user) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  const adminRoles: string[] = ['admin', 'engineer', 'seller'];
  if (!profile || !adminRoles.includes(profile.role)) {
    return NextResponse.redirect(new URL(`/${locale}/portal`, request.url));
  }
}
```

### Admin Layout Shell
```typescript
// Source: mirror of platform/src/app/[locale]/portal/layout.tsx

"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import type { User } from "@/lib/types";
import { NotificationBell } from "@/components/NotificationBell";

const navItems = [
  { key: "overview", segment: "" },
  { key: "clients", segment: "/clients" },
  { key: "tasks", segment: "/tasks" },
  { key: "billing", segment: "/billing" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("admin");
  const supabase = createClient();
  const adminBase = `/${locale}/admin`;

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push(`/${locale}/login`); return; }
      const { data: profile } = await supabase
        .from("users").select("*").eq("id", authUser.id).single();
      if (profile) setUser(profile as User);
    }
    load();
  }, []);

  // ... sidebar JSX mirrors portal layout exactly
  // NotificationBell: <NotificationBell /> in sidebar header
  // Footer: user?.full_name + logout + link to /${locale}/portal
}
```

### Cross-Client Query with FK Join
```typescript
// Source: extended from portal/billing/page.tsx pattern

// Fetch all payments with client name in one query
const { data: payments } = await supabase
  .from('payments')
  .select('*, clients(name)')
  .order('created_at', { ascending: false })
  .limit(50);

// TypeScript type for joined data:
type PaymentWithClient = Payment & { clients: { name: string } | null };
```

### Playwright Admin Redirect Test
```typescript
// Source: e2e/portal.spec.ts + auth.setup.ts patterns
// File: platform/e2e/admin-redirect.spec.ts

import { test, expect } from '@playwright/test';

test('client-role user is redirected away from /admin', async ({ page }) => {
  await page.goto('/en/admin');
  // Middleware should redirect to portal before page renders
  await expect(page).toHaveURL(/.*\/portal.*/);
});
```

This test runs under the existing `chromium` project (uses `playwright/.auth/user.json` from `setup`). Add `testMatch` or just place the file in `e2e/` directory — it will be picked up automatically.

### i18n Namespace — admin
```json
// platform/src/messages/en.json — add "admin" namespace
{
  "admin": {
    "title": "Admin",
    "nav": {
      "overview": "Overview",
      "clients": "Clients",
      "tasks": "Tasks",
      "billing": "Billing"
    },
    "overview": {
      "title": "Admin Overview",
      "active_clients": "Active Clients",
      "current_mrr": "Current MRR",
      "open_tasks": "Open Tasks",
      "pending_payments": "Pending Payments",
      "recent_activity": "Recent Activity"
    },
    "clients": {
      "title": "All Clients",
      "search_placeholder": "Search by name..."
    },
    "tasks": {
      "title": "All Tasks",
      "filter_client": "All Clients",
      "filter_priority": "All Priorities",
      "filter_status": "All Statuses"
    },
    "billing": {
      "title": "Billing Overview",
      "total_mrr": "Total MRR",
      "active_subscriptions": "Active Subscriptions",
      "pending_payments": "Pending Payments",
      "failed_payments": "Failed Payments",
      "recent_payments": "Recent Payments",
      "active_subs_table": "Active Subscriptions"
    }
  }
}
```

Note: ES translation must have identical keys for CI i18n parity check (TEST-09) to pass — values can be the same English text.

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (E2E) |
| Config file | `platform/playwright.config.ts` |
| Quick run command | `npx playwright test e2e/admin-redirect.spec.ts` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMIN-01 | Middleware blocks client-role from /admin | E2E | `npx playwright test e2e/admin-redirect.spec.ts` | ❌ Wave 0 |
| TEST-08 | Same as ADMIN-01 — client redirect test | E2E | `npx playwright test e2e/admin-redirect.spec.ts` | ❌ Wave 0 |
| ADMIN-02 | Admin layout renders for authorized user | E2E (smoke) | `npx playwright test e2e/admin-redirect.spec.ts` | ❌ Wave 0 |
| ADMIN-03 | Overview page loads stat cards | E2E (smoke) | manual verify during dev | manual-only |
| ADMIN-04 | Client list page shows table | E2E (smoke) | manual verify during dev | manual-only |
| ADMIN-05 | Task view filters work | E2E (smoke) | manual verify during dev | manual-only |
| ADMIN-06 | Billing page loads data | E2E (smoke) | manual verify during dev | manual-only |
| NOTIF-09 | NotificationBell in admin sidebar | E2E (smoke) | manual verify during dev | manual-only |

### Sampling Rate
- **Per task commit:** `npx playwright test e2e/admin-redirect.spec.ts --project=chromium`
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `platform/e2e/admin-redirect.spec.ts` — covers ADMIN-01 / TEST-08
- [ ] Verify `juan@novapay.com` has `role = 'client'` in local dev DB before writing test (manual prerequisite check)

*(Existing `playwright.config.ts`, `auth.setup.ts`, and `playwright/.auth/user.json` are reused — no framework install needed.)*

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `supabase.auth.getSession()` in middleware | `supabase.auth.getUser()` | Supabase SSR v0.3+ | `getUser()` validates server-side; `getSession()` is stale-cookie-only |
| Separate DB query for each table in joins | Supabase `.select('*, related_table(col)')` | Supabase JS v2 | Single network round trip |

**Not needed in this phase:**
- JWT custom claims (Auth Hook) — would eliminate the DB role query in middleware, but is out of scope per D-02
- Server Components for admin layout — portal uses `"use client"` + useEffect pattern; admin follows the same for consistency

---

## Open Questions

1. **E2E test user role**
   - What we know: The default E2E user is `juan@novapay.com` from `auth.setup.ts`. Their role in the local dev database is unknown.
   - What's unclear: Whether they have `role = 'client'` (test works correctly) or `role = 'admin'` (test passes trivially and doesn't prove middleware works).
   - Recommendation: During Wave 0 setup, verify with `SELECT role FROM users WHERE email = 'juan@novapay.com'` against local Supabase. If not client-role, update or create a client-role test user and document the credential in `.env.local`.

2. **NOTIF-01 status — notifications table migration**
   - What we know: NOTIF-01 ("Notifications DB table") is marked "Pending" in REQUIREMENTS.md, but the `notifications` table is referenced in `types.ts` and cross-tenant E2E tests pass against it. Phase 7 NOTIF-02/03/04 are complete.
   - What's unclear: Whether `notifications` table exists in local dev Supabase or still needs `001_schema.sql` to be re-applied.
   - Recommendation: The admin layout mounts NotificationBell, which self-manages. If the table doesn't exist, the bell silently shows 0 unread. Not a blocker for Phase 8.

3. **`supabase db push` local vs remote**
   - What we know: A new `002_admin_rls.sql` migration is required for admin pages to return data.
   - What's unclear: Whether the developer runs `supabase db push` or applies SQL manually in the dashboard.
   - Recommendation: Plan task should include explicit step to apply the migration before testing admin pages.

---

## Sources

### Primary (HIGH confidence)
- Direct file read: `platform/src/middleware.ts` — current middleware structure analyzed line-by-line
- Direct file read: `platform/supabase/migrations/001_schema.sql` — RLS gap identified from lines 262-291
- Direct file read: `platform/src/lib/supabase/server.ts` — `createServiceClient()` pattern confirmed
- Direct file read: `platform/src/app/[locale]/portal/layout.tsx` — portal sidebar pattern to mirror
- Direct file read: `platform/src/app/[locale]/portal/page.tsx` — MetricCard, Badge, color maps
- Direct file read: `platform/src/app/[locale]/portal/billing/page.tsx` — billing table pattern
- Direct file read: `platform/src/app/[locale]/portal/tasks/page.tsx` — filter pattern
- Direct file read: `platform/e2e/auth.setup.ts`, `portal.spec.ts`, `cross-tenant.spec.ts`, `playwright.config.ts` — E2E patterns
- Direct file read: `platform/src/lib/types.ts` — User.role enum, User.client_id nullable
- Supabase official docs: https://supabase.com/docs/guides/database/postgres/row-level-security

### Secondary (MEDIUM confidence)
- Supabase GitHub Discussion #29482 — confirms DB query in middleware is possible but has perf cost; verified against project's existing pattern which already accepts this tradeoff
- Supabase official docs on custom claims: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac — confirms JWT custom claims approach (alternative, not used here)

### Tertiary (LOW confidence)
- WebSearch: Next.js admin layout patterns — general confirmation that "use client" + useEffect is established pattern; not authoritative but consistent with existing portal code

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are already installed; no new dependencies
- Architecture: HIGH — portal code read directly; patterns are extensions of existing code
- RLS gap: HIGH — verified line-by-line against 001_schema.sql
- Middleware pattern: HIGH — middleware.ts read directly; extension points identified
- Pitfalls: HIGH — derived from actual code analysis, not speculation
- E2E patterns: HIGH — all E2E files read directly

**Research date:** 2026-03-25
**Valid until:** 2026-06-01 (stable — Supabase SSR and Next.js 14 App Router are stable versions)
