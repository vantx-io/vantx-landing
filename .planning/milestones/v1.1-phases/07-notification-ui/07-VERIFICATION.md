---
phase: 07-notification-ui
verified: 2026-03-25T10:00:00Z
status: human_needed
score: 8/9 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Bell icon visible in portal sidebar and real-time badge update"
    expected: "Bell appears below client name/badges in sidebar; INSERT into notifications table causes badge to increment with animate-ping pulse (no page refresh); badge disappears when all marked read"
    why_human: "Requires Supabase Realtime REPLICA IDENTITY FULL enabled on notifications table — cannot verify database config or WebSocket behavior programmatically"
  - test: "Dropdown UI interaction end-to-end"
    expected: "Clicking bell opens dropdown with type icons, titles, truncated body, relative timestamps; clicking a notification marks it read (bold/dot removed) and navigates to action_link; Escape and click-outside close the dropdown"
    why_human: "Visual rendering, navigation behavior, and animation quality cannot be verified by static code analysis"
  - test: "Cross-tenant E2E test execution (npx playwright test --project=cross-tenant)"
    expected: "Test passes: User B does not see User A's inserted notification title in dropdown"
    why_human: "Requires E2E_EMAIL_B, E2E_PASSWORD_B, and SUPABASE_SERVICE_ROLE_KEY env vars plus a second test user registered in the database — environment setup cannot be verified here"
---

# Phase 7: Notification UI — Verification Report

**Phase Goal:** Users in the portal see live in-app notifications, can mark them read, and the NotificationBell component is ready to mount in any layout without security risk.
**Verified:** 2026-03-25T10:00:00Z
**Status:** human_needed (all automated checks passed; 3 items require human/environment verification)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | NotificationBell renders a bell icon with numeric unread badge capped at 9+ | VERIFIED | `NotificationBell.tsx` line 112: `unreadCount > 9 ? "9+" : String(unreadCount)` |
| 2 | Clicking bell opens dropdown showing up to 20 recent notifications with type icon, title, truncated body, relative timestamp | VERIFIED | `NotificationBell.tsx` lines 40-45 (fetch limit 20), lines 225-258 (dropdown list with `getTypeIcon`, `n.title`, `n.body`, `formatTime`) |
| 3 | Clicking a notification marks it read and navigates to action_link | VERIFIED | `markRead()` function lines 114-128: Supabase update + local state update + `router.push(target.action_link)` |
| 4 | Mark all as read button clears all unread in one action | VERIFIED | `markAllRead()` function lines 131-142: `.in("id", unreadIds)` bulk update + full state map |
| 5 | Click-outside or Escape closes the dropdown | VERIFIED | Effect #2 lines 81-94 (mousedown listener checks `bellRef`); Effect #3 lines 97-108 (`e.key === "Escape"`) |
| 6 | Realtime INSERT subscription filtered by user_id updates badge live with CSS pulse | VERIFIED (code) / HUMAN for runtime | Lines 52-68: `postgres_changes` channel with `filter: user_id=eq.${user.id}`, `setPulse(true)` + 2s timeout; channel cleanup via `removeChannel` — requires REPLICA IDENTITY FULL in Supabase Dashboard to fire |
| 7 | Empty state shows bell icon + No notifications text | VERIFIED | Lines 219-223: conditional renders `<Bell>` + `{t("empty")}` when `notifications.length === 0` |
| 8 | NotificationBell is visible in the portal sidebar when a user is logged in | VERIFIED | `portal/layout.tsx` line 8 imports `NotificationBell`, line 121 renders `<NotificationBell />` inside sidebar header div |
| 9 | A user cannot see notifications belonging to a different user/client (cross-tenant isolation) | VERIFIED (code) / HUMAN for runtime | `user_id=eq.${user.id}` filter on both initial fetch and Realtime channel; `cross-tenant.spec.ts` tests dual-context isolation — requires env vars and second test user to execute |

**Score:** 7/9 truths fully verified by code analysis; 2 truths require human/environment verification (Realtime runtime, E2E execution)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `platform/src/components/NotificationBell.tsx` | Bell with Realtime, dropdown, mark-read | VERIFIED | 266 lines, fully substantive, no stubs |
| `platform/src/messages/en.json` | notifications namespace with 4 keys | VERIFIED | `title`, `markAllRead`, `empty`, `justNow` all present |
| `platform/src/messages/es.json` | notifications namespace (Spanish) | VERIFIED | All 4 keys in Spanish confirmed by node execution |
| `platform/src/app/[locale]/portal/layout.tsx` | NotificationBell mounted in sidebar header | VERIFIED | Import line 8, render line 121 |
| `platform/e2e/cross-tenant.spec.ts` | Playwright E2E cross-tenant isolation test | VERIFIED | 81 lines, dual browser context, service role insert, `not.toBeVisible()` assertion |
| `platform/e2e/auth.setup-b.ts` | Second Playwright auth setup for User B | VERIFIED | E2E_EMAIL_B / E2E_PASSWORD_B env vars, writes user-b.json |
| `platform/playwright.config.ts` | setup-b and cross-tenant projects declared | VERIFIED | Both projects present with correct `dependencies` and `testMatch` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `NotificationBell.tsx` | `supabase.from('notifications')` | `createClient()` from `@/lib/supabase/client` | WIRED | `createClient()` at module scope (line 15); `.from("notifications")` at lines 41, 116, 137 |
| `NotificationBell.tsx` | Supabase Realtime channel | `supabase.channel().on('postgres_changes', {filter: user_id=eq.})` | WIRED | Lines 52-68: channel created with `user_id=eq.${user.id}` filter, cleanup via `removeChannel` |
| `portal/layout.tsx` | `NotificationBell.tsx` | `import { NotificationBell } from '@/components/NotificationBell'` | WIRED | Import at line 8, render at line 121 |
| `cross-tenant.spec.ts` | Supabase notifications table RLS | Two browser contexts + service role insert | WIRED | `user-b.json` referenced line 24; `not.toBeVisible()` assertion line 71 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| NOTIF-02 | 07-01-PLAN.md | In-app notification bell component with unread count badge | SATISFIED | `NotificationBell.tsx` exists with full bell + badge implementation |
| NOTIF-03 | 07-01-PLAN.md | Notification dropdown with list, mark-as-read, mark-all-read | SATISFIED | Dropdown JSX lines 197-262; `markRead()` and `markAllRead()` functions fully implemented |
| NOTIF-04 | 07-01-PLAN.md, 07-02-PLAN.md | Supabase Realtime subscription filtered by user_id (cross-tenant safe) | SATISFIED (code) / HUMAN for E2E execution | `user_id=eq.${user.id}` filter on channel; `cross-tenant.spec.ts` validates RLS isolation but requires env setup to run |
| NOTIF-09 | 07-02-PLAN.md | NotificationBell mounted in both portal and admin layouts | PARTIAL | Portal mount: DONE (layout.tsx line 121). Admin mount: DEFERRED to Phase 8 — admin layout (ADMIN-02) does not yet exist. ROADMAP explicitly assigns admin mount to Phase 8. REQUIREMENTS.md tracking table still shows NOTIF-09 as "Pending". |

### NOTIF-09 Scope Note

NOTIF-09 requires the bell in **both** portal and admin layouts. Phase 7's ROADMAP goal states: "NotificationBell component is ready to mount in any layout without security risk" — portal mount was planned for Phase 7, admin mount was deferred to Phase 8 (see ROADMAP.md Phase 8: "bell mount" listed under Phase 8 goal). The admin layout (ADMIN-02) does not exist yet. REQUIREMENTS.md tracking table correctly reflects NOTIF-09 as `| NOTIF-09 | Phase 7 | Pending |` — this has NOT been updated to "Complete". Phase 7 satisfies the portal half of NOTIF-09; the admin half is a known Phase 8 deliverable.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `NotificationBell.tsx` | 116, 137 | `(supabase.from("notifications") as any)` | Info | Pre-existing project-wide Supabase TS type inference issue (54 errors in 13 files documented in summary). Not specific to notifications. ESLint suppress comments present. Does not affect runtime behavior. |

No blocking stubs found. All state variables are populated via actual Supabase queries. No hardcoded empty arrays that flow to user-visible output without a fetch path.

---

## Commit Verification

All three commits documented in phase summaries confirmed to exist in git history:

| Commit | Message |
|--------|---------|
| `65a8e3f` | feat(07-01): add notifications i18n namespace in EN and ES |
| `2ffedcd` | feat(07-01): build NotificationBell component with Realtime subscription |
| `85a9d7a` | feat(07-02): mount NotificationBell in portal layout and add cross-tenant E2E test |

---

## Human Verification Required

### 1. Bell icon and real-time badge update

**Test:** Navigate to `http://localhost:3000/en/portal` while logged in. Verify the bell icon appears in the sidebar below the client name/plan badges.

**Expected:** Bell icon is visible; if there are existing unread notifications, badge shows the count (capped at "9+"). Open Supabase Dashboard SQL editor and INSERT a notification for the current user's `user_id` — badge should increment and briefly show the `animate-ping` pulse (no page refresh).

**Prerequisite:** Supabase Realtime must be enabled on the `notifications` table (Dashboard -> Database -> Tables -> notifications -> toggle Realtime ON). Without REPLICA IDENTITY FULL the subscription subscribes but never fires.

**Why human:** WebSocket Realtime behavior and database configuration cannot be verified by static code analysis.

---

### 2. Dropdown UI interaction end-to-end

**Test:** Click the bell icon. Then test each interaction:
1. Dropdown opens showing type icons (CreditCard/Plus/CheckSquare), notification title, truncated body, relative timestamp
2. Click outside or press Escape — dropdown closes
3. Click a notification — it marks as read (bold styling removed, unread dot removed, badge count decreases)
4. If notification has an `action_link`, browser navigates to it
5. Click "Mark all as read" — all unread indicators clear and badge disappears
6. Empty state: if no notifications, shows bell icon + "No notifications" text

**Expected:** All interactions work as described.

**Why human:** Visual rendering, animation quality (animate-ping pulse), and in-app navigation cannot be verified by static analysis.

---

### 3. Cross-tenant E2E test execution

**Test:** With environment variables `E2E_EMAIL_B`, `E2E_PASSWORD_B`, and `SUPABASE_SERVICE_ROLE_KEY` set, and a second test user registered in the database:

```bash
cd platform && npx playwright test --project=cross-tenant
```

**Expected:** Test "User B cannot see User A notifications" passes — User B's dropdown does not show the notification inserted for User A.

**Why human:** Requires second test user in database and environment credentials that cannot be verified here. Test confirms RLS + Realtime filter work together at runtime.

---

## Phase Goal Assessment

**Phase Goal:** "Users in the portal see live in-app notifications, can mark them read, and the NotificationBell component is ready to mount in any layout without security risk."

**Assessment:**

The code fully supports this goal. All four ROADMAP Success Criteria have implementation evidence:

1. Bell in portal navbar with real-time badge — IMPLEMENTED (Realtime channel + animate-ping)
2. Dropdown + mark-read decreases badge — IMPLEMENTED (markRead + local state update)
3. Mark all as read — IMPLEMENTED (markAllRead bulk update)
4. Cross-tenant isolation test — IMPLEMENTED (cross-tenant.spec.ts dual-context E2E)

The NOTIF-09 "admin layout" half is correctly deferred to Phase 8 per the ROADMAP. The REQUIREMENTS.md tracking table reflects this accurately (Pending). No false completion claim.

The only items blocking a full "passed" status are runtime behaviors requiring human verification (Realtime subscription, visual UI, E2E test execution with credentials).

---

_Verified: 2026-03-25T10:00:00Z_
_Verifier: Claude (gsd-verifier)_
