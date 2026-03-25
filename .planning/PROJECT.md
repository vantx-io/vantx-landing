# Vantix Landing Page System

## What This Is

Sistema de landing pages estático y bilingüe para Vantix — una firma de SRE fraccional que ofrece Performance as a Service, Observability as a Service y Fractional Perf & SRE. El sitio convierte visitantes (CTOs, engineering managers de SaaS mid-size) en demos agendadas via Calendly. Bilingüe inglés/español con auto-detect y toggle. Diseño dark & techy auditado contra impeccable.style y WCAG 2.1 AA.

## Core Value

Convertir visitantes en demos agendadas — si alguien llega al sitio y no hay forma fácil de reservar tiempo, todo lo demás falla.

## Requirements

### Validated

- ✓ Landing page principal (/) con hero, servicios, pricing teaser y CTA Calendly — v1.0
- ✓ Páginas de detalle: Observability as a Service, Fractional Perf & SRE, Misión/Visión — v1.0
- ✓ Sistema de idioma bilingüe (EN/ES) con auto-detect + toggle en navbar — v1.0
- ✓ Calendly embed como mecanismo principal de contacto/demos — v1.0
- ✓ Diseño dark & techy (estética Vercel/Linear) auditado con impeccable.style — v1.0
- ✓ Contenido consolidado de las 4 páginas HTML existentes — v1.0
- ✓ GA4 tracking + Calendly booking event listener — v1.0
- ✓ WCAG 2.1 AA contrast compliance en todos los textos y color modes — v1.0

### Active

- [x] Tests automatizados — foundation completa (Vitest unit 32 tests, Playwright E2E scaffold, CI pipeline) — Validated in Phase 05
- [ ] Admin dashboard — gestión interna Vantix (clientes, suscripciones, métricas)
- [~] Notificaciones — server-side complete: payment emails (Resend), task status emails, Slack on task created, notification DB rows — Validated in Phase 06. Pending: in-app bell UI (Phase 07)
- [ ] Task attachments — upload de archivos en comentarios (schema listo, falta UI + storage)

### Out of Scope

- Backend / CMS — sitio estático, sin servidor
- Blog — diferir a v2
- Autenticación / área privada — vive en la plataforma separada (`07-plataforma/`)
- SEO con URLs `/es/` separadas — tradeoff aceptado en v1 (single-URL toggle)
- Performance as a Service detail page — la página existente funciona (`PAGE-V2-01`)

## Context

**Shipped v1.0 MVP** on 2026-03-24. 50 commits, ~8,779 LOC (HTML/CSS/JS/JSON).
Tech stack: HTML estático + CSS Custom Properties + JavaScript vanilla. No frameworks, no build step.
Hosted as static files in `landing/` directory.

**Pages shipped:**
- `index.html` — main conversion page
- `services/observability.html` — Observability as a Service
- `services/fractional-sre.html` — Fractional Perf & SRE
- `about/mission.html` — Mission, Vision & Values

**Pre-launch blockers (manual):**
- Replace Calendly URL placeholder (`https://calendly.com/vantix/30min`) with real link
- Replace GA4 Measurement ID placeholder (`G-XXXXXXXXXX`) with real ID
- Social proof section has placeholder content — add real testimonials when available

## Constraints

- **Tech stack:** HTML estático + CSS + JavaScript vanilla — sin frameworks
- **Hosting:** Static files — currently in `landing/`, target Cloudflare Pages or similar
- **Calendly:** Requiere cuenta activa de Calendly con link de agendado
- **Idiomas:** Inglés como default, español como alternativa; auto-detect vía `navigator.language`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid structure (main + detail pages) | Main page convierte, detail pages educan — flujo natural | ✓ Good |
| Auto-detect + toggle de idioma | Maximiza UX para ambos mercados sin URLs separadas | ✓ Good |
| Calendly embed (no formulario propio) | Elimina fricción — reserva directa sin intermediarios | ✓ Good |
| Dark & techy visual | Comunica credibilidad técnica, diferencia de consultoras genéricas | ✓ Good |
| Combinar contenido existente | El copy ya está validado; no reinventar, refinar | ✓ Good |
| Fetch-inject partials (nav/footer) | Zero build step, shared across all pages | ✓ Good |
| Single-URL bilingual toggle (no `/es/`) | Simplicity over SEO in v1 — tradeoff documented | ⚠️ Revisit in v2 |
| Google Fonts CDN (DM Sans + JetBrains Mono) | v1 simplicity; consider self-hosting for perf in v2 | ⚠️ Revisit |
| detail.css shared stylesheet for all detail pages | 530 lines, 180 token refs — consistent styling | ✓ Good |
| Dark mode CTA: dark text (#1A1917) on green button | Fixed contrast from 3.50:1 to 5.01:1 WCAG AA pass | ✓ Good |

## Current Milestone: v1.1 Platform Hardening & Admin

**Goal:** Solidificar la plataforma con testing completo, dashboard administrativo interno, sistema de notificaciones in-app + email, y uploads de archivos en tareas.

**Target features:**
- Tests automatizados (unit + integration + e2e Playwright)
- Admin dashboard (equipo Vantix: admin/engineer/seller)
- Notificaciones in-app + email transaccional
- Task attachments (file upload en comentarios)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after Phase 06 (Server-Side Integration) complete*
