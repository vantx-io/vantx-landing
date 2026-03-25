---
phase: 07-notification-ui
plan: 01
subsystem: ui
tags: [supabase-realtime, nextjs, react, next-intl, date-fns, lucide-react, tailwind]

# Dependency graph
requires:
  - phase: 06-server-side-integration
    provides: notifications table schema with user_id, type, title, body, read, action_link
  - phase: 05-foundation
    provides: Supabase client setup, TypeScript types, i18n infrastructure (next-intl)

provides:
  - NotificationBell client component with Supabase Realtime subscription filtered by user_id
  - Unread badge with 9+ cap and animate-ping pulse on new notification
  - Dropdown with type icons, titles, truncated bodies, relative timestamps (date-fns)
  - markRead() with navigation to action_link, markAllRead() bulk update
  - Click-outside (mousedown) and Escape key close handlers
  - i18n keys for notifications namespace in EN and ES
  - AppNotification type in Database type (notifications table registered in types.ts)

affects:
  - 07-02 (portal layout integration — mounts NotificationBell in sidebar/header)
  - Any future plan consuming notifications table via Supabase client

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "NotificationBell self-manages auth: calls supabase.auth.getUser() internally, no props needed"
    - "createClient() called at module scope (not inside useEffect) — matches portal/layout.tsx pattern"
    - "Supabase Realtime channel cleanup in useEffect return — prevents double-mount leak in React Strict Mode"
    - "Ping animation overlay pattern: one animate-ping span + one static span to keep badge readable during pulse"
    - "DOM Notification naming conflict resolved: AppNotification interface declared BEFORE Database type in types.ts"
    - "Type-safe workaround: (supabase.from('notifications') as any).update() for pre-existing Supabase TS type issue"

key-files:
  created:
    - platform/src/components/NotificationBell.tsx
  modified:
    - platform/src/lib/types.ts
    - platform/src/messages/en.json
    - platform/src/messages/es.json

key-decisions:
  - "AppNotification declared before Database type to avoid collision with DOM global Notification interface (lib:dom)"
  - "supabase.from('notifications') as any cast used for update() calls — pre-existing Supabase type inference issue affects all tables in project, not specific to notifications"
  - "userId guard: returns null render until auth user resolves — bell invisible to unauthenticated users without error"
  - "pulse animation: animate-ping overlay + static badge underneath ensures badge count is always readable during 2s pulse"

patterns-established:
  - "Self-managing auth in client components: call supabase.auth.getUser() in useEffect, guard render on null userId"
  - "Realtime subscription with user_id filter for cross-tenant safety (NOTIF-04)"
  - "Effect cleanup returning supabase.removeChannel(channel) for React Strict Mode compatibility"

requirements-completed: [NOTIF-02, NOTIF-03, NOTIF-04]

# Metrics
duration: 15min
completed: 2026-03-25
---

# Phase 07 Plan 01: NotificationBell UI Summary

**Supabase Realtime bell component with live unread badge (9+ cap, animate-ping), dropdown list with type icons and relative timestamps, markRead/markAllRead, click-outside/Escape close, and i18n in EN/ES**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-25T03:20:00Z
- **Completed:** 2026-03-25T03:26:15Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- NotificationBell.tsx: 290-line "use client" component with full Supabase Realtime subscription
- Badge with 9+ cap, animate-ping pulse on INSERT event (2s), static badge always visible underneath
- Dropdown: max-height 400px, right-aligned, type icons per NotificationType (CreditCard/Plus/CheckSquare/Bell), relative timestamps via date-fns (with ES locale)
- markRead navigates to action_link if present, markAllRead bulk updates with .in() filter
- Click-outside (mousedown on document) and Escape key handlers with proper cleanup
- notifications table added to Database type in types.ts with AppNotification interface

## Task Commits

Each task was committed atomically:

1. **Task 1: Add i18n keys for notifications namespace** - `65a8e3f` (feat) — committed prior to this execution
2. **Task 2: Build NotificationBell component with Realtime subscription** - `2ffedcd` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `platform/src/components/NotificationBell.tsx` - Full NotificationBell client component (created)
- `platform/src/lib/types.ts` - Added AppNotification/NotificationType before Database type; added notifications table entry (modified)
- `platform/src/messages/en.json` - notifications namespace with 4 keys (added in prior commit 65a8e3f)
- `platform/src/messages/es.json` - notifications namespace in Spanish (added in prior commit 65a8e3f)

## Decisions Made

- **AppNotification naming:** Renamed `interface Notification` to `interface AppNotification` and moved it before the `Database` type to avoid TypeScript resolving `Notification` to the DOM's `Notification` Web API interface (which is in scope via `lib: ["dom"]`).
- **Type cast on update:** `(supabase.from("notifications") as any).update()` used because the Supabase TypeScript type inference fails for `.update()` calls across ALL tables in this project (pre-existing issue, 54 pre-existing TS errors). Not specific to notifications.
- **Backward compat alias:** `export type Notification = AppNotification` preserves the original export name so existing imports in other files continue working.
- **Null render guard:** Component returns `null` until `userId` is resolved from `supabase.auth.getUser()` — cleaner than showing an empty bell.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added notifications table to Database type**
- **Found during:** Task 2 (building NotificationBell component)
- **Issue:** `supabase.from("notifications")` would not type-check because the `notifications` table was missing from the `Database` type in `types.ts`. All operations returned `never`.
- **Fix:** Added `notifications` table entry to `Database['public']['Tables']` with `Row: AppNotification`, `Insert`, `Update: Partial<AppNotification>`, `Relationships: []`.
- **Files modified:** platform/src/lib/types.ts
- **Verification:** `npx tsc --noEmit` shows zero errors in NotificationBell.tsx after fix.
- **Committed in:** 2ffedcd (Task 2 commit)

**2. [Rule 3 - Blocking] Resolved DOM Notification naming conflict**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** `interface Notification` in `types.ts` conflicted with the DOM's global `Notification` class (Web Notifications API). The `Database` type was resolving `Notification` to the DOM interface, causing `Update: Partial<Notification>` to evaluate to `never`.
- **Fix:** Renamed to `interface AppNotification`, moved declaration before `Database` type, added `type Notification = AppNotification` alias for backward compatibility. Updated Database entry to use `AppNotification` explicitly.
- **Files modified:** platform/src/lib/types.ts, platform/src/components/NotificationBell.tsx
- **Verification:** `npx tsc --noEmit` shows 0 errors in NotificationBell.tsx (down from 2).
- **Committed in:** 2ffedcd (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - Blocking)
**Impact on plan:** Both fixes required for the component to compile. Types.ts is now more correct than before (notifications table properly registered). No scope creep.

## Issues Encountered

- Pre-existing TypeScript errors (54 errors in 13 files) in the project: `stripe/route.ts`, `tasks/page.tsx`, `reports/page.tsx`, `tests/page.tsx`, `billing-portal/route.ts` all have the same `never` type pattern for Supabase `.from()` calls. These are out of scope for this plan and not caused by our changes. Documented in deferred items.

## User Setup Required

The plan's frontmatter documents one external service requirement:

**Supabase Realtime — Manual Dashboard Step Required:**
- Enable Realtime on the `notifications` table in Supabase Dashboard (Database -> Tables -> notifications -> toggle Realtime ON)
- This sets `REPLICA IDENTITY FULL` which is required for the `postgres_changes` subscription to fire INSERT events
- Without this step, the Realtime subscription will subscribe but never receive events

## Known Stubs

None — the component fully implements all specified behavior. Data flows from Supabase through the subscription and fetch to the dropdown UI. No hardcoded empty arrays or placeholder text.

## Next Phase Readiness

- `NotificationBell` is ready to mount in any layout via `import { NotificationBell } from "@/components/NotificationBell"`
- Phase 07 Plan 02 will integrate the bell into the portal layout (header or sidebar)
- Supabase Realtime must be enabled on `notifications` table before the subscription fires events in production

## Self-Check: PASSED

- FOUND: platform/src/components/NotificationBell.tsx
- FOUND: platform/src/messages/en.json
- FOUND: platform/src/messages/es.json
- FOUND: .planning/phases/07-notification-ui/07-01-SUMMARY.md
- FOUND: commit 65a8e3f (i18n task)
- FOUND: commit 2ffedcd (NotificationBell component)

---
*Phase: 07-notification-ui*
*Completed: 2026-03-25*
