# Vantix Landing Page System

## What This Is

Sistema de landing pages híbrido para Vantix — una firma de SRE fraccional que ofrece Performance as a Service, Observability as a Service y Fractional Perf & SRE. El sitio convierte visitantes (CTOs, engineering managers de SaaS mid-size) en demos agendadas via Calendly. Bilingüe inglés/español con auto-detect de idioma. Diseño dark & techy, consistente con el posicionamiento técnico de la marca.

## Core Value

Convertir visitantes en demos agendadas — si alguien llega al sitio y no hay forma fácil de reservar tiempo, todo lo demás falla.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Landing page principal (/) con hero, servicios, cómo funciona, pricing teaser y CTA Calendly
- [ ] Páginas de detalle de servicio: Performance as a Service, Observability as a Service, Fractional Perf & SRE
- [ ] Sistema de idioma bilingüe (EN/ES) con auto-detect del browser + toggle en navbar
- [ ] Embed de Calendly como mecanismo principal de contacto/agendado de demos
- [ ] Diseño dark & techy (estética tipo Vercel/Linear) auditado con impeccable.style
- [ ] Combinar el mejor contenido de las 4 páginas HTML existentes en `06-landing-pages/`

### Out of Scope

- Backend / CMS — sitio estático, sin servidor
- Blog — diferir a v2
- Autenticación / área privada — vive en la plataforma separada (`07-plataforma/`)
- SEO server-side rendering — HTML estático es suficiente para v1

## Context

- **Existente:** 4 páginas HTML estáticas en `06-landing-pages/`: `vantix-landing-v3.html`, `vantix-performance-as-a-service.html`, `vantix-observability-as-a-service.html`, `vantix-mision-vision-valores.html`
- **Contenido a aprovechar:** Headlines, copy de servicios y estructura narrativa ya validada en las páginas existentes
- **Posicionamiento:** Alternativa al SRE full-time ($150K+/yr) — experiencia enterprise, precio startup. No competimos con Datadog/Grafana, los complementamos.
- **ICP:** CTOs / Engineering Managers de SaaS mid-size que ya tienen herramientas de monitoreo pero nadie para interpretarlas y actuar
- **Plataforma destino:** Los clientes que agendan demo eventualmente acceden a `07-plataforma/vantix-platform/` — el portal de cliente
- **Auditoría de diseño:** Usar impeccable.style/cheatsheet para validar calidad visual antes de ship

## Constraints

- **Tech stack:** HTML estático + CSS + JavaScript vanilla — sin frameworks, consistente con páginas existentes
- **Hosting:** Archivos estáticos en `06-landing-pages/` — no requiere servidor
- **Calendly:** Requiere cuenta activa de Calendly con link de agendado
- **Idiomas:** Inglés como default, español como alternativa; auto-detect vía `navigator.language`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid structure (main + detail pages) | Main page convierte, detail pages educan — flujo natural | — Pending |
| Auto-detect + toggle de idioma | Maximiza UX para ambos mercados sin URLs separadas | — Pending |
| Calendly embed (no formulario propio) | Elimina fricción — reserva directa sin intermediarios | — Pending |
| Dark & techy visual | Comunica credibilidad técnica, diferencia de consultoras genéricas | — Pending |
| Combinar contenido existente | El copy ya está validado; no reinventar, refinar | — Pending |

---
*Last updated: 2026-03-20 after initialization*
