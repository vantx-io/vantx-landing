# Coding Conventions

**Analysis Date:** 2026-03-20

## Naming Patterns

**Files:**
- Next.js pages: `page.tsx` and `layout.tsx` (App Router convention)
- Next.js API routes: `route.ts`
- Library modules: `camelCase.ts` (e.g., `stripe.ts`, `types.ts`, `client.ts`, `server.ts`)
- k6 scenarios: `kebab-case.js` (e.g., `load-stress.js`, `synthetic.js`, `uptime.js`)
- k6 lib modules: `camelCase.js` (e.g., `checks.js`, `metrics.js`, `config.js`)
- k6 client configs: `kebab-case.js` (e.g., `novapay.js`, `_template.js`)
- Scripts: `kebab-case.js` (e.g., `push-to-supabase.js`, `generate-weekly.js`, `seed-demo.js`)

**Functions:**
- React components: PascalCase (e.g., `MetricCard`, `Badge`, `DashboardPage`, `PortalLayout`)
- Event handlers: `handle` prefix + action (e.g., `handleLogin`, `handleLogout`, `handleCheckout`)
- Data loaders: named `load` as inner async functions inside `useEffect`
- Utility functions: camelCase (e.g., `getPriceId`, `formatCurrency`, `getOrCreateCustomer`, `createPortalSession`)
- k6 exports: standard k6 API names (`authenticate`, `pickEndpoint`, `handleSummary`)

**Variables:**
- camelCase throughout TypeScript and JavaScript
- Short aliases accepted inline for brevity (e.g., `c = current`, `p = previous`, `cid = profile.client_id`)
- k6 metric names: `vantix_snake_case` prefix (e.g., `vantix_synthetic_duration`, `vantix_uptime_check`)

**Types and Interfaces:**
- All in `src/lib/types.ts` — named with PascalCase (e.g., `Client`, `User`, `Subscription`, `TestResult`)
- Database shape typed via `Database` type wrapping all table row/insert/update variants
- Enums expressed as string literal unions (e.g., `'active' | 'paused' | 'cancelled'`)
- Record types for color/label maps: `Record<string, string>` (e.g., `priorityColors`, `statusColors`)

## Code Style

**Formatting:**
- No Prettier config present — formatting is done by hand/editor
- Compact single-line style used heavily: multi-prop objects and interface definitions collapsed onto one line
- Inline ternaries preferred for simple conditional rendering over verbose if/else
- Tailwind classes written inline on JSX elements (no CSS-in-JS, no separate style files)

**Linting:**
- ESLint via `eslint-config-next` (`eslint: ^8.57.0`)
- No custom `.eslintrc` — uses Next.js defaults
- TypeScript strict mode enabled (`"strict": true` in `tsconfig.json`)

**TypeScript:**
- Strict mode on; non-null assertions (`!`) used frequently for env vars (e.g., `process.env.STRIPE_SECRET_KEY!`)
- `any` used sparingly and only in catch blocks (`catch (err: any)`) and for JSON arrays from Supabase
- `as` type casts used after Supabase queries to assert typed rows (e.g., `data as Task[]`)
- `type` imports used for types, `import` for values (e.g., `import type { Task }`)

## Import Organization

**Order (TypeScript/TSX):**
1. React and Next.js framework imports (`'react'`, `'next/server'`, `'next/navigation'`)
2. Third-party SDKs (`'stripe'`, `'recharts'`, `'lucide-react'`)
3. Internal lib imports via path alias (e.g., `@/lib/supabase/client`, `@/lib/stripe`, `@/lib/types`)

**Path Aliases:**
- `@/*` maps to `./src/*` — use `@/lib/...`, `@/app/...` for all internal imports

**k6 JavaScript:**
- k6 built-ins first (`'k6'`, `'k6/http'`, `'k6/metrics'`, `'k6/data'`)
- Internal lib imports second (`'../lib/config.js'`, `'../lib/metrics.js'`)
- ES module syntax (`import`/`export`) used in k6 scripts
- Node.js scripts use CommonJS (`require`/`module.exports`)

## Error Handling

**API routes (Next.js):**
- All route handlers use `try/catch` wrapping the full body
- Errors returned as `NextResponse.json({ error: err.message }, { status: 400 })`
- No differentiation of error status codes beyond 400 vs 200

**Client components:**
- Errors caught in handlers but mostly suppressed — minimal error state in UI
- Auth errors shown inline (e.g., `setError(error.message)` in login)
- Network errors in client pages caught with `catch (err) { console.error(err) }`

**k6 scenarios:**
- Silent failures preferred — empty `catch {}` blocks where errors are non-critical
- Explicit `console.error(...)` for actionable failures (auth failure, service down)
- `handleSummary` used for structured JSON output, never throws

**Supabase queries:**
- Destructured as `const { data, error }` — error often ignored at call site
- Error checked conditionally: `if (error) console.error(...)`

## Logging

**Framework:** `console.log` / `console.error` (no structured logging library)

**Patterns:**
- Next.js app: minimal logging — only `console.error(err)` in catch blocks
- k6 scenarios: `console.error()` for failure events only
- Node.js scripts: verbose `console.log()` for operational status (progress, counts, summaries)
- k6 uptime/synthetic failure: prefixed with `🔴 {client} DOWN —` pattern

## Comments

**When to Comment:**
- File header blocks used in k6 lib files (JSDoc-style with `/** */`)
- Section separators with `═══` decorators for visual grouping (e.g., `// ═══ SYNTHETIC MONITORING METRICS ═══`)
- Inline comments for non-obvious logic (e.g., `// k6 doesn't support dynamic imports`, `// Replace {token} placeholder`)
- `TODO`-style comments not found in codebase

**JSDoc/TSDoc:**
- Used in k6 library files (`lib/checks.js`, `lib/metrics.js`, `lib/config.js`) for exported functions
- Not used in TypeScript source files — type signatures serve as documentation

## Function Design

**Size:** Functions tend to be compact; large React components inline all sub-rendering rather than extracting sub-components. `DashboardPage` is ~155 lines, all inline.

**Parameters:** Prop interfaces defined inline as object destructure in function signature (e.g., `{ label, value, unit, prev, good }: { label: string; ... }`)

**Return Values:**
- Components always return JSX
- API handlers return `NextResponse.json(...)`
- k6 `handleSummary` returns `{ stdout: string, [file]: string }` object
- Utility functions return typed values — `string`, `Promise<string>`, etc.

## Module Design

**Exports:**
- Next.js pages: single `export default` per file
- API routes: named exports matching HTTP methods (`export async function POST(req: Request)`)
- Library modules: named exports for all utilities, no default export (except k6 client configs)
- k6 scenarios: default export for the test function, named exports for `options` and `handleSummary`

**Barrel Files:** None — direct imports from specific module paths only

**Supabase Client Pattern:**
- `src/lib/supabase/client.ts` — browser client via `createBrowserClient`, exported as factory `createClient()`
- `src/lib/supabase/server.ts` — server client via `createServerClient`, two factories: `createServerSupabase()` and `createServiceClient()` (service role key)
- Service client used in API routes; browser client used in client components

**Color/Status Maps:**
- Status-to-color `Record<string, string>` maps defined at module scope per page (not shared)
- Repeated across `page.tsx` files — `Badge` component also redefined per file

---

*Convention analysis: 2026-03-20*
