# Phase 11: Notification Polish - Research

**Researched:** 2026-03-25
**Domain:** Notification preferences, Vercel Cron, React Email, Supabase RLS
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Separate `notification_preferences` table (not extending `users`) — cleaner separation, easier to evolve without touching users table
- **D-02:** Schema: `id`, `user_id` (FK unique), `email_enabled` (bool, default true), `in_app_enabled` (bool, default true), `digest_enabled` (bool, default true), `updated_at`
- **D-03:** Opt-out model — null row (no preferences record) means all channels enabled. Only users who explicitly disable something get a row
- **D-04:** Per-channel granularity (email on/off, in-app on/off) with digest as a separate independent toggle. NOT per-notification-type. All event types follow the same channel setting
- **D-05:** RLS: users can SELECT/UPDATE/INSERT their own row only. Service role for digest cron queries
- **D-06:** New migration file `003_notification_preferences.sql`
- **D-07:** Digest includes: task count by status (new, completed, in-progress), list of tasks that changed status during the week (max 10, with "and N more" truncation), CTA button to portal
- **D-08:** If zero activity in the past week, do NOT send the digest — skip silently
- **D-09:** New React Email template `WeeklyDigestEmail.tsx` — bilingual (en/es), same design language as TaskStatusEmail (blue CTA #2563EB, max-width 560px)
- **D-10:** Digest query scoped to client — each user sees only their client's task activity. Admins/engineers get a digest of ALL clients' activity
- **D-11:** New route at `/portal/settings` with a "Notifications" section
- **D-12:** Three toggle switches: "Email notifications", "In-app notifications", "Weekly digest email"
- **D-13:** Toggle state persists immediately on change (optimistic update + API call) — no "Save" button
- **D-14:** Add "Settings" link to portal sidebar navigation, after the existing nav items
- **D-15:** i18n: new `settings` namespace in en.json/es.json for all labels
- **D-16:** Vercel Cron schedule: every Monday at 9:00 UTC via `vercel.json`
- **D-17:** Cron handler at `/api/cron/digest/route.ts` — protected by `CRON_SECRET` env var
- **D-18:** Per-user delivery — each enrolled user with `digest_enabled !== false` gets their own email
- **D-19:** `Promise.allSettled()` for parallel sends — one user's email failure doesn't block others
- **D-20:** Activity window: previous 7 days from cron execution time
- **D-21:** Modify `notifyTaskEvent` to check `notification_preferences` before sending email and before inserting notification row
- **D-22:** Lookup pattern: single query per recipient at send time. If no preferences row exists → send (opt-out model). If row exists and channel disabled → skip
- **D-23:** Payment notification emails (from Stripe webhook) also check preferences — modify the webhook handler to respect `email_enabled`

### Claude's Discretion
- API route structure for preferences CRUD (single PATCH endpoint vs separate)
- Exact toggle component implementation (headless UI vs custom)
- Digest email aggregation query optimization
- Test mocking strategy for Vercel Cron

### Deferred Ideas (OUT OF SCOPE)
- Per-user digest schedule (timezone-aware weekly/daily toggle) — deferred to v2 (NOTIF-13)
- Per-notification-type granularity (toggle task vs payment separately) — future if users request it
- Slack notification preferences — Slack is org-level, not user-level preference
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NOTIF-10 | Client receives weekly Monday email digest of task activity | D-16 through D-20: Vercel Cron `0 9 * * 1`, WeeklyDigestEmail.tsx, Promise.allSettled, 7-day window |
| NOTIF-11 | User can toggle notification preferences per type (email, in-app) in portal settings | D-11 through D-15: /portal/settings page, three toggles, optimistic update, i18n |
| NOTIF-12 | Notification preferences are enforced at send time in notifyTaskEvent | D-21 through D-23: preference lookup in notifyTaskEvent + Stripe webhook handler |
</phase_requirements>

---

## Summary

Phase 11 adds three interlocking capabilities on top of the v1.1 notification pipeline: (1) a user-controlled preferences UI at `/portal/settings`; (2) preference enforcement at every send site (`notifyTaskEvent` and the Stripe webhook handler); and (3) a Monday weekly digest cron job. All three capabilities share a single new table (`notification_preferences`) following an opt-out model — no row means all channels on.

The existing codebase provides strong leverage. `notifyTaskEvent` is the single notification orchestrator and already accepts a Supabase client parameter, making it testable without module mocks. `sendEmail` uses per-call Resend instantiation, so it integrates cleanly. The TaskStatusEmail pattern (bilingual, max-width 560px, blue CTA) establishes the design language for WeeklyDigestEmail. The Vitest test suite with `buildMockSupabase` provides a proven mock builder to extend for preference lookups.

The Vercel Cron approach is confirmed correct: a weekly Monday cron expression (`0 9 * * 1`) runs once per week, which satisfies Vercel Hobby plan's "once per day" minimum interval. The `CRON_SECRET` / `Authorization: Bearer` security pattern is Vercel's official recommendation.

**Primary recommendation:** Build in three sequential waves — Wave 1: migration + preferences API; Wave 2: settings UI + preference enforcement in send paths; Wave 3: WeeklyDigestEmail template + cron handler.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@react-email/components` | ^1.0.10 (installed) | WeeklyDigestEmail template | Already in use for TaskStatusEmail, PaymentSuccessEmail |
| `@react-email/render` | ^2.0.4 (installed) | Server-side HTML rendering for digest | Already in use in tests |
| `resend` | ^6.9.4 (installed) | Send digest emails | Already in use via `sendEmail()` wrapper |
| `date-fns` | ^4.1.0 (installed) | 7-day window calculation for digest query | Already installed, used in NotificationBell |
| Supabase RLS | (Supabase SDK) | Row-level access on notification_preferences | Established pattern from 001_schema.sql, 002_notifications.sql |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Custom inline toggle | (no new dep) | Three toggle switches in settings UI | Project avoids external component libs; existing UI is hand-rolled Tailwind |
| Vercel Cron (`vercel.json`) | N/A — config only | Weekly Monday digest scheduler | Confirmed viable on Hobby plan for once-per-week frequency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Tailwind toggle | `@headlessui/react` Switch | Headless UI adds a dependency for 3 toggles; project pattern is hand-rolled Tailwind components — custom is consistent |
| `date-fns` subRange | Raw `new Date()` arithmetic | `date-fns` already installed; `subDays(new Date(), 7)` is cleaner and handles DST edge cases |
| Single PATCH `/api/preferences` | Separate PUT/DELETE per field | Single PATCH is simpler, aligns with how the table has one row per user |

**Installation:** No new packages required — all dependencies already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
platform/
├── src/
│   ├── app/
│   │   ├── [locale]/portal/settings/
│   │   │   └── page.tsx                  # new — /portal/settings route (NOTIF-11)
│   │   └── api/
│   │       ├── cron/
│   │       │   └── digest/
│   │       │       └── route.ts          # new — Vercel Cron handler (NOTIF-10)
│   │       └── preferences/
│   │           └── route.ts              # new — PATCH /api/preferences (NOTIF-11)
│   └── lib/
│       ├── notifications.ts              # modify — add preference checks (NOTIF-12)
│       ├── emails/
│       │   └── WeeklyDigestEmail.tsx     # new — digest email template (NOTIF-10)
│       └── supabase/
│           └── server.ts                 # existing — createServiceClient for cron
├── supabase/
│   └── migrations/
│       └── 003_notification_preferences.sql  # new (NOTIF-11, NOTIF-12)
└── vercel.json                           # new — cron schedule (NOTIF-10)
```

### Pattern 1: Vercel Cron Handler with CRON_SECRET

**What:** A Next.js App Router GET route that Vercel invokes on schedule. Authorization is verified against the `CRON_SECRET` env var before any logic runs.

**When to use:** All scheduled background work on Vercel serverless.

```typescript
// Source: https://vercel.com/docs/cron-jobs/manage-cron-jobs
// platform/src/app/api/cron/digest/route.ts
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  // ... digest logic
  return Response.json({ success: true })
}
```

```json
// vercel.json — Monday 9am UTC
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/digest",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

### Pattern 2: Opt-out Preference Lookup in notifyTaskEvent

**What:** Single query per recipient at send time. No preferences row → send (opt-out). Row exists with channel disabled → skip. Two independent checks: `email_enabled` before `sendEmail`, `in_app_enabled` before `createNotification`.

**When to use:** Every send site — `notifyTaskEvent` loop, Stripe webhook handler.

```typescript
// platform/src/lib/notifications.ts — add inside the per-user loop
// Uses createServiceClient (supabase param is already SupabaseAdmin)
const { data: prefs } = await supabase
  .from('notification_preferences')
  .select('email_enabled, in_app_enabled')
  .eq('user_id', user.id)
  .maybeSingle()  // returns null if no row — opt-out model

const emailEnabled = prefs?.email_enabled !== false  // null row → true
const inAppEnabled = prefs?.in_app_enabled !== false  // null row → true

if (emailEnabled) {
  // ... sendEmail(...)
}
if (inAppEnabled) {
  // ... createNotification(...)
}
```

**Key:** `.maybeSingle()` returns `{ data: null, error: null }` when no row exists, unlike `.single()` which would error. This implements D-22 cleanly.

### Pattern 3: Optimistic Toggle with PATCH API

**What:** On toggle change, immediately update local React state (optimistic), then fire a PATCH request to `/api/preferences`. On failure, roll back local state. No "Save" button.

**When to use:** The settings page with three toggle switches (D-13).

```typescript
// Optimistic update pattern
async function handleToggle(field: 'email_enabled' | 'in_app_enabled' | 'digest_enabled') {
  const newValue = !prefs[field]
  setPrefs(prev => ({ ...prev, [field]: newValue }))  // optimistic

  const res = await fetch('/api/preferences', {
    method: 'PATCH',
    body: JSON.stringify({ [field]: newValue }),
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    setPrefs(prev => ({ ...prev, [field]: !newValue }))  // rollback
  }
}
```

### Pattern 4: PATCH /api/preferences — Upsert

**What:** Single PATCH endpoint that upserts the `notification_preferences` row for the authenticated user. Uses `createServerSupabase()` (not service role) to get the authenticated user's ID from the session.

```typescript
// platform/src/app/api/preferences/route.ts
import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  // Only allow known preference fields
  const allowed = ['email_enabled', 'in_app_enabled', 'digest_enabled']
  const patch: Record<string, boolean> = {}
  for (const key of allowed) {
    if (key in body && typeof body[key] === 'boolean') patch[key] = body[key]
  }

  await supabase
    .from('notification_preferences')
    .upsert({ user_id: user.id, ...patch, updated_at: new Date().toISOString() })

  return NextResponse.json({ ok: true })
}
```

### Pattern 5: Digest Query with date-fns

**What:** Fetch tasks updated in the past 7 days, group by status, truncate at 10.

```typescript
// platform/src/app/api/cron/digest/route.ts
import { subDays } from 'date-fns'

const since = subDays(new Date(), 7).toISOString()

// Per-client user query
const { data: tasks } = await supabase
  .from('tasks')
  .select('id, title, status, client_id, updated_at')
  .eq('client_id', user.client_id)   // scoped for client users
  .gte('updated_at', since)
  .order('updated_at', { ascending: false })

// Admin/engineer query (D-10: cross-client view)
const { data: tasks } = await supabase
  .from('tasks')
  .select('id, title, status, client_id, updated_at')
  .gte('updated_at', since)
  .order('updated_at', { ascending: false })
```

### Pattern 6: WeeklyDigestEmail Template

**What:** React Email component following the TaskStatusEmail design language — same `Html/Head/Body/Section/Text/Button` structure, blue CTA #2563EB, max-width 560px, bilingual.

```typescript
// platform/src/lib/emails/WeeklyDigestEmail.tsx — pattern from TaskStatusEmail
interface WeeklyDigestEmailProps {
  locale: 'en' | 'es'
  taskSummary: { new: number; in_progress: number; completed: number }
  recentTasks: Array<{ title: string; status: string }>
  totalTasks: number  // for "and N more" truncation
  portalUrl: string
}
```

### Pattern 7: RLS for notification_preferences

**What:** Users can SELECT/UPDATE/INSERT their own row only. Service role bypasses RLS for cron queries.

```sql
-- 003_notification_preferences.sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  digest_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences" ON notification_preferences
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Anti-Patterns to Avoid

- **Using `.single()` for preferences lookup:** Returns an error when no row exists. Use `.maybeSingle()` — it returns `{ data: null }` cleanly, which implements the opt-out model correctly.
- **Using `createServiceClient()` for PATCH /api/preferences:** The service client has no auth context (no cookies). Use `createServerSupabase()` to read the authenticated user's session.
- **Sending digest regardless of zero activity:** D-08 is explicit — check `tasks.length === 0` and `return` before sending, per user.
- **Using `Promise.all()` for digest sends:** If one user's email fails, it rejects all. Use `Promise.allSettled()` per D-19.
- **Storing preferences in users table:** D-01 locks this out. Separate table only.
- **Weekly cron more frequent than daily on Hobby plan:** The expression `0 9 * * 1` runs once per week — confirmed within Hobby plan limits.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Opt-out row check | Custom null-handling logic | `.maybeSingle()` from Supabase JS | Built-in — returns null on no row, no error |
| Date arithmetic for 7-day window | `new Date(Date.now() - 7 * 24 * 3600 * 1000)` | `subDays(new Date(), 7)` from date-fns | DST-safe, already installed |
| Email template rendering | Custom HTML string builder | `@react-email/components` + `render()` | Already established pattern; render() produces tested HTML |
| Cron job scheduling | Custom setTimeout loop, persistent worker | Vercel Cron `vercel.json` | No persistent infra; STATE.md explicitly rejects node-cron/agenda |
| Preference upsert conflict | Manual SELECT then INSERT or UPDATE | Supabase `.upsert()` with `user_id` unique constraint | Single idempotent operation |

**Key insight:** The opt-out model (null row = all enabled) means the preferences table stays sparse — most users never get a row at all. `.maybeSingle()` is the right API for this: don't compensate for "no row found" with application-level error handling.

---

## Common Pitfalls

### Pitfall 1: .single() vs .maybeSingle() on Missing Row
**What goes wrong:** `supabase.from('notification_preferences').select(...).eq('user_id', id).single()` throws `{ error: { code: 'PGRST116' } }` when no row exists. Since the opt-out model means most users have no row, `.single()` would incorrectly block sends for all users.
**Why it happens:** `.single()` expects exactly one row — zero rows is an error.
**How to avoid:** Use `.maybeSingle()` everywhere. Check `prefs?.email_enabled !== false` (not `prefs?.email_enabled === true`).
**Warning signs:** Tests that mock a missing preferences row unexpectedly show zero sends.

### Pitfall 2: createServiceClient in PATCH /api/preferences
**What goes wrong:** The service client bypasses cookies, so `supabase.auth.getUser()` returns `{ data: { user: null } }`. The PATCH handler would either fail with 401 or skip the user ID check entirely.
**Why it happens:** Phase 10 established `createServerSupabase()` vs `createServiceClient()` — the former reads the request cookie context. Same pattern applies here.
**How to avoid:** Use `createServerSupabase()` (the cookie-aware server client) for the PATCH endpoint. Use `createServiceClient()` only in the cron handler (which has no user session by design).
**Warning signs:** PATCH returns 401 in test even with a valid session.

### Pitfall 3: Vercel Cron Only Runs on Production Deployments
**What goes wrong:** Developer tests the cron endpoint manually in local dev, it works, but the job never fires on Vercel preview deployments.
**Why it happens:** Vercel invokes cron jobs only for production deployments.
**How to avoid:** Test the cron handler by calling `GET /api/cron/digest` directly with the `Authorization: Bearer <CRON_SECRET>` header in local dev or preview. The handler is a regular route — curl or browser fetch works.
**Warning signs:** Cron shows as configured in vercel.json but never appears in Vercel logs for a preview URL.

### Pitfall 4: Hobby Plan Timing Jitter
**What goes wrong:** A Monday 9:00 UTC cron fires anywhere between 9:00 and 9:59 UTC on Hobby. The 7-day window calculated from `new Date()` will shift by up to 59 minutes per week.
**Why it happens:** Vercel Hobby cron precision is hourly, not per-minute.
**How to avoid:** The ±59 minute drift is acceptable for a digest — it doesn't affect correctness, only slightly shifts the window edge. Document it in blockers. If precision matters later, upgrade to Pro.
**Warning signs:** Clients complaining digest arrives at different times each Monday.

### Pitfall 5: Stripe Webhook Skipping Preference Check
**What goes wrong:** The webhook handler (`invoice.paid`, `invoice.payment_failed`) sends payment emails directly without checking `email_enabled`. After D-23 is implemented, if the check is missed for one event type, preference enforcement is incomplete.
**Why it happens:** The Stripe webhook has two independent email send calls (invoice.paid and invoice.payment_failed) that both need modification. They use `sendEmail()` directly — not via `notifyTaskEvent`.
**Why it happens (code):** In `route.ts`, the email send and notification insert are fire-and-forget with `.catch()` — preference check must be inserted before the `sendEmail()` call, not inside the `.catch()`.
**How to avoid:** Modify both `invoice.paid` and `invoice.payment_failed` cases. Write a test that mocks a disabled `email_enabled` preference and asserts `sendEmail` is NOT called.

### Pitfall 6: navKeys Array Mutation for Settings Nav Item
**What goes wrong:** Adding the Settings nav item as a new object in the `navKeys` array in `portal/layout.tsx` requires adding a new i18n key `nav.settings` — if the key is missing, next-intl throws at render.
**Why it happens:** `useTranslations('nav')` with `t(n.key)` throws `MISSING_MESSAGE` for unknown keys.
**How to avoid:** Add `settings` key to both `en.json` and `es.json` `nav` namespace before adding the nav item to the array. The `settings` namespace also needs to exist with toggle labels before the settings page is rendered.

### Pitfall 7: Digest Sends to Admin/Engineer Users Who Disabled digest_enabled
**What goes wrong:** Admins/engineers use the digest_enabled toggle to opt out, but the cron query fetches all admin/engineer users and sends regardless.
**Why it happens:** Digest query fetches all enrolled users, then sends per user — the preference check must happen per-user in the send loop, not before the user query.
**How to avoid:** For each user in the loop, query `notification_preferences` or filter by `digest_enabled !== false` in the initial users query using a LEFT JOIN or separate check.

---

## Code Examples

Verified patterns from existing codebase:

### Existing Mock Supabase Pattern (extend for preferences)
```typescript
// Source: platform/__tests__/notifications.test.ts — buildMockSupabase
// Add 'notification_preferences' to handlers table
const supabase = buildMockSupabase({
  tasks: [{ data: task, error: null }],
  clients: [{ data: client, error: null }],
  users: [{ data: users, error: null }],
  notification_preferences: [{ data: null, error: null }],  // null = opt-out model, send anyway
  notifications: [],
})
```

### Fire-and-Forget Pattern (established in codebase)
```typescript
// Source: platform/src/lib/notifications.ts — Step 8
try {
  await sendEmail({ to: user.email, subject, react: ... })
} catch (err) {
  console.error('[notify] send-email failed:', err)
}
```

### date-fns Subtracting Days
```typescript
// date-fns ^4.1.0 installed — named import
import { subDays } from 'date-fns'
const since = subDays(new Date(), 7).toISOString()
```

### Portal Sidebar navKeys Extension
```typescript
// Source: platform/src/app/[locale]/portal/layout.tsx — navKeys array
// Add after existing entries:
{ id: 'settings', key: 'settings', segment: '/settings' },
// Requires: en.json and es.json nav.settings key
```

### Portal Layout: Add Settings to navKeys
The existing layout uses `t(n.key)` where `n.key` maps to `nav` namespace. Add:
```json
// en.json nav namespace
"settings": "Settings"
// es.json nav namespace
"settings": "Configuración"
```

### Vercel Cron CRON_SECRET Validation (Official Pattern)
```typescript
// Source: https://vercel.com/docs/cron-jobs/manage-cron-jobs
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  // ...
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Notification preferences in users table JSONB | Separate `notification_preferences` table | This phase (D-01) | Cleaner RLS, independent evolution |
| Manual auth check in cron routes | CRON_SECRET / Bearer header pattern | Vercel's current recommendation | Simpler than custom token schemes |
| `Promise.all()` for batch sends | `Promise.allSettled()` | This phase (D-19) | One failure doesn't block all sends |

**Verified current:**
- `date-fns` v4 uses the same named import API (`subDays`, `addDays` from `date-fns`) — no breaking changes from v3 for these utilities.
- `@react-email/components` v1: `Html`, `Head`, `Body`, `Preview`, `Section`, `Text`, `Button`, `Hr` are all stable imports used in `TaskStatusEmail.tsx`.
- Vercel Cron: `vercel.json` `crons` array format is current and stable.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.1 with jsdom |
| Config file | `platform/vitest.config.mts` |
| Quick run command | `cd platform && npm run test:run -- __tests__/notifications.test.ts __tests__/digest.test.ts __tests__/preferences.test.ts` |
| Full suite command | `cd platform && npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOTIF-10 | Digest sends to users with digest_enabled !== false | unit | `npm run test:run -- __tests__/digest.test.ts` | Wave 0 |
| NOTIF-10 | Digest skips users with digest_enabled = false | unit | `npm run test:run -- __tests__/digest.test.ts` | Wave 0 |
| NOTIF-10 | Digest skips when zero task activity in window | unit | `npm run test:run -- __tests__/digest.test.ts` | Wave 0 |
| NOTIF-10 | Digest uses Promise.allSettled (one failure doesn't block others) | unit | `npm run test:run -- __tests__/digest.test.ts` | Wave 0 |
| NOTIF-10 | WeeklyDigestEmail renders en and es HTML | unit | `npm run test:run -- __tests__/digest.test.ts` | Wave 0 |
| NOTIF-11 | PATCH /api/preferences upserts row for authenticated user | unit | `npm run test:run -- __tests__/preferences.test.ts` | Wave 0 |
| NOTIF-11 | PATCH /api/preferences returns 401 without session | unit | `npm run test:run -- __tests__/preferences.test.ts` | Wave 0 |
| NOTIF-12 | notifyTaskEvent skips email when email_enabled = false | unit | `npm run test:run -- __tests__/notifications.test.ts` | ❌ add test case |
| NOTIF-12 | notifyTaskEvent skips in-app when in_app_enabled = false | unit | `npm run test:run -- __tests__/notifications.test.ts` | ❌ add test case |
| NOTIF-12 | notifyTaskEvent sends when no prefs row exists (opt-out model) | unit | `npm run test:run -- __tests__/notifications.test.ts` | ❌ add test case |
| NOTIF-12 | Stripe webhook skips email when email_enabled = false | unit | `npm run test:run -- __tests__/webhook-email.test.ts` | ❌ add test case |
| NOTIF-10 | Cron handler returns 401 without CRON_SECRET header | unit | `npm run test:run -- __tests__/digest.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd platform && npm run test:run -- __tests__/notifications.test.ts`
- **Per wave merge:** `cd platform && npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `platform/__tests__/digest.test.ts` — covers NOTIF-10 (cron handler, WeeklyDigestEmail, Promise.allSettled, skip on zero activity, CRON_SECRET gate)
- [ ] `platform/__tests__/preferences.test.ts` — covers NOTIF-11 (PATCH upsert, 401 without session, field whitelist)
- [ ] Add test cases to `platform/__tests__/notifications.test.ts` — covers NOTIF-12 (email_enabled=false skips email, in_app_enabled=false skips notification row, null prefs row → send)
- [ ] Add test case to `platform/__tests__/webhook-email.test.ts` — covers NOTIF-12 (Stripe webhook respects email_enabled)

---

## Open Questions

1. **Digest for admin/engineer users: what is their `client_id`?**
   - What we know: `users` table has `client_id UUID REFERENCES clients(id)` — internal users (admin/engineer/seller) likely have `client_id = null`
   - What's unclear: The digest query for admins should show ALL clients' activity (D-10) — but the cron needs to identify which users are admins vs clients. The existing `notifyTaskEvent` queries `.in('role', ['admin', 'engineer'])` for task_created recipients, so the same pattern applies.
   - Recommendation: Fetch users with `role IN ('admin', 'engineer', 'seller')` and run a cross-client tasks query. Fetch users with `role = 'client'` and run a per-`client_id` tasks query. Separate the two loops in the cron handler.

2. **Cron handler: should it use createServiceClient or createServerSupabase?**
   - What we know: The cron route has no user session cookie. It needs service role to query all users and their preferences.
   - What's unclear: Whether `createServiceClient()` is correct here (it is — the cron needs cross-user access).
   - Recommendation: Use `createServiceClient()` for the cron handler. This is consistent with the webhook handler pattern.

3. **Settings page data loading: server component or client component?**
   - What we know: Portal layout is `"use client"` and uses `useEffect` + Supabase browser client for auth. Other portal pages follow the same pattern.
   - What's unclear: Whether to use a server component with cookie-based auth for the settings page.
   - Recommendation: Follow the existing portal page pattern — `"use client"`, `useEffect` for initial prefs load, `useState` for local toggle state, PATCH API call on change. This avoids introducing a new pattern in this phase.

---

## Sources

### Primary (HIGH confidence)
- Vercel Cron Quickstart — https://vercel.com/docs/cron-jobs/quickstart
- Vercel Cron Management (CRON_SECRET pattern, Hobby limits) — https://vercel.com/docs/cron-jobs/manage-cron-jobs
- Vercel Cron Usage & Pricing (Hobby: once per day minimum, hourly precision) — https://vercel.com/docs/cron-jobs/usage-and-pricing
- `platform/__tests__/notifications.test.ts` — existing mock pattern (buildMockSupabase, vi.stubEnv)
- `platform/src/lib/notifications.ts` — notifyTaskEvent orchestrator
- `platform/src/lib/email.ts` — sendEmail wrapper
- `platform/src/lib/emails/TaskStatusEmail.tsx` — React Email template pattern
- `platform/supabase/migrations/002_notifications.sql` — RLS policy pattern
- `platform/src/app/[locale]/portal/layout.tsx` — navKeys array, sidebar nav pattern
- `platform/src/app/api/webhooks/stripe/route.ts` — send sites for D-23

### Secondary (MEDIUM confidence)
- Headless UI Switch — https://headlessui.com/react/switch (not used — project uses custom Tailwind components)
- WebSearch: Toggle switch optimistic update pattern — standard React state pattern, no additional source needed

### Tertiary (LOW confidence)
- None — all claims verified via official docs or codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed and in use; versions confirmed from package.json
- Architecture: HIGH — patterns derived directly from existing codebase; Vercel Cron confirmed via official docs
- Pitfalls: HIGH — most derived from code inspection of existing send paths; Vercel Hobby limits confirmed from official pricing docs
- Validation: HIGH — existing test infrastructure fully established; new test files identified as gaps

**Research date:** 2026-03-25
**Valid until:** 2026-06-25 (Vercel Cron API stable; React Email stable; all internal patterns stable)
