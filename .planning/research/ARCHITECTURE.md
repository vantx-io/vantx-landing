# Architecture Research

**Domain:** Next.js 14 App Router + Supabase platform — v1.1 feature integration
**Researched:** 2026-03-24
**Confidence:** HIGH (based on direct codebase analysis)

---

## Context: What Already Exists

This document is integration-focused. The v1.0 platform is already running. The four new features (testing, admin dashboard, notifications, file uploads) must slot into the existing architecture without introducing new layers or rewrites.

**Existing architecture in one sentence:** Every portal page is a `'use client'` component that runs its own `useEffect` against the Supabase browser client, scoped to the authenticated user's `client_id` via RLS.

**Existing constraints that drive integration decisions:**

- No server components inside `/portal` — all pages use browser-side Supabase fetch
- No global state store — React `useState` + `useEffect` only
- Auth is checked at two points: middleware (server) and layout `useEffect` (client)
- Three Supabase clients: `createClient()` (browser), `createServerSupabase()` (server components), `createServiceClient()` (API routes, bypasses RLS)
- RLS policies: `client` role sees only its own `client_id` rows; `admin`/`engineer` roles see all rows
- The `users.role` field (`admin` | `engineer` | `seller` | `client`) is the only access differentiator

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER                                      │
├───────────────────────┬─────────────────────────────────────────────┤
│   CLIENT PORTAL       │         ADMIN DASHBOARD (new)               │
│   /[locale]/portal/*  │         /[locale]/admin/*                   │
│   role: client        │         role: admin | engineer | seller      │
│   ──────────────────  │         ───────────────────────────────────  │
│   page.tsx (dash)     │         page.tsx (overview)                  │
│   tests/page.tsx      │         clients/page.tsx                     │
│   tasks/page.tsx      │         tasks/page.tsx (all clients)         │
│   billing/page.tsx    │         billing/page.tsx                     │
│   reports/page.tsx    │         users/page.tsx                       │
│   grafana/page.tsx    │                                              │
│   services/page.tsx   │   NotificationBell (new, shared component)   │
│   tutorials/page.tsx  │   mounted in BOTH layout sidebars            │
├───────────────────────┴─────────────────────────────────────────────┤
│                    PORTAL LAYOUT (existing)                          │
│         + ADMIN LAYOUT (new — cloned from portal layout)             │
│         Both layouts add <NotificationBell> in sidebar               │
├─────────────────────────────────────────────────────────────────────┤
│                     src/lib/ LAYER                                   │
│  supabase/client.ts   supabase/server.ts   stripe.ts                 │
│  slack.ts   grafana-cloud.ts   onboard.ts   k6-config.ts             │
│  types.ts (+ new: notifications table type)                          │
├───────────────────┬─────────────────────────────────────────────────┤
│   src/app/api/    │         NEW API ROUTES                          │
│   webhooks/stripe │   api/notifications/[id]/read/route.ts          │
│   checkout        │   api/upload/route.ts                           │
│   billing-portal  │                                                 │
├───────────────────┴─────────────────────────────────────────────────┤
│                         SUPABASE                                     │
│  Existing 13 tables + RLS                                            │
│  NEW: notifications table (+ RLS)                                    │
│  NEW: Supabase Storage bucket (task-attachments)                     │
│  Supabase Realtime: notifications channel (new subscription)         │
├─────────────────────────────────────────────────────────────────────┤
│                         EXTERNAL                                     │
│  Stripe webhooks   Grafana Cloud   Slack Bot   k6 cron               │
│  + Resend (new email provider)                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Inventory: New vs Modified

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| `src/app/[locale]/admin/` | **NEW** | App Router route group | Entire admin section |
| `src/app/[locale]/admin/layout.tsx` | **NEW** | Cloned from portal layout | Role-guard: admin/engineer/seller only |
| `src/app/[locale]/admin/page.tsx` | **NEW** | Overview metrics for all clients | |
| `src/app/[locale]/admin/clients/page.tsx` | **NEW** | Client list, status, edit | |
| `src/app/[locale]/admin/tasks/page.tsx` | **NEW** | Cross-client task view | |
| `src/app/[locale]/admin/billing/page.tsx` | **NEW** | Subscription/payment oversight | |
| `src/components/NotificationBell.tsx` | **NEW** | Shared component | Mounted in both layouts |
| `src/app/[locale]/portal/tasks/page.tsx` | **MODIFIED** | Add file upload to comment form | Existing page, add `<input type="file">` + storage upload |
| `src/app/[locale]/portal/layout.tsx` | **MODIFIED** | Add `<NotificationBell>` to sidebar | Existing layout |
| `src/app/api/notifications/[id]/read/route.ts` | **NEW** | Mark notification read | POST, updates Supabase row |
| `src/app/api/upload/route.ts` | **NEW** | Presigned URL or server-side upload | Validates auth + file type |
| `src/app/api/webhooks/stripe/route.ts` | **MODIFIED** | Trigger notification on payment events | Add notification insert calls |
| `src/lib/types.ts` | **MODIFIED** | Add `Notification` type | New table, new row type |
| `src/lib/email.ts` | **NEW** | Resend email helper | `sendTransactionalEmail(to, template, data)` |
| `supabase/migrations/002_notifications.sql` | **NEW** | `notifications` table + RLS | New migration file |
| `supabase/migrations/003_storage.sql` | **NEW** | Storage bucket policy | RLS for task-attachments bucket |
| Tests: `__tests__/` or `src/**/*.test.ts` | **NEW** | Vitest unit + integration tests | |
| `playwright/` | **NEW** | E2E test suite | |
| `vitest.config.ts` | **NEW** | Vitest configuration | |
| `playwright.config.ts` | **NEW** | Playwright configuration | |

---

## Feature Integration Details

### 1. Testing Infrastructure

The platform currently has zero automated tests. Adding Vitest + Playwright does not change application code — it wraps it.

**What needs testing:**

| Layer | Test Type | What to Cover |
|-------|-----------|---------------|
| `src/lib/` helpers | Unit (Vitest) | `stripe.ts` helpers, `onboard.ts` step logic, `slack.ts` channel name sanitization, `k6-config.ts` generation |
| API routes | Integration (Vitest + mock) | `checkout/route.ts`, `billing-portal/route.ts`, `webhooks/stripe/route.ts` — verify request/response shapes and Supabase write calls |
| Portal pages | E2E (Playwright) | Login flow, dashboard loads with data, tasks CRUD, comment submission, notification bell |
| Admin pages | E2E (Playwright) | Admin login, client list visible, cross-client task view |

**Structure:**

```
platform/
├── __tests__/
│   ├── lib/
│   │   ├── stripe.test.ts          # Unit: getOrCreateCustomer, getPriceId
│   │   ├── onboard.test.ts         # Unit: step orchestration, partial failure handling
│   │   ├── slack.test.ts           # Unit: sanitizeChannelName, skip behavior
│   │   └── email.test.ts           # Unit: template rendering
│   └── api/
│       ├── checkout.test.ts        # Integration: route handler with mocked Stripe + Supabase
│       ├── billing-portal.test.ts  # Integration: route handler
│       └── webhook.test.ts         # Integration: event dispatch, Supabase side effects
├── playwright/
│   ├── auth.spec.ts                # Login, logout, redirect unauthenticated
│   ├── portal-dashboard.spec.ts    # Dashboard loads, metrics display
│   ├── portal-tasks.spec.ts        # Task creation, comment, file attach
│   ├── admin-clients.spec.ts       # Admin sees all clients
│   └── notifications.spec.ts      # Bell badge, mark as read
├── vitest.config.ts
└── playwright.config.ts
```

**Key integration point:** Vitest tests for API routes use `msw` (Mock Service Worker) or manual mocks for Stripe and Supabase service client. Playwright tests run against `http://localhost:3000` with local Supabase.

**No changes to application code are required** to add the test layer. Vitest wraps the lib functions directly. Playwright drives the browser.

---

### 2. Admin Dashboard

**Core principle:** The admin section is a separate route group (`/admin`) with its own layout that enforces the role check. It reuses the same Supabase browser client but queries without `client_id` filter — this works because `admin`/`engineer` RLS policies return all rows.

**Admin layout role guard pattern:**

```typescript
// src/app/[locale]/admin/layout.tsx
useEffect(() => {
  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push(`/${locale}/login`); return }
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'engineer', 'seller'].includes(profile.role)) {
      router.push(`/${locale}/portal`)  // redirect clients who hit /admin
      return
    }
    setUser(profile)
  }
  load()
}, [])
```

**Middleware update required:** The existing `middleware.ts` only protects `/portal`. Extend the guard to also require authentication on `/admin` paths:

```typescript
// middleware.ts — add to protected paths check
if (pathWithoutLocale.startsWith('/portal') && !user) { ... }
if (pathWithoutLocale.startsWith('/admin') && !user) { ... }
```

Role enforcement (admin/engineer/seller only vs. any authenticated user) is handled in `layout.tsx`, not middleware. Middleware only checks that a session exists.

**Admin data queries:** Admin pages query the same tables as portal pages but omit the `client_id` filter. RLS policies already permit `admin`/`engineer` roles to see all rows (`"Admins see all clients"`, `"Admins see all tasks"`). No new Supabase policies are needed for read-only admin views.

**Write operations from admin:** Creating/updating clients, updating task status for any client, and inserting test results requires `admin`/`engineer` role. The existing RLS policies already permit this for those roles.

---

### 3. In-App Notifications

**New table required:**

```sql
-- supabase/migrations/002_notifications.sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  type TEXT NOT NULL CHECK (type IN (
    'payment_received', 'payment_failed', 'task_created',
    'task_updated', 'task_comment', 'subscription_cancelled',
    'subscription_activated', 'report_published'
  )),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,          -- e.g., '/portal/tasks' or '/portal/billing'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users see only their own notifications
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications read" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Service role inserts notifications (webhook handler, admin actions)
-- No policy needed for INSERT — service role bypasses RLS
```

**`NotificationBell` component (shared):**

The bell component subscribes to Supabase Realtime on mount to get live updates. This is the only Realtime subscription in the platform.

```
NotificationBell
├── On mount: fetch unread notifications count + recent list
├── Realtime subscription: supabase.channel('notifications')
│     .on('postgres_changes', { table: 'notifications', filter: `user_id=eq.${userId}` })
│     .subscribe()
├── Bell icon with badge count (red dot if count > 0)
├── Dropdown: list of recent notifications with title, body, timestamp
└── Mark as read: POST /api/notifications/[id]/read
```

**Where notifications are inserted:** In the Stripe webhook handler (`api/webhooks/stripe/route.ts`) — after each event is processed, insert a notification row for the relevant user. Use `createServiceClient()` since webhook runs server-side.

```typescript
// Inside webhook handler — after processing payment_paid event:
const { data: clientUsers } = await supabase
  .from('users')
  .select('id')
  .eq('client_id', sub.client_id)

for (const u of clientUsers || []) {
  await supabase.from('notifications').insert({
    user_id: u.id,
    client_id: sub.client_id,
    type: 'payment_received',
    title: 'Payment received',
    body: `$${amount} — ${description}`,
    link: '/portal/billing',
  })
}
```

**Admin-side notifications:** When an admin creates a task or publishes a report for a client, insert notifications for that client's users. This logic goes in the admin page's mutation handler (client-side) but uses a server API route to insert via service role (since browser client with anon key cannot insert for other users).

New route: `POST /api/notifications` — accepts `{ user_id, type, title, body, link, client_id }`, uses `createServiceClient()` to insert.

**Mark as read:** `POST /api/notifications/[id]/read` — uses `createServerSupabase()` (cookie-based session), updates `is_read = true` where `id = $id AND user_id = auth.uid()`. RLS enforces ownership.

---

### 4. Email Notifications (Transactional)

**Library:** Resend. Single `src/lib/email.ts` module with a typed `sendTransactionalEmail` function.

**Where email is sent:** Same places notifications are inserted — Stripe webhook handler and admin task/report creation. Email and in-app notification are sent in parallel (fire-and-forget, neither blocks the primary operation).

**Template strategy:** Inline HTML strings in `email.ts` keyed by `NotificationType`. No external template engine needed at this scale.

```typescript
// src/lib/email.ts
export async function sendTransactionalEmail(params: {
  to: string
  type: NotificationType
  data: Record<string, string | number>
}): Promise<void>
```

**Avoiding double-send:** Email is only sent from server-side contexts (API routes, webhook handlers). Never from client components. The `email.ts` module checks for `RESEND_API_KEY` in the environment; missing key causes silent skip (same pattern as `slack.ts` and `grafana-cloud.ts`).

**Event map:**

| Event | In-App | Email |
|-------|--------|-------|
| `invoice.paid` (Stripe webhook) | Yes — user | Yes — client primary contact |
| `invoice.payment_failed` (Stripe webhook) | Yes — user | Yes — client primary contact |
| `customer.subscription.deleted` (Stripe webhook) | Yes — user | Yes — client primary contact |
| Task created (admin UI) | Yes — client users | Optional |
| Task status change (admin UI) | Yes — client users | No |
| Report published (admin UI) | Yes — client users | Yes — client primary contact |

---

### 5. File Uploads (Task Attachments)

**Current state:** `task_comments.attachments` is `TEXT[]` in the schema. The field already exists and is `null` by default. The tasks page renders comments but does not render attachment URLs or provide upload UI.

**Storage:** Supabase Storage bucket `task-attachments`. No new infrastructure — Supabase Storage is part of the existing Supabase project.

**Bucket policy (new migration):**

```sql
-- supabase/migrations/003_storage.sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false);

-- Allow authenticated users to upload to their client's folder
CREATE POLICY "Users upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND auth.uid() IS NOT NULL
  );

-- Allow users to read attachments on their tasks
CREATE POLICY "Users read own task attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-attachments'
    AND auth.uid() IS NOT NULL
  );
```

**Upload flow in `tasks/page.tsx`:**

The comment form gains a file input. On "Send" with a file selected, the client uploads directly to Supabase Storage using the browser Supabase client, then stores the resulting public URL (or signed URL) in the `attachments` array on the comment insert.

```typescript
// In tasks/page.tsx addComment function:
async function addComment(taskId: string, file?: File) {
  let attachmentUrl: string | null = null
  if (file) {
    const path = `${clientId}/${taskId}/${Date.now()}-${file.name}`
    const { data } = await supabase.storage
      .from('task-attachments')
      .upload(path, file)
    if (data) {
      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(data.path)
      attachmentUrl = publicUrl
    }
  }
  await supabase.from('task_comments').insert({
    task_id: taskId,
    user_id: userId,
    content: newComment,
    attachments: attachmentUrl ? [attachmentUrl] : null,
  })
}
```

**No schema migration needed** — `attachments TEXT[]` already exists on `task_comments`. Only the UI and storage bucket are new.

**Rendering attachments:** In the comment list, check `c.attachments?.length > 0` and render download links. For images, show inline preview. For PDFs/other, show a download icon with filename.

---

## Data Flow: New Event Paths

### Notification Flow (Stripe Event)

```
Stripe fires invoice.paid
    ↓
POST /api/webhooks/stripe
    ↓
Validate Stripe signature
    ↓
Resolve client_id from stripe_customer_id
    ↓
Insert payments row (existing)
    ↓  (parallel, fire-and-forget)
    ├── sendTransactionalEmail({ to: client.email, type: 'payment_received', ... })
    └── INSERT notifications row for each user in client
            ↓
            Supabase Realtime broadcasts to subscribed NotificationBell
            ↓
            NotificationBell badge count increments in browser
```

### File Upload Flow

```
User types comment + selects file in tasks/page.tsx
    ↓
supabase.storage.from('task-attachments').upload(path, file)
    ↓
Get public/signed URL from Supabase Storage
    ↓
supabase.from('task_comments').insert({ ..., attachments: [url] })
    ↓
Reload comments list — attachment URL renders as link/preview
```

### Admin Task Creation → Notification Flow

```
Admin creates task in /admin/tasks/page.tsx
    ↓
supabase.from('tasks').insert({ ... })
    ↓
POST /api/notifications (new route, service role)
    body: { client_id, type: 'task_created', title, link }
    ↓
API route: fetch users where client_id matches
    ↓
Insert notification row for each client user
    ↓
Supabase Realtime broadcasts to affected users
```

---

## Recommended Project Structure (Delta)

Only new folders/files shown. Existing structure is unchanged.

```
platform/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── admin/              # NEW — admin route group
│   │   │   │   ├── layout.tsx      # NEW — role-gated sidebar layout
│   │   │   │   ├── page.tsx        # NEW — admin overview
│   │   │   │   ├── clients/
│   │   │   │   │   └── page.tsx    # NEW — client management
│   │   │   │   ├── tasks/
│   │   │   │   │   └── page.tsx    # NEW — cross-client tasks
│   │   │   │   └── billing/
│   │   │   │       └── page.tsx    # NEW — subscription overview
│   │   │   └── portal/
│   │   │       ├── layout.tsx      # MODIFIED — add NotificationBell
│   │   │       └── tasks/
│   │   │           └── page.tsx    # MODIFIED — add file upload
│   │   └── api/
│   │       ├── notifications/
│   │       │   ├── route.ts        # NEW — POST create notification
│   │       │   └── [id]/
│   │       │       └── read/
│   │       │           └── route.ts # NEW — POST mark read
│   │       ├── upload/
│   │       │   └── route.ts        # NEW — optional: presigned URL generator
│   │       └── webhooks/
│   │           └── stripe/
│   │               └── route.ts    # MODIFIED — add notification + email calls
│   ├── components/
│   │   └── NotificationBell.tsx    # NEW — shared bell icon + dropdown
│   └── lib/
│       ├── email.ts                # NEW — Resend transactional email helper
│       └── types.ts                # MODIFIED — add Notification type
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql          # UNCHANGED
│       ├── 002_notifications.sql   # NEW
│       └── 003_storage.sql         # NEW
├── __tests__/
│   ├── lib/
│   │   ├── stripe.test.ts          # NEW
│   │   ├── onboard.test.ts         # NEW
│   │   └── email.test.ts           # NEW
│   └── api/
│       ├── checkout.test.ts        # NEW
│       └── webhook.test.ts         # NEW
├── playwright/
│   ├── auth.spec.ts                # NEW
│   ├── portal-tasks.spec.ts        # NEW
│   ├── admin-clients.spec.ts       # NEW
│   └── notifications.spec.ts       # NEW
├── vitest.config.ts                # NEW
└── playwright.config.ts            # NEW
```

---

## Architectural Patterns

### Pattern 1: Role-Based Route Groups

**What:** Separate App Router route groups for client-facing (`/portal`) and internal (`/admin`) with independent layouts that check `users.role` on mount.

**When to use:** When two user classes need fundamentally different navigation and data scope but share the same backend tables.

**Trade-offs:** Duplicates some layout code (sidebar chrome). Acceptable at this scale — avoid premature abstraction. The two sidebars will have different nav items, so a single shared layout would need complex conditional logic anyway.

**Key constraint:** Middleware only checks authentication (session exists). Role enforcement lives in `layout.tsx` useEffect. This means a client-role user who navigates to `/admin` gets a brief flash before being redirected. Acceptable for an internal tool — add route-level role check to middleware later if needed.

### Pattern 2: Server-Side Notification Insert via Service Route

**What:** Client-side admin actions that need to notify other users POST to a server API route (`/api/notifications`) which uses `createServiceClient()` to bypass RLS and insert for any `user_id`.

**When to use:** Any time a client component needs to write a row owned by a different user (notifications for client users, inserted by admin actions).

**Trade-offs:** Adds a network round-trip vs. direct client insert. Necessary because the browser client respects RLS — it cannot insert a notification row with `user_id` belonging to another user.

### Pattern 3: Supabase Realtime Subscription in Shared Component

**What:** `NotificationBell` opens a single Supabase Realtime channel filtered to `user_id = eq.{current_user_id}` and updates local badge count in real time.

**When to use:** When users need live updates without polling. Supabase Realtime is already available in the existing Supabase project — no new infrastructure.

**Trade-offs:** Each browser tab opens one WebSocket connection. Fine for a B2B platform with small concurrent user counts. Would need connection pooling if this were a consumer product with thousands of simultaneous users.

**Pattern:**
```typescript
// In NotificationBell.tsx
useEffect(() => {
  if (!userId) return
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        setUnreadCount(prev => prev + 1)
        setNotifications(prev => [payload.new as Notification, ...prev])
      }
    )
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [userId])
```

### Pattern 4: Direct Client Upload to Supabase Storage

**What:** The tasks page uses the browser Supabase client to upload directly to Storage without routing through an API route. The URL is stored in `task_comments.attachments`.

**When to use:** Small files (< 50MB), no server-side processing needed, RLS on storage bucket is sufficient.

**Trade-offs:** File type and size validation must happen client-side (add `accept` and `maxSize` checks before upload). For production, add a presigned URL route that validates server-side. The direct upload pattern is fine for MVP; upgrade to server-validated uploads if security requirements tighten.

---

## Build Order (Dependency-Driven)

Dependencies flow from bottom to top. Work from the stable foundation upward.

### Phase 1: Database + Testing Foundation (no UI dependencies)

1. **Migration 002 (notifications table)** — unblocks all notification work
2. **Migration 003 (storage bucket)** — unblocks file upload work
3. **Update `src/lib/types.ts`** — add `Notification` type; unblocks TypeScript in all notification components
4. **Vitest config + first tests** — `stripe.test.ts`, `onboard.test.ts` test existing lib functions; no new code needed, establishes test patterns
5. **`src/lib/email.ts`** — new helper, depends only on `RESEND_API_KEY` env var; fully testable in isolation

### Phase 2: Server-Side Integration (API routes + webhook updates)

6. **`/api/notifications/route.ts`** — POST create; depends on types.ts Notification type and `createServiceClient()`
7. **`/api/notifications/[id]/read/route.ts`** — POST mark read; depends on same
8. **Stripe webhook update** — add notification inserts and `sendTransactionalEmail` calls; depends on email.ts and notifications API; modify existing `webhooks/stripe/route.ts`
9. **Webhook integration tests** — `__tests__/api/webhook.test.ts`; depends on updated webhook handler

### Phase 3: Shared Component

10. **`NotificationBell.tsx`** — depends on notifications table (phase 1), read API (phase 2), and Supabase Realtime; add to portal layout after component is stable

### Phase 4: Admin Dashboard

11. **`/admin/layout.tsx`** — depends on `users.role` check pattern (established); add NotificationBell (phase 3)
12. **`/admin/page.tsx`** — depends on admin layout; queries existing tables with no `client_id` filter
13. **`/admin/clients/page.tsx`** — depends on admin layout
14. **`/admin/tasks/page.tsx`** — depends on admin layout; add notification dispatch via `/api/notifications`
15. **Admin Playwright tests** — `playwright/admin-clients.spec.ts`

### Phase 5: File Upload

16. **Upload UI in `tasks/page.tsx`** — depends on storage bucket (phase 1); modify existing page component
17. **Attachment rendering** — depends on upload UI; display `attachments[]` URLs in comment list
18. **Playwright test** — `playwright/portal-tasks.spec.ts` covers upload flow

---

## Integration Points: New vs Existing

### External Services

| Service | Existing Integration | New Integration |
|---------|---------------------|-----------------|
| Stripe | Webhook, checkout, billing portal | Webhook handler triggers notifications + email after events |
| Supabase | Auth, all DB tables, browser/server/service clients | + Realtime channel for notifications, + Storage bucket |
| Slack | Bot token, channel provisioning, welcome message | No change |
| Grafana Cloud | Stack provisioning, Faro config | No change |
| Resend | Not present | New: transactional email (payment, report, task events) |

### Internal Boundaries

| Boundary | How They Communicate | Constraint |
|----------|---------------------|------------|
| Admin page → client notifications | `POST /api/notifications` (server route) | Cannot insert via browser client due to RLS; must go through service role route |
| Webhook → notifications | Direct Supabase insert via `createServiceClient()` — already uses service role | Extend existing pattern; no new auth mechanism |
| Webhook → email | `sendTransactionalEmail()` called fire-and-forget | Email failure must not block webhook response; wrap in try/catch |
| `NotificationBell` → Supabase Realtime | `supabase.channel()` subscription in useEffect | Cleanup on unmount required to avoid connection leak |
| Tasks page → Storage | `supabase.storage.from('task-attachments').upload()` | Client uploads directly; RLS on storage bucket enforces auth |
| Admin layout ↔ Portal layout | No shared code — both are independent layouts | Both mount `NotificationBell`; component is self-contained |

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (< 50 clients, ~10 internal users) | All features work as described. Realtime subscription per user is trivial. Storage uploads are direct. |
| 200 clients, 50 internal users | Notification fan-out on Stripe events (insert N rows for N users) stays fast. Storage moves to signed URLs for security. Consider pagination in admin client list. |
| 1,000+ clients | Notification inserts in webhook become a bottleneck — move to a background job or queue (Supabase Edge Functions with database triggers). Admin dashboard needs server-side rendering with pagination. |

**First bottleneck:** Notification fan-out. Current pattern inserts one notification row per user when Stripe fires an event. At low client counts this is a for-loop over 1–5 users. If a client has many users, this blocks the webhook response. Mitigation: move notification insert to an async background task (or use a Supabase database trigger that fires on payment row insert).

**Second bottleneck:** Admin dashboard rendering. At 50+ clients, loading all clients in a single `useEffect` query without pagination will be slow. Add `.range(0, 49)` pagination early.

---

## Anti-Patterns

### Anti-Pattern 1: Inserting Notifications from Client Components

**What people do:** Add `supabase.from('notifications').insert(...)` directly in an admin page's `onClick` handler using the browser Supabase client.

**Why it's wrong:** The browser client uses the anon key and respects RLS. The RLS policy `"Users see own notifications"` restricts users to their own `user_id`. An admin trying to insert a notification for a client user would violate RLS and the insert would silently fail (or error).

**Do this instead:** Route all cross-user notification inserts through `POST /api/notifications`, which uses `createServiceClient()` (service role key) to bypass RLS.

### Anti-Pattern 2: Adding Realtime Subscriptions in Page Components

**What people do:** Open a Supabase Realtime channel in each page that needs live data (tasks, dashboard, etc.).

**Why it's wrong:** Each subscription opens a WebSocket connection. Multiple subscriptions across multiple pages in the same tab exhaust the Supabase connection limit quickly. Pages mount/unmount as the user navigates, leaving orphaned channels if cleanup is not meticulous.

**Do this instead:** Keep the Realtime subscription in `NotificationBell.tsx`, which is mounted once in the layout and persists across page navigation. For other live data needs, use polling (`setInterval` + re-fetch) rather than Realtime — the portal is an internal tool where 30-second polling is acceptable for tasks/metrics.

### Anti-Pattern 3: Putting Role Checks Only in Middleware

**What people do:** Add `admin`-only routes to the middleware matcher and check the role there.

**Why it's wrong:** Middleware in Next.js 14 with `@supabase/ssr` can read the auth session, but reading the `users.role` from the database in middleware would require an extra database call on every request. The existing middleware only checks session existence (not role). Adding a DB query to middleware adds latency to every request.

**Do this instead:** Middleware checks authentication only (session exists → pass). The admin `layout.tsx` `useEffect` checks the role and redirects clients. This is consistent with how the portal layout already works.

### Anti-Pattern 4: Storing File Metadata Only in `attachments TEXT[]`

**What people do:** Store just the URL in `task_comments.attachments` and rely on the URL to imply file type, name, and size.

**Why it's wrong:** URLs from Supabase Storage can be opaque. Displaying a filename requires parsing the URL path. File type for preview logic requires the filename extension. File size cannot be recovered from the URL.

**Do this instead:** Store structured JSON in the array, or add a separate `task_attachments` table with `comment_id`, `url`, `filename`, `file_type`, `file_size_bytes`. For MVP, at minimum store the filename alongside the URL as a structured object serialized in the array: `'{"url":"...","name":"report.pdf","size":104320}'`.

---

## Sources

- Direct codebase analysis: `platform/src/` (2026-03-24)
- Supabase Realtime documentation (confirmed in training data; channel filter syntax verified against `@supabase/supabase-js` v2 API)
- Supabase Storage RLS policy pattern: `storage.objects` table, `bucket_id` check
- Next.js 14 App Router route groups: parenthetical folder naming not needed here since admin and portal are distinct URL paths, not co-located groups
- `@supabase/ssr` middleware pattern: existing `middleware.ts` in this codebase

---

*Architecture research for: Vantix Platform v1.1 — testing, admin dashboard, notifications, file uploads*
*Researched: 2026-03-24*
