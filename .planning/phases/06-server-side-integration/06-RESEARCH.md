# Phase 06: Server-Side Integration - Research

**Researched:** 2026-03-24
**Domain:** Resend (transactional email), React Email (templates), Slack Block Kit (notifications), Next.js 14 API routes (fire-and-forget)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Move task create and status-update to API routes — single entry point for all side effects
- **D-02:** Side effects (email, Slack, notification row) are fire-and-forget — don't block the API response
- **D-03:** Shared `notifyTaskEvent(taskId, eventType, supabase)` orchestrator handles all task-related notifications
- **D-04:** Both admin/engineer and clients can change task status — API route validates authenticated user (any role with access to that task)
- **D-05:** From address: `hello@vantx.io` with display name "Vantx"
- **D-06:** Payment success email includes amount, currency, invoice period, and link to billing portal
- **D-07:** Payment failed email uses gentle tone ("we couldn't process your payment"), includes direct link to Stripe billing portal to update payment method
- **D-08:** Task status change email includes task title, new status, who changed it, and deep link to the task in portal
- **D-09:** All emails bilingual — EN for `market: "US"`, ES for `market: "LATAM"`
- **D-10:** Payment emails → `client.email` only (primary contact, account-level event)
- **D-11:** Task status change → notify `task.assigned_to` + `task.created_by` (skip duplicates if same person, skip if null)
- **D-12:** Task created → notify admin/engineer roles only (Vantx team needs to act, client already knows they created it)
- **D-13:** In-app notification rows mirror email targeting — same recipients get both email and DB notification row
- **D-14:** Slack message includes title, priority, task type, and who created it — no description
- **D-15:** Include "View in Portal" button linking to `/[locale]/portal/tasks/{task_id}`
- **D-16:** Color-code by priority using Block Kit attachment color bars (critical=red, high=orange, medium=yellow, low=gray)
- **D-17:** Slack messages on task creation only — no status change Slack messages

### Claude's Discretion

- React Email template design/layout within the content decisions above
- Resend API wrapper structure (single helper file vs per-template modules)
- Error handling granularity in the notifyTaskEvent orchestrator
- Whether to batch notification row inserts or insert individually
- Exact Block Kit message structure for Slack task notification

### Deferred Ideas (OUT OF SCOPE)

- Weekly email digest to clients (NOTIF-10, v2)
- User notification preferences / per-type opt-in/out (NOTIF-11, v2)
- Slack messages on task status changes (decided against for noise reasons)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NOTIF-05 | Email notification on successful payment (Resend) | Resend `emails.send()` API + React Email template; extend `invoice.paid` handler in stripe webhook |
| NOTIF-06 | Email notification on failed payment (Resend) | Extend `invoice.payment_failed` handler; gentle tone template per D-07 |
| NOTIF-07 | Email notification on task status change | New `/api/tasks/[id]/status` route; `notifyTaskEvent()` orchestrator; bilingual React Email template |
| NOTIF-08 | Slack message to client channel on new task created | New `/api/tasks` POST route; extend `slack.ts` with `sendTaskCreatedMessage()`; Block Kit attachment with color bar |
</phase_requirements>

---

## Summary

Phase 6 wires all server-side notification delivery before any UI depends on it. The work has two independent trigger paths: (1) Stripe webhook events for payment success/failure emails, and (2) new API routes for task create and status-change that fire email, Slack, and in-app notification row inserts as side effects.

The project already has all three integration points in working state: a Stripe webhook handler (`route.ts`), a Slack API client (`slack.ts`), and an orchestration pattern (`onboard.ts`). All three must be extended, not replaced. The only new dependency is `resend` for email delivery plus `@react-email/components` for template authoring.

A critical finding: **Next.js 14 does not have `after()` from `next/server`** (that is Next.js 15+). For fire-and-forget on Next.js 14, the existing `.catch()` pattern used in `onboard.ts` is the project-appropriate approach — unawaited promise with `.catch(console.error)`. This works reliably on a self-hosted Node.js server; on Vercel, `@vercel/functions`'s `waitUntil` is preferred but only relevant if the project deploys to Vercel. The existing codebase already uses the `.catch()` pattern, so it must stay consistent.

**Primary recommendation:** Mirror the `onboardClient()` orchestration pattern exactly for `notifyTaskEvent()`. Add `resend` + `@react-email/components`. Add `serverComponentsExternalPackages: ['@react-email/components', '@react-email/render']` to `next.config.js` to avoid a known Next.js 14 build failure.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| resend | 6.9.4 (current) | Transactional email delivery API | Project-selected; simple SDK, React Email native support |
| @react-email/components | 1.0.10 (current) | Email template components (Html, Body, Section, Text, Button, etc.) | Official React Email component bundle — single install covers all primitives |
| @react-email/render | 2.0.4 (current) | Renders React components to HTML string | Required for Resend `react:` param; async by default in v2+ |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| stripe (already installed) | ^17.4.0 | Stripe type definitions for invoice fields | Use `Stripe.Invoice` type to access `hosted_invoice_url`, `amount_paid`, `currency`, `period_start`, `period_end` |
| @supabase/ssr (already installed) | ^0.9.0 | Service client for notification row inserts (bypasses RLS) | Use `createServiceClient()` for all DB writes in API routes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @react-email/components (single package) | Individual packages (@react-email/html, etc.) | Single package simpler, recommended install |
| Fire-and-forget (.catch pattern) | @vercel/functions waitUntil | waitUntil only needed on Vercel serverless; existing pattern is fine for self-hosted Node.js |
| Single `/lib/email.ts` helper | Per-template modules | Single helper is simpler; templates are props-driven, not complex enough to warrant separate modules |

**Installation:**
```bash
npm install resend @react-email/components @react-email/render
```

**Version verification:** Verified 2026-03-24 against npm registry.
- `resend`: 6.9.4
- `@react-email/components`: 1.0.10
- `@react-email/render`: 2.0.4

---

## Architecture Patterns

### Recommended Project Structure

```
platform/src/
├── app/api/
│   ├── tasks/
│   │   └── route.ts             # POST /api/tasks — create task, fire notifyTaskEvent
│   │   └── [id]/
│   │       └── status/
│   │           └── route.ts     # PATCH /api/tasks/[id]/status — update status, fire notifyTaskEvent
│   └── webhooks/stripe/
│       └── route.ts             # EXTEND existing — add email sends to invoice.paid and invoice.payment_failed
├── lib/
│   ├── email.ts                 # NEW: Resend client + sendEmail() helper
│   ├── notifications.ts         # NEW: createNotification() insert helper + notifyTaskEvent() orchestrator
│   ├── slack.ts                 # EXTEND: add sendTaskCreatedMessage()
│   └── emails/
│       ├── PaymentSuccessEmail.tsx   # NEW: React Email template (bilingual)
│       ├── PaymentFailedEmail.tsx    # NEW: React Email template (bilingual)
│       └── TaskStatusEmail.tsx       # NEW: React Email template (bilingual)
```

### Pattern 1: Resend Email Helper (lib/email.ts)

**What:** Thin wrapper around `new Resend(process.env.RESEND_API_KEY)`. Exposes a single `sendEmail()` function that all callers use.
**When to use:** Every email send in the codebase goes through this one file.

```typescript
// Source: https://resend.com/docs/send-with-nextjs
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(params: {
  to: string
  subject: string
  react: React.ReactElement
}): Promise<{ id?: string; error?: string }> {
  const { data, error } = await resend.emails.send({
    from: 'Vantx <hello@vantx.io>',
    to: params.to,
    subject: params.subject,
    react: params.react,
  })
  if (error) return { error: error.message }
  return { id: data?.id }
}
```

### Pattern 2: React Email Template (bilingual)

**What:** A single component that receives a `locale` prop and renders EN or ES content.
**When to use:** All three email types (payment success, payment failed, task status change).

```typescript
// Source: https://www.npmjs.com/package/@react-email/components
import { Html, Head, Body, Preview, Section, Text, Button, Hr } from '@react-email/components'

interface PaymentSuccessEmailProps {
  locale: 'en' | 'es'
  clientName: string
  amount: string
  currency: string
  period: string
  billingPortalUrl: string
}

export function PaymentSuccessEmail({ locale, clientName, amount, currency, period, billingPortalUrl }: PaymentSuccessEmailProps) {
  const t = locale === 'es' ? ES : EN
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={{ fontFamily: 'sans-serif', background: '#f9f9f9' }}>
        <Section style={{ maxWidth: 560, margin: '0 auto', background: '#fff', padding: '32px', borderRadius: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' }}>{t.heading}</Text>
          <Text>{t.body(clientName, amount, currency, period)}</Text>
          <Button href={billingPortalUrl} style={{ background: '#2563EB', color: '#fff', padding: '12px 24px', borderRadius: 6 }}>
            {t.cta}
          </Button>
          <Hr />
          <Text style={{ fontSize: 12, color: '#999' }}>Vantx · vantx.io · hello@vantx.io</Text>
        </Section>
      </Body>
    </Html>
  )
}

const EN = {
  preview: 'Payment received — thank you!',
  heading: 'Payment received',
  body: (name: string, amt: string, cur: string, period: string) =>
    `Hi ${name}, we received your ${cur} ${amt} payment for ${period}.`,
  cta: 'View billing portal',
}
const ES = {
  preview: 'Pago recibido — ¡gracias!',
  heading: 'Pago recibido',
  body: (name: string, amt: string, cur: string, period: string) =>
    `Hola ${name}, recibimos tu pago de ${cur} ${amt} por ${period}.`,
  cta: 'Ver portal de facturación',
}
```

**IMPORTANT — React Email render in Next.js 14:** The `render()` function from `@react-email/render` is **async** as of v2. Always `await render(...)` or pass the React element directly to Resend's `react:` parameter (Resend renders it internally).

### Pattern 3: notifyTaskEvent Orchestrator (lib/notifications.ts)

**What:** Mirrors `onboardClient()` — injected supabase, per-step try/catch, structured result. Called fire-and-forget from API routes.
**When to use:** Any task event (task_created, task_updated).

```typescript
// Mirrors: platform/src/lib/onboard.ts pattern
type SupabaseAdmin = { from: (table: string) => any }

export async function notifyTaskEvent(
  taskId: string,
  eventType: 'task_created' | 'task_updated',
  supabase: SupabaseAdmin,
  changedByUserId?: string,
): Promise<void> {
  // 1. Fetch task + related users
  // 2. Determine recipients per D-11/D-12
  // 3. Send emails (per D-08/D-09)
  // 4. Insert notification rows (per D-13)
  // 5. If task_created: send Slack message (per D-14/D-15/D-16/D-17)
}
```

### Pattern 4: API Route with Fire-and-Forget

**What:** POST `/api/tasks` and PATCH `/api/tasks/[id]/status` — return response immediately, then fire notification side effects.
**When to use:** Task create and task status update.

```typescript
// Source: mirrors platform/src/app/api/webhooks/stripe/route.ts pattern
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { notifyTaskEvent } from '@/lib/notifications'

export async function POST(req: Request) {
  // validate, insert task
  const supabase = createServiceClient()
  const { data: task, error } = await supabase.from('tasks').insert({ ... }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire-and-forget: mirrors onboardClient() pattern in route.ts
  notifyTaskEvent(task.id, 'task_created', supabase)
    .catch(err => console.error('[notify] task_created error:', err))

  return NextResponse.json({ task }, { status: 201 })
}
```

### Pattern 5: Slack Task Created Message (extend slack.ts)

**What:** New exported function `sendTaskCreatedMessage()` added to existing `slack.ts`. Uses attachment with color bar + Block Kit blocks inside the attachment.
**When to use:** Task creation event only (D-17).

```typescript
// Source: Slack docs — https://docs.slack.dev/tools/node-slack-sdk/reference/types/interfaces/MessageAttachment/
// Color field: hex string ("#C0392B") OR named: "good"/"warning"/"danger"
const PRIORITY_COLORS: Record<string, string> = {
  critical: '#C0392B',  // red
  high: '#E67E22',      // orange
  medium: '#F1C40F',    // yellow
  low: '#95A5A6',       // gray
}

export async function sendTaskCreatedMessage(params: {
  channelId: string
  taskId: string
  title: string
  priority: Task['priority']
  type: Task['type']
  createdByName: string
  locale: string
}): Promise<void> {
  if (!isConfigured()) return
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${params.locale}/portal/tasks/${params.taskId}`
  const payload = {
    channel: params.channelId,
    text: `New task: ${params.title}`,  // fallback text
    attachments: [{
      color: PRIORITY_COLORS[params.priority] || '#95A5A6',
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*${params.title}*` },
          accessory: {
            type: 'button',
            text: { type: 'plain_text', text: 'View in Portal' },
            url: portalUrl,
          },
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `*Priority:* ${params.priority}  |  *Type:* ${params.type}  |  *By:* ${params.createdByName}` },
          ],
        },
      ],
    }],
  }
  const res = await fetch(`${SLACK_API}/chat.postMessage`, {
    method: 'POST', headers: headers(),
    body: JSON.stringify(payload),
  })
  const data = await res.json() as any
  if (!data.ok) throw new Error(`Slack chat.postMessage failed: ${data.error}`)
}
```

**Note on color + blocks:** The Slack API still supports attachments with a `color` field alongside a `blocks` array inside the attachment. This is the only way to get a colored left-border sidebar — pure Block Kit blocks do not support color bars. The legacy attachment API still works in 2026; Slack has not removed it.

### Pattern 6: Stripe Webhook Extension

**What:** Add email sends to existing `invoice.paid` and `invoice.payment_failed` cases. Fetch client record to get email and market for locale. Fire email fire-and-forget.
**When to use:** Payment events only.

Key Stripe invoice fields available in webhooks:
- `invoice.amount_paid` — amount in cents (paid case)
- `invoice.amount_due` — amount in cents (failed case)
- `invoice.currency` — e.g., `"usd"`
- `invoice.hosted_invoice_url` — deep link to Stripe-hosted invoice (finalized invoices only, may be null)
- `invoice.period_start`, `invoice.period_end` — Unix timestamps for invoice period
- `invoice.customer` — Stripe customer ID (used to look up client in subscriptions table)

For the billing portal link in D-06 and D-07: use `createPortalSession()` from existing `stripe.ts`, OR embed the `hosted_invoice_url` directly if not null — prefer `hosted_invoice_url` as it doesn't require an additional Stripe API call.

### Pattern 7: createNotification Row Insert (lib/notifications.ts)

**What:** Helper that inserts one row into the `notifications` table. Use service client to bypass RLS.
**When to use:** Mirror every email send with a DB notification row (D-13).

```typescript
// Schema from: platform/supabase/migrations/002_notifications.sql
export async function createNotification(
  supabase: SupabaseAdmin,
  params: {
    userId: string
    type: NotificationType
    title: string
    body: string
    actionLink?: string
  }
): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    action_link: params.actionLink ?? null,
  })
}
```

**Batching decision:** Insert individually per recipient — simpler logic, easier error isolation, low volume (max 2-3 recipients per event). No need for batch insert.

### Pattern 8: tasks/page.tsx Refactor

**What:** Replace direct `supabase.from('tasks').insert(...)` in the client component with a `fetch('/api/tasks', { method: 'POST', ... })` call.
**When to use:** Task creation from the portal UI.

The existing `createTask()` function in `tasks/page.tsx` must be updated to call the new API route instead. Status changes from the UI (if any exist) also need the same treatment.

### Anti-Patterns to Avoid

- **Awaiting notifications in the API response path:** Don't `await notifyTaskEvent(...)` — always fire-and-forget with `.catch()`. The Stripe webhook pattern in the codebase already demonstrates this correctly.
- **Using `createClient()` (browser client) in API routes:** Always use `createServiceClient()` for notification inserts — bypasses RLS, no auth header needed.
- **Calling `render()` from `@react-email/render` without await:** As of v2, `render()` is async. However, passing a React element directly to Resend's `react:` param is the simpler path — Resend renders internally.
- **Missing `serverComponentsExternalPackages` in next.config.js:** Without this, Next.js 14 bundler may fail to build with `encodeXML` errors from `@react-email/components`. Must add to config.
- **Hardcoding `NEXT_PUBLIC_APP_URL` in Slack/email deep links:** Read from env var; never hardcode `vantx.io` directly in code.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email HTML generation | Custom HTML string builder | React Email + @react-email/components | Email client rendering quirks, table layouts, dark mode, Outlook compat — all handled |
| Email delivery | SMTP client / raw fetch to email API | Resend SDK (`resend.emails.send`) | Rate limiting, retry logic, delivery tracking, SPF/DKIM all managed |
| Slack message formatting | Raw JSON payloads from scratch | Extend existing `slack.ts` patterns | Channel lookup, error handling, `isConfigured()` skip — already implemented |
| In-app notification data model | Custom schema | Use existing `notifications` table from migration 002 | Schema, RLS, indexes already created in Phase 5 |

**Key insight:** 95% of the infrastructure for this phase already exists in the codebase. The work is wiring connections between existing systems, not building new systems.

---

## Common Pitfalls

### Pitfall 1: Next.js 14 Build Failure with React Email

**What goes wrong:** Build fails with `Cannot get final name for export 'encodeXML'` or similar bundling errors.
**Why it happens:** `@react-email/components` uses Node.js-specific internals that Next.js App Router tries to bundle incorrectly.
**How to avoid:** Add to `next.config.js`:
```javascript
experimental: {
  serverComponentsExternalPackages: ['@react-email/components', '@react-email/render'],
  serverActions: { bodySizeLimit: '10mb' }, // keep existing
}
```
**Warning signs:** Build fails immediately after installing `@react-email/components`. Local dev may work but `next build` fails.

### Pitfall 2: Fire-and-Forget Swallows Errors Silently

**What goes wrong:** Email or Slack call fails but nothing in logs indicates it. Notifications silently drop.
**Why it happens:** `notifyTaskEvent().catch(...)` catches top-level errors but per-step errors inside the function may be swallowed.
**How to avoid:** Follow `onboard.ts` pattern — each step in a separate `try/catch`, log each failure with `console.error('[notify] step-name failed:', err)`. Even though callers won't see errors, structured logs per step enable debugging.
**Warning signs:** Users report missing notification emails; Resend dashboard shows zero sends.

### Pitfall 3: Resend Free Tier Daily Cap

**What goes wrong:** Email delivery stops mid-day with 429 errors.
**Why it happens:** Free tier is capped at **100 emails/day** (3,000/month). Rate limit is 5 requests/second.
**How to avoid:** At current client count this is fine. Document in env setup: if daily sends exceed 100, upgrade to Pro ($20/mo, 50K emails).
**Warning signs:** Resend dashboard shows "quota exceeded" errors. Set up email alert in Resend dashboard.

### Pitfall 4: Recipient Targeting Fetches Missing Users Table Data

**What goes wrong:** `notifyTaskEvent()` can't find email addresses for `assigned_to`/`created_by` because the tasks table only stores user IDs.
**Why it happens:** `Task.assigned_to` and `Task.created_by` are user IDs, not email addresses. Email addresses live in the `users` table.
**How to avoid:** In `notifyTaskEvent()`, after fetching the task, fetch user records for all non-null recipient IDs:
```typescript
const recipientIds = [...new Set([task.assigned_to, task.created_by].filter(Boolean))]
const { data: users } = await supabase.from('users').select('id, email, full_name').in('id', recipientIds)
```
Use service client (bypasses RLS, can read any user row).
**Warning signs:** Empty email sends or null to-address errors in Resend.

### Pitfall 5: Slack Channel ID vs Channel Name

**What goes wrong:** `sendTaskCreatedMessage()` fails because `client.slack_channel` stores the channel **name** (e.g., `vantx-acmecorp`) but `chat.postMessage` accepts either name or ID.
**Why it happens:** Existing `provisionSlack()` stores channel name, not ID. Channel names work in `chat.postMessage` if prefixed with `#`, but IDs are more reliable.
**How to avoid:** Use `findChannel(channelName)` from existing `slack.ts` to resolve name to ID before posting. Or accept that `chat.postMessage` also accepts `#channel-name` directly — pass `#${client.slack_channel}` and Slack resolves it.
**Warning signs:** `channel_not_found` error from Slack API when `slack_channel` is set.

### Pitfall 6: Missing Duplicate Recipient Check (D-11)

**What goes wrong:** If `task.assigned_to === task.created_by`, one user gets two notification emails.
**Why it happens:** Naive implementation sends to both fields without deduplication.
**How to avoid:** Use `[...new Set([assigned_to, created_by].filter(Boolean))]` to deduplicate before iterating recipients. See D-11: "skip duplicates if same person, skip if null."

### Pitfall 7: Stripe invoice.hosted_invoice_url May Be Null

**What goes wrong:** Email template crashes or shows broken link when `hosted_invoice_url` is null.
**Why it happens:** Stripe only populates this field on finalized invoices. The `invoice.paid` event fires after finalization, so it should be populated — but defensively handle null.
**How to avoid:** Fall back gracefully: if `hosted_invoice_url` is null, use the billing portal URL from `createPortalSession()`, or omit the link from the template.

---

## Code Examples

Verified patterns from official sources and project codebase:

### Resend Send Call

```typescript
// Source: https://resend.com/docs/send-with-nextjs
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

const { data, error } = await resend.emails.send({
  from: 'Vantx <hello@vantx.io>',
  to: clientEmail,
  subject: 'Payment received',
  react: PaymentSuccessEmail({ locale: 'en', clientName: '...', amount: '...', currency: 'USD', period: '...', billingPortalUrl: '...' }),
})
```

### React Email Bilingual Structure

```typescript
// Single component, locale prop drives content
import { Html, Body, Section, Text, Button, Preview, Hr } from '@react-email/components'

const copy = {
  en: { subject: 'Payment received', heading: 'Your payment was received', cta: 'View billing' },
  es: { subject: 'Pago recibido', heading: 'Recibimos tu pago', cta: 'Ver facturación' },
}

export function PaymentSuccessEmail({ locale = 'en', ...props }) {
  const t = copy[locale]
  return (
    <Html lang={locale}>
      <Preview>{t.heading}</Preview>
      <Body>
        <Section>
          <Text>{t.heading}</Text>
          <Button href={props.billingPortalUrl}>{t.cta}</Button>
        </Section>
      </Body>
    </Html>
  )
}
```

### Stripe Webhook Extension (invoice.paid)

```typescript
// Extend existing case in platform/src/app/api/webhooks/stripe/route.ts
case 'invoice.paid': {
  const invoice = event.data.object as Stripe.Invoice
  // ... existing payment insert logic ...
  if (sub) {
    // Existing: insert payment row
    await supabase.from('payments').insert({ ... })
    // NEW: fetch client, send email fire-and-forget
    const { data: client } = await supabase.from('clients').select('email, name, market').eq('id', sub.client_id).single()
    if (client) {
      sendPaymentEmail({
        to: client.email,
        type: 'success',
        locale: client.market === 'LATAM' ? 'es' : 'en',
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency?.toUpperCase() || 'USD',
        billingPortalUrl: invoice.hosted_invoice_url || '',
      }).catch(err => console.error('[email] invoice.paid error:', err))
      // NEW: insert notification row for client user
      const { data: user } = await supabase.from('users').select('id').eq('client_id', sub.client_id).eq('role', 'client').single()
      if (user) {
        createNotification(supabase, { userId: user.id, type: 'payment_success', title: '...', body: '...', actionLink: invoice.hosted_invoice_url }).catch(() => {})
      }
    }
  }
  break
}
```

### Slack Attachment with Color Bar

```typescript
// Source: https://docs.slack.dev/tools/node-slack-sdk/reference/types/interfaces/MessageAttachment/
// color field: hex string OR "good"/"warning"/"danger"
const payload = {
  channel: channelId,
  text: `New task: ${title}`,
  attachments: [{
    color: '#C0392B',  // critical = red
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `*${title}*` } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `Priority: critical  |  Type: request  |  By: John Doe` }] },
    ],
  }],
}
```

### notifyTaskEvent Orchestrator Skeleton

```typescript
// Mirror of platform/src/lib/onboard.ts — injected supabase, per-step try/catch
export async function notifyTaskEvent(
  taskId: string,
  eventType: 'task_created' | 'task_updated',
  supabase: SupabaseAdmin,
  actorUserId?: string,
): Promise<void> {
  // 1. Fetch task
  const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single()
  if (!task) return

  // 2. Fetch client (for slack_channel, market/locale)
  const { data: client } = await supabase.from('clients').select('email, name, slack_channel, market').eq('id', task.client_id).single()
  if (!client) return

  // 3. Determine recipients (deduplicated per D-11/D-12)
  const locale = client.market === 'LATAM' ? 'es' : 'en'
  let recipientIds: string[] = []
  if (eventType === 'task_updated') {
    recipientIds = [...new Set([task.assigned_to, task.created_by].filter(Boolean))]
  } else if (eventType === 'task_created') {
    // D-12: admin/engineer users only
    const { data: adminUsers } = await supabase.from('users').select('id, email, full_name').in('role', ['admin', 'engineer'])
    recipientIds = (adminUsers || []).map(u => u.id)
  }

  // 4. Fetch user records for email addresses
  const { data: users } = await supabase.from('users').select('id, email, full_name').in('id', recipientIds)

  // 5. Send emails + notification rows per recipient
  for (const user of users || []) {
    try {
      await sendEmail({ to: user.email, subject: '...', react: TaskStatusEmail({ locale, ... }) })
    } catch (err) {
      console.error('[notify] email failed for', user.id, err)
    }
    try {
      await createNotification(supabase, { userId: user.id, type: eventType === 'task_created' ? 'task_created' : 'task_updated', ... })
    } catch (err) {
      console.error('[notify] notification row failed for', user.id, err)
    }
  }

  // 6. If task_created: Slack (D-17)
  if (eventType === 'task_created' && client.slack_channel) {
    try {
      const actorUser = actorUserId ? (users || []).find(u => u.id === actorUserId) : null
      await sendTaskCreatedMessage({
        channelId: `#${client.slack_channel}`,
        taskId: task.id,
        title: task.title,
        priority: task.priority,
        type: task.type,
        createdByName: actorUser?.full_name || 'Vantx',
        locale,
      })
    } catch (err) {
      console.error('[notify] Slack failed for task', taskId, err)
    }
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `renderAsync()` from react-email | `await render()` (render is now async) | React Email v2 / 2024 | Must `await render()` or use Resend's `react:` param directly |
| `next/server` `after()` for post-response work | Not available in Next.js 14 | Next.js 15.0 | Use existing `.catch()` pattern; `after()` is NOT available |
| Separate packages `@react-email/html`, `@react-email/body` etc. | `@react-email/components` (all-in-one) | 2023+ | Single install; all components in one package |
| Attachments-only Slack messages | Blocks inside attachments (for color) | Block Kit 2019 | Color bars require legacy attachment wrapper; blocks alone cannot have color |

**Deprecated/outdated:**
- `renderAsync`: Replaced by async `render()` in @react-email/render v2+. Treat `render()` return value as a Promise.
- `next/server` `after()`: This is Next.js 15+ only. This project is on Next.js 14.2.18. Do not use.
- Direct Supabase insert from client component in `tasks/page.tsx`: Must be replaced with API route call (D-01).

---

## Open Questions

1. **`users` table role filter for task_created admin recipients**
   - What we know: `notifyTaskEvent()` for `task_created` must notify admin/engineer roles (D-12). The `users` table has a `role` column.
   - What's unclear: Supabase `.in('role', ['admin', 'engineer'])` works on a text column — but the table query needs a Supabase filter syntax check. Based on types.ts, `role` is `"admin" | "engineer" | "seller" | "client"` — `.in()` should work.
   - Recommendation: Use `.select('id, email, full_name').in('role', ['admin', 'engineer'])` — standard Supabase query, should work.

2. **Portal deep link for task status change email (D-08)**
   - What we know: Link should go to `/[locale]/portal/tasks/{task_id}`. The locale is deterministic from `client.market`.
   - What's unclear: Whether task detail is a separate page or expand-in-list. Current `tasks/page.tsx` uses expand-in-list. A hash-fragment or query param approach may be needed if no dedicated task detail route exists.
   - Recommendation: Use `/[locale]/portal/tasks` with a `?selected={task_id}` query param as the deep link target, OR just link to `/[locale]/portal/tasks` without task ID. Resolve by checking if a task detail page exists at implementation time.

3. **Billing portal URL for payment emails**
   - What we know: D-06 says "link to billing portal". `stripe.ts` has `createPortalSession()`. `invoice.hosted_invoice_url` is available on finalized invoices.
   - What's unclear: Whether to use `hosted_invoice_url` (direct, no extra Stripe call) or generate a fresh billing portal session (requires Stripe API call, includes full portal). At low volume either works.
   - Recommendation: Use `invoice.hosted_invoice_url` when not null (no extra call). Fall back to `createPortalSession()` if null. Document this as implementation-time decision.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 |
| Config file | `platform/vitest.config.mts` |
| Quick run command | `cd platform && npm run test:run -- src/lib/email.test.ts src/lib/notifications.test.ts src/lib/slack.test.ts` |
| Full suite command | `cd platform && npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOTIF-05 | `sendPaymentEmail()` calls Resend with correct `from`, `to`, bilingual content (EN for US, ES for LATAM) | unit | `vitest run src/lib/email.test.ts` | Wave 0 |
| NOTIF-06 | `sendPaymentEmail()` with `type: 'failed'` sends correct gentle-tone content; Resend error returns `{ error }` | unit | `vitest run src/lib/email.test.ts` | Wave 0 |
| NOTIF-07 | `notifyTaskEvent('task_updated')` sends email to deduplicated `assigned_to`+`created_by`; skips nulls | unit | `vitest run src/lib/notifications.test.ts` | Wave 0 |
| NOTIF-08 | `notifyTaskEvent('task_created')` calls `sendTaskCreatedMessage()` with correct priority color, channel, and portal URL | unit | `vitest run src/lib/notifications.test.ts` | Wave 0 |
| NOTIF-08 | `sendTaskCreatedMessage()` maps priority to correct hex color; skips when `SLACK_BOT_TOKEN` missing | unit | `vitest run src/lib/slack.test.ts` | Wave 0 |
| D-01 | `POST /api/tasks` inserts task and returns 201; fires `notifyTaskEvent` without awaiting | integration-manual | `stripe listen` + manual curl | manual |
| D-02 | Stripe `invoice.paid` webhook returns 200 before email resolves | integration-manual | `stripe trigger invoice.paid` | manual |

**Manual tests flagged**: Stripe webhook behavior and actual email delivery require Stripe CLI and Resend test mode — not automatable in unit tests. Mock Resend in unit tests; verify real delivery via Resend dashboard logs.

### Sampling Rate

- **Per task commit:** `cd platform && npm run test:run -- src/lib/email.test.ts src/lib/notifications.test.ts src/lib/slack.test.ts`
- **Per wave merge:** `cd platform && npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `platform/src/lib/email.test.ts` — covers NOTIF-05, NOTIF-06; mock Resend SDK with `vi.mock('resend')`
- [ ] `platform/src/lib/notifications.test.ts` — covers NOTIF-07, NOTIF-08; mock `email.ts`, `slack.ts`, supabase
- [ ] `platform/src/lib/slack.test.ts` — extends existing slack tests with `sendTaskCreatedMessage` cases; mock `fetch`
- [ ] No framework install needed — Vitest already configured in `platform/vitest.config.mts`

---

## Sources

### Primary (HIGH confidence)

- Resend official docs (https://resend.com/docs/send-with-nextjs) — send method, from/to format, react param
- Resend API reference (https://resend.com/docs/api-reference/emails/send-email) — response shape, idempotency key
- Resend account quotas (https://resend.com/docs/knowledge-base/account-quotas-and-limits) — free tier: 100/day, 3000/month; rate limit: 5 req/s
- npm registry — resend@6.9.4, @react-email/components@1.0.10, @react-email/render@2.0.4 (verified 2026-03-24)
- Next.js official docs (https://nextjs.org/docs/app/api-reference/functions/after) — `after()` is Next.js 15.1+ only, not available in 14.x
- Next.js 14 docs (https://nextjs.org/docs/14/app/api-reference/next-config-js/serverComponentsExternalPackages) — `serverComponentsExternalPackages` config for react-email fix
- Slack developer docs (https://docs.slack.dev/tools/node-slack-sdk/reference/types/interfaces/MessageAttachment/) — color field accepts hex or named values; blocks inside attachments for color bars
- Project source: `platform/src/app/api/webhooks/stripe/route.ts` — fire-and-forget `.catch()` pattern
- Project source: `platform/src/lib/onboard.ts` — orchestrator pattern to mirror
- Project source: `platform/src/lib/slack.ts` — isConfigured(), headers(), chat.postMessage patterns
- Project source: `platform/src/lib/types.ts` — Notification, Task, Client, User types confirmed
- Project source: `platform/supabase/migrations/002_notifications.sql` — notifications table schema confirmed

### Secondary (MEDIUM confidence)

- Vercel community (https://community.vercel.com/t/fire-and-forget-next-js-api-route/15865) — unawaited promises unreliable on Vercel serverless; safe on self-hosted Node.js
- GitHub react-email issue #977 — `serverComponentsExternalPackages` required for Next.js 14 + react-email
- React Email 3.0 blog (https://resend.com/blog/react-email-3) — `render()` is async in v2, `renderAsync` deprecated

### Tertiary (LOW confidence)

- None — all critical claims verified through primary sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against npm registry 2026-03-24
- Architecture: HIGH — derived from existing project patterns + official Resend/Slack docs
- Pitfalls: HIGH — confirmed via official docs (Next.js build issue, Resend rate limits) and project source code review
- Fire-and-forget strategy: HIGH — confirmed Next.js 14 does not have `after()`; existing pattern in codebase is correct

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (Resend/React Email move fast; verify `@react-email/render` async behavior if installing later than this date)
