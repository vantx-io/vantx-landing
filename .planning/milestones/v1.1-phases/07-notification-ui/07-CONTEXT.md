# Phase 7: Notification UI - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

In-app notification bell component with real-time Supabase subscription, dropdown with mark-as-read and mark-all-as-read, mounted in both portal and admin layouts. Cross-tenant isolation verified by Playwright E2E test. No server-side notification logic — that's done (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Bell & Dropdown Design
- **D-01:** Numeric badge capped at "9+" — informative without clutter for a B2B SaaS portal
- **D-02:** Dropdown shows 5 items before scroll, max 400px height, right-aligned under bell icon
- **D-03:** Each notification item: type icon (payment/task) + title + relative timestamp ("2m ago") + body truncated to 1 line
- **D-04:** Empty state: subtle bell icon + "No notifications" text — clean, no illustrations

### Interaction Behavior
- **D-05:** Click notification → navigate to `action_link` AND mark read in one action (single click does both)
- **D-06:** "Mark all as read" text button in dropdown header area
- **D-07:** Click-outside or Escape closes dropdown

### Real-Time Feedback
- **D-08:** Subtle badge count increment only — no toast, no sound (B2B professional tool)
- **D-09:** Brief CSS pulse animation on badge when new notification arrives via Realtime

### Cross-Tenant Security Test
- **D-10:** Playwright E2E with two test users to prove cross-tenant isolation (strongest proof for SC-4)
- **D-11:** Test inserts notification for User A, then verifies User B's query/subscription does NOT receive it

### Claude's Discretion
- Component file structure (single file vs split into sub-components)
- CSS approach (Tailwind classes matching existing portal patterns)
- Supabase Realtime channel configuration details
- Type icon selection per notification type
- Exact animation timing for badge pulse
- How to handle stale Realtime connections (reconnect strategy)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Notification Data Layer (Phase 5-6)
- `platform/supabase/migrations/002_notifications.sql` — Notifications table schema, RLS policies (user-scoped SELECT/UPDATE, admin ALL), indexes
- `platform/src/lib/types.ts` — `Notification`, `NotificationType` type definitions
- `platform/src/lib/notifications.ts` — `createNotification()` helper for inserts (server-side)

### Portal Layout & Patterns
- `platform/src/app/[locale]/portal/layout.tsx` — Portal layout where bell mounts
- `platform/src/app/[locale]/portal/tasks/page.tsx` — Existing portal page patterns (client components, Supabase queries)
- `platform/src/lib/supabase/client.ts` — Browser client factory for Realtime subscriptions

### State & Decisions
- `.planning/phases/06-server-side-integration/06-CONTEXT.md` — D-13 (notification rows mirror email targeting), notification types
- `.planning/phases/05-foundation/05-CONTEXT.md` — D-09 (RLS policies), D-06 (notification types)

### Blockers
- `.planning/STATE.md` — "Supabase Realtime REPLICA IDENTITY FULL: Must be enabled in Supabase Dashboard before Phase 7"

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `platform/src/lib/supabase/client.ts`: `createClient()` — use for Realtime subscription in browser
- `platform/src/lib/types.ts`: `Notification` interface — use directly in component props
- Portal layout already has a navbar area where bell should mount

### Established Patterns
- **Client components**: Portal pages use `"use client"` with `useEffect` + `useState` for Supabase queries
- **Supabase browser client**: `createClient()` from `@/lib/supabase/client`
- **Styling**: Tailwind CSS throughout portal
- **i18n**: `useTranslations()` from next-intl for UI strings

### Integration Points
- `platform/src/app/[locale]/portal/layout.tsx` — Mount NotificationBell in navbar
- Future: `platform/src/app/[locale]/admin/layout.tsx` (Phase 8) — Mount same bell component (NOTIF-09)
- `platform/src/lib/supabase/client.ts` — Realtime subscription channel

</code_context>

<specifics>
## Specific Ideas

- Professional B2B SaaS aesthetic — clean, not social-media-noisy
- Match existing portal dark theme and Tailwind patterns
- Bell component must be reusable across portal and admin layouts (NOTIF-09)

</specifics>

<deferred>
## Deferred Ideas

- Notification preferences UI (NOTIF-11, v2)
- Weekly email digest (NOTIF-10, v2)
- Notification grouping/stacking by type
- "View all notifications" full page

</deferred>

---

*Phase: 07-notification-ui*
*Context gathered: 2026-03-25*
