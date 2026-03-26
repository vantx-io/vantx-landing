# Phase 12: Admin Capabilities - Research

**Researched:** 2026-03-26
**Domain:** Supabase Auth admin APIs, DB triggers, Recharts AreaChart, Next.js API routes
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Invite Flow (ADMIN-07, ADMIN-08)**
- D-01: "Invite User" button on `/admin/users` opens an inline form (not modal) with fields: email, role dropdown (admin/engineer/seller/client), client dropdown (required only when role=client, disabled otherwise)
- D-02: Backend uses `supabase.auth.admin.inviteUserByEmail()` via service role client — sends Supabase's default magic-link invite email
- D-03: DB trigger on `auth.users` INSERT auto-creates `users` row with role and client_id from user metadata — never application code (per STATE.md decision)
- D-04: New API route `POST /api/admin/users/invite` — admin-only, rate-limited (5 req/min)
- D-05: Invite form validates email uniqueness before sending — query `auth.users` via service role to check existing

**User Management Page (ADMIN-07, ADMIN-09, ADMIN-10)**
- D-06: New `/admin/users` page added to admin sidebar nav (after Billing)
- D-07: Table columns: Name, Email, Role (color badge), Client, Status (active/deactivated badge), Created, Actions
- D-08: Actions column: "Change Role" inline dropdown and "Deactivate"/"Reactivate" toggle button — individual row actions only, no bulk
- D-09: Add `admin.nav.users` and `admin.users.*` i18n keys to both en.json and es.json
- D-10: Follow existing admin table patterns from clients/tasks pages

**Role Change (ADMIN-09)**
- D-11: New API route `PATCH /api/admin/users/[id]/role` — accepts `{ role: string }`, validates against allowed roles, updates `users.role`
- D-12: When role changes from client to non-client, `client_id` kept as-is. When role changes TO client, client selection required
- D-13: Rate-limited at 20 req/min

**Deactivation (ADMIN-10)**
- D-14: Add `is_active BOOLEAN DEFAULT true` to `users` table via new migration `004_user_management.sql`
- D-15: New API route `PATCH /api/admin/users/[id]/status` — toggles `is_active` and calls `supabase.auth.admin.updateUserById(id, { ban_duration: '876000h' })` to ban or `{ ban_duration: 'none' }` to unban
- D-16: Middleware checks `is_active` on every authenticated request — deactivated users redirected to static "Account deactivated, contact your administrator" page
- D-17: No explicit session invalidation — Supabase JWT 1hr expiry handles it naturally

**MRR Trend Chart (ADMIN-11)**
- D-18: Recharts `AreaChart` placed at top of existing admin billing page, below the 4 stat cards
- D-19: Monthly granularity, last 12 months. MRR = sum of `payments.amount` where `status = 'paid'`, grouped by month
- D-20: Simple tooltip showing month + MRR value formatted as currency. No click interactions, no drill-down
- D-21: Uses existing dark theme colors — gradient fill matching admin dashboard aesthetic
- D-22: Query handled client-side from payments table (RLS already grants admin full SELECT)

### Claude's Discretion
- DB trigger exact syntax for auth.users → users row creation
- Badge color mapping for roles and active/deactivated status
- AreaChart gradient and axis styling
- Search/filter behavior on users table (by name, email, role)
- Error handling and loading states on admin API routes
- Test mocking strategy for Supabase admin auth methods

### Deferred Ideas (OUT OF SCOPE)
- Admin-assisted 2FA unenrollment UI (ADMIN-13)
- MRR chart subscription overlay with new/cancelled markers (ADMIN-12)
- Bulk user operations
- User activity log (covered by Phase 15 audit logging)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADMIN-07 | Admin can invite new users by email with role and client assignment | D-01 through D-05: inviteUserByEmail API + inline form pattern |
| ADMIN-08 | Invited user's public profile row is auto-created via DB trigger on acceptance | D-03: DB trigger syntax; trigger fires on auth.users INSERT |
| ADMIN-09 | Admin can change user role | D-11 through D-13: PATCH /api/admin/users/[id]/role + users table update |
| ADMIN-10 | Admin can deactivate/reactivate user accounts | D-14 through D-17: is_active column + ban_duration API + middleware gate |
| ADMIN-11 | Admin can view MRR trend chart on billing page (Recharts) | D-18 through D-22: AreaChart with defs/linearGradient + payments query |
</phase_requirements>

---

## Summary

Phase 12 adds admin user lifecycle management and a revenue trend chart. All decisions are locked — no library choices to make. The technical work decomposes into four tracks: (1) a DB migration adding `is_active` and the auth trigger, (2) three API routes under `/api/admin/users/`, (3) a new `/admin/users` page following the established table pattern, and (4) an AreaChart inserted into the existing billing page.

The biggest technical specificity in this phase is the Supabase DB trigger pattern for auto-creating `public.users` on `auth.users` INSERT, which requires reading metadata passed through `inviteUserByEmail()`. The `ban_duration: '876000h'` deactivation approach is the correct Supabase-native method — no need to invalidate sessions manually. Recharts `AreaChart` with `<defs><linearGradient>` is well-established from Recharts v2 docs and matches how the existing portal `BarChart`/`LineChart` are used.

**Primary recommendation:** Organize into two plans — Wave 1 covers DB migration + three API routes + middleware update, Wave 2 covers the users page UI + billing page AreaChart + i18n + sidebar nav update.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.47.0 (installed) | Auth admin APIs, DB queries | Only way to call `supabase.auth.admin.*` |
| @supabase/ssr | ^0.9.0 (installed) | Server-side Supabase client | Required for Next.js 14 App Router |
| recharts | ^2.13.3 (installed) | MRR AreaChart | Already installed; BarChart/LineChart in use |
| next-intl | ^4.8.3 (installed) | i18n for admin.users.* keys | Established project pattern |
| @upstash/ratelimit | installed | Rate limiting on new API routes | Established project pattern |

### No New Installs Required
All libraries for this phase are already installed. No `npm install` needed.

---

## Architecture Patterns

### Recommended Project Structure

New files for this phase:

```
platform/
├── supabase/migrations/
│   └── 004_user_management.sql        # is_active column + auth trigger
├── src/app/api/admin/users/
│   ├── invite/route.ts                # POST — invite user
│   └── [id]/
│       ├── role/route.ts              # PATCH — change role
│       └── status/route.ts            # PATCH — deactivate/reactivate
├── src/app/[locale]/admin/
│   └── users/page.tsx                 # New users management page
└── src/app/[locale]/portal/
    └── deactivated/page.tsx           # Static "account deactivated" page
```

Modified files:
```
platform/
├── src/middleware.ts                   # Add is_active check
├── src/app/[locale]/admin/layout.tsx  # Add "Users" nav item
├── src/app/[locale]/admin/billing/page.tsx  # Add MRR AreaChart
├── src/lib/types.ts                   # Add is_active to User type
├── src/messages/en.json               # Add admin.nav.users + admin.users.*
└── src/messages/es.json               # Same keys in Spanish
```

### Pattern 1: DB Trigger for auto-creating public.users on invite acceptance

The trigger must fire on INSERT to `auth.users`. The `inviteUserByEmail()` call accepts `{ data: { role, client_id } }` — this goes into `raw_user_meta_data`. The trigger reads from `NEW.raw_user_meta_data`.

**Critical:** Supabase's `inviteUserByEmail` does NOT create the auth.users row immediately — it creates it when the user accepts (clicks the link). The trigger fires at that moment.

```sql
-- Source: Supabase docs on auth hooks / DB triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, client_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    (NEW.raw_user_meta_data->>'client_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**SECURITY DEFINER** is required because the function executes in the context of the function owner (postgres superuser), not the calling user. Without it, the trigger would fail RLS on `public.users` INSERT.

**Pending todo from STATE.md:** "Validate Supabase post-signup trigger syntax against existing schema before migration is written." This is the exact trigger being built — validate it against the users table constraints (role CHECK, client_id FK).

### Pattern 2: API Route for admin invite (POST)

Follows the established pattern from `tasks/route.ts` exactly:

```typescript
// Source: existing platform/src/app/api/tasks/route.ts pattern
const RL_CONFIG = { requests: 5, window: "1 m" as const, prefix: "rl:admin-invite" };

export async function POST(req: Request) {
  // 1. Rate limit check (outside try/catch — established pattern from Phase 10)
  const sbSession = createServerSupabase();
  const { data: { user } } = await sbSession.auth.getUser();
  const identifier = getRateLimitIdentifier(req, user?.id);
  const rl = await rateLimit(identifier, RL_CONFIG);
  if (!rl.success) return rateLimitResponse(rl);

  // 2. Auth check — admin-only
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: rateLimitHeaders(rl) });
  const { data: profile } = await sbSession.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: rateLimitHeaders(rl) });

  // 3. Parse + validate body
  const { email, role, client_id } = await req.json();

  // 4. Check email uniqueness via service role
  const supabase = createServiceClient();
  // (supabase.auth.admin.listUsers() or getUserByEmail not directly available — use supabase.from('users').select to check public.users first, then proceed)

  // 5. Send invite with metadata
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role, client_id: client_id || null }
  });
  ...
}
```

**Important note on email uniqueness check (D-05):** `supabase.auth.admin` does not have a direct `getUserByEmail` method in JS SDK. The correct approach is: query `public.users` by email first. If a row exists, the user already has an account — return 409. If not, proceed with invite. The invite itself will fail at Supabase if the auth.users row already exists (duplicate email), providing a second safety net.

### Pattern 3: PATCH route for role change

```typescript
// Source: existing platform/src/app/api/tasks/[id]/status/route.ts pattern
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // rate limit → auth check → validate body → updateUserById metadata + users.role update
  const validRoles = ['admin', 'engineer', 'seller', 'client'];
  const { role, client_id } = await req.json();
  if (!validRoles.includes(role)) { ... }
  if (role === 'client' && !client_id) { ... } // require client when setting client role

  const supabase = createServiceClient();
  // Update public.users table (not auth metadata — role lives in public.users)
  const { data, error } = await supabase
    .from("users")
    .update({ role, ...(role === 'client' ? { client_id } : {}) })
    .eq("id", params.id)
    .select()
    .single();
}
```

**D-12 clarification:** When changing FROM client role to another role, `client_id` stays as-is in the DB. The update payload only includes `client_id` when the new role IS client and a client was provided.

### Pattern 4: PATCH route for deactivation/reactivation

```typescript
// Combines DB update + Supabase Auth ban
const supabase = createServiceClient();

// Toggle is_active in public.users
const { data: updatedUser } = await supabase
  .from("users")
  .update({ is_active: !currentIsActive })
  .eq("id", params.id)
  .select("is_active")
  .single();

// Sync ban state in Supabase Auth
await supabase.auth.admin.updateUserById(params.id, {
  ban_duration: updatedUser.is_active ? 'none' : '876000h'
});
```

**`876000h` = ~100 years** — effectively permanent ban without actual deletion. `'none'` removes the ban. This is the canonical approach per Supabase docs for account suspension.

### Pattern 5: Middleware is_active check

The current middleware queries `users.role` for admin routes. Extend to also check `is_active` for ALL authenticated routes (both `/portal` and `/admin`):

```typescript
// Source: platform/src/middleware.ts (extend the admin role check pattern)
// After confirming user is authenticated, query is_active alongside role:
const { data: profile } = await supabase
  .from("users")
  .select("role, is_active")
  .eq("id", user.id)
  .single();

// Check is_active for portal routes
if (pathWithoutLocale.startsWith("/portal")) {
  if (!profile?.is_active) {
    return NextResponse.redirect(new URL(`/${locale}/deactivated`, request.url));
  }
}

// For admin routes, still check role AND is_active
if (pathWithoutLocale.startsWith("/admin")) {
  if (!profile || !adminRoles.includes(profile.role) || !profile.is_active) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
}
```

**Note:** The deactivated redirect should go to `/deactivated` (no locale prefix needed — or add locale prefix to match routing). This is a static page, not inside the portal.

### Pattern 6: Recharts AreaChart with gradient fill

The billing page already uses the Recharts pattern. For the MRR chart:

```tsx
// Source: Recharts v2 docs + existing portal/page.tsx pattern
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, defs, linearGradient, stop
} from 'recharts';
// Actually: defs, linearGradient, stop are JSX elements from recharts, not separate imports

// MRR data: derive from payments query
// Group by month: { month: 'Jan', mrr: 12500 }

<ResponsiveContainer width="100%" height={200}>
  <AreaChart data={mrrData}>
    <defs>
      <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#2E75B6" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#2E75B6" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'MRR']} />
    <Area
      type="monotone"
      dataKey="mrr"
      stroke="#2E75B6"
      strokeWidth={2}
      fill="url(#mrrGradient)"
    />
  </AreaChart>
</ResponsiveContainer>
```

**Color:** `#2E75B6` matches the existing admin blue used in task status badges and portal charts.

### MRR calculation query (D-19)

```typescript
// Client-side query on billing page
const now = new Date();
const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

const { data: payments } = await supabase
  .from("payments")
  .select("amount, paid_at, created_at")
  .eq("status", "paid")
  .gte("created_at", twelveMonthsAgo.toISOString())
  .order("created_at", { ascending: true });

// Group by month client-side
const mrrByMonth: Record<string, number> = {};
for (const p of payments || []) {
  const dateStr = p.paid_at || p.created_at;
  const key = dateStr.slice(0, 7); // "YYYY-MM"
  mrrByMonth[key] = (mrrByMonth[key] || 0) + (p.amount || 0);
}
// Build 12-month array, filling gaps with 0
```

**Note:** Use `paid_at` when non-null (more accurate), fall back to `created_at`. The `paid_at` column exists in the payments table from 001_schema.sql.

### Anti-Patterns to Avoid

- **Do NOT check `is_active` client-side only:** Deactivated users could bypass by manipulating JS. The check MUST be in middleware (D-16).
- **Do NOT use `ban_duration: 'forever'`:** Supabase does not accept that string. Use `'876000h'` (verified approach in Supabase community).
- **Do NOT inline user queries in the trigger without SECURITY DEFINER:** The trigger would fail RLS.
- **Do NOT call `inviteUserByEmail` twice for the same email:** It will error. The email uniqueness check (D-05) prevents this.
- **Do NOT query `auth.users` directly from application code:** Use `public.users` for email uniqueness — `auth.users` is only accessible via service role admin methods, and listing all users to find one by email is expensive.
- **Do NOT use `(supabase as any)` cast for users table updates in admin routes:** Service role client bypasses RLS entirely — no cast needed. The `(supabase as any)` pattern is for client-side with anon key.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sending invite emails | Custom email + magic link generation | `supabase.auth.admin.inviteUserByEmail()` | Handles token generation, email delivery, link expiry |
| Blocking deactivated user login | Session revocation logic | `supabase.auth.admin.updateUserById({ ban_duration })` | Prevents new token issuance at auth layer |
| Role-based route protection | Per-page auth checks | Middleware `is_active` + role check | Single point of enforcement, not bypassable |
| MRR aggregation | Dedicated view or stored procedure | Client-side JS reduce over payments | Small dataset (<200 rows), simple sum |

---

## Common Pitfalls

### Pitfall 1: DB trigger missing SECURITY DEFINER
**What goes wrong:** Trigger function fails with RLS violation when inserting into `public.users`.
**Why it happens:** The trigger runs as the `authenticated` role, which doesn't have INSERT on `public.users` (no INSERT policy defined in 001_schema.sql).
**How to avoid:** Always declare the function with `SECURITY DEFINER` as shown in the code examples.
**Warning signs:** First invite acceptance returns "new row violates row-level security policy" in Supabase logs.

### Pitfall 2: client_id metadata as string UUID in trigger
**What goes wrong:** `(NEW.raw_user_meta_data->>'client_id')::UUID` fails when client_id is null (role !== 'client').
**Why it happens:** NULL cast to UUID is fine in Postgres, but an empty string `''` cast to UUID throws. If the invite form sends `client_id: ""` instead of `client_id: null`, the trigger fails.
**How to avoid:** In the invite API route, ensure `client_id` is set to `null` (not `""`) when role is not `client`. In the trigger, use `NULLIF(NEW.raw_user_meta_data->>'client_id', '')::UUID`.
**Warning signs:** Invites for non-client roles fail silently at acceptance.

### Pitfall 3: Middleware query overhead with is_active check
**What goes wrong:** Every request to `/portal` or `/admin` makes an extra DB query, adding latency.
**Why it happens:** Adding `is_active` means the existing role-only query (already done for admin routes) now also runs for portal routes.
**How to avoid:** Combine `role` and `is_active` in a single `select("role, is_active")` query — don't add a second round trip. The middleware already queries for admin users; extend to also query for portal users (currently only checks `user` existence).
**Warning signs:** Portal page load latency increases measurably.

### Pitfall 4: params typing in Next.js 14 dynamic route
**What goes wrong:** TypeScript error on `params.id` in the route handler.
**Why it happens:** Next.js 14 uses `{ params: { id: string } }` as second argument. The existing task routes show this pattern correctly.
**How to avoid:** Follow exactly `{ params }: { params: { id: string } }` as in `tasks/[id]/status/route.ts`.
**Warning signs:** TypeScript build errors on `params.id` access.

### Pitfall 5: Recharts defs/linearGradient not in import list
**What goes wrong:** `defs` and `linearGradient` are not separate Recharts imports — they're standard SVG elements rendered inside Recharts. The `<defs>` tag goes inside `<AreaChart>` as a child element, and `<linearGradient>` is also a direct SVG child.
**Why it happens:** Developer tries to import them from recharts, gets "not exported" error.
**How to avoid:** Write `<defs>` and `<linearGradient>` as plain JSX (no import needed — they are SVG elements React renders natively).
**Warning signs:** TypeScript import errors for `defs` or `linearGradient`.

### Pitfall 6: MRR chart empty on dev (no paid payments)
**What goes wrong:** Chart renders with no data — confusing during development.
**Why it happens:** Dev seed data has no `status='paid'` payments.
**How to avoid:** Add a loading/empty state: "No payment data for selected period." Do not assume zero means the query failed.
**Warning signs:** Empty chart with no visual indicator of success vs. no-data state.

### Pitfall 7: invite form client_id dropdown conditional disable
**What goes wrong:** Client dropdown stays enabled when switching role away from "client", allowing accidental client_id submission.
**Why it happens:** Controlled form state not updating the disabled prop reactively.
**How to avoid:** Use `role === 'client'` as the condition for both `disabled` on the select and for including `client_id` in the API payload.
**Warning signs:** API receives `client_id` for admin/engineer/seller invite.

---

## Code Examples

### Migration 004_user_management.sql

```sql
-- Add is_active to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create trigger function for auto-populating users on auth.users INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, client_id, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NULLIF(NEW.raw_user_meta_data->>'client_id', '')::UUID,
    true
  )
  ON CONFLICT (id) DO NOTHING;  -- safe re-run guard
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**`ON CONFLICT (id) DO NOTHING`** guards against re-runs (e.g., migration applied twice in dev).

### RLS policies for users table (add to migration)

The `users` table needs admin INSERT/UPDATE policies for the role change and status routes (service role bypasses RLS, but adding explicit policies is good hygiene and documents intent):

```sql
-- Allow admins to manage users (service role bypasses this, but documents intent)
CREATE POLICY "Admins can manage users" ON users FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Users can read their own row (needed for middleware profile lookup)
CREATE POLICY "Users can read own profile" ON users FOR SELECT
  USING (id = auth.uid());
```

Check whether existing 001_schema.sql already has a users SELECT policy — it does not (only RLS is enabled, no SELECT policy on users). This needs to be added, otherwise the middleware `select("role, is_active")` query fails.

**CRITICAL GAP:** The existing `middleware.ts` queries `supabase.from("users").select("role")` — this works because the service-role-adjacent anon key with the right JWT allows it, OR there is an implicit self-select. Verify that the current middleware works in production before assuming users can always read their own row. If it's working now without a SELECT policy, it's likely because the Supabase project has an auto-created policy. The migration should preserve this behavior by not adding a conflicting policy.

### i18n keys to add (en.json)

```json
"admin": {
  "nav": {
    "users": "Users"
  },
  "users": {
    "title": "User Management",
    "invite_button": "Invite User",
    "search_placeholder": "Search by name or email...",
    "col_name": "Name",
    "col_email": "Email",
    "col_role": "Role",
    "col_client": "Client",
    "col_status": "Status",
    "col_created": "Created",
    "col_actions": "Actions",
    "action_change_role": "Change Role",
    "action_deactivate": "Deactivate",
    "action_reactivate": "Reactivate",
    "no_results": "No users found",
    "invite_form_email": "Email",
    "invite_form_role": "Role",
    "invite_form_client": "Client",
    "invite_form_submit": "Send Invite",
    "invite_form_cancel": "Cancel",
    "invite_success": "Invite sent to {email}",
    "invite_error_duplicate": "A user with this email already exists",
    "invite_error_failed": "Failed to send invite. Try again.",
    "role_change_success": "Role updated",
    "deactivate_success": "User deactivated",
    "reactivate_success": "User reactivated"
  },
  "billing": {
    "mrr_trend_title": "MRR Trend (last 12 months)"
  }
}
```

### Badge color mapping (Claude's Discretion — recommended)

```typescript
// Role badge colors
const roleColors: Record<string, string> = {
  admin: "#C0392B",      // red — highest privilege
  engineer: "#2E75B6",  // blue — technical
  seller: "#27AE60",    // green — revenue
  client: "#999999",    // gray — external
};

// Status badge colors
const statusColors: Record<string, string> = {
  active: "#27AE60",
  deactivated: "#C0392B",
};
```

### User type extension

```typescript
// In platform/src/lib/types.ts — extend User type
export type User = {
  id: string;
  client_id: string | null;
  full_name: string;
  email: string;
  role: "admin" | "engineer" | "seller" | "client";
  avatar_url: string | null;
  is_active: boolean;       // ADD THIS
  created_at: string;
};

// Also extend Database.public.Tables.users.Row and Insert:
users: {
  Row: User;
  Insert: Partial<Omit<User, "created_at">> &
    Pick<User, "id" | "full_name" | "email" | "role">;  // is_active has DEFAULT true
  Update: Partial<User>;
  ...
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manually revoking JWTs | `ban_duration` in Supabase Auth | Supabase v2 | No need for token blacklist |
| Trigger functions per-project | `SECURITY DEFINER` triggers on `auth.users` | Always | Standard Supabase pattern |
| Application-code user row creation | DB trigger on `auth.users` INSERT | Phase 12 decision | Atomic, no race condition |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 |
| Config file | `platform/vitest.config.mts` |
| Quick run command | `cd platform && npx vitest run --reporter=verbose` |
| Full suite command | `cd platform && npx vitest run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMIN-07 | POST /api/admin/users/invite: validates email, role, returns 201 | unit | `cd platform && npx vitest run __tests__/admin-invite.test.ts -x` | ❌ Wave 0 |
| ADMIN-07 | POST /api/admin/users/invite: returns 409 for duplicate email | unit | same file | ❌ Wave 0 |
| ADMIN-07 | POST /api/admin/users/invite: returns 403 for non-admin caller | unit | same file | ❌ Wave 0 |
| ADMIN-07 | POST /api/admin/users/invite: returns 429 when rate limited | unit | same file | ❌ Wave 0 |
| ADMIN-08 | DB trigger creates users row from auth.users INSERT metadata | manual-only | Supabase local test via psql | N/A — DB trigger, no JS unit |
| ADMIN-09 | PATCH /api/admin/users/[id]/role: validates allowed roles | unit | `cd platform && npx vitest run __tests__/admin-users.test.ts -x` | ❌ Wave 0 |
| ADMIN-09 | PATCH /api/admin/users/[id]/role: returns 400 for role=client without client_id | unit | same file | ❌ Wave 0 |
| ADMIN-10 | PATCH /api/admin/users/[id]/status: toggles is_active, calls ban_duration | unit | same file | ❌ Wave 0 |
| ADMIN-10 | Middleware redirects is_active=false users to /deactivated | unit | `cd platform && npx vitest run __tests__/middleware.test.ts -x` | ❌ Wave 0 |
| ADMIN-11 | MRR data grouped correctly by month from payments array | unit | `cd platform && npx vitest run __tests__/mrr-chart.test.ts -x` | ❌ Wave 0 |

**Note on ADMIN-08:** DB trigger behavior cannot be unit-tested with Vitest — it requires a running Postgres instance. Test manually via `supabase db reset` + psql insertion to verify trigger fires. Add a note in the plan task to manually verify in local Supabase (`supabase start`).

### Sampling Rate
- **Per task commit:** `cd platform && npx vitest run --reporter=dot`
- **Per wave merge:** `cd platform && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `platform/__tests__/admin-invite.test.ts` — covers ADMIN-07 (invite route unit tests)
- [ ] `platform/__tests__/admin-users.test.ts` — covers ADMIN-09, ADMIN-10 (role + status route tests)
- [ ] `platform/__tests__/middleware.test.ts` — covers ADMIN-10 is_active middleware redirect
- [ ] `platform/__tests__/mrr-chart.test.ts` — covers ADMIN-11 MRR grouping logic

---

## Open Questions

1. **Does `public.users` currently have a SELECT policy for self?**
   - What we know: Middleware queries `supabase.from("users").select("role")` using anon key + JWT — this works in production today
   - What's unclear: Whether it works because of an implicit "users can read own row" behavior in Supabase or a missing RLS policy that happens to default to deny (which would mean middleware is broken)
   - Recommendation: Test locally with `supabase start` before writing migration. If it works, there's an implicit allow. If the migration should add a SELECT policy, do so without conflicting with existing admin bypass policies.

2. **Deactivated page route with locale**
   - What we know: D-16 says redirect to "Account deactivated, contact your administrator" page
   - What's unclear: Should the route be `/${locale}/deactivated` (inside intl routing) or `/deactivated` (outside)? The CONTEXT.md doesn't specify.
   - Recommendation: Put it inside locale routing at `src/app/[locale]/deactivated/page.tsx` so next-intl handles it naturally. Redirect in middleware with locale prefix.

3. **Invite form "client" requirement UX for non-client roles**
   - What we know: D-12 says client_id is required only for role=client
   - What's unclear: If an admin invites a new client user but doesn't select a client, should the invite be blocked at the form level or API level?
   - Recommendation: Block at both — disable Submit button until client is selected when role=client; also validate server-side.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase: `platform/src/app/api/tasks/[id]/status/route.ts` — PATCH route pattern with rate limit, auth check, service client
- Existing codebase: `platform/src/app/[locale]/admin/clients/page.tsx` — admin table pattern with search/filter
- Existing codebase: `platform/src/app/[locale]/admin/billing/page.tsx` — billing page structure where AreaChart goes
- Existing codebase: `platform/src/middleware.ts` — middleware auth + role check pattern to extend
- Existing codebase: `platform/supabase/migrations/001_schema.sql` — users table constraints, trigger syntax for `update_updated_at()`
- Existing codebase: `platform/src/app/[locale]/portal/page.tsx` — Recharts BarChart/LineChart usage (confirms import pattern)

### Secondary (MEDIUM confidence)
- Supabase docs: `ban_duration: '876000h'` for effective permanent ban — confirmed as correct approach in Supabase community posts and docs on user management
- Recharts v2: `AreaChart` with `<defs><linearGradient>` — standard documented pattern, defs/linearGradient are SVG elements not Recharts imports
- Supabase trigger pattern: `SECURITY DEFINER` + `ON CONFLICT DO NOTHING` — standard Supabase auth hook documentation pattern

### Tertiary (LOW confidence)
- None — all critical claims verified against existing codebase or established Supabase patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use
- Architecture: HIGH — patterns copied directly from existing admin routes and pages
- Pitfalls: HIGH — grounded in existing code inspection (RLS policies, trigger syntax, Recharts import behavior)
- DB trigger syntax: MEDIUM — pending todo from STATE.md to validate against local Supabase before migration commit

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable stack, no fast-moving dependencies)
