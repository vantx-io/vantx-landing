# Stack Research

**Domain:** Platform v1.1 — Testing, Admin Dashboard, Notifications, File Uploads
**Researched:** 2026-03-24
**Confidence:** HIGH (testing stack from Next.js official docs; email/upload recommendations from ecosystem knowledge at training cutoff + official docs; versions need `npm install` to resolve latest — no pinned versions from research tools available)

---

## Context: What Already Exists (Do NOT Re-research)

The platform is Next.js 14.2.18 + TypeScript 5.7 + Tailwind 3.4 running on Supabase (`@supabase/supabase-js` ^2.47, `@supabase/ssr` ^0.9). Authentication, RLS, Stripe v17.4 webhooks, Grafana Cloud, Slack API, next-intl 4.8, Recharts, Lucide icons — all in place.

Everything below is **additions only**.

---

## Recommended Stack

### 1. Testing Framework

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `vitest` | latest (^3.x as of March 2026) | Unit + component test runner | Next.js official recommendation over Jest for new projects. Native ESM, faster than Jest, Vite-compatible config, TypeScript-first. Next.js 14 docs explicitly guide Vitest setup. |
| `@vitejs/plugin-react` | latest | JSX transform for Vitest | Required by the official Next.js + Vitest setup to handle React JSX. |
| `@testing-library/react` | latest (^16.x) | Render components in jsdom | The standard React testing utility — works identically in Vitest and Jest. Paired with Vitest it requires no extra transform. |
| `@testing-library/user-event` | latest (^14.x) | Simulate real user interactions | Replaces `fireEvent` for click, type, keyboard events. Produces more realistic interaction tests than `fireEvent`. |
| `@testing-library/dom` | latest | DOM queries (implicit dep) | Pulled in by `@testing-library/react`; list explicitly for transparency. |
| `jsdom` | latest | Browser DOM simulation | The test environment for component rendering in Node. Standard choice; `happy-dom` is faster but less compatible. |
| `vite-tsconfig-paths` | latest | Resolve `@/` path aliases | The platform uses `@/lib/...` path aliases in `tsconfig.json`. Without this Vitest throws module-not-found errors. |
| `@playwright/test` | latest (^1.49+ as of March 2026) | E2E testing: auth flows, billing, admin routes | Playwright is the Next.js-recommended E2E tool. Tests against real browser (Chromium/Firefox/WebKit). Critical for testing async Server Components, which Vitest cannot render. |

**Why Vitest over Jest:** Jest requires `jest-environment-jsdom` + `@types/jest` + `ts-node` + `babel-jest` or `@swc/jest`. Vitest uses Vite's transformer — same TSConfig, same path aliases, zero extra config for TypeScript. The official Next.js docs updated the Vitest guide more recently than Jest.

**Why Playwright over Cypress for E2E:** Playwright has better TypeScript support, runs tests in parallel across browsers by default, and the Next.js docs maintain an active `with-playwright` example. Cypress is an alternative but heavier on CI resources.

### 2. Admin Dashboard UI

No new UI framework needed. The existing stack (Tailwind + Lucide + Recharts) covers everything. The only potential addition is Radix UI primitives for accessible dialogs/dropdowns in the admin flow.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@radix-ui/react-dialog` | latest (^1.x) | Accessible modal dialogs for admin actions (suspend client, edit subscription) | Headless, unstyled, WCAG 2.1 AA out of the box. Tailwind-compatible. Avoids building accessible focus-trap logic from scratch. The platform already uses a similar pattern. |
| `@radix-ui/react-dropdown-menu` | latest (^2.x) | Context menus on admin tables (edit, suspend, cancel actions) | Same rationale as Dialog. Keyboard-navigable by default. |
| `@radix-ui/react-select` | latest (^2.x) | Styled select for role/status filters in admin | The native `<select>` is hard to style consistently. Radix Select is the standard fix. |

**Alternative considered:** shadcn/ui — a collection of copy-paste components built on Radix. Better for greenfield apps. For an existing codebase already styled with custom Tailwind classes, adding shadcn would introduce style conflicts and require migration work. Use raw `@radix-ui` primitives instead and style them in-place.

### 3. In-App Notifications

No new packages required. `@supabase/supabase-js` ^2.47 includes the full Realtime API.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase Realtime (built-in) | via `@supabase/supabase-js` ^2.47 | Push in-app notifications to connected clients | Already in `package.json`. The client exposes `supabase.channel().on('postgres_changes', ...)`. Subscribe to an `INSERT` on a new `notifications` table — no polling, no websocket library needed. |

**Implementation pattern:** Add a `notifications` table to Supabase (user_id, type, title, body, read, created_at). In the portal layout (`src/app/[locale]/portal/layout.tsx`), subscribe on mount using `supabase.channel('notifications').on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + userId}, ...)`. No new package.

**Why not a separate notification service (Pusher, Ably):** The app is already on Supabase. Realtime Postgres Changes is a first-class feature. Adding a second WebSocket provider doubles infrastructure surface and billing.

### 4. Transactional Email

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `resend` | latest (^4.x as of March 2026) | Send transactional emails (payment confirmation, new task assigned, subscription status change) | Resend is the de-facto standard for TypeScript/Next.js transactional email in 2025-2026. Built by the React Email team. Clean Node.js SDK. Free tier covers 3,000 emails/month — sufficient for Vantix's scale. |
| `@react-email/components` | latest (^0.0.x) | Build email templates with React JSX | Produces cross-client HTML email (Outlook, Gmail, Apple Mail compatible). Co-maintained by Resend. Templates are `.tsx` files that look like React — no MJML, no raw HTML table layouts. |
| `react-email` | latest (^3.x) | Local email preview server (`react-email dev`) | Lets the team preview and iterate on email templates at `localhost:3000` without sending real emails. Dev dependency only. |

**Why Resend over SendGrid/Mailgun/SES:** SendGrid and Mailgun have verbose SDKs with poor TypeScript types. SES requires AWS setup and more config. Resend has a dead-simple API (`resend.emails.send({from, to, subject, react: <YourTemplate />})`), first-class React support, and is built specifically for the Next.js/Vercel ecosystem. At Vantix's 5-50 client scale, it's the fastest path from zero to working transactional email.

**Why React Email over raw HTML strings or Handlebars:** The platform is already TypeScript/React throughout. React Email means email templates get the same type safety, component reuse, and tooling as the rest of the app. No context switch to a templating language.

### 5. File Uploads (Task Attachments)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase Storage (built-in) | via `@supabase/supabase-js` ^2.47 | Store files uploaded to task comments | Already available — no new backend or S3 bucket needed. `supabase.storage.from('attachments').upload(path, file)`. Supports private buckets with RLS policies matching the existing `tasks`/`task_comments` RLS pattern. |
| `react-dropzone` | latest (^14.x) | Drag-and-drop + file-picker UI in comment inputs | The lightest-weight, headless file-drop UI library for React. Handles MIME type validation, multiple files, disabled state, drag-over styling. No opinionated styling — fits the existing Tailwind component style. ~7KB gzipped. |

**Why Supabase Storage over Cloudinary/S3 direct:** The platform already uses Supabase for auth + DB. Supabase Storage uses the same JWT for authorization — the same `createClient()` call in `src/lib/supabase/client.ts` accesses storage. Adding S3 or Cloudinary would require a separate API route, separate credentials, and a separate auth check. Supabase Storage eliminates all of that.

**Why react-dropzone over `<input type="file">`:** A bare file input works for simple cases but gives no drag-and-drop, no multi-file progress feedback, and no MIME filtering. `react-dropzone` adds all of that with a minimal API (`useDropzone` hook). Alternative: `filepond` — more opinionated styling, harder to match the existing UI. Not needed here.

**File size limits:** Supabase Storage free tier allows up to 50MB per file and 1GB total. Task attachments (screenshots, logs, CSV exports) will stay well under 10MB. Standard upload (not resumable) is correct for this use case.

---

## Installation

```bash
# Testing — dev dependencies only
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event vite-tsconfig-paths

# E2E testing
npm install -D @playwright/test
npx playwright install --with-deps chromium  # CI: add firefox webkit if needed

# Admin UI primitives (only if admin dialogs/dropdowns are built)
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select

# Transactional email
npm install resend @react-email/components
npm install -D react-email

# File upload UI
npm install react-dropzone
```

No new backend services, Docker containers, or environment variables required except:
- `RESEND_API_KEY` — get from resend.com dashboard (free tier is sufficient)
- Supabase Storage bucket `attachments` — created via `supabase/migrations` or dashboard, no new env vars

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vitest | Jest | If the team has existing Jest expertise and many existing Jest tests to preserve. Not the case here — zero tests currently. |
| Playwright | Cypress | If component testing (not just E2E) is needed at the visual level. Cypress has a component test runner; Playwright does not. |
| Resend + React Email | SendGrid | If the organization has a corporate SendGrid contract or requires enterprise SLA email delivery with IP warming. |
| Resend + React Email | Nodemailer + SMTP | If self-hosting email via SMTP relay (e.g., company mail server). Not relevant for a SaaS at this stage. |
| Supabase Storage | Cloudinary | If rich media transformation (auto-resize, format convert, CDN optimization) is needed for images. Task attachments are documents/screenshots — no transformation needed. |
| react-dropzone | FilePond | If a fully-styled out-of-the-box upload widget with progress indicators is acceptable. FilePond's styling overrides conflict with the existing Tailwind dark/custom design. |
| @radix-ui primitives | shadcn/ui | For a greenfield project. shadcn is excellent but assumes you build components from scratch; adapting it to an existing styled codebase is effort-heavy. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Jest (for new tests) | Requires `babel-jest` or `@swc/jest` transformer + `jest-environment-jsdom` + `ts-node` — 5+ packages vs Vitest's 3. Slower watch mode. Next.js docs are steering toward Vitest for new projects. | Vitest |
| Cypress for E2E | Heavier CI footprint (Electron), slower startup, requires separate `cypress run` process. Playwright runs headless Chromium natively with better TypeScript support. | Playwright |
| Pusher / Ably | Adds a paid third-party WebSocket service when Supabase Realtime is already included in the existing subscription. | Supabase Realtime (built-in) |
| Nodemailer | Requires SMTP credentials, has no React template support, produces raw HTML strings that break in Outlook. A 2010-era solution for a 2026 TypeScript app. | Resend + React Email |
| AWS S3 direct upload | Requires new IAM user, new env vars, pre-signed URL logic, and separate auth. Zero benefit vs Supabase Storage for an app already on Supabase. | Supabase Storage |
| Uploadthing | Popular in the Next.js content creator ecosystem but adds another service + secret key. Unnecessary when Supabase Storage is already available and colocated with the DB. | Supabase Storage |
| MSW (Mock Service Worker) for unit tests | Useful for API mocking in browser-based integration tests. At this stage, mocking Supabase with `vi.mock('@/lib/supabase/client')` in Vitest is simpler and sufficient. Revisit if API surface grows significantly. | `vi.mock()` in Vitest |

---

## Stack Patterns by Variant

**For async Server Components (e.g., admin dashboard pages that fetch data server-side):**
- Use Playwright E2E tests — Vitest cannot render async RSC
- Test the rendered HTML in Playwright, not the component directly

**For Client Components (e.g., TasksPage, portal layout):**
- Use Vitest + React Testing Library
- Mock `createClient()` with `vi.mock('@/lib/supabase/client')` to avoid real Supabase calls in unit tests

**For Supabase Storage uploads in task comments:**
- Upload directly from browser using `supabase.storage.from('attachments').upload()`
- No Next.js API route needed — the browser client handles auth via the existing JWT
- Use a `private` bucket with a storage policy: `storage.foldername[0] = auth.uid()` to scope files per user

**For email triggers (Stripe webhooks, task assignments):**
- Send emails from existing API routes: `src/app/api/webhooks/stripe/route.ts` already handles payment events
- Add a `resend.emails.send()` call inside the webhook handler after updating the DB
- New task assignment emails: trigger from the admin route that creates/updates tasks

**For admin dashboard role gating:**
- The `User` type already has `role: 'admin' | 'engineer' | 'seller' | 'client'`
- Gate admin routes in middleware (`src/middleware.ts`) by checking `user.role === 'admin'` after the existing auth check
- No new auth library needed

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `vitest` latest | `next` 14.2.18, `typescript` 5.7 | HIGH confidence — Next.js official docs confirm this pairing. Async Server Components cannot be unit-tested with Vitest (use Playwright instead). |
| `@playwright/test` latest | `next` 14.2.18 | HIGH confidence — Next.js official docs include active `with-playwright` example maintained at Next.js canary. |
| `@testing-library/react` ^16 | React 18.3 | HIGH confidence — RTL v16 targets React 18. The project uses React 18.3.1. |
| `resend` latest | Next.js 14 Route Handlers | MEDIUM confidence — training data + official Resend Node.js SDK docs. No known breaking changes with Next.js 14 App Router. |
| `@react-email/components` latest | `resend` latest | MEDIUM confidence — both are maintained by the same team; designed to work together. |
| `react-dropzone` ^14 | React 18.3 | MEDIUM confidence — training data. react-dropzone is a stable, low-churn library. Check npm for exact current version at install time. |
| `@radix-ui/*` latest | Tailwind 3.4, React 18.3 | HIGH confidence — Radix UI is headless and framework-agnostic. No known Tailwind conflicts. |
| Supabase Storage | `@supabase/supabase-js` ^2.47 | HIGH confidence — Storage is part of the official JS client. Same `createClient()` instance used for DB access also handles storage. |
| Supabase Realtime | `@supabase/supabase-js` ^2.47 | HIGH confidence — Realtime is in the same client. `supabase.channel()` API is stable since v2.0. |

---

## Sources

- [Next.js Testing Guide — Vitest](https://nextjs.org/docs/app/guides/testing/vitest) — official, verified 2026-03-20, HIGH confidence
- [Next.js Testing Guide — Playwright](https://nextjs.org/docs/app/guides/testing/playwright) — official, verified 2026-03-20, HIGH confidence
- [Next.js Testing Guide — Jest](https://nextjs.org/docs/app/guides/testing/jest) — verified to understand Jest overhead vs Vitest, HIGH confidence
- [Next.js Route Handlers — FormData](https://nextjs.org/docs/app/api-reference/file-conventions/route) — confirmed native FormData support, no multer needed, HIGH confidence
- `/Users/jw.castillo/Desktop/vantix-kit/platform/package.json` — existing stack confirmed, HIGH confidence
- `/Users/jw.castillo/Desktop/vantix-kit/platform/src/lib/types.ts` — `TaskComment.attachments: string[] | null` confirms schema is ready for storage URLs, HIGH confidence
- `/Users/jw.castillo/Desktop/vantix-kit/platform/src/lib/supabase/client.ts` — same `createBrowserClient` instance used for storage + realtime, HIGH confidence
- Resend + React Email ecosystem — MEDIUM confidence (WebFetch blocked to resend.com; based on training data through August 2025 + ecosystem pattern knowledge)
- react-dropzone — MEDIUM confidence (training data; stable library at ^11-14 range; verify exact version at install time)

---

*Stack research for: Vantix Platform v1.1 — Testing, Admin, Notifications, File Uploads*
*Researched: 2026-03-24*
