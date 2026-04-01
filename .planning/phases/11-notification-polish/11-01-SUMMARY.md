---
phase: 11-notification-polish
plan: 01
subsystem: ui
tags: [next-intl, supabase, tailwind, lucide-react, rls, postgres]

# Dependency graph
requires:
  - phase: 07-notification-ui
    provides: NotificationBell, AppNotification type, portal layout pattern
  - phase: 10-security-foundation
    provides: createServerSupabase pattern, rate-limited API routes
provides:
  - notification_preferences table with RLS (opt-out model)
  - NotificationPreferences TypeScript type in types.ts
  - GET /api/preferences (returns default-ON when no row exists)
  - PATCH /api/preferences (upserts with field whitelist)
  - /portal/settings page with three accessible toggle switches
  - Settings nav item as last sidebar entry with gear icon
  - i18n settings namespace in en.json and es.json
  - CRON_SECRET documented in .env.local.example
affects: [11-02-preference-enforcement, 11-03-digest-delivery]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Supabase upsert via (supabase as any) cast for notification_preferences table (matches existing stripe/admin pattern)
    - Optimistic toggle update with rollback on API failure and 4s auto-clear error
    - Opt-out preference model: no DB row means all channels enabled

key-files:
  created:
    - platform/supabase/migrations/003_notification_preferences.sql
    - platform/src/app/api/preferences/route.ts
    - platform/src/app/[locale]/portal/settings/page.tsx
  modified:
    - platform/src/lib/types.ts
    - platform/src/messages/en.json
    - platform/src/messages/es.json
    - platform/src/app/[locale]/portal/layout.tsx
    - platform/.env.local.example

key-decisions:
  - "Opt-out model: null row in notification_preferences = all channels on; no INSERT on first visit, only on first toggle"
  - "Supabase upsert typed via (supabase as any) cast — same TypeScript never inference issue as existing stripe webhook; explicit cast is the established codebase pattern"
  - "No loading skeleton for initial prefs fetch — Phase 14 (UX-01) handles universal loading skeletons"
  - "Settings nav item added as last entry — gear icon distinguishes it from text-only nav items"

patterns-established:
  - "Toggle switch: role=switch aria-checked aria-label on button, translate-x-5/translate-x-0.5 for ON/OFF dot position, bg-brand-accent/bg-[#D1D5DB] for track color"
  - "Optimistic update: flip local state → fire PATCH → on failure rollback state + show error → setTimeout clear after 4s"

requirements-completed: [NOTIF-11]

# Metrics
duration: 5min
completed: 2026-03-26
---

# Phase 11 Plan 01: Notification Preferences Foundation Summary

**notification_preferences Supabase table with RLS, PATCH/GET API with opt-out defaults, and /portal/settings page with three accessible toggle switches persisting immediately to DB**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-26T02:39:30Z
- **Completed:** 2026-03-26T02:44:31Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created `notification_preferences` table migration (003) with RLS using opt-out model — no row = all channels enabled
- Built `/api/preferences` with GET (returns default-ON values) and PATCH (whitelist upsert for three boolean fields)
- Created `/portal/settings` page with three accessible toggles: email, in-app, and weekly digest — each fires PATCH on click with optimistic rollback on failure
- Added Settings nav item as last sidebar entry with gear icon from lucide-react

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration, types, preferences API, and i18n keys** - `3043eb0` (feat)
2. **Task 2: Settings page UI and sidebar nav item** - `74500db` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `platform/supabase/migrations/003_notification_preferences.sql` - Creates notification_preferences table with RLS, opt-out model
- `platform/src/app/api/preferences/route.ts` - GET (opt-out defaults) and PATCH (upsert with field whitelist), 401 on unauth
- `platform/src/app/[locale]/portal/settings/page.tsx` - Three accessible toggle switches with optimistic update and error rollback
- `platform/src/lib/types.ts` - Added NotificationPreferences type and Database table entry
- `platform/src/messages/en.json` - Added settings namespace (8 keys) and nav.settings key
- `platform/src/messages/es.json` - Added settings namespace (8 keys) and nav.settings key
- `platform/src/app/[locale]/portal/layout.tsx` - Added Settings nav entry + Settings icon import from lucide-react
- `platform/.env.local.example` - Added CRON_SECRET documentation for Vercel Cron

## Decisions Made
- Opted for `(supabase as any)` cast on the upsert call — the TypeScript `never` inference for new tables is a pre-existing codebase issue (same pattern as stripe webhook route). This is the established fix in this project.
- No loading skeleton for prefs fetch — placeholder shows toggles disabled (`opacity-60`) until data loads. Universal skeletons are Phase 14 (UX-01) scope.
- Toggle dot uses `translate-x-0.5` for OFF state (not `translate-x-0`) to keep a small visual inset from the track edge — matches UI-SPEC.md anatomy.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript never inference in PATCH handler**
- **Found during:** Task 2 (TypeScript compile check)
- **Issue:** `.from('notification_preferences').upsert(...)` typed as `never` overload — same issue as pre-existing stripe route
- **Fix:** Used `(supabase as any)` cast on the upsert call; added explicit `PrefsRow` type cast for GET handler's `maybeSingle()` result
- **Files modified:** platform/src/app/api/preferences/route.ts
- **Verification:** `npx tsc --noEmit` shows 0 errors in new files (59 pre-existing errors in other files unchanged)
- **Committed in:** 74500db (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — TypeScript type inference bug)
**Impact on plan:** Required for TypeScript correctness. No scope creep.

## Issues Encountered
- TypeScript `never` inference for Supabase `upsert` on new tables — resolved with `(supabase as any)` cast, matching codebase convention established in Phase 08.

## Known Stubs
None — all three toggles are wired to `/api/preferences` with real GET/PATCH calls and proper opt-out default logic.

## User Setup Required
None — the CRON_SECRET env var documented in `.env.local.example` is used by Plan 03 (digest delivery), not this plan.

## Next Phase Readiness
- Plan 02 (preference enforcement in `notifyTaskEvent`) can import `NotificationPreferences` type from `types.ts` and query `notification_preferences` table via the established pattern
- Plan 03 (weekly digest) needs `CRON_SECRET` in Vercel env and can reference the `digest_enabled` preference via `/api/preferences` GET
- `/portal/settings` is live and functional — users can toggle preferences immediately

---
*Phase: 11-notification-polish*
*Completed: 2026-03-26*
