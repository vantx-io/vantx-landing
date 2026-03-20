# Stack Research

**Domain:** Static B2B landing page — bilingual EN/ES, Calendly embed, dark techy design
**Researched:** 2026-03-20
**Confidence:** HIGH (all core decisions verifiable from existing codebase + official Calendly docs + browser standards)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| HTML5 | — (no version to pin) | Document structure + i18n markup via `data-i18n` attributes | Project constraint and right call: no build step, no framework overhead, zero runtime cost, directly consistent with the 4 existing pages in `06-landing-pages/` |
| CSS3 with Custom Properties | — | Styling, dark theme, design tokens, responsive layout | CSS variables (`--color-bg`, `--color-accent`, etc.) are the standard 2025 approach for theming. Lets you define the dark palette once and swap it without JS. No preprocessor needed for a single landing page. |
| Vanilla JavaScript (ES2022+) | — | i18n logic, language detection, Calendly init | The i18n requirement is ~50 lines of code with `navigator.languages`, `data-i18n` attributes, and JSON translation files. No library justifies its weight for this scope. ES2022 module syntax (`import`) works in all modern browsers natively. |
| DM Sans + JetBrains Mono | — | Typography | Already in use across all existing pages AND the platform (`07-plataforma/`). Brand consistency is a stronger reason than any aesthetic argument. Load via Google Fonts CDN during development; evaluate self-hosting before production for Core Web Vitals. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Calendly Embed Widget | n/a (CDN script) | Inline and popup scheduling embeds | Always — it is the primary conversion mechanism. Load `https://assets.calendly.com/assets/external/widget.js` once in the page. Use `Calendly.initPopupWidget()` on CTA buttons; use `Calendly.initInlineWidget()` for the dedicated booking section. Pass `?background_color=0f1523&text_color=e2e8f0&primary_color=2E75B6` URL params for dark theme alignment. |
| None (i18n is vanilla) | — | Bilingual EN/ES toggle | A custom ~50-line i18n module covers the full requirement: load `en.json` / `es.json`, walk `[data-i18n]` elements, detect via `navigator.languages[0]`, persist to `localStorage`. i18next is an option if the copy grows to 200+ strings or needs pluralization, but that threshold is not reached for a 5-page marketing site. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Live Server (VS Code) / `npx serve` | Local dev server with hot reload | No build tooling needed. `npx serve 06-landing-pages` works out of the box. |
| impeccable.style `/audit` | Design quality audit before ship | Explicitly called out in PROJECT.md. Run on each page before considering it done. |
| Google Fonts Helper (`gwfh.mranftl.com`) | Self-host font files for production | Download woff2 subsets of DM Sans + JetBrains Mono to eliminate the 2-server round-trip. Matters for Core Web Vitals LCP given the page is a performance consultancy's own site. |
| Prettier | HTML/CSS/JS formatting | Optional but consistent formatting is cheap insurance when files are shared. No config needed — defaults work. |

---

## Installation

No package manager needed for the landing pages themselves. All dependencies are CDN or vanilla.

```bash
# Serve locally (one-liner, no install)
npx serve /path/to/06-landing-pages

# If self-hosting fonts (recommended for production):
# Download from https://gwfh.mranftl.com/fonts/dm-sans and https://gwfh.mranftl.com/fonts/jetbrains-mono
# Place woff2 files in 06-landing-pages/fonts/
# Add @font-face declarations to the shared CSS, remove Google Fonts <link>
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vanilla JS i18n module | i18next (via CDN) | If copy grows beyond ~200 strings, needs ICU plurals, or a non-technical editor needs a WYSIWYG translation workflow |
| Vanilla JS i18n module | Separate HTML files per locale (`/en/`, `/es/`) | If SSR/SEO for locale URLs becomes a hard requirement in v2 — not needed now |
| CSS Custom Properties for dark theme | Tailwind CSS dark mode | Tailwind is already used in `07-plataforma/` but dragging it into a no-build static file adds a build step that contradicts the constraint. CSS variables achieve the same result with zero tooling. |
| CSS Custom Properties for dark theme | Sass/SCSS | Sass adds a compile step. For a single dark-only landing page with one color palette, CSS variables are strictly simpler and browser-native. |
| Google Fonts CDN (dev) → self-hosted (prod) | Fontsource npm package | Fontsource is cleaner in a Node project but adds a build step. For raw HTML files, copying woff2s and writing `@font-face` is faster. |
| Calendly Embed Widget (CDN) | Cal.com (open source) | If Vantix ever migrates off Calendly. Not relevant for v1. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| React / Next.js | Framework overhead is unjustified for 4–5 static marketing pages. Next.js is already in `07-plataforma/` — keeping the landing pages separate preserves the clean boundary between marketing site and platform. Adding a build pipeline violates the explicit PROJECT.md constraint. | Vanilla HTML/CSS/JS |
| Astro / Hugo / Eleventy | SSGs are excellent for multi-page sites with shared templates, but introduce a build step and mental model switch for a project whose existing pages are plain HTML. The content reuse problem is solved by shared CSS + JS modules, not a generator. Re-evaluate for v2 if page count exceeds 10. | Vanilla HTML with shared `<link>` and `<script>` references |
| Separate HTML files per language (`index-en.html`, `index-es.html`) | Duplicates markup, doubles maintenance surface area, creates link rot risk. The JS-toggle approach (single file, `data-i18n` attributes, JSON translation files) is the correct pattern for a 2-language site at this scale. | Single HTML file + `translations/en.json` + `translations/es.json` |
| Inline `<style>` blocks per page (current pattern) | The existing pages each have large inline `<style>` blocks. This should be consolidated into a shared `styles.css` during the rebuild so the dark palette and design tokens are defined once. | Shared external `styles.css` with CSS custom properties at `:root` |
| Calendly `<iframe>` src embed (bare iframe) | The widget.js approach gives programmatic control (init on button click, pass prefill data, listen to `calendly.event_scheduled` events). A raw `<iframe>` is less controllable and harder to style. | `Calendly.initPopupWidget()` / `Calendly.initInlineWidget()` |
| Google Fonts CDN in production | Adds two cross-origin connections, delays LCP, sends referrer to Google. Especially ironic for a performance consultancy. | Self-hosted woff2 files + `@font-face` in shared CSS |

---

## Stack Patterns by Variant

**For the main page (`index.html`) — conversion-focused:**
- Use `Calendly.initPopupWidget()` on all CTA buttons so the user never leaves the page
- Dark hero section uses CSS custom properties already defined at `:root`
- Language toggle in the navbar calls the i18n module and stores choice to `localStorage`

**For service detail pages (`perf.html`, `obs.html`, `sre.html`) — education-focused:**
- Use `Calendly.initInlineWidget()` in a dedicated section near the bottom of each page (full booking experience visible without a click)
- Same shared CSS and i18n module via `<link>` and `<script src>` — no duplication

**If self-hosting fonts before production:**
- Preload woff2 files in `<head>` with `<link rel="preload" as="font" crossorigin>` — this recovers ~300–500ms on first load

**If Calendly dark theme CSS bleeds through:**
- Known limitation: Calendly's iframe honors `background_color` / `text_color` / `primary_color` URL params but some internal elements (expandable detail rows) may override them
- Mitigation: wrap the inline widget in a `<div>` with a matching dark background so visual bleed is hidden by the surrounding context

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Calendly widget.js (CDN, always latest) | Any modern browser | No versioning — Calendly controls the script. Consequence: behavior can change without notice. Test after any major Calendly product update. |
| CSS Custom Properties | Chrome 49+, Firefox 31+, Safari 9.1+ (HIGH coverage 2025) | Universal. No fallback needed. |
| `navigator.languages` | Chrome 32+, Firefox 32+, Safari 10.1+ | Universal for 2025 target audience. Fall back to `navigator.language` for older Safari. |
| ES2022 modules (`type="module"`) | Chrome 61+, Firefox 60+, Safari 10.1+ | Universal for 2025. Enables clean module separation for i18n code without a bundler. |
| Google Fonts (DM Sans, JetBrains Mono) | All browsers | Already confirmed working in all 4 existing pages. |

---

## Existing Codebase Context

The 4 pages in `06-landing-pages/` already establish:
- Color palette: `#1B2A4A` (bg-dark), `#0F1B33` (bg-darker), `#2E75B6` (brand-blue), `#8A9BC0` (muted-text)
- Typography: DM Sans (body) + JetBrains Mono (prices, numbers, code-style callouts)
- Responsive breakpoint: `768px`
- CSS-only structure: no existing build tooling to preserve or break

The new system should extract the common palette and typography into CSS custom properties in a shared `styles.css`, then reference them across all pages. This is the primary architectural improvement over the existing files.

---

## Sources

- Existing codebase: `06-landing-pages/vantix-landing-v3.html` — palette, typography, structure confirmed
- `.planning/PROJECT.md` — explicit constraint: vanilla HTML/CSS/JS, no frameworks
- `.planning/codebase/STACK.md` — confirmed DM Sans + JetBrains Mono already in brand system
- [Calendly Embed options overview](https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview) — MEDIUM confidence (403 on direct doc fetch, but CDN URL and API confirmed via community + martech sources)
- [Calendly developer embed docs](https://developer.calendly.com/how-to-display-the-scheduling-page-for-users-of-your-app) — `initInlineWidget` / `initPopupWidget` API confirmed
- [navigator.language detection guide](https://lingo.dev/en/javascript-i18n/detect-user-preferred-language) — MEDIUM confidence (WebSearch verified)
- [CSS Custom Properties for theming (2025)](https://www.frontendtools.tech/blog/css-variables-guide-design-tokens-theming-2025) — MEDIUM confidence
- [Self-hosting Google Fonts for Core Web Vitals](https://www.corewebvitals.io/pagespeed/self-host-google-fonts) — MEDIUM confidence
- [impeccable.style cheatsheet](https://impeccable.style/cheatsheet) — confirmed active tool for design audit

---
*Stack research for: Vantix static B2B landing page (bilingual EN/ES)*
*Researched: 2026-03-20*
