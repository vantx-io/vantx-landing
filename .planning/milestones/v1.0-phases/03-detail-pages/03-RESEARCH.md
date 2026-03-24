# Phase 3: Detail Pages - Research

**Researched:** 2026-03-20
**Domain:** Static HTML detail pages — refactoring legacy light-theme pages into the Phase 1/2 dark design system with shared partials and i18n
**Confidence:** HIGH — all findings are based on direct audit of the actual codebase, no external speculation required

---

## Summary

Three detail pages need to be delivered: `services/observability.html` (refactor of existing file), `services/fractional-sre.html` (net-new, the service exists on index.html but has no dedicated page), and `about/mission.html` (refactor of existing file). The destination directories `06-landing-pages/services/` and `06-landing-pages/about/` already exist as empty folders — the correct file paths are pre-confirmed by the nav and footer partials, which already link to these exact URLs.

The existing legacy files (`vantix-observability-as-a-service.html`, `vantix-performance-as-a-service.html`, `vantix-mision-vision-valores.html`) contain rich bilingual Spanish content that must be preserved and ported. None of them use the dark design system, shared partials, or the i18n infrastructure — they are self-contained with inline light-theme CSS and hard-coded Spanish text. The refactor work is a full rewrite of the HTML shell around existing content, not a design overhaul of the content itself.

Every detail page must use the identical script/CSS boot sequence as `index.html`, with one difference: `window.VANTIX_BASE = '..'` instead of `'.'` because these pages sit one directory level deep. The i18n system and Calendly integration patterns from `index.html` are the reference implementation — they must be copied exactly, not reimplemented.

**Primary recommendation:** Write each detail page as a new file following the `index.html` boilerplate exactly (CSS links, script load order, `VANTIX_BASE`, Calendly setup), then port the content sections from the legacy files into translated `data-i18n` keys, adding new translation keys to `en.json` and `es.json`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAGE-01 | Observability as a Service detail page — refactor `vantix-observability-as-a-service.html` to dark theme + i18n + shared partials | Existing legacy file audited; content inventory complete; target path `services/observability.html` confirmed by footer partial |
| PAGE-02 | Fractional Perf & SRE detail page — new page (service exists on index.html but has no dedicated page) | Service content exists in `en.json`/`es.json` under `services.sre.*`; target path `services/fractional-sre.html` confirmed by footer partial |
| PAGE-03 | Mission / Vision / Values page — refactor `vantix-mision-vision-valores.html` to dark theme + i18n | Existing legacy file audited; all content in Spanish only, needs EN translation keys; target path `about/mission.html` confirmed by nav and footer partials |
</phase_requirements>

---

## Audit: What the Existing Legacy Files Currently Have

This is the most important section. It answers exactly what needs to change.

### `vantix-observability-as-a-service.html`

| Property | Current State | Required State |
|----------|---------------|----------------|
| Theme | Light (white background `#fff`, dark navy text `#1B2A4A`) | Dark (`--color-bg: #09090b`) |
| CSS | Inline `<style>` with raw hex values | External `tokens.css`, `base.css`, plus page CSS |
| Nav | None — no navigation at all | `<div data-partial="nav"></div>` |
| Footer | Minimal `<footer>` with single line, inline CSS | `<div data-partial="footer"></div>` |
| i18n | None — all text hard-coded in Spanish | `data-i18n` attributes pointing to JSON keys |
| Calendly | `<a href="https://calendly.com/vantix/15min">` link only (not popup) | `js-calendly-trigger` popup pattern |
| Language | Spanish only | Bilingual EN/ES via i18n system |
| Scripts | None | `i18n.js`, `partials.js`, Calendly widget JS |
| File location | `06-landing-pages/` root | `06-landing-pages/services/observability.html` |
| VANTIX_BASE | Not set | Must be `'..'` (one level deep) |

**Content available in legacy file (Spanish):**
- Service tag: "OBSERVABILITY AS A SERVICE"
- Hero headline + subheadline
- Problem section (2 paragraphs)
- 6 numbered deliverables with titles, descriptions, and tool/frequency badges
- 3 outcome cards
- "Cómo funciona" timeline (6 steps)
- Pricing section (2 price cards: one-shot baseline + monthly managed)
- CTA section with Calendly link

**Pricing conflict:** The legacy file shows LATAM pricing (`$9,500` one-shot / `$3,500/mes` managed) which differs from the unified `$3,000/month` shown on `index.html`. The index.html pricing (`$3,000/month`) is the canonical v1 price — the detail page should present the managed retainer price consistent with the landing page.

---

### `vantix-performance-as-a-service.html`

| Property | Current State | Required State |
|----------|---------------|----------------|
| Theme | Light (same `#1B2A4A` / `#fff` pattern) | Dark design system |
| Nav/Footer | None | Shared partials |
| i18n | None — Spanish only | Bilingual |
| Calendly | `<a href="https://calendly.com/vantix/15min">` link | Popup pattern |
| Status | v2 deferred (PAGE-V2-01) | Not touched in Phase 3 |

**This file is explicitly deferred to v2 (PAGE-V2-01).** It is documented here for completeness but is OUT OF SCOPE for Phase 3.

---

### `vantix-mision-vision-valores.html`

| Property | Current State | Required State |
|----------|---------------|----------------|
| Theme | Light theme, white background | Dark design system |
| CSS | Inline `<style>` with raw hex | External CSS files |
| Nav | Single logo only (no nav bar) | Shared nav partial |
| Footer | Single line `<footer>` div | Shared footer partial |
| i18n | None — all Spanish | Bilingual EN/ES |
| Calendly | None | CTA section with Calendly trigger |
| File location | `06-landing-pages/` root | `06-landing-pages/about/mission.html` |
| VANTIX_BASE | Not set | Must be `'..'` |

**Content available in legacy file (Spanish):**
- Mission block (label + headline + paragraph)
- Vision block (label + headline + paragraph)
- Purpose block (label + headline)
- 6 values cards (01–06 with title + description)
- Manifesto list (8 belief statements)

**No Calendly at all** — needs a conversion CTA section added. The `cta_section.*` i18n keys already exist in both `en.json` and `es.json`.

---

## Standard Stack

No new libraries required. Phase 3 reuses everything built in Phases 1 and 2.

### Core (already installed)
| Asset | Location | Purpose |
|-------|----------|---------|
| `css/tokens.css` | `06-landing-pages/css/tokens.css` | All design tokens — colors, spacing, typography |
| `css/base.css` | `06-landing-pages/css/base.css` | Reset, nav, footer, buttons, layout utilities |
| `css/landing.css` | `06-landing-pages/css/landing.css` | Section-level styles for hero, pain, services, pricing, CTA |
| `js/i18n.js` | `06-landing-pages/js/i18n.js` | Bilingual language system |
| `js/partials.js` | `06-landing-pages/js/partials.js` | Fetch-inject nav + footer; boots i18n |
| `partials/nav.html` | `06-landing-pages/partials/nav.html` | Shared nav markup |
| `partials/footer.html` | `06-landing-pages/partials/footer.html` | Shared footer markup |
| `i18n/en.json` | `06-landing-pages/i18n/en.json` | English translations |
| `i18n/es.json` | `06-landing-pages/i18n/es.json` | Spanish translations |

### What Needs to be Created
| Item | Location | Notes |
|------|----------|-------|
| `services/observability.html` | `06-landing-pages/services/` | Rewrite of legacy file |
| `services/fractional-sre.html` | `06-landing-pages/services/` | Net-new page |
| `about/mission.html` | `06-landing-pages/about/` | Rewrite of legacy file |
| New i18n keys | `en.json` and `es.json` | Detail page content keys |
| Optional: `css/detail.css` | `06-landing-pages/css/` | Page-specific styles not in base/landing |

---

## Architecture Patterns

### Pattern 1: Page HTML Boilerplate (one level deep)

Every detail page must use this exact shell, differing from `index.html` only in `VANTIX_BASE = '..'`, the `<title>`, `<meta description>`, and the `<link>` and `<script>` paths using `../css/` and `../js/`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="[page-specific description]">
  <title>[Page Title] — Vantix</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">

  <!-- Design system — paths use ../ because this page is one level deep -->
  <link rel="stylesheet" href="../css/tokens.css">
  <link rel="stylesheet" href="../css/base.css">
  <link rel="stylesheet" href="../css/detail.css">

  <!-- Calendly widget CSS -->
  <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
</head>

<body>
  <div data-partial="nav"></div>

  <main id="main-content" tabindex="-1">
    <!-- Page sections here -->
  </main>

  <div data-partial="footer"></div>

  <!-- Load order matters: VANTIX_BASE first, then i18n, then partials -->
  <script>window.VANTIX_BASE = '..';</script>
  <script src="../js/i18n.js"></script>
  <script src="../js/partials.js"></script>

  <!-- Calendly widget JS -->
  <script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async></script>

  <!-- Calendly popup trigger -->
  <script>
    var CALENDLY_URL = 'https://calendly.com/vantix/30min';
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('.js-calendly-trigger, [href="#calendly"]');
      if (!trigger) return;
      e.preventDefault();
      if (window.Calendly) {
        Calendly.initPopupWidget({ url: CALENDLY_URL });
      } else {
        window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
      }
    });
  </script>
</body>
</html>
```

**Source:** Direct audit of `06-landing-pages/index.html` (lines 1–388) and `06-landing-pages/js/partials.js` (VANTIX_BASE pattern, lines 22–26).

### Pattern 2: i18n Key Naming Convention

Keys are dot-notation namespaced. Existing keys follow this pattern:
- `services.observability.tag` / `services.observability.headline` / `services.observability.description`
- `footer.observability` / `footer.sre` / `footer.mission`

Detail page keys should follow the same namespace pattern:
```
obs_page.hero.tag
obs_page.hero.headline
obs_page.hero.subheadline
obs_page.deliverables.heading
obs_page.deliverables.items.0.title
obs_page.deliverables.items.0.body
... (and so on for each page)
```

Or alternatively use longer top-level namespaces:
```
pages.observability.hero.headline
pages.fractional_sre.hero.headline
pages.mission.heading
```

Both conventions work with the existing `i18n.t()` resolver which handles arbitrarily deep dot-notation keys.

### Pattern 3: Calendly Conversion Moment

Each service detail page ends with a `<section class="cta-section section">` using the existing `cta_section.*` keys and `js-calendly-trigger` button class. This is identical to the closing CTA on `index.html` — no new pattern needed.

```html
<section class="cta-section section" aria-labelledby="page-cta-heading">
  <div class="container">
    <div class="cta-section__inner">
      <h2 id="page-cta-heading" class="cta-section__heading" data-i18n="cta_section.heading">
        Ready to stop guessing?
      </h2>
      <p class="cta-section__sub" data-i18n="cta_section.subheading">...</p>
      <div class="cta-section__actions">
        <button class="btn btn--primary btn--lg js-calendly-trigger" type="button"
          data-i18n="cta_section.cta_primary">Book a Free Demo</button>
      </div>
    </div>
  </div>
</section>
```

**Source:** `06-landing-pages/index.html` lines 314–335; `06-landing-pages/css/landing.css` lines 431–484.

### Pattern 4: Page Hero for Detail Pages

The `index.html` hero is full-viewport height, designed for the main landing. Detail page heroes should be shorter — use `min-height` of `40–50vh` or a fixed `padding: 80px 0 60px` rather than `calc(100vh - var(--nav-height))`. This avoids the impression that there is no content below the fold on a detail page.

The existing `.hero` class uses `min-height: calc(100vh - var(--nav-height))`. Detail pages should define an override or use a new modifier class `.hero--detail` in `detail.css`.

### Recommended Project Structure (after Phase 3)

```
06-landing-pages/
├── css/
│   ├── tokens.css          # Design tokens (existing)
│   ├── base.css            # Nav, footer, buttons, reset (existing)
│   ├── landing.css         # index.html sections (existing)
│   └── detail.css          # Detail page sections (new — Phase 3)
├── js/
│   ├── i18n.js             # i18n system (existing)
│   └── partials.js         # Partial injector (existing)
├── partials/
│   ├── nav.html            # Shared nav (existing)
│   └── footer.html         # Shared footer (existing)
├── i18n/
│   ├── en.json             # English — extended with detail page keys (existing + new keys)
│   └── es.json             # Spanish — extended with detail page keys (existing + new keys)
├── services/
│   ├── observability.html  # PAGE-01 (new — Phase 3)
│   └── fractional-sre.html # PAGE-02 (new — Phase 3)
├── about/
│   └── mission.html        # PAGE-03 (new — Phase 3)
└── index.html              # Main landing (existing)
```

### Anti-Patterns to Avoid

- **Inline `<style>` tags:** The legacy files all use inline CSS. New pages must use external CSS files. No inline styles.
- **Hard-coded text:** Every user-visible text string must be in a `data-i18n` attribute, not hard-coded HTML. Hard-coded text will not switch when the language toggles.
- **`window.VANTIX_BASE = '.'` on nested pages:** Using `'.'` on a page in `services/` or `about/` will make all fetch calls resolve relative to that subdirectory. The `i18n/en.json` fetch becomes `services/i18n/en.json` which does not exist. Must use `'..'`.
- **Calendly `<a>` links instead of popup:** The legacy files use a plain `<a href="https://calendly.com/vantix/15min">`. The new pattern is the popup widget triggered by `.js-calendly-trigger` class. Using an `<a>` link navigates away from the page; the popup keeps users on-site.
- **Raw hex values in CSS:** All color/spacing values must use CSS Custom Properties from `tokens.css`. Raw hex violates the design system constraint (DSNG-01).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Language switching | Custom fetch + DOM swap logic | Existing `window.i18n.setLang()` | Already built and battle-tested in Phase 1 |
| Nav and footer | Copy-paste HTML into each page | `<div data-partial="nav">` + `partials.js` | Editing one file updates all pages simultaneously |
| Calendly popup | `<a>` link or custom modal | `.js-calendly-trigger` + existing `document.addEventListener('click')` block | The event delegation already handles all triggers including `[href="#calendly"]` |
| Dark theme styles | New CSS from scratch | `tokens.css` + `base.css` | All tokens, buttons, nav, footer, layout already defined |
| Mobile nav | New JS | Existing `wireMobileNav()` in `partials.js` | Already handles toggle, aria-expanded, drawer close-on-link-click |

**Key insight:** The Phase 1 and Phase 2 infrastructure was explicitly designed to make Phase 3 a content authoring task, not an infrastructure task. The only new CSS needed is detail-page-specific layout (hero height override, deliverables grid, timeline styling). All shared chrome is inherited.

---

## i18n Gap Analysis

### Keys That Already Exist (reusable on detail pages)
These keys are already in both `en.json` and `es.json` and can be used directly:

| Key | EN value | ES value |
|-----|----------|----------|
| `services.observability.tag` | "Observability as a Service" | "Observabilidad como Servicio" |
| `services.observability.headline` | "See everything that matters." | "Ve todo lo que importa." |
| `services.observability.description` | Full description | Full description |
| `services.observability.features.0–3` | 4 feature bullets | 4 feature bullets |
| `services.observability.price` | "$3,000" | "$3,000" |
| `services.observability.price_period` | "/month" | "/mes" |
| `services.sre.tag` | "Fractional SRE" | "SRE Fraccional" |
| `services.sre.headline` | "Senior SRE expertise, startup budget." | "Experiencia SRE senior, presupuesto startup." |
| `services.sre.description` | Full description | Full description |
| `services.sre.features.0–3` | 4 feature bullets | 4 feature bullets |
| `services.sre.price` | "$5,500" | "$5,500" |
| `cta_section.heading` | "Ready to stop guessing?" | "¿Listo para dejar de adivinar?" |
| `cta_section.subheading` | Full subheadline | Full subheadline |
| `cta_section.cta_primary` | "Book a Free Demo" | "Agendar Demo Gratis" |
| `nav.*` | All nav keys | All nav keys |
| `footer.*` | All footer keys | All footer keys |

### Keys That Must Be Added (net-new for detail pages)

The legacy files contain detailed Spanish content not yet in the translation files. These must be added to both `en.json` and `es.json`.

**For `services/observability.html` (PAGE-01):**
```
obs_page.hero.pill
obs_page.hero.headline
obs_page.hero.subheadline
obs_page.problem.body_1
obs_page.problem.body_2
obs_page.deliverables.heading
obs_page.deliverables.intro
obs_page.deliverables.items.0.title  (through .5.title)
obs_page.deliverables.items.0.body   (through .5.body)
obs_page.outcomes.heading
obs_page.outcomes.items.0.title      (through .2.title)
obs_page.outcomes.items.0.body       (through .2.body)
obs_page.how.heading
obs_page.how.steps.0.title           (through .5.title)
obs_page.how.steps.0.body            (through .5.body)
```

**For `services/fractional-sre.html` (PAGE-02):**
The service card content in `services.sre.*` provides starting-point material. Equivalent deep content (deliverables, outcomes, timeline, problem statement) needs to be authored — the observability legacy file structure provides the template.

```
sre_page.hero.pill
sre_page.hero.headline
sre_page.hero.subheadline
sre_page.problem.body_1
sre_page.deliverables.heading
sre_page.deliverables.intro
sre_page.deliverables.items.0–N.title
sre_page.deliverables.items.0–N.body
sre_page.outcomes.heading
sre_page.outcomes.items.0–2.title
sre_page.outcomes.items.0–2.body
sre_page.how.heading
sre_page.how.steps.0–N.title
sre_page.how.steps.0–N.body
```

**For `about/mission.html` (PAGE-03):**
The legacy file is entirely Spanish. All content needs English translation added.

```
mission_page.header.sub
mission_page.mission.label
mission_page.mission.heading
mission_page.mission.body
mission_page.vision.label
mission_page.vision.heading
mission_page.vision.body
mission_page.purpose.label
mission_page.purpose.heading
mission_page.values.section_label
mission_page.values.items.0–5.num
mission_page.values.items.0–5.title
mission_page.values.items.0–5.body
mission_page.manifesto.label
mission_page.manifesto.items.0–7
```

---

## Common Pitfalls

### Pitfall 1: VANTIX_BASE set to wrong value
**What goes wrong:** Setting `window.VANTIX_BASE = '.'` on `services/observability.html` causes all fetch calls to resolve relative to `services/`. The i18n system tries to fetch `services/i18n/en.json` and `services/partials/nav.html` — both 404. Page renders blank with no nav, no footer, and English fallback text (key names) instead of content.
**Why it happens:** Copy-paste from `index.html` without updating the base path.
**How to avoid:** Every page in `services/` and `about/` must have `window.VANTIX_BASE = '..'` as the first script.
**Warning signs:** Nav and footer div show empty in browser; console shows 404 errors for `/services/partials/nav.html`.

### Pitfall 2: Missing data-i18n attributes cause hardcoded text
**What goes wrong:** Some text never switches when language is toggled, because the element has no `data-i18n` attribute.
**Why it happens:** Authoring HTML quickly and forgetting to add the attribute to every text node.
**How to avoid:** Before completing each page, do a find-in-file for any text string that appears in neither a `data-i18n` nor a `data-i18n-html` attribute. Check every `<h1>`, `<h2>`, `<h3>`, `<p>`, `<li>`, `<span>`, and button element.
**Warning signs:** Toggle the language and visually scan for any text that does not change.

### Pitfall 3: i18n keys missing from one language file
**What goes wrong:** A key exists in `en.json` but not `es.json` (or vice versa). When the user switches to the missing language, the i18n `t()` function returns the key string itself (e.g., `"obs_page.hero.headline"`) as visible text.
**Why it happens:** Adding keys to one file and forgetting the other.
**How to avoid:** Always add keys to both `en.json` and `es.json` in the same commit. Use the same JSON path in both files.
**Warning signs:** Switching to Spanish shows raw dot-notation key strings in the page.

### Pitfall 4: CSS file paths not updated for subdirectory
**What goes wrong:** `<link rel="stylesheet" href="./css/tokens.css">` on a page in `services/` resolves to `services/css/tokens.css` (404). Page renders unstyled.
**Why it happens:** Copy-paste from `index.html` without updating relative paths.
**How to avoid:** Pages in `services/` and `about/` must use `../css/tokens.css`, `../css/base.css`, `../js/i18n.js`, etc.
**Warning signs:** Page renders with no styling at all — white background, no nav.

### Pitfall 5: Pricing inconsistency between detail page and index.html
**What goes wrong:** The legacy observability file shows LATAM pricing (`$9,500 one-shot`, `$3,500/mes`) which differs from the canonical `$3,000/month` on `index.html`. Using the legacy prices creates a confusing discrepancy.
**Why it happens:** The legacy file predates the v1 pricing decision.
**How to avoid:** Use the prices from `index.html` / `en.json` as canonical: Observability at `$3,000/month`, SRE at `$5,500/month`. The detailed LATAM pricing from the legacy files should be omitted or deferred.

### Pitfall 6: No Calendly on mission/values page
**What goes wrong:** PAGE-03 (mission.html) must satisfy the success criterion that "each service detail page contains a Calendly booking entry point." The mission page is not technically a service detail page, but it still needs a conversion moment — the success criteria specifies Calendly on each service detail page (observability + fractional-sre); the mission page should still have a closing CTA section.
**Note:** Read success criterion 3 carefully: "Each service detail page" — this applies to PAGE-01 and PAGE-02. PAGE-03 should have a CTA section but the Calendly requirement may be interpreted as optional. Add it anyway for conversion consistency.

---

## Content Inventory for net-new PAGE-02 (Fractional SRE)

There is no legacy file for `services/fractional-sre.html`. Content must be authored. The existing `services.sre.*` keys provide the service card content. The observability page structure provides the pattern:

**Structure to replicate:**
1. Hero — tag + headline + subheadline (adapt from `services.sre.headline` and `services.sre.description`)
2. Problem section — why teams lack SRE capability (adapt from `pain.cards.3.title/body` and `pain.cards.5.title/body`)
3. Deliverables — 4–6 numbered deliverables (based on `services.sre.features.0–3`, expanded)
4. Outcomes — 3 outcome cards
5. How it works — engagement timeline (kick-off, weeks 1–3, monthly cadence)
6. CTA section — reuse `cta_section.*` keys

**Suggested deliverables for Fractional SRE page** (derived from existing feature list):
1. Dedicated fractional SRE embedded in your team (10–20 hrs/week)
2. Architecture review + reliability roadmap
3. Incident command & post-mortem facilitation
4. Escalation path during live incidents
5. SLO program definition and tracking
6. Async communication (Slack) + optional weekly sync

---

## Validation Architecture

`nyquist_validation` is enabled in `.planning/config.json`. This is a pure static HTML project with no build step, no test runner, and no installed testing framework. Automated tests are not feasible for this phase — all validation is visual/manual.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — static HTML, no test runner installed |
| Config file | None |
| Quick run command | Open in browser via local file or `python3 -m http.server 8080` |
| Full suite command | Manual visual checklist (see below) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGE-01 | `services/observability.html` loads with dark theme, shared nav + footer | manual-only | n/a — open in browser | ❌ Wave 0 |
| PAGE-01 | Language toggle switches all text on observability page | manual-only | n/a | ❌ Wave 0 |
| PAGE-01 | Calendly popup opens when CTA clicked | manual-only | n/a | ❌ Wave 0 |
| PAGE-02 | `services/fractional-sre.html` loads with dark theme, shared nav + footer | manual-only | n/a | ❌ Wave 0 |
| PAGE-02 | Language toggle switches all text on fractional-sre page | manual-only | n/a | ❌ Wave 0 |
| PAGE-02 | Calendly popup opens when CTA clicked | manual-only | n/a | ❌ Wave 0 |
| PAGE-03 | `about/mission.html` loads with dark theme, shared nav + footer | manual-only | n/a | ❌ Wave 0 |
| PAGE-03 | Language toggle switches all text on mission page | manual-only | n/a | ❌ Wave 0 |
| Cross-page | Switching language on index.html, navigating to detail page shows correct language (localStorage persistence) | manual-only | n/a | ❌ Wave 0 |

**Manual-only justification:** All requirements involve visual rendering, CSS inheritance, and browser-level localStorage behavior. None are unit-testable without a headless browser framework (Playwright/Puppeteer), which is not installed and would be disproportionate infrastructure for a 3-page static site refactor.

### Quick Validation Script

A `python3 -m http.server 8080` in `06-landing-pages/` allows all pages to be tested at `http://localhost:8080/services/observability.html`, `http://localhost:8080/services/fractional-sre.html`, and `http://localhost:8080/about/mission.html`. This is the equivalent of the "quick run command."

### Wave 0 Gaps

- [ ] `services/observability.html` — PAGE-01 target file (does not exist yet)
- [ ] `services/fractional-sre.html` — PAGE-02 target file (does not exist yet)
- [ ] `about/mission.html` — PAGE-03 target file (does not exist yet)
- [ ] New i18n keys in `en.json` and `es.json` — required before any page can be tested bilingual

---

## State of the Art

| Old Pattern (Legacy Files) | Current Pattern (Phase 1/2 System) | Impact |
|---------------------------|-------------------------------------|--------|
| Inline `<style>` blocks with raw hex values | External `tokens.css` + `base.css` + page CSS | Single source of truth for design; no duplication |
| Hard-coded Spanish text in HTML | `data-i18n` attributes + JSON files | Language-switchable without page reload |
| No navigation | `<div data-partial="nav">` + `partials.js` | Consistent nav across all pages; one file to edit |
| Footer: one line or none | `<div data-partial="footer">` | Full footer with links |
| Calendly as plain `<a>` link | Popup widget via `.js-calendly-trigger` | Users stay on page during booking |
| Pages in root `/` of `06-landing-pages/` | Pages in `services/` and `about/` subdirs | Matches nav/footer link targets; clean URL structure |

---

## Open Questions

1. **Should detail pages have GA4 tracking?**
   - What we know: `index.html` includes GA4 snippet with `G-XXXXXXXXXX` placeholder.
   - What's unclear: The requirements (PAGE-01, PAGE-02, PAGE-03) do not mention GA4 on detail pages. The ANLT-01/02 requirements were assigned to Phase 2.
   - Recommendation: Include GA4 snippet on detail pages for consistent tracking. Copy the `G-XXXXXXXXXX` placeholder from `index.html`. The same placeholder needs to be replaced before launch in all pages.

2. **Should detail pages get a dedicated `detail.css` or reuse `landing.css`?**
   - What we know: `landing.css` contains styles for `.hero`, `.pain__grid`, `.services__grid`, `.pricing`, `.cta-section`. Detail pages will have some of the same sections (hero, cta-section) plus new ones (deliverables, timeline, outcomes).
   - What's unclear: Whether the planner should create one shared `detail.css` or per-page CSS.
   - Recommendation: One shared `detail.css` for all detail pages. Styles scoped to detail-page sections (`.page-hero`, `.deliverables`, `.timeline`, `.outcomes-grid`). This avoids per-page CSS proliferation.

3. **English content for `about/mission.html`**
   - What we know: The legacy file is entirely in Spanish. Excellent Spanish content exists.
   - What's unclear: The owner needs to provide or approve English translations of the mission, vision, purpose, values, and manifesto. These cannot be auto-translated programmatically in this phase — they require human-quality translation.
   - Recommendation: Flag in the plan that English copy for `mission_page.*` keys needs human review before the `en.json` entries are finalized. The planner should mark this as a content dependency.

4. **English content for `services/observability.html` detail sections**
   - What we know: The legacy file has 6 detailed deliverables, outcomes, and timeline steps — all in Spanish.
   - What's unclear: Same translation authoring question as above.
   - Recommendation: The Spanish content is authoritative. English translations should be authored when adding keys to `en.json`. Flag as content work, not just code work.

---

## Sources

### Primary (HIGH confidence)
All findings in this document are derived from direct file reads of the actual codebase. No external research was needed — the project is self-contained.

- `06-landing-pages/index.html` — reference implementation for page boilerplate, Calendly popup pattern, GA4, script load order
- `06-landing-pages/js/i18n.js` — VANTIX_BASE pattern, i18n public API, fetch URL construction
- `06-landing-pages/js/partials.js` — boot sequence, partial injection, mobile nav wiring
- `06-landing-pages/partials/nav.html` — canonical link targets (`/services/observability.html`, `/services/fractional-sre.html`, `/about/mission.html`)
- `06-landing-pages/partials/footer.html` — canonical link targets confirming URL structure
- `06-landing-pages/css/tokens.css` — full design token reference
- `06-landing-pages/css/base.css` — all shared component CSS (nav, footer, buttons, layout)
- `06-landing-pages/css/landing.css` — section styles including `.cta-section`
- `06-landing-pages/i18n/en.json` + `es.json` — complete translation inventory
- `06-landing-pages/vantix-observability-as-a-service.html` — legacy content to port for PAGE-01
- `06-landing-pages/vantix-mision-vision-valores.html` — legacy content to port for PAGE-03
- `.planning/REQUIREMENTS.md` — requirement definitions and scope decisions
- `.planning/STATE.md` — decisions log; LATAM/US pricing context

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are existing project files; no external dependencies
- Architecture: HIGH — boilerplate derived from `index.html`; URL structure confirmed by nav.html and footer.html
- Pitfalls: HIGH — identified by direct comparison of legacy files vs. Phase 1/2 system
- i18n gap analysis: HIGH — derived from direct count of keys in both JSON files vs. legacy HTML content
- Fractional SRE content: MEDIUM — content structure is inferred; actual copy must be authored

**Research date:** 2026-03-20
**Valid until:** 2026-06-20 (stable project, no external dependencies to expire)
