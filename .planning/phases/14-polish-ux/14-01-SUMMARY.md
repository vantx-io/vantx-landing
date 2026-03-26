---
phase: 14-polish-ux
plan: 01
subsystem: ui
tags: [react, tailwind, next-intl, supabase, i18n, skeleton, error-boundary, onboarding]

# Dependency graph
requires:
  - phase: 13-auth-ux
    provides: profile API route with PATCH handler and User type in types.ts
provides:
  - SkeletonCard, SkeletonTable, SkeletonText, SkeletonChart components (animate-pulse, aria-busy)
  - SectionErrorBoundary class component with getDerivedStateFromError + retry
  - OnboardingCard client component with bilingual i18n and dismiss-via-API flow
  - has_onboarded boolean column on users table (migration 007)
  - has_onboarded field on User type
  - Profile API extended: GET returns has_onboarded, PATCH accepts has_onboarded: true
  - i18n portal namespace (7 onboarding keys) + common error keys in EN and ES
affects:
  - 14-02-portal-pages (uses all 3 components + has_onboarded from User type)
  - 14-03-admin-pages (uses SkeletonCard, SkeletonTable, SectionErrorBoundary)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Skeleton components as separate named exports in single file (no extra library)
    - SectionErrorBoundary class component with 'use client' for Next.js compatibility
    - OnboardingCard uses useLocale() for locale-prefixed Link hrefs
    - Profile API: early-return branch pattern for orthogonal PATCH operations
    - One-way has_onboarded operation (only accepts true, never resets via API)

key-files:
  created:
    - platform/src/components/skeletons.tsx
    - platform/src/components/SectionErrorBoundary.tsx
    - platform/src/components/OnboardingCard.tsx
    - platform/supabase/migrations/007_onboarding.sql
  modified:
    - platform/src/lib/types.ts
    - platform/src/app/api/profile/route.ts
    - platform/src/messages/en.json
    - platform/src/messages/es.json

key-decisions:
  - "SectionErrorBoundary uses 'use client' directive as first line — required for class components with error boundary behavior in Next.js App Router"
  - "has_onboarded PATCH branch placed before full_name validation — early return for orthogonal operation with separate backfill logic"
  - "Existing users backfilled to has_onboarded=true in migration — prevents onboarding card appearing for established accounts"
  - "OnboardingCard dismiss is silent on API failure — card stays visible, user can retry, no error shown per UI-SPEC"

patterns-established:
  - "Skeleton exports: single file with multiple named exports, 'use client', Tailwind animate-pulse only"
  - "Error boundary: class component with getDerivedStateFromError + componentDidCatch + console.error only"
  - "Profile API extension: early-return branch pattern for new fields before full_name block"

requirements-completed: [UX-01, UX-02, UX-03]

# Metrics
duration: 3min
completed: 2026-03-26
---

# Phase 14 Plan 01: Shared Infrastructure Summary

**Skeleton components (4 variants), SectionErrorBoundary class component, OnboardingCard with dismiss-to-API flow, has_onboarded DB column + User type, profile API extended, and bilingual i18n keys for all new components**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-26T12:56:11Z
- **Completed:** 2026-03-26T12:59:09Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created 4 skeleton components (SkeletonCard, SkeletonTable, SkeletonText, SkeletonChart) with Tailwind animate-pulse and aria-busy accessibility attributes
- Created SectionErrorBoundary class component with getDerivedStateFromError, componentDidCatch, and retry button that re-mounts children
- Created OnboardingCard client component using useTranslations('portal') and useLocale() for locale-aware link hrefs; dismiss flow calls PATCH /api/profile silently
- Added migration 007 with has_onboarded column and backfill for existing users; added field to User type
- Extended profile API GET to include has_onboarded and added early-return PATCH branch for onboarding dismiss
- Added portal namespace (7 keys) and common error keys to both en.json and es.json

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared components + migration + types** - `c989bf0` (feat)
2. **Task 2: Extend profile API + add i18n keys** - `1fd41ce` (feat)

## Files Created/Modified
- `platform/src/components/skeletons.tsx` - Exports SkeletonCard, SkeletonTable, SkeletonText, SkeletonChart with animate-pulse
- `platform/src/components/SectionErrorBoundary.tsx` - Class component error boundary with retry
- `platform/src/components/OnboardingCard.tsx` - Bilingual onboarding card with dismiss flow
- `platform/supabase/migrations/007_onboarding.sql` - Adds has_onboarded column, backfills existing users to true
- `platform/src/lib/types.ts` - Added has_onboarded: boolean to User type
- `platform/src/app/api/profile/route.ts` - GET includes has_onboarded; PATCH handles has_onboarded: true early-return branch
- `platform/src/messages/en.json` - Added portal namespace (7 keys) + common error keys
- `platform/src/messages/es.json` - Added portal namespace (7 keys) + common error keys (Spanish)

## Decisions Made
- SectionErrorBoundary uses `'use client'` as first line — required for class components with error boundary behavior in Next.js App Router
- has_onboarded PATCH branch placed before full_name validation block — early-return pattern for orthogonal operations
- Existing users backfilled to has_onboarded=true in 007 migration — prevents onboarding card appearing for established accounts on first login after deploy
- OnboardingCard dismiss is silent on API failure per UI-SPEC D-10 — card stays visible, button re-enables, user can retry

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. Pre-existing TypeScript errors in webhooks/stripe/route.ts and other files (unrelated to this plan, pre-dating Phase 14) were present before and after execution — all 0 new errors introduced in files created or modified by this plan.

## User Setup Required
None - no external service configuration required. The database migration must be applied manually to the Supabase project when ready (standard deploy procedure).

## Next Phase Readiness
- All shared infrastructure components are importable from their respective paths
- `@/components/skeletons` exports all 4 skeleton variants
- `@/components/SectionErrorBoundary` exports the class component
- `@/components/OnboardingCard` exports the client component
- User type includes has_onboarded field for portal pages to consume
- Profile API ready for portal dashboard to load has_onboarded on mount
- i18n keys in both languages ready for component use

---
*Phase: 14-polish-ux*
*Completed: 2026-03-26*
