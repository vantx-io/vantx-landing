# Phase 7: Notification UI - Research

**Researched:** 2026-03-24
**Domain:** React/Next.js UI component + Supabase Realtime subscriptions
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Numeric badge capped at "9+" — informative without clutter for a B2B SaaS portal
- **D-02:** Dropdown shows 5 items before scroll, max 400px height, right-aligned under bell icon
- **D-03:** Each notification item: type icon (payment/task) + title + relative timestamp ("2m ago") + body truncated to 1 line
- **D-04:** Empty state: subtle bell icon + "No notifications" text — clean, no illustrations
- **D-05:** Click notification → navigate to `action_link` AND mark read in one action (single click does both)
- **D-06:** "Mark all as read" text button in dropdown header area
- **D-07:** Click-outside or Escape closes dropdown
- **D-08:** Subtle badge count increment only — no toast, no sound (B2B professional tool)
- **D-09:** Brief CSS pulse animation on badge when new notification arrives via Realtime
- **D-10:** Playwright E2E with two test users to prove cross-tenant isolation (strongest proof for SC-4)
- **D-11:** Test inserts notification for User A, then verifies User B's query/subscription does NOT receive it

### Claude's Discretion
- Component file structure (single file vs split into sub-components)
- CSS approach (Tailwind classes matching existing portal patterns)
- Supabase Realtime channel configuration details
- Type icon selection per notification type
- Exact animation timing for badge pulse
- How to handle stale Realtime connections (reconnect strategy)

### Deferred Ideas (OUT OF SCOPE)
- Notification preferences UI (NOTIF-11, v2)
- Weekly email digest (NOTIF-10, v2)
- Notification grouping/stacking by type
- "View all notifications" full page
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NOTIF-02 | In-app notification bell component with unread count badge | Bell component pattern, Supabase initial query for unread count, badge cap logic |
| NOTIF-03 | Notification dropdown with list, mark-as-read, mark-all-read | Dropdown open/close pattern, UPDATE RLS policy confirmed in 002_notifications.sql, click-outside hook |
| NOTIF-04 | Supabase Realtime subscription filtered by user_id (cross-tenant safe) | Realtime channel filter `eq('user_id', uid)` pattern confirmed; REPLICA IDENTITY blocker documented |
| NOTIF-09 | NotificationBell mounted in both portal and admin layouts | Component must accept no required props — layout mounts it without passing user context |
</phase_requirements>

---

## Summary

Phase 7 builds the `NotificationBell` React component and mounts it in the portal layout. The data layer (table, RLS policies, `createNotification()`) is already complete from Phases 5–6. This phase is purely frontend: a "use client" component that (1) fetches initial unread notifications on mount, (2) subscribes to Supabase Realtime for live updates filtered by `user_id`, (3) renders a badge + dropdown UI, and (4) writes mark-as-read updates back via the browser Supabase client.

The cross-tenant security is enforced at the database level via RLS (`user_id = auth.uid()`). The Realtime subscription filter provides defense-in-depth — the channel filter `eq('user_id', uid)` ensures the client never even receives other users' change events at the websocket layer. The Playwright E2E cross-tenant test (D-10/D-11) is the required verification artifact.

One pre-condition blocker exists: **REPLICA IDENTITY FULL must be enabled in the Supabase Dashboard** on the `notifications` table before Realtime INSERT events will carry row data. This is a manual dashboard step, not a code task.

**Primary recommendation:** Implement `NotificationBell` as a single `"use client"` file at `src/components/NotificationBell.tsx` following the same `useEffect + useState + createClient()` pattern used in `portal/layout.tsx` and `portal/tasks/page.tsx`. No new libraries are needed.

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.47.0 | Realtime channel subscription + UPDATE queries | Already project dependency; `createClient()` from `@/lib/supabase/client` is established pattern |
| `@supabase/ssr` | ^0.9.0 | Browser client factory | Already used in `client.ts` via `createBrowserClient` |
| `lucide-react` | ^0.460.0 | Bell icon, type icons (Bell, CreditCard, CheckSquare) | Already installed; used throughout portal |
| `next-intl` | ^4.8.3 | i18n strings for "No notifications", "Mark all as read" | Already used in every portal page |
| `tailwindcss` | ^3.4.16 | All styling | Established pattern — no CSS modules or styled-components |

### No New Dependencies Required
All needed libraries are already in `package.json`. This phase installs nothing new.

---

## Architecture Patterns

### Recommended Project Structure
```
platform/src/
├── components/
│   └── NotificationBell.tsx    # New — the only new file for the component
├── app/[locale]/portal/
│   └── layout.tsx              # Modified — mount <NotificationBell /> in header
└── e2e/
    └── notifications.spec.ts   # New — cross-tenant Playwright test
```

The `src/components/` directory does not yet exist. Wave 0 creates it.

### Pattern 1: Client Component with Supabase Realtime
**What:** `"use client"` component that fetches initial data in `useEffect`, subscribes to Realtime channel, and cleans up on unmount.
**When to use:** Any component needing live Supabase data in the browser.

```typescript
// Established pattern — mirrors portal/tasks/page.tsx + portal/layout.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let userId: string;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      // Initial fetch — most recent 20, unread first
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setNotifications(data as Notification[]);

      // Realtime subscription — INSERT only, filtered by user_id
      const channel = supabase
        .channel("notifications:" + userId)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          },
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }

    const cleanup = init();
    return () => { cleanup.then((fn) => fn?.()); };
  }, []);

  const unread = notifications.filter((n) => !n.read);
  // ...
}
```

### Pattern 2: Click-Outside to Close Dropdown
**What:** `useEffect` + `useRef` listening to `mousedown` on `document` to close dropdown when clicking outside.
**When to use:** Any dropdown/popover component without a headless UI library.

```typescript
// No external library needed — native DOM event
const bellRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }
  if (open) document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [open]);

// Escape key handler
useEffect(() => {
  function handleEsc(e: KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
  }
  document.addEventListener("keydown", handleEsc);
  return () => document.removeEventListener("keydown", handleEsc);
}, []);
```

### Pattern 3: Mark-as-Read RLS-Safe UPDATE
**What:** Browser client UPDATE limited by RLS — only the authenticated user's own rows can be updated.
**When to use:** Any `notifications` UPDATE from the portal.

```typescript
// Single notification mark-read
async function markRead(id: string) {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", userId); // belt-and-suspenders, RLS enforces this

  setNotifications((prev) =>
    prev.map((n) => (n.id === id ? { ...n, read: true } : n))
  );
}

// Mark all read
async function markAllRead() {
  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
  if (!unreadIds.length) return;
  await supabase
    .from("notifications")
    .update({ read: true })
    .in("id", unreadIds);
  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
}
```

### Pattern 4: Badge Cap at "9+"
```typescript
const badgeLabel = unread.length > 9 ? "9+" : String(unread.length);
```

### Pattern 5: Relative Timestamp
`date-fns` is already installed (`^4.1.0`). Use `formatDistanceToNow`.

```typescript
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// In render:
const locale = useLocale(); // "es" | "en"
formatDistanceToNow(new Date(n.created_at), {
  addSuffix: true,
  locale: locale === "es" ? es : undefined,
});
// → "2 minutes ago" / "hace 2 minutos"
```

### Pattern 6: CSS Pulse Animation on New Notification
Tailwind `animate-ping` is the standard choice — it's built-in and matches the B2B subtle aesthetic.

```typescript
// Conditional class on badge — animate for 2 seconds then remove
const [pulse, setPulse] = useState(false);

// In Realtime handler:
setPulse(true);
setTimeout(() => setPulse(false), 2000);

// In JSX:
<span className={`... ${pulse ? "animate-ping" : ""}`}>
  {badgeLabel}
</span>
```

### Pattern 7: Type Icons from lucide-react
| NotificationType | Icon |
|---|---|
| `payment_success` | `CreditCard` (green) |
| `payment_failed` | `CreditCard` (red) |
| `task_created` | `Plus` |
| `task_updated` | `CheckSquare` |

### Portal Layout Mount Point
The layout has a sidebar + `<main>` structure. The bell goes in the **sidebar footer** or a **top bar**. Currently the layout has no top bar — the bell is best placed in the **sidebar header area** (below the logo and client name) since there is no horizontal navbar. This is Claude's discretion to decide exact placement.

```tsx
// In portal/layout.tsx — import and mount
import { NotificationBell } from "@/components/NotificationBell";

// Inside the sidebar header <div>:
<div className="flex items-center justify-between mt-2">
  <NotificationBell />
</div>
```

### Anti-Patterns to Avoid
- **Global state for notifications:** No Redux/Zustand needed — `useState` in the component is sufficient; the bell is only mounted once per layout.
- **Polling instead of Realtime:** Do not use `setInterval` + re-fetch. Use the Realtime subscription.
- **Forgetting `supabase.removeChannel(channel)` in cleanup:** Causes multiple subscriptions on React strict-mode double-mount and leaked websocket connections.
- **Not filtering the Realtime subscription by `user_id`:** Without `filter: "user_id=eq.${userId}"`, the channel receives ALL notifications table changes (only RLS blocks reads, but the wire traffic arrives first). Always filter at subscription level.
- **Calling `createClient()` inside `useEffect`:** Call it at component scope (as `portal/layout.tsx` does) to avoid creating a new client on every effect run.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative timestamps | Custom time formatter | `date-fns` `formatDistanceToNow` | Already installed; handles i18n locale, edge cases (DST, locale plurals) |
| Bell/icon SVGs | Custom SVG | `lucide-react` `Bell`, `CreditCard`, `CheckSquare` | Already installed; consistent stroke weight with portal |
| Dropdown positioning | Custom CSS absolute positioning math | Tailwind `right-0 top-full` | Sufficient for right-aligned bell in sidebar |
| Cross-tenant RLS | Custom WHERE clauses | Supabase RLS (`user_id = auth.uid()`) | Already implemented in `002_notifications.sql` — trust the DB |

---

## Common Pitfalls

### Pitfall 1: REPLICA IDENTITY not set — Realtime events arrive empty
**What goes wrong:** Supabase Realtime INSERT events on `notifications` send `payload.new = {}` (empty object) instead of the actual row data.
**Why it happens:** PostgreSQL default REPLICA IDENTITY is `DEFAULT` (primary key only). Supabase Realtime needs `FULL` to include all columns in the WAL event.
**How to avoid:** Enable in Supabase Dashboard → Database → Tables → `notifications` → "Realtime" toggle ON, which sets `REPLICA IDENTITY FULL`. This is documented in STATE.md as a known blocker.
**Warning signs:** `payload.new` is `{}` or only contains `{id: "..."}` — body/title/type are missing.

### Pitfall 2: Double subscription on React Strict Mode
**What goes wrong:** In dev (React Strict Mode), `useEffect` runs twice. If cleanup doesn't call `supabase.removeChannel()`, you get two active subscriptions and duplicate notifications appear.
**Why it happens:** React 18 Strict Mode intentionally double-invokes effects in development.
**How to avoid:** Always return a cleanup function from `useEffect` that calls `supabase.removeChannel(channel)`.
**Warning signs:** Notifications appear duplicated in the dropdown during local development.

### Pitfall 3: `useLocale()` only works inside next-intl provider
**What goes wrong:** `useLocale()` from next-intl throws if called outside the `NextIntlClientProvider` tree.
**Why it happens:** The component needs to be mounted inside the layout which already wraps the locale provider.
**How to avoid:** `NotificationBell` is mounted inside `portal/layout.tsx` which is already under next-intl provider — no issue. But if mounting in a non-next-intl tree (e.g., test), mock the hook.
**Warning signs:** Runtime error "There is no next-intl context" during tests.

### Pitfall 4: RLS UPDATE policy check
**What goes wrong:** `supabase.from("notifications").update(...)` silently does nothing if the WHERE clause doesn't match RLS.
**Why it happens:** `002_notifications.sql` has `UPDATE USING (user_id = auth.uid())` — correct. But the browser client must be authenticated (session cookie present) or the update is rejected.
**How to avoid:** Always use `createClient()` (browser client with cookie-based auth), not a service role key, for portal UI operations.
**Warning signs:** `update()` returns no error but `read` column stays `false`.

### Pitfall 5: Playwright cross-tenant test needs two separate auth states
**What goes wrong:** D-10 requires testing with two different users. Playwright's shared `storageState` is for a single user.
**Why it happens:** The existing `auth.setup.ts` stores one user session. A second user needs a separate setup fixture.
**How to avoid:** Create a second `auth.setup-b.ts` that authenticates as User B and writes to `playwright/.auth/user-b.json`. The cross-tenant spec uses `test.use({ storageState: '...' })` per test to switch users.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 (E2E for cross-tenant test) + Vitest 4.1.1 (unit) |
| Config file | `platform/playwright.config.ts` (exists) |
| Quick run command | `cd platform && npx playwright test e2e/notifications.spec.ts` |
| Full suite command | `cd platform && npm run e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOTIF-02 | Bell renders with correct unread count badge | Playwright (visual) | `npx playwright test e2e/notifications.spec.ts --grep "badge"` | Wave 0 |
| NOTIF-03 | Dropdown opens, mark-as-read decrements badge, mark-all clears badge | Playwright (interaction) | `npx playwright test e2e/notifications.spec.ts --grep "dropdown"` | Wave 0 |
| NOTIF-04 | Realtime: new row insert updates badge live | Playwright (realtime) | `npx playwright test e2e/notifications.spec.ts --grep "realtime"` | Wave 0 |
| NOTIF-09 | NotificationBell mounts in portal layout without errors | Playwright (smoke) | `npx playwright test e2e/notifications.spec.ts --grep "mounts"` | Wave 0 |
| NOTIF-04 (cross-tenant) | User B cannot see User A notifications | Playwright E2E (security) | `npx playwright test e2e/notifications.spec.ts --grep "cross-tenant"` | Wave 0 |

Note: The cross-tenant test (D-10/D-11) requires a second test user credential in `E2E_EMAIL_B` / `E2E_PASSWORD_B` env vars and a second auth setup file.

### Sampling Rate
- **Per task commit:** `npx playwright test e2e/notifications.spec.ts` (smoke on local dev server)
- **Per wave merge:** `cd platform && npm run e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `e2e/notifications.spec.ts` — covers NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-09 and cross-tenant
- [ ] `e2e/auth.setup-b.ts` — second test user auth state for cross-tenant test
- [ ] `platform/src/components/` directory — does not exist yet
- [ ] `playwright/.auth/user-b.json` — written by auth.setup-b.ts at test time (not committed)

---

## Code Examples

### Full Realtime Subscription Setup (verified pattern — Supabase docs)
```typescript
// Source: @supabase/supabase-js Realtime docs pattern
const channel = supabase
  .channel("notifications:" + userId)  // unique channel name per user
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${userId}`,  // client-side filter — defense in depth
    },
    (payload) => {
      setNotifications((prev) => [payload.new as Notification, ...prev]);
      setPulse(true);
      setTimeout(() => setPulse(false), 2000);
    },
  )
  .subscribe();

// Cleanup in useEffect return:
return () => { supabase.removeChannel(channel); };
```

### Mounting in Portal Layout
```tsx
// platform/src/app/[locale]/portal/layout.tsx (modified)
import { NotificationBell } from "@/components/NotificationBell";

// Inside sidebar header div, after client name badges:
<div className="flex items-center justify-between mt-2">
  <NotificationBell />
</div>
```

### Second Auth Setup for Cross-Tenant Playwright Test
```typescript
// e2e/auth.setup-b.ts
import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../playwright/.auth/user-b.json");

setup("authenticate user-b", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL_B || "");
  await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD_B || "");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/portal**");
  await page.context().storageState({ path: authFile });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling with `setInterval` | Supabase Realtime `postgres_changes` | Supabase Realtime GA (2023) | Push-based, no wasted requests |
| External headless UI (Headless UI, Radix) | Native `useRef` + DOM event listeners | Project decision — no headless UI installed | Keeps bundle small; sufficient for one dropdown |
| SSE / WebSocket custom server | Supabase Realtime managed WS | Supabase managed infra | No server code needed |

---

## Open Questions

1. **REPLICA IDENTITY FULL — dashboard step verification**
   - What we know: STATE.md documents this as a blocker for Phase 7
   - What's unclear: Whether it was already enabled during Phase 5/6 setup, or still pending
   - Recommendation: Wave 0 of planning should include a verification task — check in Supabase Dashboard before implementing Realtime subscription

2. **Second test user for cross-tenant E2E (D-10/D-11)**
   - What we know: Existing `auth.setup.ts` uses `E2E_EMAIL` / `E2E_PASSWORD` env vars pointing to `juan@novapay.com`
   - What's unclear: Whether a second client user exists in the seed data with a different `client_id`
   - Recommendation: Review `scripts/seed-demo.js` before planning the cross-tenant test task; if no second user exists, Wave 0 must add one to the seed script

3. **Portal layout bell placement**
   - What we know: Portal layout is sidebar-only (no top bar); sidebar has logo + client name + nav + footer
   - What's unclear: Exact visual placement (sidebar header vs. sidebar footer area) — left to Claude's discretion
   - Recommendation: Place in sidebar header below client name badges; this is the most visible persistent location

---

## Sources

### Primary (HIGH confidence)
- `platform/supabase/migrations/002_notifications.sql` — Confirmed: RLS policies for SELECT and UPDATE exist; both scope to `user_id = auth.uid()`
- `platform/src/lib/types.ts` — Confirmed: `Notification` interface with all fields; `NotificationType` union type
- `platform/src/lib/supabase/client.ts` — Confirmed: `createClient()` factory using `createBrowserClient` from `@supabase/ssr`
- `platform/src/app/[locale]/portal/layout.tsx` — Confirmed: existing "use client" pattern, `createClient()` call, Tailwind classes, sidebar structure
- `platform/src/app/[locale]/portal/tasks/page.tsx` — Confirmed: `useEffect + useState + supabase.from().select()` pattern
- `platform/package.json` — Confirmed: all needed packages already installed; versions verified from file
- `platform/playwright.config.ts` — Confirmed: Playwright configured with `setup` project pattern and `storageState`

### Secondary (MEDIUM confidence)
- Supabase Realtime `postgres_changes` subscription API — `filter: "user_id=eq.${userId}"` filter syntax is standard documented pattern; cross-verified against known `@supabase/supabase-js` v2 API
- `date-fns` `formatDistanceToNow` with locale — verified against date-fns v4 docs (installed version)

### Tertiary (LOW confidence)
- None — all claims verified against project source files or installed package APIs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in `package.json`; no new installs needed
- Architecture: HIGH — component pattern directly mirrors existing `portal/layout.tsx` and `tasks/page.tsx`
- Pitfalls: HIGH — REPLICA IDENTITY blocker is documented in STATE.md; React Strict Mode double-mount is a known Supabase Realtime issue; all others derived from verified code inspection
- Cross-tenant test pattern: MEDIUM — auth setup pattern derived from existing `auth.setup.ts`; second-user requirement is new

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable stack — `@supabase/supabase-js` v2 API is stable)
