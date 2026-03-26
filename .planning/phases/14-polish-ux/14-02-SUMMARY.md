---
phase: 14
plan: 02
subsystem: portal-ux
tags: [skeleton, loading, onboarding, error-boundary, portal]
dependency_graph:
  requires: [14-01]
  provides: [skeleton-loading-all-portal-pages, onboarding-card-dashboard, error-boundaries-all-portal-pages]
  affects: [portal-dashboard, portal-tests, portal-reports, portal-tasks, portal-billing, portal-services, portal-settings]
tech_stack:
  added: []
  patterns:
    - "loading state via useState(true) + load().finally(() => setLoading(false))"
    - "SectionErrorBoundary wrapping data-fetching sections (not entire pages)"
    - "Skeleton early-return before main JSX return"
    - "dataLoading vs loading disambiguation for pages with dual loading concerns (billing)"
key_files:
  created: []
  modified:
    - platform/src/app/[locale]/portal/page.tsx
    - platform/src/app/[locale]/portal/tests/page.tsx
    - platform/src/app/[locale]/portal/reports/page.tsx
    - platform/src/app/[locale]/portal/tasks/page.tsx
    - platform/src/app/[locale]/portal/billing/page.tsx
    - platform/src/app/[locale]/portal/services/page.tsx
    - platform/src/app/[locale]/portal/settings/page.tsx
decisions:
  - "Dashboard uses 2 separate SectionErrorBoundary wrappers: (1) metrics+charts, (2) reports+tasks bottom grid — per plan D-12 spec"
  - "Billing uses dataLoading (true on mount) distinct from existing loading (false on mount) to avoid checkout-button conflict"
  - "Settings page gets no skeleton — forms render immediately with disabled inputs while profileLoading/loading are true"
  - "OnboardingCard dismiss handler in DashboardPage is a thin wrapper; OnboardingCard itself already has dismiss logic — the outer handler provides state management only"
  - "has_onboarded column added to dashboard users select query; setHasOnboarded(profile.has_onboarded ?? true) defaults existing users to true"
metrics:
  duration: "6m 26s"
  completed: "2026-03-26"
  tasks_completed: 2
  files_modified: 7
---

# Phase 14 Plan 02: Portal Skeleton Loading, Onboarding Card & Error Boundaries Summary

Wire loading skeletons, onboarding card, and SectionErrorBoundary into all 7 portal pages. Every page shows content-shaped placeholders during data load, data sections are isolated by error boundaries, and the dashboard shows a welcome guide for first-time users.

## What Was Built

### Task 1: Dashboard, Tests, Reports, Tasks (commit: 3ed16de)

**Portal Dashboard** (`platform/src/app/[locale]/portal/page.tsx`):
- Added skeleton loading state: 5x SkeletonCard in flex row, 2x SkeletonChart grid, 2x SkeletonText grid
- Extends `users.select` to include `has_onboarded` field
- Calls `load().finally(() => setLoading(false))` — skeleton disappears even if load fails
- Renders `<OnboardingCard onDismiss={handleDismissOnboarding} />` when `hasOnboarded === false`
- `handleDismissOnboarding` is a thin wrapper that sets `hasOnboarded(true)` on success (OnboardingCard handles its own PATCH)
- 2 x SectionErrorBoundary: one around metrics+charts section, one around reports+tasks bottom grid

**Tests Page** (`platform/src/app/[locale]/portal/tests/page.tsx`):
- 3x SkeletonCard stacked as loading state
- SectionErrorBoundary wrapping the `tests.map(...)` block

**Reports Page** (`platform/src/app/[locale]/portal/reports/page.tsx`):
- SkeletonText x4 as loading state
- Filter buttons outside SectionErrorBoundary (remain functional if list renders fails)
- SectionErrorBoundary wrapping filtered reports list

**Tasks Page** (`platform/src/app/[locale]/portal/tasks/page.tsx`):
- SkeletonTable (6 rows, 5 cols) as loading state
- New task form and filter buttons outside SectionErrorBoundary
- SectionErrorBoundary wrapping task list and detail panel

### Task 2: Billing, Services, Settings (commit: e266b91)

**Billing Page** (`platform/src/app/[locale]/portal/billing/page.tsx`):
- Added `dataLoading` state (true on mount) separate from existing `loading` (false, used for checkout button)
- Skeleton: 2x SkeletonCard in grid + h-6 header placeholder + SkeletonText x4
- SectionErrorBoundary 1: subscription card + actions grid
- SectionErrorBoundary 2: payment history list

**Services Page** (`platform/src/app/[locale]/portal/services/page.tsx`):
- 3x SkeletonText as loading state (mirrors 3 categories)
- Title and subtitle outside SectionErrorBoundary
- SectionErrorBoundary wrapping category loop

**Settings Page** (`platform/src/app/[locale]/portal/settings/page.tsx`):
- No skeleton added (forms render immediately with disabled inputs — already handled by profileLoading/loading)
- SectionErrorBoundary wrapping Profile section (form with Supabase fetch)
- SectionErrorBoundary wrapping Notifications section (fetch + toggles)
- Security section intentionally NOT wrapped (pure form, no data fetch, cannot throw)

## Deviations from Plan

None — plan executed exactly as written.

Note: The OnboardingCard component already implements its own `handleDismiss` + PATCH to `/api/profile` internally. The plan's `handleDismissOnboarding` in page.tsx is a lightweight outer callback that only calls `setHasOnboarded(true)` to unmount the card at the page level. Both work correctly together.

## Known Stubs

None — all skeleton/boundary wiring uses real data sources. No placeholder or hardcoded content.

## Self-Check: PASSED

All 7 modified portal page files exist on disk.
Commits 3ed16de and e266b91 confirmed in git log.
