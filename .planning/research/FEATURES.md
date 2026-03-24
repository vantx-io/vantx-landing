# Feature Research

**Domain:** B2B SRE/performance client portal — v1.1 Platform Hardening & Admin
**Researched:** 2026-03-24
**Confidence:** HIGH (codebase reviewed in depth; all 13 DB tables, 4 role types, and existing code patterns analyzed)

---

## Context: What Already Exists

This research covers NEW features for the v1.1 milestone layered on top of an already-shipped platform:

- Client portal with 8 pages (dashboard, tests, reports, tasks, services, billing, grafana, tutorials)
- Supabase auth with 4 roles: `admin`, `engineer`, `seller`, `client`
- RLS: clients see only their data; admins/engineers see all
- Stripe billing (checkout, webhooks, billing portal)
- Grafana embedded dashboards
- Slack channel creation + welcome messages on onboarding
- 13 DB tables with full RLS
- Bilingual UI (EN/ES) via next-intl
- Task system with comments (`attachments TEXT[]` in schema — no UI, no storage)

**Four new feature areas:**
1. Admin dashboard (internal Vantix team: admin/engineer/seller roles)
2. In-app + email transactional notifications
3. Automated testing (unit, integration, e2e)
4. Task file attachments (UI + Supabase Storage)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features the Vantix team and clients assume exist. Missing these = platform feels half-done or untrustworthy.

#### Admin Dashboard

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Client list with status + plan overview | Admins need a single view of all clients without querying Supabase directly | LOW | Query `clients` + `subscriptions` joined; RLS already allows admin/engineer to see all |
| Per-client subscription status and MRR | Operations need to know who's active, who's paused, what revenue looks like | LOW | `subscriptions` table has `price_monthly`, `status`, `plan` — just aggregate |
| Task cross-client view | Engineers need to see all open tasks across clients to manage workload | MEDIUM | Requires multi-client task list filtered by `assigned_to` + `status`; differs from client-scoped view |
| Onboarding status per client | Know which clients have Grafana provisioned, Slack channel created, etc. | LOW | Leverage existing `clients.grafana_org_id` and `clients.slack_channel` as proxy for completion |
| Client detail panel | View full client record: contact, stack, infra, services, Grafana URL, Slack | LOW | Already modeled in `clients` table — just needs UI |
| Role-gated route protection | `/admin` routes must be unreachable for `client` and `seller` roles | LOW | Middleware check on `user.role` already pattern-established in `middleware.ts` |

#### Notifications

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Email on payment success/failure | Clients expect a receipt; failure needs remediation action | MEDIUM | Stripe webhooks already fire to `/api/webhooks/stripe` — extend handler to send email there |
| Email on new task created (to Vantix team) | Team needs to know a client submitted a request | MEDIUM | Trigger on `task_comments` INSERT or `tasks` INSERT via Supabase webhook or DB function |
| In-app notification bell with unread count | Standard UX pattern in any portal; absence feels like a gap | MEDIUM | Requires `notifications` table (new) + real-time Supabase subscription |
| Mark notifications as read | Expected companion to notification bell | LOW | `is_read` column on `notifications` table, update on click |
| Email on task status change (to client) | Clients need to know when their request moved to `in_progress` or `completed` | MEDIUM | Trigger-based or API-route based; needs transactional email provider |

#### Testing

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Unit tests for utility functions and lib code | Professional codebase standard; protects regressions in `stripe.ts`, `slack.ts`, onboarding | MEDIUM | Jest or Vitest; no DOM needed for pure functions |
| Integration tests for API routes | `/api/webhooks/stripe`, `/api/checkout`, `/api/billing-portal` are money-path — must be tested | HIGH | Need to mock Stripe SDK and Supabase client; test handler logic in isolation |
| E2E test: login flow | Auth is the gate to everything — broken login = broken platform | MEDIUM | Playwright; test that login redirects to portal correctly |
| E2E test: task creation flow | Core client workflow; regression risk on forms | MEDIUM | Playwright; fill form, submit, verify in list |

#### File Attachments

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| File upload UI in task comment composer | `attachments TEXT[]` column exists in DB since day one — visible gap | MEDIUM | `<input type="file">` + Supabase Storage upload + store public URL in array |
| File display in comment thread | Uploaded files must be viewable inline or downloadable | LOW | Render URLs as links or image previews in comment list |
| File type validation (client-side) | Prevent uploading `.exe` or 50MB videos | LOW | Accept attribute + file size check before upload |
| Supabase Storage bucket for attachments | Secure, client-scoped storage with RLS | MEDIUM | Create `task-attachments` bucket; storage policies restrict read to client's own files |

---

### Differentiators (Competitive Advantage)

Features that go beyond the expected and create meaningful value for the Vantix team or clients.

#### Admin Dashboard

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| MRR trend chart by month | Operational visibility into business health; replaces Stripe dashboard browsing | MEDIUM | Aggregate `payments.amount` by month using Recharts (already in dependencies) |
| Client health score indicator | Quick signal: is this client's platform healthy or degrading? | HIGH | Composite of: latest `weekly_metrics.status`, open P1/P2 incidents, task overdue count — requires query logic |
| Quick-action: create task for client | Admins/engineers frequently need to create tasks on behalf of clients | LOW | Reuse existing task form with client selector instead of auto-scoping to session user's client |
| Admin user management (invite, role change) | Admins need to add new engineer/seller/client users without going to Supabase dashboard | HIGH | Supabase Auth `admin.createUser()` via service role key; carefully gated — do not expose in normal API routes |
| Bulk client status update | Pause or cancel multiple subscriptions at once | HIGH | Stripe subscription updates + DB sync; high complexity, low frequency need — defer |

#### Notifications

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Slack notification when task created by client | Vantix team already lives in Slack; routing new task notifications there reduces context switching | LOW | Extend existing `slack.ts` with `postMessage` to the client's channel; webhook trigger on `tasks` INSERT |
| Email digest (weekly summary) | Clients appreciate proactive async communication without needing to log in | HIGH | Requires scheduled job (cron) + email templating — significantly more complex; defer to v1.2 |
| Notification preferences per user | Let users opt out of specific notification types | HIGH | Adds `notification_preferences` table; over-engineering for current team size — defer |

#### Testing

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Test coverage report in CI | Enforces quality gate; documents coverage trend over time | MEDIUM | `--coverage` flag + Codecov or local HTML report |
| Playwright visual regression baseline | Catch unexpected UI changes in portal pages | HIGH | Percy or Playwright screenshot comparison — high value but high maintenance burden; defer to v1.2 |
| Seed data factory for tests | Makes integration and E2E tests deterministic and fast to write | MEDIUM | Helper that inserts known clients/tasks/users and cleans up after; reuses existing `seed.sql` patterns |

#### File Attachments

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Image preview in comment thread | Inline image rendering for screenshots; useful for incident reports and task evidence | LOW | Check `Content-Type` on URL and render `<img>` if image type; otherwise render as link |
| Drag-and-drop file upload | Smoother UX than click-to-browse | MEDIUM | `dragover` + `drop` event handlers; not required for v1.1 but low effort with existing input |
| Upload progress indicator | Supabase Storage upload can be slow for large files; progress bar reduces anxiety | MEDIUM | Supabase JS client does not expose upload progress natively for files — would need XMLHttpRequest or TUS protocol |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time dashboard with live metrics | "Would be cool to see data update live" | Supabase Realtime subscriptions add persistent WebSocket connections; for a low-frequency admin view, the cost/complexity exceeds the benefit; polling every 30s is sufficient | Manual refresh button + 30s poll interval for admin stats |
| Full CMS for tutorial/report management | "Admins should edit tutorials in the portal" | Requires rich text editor (Tiptap, ProseMirror), markdown rendering pipeline, file management, and publish/draft workflow — a milestone on its own | Edit via direct Supabase table editor or a minimal textarea for v1.1; proper CMS in v2 |
| Two-factor authentication | "Security requirement for enterprise" | Supabase Auth supports TOTP 2FA but wiring it into the portal requires additional UI flows (QR code enrollment, recovery codes) — significant scope for a feature affecting every user | Rely on Supabase's magic link / password auth for now; add 2FA in a dedicated security hardening phase |
| File versioning / revision history | "Track changes to attachments" | Requires tracking version chains, storage duplication, and UI to browse versions — complexity that provides marginal value for task-level file attachments | Append new file as new comment; old files remain accessible |
| Notification email from custom domain in v1.1 | "Send from hello@vantx.io" | DNS configuration (SPF, DKIM, DMARC) for a custom domain adds setup complexity; must coordinate with hosting provider | Use provider's verified subdomain (e.g., Resend's default sending domain) in v1.1; migrate to custom domain in v1.2 after DNS is stable |
| Playwright tests for all 8 portal pages | "Maximize coverage" | E2E tests are expensive to write and maintain; testing every page in v1.1 blocks the milestone and has diminishing returns on stable pages | Cover the 3 highest-risk flows (login, task creation, billing redirect) in v1.1; expand systematically in later phases |

---

## Feature Dependencies

```
[Admin Dashboard]
    └──requires──> [Route protection: admin/engineer roles only]
                       └──requires──> [Role check in middleware.ts (pattern exists)]
    └──requires──> [Admin reads all clients] (RLS policy already exists)
    └──enhances──> [Notifications] (admin sees notification center too)

[In-app Notifications]
    └──requires──> [notifications table (NEW — needs migration)]
    └──requires──> [Supabase Realtime subscription in layout]
    └──requires──> [Notification bell UI component in portal layout]

[Email Notifications: payment events]
    └──requires──> [Transactional email provider configured (Resend)]
    └──enhances──> [Stripe webhook handler (already exists at /api/webhooks/stripe)]

[Email Notifications: task events]
    └──requires──> [Transactional email provider configured (Resend)]
    └──requires──> [Supabase DB webhook OR API route trigger on task mutation]

[Slack Notification: new task]
    └──requires──> [slack.ts postMessage function (partially exists)]
    └──requires──> [task_created API route or DB trigger]
    └──enhances──> [existing Slack channel per client (already provisioned)]

[Task File Attachments]
    └──requires──> [Supabase Storage bucket: task-attachments]
    └──requires──> [Storage RLS: client can upload/read own files]
    └──requires──> [File upload UI in task comment form]
    └──uses──> [attachments TEXT[] column in task_comments (already in schema)]

[Automated Testing]
    └──requires──> [Test runner configured (Vitest or Jest)]
    └──requires──> [Playwright installed for E2E]
    └──requires──> [Test database or mock layer for Supabase]
    └──enhances──> [All other features] (tests validate correctness of new code)

[Admin User Management]
    └──requires──> [Supabase service role key in server-only context]
    └──conflicts-if-misplaced──> [Never expose service role key to client components]
```

### Dependency Notes

- **Notifications require a new DB table:** `notifications` is not in the current schema. A migration is needed before any notification UI can be built.
- **Email notifications require a provider decision before first email:** Resend is the standard choice for Next.js 14 + App Router (native `fetch`-based API, no SDK bloat, excellent React Email template support). Choose and configure before writing any email-sending code.
- **File attachments require a Supabase Storage bucket:** The `attachments TEXT[]` column is ready; the bucket, policies, and upload API route are not. The storage bucket must be created in the same migration step as testing it.
- **Admin dashboard requires role-aware routing before any admin page can exist:** The middleware already checks auth; extend it to also reject non-admin roles from `/[locale]/admin/**` routes.
- **Testing setup is a prerequisite for all other features:** Configuring the test runner, mock layer, and Playwright must happen in the first phase of v1.1 or test coverage of new features will be an afterthought.
- **Slack notification for tasks enhances but does not require the notification system:** These are independent channels — Slack messages and in-app notifications can be built separately. Slack is simpler (no new DB table), so it should come first.

---

## MVP Definition

### Launch With (v1.1)

Minimum viable additions that solidify the platform for operational use.

- [ ] Admin dashboard route (`/[locale]/admin`) — client list, subscription status, task cross-view — **team cannot operate without visibility**
- [ ] Route protection for `/admin` — reject non-admin/engineer roles — **security requirement before admin page exists**
- [ ] In-app notification bell + `notifications` table — unread count, mark as read — **core portal UX pattern**
- [ ] Email on payment success/failure — extend Stripe webhook handler — **clients expect payment receipts**
- [ ] Email on task status change — client notified when Vantix moves task to `in_progress` or `completed` — **closes the async communication loop**
- [ ] Slack message on new task created by client — extend `slack.ts` — **highest-value notification for Vantix team, lowest implementation cost**
- [ ] Test runner setup (Vitest) + unit tests for `stripe.ts` and `slack.ts` — **protects money path and communication path**
- [ ] E2E tests: login, task creation (Playwright) — **regression safety for most-used flows**
- [ ] Supabase Storage bucket `task-attachments` + RLS policies — **prerequisite for upload UI**
- [ ] File upload UI in task comment form — display uploaded files as links — **closes the schema gap that clients will notice**

### Add After Validation (v1.x)

- [ ] Admin MRR chart (Recharts) — add once admin dashboard baseline ships and team confirms it's the right metric view
- [ ] Image preview for attachments — add once file upload ships and usage patterns are observed
- [ ] Integration tests for API routes — add incrementally after unit test foundation is stable
- [ ] Drag-and-drop upload — add when basic upload is in production and usage friction is confirmed

### Future Consideration (v2+)

- [ ] Weekly email digest to clients — requires cron job + email template system; meaningful only after notification system is proven
- [ ] Notification preferences per user — defer until notification volume is high enough to justify opt-out controls
- [ ] Admin user management (invite/role change) — defer until team growth makes Supabase dashboard management painful
- [ ] Playwright visual regression tests — defer; high maintenance cost, low immediate value for a portal with stable design
- [ ] Two-factor authentication — defer to dedicated security hardening phase

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Admin dashboard: client list + task cross-view | HIGH | LOW | P1 |
| Admin route protection | HIGH | LOW | P1 |
| Notifications table + in-app bell | HIGH | MEDIUM | P1 |
| Email: payment success/failure | HIGH | MEDIUM | P1 |
| Email: task status change | HIGH | MEDIUM | P1 |
| Slack: new task notification | HIGH | LOW | P1 |
| Task file upload UI + Storage bucket | HIGH | MEDIUM | P1 |
| File display in comment thread | HIGH | LOW | P1 |
| Vitest setup + unit tests (stripe, slack) | HIGH | MEDIUM | P1 |
| E2E: login + task creation (Playwright) | HIGH | MEDIUM | P1 |
| Admin MRR chart | MEDIUM | MEDIUM | P2 |
| Image preview for attachments | MEDIUM | LOW | P2 |
| Integration tests for API routes | HIGH | HIGH | P2 |
| Drag-and-drop file upload | LOW | MEDIUM | P3 |
| Admin user management | MEDIUM | HIGH | P3 |
| Weekly email digest | MEDIUM | HIGH | P3 |
| Notification preferences | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for v1.1 launch
- P2: Ship when core P1 items are stable
- P3: Defer to v1.2 or v2

---

## Competitor Feature Analysis

Context: B2B technical consulting portals (Linear, Basecamp, agency client portals).

| Feature | Linear | Generic Agency Portal | Vantix v1.1 Approach |
|---------|--------|----------------------|----------------------|
| Admin cross-client view | N/A (single workspace) | Usually missing or bolted on | Dedicated `/admin` route with role check; all-client task view for engineers |
| In-app notifications | Real-time, full Inbox | Often email-only | DB-backed with Supabase Realtime; unread badge; mark-as-read |
| Email transactional | Minimal (invite emails) | Mailchimp blasts | Resend with per-event triggers (payment, task status); not marketing |
| File attachments | Native, drag-and-drop | Google Drive links | Supabase Storage; URL stored in `attachments[]`; renders in comment thread |
| Testing | Not applicable | Typically none | Vitest for units; Playwright for E2E login + task flows |

---

## Implementation Notes (Actionable for Roadmap)

### Admin Dashboard
- Route: `/[locale]/admin` — separate from `/[locale]/portal`
- Guard: `middleware.ts` must check `user.role` from Supabase `users` table; redirect to `/portal` if not `admin` or `engineer`
- Data: No new DB tables needed. Queries join `clients + subscriptions + tasks`
- Seller role: read-only access to client list + subscription status; no task management

### Notifications
- New DB table: `notifications` — columns: `id`, `user_id`, `type`, `title`, `body`, `metadata JSONB`, `is_read`, `created_at`
- In-app: Supabase Realtime `channel.on('postgres_changes', ...)` in the portal layout
- Email provider: Resend — native `fetch` API, no SDK dependency, supports React Email templates, free tier covers low volume
- Triggers: extend Stripe webhook handler for payment events; add API route called from task mutation handlers for task events
- Slack: add `notifySlackTaskCreated(task, client)` to `slack.ts`; call from task creation handler

### Testing Strategy
- Test runner: Vitest (not Jest) — native ESM, faster, compatible with Next.js 14 App Router, no transform config needed
- Unit tests: `lib/stripe.ts`, `lib/slack.ts` — mock external calls with `vi.mock()`
- Integration tests: API route handlers — import route handler function, call directly with mock Request
- E2E: Playwright — test against `localhost:3000`; use a test Supabase project or mocked auth
- Coverage: `@vitest/coverage-v8` — HTML report, no external service needed in v1.1

### File Attachments
- Supabase Storage bucket: `task-attachments` (public or signed URLs with short expiry)
- Storage RLS: `INSERT` allowed if `auth.uid()` belongs to same client as the task; `SELECT` allowed for client + admin roles
- Upload flow: client component calls `supabase.storage.from('task-attachments').upload(path, file)` → get public URL → append to `attachments` array in `task_comments.insert`
- File size limit: 10MB client-side check; Supabase Storage enforces 50MB max by default
- Accepted types: `image/*,application/pdf,.docx,.xlsx,.csv,.log` — covers SRE evidence (screenshots, logs, reports)

---

## Sources

- Supabase documentation: Storage, Realtime, Auth (analyzed from schema and existing code patterns)
- Existing codebase: `platform/supabase/migrations/001_schema.sql`, `platform/src/lib/types.ts`, `platform/src/lib/slack.ts`, `platform/src/app/[locale]/portal/tasks/page.tsx`, `platform/src/app/[locale]/portal/layout.tsx`
- Next.js 14 App Router documentation (training data, HIGH confidence for established patterns)
- Resend documentation (training data, MEDIUM confidence — verify free tier limits at implementation time)
- Vitest documentation (training data, HIGH confidence for established patterns)
- Playwright documentation (training data, HIGH confidence for established patterns)
- Competitor analysis: Linear, Basecamp client portals (training data, MEDIUM confidence)

**Confidence note:** No web search was available during this research session. All recommendations are derived from codebase analysis plus established Next.js/Supabase patterns that were stable as of early 2025. Implementation details for Resend pricing tiers and Supabase Storage RLS syntax should be verified against current docs before building.

---

*Feature research for: Vantix platform v1.1 — admin dashboard, notifications, testing, file attachments*
*Researched: 2026-03-24*
