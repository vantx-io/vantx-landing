# Milestones

## v1.1 Platform Hardening & Admin (Shipped: 2026-03-25)

**Phases completed:** 5 phases, 13 plans, 25 tasks

**Key accomplishments:**

- Notifications table (RLS + indexes) and private task-attachments storage bucket provisioned as SQL migrations, with matching TypeScript Notification type exported from types.ts
- Task 1: Vitest infrastructure
- GitHub Actions secrets required before E2E tests pass in CI:
- Resend + React Email payment pipeline: bilingual payment success/failure emails via Stripe webhook with matching in-app notification rows, all fire-and-forget
- Task notification pipeline: notifyTaskEvent orchestrator dispatches bilingual email + Slack Block Kit + notification rows for task_created/task_updated, with API routes replacing direct Supabase inserts
- Supabase Realtime bell component with live unread badge (9+ cap, animate-ping), dropdown list with type icons and relative timestamps, markRead/markAllRead, click-outside/Escape close, and i18n in EN/ES
- NotificationBell mounted in portal sidebar header plus Playwright cross-tenant E2E test proving RLS isolation between two users via service-role insert and dual browser context
- Supabase RLS migration for cross-client access, middleware role guard on /admin routes, and admin layout with dark sidebar and NotificationBell completing NOTIF-09
- Admin overview page (ADMIN-03) with 4 stat cards and 20-event activity feed, plus searchable client list page (ADMIN-04) with subscription details.
- Cross-client task view with three filter dropdowns, billing overview with 4 stat cards and payment/subscription tables, and Playwright E2E test proving middleware redirect enforcement for client-role users
- CommentForm with react-dropzone drag-and-drop, client-side validation (executables + 50MB), simulated progress bars, Supabase Storage upload, plus inline task title editing and status dropdown
- Image thumbnails with lightbox modal, non-image file cards with file size from Storage metadata, and signed URL downloads in comment thread
- Login flow, task CRUD with inline title edit + status change + file attachment, and cross-tenant storage isolation E2E tests using Playwright filechooser and dual browser contexts

---

## v1.0 MVP (Shipped: 2026-03-24)

**Phases completed:** 4 phases, 8 plans
**Timeline:** 5 days (2026-03-20 → 2026-03-24)
**Stats:** 50 commits, 77 files, +16,169 lines, ~8,779 LOC (HTML/CSS/JS/JSON)
**Git range:** `97df523..2263d38`

**Delivered:** Bilingual static landing page system converting visitors to Calendly demos — dark & techy design, 4 pages, WCAG 2.1 AA compliant.

**Key accomplishments:**

1. Bilingual foundation (EN/ES) with auto-detect, navbar toggle, and localStorage persistence — zero build tools, fetch-inject partials
2. Main landing page with hero, 6 pain cards, 3 service cards, pricing teaser, Calendly popup, and GA4 booking tracking
3. Shared detail.css (530 lines, 180 token references) powering all detail pages with consistent dark theme
4. Three detail pages — Observability, Fractional SRE, Mission/Vision — fully bilingual with Calendly CTAs
5. CSS polish: credibility bar animation, hero height fix, CLS elimination, deliverables grid, service-specific FAQs
6. WCAG 2.1 AA contrast verified across all pages in both color modes; 25-point launch gate checklist passed

---
