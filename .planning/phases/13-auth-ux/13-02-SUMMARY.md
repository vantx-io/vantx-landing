---
phase: 13-auth-ux
plan: "02"
subsystem: portal/settings
tags: [auth, profile, password, settings, rls, api]
dependency_graph:
  requires: [13-01]
  provides: [profile-edit, password-change, rls-user-self-update]
  affects: [platform/src/app/[locale]/portal/settings/page.tsx, platform/src/app/api/profile/route.ts]
tech_stack:
  added: []
  patterns: [supabase-as-any cast, rateLimit outside try/catch, 4s auto-clear timeout, useEffect per concern]
key_files:
  created:
    - platform/supabase/migrations/006_user_self_update.sql
    - platform/src/app/api/profile/route.ts
  modified:
    - platform/src/app/[locale]/portal/settings/page.tsx
    - platform/src/messages/en.json
    - platform/src/messages/es.json
decisions:
  - "RLS UPDATE policy scoped to USING (id = auth.uid()) WITH CHECK (id = auth.uid()) — field restriction enforced in API layer only"
  - "Profile and Security sections as separate cards — consistent with existing Notifications card pattern"
  - "Two separate useEffects (one for prefs, one for profile) — independent loading concerns"
metrics:
  duration: "8m"
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_changed: 5
---

# Phase 13 Plan 02: Profile Editing and Password Change Summary

Profile editing (AUTH-03) and password change (AUTH-02) added to the portal settings page, backed by a new /api/profile API route with rate limiting and an RLS migration enabling users to update their own row.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create RLS migration and /api/profile route | 782d8bb | 006_user_self_update.sql, api/profile/route.ts |
| 2 | Add Profile and Security sections to settings page | 479d6f6 | settings/page.tsx, en.json, es.json |

## What Was Built

**006_user_self_update.sql** — RLS UPDATE policy that lets any authenticated user update their own row in the `users` table. Field restriction (full_name only) is enforced at the API layer, not the DB layer.

**/api/profile route** — GET returns `full_name` and `email` for the authenticated user. PATCH updates `full_name` with rate limiting (20 req/min via Upstash), input validation (400 on empty), and auth guard (401 on unauthenticated). Uses `(supabase as any)` cast to avoid TypeScript `never` inference — established pattern.

**settings/page.tsx** — Restructured to three sequential cards:
1. Profile (top): display name input (editable) + email (read-only paragraph) + Save button. Loads from GET /api/profile on mount. PATCH on submit. Success message auto-clears after 4s.
2. Notifications (middle): unchanged toggle switches.
3. Security (bottom): new password + confirm password fields + Change password button. Client-side validation rejects <8 chars and mismatched passwords before hitting Supabase. Calls `supabase.auth.updateUser({ password })`. Clears fields on success. Success auto-clears after 4s.

**i18n** — 15 new keys added to both `en.json` and `es.json` under the `settings` namespace. `check-i18n.js` passes with 297 keys (parity confirmed).

## Decisions Made

- RLS policy uses `WITH CHECK (id = auth.uid())` in addition to `USING` — enforces identity at both read and write gate
- Separate `useEffect` for profile load (independent from prefs useEffect) — avoids coupling loading states
- Profile and Security sections rendered as separate cards matching Notifications card style — visual consistency

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: platform/supabase/migrations/006_user_self_update.sql
- FOUND: platform/src/app/api/profile/route.ts
- FOUND: platform/src/app/[locale]/portal/settings/page.tsx
- FOUND: 782d8bb (Task 1 commit)
- FOUND: 479d6f6 (Task 2 commit)
