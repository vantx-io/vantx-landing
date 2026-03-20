# Architecture Research

**Domain:** Hybrid static landing page system — multi-page B2B SaaS marketing site
**Researched:** 2026-03-20
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        BROWSER RUNTIME                           │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────────────────────────────────┐   │
│  │  index.html  │  │  services/perf.html  obs.html  sre.html │   │
│  │  (main page) │  │  (service detail pages)                 │   │
│  └──────┬───────┘  └──────────────────┬──────────────────────┘   │
│         │                             │                          │
│         └──────────────┬──────────────┘                          │
│                        ↓                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    partials/nav.html                        │ │
│  │                    partials/footer.html                     │ │
│  │   (fetched via JS on DOMContentLoaded, injected innerHTML)  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                        ↓                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    js/i18n.js                               │ │
│  │   1. Detects locale via navigator.languages / localStorage  │ │
│  │   2. Fetches translations/en.json or translations/es.json   │ │
│  │   3. Walks DOM: [data-i18n] → sets textContent              │ │
│  │   4. Stores choice in localStorage on toggle               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                        ↓                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    css/tokens.css  (imported first)         │ │
│  │                    css/base.css                             │ │
│  │                    css/layout.css                           │ │
│  │                    css/components.css                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                        ↓                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Calendly embed (popup text / inline)     │ │
│  │                    (loaded via their CDN script tag)        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `index.html` | Primary conversion page: hero, services overview, how-it-works, pricing teaser, Calendly CTA | Plain HTML, uses `data-i18n` attributes throughout |
| `services/perf.html` | Depth page for Performance as a Service — full deliverables, proof points, dedicated Calendly | Plain HTML, same shell structure as index |
| `services/obs.html` | Depth page for Observability as a Service | Same as above |
| `services/sre.html` | Depth page for Fractional Perf & SRE | Same as above |
| `partials/nav.html` | Shared navigation: logo, service links, language toggle button | Fragment HTML; no `<html>`/`<head>`; fetched and injected |
| `partials/footer.html` | Shared footer: links, legal, language toggle fallback | Fragment HTML; fetched and injected |
| `css/tokens.css` | CSS custom properties for entire color/spacing/type system | `:root` vars; dark theme overrides via `[data-theme="dark"]` |
| `css/base.css` | Reset, body, typography defaults | Scoped to tokens |
| `css/layout.css` | Container, grid, section spacing utilities | Utility classes only |
| `css/components.css` | Cards, buttons, nav, footer, Calendly container | Component-scoped selectors |
| `js/i18n.js` | Language detection, translation loading, DOM patching, toggle handler | Vanilla JS module; localStorage for persistence |
| `js/main.js` | Partial loading (nav/footer), scroll behavior, minor interactions | Runs on DOMContentLoaded |
| `translations/en.json` | All English strings keyed by `data-i18n` key | Flat or shallow-nested JSON |
| `translations/es.json` | All Spanish strings keyed by same keys | Mirrors en.json structure |

---

## Recommended Project Structure

```
06-landing-pages/
├── index.html                    # Main conversion page (/)
├── services/
│   ├── performance.html          # Performance as a Service detail
│   ├── observability.html        # Observability as a Service detail
│   └── fractional-sre.html       # Fractional Perf & SRE detail
├── partials/
│   ├── nav.html                  # Shared nav fragment
│   └── footer.html               # Shared footer fragment
├── css/
│   ├── tokens.css                # Design tokens (custom properties) — loaded first
│   ├── base.css                  # Reset, body, typography
│   ├── layout.css                # Container, grid, section utilities
│   └── components.css            # All reusable UI components
├── js/
│   ├── main.js                   # Partial injection + scroll behavior
│   └── i18n.js                   # Language detection, translation, toggle
├── translations/
│   ├── en.json                   # English strings
│   └── es.json                   # Spanish strings
└── assets/
    ├── fonts/                    # Local font files (if self-hosting)
    ├── icons/                    # SVG icons
    └── logo.svg                  # Vantix logo
```

### Structure Rationale

- **`services/` subdirectory:** Groups detail pages under a clean URL path (`/services/performance.html`). Keeps `index.html` isolated as the primary entry point.
- **`partials/`:** Fragment files (no `<html>` shell) fetched once per page load and injected into a `<div id="nav-placeholder">`. Avoids duplicating nav markup across 4 HTML files.
- **`css/` split into 4 files:** `tokens.css` first ensures custom properties are always available; components never hard-code color or spacing values. This is the minimum viable CSS architecture that prevents the "spaghetti" problem of the existing pages (all CSS inline in `<style>` blocks).
- **`translations/` as JSON files:** JSON is the universal choice — loaded with `fetch()`, parsed with `JSON.parse()`, no extra dependencies. Flat key structure (`"hero.title"`) is readable and tooling-friendly.
- **`js/` split into `main.js` and `i18n.js`:** Single responsibility per file. `i18n.js` can be tested in isolation; `main.js` handles all other page interactions.

---

## Architectural Patterns

### Pattern 1: fetch-inject for Shared Partials

**What:** Each HTML page declares empty placeholder elements. On `DOMContentLoaded`, `main.js` fetches the partial HTML file and injects it with `innerHTML`.

**When to use:** Any static multi-page site with 2+ pages sharing nav/footer, no build step available.

**Trade-offs:** Nav/footer are not in the initial HTML (slight FOUC risk). Acceptable here because nav is not above-the-fold critical content. Mitigate with `visibility: hidden` on placeholder until injection completes.

**Example:**
```html
<!-- In every HTML page -->
<div id="nav-placeholder"></div>
```

```javascript
// js/main.js
async function loadPartials() {
  const root = document.documentElement.dataset.root || '';
  const nav = await fetch(`${root}/partials/nav.html`).then(r => r.text());
  document.getElementById('nav-placeholder').innerHTML = nav;
  // Fire i18n AFTER nav is injected so nav strings also get translated
  window.i18n.applyTranslations();
}
document.addEventListener('DOMContentLoaded', loadPartials);
```

**Critical dependency:** i18n must run AFTER partial injection completes. This means `i18n.applyTranslations()` is called as a callback from `loadPartials()`, not independently on `DOMContentLoaded`.

### Pattern 2: data-i18n Attribute Translation

**What:** Every translatable string in HTML gets a `data-i18n` attribute with a dot-notation key. `i18n.js` walks the DOM, looks up each key in the active translation JSON, and sets `textContent` (or `placeholder` for inputs).

**When to use:** Any static site needing bilingual content without a framework.

**Trade-offs:** Initial HTML render shows keys briefly if JS is slow (negligible in practice; translations are ~5-10KB JSON). Screen readers see final translated text. Attributes are grep-able — easy to audit coverage.

**Example:**
```html
<!-- HTML markup -->
<h1 data-i18n="hero.title"></h1>
<p data-i18n="hero.subtitle"></p>
<a href="#" data-i18n="hero.cta_primary"></a>
<input data-i18n-placeholder="contact.email_placeholder">
```

```json
// translations/en.json
{
  "hero": {
    "title": "Your team doesn't need more tools. It needs them to work.",
    "subtitle": "Vantix is your external Performance & SRE team.",
    "cta_primary": "Book a Checkup →"
  },
  "contact": {
    "email_placeholder": "your@email.com"
  }
}
```

```javascript
// js/i18n.js (core logic sketch)
async function loadTranslations(lang) {
  const res = await fetch(`/translations/${lang}.json`);
  return res.json();
}

function applyTranslations(strings) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const value = getNestedValue(strings, key);
    if (value) el.textContent = value;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const value = getNestedValue(strings, key);
    if (value) el.placeholder = value;
  });
}
```

### Pattern 3: CSS Custom Properties Dark Theme

**What:** All color, spacing, and typography values defined as CSS custom properties in `:root`. Dark theme is the default (set directly on `:root`). No `prefers-color-scheme` toggle needed — the site is always dark as a brand choice.

**When to use:** When dark is the fixed brand aesthetic, not a user-switchable preference.

**Trade-offs:** Simpler than a toggleable system. If a light mode is ever needed, it is trivially added with `[data-theme="light"]` overrides.

**Example:**
```css
/* css/tokens.css */
:root {
  /* Brand colors */
  --color-bg:          #0F1B33;
  --color-bg-surface:  #1B2A4A;
  --color-bg-elevated: #243356;
  --color-accent:      #2E75B6;
  --color-accent-muted:#6BA3D6;
  --color-text:        #E8ECF2;
  --color-text-muted:  #8A9BC0;
  --color-text-faint:  #556B8E;
  --color-border:      rgba(255,255,255,0.08);
  --color-danger:      #C0392B;
  --color-success:     #27AE60;
  --color-warning:     #E67E22;

  /* Typography */
  --font-sans:  'DM Sans', sans-serif;
  --font-mono:  'JetBrains Mono', monospace;
  --text-xs:    12px;
  --text-sm:    14px;
  --text-base:  16px;
  --text-lg:    18px;
  --text-xl:    20px;
  --text-2xl:   24px;
  --text-3xl:   32px;
  --text-4xl:   44px;
  --text-5xl:   56px;

  /* Spacing */
  --space-section: 80px;
  --space-card:    32px;

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 100px;
}
```

---

## Data Flow

### i18n Data Flow (Page Load)

```
Browser loads index.html
    ↓
<script src="js/main.js"> runs on DOMContentLoaded
    ↓
main.js: fetch('/partials/nav.html') + fetch('/partials/footer.html')
    ↓
Inject nav/footer innerHTML into placeholders
    ↓
main.js calls: i18n.init()
    ↓
i18n.js: read localStorage('vantix_lang')
    ↓ (if null)
i18n.js: navigator.languages[0].startsWith('es') → set 'es', else 'en'
    ↓
i18n.js: fetch('/translations/{lang}.json')
    ↓
i18n.js: applyTranslations(strings) — walks ALL [data-i18n] in DOM
    ↓
document.documentElement.lang = lang  (updates <html lang="...">)
    ↓
Page renders with correct language
```

### Language Toggle Flow

```
User clicks lang toggle button (in nav)
    ↓
i18n.toggle() called
    ↓
Flip lang: 'en' ↔ 'es'
    ↓
localStorage.setItem('vantix_lang', newLang)
    ↓
fetch('/translations/{newLang}.json')
    ↓
applyTranslations(newStrings)
    ↓
Update toggle button label + document.documentElement.lang
```

### Key Dependency Rule

The partial injection and i18n application must be sequential, not parallel. The `nav.html` partial contains `data-i18n` nodes (nav links, lang toggle label). If `applyTranslations()` runs before the nav is injected, those strings stay untranslated.

**Correct order:**
1. Fetch partials (parallel fetch for nav + footer is fine)
2. Inject both partials into DOM
3. Then call `i18n.init()`

### Calendly Integration Flow

```
User clicks CTA button ("Book a Checkup")
    ↓
Calendly.initPopupWidget({ url: 'https://calendly.com/vantix/...' })
    ↓
Calendly iframe opens as overlay
    ↓
User completes booking (handled entirely by Calendly)
    ↓
Calendly fires event.data.event === 'calendly.event_scheduled'
    ↓ (optional)
window.postMessage listener → confirmation UI or analytics event
```

Calendly's `<script>` tag and CSS link are loaded once in the `<head>` of each HTML page. Use the **popup text** pattern for CTA buttons (not inline embed) — keeps the page layout clean and lets the Calendly overlay appear on demand.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 4 pages, 2 languages | Current plan — fetch-inject + JSON i18n is sufficient. No build step needed. |
| 10+ pages | Translation key management becomes painful without a spreadsheet or tooling. Consider a thin build step (Eleventy or 11ty) that compiles partials at build time instead of runtime. |
| SEO becomes critical | Client-side i18n means search engines see blank `data-i18n` attributes unless they execute JS. For v1 this is acceptable. For v2, pre-render both language versions as separate HTML files (`/en/`, `/es/`). |

### Scaling Priorities

1. **First limitation:** Translation file maintenance — as copy evolves, keeping `en.json` and `es.json` in sync is a manual discipline problem. Add a simple key-audit script in `js/` that logs missing/extra keys.
2. **Second limitation:** Partial fetch latency — nav/footer are invisible until fetched. On slow connections this creates a layout shift. Mitigate with a skeleton or by inlining the nav on the main page (one exception to DRY is acceptable for the most-trafficked page).

---

## Anti-Patterns

### Anti-Pattern 1: All CSS Inline in Each HTML File

**What people do:** Copy-paste the `<style>` block from one HTML file to the next (as in the existing `06-landing-pages/` files).

**Why it's wrong:** Any design change requires editing 4 files. Token inconsistencies accumulate. Dark theme rework becomes a search-and-replace problem across thousands of lines.

**Do this instead:** Extract all CSS into `css/tokens.css`, `css/base.css`, `css/components.css`. Each HTML file links those 3-4 stylesheets. One change in `tokens.css` propagates across all pages instantly.

### Anti-Pattern 2: Translating via Separate HTML Files per Language

**What people do:** Create `index-en.html` and `index-es.html` and maintain both separately.

**Why it's wrong:** Copy changes must be made twice. Structure diverges over time. Navigation between pages must carry a language parameter through every link.

**Do this instead:** Single HTML file per page with `data-i18n` attributes. Language stored in `localStorage`. One source of truth for structure; JSON files as the source of truth for copy.

### Anti-Pattern 3: Loading Calendly on Every Page

**What people do:** Put the Calendly `<script>` and `<link>` in the shared nav partial so it loads universally.

**Why it's wrong:** Calendly scripts add ~150KB to every page, including service detail pages where it may not be the primary CTA.

**Do this instead:** Include the Calendly script only in pages that have a booking CTA. `index.html` and the service detail pages all have CTAs, so in practice it loads everywhere — but keep it explicit in each page's `<head>`, not in the shared partial.

### Anti-Pattern 4: Running i18n Before Partials are Injected

**What people do:** Call `i18n.init()` in a separate `DOMContentLoaded` listener that races with the partial-fetch listener.

**Why it's wrong:** The nav partial contains `data-i18n` nodes. If `applyTranslations()` runs first, those nodes don't exist yet and their translations are silently skipped. The language toggle renders in the wrong language.

**Do this instead:** Call `i18n.init()` as a `.then()` callback after all partial injections are complete. One `DOMContentLoaded` listener in `main.js` orchestrates the full sequence.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Calendly | Popup widget via JS API (`Calendly.initPopupWidget`) | Load script in `<head>`; trigger on CTA button click. Use `hideEventTypeDetails: true` to avoid redundant info. Pass UTM params via `utm` object in init call. |
| Google Fonts | CDN `<link>` in `<head>` | DM Sans + JetBrains Mono already used in existing pages. Consider self-hosting for performance/privacy if needed. |
| impeccable.style | External audit tool — no integration | Used manually post-build to audit visual quality. Not embedded. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `main.js` → `i18n.js` | `window.i18n` global object exposed by `i18n.js`; called by `main.js` after partials load | `i18n.js` must be loaded before `main.js` in `<script>` order, or use ES modules |
| Page HTML → partials | `fetch()` + `innerHTML` injection; one-way data flow | Partials are pure HTML fragments; they receive no data from the page |
| Page HTML → translations | `data-i18n` attribute keys; `i18n.js` acts as the transformer | Keys must match exactly between HTML and JSON files |
| `06-landing-pages/` → `07-plataforma/` | Outbound link only — CTA links point to platform URL | No shared code or assets between the two systems |

---

## Suggested Build Order

Based on dependencies between components:

1. **Design tokens first** (`css/tokens.css`) — everything else depends on custom property names being defined before they are consumed.
2. **Base CSS + layout** (`css/base.css`, `css/layout.css`) — establishes typographic baseline and container grid before any component is built.
3. **Shared partials** (`partials/nav.html`, `partials/footer.html`) — structure is stable early; component CSS can be written targeting nav classes without building full pages.
4. **i18n infrastructure** (`js/i18n.js`, `translations/en.json`, `translations/es.json`, `js/main.js`) — wire up the system with placeholder content before real copy is finalized. This surfaces missing keys early.
5. **Main page** (`index.html`) — primary conversion page. Validate full stack (partials + i18n + Calendly + CSS) works end-to-end on this one page before building detail pages.
6. **Component CSS for main page sections** (`css/components.css`) — hero, service cards, how-it-works, CTA sections. Written alongside `index.html`.
7. **Service detail pages** (`services/performance.html`, `services/observability.html`, `services/fractional-sre.html`) — reuse all existing CSS; mostly additive HTML structure.
8. **Content migration** — pull validated copy from existing `06-landing-pages/*.html` files. At this point the skeleton is built; adding real content is purely mechanical.

---

## Sources

- [MDN: Navigator.language](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language) — language detection
- [Calendly: Embed options overview](https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview) — embed patterns
- [CSS-Tricks: The Simplest Ways to Handle HTML Includes](https://css-tricks.com/the-simplest-ways-to-handle-html-includes/) — partial injection patterns
- [Building a Super Small i18n Script in JavaScript — Andreas Remdt](https://andreasremdt.com/blog/building-a-super-small-and-simple-i18n-script-in-javascript/) — data-i18n pattern
- [A Practical Guide to CSS Custom Properties for Theming — Ronald Svilcins](https://ronaldsvilcins.com/2025/03/30/a-practical-guide-to-css-custom-properties-for-theming/) — token architecture
- [Every way to detect a user's locale — DEV Community](https://dev.to/lingodotdev/every-way-to-detect-a-users-locale-from-best-to-worst-369i) — navigator.languages best practices
- [Translations in plain JS — Medium](https://medium.com/@mihura.ian/translations-in-vanilla-javascript-c942c2095170) — vanilla i18n implementation

---
*Architecture research for: Vantix hybrid static landing page system*
*Researched: 2026-03-20*
