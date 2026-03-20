# Requirements: Vantix Landing Page System

**Defined:** 2026-03-20
**Core Value:** Convertir visitantes en demos agendadas — si alguien llega y no puede reservar fácilmente, todo lo demás falla.

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: Sistema de idioma bilingüe — auto-detect vía `navigator.languages`, toggle en navbar, traducciones en JSON (`en.json`, `es.json`), persistencia via `localStorage`
- [ ] **FOUND-02**: Nav y footer compartidos reutilizables en todas las páginas via fetch-inject (sin build step)
- [ ] **FOUND-03**: Arquitectura de URL documentada y decidida: single-URL con toggle JS (seleccionado — tradeoff SEO aceptado explícitamente)

### Design

- [ ] **DSNG-01**: Dark & techy visual (estética Vercel/Linear) con CSS Custom Properties para tokens de color, tipografía y espaciado — WCAG-compliant (ratio ≥4.5:1 en todos los textos)
- [ ] **DSNG-02**: Auditoría con impeccable.style/cheatsheet superada antes de ship

### Main Landing (/)

- [ ] **LAND-01**: Hero con headline principal, subheadline orientado al ICP, y CTA primario que abre Calendly popup
- [ ] **LAND-02**: Pain section con 6 cards de problemas del ICP ("¿Te suena familiar?")
- [ ] **LAND-03**: 3 service cards (Performance as a Service / Observability as a Service / Fractional Perf & SRE) con links a páginas de detalle
- [ ] **LAND-04**: Pricing teaser con tier names y precios visibles (no "contáctanos para pricing")

### Detail Pages

- [ ] **PAGE-01**: Página Observability as a Service — refactorizar `vantix-observability-as-a-service.html` al nuevo sistema (dark theme + i18n + partials)
- [ ] **PAGE-02**: Página Fractional Perf & SRE — nueva página (el servicio existe en la landing v3 pero sin página propia)
- [ ] **PAGE-03**: Página Misión / Visión / Valores — refactorizar `vantix-mision-vision-valores.html` al nuevo dark theme + i18n

### Analytics

- [ ] **ANLT-01**: Google Analytics 4 — tracking base (pageviews, eventos)
- [ ] **ANLT-02**: Calendly booking tracking — listener `window.addEventListener('message', ...)` para evento `calendly.event_scheduled` → GA4 event

## v2 Requirements

### Detail Pages

- **PAGE-V2-01**: Página Performance as a Service — refactorizar `vantix-performance-as-a-service.html` (diferida: la página existente puede vivir como está)

### SEO

- **SEO-V2-01**: URLs separadas `/es/` con `hreflang` para indexación en español — diferido (tradeoff documentado: v1 usa single-URL toggle)

### Design System

- **DSNG-V2-01**: Librería de componentes documentada (storybook o equivalente)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend / CMS | Sitio estático — sin servidor en v1 |
| Formulario de contacto propio | Anti-feature: más fricción que Calendly, requiere backend para email delivery |
| Blog | Diferir a v2 — no impacta conversión en v1 |
| Área autenticada | Vive en `07-plataforma/vantix-platform/` — scope diferente |
| Mobile app | Web-first |
| URLs `/es/` separadas | Complejidad de duplicación de contenido; tradeoff aceptado en v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| DSNG-01 | Phase 1 | Pending |
| DSNG-02 | Phase 4 | Pending |
| LAND-01 | Phase 2 | Pending |
| LAND-02 | Phase 2 | Pending |
| LAND-03 | Phase 2 | Pending |
| LAND-04 | Phase 2 | Pending |
| PAGE-01 | Phase 3 | Pending |
| PAGE-02 | Phase 3 | Pending |
| PAGE-03 | Phase 3 | Pending |
| ANLT-01 | Phase 2 | Pending |
| ANLT-02 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after roadmap creation*
