# Phase 6: Server-Side Integration - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire all server-side notification delivery: email (Resend) for payment success/failure and task status changes, Slack messages for task creation, notification API routes, and in-app notification row inserts. No UI components — only server-side logic, API routes, and email templates.

</domain>

<decisions>
## Implementation Decisions

### Notification Trigger Architecture
- **D-01:** Move task create and status-update to API routes — single entry point for all side effects (email, Slack, notification row insert)
- **D-02:** Side effects (email, Slack, notification row) are fire-and-forget — don't block the API response
- **D-03:** Shared `notifyTaskEvent(taskId, eventType, supabase)` orchestrator handles all task-related notifications
- **D-04:** Both admin/engineer and clients can change task status — API route validates authenticated user (any role with access to that task)

### Email Content & Locale
- **D-05:** From address: `hello@vantx.io` with display name "Vantx"
- **D-06:** Payment success email includes amount, currency, invoice period, and link to billing portal
- **D-07:** Payment failed email uses gentle tone ("we couldn't process your payment"), includes direct link to Stripe billing portal to update payment method
- **D-08:** Task status change email includes task title, new status, who changed it, and deep link to the task in portal
- **D-09:** All emails bilingual — EN for `market: "US"`, ES for `market: "LATAM"`

### Recipient Targeting
- **D-10:** Payment emails → `client.email` only (primary contact, account-level event)
- **D-11:** Task status change → notify `task.assigned_to` + `task.created_by` (skip duplicates if same person, skip if null)
- **D-12:** Task created → notify admin/engineer roles only (Vantx team needs to act, client already knows they created it)
- **D-13:** In-app notification rows mirror email targeting — same recipients get both email and DB notification row

### Slack Task Message
- **D-14:** Slack message includes title, priority, task type, and who created it — no description (keep it scannable)
- **D-15:** Include "View in Portal" button linking to `/[locale]/portal/tasks/{task_id}`
- **D-16:** Color-code by priority using Block Kit attachment color bars (critical=red, high=orange, medium=yellow, low=gray)
- **D-17:** Slack messages on task creation only — no status change Slack messages (avoids noise)

### Claude's Discretion
- React Email template design/layout within the content decisions above
- Resend API wrapper structure (single helper file vs per-template modules)
- Error handling granularity in the notifyTaskEvent orchestrator
- Whether to batch notification row inserts or insert individually
- Exact Block Kit message structure for Slack task notification

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Server-Side Patterns
- `platform/src/app/api/webhooks/stripe/route.ts` — Stripe webhook handler to extend; shows event dispatch pattern, service client usage, fire-and-forget via onboardClient
- `platform/src/lib/onboard.ts` — Orchestration pattern: injected supabase, try-catch per step, structured results, fire-and-forget caller
- `platform/src/lib/slack.ts` — Slack API client to extend; shows channel lookup, Block Kit messages, skip-if-unconfigured pattern

### Data Model
- `platform/src/lib/types.ts` — Client (market, slack_channel, email), User (role, email, client_id), Task (status, assigned_to, created_by, client_id), Notification, NotificationType
- `platform/supabase/migrations/002_notifications.sql` — Notifications table schema, RLS policies, indexes
- `platform/supabase/migrations/001_schema.sql` — Core schema with users, clients, tasks, subscriptions

### Task UI (to refactor)
- `platform/src/app/[locale]/portal/tasks/page.tsx` — Current direct Supabase insert for task creation; must be moved to API route per D-01

### Phase 5 Context
- `.planning/phases/05-foundation/05-CONTEXT.md` — D-06 through D-09 locked notification schema decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `platform/src/lib/slack.ts`: `findChannel()`, `createChannel()`, `sendWelcomeMessage()` — extend with `sendTaskCreatedMessage()`
- `platform/src/lib/onboard.ts`: Orchestration pattern with injected supabase, per-step error handling — model `notifyTaskEvent()` on this
- `platform/src/lib/supabase/server.ts`: `createServiceClient()` — use for notification inserts (bypasses RLS)
- `platform/src/app/api/webhooks/stripe/route.ts`: Webhook signature validation + event dispatch — extend `invoice.paid` and `invoice.payment_failed` handlers

### Established Patterns
- **API route pattern**: `export async function POST(req)` with try/catch + `NextResponse.json()`
- **Fire-and-forget**: `onboardClient(id, supabase).catch(err => console.error(...))` — no await, no blocking
- **Slack skip pattern**: `isConfigured()` check returns early with skip result if no token
- **Service client**: Used in all API routes for admin-level DB access

### Integration Points
- `package.json` — Add `resend` dependency
- `/api/webhooks/stripe/route.ts` — Extend payment handlers to fire email + notification
- `/api/tasks/` — New API routes for create and update-status
- `/lib/notifications.ts` — New: notification creation helper
- `/lib/email.ts` — New: Resend email sending helper
- `/lib/slack.ts` — Extend with `sendTaskCreatedMessage()`
- `platform/src/app/[locale]/portal/tasks/page.tsx` — Refactor to call API route instead of direct insert

### Key Environment Variables
- `RESEND_API_KEY` — New, required for email delivery
- Existing: `SLACK_BOT_TOKEN`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`

</code_context>

<specifics>
## Specific Ideas

- Email from address matches existing brand contact: `hello@vantx.io`
- Flat monthly subscription model (no hourly language in emails) — per brand memory
- Brand name is "Vantx" (not "Vantix" or other variations)

</specifics>

<deferred>
## Deferred Ideas

- Weekly email digest to clients (NOTIF-10, v2)
- User notification preferences / per-type opt-in/out (NOTIF-11, v2)
- Slack messages on task status changes (decided against for noise reasons — revisit if requested)

</deferred>

---

*Phase: 06-server-side-integration*
*Context gathered: 2026-03-24*
