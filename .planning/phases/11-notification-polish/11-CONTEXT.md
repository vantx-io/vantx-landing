# Phase 11: Notification Polish - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Users control which notification channels they receive (email, in-app) and enrolled clients automatically get a weekly email digest of task activity every Monday. Preferences are enforced at send time in `notifyTaskEvent`. New `/portal/settings` page for preference UI.

</domain>

<decisions>
## Implementation Decisions

### Preferences Data Model
- **D-01:** Separate `notification_preferences` table (not extending `users`) — cleaner separation, easier to evolve without touching users table
- **D-02:** Schema: `id`, `user_id` (FK unique), `email_enabled` (bool, default true), `in_app_enabled` (bool, default true), `digest_enabled` (bool, default true), `updated_at`
- **D-03:** Opt-out model per STATE.md decision — null row (no preferences record) means all channels enabled. Only users who explicitly disable something get a row
- **D-04:** Per-channel granularity (email on/off, in-app on/off) with digest as a separate independent toggle. NOT per-notification-type — too much UI complexity for <20 users. All event types (task_created, task_updated, payment_success, payment_failed) follow the same channel setting
- **D-05:** RLS: users can SELECT/UPDATE/INSERT their own row only. Service role for digest cron queries
- **D-06:** New migration file `003_notification_preferences.sql`

### Weekly Digest Content
- **D-07:** Digest includes: task count by status (new, completed, in-progress), list of tasks that changed status during the week (max 10, with "and N more" truncation), and a CTA button to the portal
- **D-08:** If zero activity in the past week, do NOT send the digest — skip silently. No "nothing happened" emails
- **D-09:** New React Email template `WeeklyDigestEmail.tsx` — bilingual (en/es), same design language as existing TaskStatusEmail (blue CTA #2563EB, max-width 560px)
- **D-10:** Digest query scoped to client — each user sees only their client's task activity. Admins/engineers get a digest of ALL clients' activity (cross-client view)

### Settings Page UX
- **D-11:** New route at `/portal/settings` with a "Notifications" section
- **D-12:** Three toggle switches: "Email notifications", "In-app notifications", "Weekly digest email"
- **D-13:** Toggle state persists immediately on change (optimistic update + API call) — no "Save" button needed
- **D-14:** Add "Settings" link to portal sidebar navigation, after the existing nav items
- **D-15:** i18n: new `settings` namespace in en.json/es.json for all labels

### Digest Timing & Scope
- **D-16:** Vercel Cron schedule: every Monday at 9:00 UTC via `vercel.json` — per STATE.md decision (no persistent worker)
- **D-17:** Cron handler at `/api/cron/digest/route.ts` — protected by `CRON_SECRET` env var (Vercel sets `Authorization: Bearer <CRON_SECRET>` header)
- **D-18:** Per-user delivery — each enrolled user with `digest_enabled !== false` gets their own email
- **D-19:** `Promise.allSettled()` for parallel sends per STATE.md decision — one user's email failure doesn't block others
- **D-20:** Activity window: previous 7 days from cron execution time (Monday 9am UTC - 7 days = previous Monday 9am UTC)

### Enforcement at Send Time (NOTIF-12)
- **D-21:** Modify `notifyTaskEvent` to check `notification_preferences` before sending email and before inserting notification row
- **D-22:** Lookup pattern: single query per recipient at send time. If no preferences row exists → send (opt-out model). If row exists and channel disabled → skip
- **D-23:** Payment notification emails (from Stripe webhook) also check preferences — modify the webhook handler to respect `email_enabled`

### Claude's Discretion
- API route structure for preferences CRUD (single PATCH endpoint vs separate)
- Exact toggle component implementation (headless UI vs custom)
- Digest email aggregation query optimization
- Test mocking strategy for Vercel Cron

</decisions>

<specifics>
## Specific Ideas

- Digest should feel like a professional weekly summary, not a list of raw events — think "Your week at a glance"
- Toggle switches should give instant visual feedback (no loading spinner, optimistic update)
- Cron security: always verify `CRON_SECRET` — reject unauthorized calls with 401

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Notification pipeline (modify for preference enforcement)
- `platform/src/lib/notifications.ts` — `notifyTaskEvent()` orchestrator, `createNotification()` helper
- `platform/src/lib/email.ts` — `sendEmail()` function
- `platform/src/lib/emails/TaskStatusEmail.tsx` — Existing email template pattern to follow

### Database schema
- `platform/supabase/migrations/001_schema.sql` — Users table, clients table
- `platform/supabase/migrations/002_notifications.sql` — Notifications table, RLS policies

### UI patterns
- `platform/src/components/NotificationBell.tsx` — Existing notification UI (realtime pattern)
- `platform/src/app/[locale]/portal/layout.tsx` — Portal layout with sidebar navigation

### Stripe webhook (enforce preferences on payment emails)
- `platform/src/app/api/webhooks/stripe/route.ts` — Payment notification sends

### i18n
- `platform/src/messages/en.json` — English translations (add `settings` namespace)
- `platform/src/messages/es.json` — Spanish translations

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sendEmail()` in `email.ts` — reuse for digest sends
- React Email template pattern (TaskStatusEmail) — follow same structure for WeeklyDigestEmail
- `notifyTaskEvent()` — modify in-place to add preference checks
- `date-fns` already installed — use for date ranges in digest query
- Portal sidebar nav pattern in `layout.tsx` — add Settings link

### Established Patterns
- Fire-and-forget notification sends with `.catch()` logging
- Email locale from `client.market` field (LATAM=es, else en)
- Supabase RLS for row-level access control
- `useTranslations()` hook with namespace for i18n
- `createServiceClient()` for server-side DB operations

### Integration Points
- `notifyTaskEvent()` — add preference lookup before email/notification sends
- Stripe webhook handler — add preference check before payment emails
- Portal sidebar — add Settings nav item
- `vercel.json` — new file for cron configuration
- `.env.local.example` — add `CRON_SECRET`

</code_context>

<deferred>
## Deferred Ideas

- Per-user digest schedule (timezone-aware weekly/daily toggle) — deferred to v2 (NOTIF-13)
- Per-notification-type granularity (toggle task vs payment separately) — future if users request it
- Slack notification preferences — Slack is org-level, not user-level preference

</deferred>

---

*Phase: 11-notification-polish*
*Context gathered: 2026-03-25*
