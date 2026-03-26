# Phase 14: Polish UX - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

The portal feels polished — pages load gracefully with skeletons, new users are guided with an onboarding card, and errors are contained by section-level boundaries. No new features — this is a UX quality pass on existing pages.

</domain>

<decisions>
## Implementation Decisions

### Loading Skeletons (UX-01)
- **D-01:** Reusable skeleton components: `SkeletonCard`, `SkeletonTable`, `SkeletonText` — Tailwind `animate-pulse` with gray placeholder blocks, no extra library
- **D-02:** Apply to every portal page that fetches data: Dashboard, Tests, Reports, Tasks, Billing, Services, Settings. Also admin pages: Overview, Clients, Tasks, Billing, Users
- **D-03:** Skeleton shows immediately on mount, replaced when data loads — wrap existing loading states (most pages already have `if (!data) return ...` patterns)
- **D-04:** Skeleton components live in `platform/src/components/skeletons.tsx` — single file with all variants exported

### Onboarding Guide (UX-02)
- **D-05:** Add `has_onboarded BOOLEAN DEFAULT false` column to `users` table via new migration
- **D-06:** First-login detection: query `has_onboarded` on portal dashboard mount — if false, show onboarding card
- **D-07:** Dismissable card/banner at the top of the portal dashboard (not a step-by-step wizard, not an overlay tour, not a modal)
- **D-08:** Content: "Welcome to Vantix!" heading + 3-4 action items with links: View your tasks, Check test results, Explore billing, Update notification settings
- **D-09:** Dismiss button sets `has_onboarded = true` via API call — never shows again
- **D-10:** Bilingual content (EN/ES) via `settings.onboarding_*` or `portal.onboarding_*` i18n keys

### Error Boundaries (UX-03)
- **D-11:** Single reusable `SectionErrorBoundary` class component in `platform/src/components/SectionErrorBoundary.tsx`
- **D-12:** Section-level wrapping — each major data section on portal pages gets its own boundary (NOT page-level)
- **D-13:** Fallback UI: "Something went wrong in this section" message + "Retry" button that calls `this.setState({ hasError: false })` to re-render children
- **D-14:** Rest of the page stays functional when one section fails — this is the key UX requirement
- **D-15:** Errors logged to `console.error` only — no external error tracking service in v1.2
- **D-16:** Bilingual fallback messages via i18n keys

### Claude's Discretion
- Exact skeleton dimensions and spacing per page
- Which sections on each page get error boundaries (vs which are too small to warrant one)
- Onboarding card visual design and animation
- Whether to use React's built-in ErrorBoundary or a custom class component
- Migration numbering (next available after 006)

</decisions>

<specifics>
## Specific Ideas

- Skeletons should match the approximate shape of real content — not generic rectangles. A table skeleton should look like rows, a stat card skeleton should look like a card
- Onboarding should feel welcoming, not overwhelming — 3-4 items max, friendly tone
- Error boundary fallback should be subtle and non-alarming — gray box with a calm message, not red alerts

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Portal pages (add skeletons + error boundaries)
- `platform/src/app/[locale]/portal/page.tsx` — Dashboard (onboarding card goes here)
- `platform/src/app/[locale]/portal/tests/page.tsx` — Tests page
- `platform/src/app/[locale]/portal/reports/page.tsx` — Reports page
- `platform/src/app/[locale]/portal/services/page.tsx` — Services page
- `platform/src/app/[locale]/portal/billing/page.tsx` — Billing page
- `platform/src/app/[locale]/portal/settings/page.tsx` — Settings page

### Admin pages (add skeletons + error boundaries)
- `platform/src/app/[locale]/admin/page.tsx` — Admin overview
- `platform/src/app/[locale]/admin/clients/page.tsx` — Clients table
- `platform/src/app/[locale]/admin/tasks/page.tsx` — Tasks table
- `platform/src/app/[locale]/admin/billing/page.tsx` — Billing + MRR chart
- `platform/src/app/[locale]/admin/users/page.tsx` — Users table

### Existing patterns
- `platform/src/lib/types.ts` — User type (extend with has_onboarded)
- `platform/src/app/api/profile/route.ts` — Profile API pattern (extend for has_onboarded)
- `platform/src/messages/en.json` — i18n keys
- `platform/src/messages/es.json` — Spanish translations

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Tailwind `animate-pulse` — built-in, no install needed
- Existing loading state patterns (`if (!data) return <p>Loading...</p>`) — replace with skeletons
- Profile API route — extend for `has_onboarded` update
- i18n namespace pattern — add onboarding/error keys

### Established Patterns
- Client-side data fetching with useEffect + useState
- `useTranslations()` with namespace for i18n
- Class components for error boundaries (React requirement — hooks can't catch errors)
- Portal dashboard is the landing page after login

### Integration Points
- Every portal/admin page — add skeleton loading states
- Portal dashboard — add onboarding card
- New migration — `has_onboarded` column
- New components file — skeletons.tsx, SectionErrorBoundary.tsx
- i18n files — onboarding + error boundary keys

</code_context>

<deferred>
## Deferred Ideas

- External error tracking (Sentry, LogRocket) — future if needed at scale
- Step-by-step interactive tour (Shepherd.js, react-joyride) — overkill for <20 users
- Page-level transitions/animations — not in scope
- Empty state illustrations — separate polish pass if needed

</deferred>

---

*Phase: 14-polish-ux*
*Context gathered: 2026-03-26*
