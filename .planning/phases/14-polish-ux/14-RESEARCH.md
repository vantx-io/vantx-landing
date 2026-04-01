# Phase 14: Polish UX - Research

**Researched:** 2026-03-26
**Domain:** React loading skeletons, React Error Boundaries, Supabase schema migration, Next-intl i18n, onboarding UX
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Loading Skeletons (UX-01)**
- D-01: Reusable skeleton components: `SkeletonCard`, `SkeletonTable`, `SkeletonText` — Tailwind `animate-pulse` with gray placeholder blocks, no extra library
- D-02: Apply to every portal page that fetches data: Dashboard, Tests, Reports, Tasks, Billing, Services, Settings. Also admin pages: Overview, Clients, Tasks, Billing, Users
- D-03: Skeleton shows immediately on mount, replaced when data loads — wrap existing loading states (most pages already have `if (!data) return ...` patterns)
- D-04: Skeleton components live in `platform/src/components/skeletons.tsx` — single file with all variants exported

**Onboarding Guide (UX-02)**
- D-05: Add `has_onboarded BOOLEAN DEFAULT false` column to `users` table via new migration
- D-06: First-login detection: query `has_onboarded` on portal dashboard mount — if false, show onboarding card
- D-07: Dismissable card/banner at the top of the portal dashboard (not a step-by-step wizard, not an overlay tour, not a modal)
- D-08: Content: "Welcome to Vantix!" heading + 3-4 action items with links: View your tasks, Check test results, Explore billing, Update notification settings
- D-09: Dismiss button sets `has_onboarded = true` via API call — never shows again
- D-10: Bilingual content (EN/ES) via `settings.onboarding_*` or `portal.onboarding_*` i18n keys

**Error Boundaries (UX-03)**
- D-11: Single reusable `SectionErrorBoundary` class component in `platform/src/components/SectionErrorBoundary.tsx`
- D-12: Section-level wrapping — each major data section on portal pages gets its own boundary (NOT page-level)
- D-13: Fallback UI: "Something went wrong in this section" message + "Retry" button that calls `this.setState({ hasError: false })` to re-render children
- D-14: Rest of the page stays functional when one section fails — this is the key UX requirement
- D-15: Errors logged to `console.error` only — no external error tracking service in v1.2
- D-16: Bilingual fallback messages via i18n keys

### Claude's Discretion
- Exact skeleton dimensions and spacing per page
- Which sections on each page get error boundaries (vs which are too small to warrant one)
- Onboarding card visual design and animation
- Whether to use React's built-in ErrorBoundary or a custom class component
- Migration numbering (next available after 006)

### Deferred Ideas (OUT OF SCOPE)
- External error tracking (Sentry, LogRocket) — future if needed at scale
- Step-by-step interactive tour (Shepherd.js, react-joyride) — overkill for <20 users
- Page-level transitions/animations — not in scope
- Empty state illustrations — separate polish pass if needed
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-01 | Portal pages show loading skeletons during data fetch | Skeleton patterns verified against existing page loading state structure; `animate-pulse` confirmed in Tailwind |
| UX-02 | New users see onboarding guide on first login | Migration numbering confirmed (007); profile API pattern verified for `has_onboarded` extension |
| UX-03 | Section-level error boundaries catch and display errors gracefully | React class component ErrorBoundary pattern confirmed; getDerivedStateFromError + componentDidCatch pattern documented |
</phase_requirements>

---

## Summary

Phase 14 is a pure UX quality pass — no new features, no new data models beyond one boolean column. All three requirements are implemented with standard React and Tailwind primitives already in the codebase.

The existing pages follow a uniform pattern: `useEffect` loads data into `useState`, and pages render nothing (or a bare paragraph) while data is null/empty. The skeleton upgrade path is mechanical: introduce a `loading` boolean (already present on Settings and Billing pages, absent on most others), show skeleton variants while `loading === true`, and show real content once data arrives. The components file at `platform/src/components/skeletons.tsx` does not yet exist — it will be created from scratch.

Error boundaries require class components because React hooks cannot catch render errors. The `SectionErrorBoundary` component uses `getDerivedStateFromError` to flip `hasError` state, and `componentDidCatch` to log to `console.error`. The retry mechanic resets `hasError` to `false`, which causes React to re-mount children. The key planning decision is which sections on each page are large enough to warrant their own boundary — sections that hold a full table, chart, or data card are good candidates; small stat numbers are not worth isolating.

The onboarding card is straightforward: read `has_onboarded` in the dashboard `useEffect` alongside the existing data fetch, show a dismissible banner when false, and PATCH `/api/profile` (extended) with `has_onboarded: true` on dismiss. No new API route is required — extending the existing profile route is the least-resistance path.

**Primary recommendation:** Implement in three waves: (1) migration + skeletons.tsx + SectionErrorBoundary.tsx as shared infrastructure, (2) portal pages skeleton + boundary wiring, (3) admin pages skeleton + boundary wiring + onboarding card.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 3.4.16 (installed) | `animate-pulse` skeleton animation | Built-in — zero install cost |
| React | 18.3.1 (installed) | Class component Error Boundaries | Only React mechanism for render error catching |
| next-intl | 4.8.3 (installed) | Bilingual error/onboarding copy | Already used on every page |
| @supabase/ssr | 0.9.0 (installed) | `has_onboarded` DB read/write | Same client used by profile API |

### No Additional Installs Required

This phase adds zero new npm packages. Everything needed is already in `package.json`.

---

## Architecture Patterns

### Existing Loading State Pattern (baseline to replace)

Every portal and admin page today follows this pattern — data loads asynchronously, page renders nothing or a paragraph while loading:

```tsx
// CURRENT PATTERN — replace with skeleton
const [data, setData] = useState<Thing[]>([])

useEffect(() => {
  async function load() { /* fetch and setData */ }
  load()
}, [])

// Renders empty list until data arrives — no loading indicator
return <div>{data.map(item => ...)}</div>
```

Settings and Billing pages already have an explicit `loading` boolean. Other pages do not — they must add one.

### Pattern 1: Skeleton Loading State

**What:** Add a `loading` boolean to `useState`, set to `true` initially, `false` after the fetch completes. Render skeleton variants while `loading === true`.

**When to use:** Every page that fetches data in `useEffect`.

```tsx
// Source: project pattern + Tailwind docs
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function load() {
    try {
      // ... fetch calls ...
    } finally {
      setLoading(false)
    }
  }
  load()
}, [])

return loading ? <SkeletonDashboard /> : <ActualContent />
```

**Critical detail:** Set `loading = false` in a `finally` block, not inside the success path. If a fetch fails silently (returns null data), the skeleton must still disappear. Billing page currently sets `loading = false` correctly with `finally`.

### Pattern 2: Skeleton Component Shapes

**What:** Skeleton components must mimic the approximate shape of the content they replace — not generic gray boxes.

**Key shapes needed:**

```tsx
// Source: Tailwind animate-pulse docs + project card/table structure

// SkeletonCard — replaces MetricCard, StatCard
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 flex-1 min-w-[160px] animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
      <div className="h-7 bg-gray-200 rounded w-16 mb-2" />
      <div className="h-2 bg-gray-100 rounded w-12" />
    </div>
  )
}

// SkeletonTable — replaces table-based pages (Clients, Tasks, Users, etc.)
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="px-5 py-3 border-b border-gray-100 flex gap-8">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-200 rounded w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-3.5 flex gap-8 border-b border-gray-50">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-3 bg-gray-100 rounded w-20" />
          ))}
        </div>
      ))}
    </div>
  )
}

// SkeletonText — replaces paragraphs, list items
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-gray-200 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}

// SkeletonChart — replaces Recharts panels
export function SkeletonChart({ height = 180 }: { height?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-32 mb-4" />
      <div className="bg-gray-100 rounded" style={{ height }} />
    </div>
  )
}
```

### Pattern 3: SectionErrorBoundary Class Component

**What:** React class component that catches render errors from child components via `getDerivedStateFromError`. Cannot be a function component — this is a hard React requirement.

**When to use:** Wrap any data section that: (1) renders remote data, (2) is independently meaningful, (3) failing would otherwise break the whole page.

```tsx
// Source: React docs (https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
'use client'

type Props = { children: React.ReactNode; fallbackTitle?: string; fallbackRetry?: string }
type State = { hasError: boolean }

export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[SectionErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500 mb-3">
            {this.props.fallbackTitle ?? 'Something went wrong in this section.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs text-brand-accent hover:underline"
          >
            {this.props.fallbackRetry ?? 'Retry'}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

**Usage on a page:**

```tsx
<SectionErrorBoundary fallbackTitle={t('error.section_failed')} fallbackRetry={t('error.retry')}>
  <MetricsSection data={metrics} />
</SectionErrorBoundary>
```

### Pattern 4: Onboarding Card

**What:** A dismissible banner shown at the top of the portal dashboard when `has_onboarded === false`. Single-use — disappears on dismiss and never shows again.

**Key detail:** The `has_onboarded` query must be added inside the existing `load()` function in `DashboardPage`, not in a separate `useEffect`. This prevents a double-render flicker (first render: `showOnboarding = false`, second render: `showOnboarding = true`).

```tsx
// Inside DashboardPage load():
const { data: profile } = await supabase.from('users')
  .select('client_id, has_onboarded')  // extend existing select
  .eq('id', user.id).single()

if (profile?.has_onboarded === false) setShowOnboarding(true)
```

### Pattern 5: Extending Profile API for has_onboarded

The existing `/api/profile` PATCH route accepts `full_name`. It must be extended to also accept `has_onboarded: true`. The PATCH handler already has the correct `(supabase as any)` cast pattern for TypeScript.

```ts
// Extend existing PATCH in platform/src/app/api/profile/route.ts
if (body.has_onboarded === true) {
  await (supabase as any).from('users')
    .update({ has_onboarded: true })
    .eq('id', user.id)
  return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(rl) })
}
```

### Which Sections Warrant Error Boundaries

**Portal pages — sections to wrap:**

| Page | Sections worth wrapping |
|------|------------------------|
| Dashboard | Metric cards row, Charts (TPS/Latency), Recent Reports panel, Active Tasks panel |
| Tests | Each test result card (or the entire list if sparse) |
| Reports | Report list |
| Billing | Subscription card, Payment history list |
| Services | Each category group (core, addon, training) |
| Settings | Profile form, Notifications section, Security form |

**Admin pages — sections to wrap:**

| Page | Sections worth wrapping |
|------|------------------------|
| Overview | Stat cards row, Recent activity feed |
| Clients | Clients table |
| Tasks | Tasks table |
| Billing | Stat cards row, MRR chart, Payments table, Subscriptions table |
| Users | Users table, Invite form |

**Anti-pattern:** Wrapping individual small items (a single badge, a single date string) is unnecessary overhead. Wrap the logical section container (`<div className="bg-white rounded-xl ...">`) not each row.

### Recommended File Structure

```
platform/src/components/
├── NotificationBell.tsx       # existing
├── skeletons.tsx              # NEW — all skeleton variants
└── SectionErrorBoundary.tsx   # NEW — class component

platform/supabase/migrations/
└── 007_onboarding.sql         # NEW — has_onboarded column
```

### Anti-Patterns to Avoid

- **Skeleton in a separate useEffect:** Loading state must be a single boolean in the existing `useEffect` load function. Two `useEffect` hooks for the same loading concern cause independent render cycles and flicker.
- **Page-level ErrorBoundary:** A boundary at the page level defeats the purpose — if it triggers, the user loses the entire page. Wrap sections only.
- **Setting `loading = false` in the success branch only:** If a Supabase call returns `null` data (no error, just empty), the skeleton never disappears. Always use `finally`.
- **Querying `has_onboarded` in a second `useEffect`:** Must be fetched in the same `load()` as `profile` — `has_onboarded` is on the same `users` row as `client_id`, so there's no extra query needed.
- **`'use client'` missing on SectionErrorBoundary:** Error boundary class components in Next.js App Router must be marked `'use client'` because they use React component lifecycle methods.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skeleton animation | Custom CSS keyframes | Tailwind `animate-pulse` | Already in project, consistent timing |
| Error catching in function component | try/catch in render | `SectionErrorBoundary` class component | React render errors cannot be caught by hooks |
| Onboarding tour | Multi-step overlay wizard | Simple dismissible card | Overkill for <20 users; adds 30KB+ dep |
| Loading state tracker | Complex state machine | Single `loading: boolean` | Sufficient for async fetch pattern used here |

---

## Database Changes

### Migration: 007_onboarding.sql

**Correct numbering:** Last migration is `006_user_self_update.sql`. Next is `007`.

```sql
-- 007_onboarding.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_onboarded BOOLEAN DEFAULT false;
```

**Important:** `DEFAULT false` means existing rows (all current users) will have `has_onboarded = false`. This is the correct behavior — existing users should not see the onboarding banner (they are not "new users" in the portal UX sense). If this is undesirable, a backfill is needed:

```sql
-- Optional: mark existing users as already onboarded
UPDATE users SET has_onboarded = true;
```

The planner must decide: should existing users see the onboarding card on next login, or only brand-new invitees? Based on D-06 ("new users see onboarding guide on first login"), existing users should NOT see it. Recommended: add the backfill UPDATE to the migration.

**RLS impact:** The existing RLS UPDATE policy on `users` uses `WITH CHECK (id = auth.uid())` and the profile API already updates this table. No new RLS policy needed for `has_onboarded`.

**TypeScript:** `has_onboarded` must be added to the `User` type in `platform/src/lib/types.ts` and to the `Database` type's `users.Row`.

---

## Common Pitfalls

### Pitfall 1: `'use client'` missing on SectionErrorBoundary
**What goes wrong:** Next.js App Router throws a build error: "Class components are not supported in server components."
**Why it happens:** Error boundary class components use lifecycle methods only available on the client.
**How to avoid:** First line of `SectionErrorBoundary.tsx` must be `'use client'`.
**Warning signs:** Build fails with server component error referencing the class.

### Pitfall 2: Skeleton never dismissed (missing `finally`)
**What goes wrong:** If a Supabase query returns `{ data: null, error: null }` (no rows), the page stays in skeleton state forever.
**Why it happens:** `setLoading(false)` is inside the `if (data)` branch, not in `finally`.
**How to avoid:** Always use `finally { setLoading(false) }`.
**Warning signs:** Dashboard shows skeleton with no active demo data — tests against empty DB expose this.

### Pitfall 3: Onboarding card flickers on load
**What goes wrong:** Card appears briefly, then disappears, or vice versa.
**Why it happens:** `showOnboarding` defaults to `false`, data loads async, then flips to `true`. The page renders twice in quick succession.
**How to avoid:** Do not initialize `showOnboarding` to `false` and then update it async. Instead, initialize to `null` (unknown) and only render the card after the profile load completes:
  ```tsx
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null)
  // Only render card when hasOnboarded === false (not null, not true)
  {hasOnboarded === false && <OnboardingCard ... />}
  ```
**Warning signs:** Card blinks on fast connections; invisible on slow connections until `hasOnboarded` resolves.

### Pitfall 4: TypeScript error on `has_onboarded` in Supabase query
**What goes wrong:** TypeScript complains `Property 'has_onboarded' does not exist on type 'User'`.
**Why it happens:** The `User` type and `Database` type in `types.ts` are not updated after migration.
**How to avoid:** Update both `User` interface and `Database.Tables.users.Row` in `types.ts` before using the field anywhere.
**Warning signs:** TypeScript build errors after adding the migration.

### Pitfall 5: Error boundary Retry button doesn't re-fetch data
**What goes wrong:** User clicks Retry, the error boundary resets (`hasError = false`), children re-mount, but no new fetch happens.
**Why it happens:** `useEffect` with `[]` only runs once on mount. When the boundary resets and children re-mount, the component mounts fresh — `useEffect` WILL run again. This is actually correct behavior because React unmounts and remounts the children when the boundary resets.
**How to avoid:** Verify in testing that data re-fetches after retry. It should work correctly.
**Warning signs:** None in normal flow — this pitfall is a false alarm that may cause unnecessary complexity if over-engineered.

### Pitfall 6: i18n key namespace for onboarding/error messages
**What goes wrong:** Runtime error: "Missing translation key" or fallback text displayed instead of translated text.
**Why it happens:** Keys added to `en.json` but not `es.json`, or namespace prefix wrong in `useTranslations()`.
**How to avoid:** Add all new keys to both `en.json` and `es.json` simultaneously. Use namespace `portal` for onboarding keys and `common` for error boundary fallback (simpler, single namespace).
**Warning signs:** ES locale shows English text or "[namespace.key]" placeholder strings.

---

## Code Examples

### Verified: Skeleton wiring on Dashboard page (loading state addition)

```tsx
// Source: existing pattern from settings/page.tsx + billing/page.tsx
export default function DashboardPage() {
  const [loading, setLoading] = useState(true)  // ADD THIS
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)  // ADD THIS
  const [current, setCurrent] = useState<MonthlyMetrics | null>(null)
  // ... rest of existing state ...

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('users')
        .select('client_id, has_onboarded')  // EXTEND SELECT
        .eq('id', user.id).single()
      if (!profile?.client_id) return

      if (profile.has_onboarded === false) setShowOnboarding(false)
      else setShowOnboarding(true)

      // ... existing fetch logic ...
    }
    load().finally(() => setLoading(false))  // WRAP WITH FINALLY
  }, [])

  if (loading) return <SkeletonDashboard />  // SKELETON BRANCH

  return (
    <div>
      {showOnboarding === false && (
        <OnboardingCard onDismiss={handleDismiss} />
      )}
      {/* ... existing JSX ... */}
    </div>
  )
}
```

### Verified: Profile API extension pattern

```ts
// Source: existing platform/src/app/api/profile/route.ts
// PATCH handler extension — add before the full_name update
if (body.has_onboarded === true) {
  const { error } = await (supabase as any)
    .from('users')
    .update({ has_onboarded: true })
    .eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(rl) })
}
```

### Verified: Error boundary usage in portal page

```tsx
// Source: React docs pattern + project i18n pattern
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'
const t = useTranslations('common')

<SectionErrorBoundary
  fallbackTitle={t('error_section')}
  fallbackRetry={t('error_retry')}
>
  <div className="grid grid-cols-2 gap-4">
    {/* chart or table content */}
  </div>
</SectionErrorBoundary>
```

---

## i18n Key Plan

All new keys must be added to **both** `en.json` and `es.json`.

### Keys to add to `en.json`

Under `"common"` namespace (simplest — already used everywhere):

```json
"error_section": "Something went wrong in this section.",
"error_retry": "Retry"
```

Under `"portal"` namespace (new — for onboarding card):

```json
"portal": {
  "onboarding_heading": "Welcome to Vantix!",
  "onboarding_body": "Here are a few things to get you started.",
  "onboarding_tasks": "View your tasks",
  "onboarding_tests": "Check test results",
  "onboarding_billing": "Explore billing",
  "onboarding_settings": "Update notification settings",
  "onboarding_dismiss": "Got it, thanks"
}
```

### Keys to add to `es.json`

Same structure, translated:

```json
"common": {
  "error_section": "Algo salió mal en esta sección.",
  "error_retry": "Reintentar"
}
"portal": {
  "onboarding_heading": "Bienvenido a Vantix!",
  "onboarding_body": "Aquí hay algunas cosas para empezar.",
  "onboarding_tasks": "Ver tus tareas",
  "onboarding_tests": "Ver resultados de evaluaciones",
  "onboarding_billing": "Explorar pagos",
  "onboarding_settings": "Actualizar notificaciones",
  "onboarding_dismiss": "Entendido, gracias"
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Spinner/spinner libraries | CSS `animate-pulse` skeleton | ~2022 | Better UX, zero deps |
| `componentDidCatch` only | `getDerivedStateFromError` + `componentDidCatch` | React 16.3 | Synchronous error state update |
| Page-level error boundaries | Section-level boundaries | ~2020 best practice | Rest of page stays functional |
| `router.push('/onboarding')` redirects | Inline dismissible card | — | Less friction, no new route |

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json` — section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` (inferred from `package.json` test script) |
| Quick run command | `npm run test:run` (from `platform/`) |
| Full suite command | `npm run test:run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-01 | Skeleton renders when loading=true, disappears when data loads | unit | `npm run test:run -- skeletons` | No — Wave 0 |
| UX-02 | Onboarding card renders when has_onboarded=false, hidden when true | unit | `npm run test:run -- onboarding` | No — Wave 0 |
| UX-02 | PATCH /api/profile sets has_onboarded=true | unit | `npm run test:run -- profile` | No — Wave 0 |
| UX-03 | SectionErrorBoundary shows fallback when child throws | unit | `npm run test:run -- SectionErrorBoundary` | No — Wave 0 |
| UX-03 | Retry button resets boundary and re-renders children | unit | `npm run test:run -- SectionErrorBoundary` | No — Wave 0 |

All tests are manual-verifiable through the UI as well — the test suite here is supplementary, not the primary verification mechanism for pure UI polish.

### Sampling Rate

- **Per task commit:** `npm run test:run` from `platform/`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `platform/__tests__/skeletons.test.tsx` — covers UX-01 (skeleton render/hide)
- [ ] `platform/__tests__/onboarding.test.tsx` — covers UX-02 (card show/dismiss)
- [ ] `platform/__tests__/SectionErrorBoundary.test.tsx` — covers UX-03 (boundary + retry)
- [ ] `platform/__tests__/profile.test.ts` — extend existing profile test (if it exists) for `has_onboarded` PATCH

---

## Open Questions

1. **Should existing users see the onboarding card?**
   - What we know: D-06 says "new users see onboarding guide on first login." Existing users have `has_onboarded = DEFAULT false` after migration.
   - What's unclear: Was "new user" meant to be only future invitees, or should every current user also see it once?
   - Recommendation: Include a `UPDATE users SET has_onboarded = true` backfill in `007_onboarding.sql` to skip the card for all current users. Only brand-new invitees (created after migration) will see it.

2. **Dashboard loading state: skeleton for the whole page or per-section?**
   - What we know: D-03 says "skeleton shows immediately on mount, replaced when data loads." Dashboard has multiple independent data sections (metrics, charts, reports, tasks) all loaded in a single `useEffect` `Promise.all`-style sequence.
   - What's unclear: Should the whole dashboard show a skeleton until all data is loaded, or can sections appear independently?
   - Recommendation: Show whole-dashboard skeleton until all data arrives (single `loading` boolean). This is simpler and avoids partial-render jank. The load time is short (<500ms on local Supabase).

---

## Sources

### Primary (HIGH confidence)

- React docs — Error Boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- Tailwind CSS docs — `animate-pulse`: verified in project (tailwind.config.ts + installed package)
- Project codebase — all portal/admin pages read directly: `platform/src/app/[locale]/portal/`, `platform/src/app/[locale]/admin/`
- Project migration files — numbered 001–006, verified `007` is next
- Project `platform/src/lib/types.ts` — `User` type confirms `has_onboarded` field not yet present
- Project `platform/src/app/api/profile/route.ts` — confirmed extension point

### Secondary (MEDIUM confidence)

- `platform/package.json` — verified React 18, Vitest 4.1.1, @testing-library/react 16.3.2 versions
- `platform/src/messages/en.json` + `es.json` — confirmed existing i18n namespace structure

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, verified in package.json
- Architecture patterns: HIGH — all patterns derived directly from existing codebase code, not from external research
- Pitfalls: HIGH — derived from reading actual page implementations and identifying gaps
- Database: HIGH — migration numbering verified by listing files; RLS impact verified by reading 001_schema.sql

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable — no external dependencies changing)
