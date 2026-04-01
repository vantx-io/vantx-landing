# Phase 12: Admin Capabilities - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Admins can manage the full user lifecycle from within the platform (invite, role change, deactivation/reactivation) and can track MRR trends over time via a Recharts chart on the billing page. New `/admin/users` page with user management table.

</domain>

<decisions>
## Implementation Decisions

### Invite Flow (ADMIN-07, ADMIN-08)
- **D-01:** "Invite User" button on `/admin/users` opens an inline form (not modal) with fields: email, role dropdown (admin/engineer/seller/client), client dropdown (required only when role=client, disabled otherwise)
- **D-02:** Backend uses `supabase.auth.admin.inviteUserByEmail()` via service role client — sends Supabase's default magic-link invite email
- **D-03:** DB trigger on `auth.users` INSERT auto-creates `users` row with role and client_id from user metadata — never application code (per STATE.md decision)
- **D-04:** New API route `POST /api/admin/users/invite` — admin-only, rate-limited (5 req/min per D-04 from Phase 10 auth-adjacent threshold)
- **D-05:** Invite form validates email uniqueness before sending — query `auth.users` via service role to check existing

### User Management Page (ADMIN-07, ADMIN-09, ADMIN-10)
- **D-06:** New `/admin/users` page added to admin sidebar nav (after Billing)
- **D-07:** Table columns: Name, Email, Role (color badge), Client, Status (active/deactivated badge), Created, Actions
- **D-08:** Actions column: "Change Role" inline dropdown and "Deactivate"/"Reactivate" toggle button — individual row actions only, no bulk operations
- **D-09:** Add `admin.nav.users` and `admin.users.*` i18n keys to both en.json and es.json
- **D-10:** Follow existing admin table patterns from clients/tasks pages (client-side Supabase fetch, status badges, search/filter)

### Role Change (ADMIN-09)
- **D-11:** New API route `PATCH /api/admin/users/[id]/role` — accepts `{ role: string }`, validates against allowed roles, updates `users.role`
- **D-12:** When role changes from client to admin/engineer/seller, `client_id` is kept as-is (not cleared). When role changes TO client, a client selection is required
- **D-13:** Rate-limited at 20 req/min (task mutation tier)

### Deactivation (ADMIN-10)
- **D-14:** Add `is_active BOOLEAN DEFAULT true` to `users` table via new migration `004_user_management.sql`
- **D-15:** New API route `PATCH /api/admin/users/[id]/status` — toggles `is_active` and calls `supabase.auth.admin.updateUserById(id, { ban_duration: '876000h' })` to ban or `{ ban_duration: 'none' }` to unban at Supabase Auth level
- **D-16:** Middleware checks `is_active` on every authenticated request — deactivated users redirected to a static "Account deactivated, contact your administrator" page
- **D-17:** No explicit session invalidation — Supabase JWT 1hr expiry handles it naturally. Ban prevents new token refresh

### MRR Trend Chart (ADMIN-11)
- **D-18:** Recharts `AreaChart` placed at the top of existing admin billing page, below the 4 stat cards
- **D-19:** Monthly granularity, last 12 months. MRR = sum of `payments.amount` where `status = 'paid'`, grouped by month
- **D-20:** Simple tooltip showing month + MRR value formatted as currency. No click interactions, no drill-down
- **D-21:** Uses existing dark theme colors — gradient fill matching the admin dashboard aesthetic
- **D-22:** Query handled client-side from payments table (RLS already grants admin full SELECT)

### Claude's Discretion
- DB trigger exact syntax for auth.users → users row creation
- Badge color mapping for roles and active/deactivated status
- AreaChart gradient and axis styling
- Search/filter behavior on users table (by name, email, role)
- Error handling and loading states on admin API routes
- Test mocking strategy for Supabase admin auth methods

</decisions>

<specifics>
## Specific Ideas

- Invite form should feel lightweight — inline expansion, not a heavy modal. Think "add a row" not "open a dialog"
- Role badges should use distinct colors per role for quick scanning (admin=red, engineer=blue, seller=green, client=gray)
- Deactivated users should be visually dimmed in the table, not hidden — admins need to see and reactivate them
- MRR chart should be the first thing an admin sees on billing — revenue trend is the most important signal

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database schema (users, payments, RLS)
- `platform/supabase/migrations/001_schema.sql` — Users table (roles CHECK constraint), payments table, subscriptions table
- `platform/supabase/migrations/002_admin_rls.sql` — Admin/engineer/seller bypass RLS policies

### Admin dashboard (existing pages to follow)
- `platform/src/app/[locale]/admin/layout.tsx` — Admin layout with sidebar nav (add Users link)
- `platform/src/app/[locale]/admin/billing/page.tsx` — Billing page where MRR chart goes (existing stat cards + tables)
- `platform/src/app/[locale]/admin/clients/page.tsx` — Client table pattern to follow for users table
- `platform/src/app/[locale]/admin/tasks/page.tsx` — Task table with filters pattern

### Auth & middleware
- `platform/src/middleware.ts` — Admin role gate + add is_active check
- `platform/src/lib/supabase/server.ts` — `createServiceClient()` for admin auth operations

### API route patterns
- `platform/src/app/api/tasks/route.ts` — Rate-limited API route pattern
- `platform/src/lib/rate-limit.ts` — Rate limit helper

### Types & i18n
- `platform/src/lib/types.ts` — User type (extend with is_active)
- `platform/src/messages/en.json` — English translations (add admin.users namespace)
- `platform/src/messages/es.json` — Spanish translations

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Admin table pattern (clients/tasks pages) — same structure for users table
- Status badge component — reuse for role and active/deactivated badges
- Rate limit helper `rateLimit()` — apply to new admin API routes
- `createServiceClient()` — required for `supabase.auth.admin.*` methods
- Recharts already installed (v2.13.3) — BarChart used in dashboard, extend with AreaChart

### Established Patterns
- Admin pages use client-side Supabase fetch with RLS auto-filtering
- API routes: rate limit → auth check → operation → NextResponse.json()
- i18n: `useTranslations('admin')` with nested keys
- Middleware: role check via users table query, redirect on unauthorized

### Integration Points
- Admin sidebar nav — add "Users" link
- Admin billing page — insert AreaChart above existing tables
- Middleware — add `is_active` check after auth resolution
- New migration `004_user_management.sql` — is_active column + DB trigger
- New API routes under `/api/admin/users/`
- `.env.local.example` — no new env vars (service role key already exists)

</code_context>

<deferred>
## Deferred Ideas

- Admin-assisted 2FA unenrollment UI — deferred to v2 (ADMIN-13)
- MRR chart subscription overlay with new/cancelled markers — deferred to v2 (ADMIN-12)
- Bulk user operations (mass invite, mass deactivate) — future if user count grows
- User activity log visible from admin users page — covered by Phase 15 audit logging (SECURE-02)

</deferred>

---

*Phase: 12-admin-capabilities*
*Context gathered: 2026-03-26*
