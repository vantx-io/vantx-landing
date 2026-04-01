# Phase 4: Polish & Launch Gate - Research

**Researched:** 2026-03-24
**Domain:** Web accessibility, CSS polish, UX fixes, cross-device QA
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** impeccable.style/cheatsheet audit must pass with ALL flagged issues fixed — no exceptions, no "good enough"
- **D-02:** Audit covers visual design quality AND UX gaps from todo.md (text walls, redundant CTAs, missing FAQs, layout issues)
- **D-03:** Audit covers ALL public pages: index.html, 3 service detail pages (observability, fractional-sre, performance), mission.html, welcome.html, legal/privacy.html, legal/terms.html
- **D-04:** Fix credibility bar 700ms entrance delay (causes visible pop-in on fast connections) — reduce or eliminate
- **D-05:** Fix hero `min-height: 100vh` empty whitespace on desktop
- **D-06:** WCAG 2.1 AA contrast (ratio >= 4.5:1) verified with axe DevTools on every page
- **D-07:** Audit BOTH light mode and dark mode equally — dark mode users deserve same contrast quality
- **D-08:** When axe flags contrast issues, fix in tokens.css first (global); per-element overrides only if global change breaks something else
- **D-09:** Full WCAG 2.1 AA audit scope: contrast + keyboard navigation (tab order) + screen reader experience (labels, announcements)
- **D-10:** Verify Calendly popup doesn't trap keyboard focus or break tab flow
- **D-11:** Verify mobile nav drawer properly traps focus when open and announces state changes
- **D-12:** Add social proof placeholder section to index.html — section structure with placeholder content ready to swap in real testimonials/logos
- **D-13:** Add service-specific FAQs to detail pages (observability, fractional-sre, performance)
- **D-14:** Break up text walls on detail pages (especially performance page with 7 deliverables)
- **D-15:** Fix `content-visibility: auto` / `contain-intrinsic-size` layout jumps (CLS issue)
- **D-16:** Fix "Also available" rows — differentiate or reduce the 3 identical "Book a Call" buttons that read as template-like
- **D-17:** Real Calendly URL and GA4 Measurement ID are already in place — no placeholder replacement needed
- **D-18:** Language preference persistence must work after hard reload in incognito (localStorage verification)
- **D-19:** iOS Safari rendering verification required (real device, not only DevTools emulation) — functional correctness, not pixel-perfect

### Claude's Discretion

- Exact social proof placeholder layout and copy
- How to restructure text walls (accordion, tabs, progressive disclosure, or trimming)
- Which service FAQs to write and how many per page
- How to differentiate the "Also available" CTAs (different copy, single CTA, or different treatment)
- Credibility bar animation timing replacement value
- Hero height fix approach (auto height, max-height, or content-driven)

### Deferred Ideas (OUT OF SCOPE)

- Real client testimonials and logos for social proof section (placeholder structure ships in Phase 4, real content added when available)
- Automated accessibility CI pipeline (axe-core in CI) — post-launch
- PAGE-V2-01: Performance as a Service detail page refactor (already deferred to v2)
- SEO-V2-01: Separate `/es/` URLs with hreflang (deferred to v2)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DSNG-02 | Auditoría con impeccable.style/cheatsheet superada antes de ship | Covered by design audit wave (D-01, D-02, D-03) and all visual/UX fix tasks. The audit is run interactively as a Claude slash-command sequence — `/audit` for technical quality, `/critique` for UX/design — not a static checklist. All flagged items must be resolved before the requirement is marked done. |
</phase_requirements>

---

## Summary

Phase 4 is a pure quality gate: no new features ship, but everything that already exists must meet objective standards before the site goes live. There are four distinct work streams:

**Design audit:** The impeccable.style/cheatsheet is a Claude-powered slash-command reference (`/audit` + `/critique`), not a static checklist. It runs interactively against each page and flags issues. All flagged issues must be resolved. Separately, every known UX gap in `landing/todo.md` must be addressed — text walls, missing FAQs, redundant CTAs, visual inconsistencies.

**Accessibility:** WCAG 2.1 AA compliance verified with axe DevTools across all 8 pages in both light and dark mode. The codebase already has strong foundations — skip link, sr-only, focus-visible, 44px touch targets, prefers-reduced-motion, aria-live regions for language changes, and a working mobile nav focus trap. The main risks are contrast values on muted/subtle text tokens that sit near the 4.5:1 threshold and the Calendly third-party popup (focus trap is controlled by Calendly, not by Vantx code).

**CSS/UX fixes:** Four specific CSS bugs are locked in: credibility bar 700ms animation delay causing visible pop-in, hero `min-height: 100vh` leaving empty space on desktop, `content-visibility: auto` with inaccurate `contain-intrinsic-size` estimates causing CLS, and one dashed border inconsistency on `.svc-card__onetime`. Content fixes include social proof placeholder, service-specific FAQs for three detail pages, text wall restructuring, and "Also available" CTA differentiation.

**Launch gate:** Language preference (localStorage key `vantx-lang`) must persist after hard reload in a private/incognito window. iOS Safari needs real-device functional testing. Both are manual verification tasks, not code changes.

**Primary recommendation:** Execute in three waves — (1) CSS fixes that are already localized to specific CSS rules, (2) content additions (FAQs, social proof placeholder), (3) full audit sweep and verification. Wave 3 should not begin until Wave 1 fixes are in place, because some design issues depend on correct spacing/layout.

---

## Standard Stack

### Core (already in place — no new dependencies)

| Asset | Location | Purpose |
|-------|---------- |---------|
| tokens.css | `landing/css/tokens.css` | All color tokens; the ONLY place to fix contrast globally (per D-08) |
| base.css | `landing/css/base.css` | Accessibility utilities, FAQ component, reveal system |
| landing.css | `landing/css/landing.css` | Hero, credibility bar, pain, services, pricing sections |
| detail.css | `landing/css/detail.css` | Shared CSS for all three service detail pages |
| partials.js | `landing/js/partials.js` | Mobile nav focus trap, lang toggle, aria-live region |
| i18n.js | `landing/js/i18n.js` | localStorage persistence (`vantx-lang` key) |

### Audit Tools (manual, browser-based)

| Tool | Use | Where to get |
|------|-----|-------------|
| axe DevTools browser extension | WCAG 2.1 AA contrast + keyboard + ARIA audit | Chrome Web Store / Firefox Add-ons |
| Chrome DevTools Color Picker | Spot-check contrast ratios on specific elements | Built into Chrome DevTools |
| impeccable.style `/audit` + `/critique` | Design quality audit per page | Claude slash-command (run in chat) |
| iOS Safari (real device) | Functional rendering verification | Physical device only |

**No npm installs required.** All audit work is browser-based. No new libraries are introduced in this phase.

---

## Architecture Patterns

### Token-First Contrast Fix Pattern

The project enforces: fix contrast in `tokens.css` first, per-element overrides only when necessary (D-08). The file already documents contrast ratios in comments:

```css
/* Current light mode tokens — contrast ratio comments already present */
--color-text-muted:  #5C5C56;  /* check: on --color-bg (#F8F7F4) */
--color-text-subtle: #6B6B64;  /* 5.0:1 on bg — annotation in token file */
```

Dark mode muted tokens with annotations:
```css
--color-text-muted:  #9C9B93; /* 6.2:1 on bg */
--color-text-subtle: #8C8B83; /* 5.0:1 on bg, 4.5:1 on surface */
```

When axe flags a token, update both `:root` (light) and `@media (prefers-color-scheme: dark) :root` values in a single edit. All components that use the token inherit the fix automatically.

### Credibility Bar Animation Fix

The 700ms delay is in `landing/css/landing.css` line 164:

```css
/* Current — causes visible pop-in */
.credibility {
  animation: hero-enter 600ms var(--ease-out) 700ms both;
}
```

The `hero-enter` keyframe starts from `opacity: 0; transform: translateY(28px)`. The fix approach (Claude's discretion) is either:

**Option A — Fade only, no delay:**
```css
.credibility {
  animation: fade-in 400ms var(--ease-out) both;
}
@keyframes fade-in {
  from { opacity: 0; }
}
```

**Option B — Reduce delay to 0ms:**
```css
.credibility {
  animation: hero-enter 600ms var(--ease-out) 0ms both;
}
```

Option A is preferred — removes the translateY that causes the pop-in on fast connections while maintaining a gentle entrance feel.

### Hero Height Fix

Current rule in `landing/css/landing.css` line 13-14:

```css
.hero {
  min-height: calc(100vh - var(--nav-height));
  min-height: calc(100dvh - var(--nav-height)); /* mobile: accounts for browser chrome */
}
```

This is intentional on mobile (correct — prevents browser chrome clipping) but leaves empty space on desktop with short content. The fix options (Claude's discretion):

**Option A — Desktop override:**
```css
@media (min-width: 1024px) {
  .hero {
    min-height: 0;
    padding-top: var(--space-24);
    padding-bottom: var(--space-24);
  }
}
```

**Option B — Cap with max-height:**
```css
.hero {
  min-height: calc(100dvh - var(--nav-height));
  max-height: 800px; /* prevents excessive whitespace on tall desktops */
}
```

Option A is cleaner — the mobile use case for `100dvh` is legitimate, only desktop needs the override.

### CLS Fix for content-visibility Sections

Sections with `content-visibility: auto` and rough `contain-intrinsic-size` estimates:

```css
/* landing.css — current rough estimates */
.compare {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;  /* estimate — may differ from actual */
}

.pain {  /* implied by structure */
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;
}
```

```css
/* base.css — FAQ */
.faq {
  content-visibility: auto;
  contain-intrinsic-size: auto 600px;
}
```

Fix pattern: Measure actual rendered heights in DevTools, update `contain-intrinsic-size` values to match. The `auto` keyword in `auto Xpx` means the browser will remember the actual size after first render and use that for subsequent renders — so measured values only need to be close, not exact.

### Dashed Border Fix

One dashed border exists in the entire codebase (`landing/css/landing.css` line 712):

```css
.svc-card__onetime {
  border-top: 1px dashed var(--color-border); /* only dashed border on site */
}
```

Fix: change to `solid` to match all other borders in the design system.

### Social Proof Placeholder Pattern

The section should live between `.services` and the comparison table on `index.html`. The structure uses existing token patterns:

```html
<!-- Social proof — placeholder structure, real content added post-launch -->
<section class="social-proof section section--snug" aria-label="Client results">
  <div class="container">
    <p class="label" data-i18n="social_proof.label">Results</p>
    <h2 class="section-title" data-i18n="social_proof.heading">What teams say</h2>
    <!-- Placeholder cards use .surface + border, same as other cards -->
    <div class="social-proof__grid">
      <!-- testimonial/logo cards here -->
    </div>
  </div>
</section>
```

CSS for the section should use existing tokens only — no new color or spacing tokens needed.

### FAQ Addition Pattern

Service detail pages use `<details>/<summary>` for FAQ items — already styled in `base.css`. Adding FAQs means inserting `<details class="faq__item">` elements into the existing `.faq__list` in each detail page and adding i18n key pairs to `en.json` / `es.json`. The i18n pattern for array items is dot-notation: `obs_page.faq.items.0.question`, `obs_page.faq.items.0.answer`.

### "Also Available" CTA Differentiation

Current issue: three identical "Book a Call" buttons in a vertical column. The `services__also-row` items each have a distinct `services__also-row--obs`, `services__also-row--sre`, `services__also-row--qa` class and distinct accent colors already. The CTA buttons are the problem. Options (Claude's discretion):

- Remove per-row CTAs entirely; add a single "Explore all services →" link at the bottom of the group
- Replace "Book a Call" with the service name in the button: "Try Observability →", "Try Fractional SRE →"
- Convert rows to be navigation-only (no CTA button), since the row itself is already a link

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Contrast ratio calculation | Custom calculation logic | axe DevTools in browser (or Chrome DevTools color picker) | axe uses the same algorithm as WCAG and flags exact failures with ratios |
| Mobile focus trap | Custom focus trap JS | Already implemented in `partials.js` lines 127-142 — it's a working keyboard trap | Adding a second trap system would cause double-trap conflicts |
| Animated FAQ disclosure | Custom accordion JS | `<details>/<summary>` + CSS `faq-reveal` animation already in `base.css` | The pattern is tested across browsers and respects reduced-motion |
| Color token audit | Manual hex comparison | axe DevTools — scans rendered CSS custom properties at runtime | CSS custom properties resolve differently in light vs dark mode; static analysis misses this |
| i18n key lookup for FAQs | New i18n lookup mechanism | Existing dot-notation system in `i18n.js` — add keys to `en.json`/`es.json` | The system already handles nested objects and arrays |

---

## Common Pitfalls

### Pitfall 1: Fixing Contrast in Component CSS Instead of tokens.css

**What goes wrong:** A developer patches contrast directly on `.section-sub`, `.footer__tagline`, or `.credibility__summary` instead of the token. The fix works locally but the same token is used in 15 other places that remain broken.

**Why it happens:** It's faster to grep for the element and patch the one rule than to trace which token it uses.

**How to avoid:** When axe flags an element, identify the CSS custom property it uses (`color: var(--color-text-muted)`), then fix the token value in `tokens.css`. Test both `:root` (light) and `@media (prefers-color-scheme: dark)` blocks.

**Warning signs:** If a fix only appears in a component CSS file and not in `tokens.css`, it's likely incomplete.

### Pitfall 2: Testing Contrast in Only One Color Mode

**What goes wrong:** axe passes in light mode; dark mode ships with failing contrast because no one tested it separately.

**Why it happens:** Browser default is light mode; axe is run once and marked done.

**How to avoid:** Run axe twice per page — once in default (light) mode, once with `@media (prefers-color-scheme: dark)` forced in Chrome DevTools (`Rendering` tab → `Emulate CSS media feature prefers-color-scheme`).

**Warning signs:** D-07 in CONTEXT.md is explicit about this. If a review only has one pass per page, it's incomplete.

### Pitfall 3: Assuming Calendly Focus Trap is Broken

**What goes wrong:** Tester opens Calendly popup, tabs through it, and reports that focus escapes the popup into the page behind.

**Why it happens:** Calendly is a third-party iframe popup. Its focus trap is controlled by Calendly's own widget code, not by Vantx. The Calendly widget loads its own `focusTrap` internally.

**How to avoid:** The verification task for D-10 should confirm that (a) Tab does not reach page elements behind the Calendly overlay, and (b) Escape closes the popup. If Calendly's own trap is broken, that is documented as a known third-party limitation — not something Vantx can fix in this phase.

**Warning signs:** Don't add a wrapper focus trap around `Calendly.initPopupWidget()` — it will conflict with Calendly's own trap.

### Pitfall 4: Misidentifying content-visibility CLS as a Code Bug

**What goes wrong:** Developer removes `content-visibility: auto` entirely to "fix" layout jumps, regressing the performance optimization.

**Why it happens:** `content-visibility: auto` skips rendering off-screen sections. When `contain-intrinsic-size` is wrong, the browser uses the wrong placeholder height, causing a layout shift when the section renders.

**How to avoid:** The fix is to calibrate `contain-intrinsic-size` values to match actual section heights. Measure actual heights using Chrome DevTools (`Elements` panel → computed height). The `auto` prefix in `auto Npx` means the browser learns the actual height after first paint and caches it — so an approximate value is fine, it just needs to be in the right ballpark.

**Warning signs:** If the CLS fix is `content-visibility: visible` or removal of the property entirely, that's wrong.

### Pitfall 5: Using DevTools Emulation Instead of Real iOS Safari

**What goes wrong:** iOS Safari rendering is "tested" by switching Chrome to iPhone mode in DevTools responsive mode. Real iOS Safari bugs (backdrop-filter rendering, dvh unit support, WebKit-specific focus issues) are missed.

**Why it happens:** It's much faster than testing on a real device.

**How to avoid:** D-19 is explicit: real device, not DevTools emulation. The functional scope is: navigation works, Calendly popup opens, language toggle works, pages render without overflow or broken layouts. Pixel-perfect matching is explicitly not required.

**Warning signs:** If iOS Safari "testing" was only done in Chrome responsive mode, the task is incomplete.

### Pitfall 6: Language Persistence Test in Regular Window

**What goes wrong:** Tester confirms localStorage persists after reload in a normal browser window, marks D-18 as done.

**Why it happens:** Regular windows allow localStorage by default; the private/incognito case is where browsers differ.

**How to avoid:** D-18 specifies private/incognito window specifically. The i18n.js code already wraps localStorage in try/catch for exactly this reason (line 48-50 in i18n.js). The test verifies the graceful degradation behavior — if localStorage is blocked, does the user still see their language preference within the session (via sessionStorage), and does auto-detection work correctly on hard reload?

---

## Code Examples

### Verified: Forcing Dark Mode in Chrome DevTools for axe Testing

In Chrome DevTools:
1. Open DevTools → More tools → Rendering
2. Scroll to "Emulate CSS media feature" → `prefers-color-scheme` → `dark`
3. Run axe DevTools extension with this active
4. Dark mode token overrides in `tokens.css` are now active

### Verified: Adding a FAQ Item to a Detail Page

i18n keys go in both `landing/i18n/en.json` and `landing/i18n/es.json`:

```json
// en.json addition
"obs_page": {
  "faq": {
    "items": {
      "0": { "question": "...", "answer": "..." }
    }
  }
}
```

HTML in the detail page (using existing `.faq__item` pattern from `base.css`):

```html
<details class="faq__item">
  <summary class="faq__question" data-i18n="obs_page.faq.items.0.question">
    Placeholder question
  </summary>
  <div class="faq__answer" data-i18n="obs_page.faq.items.0.answer">
    Placeholder answer
  </div>
</details>
```

Source: `landing/css/base.css` lines 693-769 — `.faq__item`, `.faq__question`, `.faq__answer` are already fully styled.

### Verified: Measuring Section Height for contain-intrinsic-size

In Chrome DevTools:
1. Scroll a section into view to force its render
2. Select the section element in Elements panel
3. Check Computed → height
4. Update `contain-intrinsic-size: auto Xpx` with the measured value

Relevant selectors and current estimates:
- `.compare` → `contain-intrinsic-size: auto 500px` (in `landing/css/landing.css` line 192)
- `.pain` → `contain-intrinsic-size: auto 500px` (line 344)
- `.faq` → `contain-intrinsic-size: auto 600px` (in `base.css` line 699)
- Third `.content-visibility: auto` section → `contain-intrinsic-size: auto 500px` (line 829)

### Verified: Checking localStorage in Private/Incognito

```javascript
// Test in browser console (incognito window after hard reload):
localStorage.getItem('vantx-lang')  // should return 'en' or 'es' if set
// If null — auto-detection from navigator.languages should have run
document.documentElement.lang      // should reflect the detected lang
```

Source: `landing/js/i18n.js` line 26 — `const STORAGE_KEY = "vantx-lang"`.

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| `100vh` for full viewport | `100dvh` (dynamic viewport height) | Already in codebase — dvh accounts for mobile browser chrome. The hero uses both with `100dvh` as the override (line 14 of landing.css). iOS Safari 15.4+ supports dvh. |
| `contain-intrinsic-size: Npx` | `contain-intrinsic-size: auto Npx` | The `auto` prefix enables browser height memorization. Already used in codebase — this is the right approach, just needs accurate base values. |
| Manual focus trap JS | Native `<dialog>` element | Vantx uses manual focus trap for its mobile nav drawer; this is appropriate here since the drawer is not a `<dialog>`. Calendly uses its own internal trap. |
| axe-core in CI | axe DevTools browser extension | CI automation is deferred post-launch (per CONTEXT.md deferred items). The manual browser extension is the correct tool for this phase. |

---

## Validation Architecture

Nyquist validation is enabled in `.planning/config.json`. However, this phase is entirely manual testing and browser-based verification. There is no automated test harness for visual design, contrast ratios, or device rendering.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — manual browser testing |
| Config file | None |
| Quick run command | Open page in browser, run axe DevTools extension |
| Full suite command | axe DevTools on all 8 pages × 2 color modes |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Method | File Exists? |
|--------|----------|-----------|--------|-------------|
| DSNG-02 | impeccable.style/cheatsheet audit passes | manual | Run `/audit` + `/critique` per page via Claude chat; verify all flagged items resolved | N/A — interactive |
| D-06 / D-07 | WCAG 2.1 AA contrast in both modes | manual | axe DevTools browser extension on each page in light + dark mode | N/A — browser tool |
| D-09 | Keyboard nav + screen reader | manual | Tab through each page; VoiceOver (Mac) spot check | N/A — manual |
| D-10 | Calendly popup focus behavior | manual | Open Calendly popup, Tab key, Escape key | N/A — manual |
| D-11 | Mobile nav drawer focus trap | manual | Open drawer, Tab cycles within drawer, Escape closes | N/A — manual |
| D-18 | Language persistence in incognito | manual | Hard reload in private window, check localStorage + html lang | N/A — manual |
| D-19 | iOS Safari rendering | manual | Open all 8 pages on real device | N/A — device |

### Wave 0 Gaps

None — this phase has no automated tests and no test infrastructure to set up. All verification is manual browser-based.

---

## Open Questions

1. **impeccable.style/cheatsheet audit format**
   - What we know: It's a Claude slash-command set — `/audit` runs a technical quality audit, `/critique` runs a UX/design critique. It's not a static checklist with pass/fail checkboxes.
   - What's unclear: The exact output format and how to document "passed" vs "failed" items for a plan task.
   - Recommendation: Each page gets one task: "Run `/audit` and `/critique` against [page]; document all flagged issues; resolve each flagged item." The task is done when no new issues are flagged on re-run.

2. **qa-tech-lead.html scope**
   - What we know: The services directory contains `qa-tech-lead.html` (20.8K). The CONTEXT.md (D-03) lists only observability, fractional-sre, and performance as the three detail pages. todo.md lists service FAQs for "QA Tech Lead page."
   - What's unclear: Is qa-tech-lead.html in scope for Phase 4? It wasn't in the original Phase 3 scope.
   - Recommendation: Treat qa-tech-lead.html as in-scope for audit (D-03 says "3 service detail pages" but there are 4 files). Planner should include it in audit tasks; if it was already built, FAQs should be added too.

3. **Social proof section i18n**
   - What we know: All visible text on the site goes through the i18n system. The social proof section will have placeholder text.
   - What's unclear: Should placeholder copy be bilingual (en + es) now, or English-only for placeholder phase?
   - Recommendation: Add i18n keys for both languages since all other sections are bilingual. The i18n system is low-friction to use (just add keys to two JSON files).

---

## Sources

### Primary (HIGH confidence — directly read from codebase)

- `landing/css/tokens.css` — All color tokens with contrast annotations, light + dark mode
- `landing/css/landing.css` — Hero, credibility bar animation delay (700ms confirmed at line 164), `contain-intrinsic-size` values confirmed
- `landing/css/base.css` — FAQ component, scroll-reveal, all accessibility utilities
- `landing/js/i18n.js` — localStorage key `vantx-lang`, try/catch for private browsing (line 48-50)
- `landing/js/partials.js` — Mobile nav focus trap (lines 127-142), aria-live region (lines 157-162)
- `landing/js/calendly.js` — Third-party popup via `Calendly.initPopupWidget()`
- `landing/todo.md` — All known UX gaps confirmed
- `.planning/phases/04-polish-launch-gate/04-CONTEXT.md` — All locked decisions
- `.agents/skills/accessibility/SKILL.md` — WCAG 2.1 AA contrast thresholds, axe testing commands
- `.agents/skills/web-quality-audit/SKILL.md` — CLS, Core Web Vitals, audit patterns

### Secondary (MEDIUM confidence — WebFetch verified)

- `https://impeccable.style/cheatsheet` — Confirmed: it's a dynamic command reference for 20 slash-commands organized into 6 categories. The audit flow is `/audit` (technical quality) + `/critique` (UX/design). Not a static checklist. Commands are fetched dynamically from `/api/commands`.

### Tertiary (LOW confidence — training knowledge, not separately verified)

- Calendly widget focus trap behavior — training data suggests Calendly manages its own focus trap internally; not separately verified against Calendly docs. Flag for testing verification.
- `100dvh` support in iOS Safari 15.4+ — widely documented; not separately verified against Safari release notes.

---

## Metadata

**Confidence breakdown:**
- Locked CSS bugs (credibility delay, hero height, dashed border, CLS): HIGH — source lines confirmed in codebase
- Token contrast values: HIGH — tokens.css read directly, annotated ratios present
- Mobile nav focus trap: HIGH — partials.js code read directly, trap is implemented
- i18n persistence: HIGH — i18n.js code read directly, try/catch confirmed
- Calendly focus trap: MEDIUM — third-party behavior, needs manual verification
- impeccable.style audit format: MEDIUM — WebFetch confirmed it's slash-command based, not static checklist
- iOS Safari behavior: MEDIUM — dvh support is well-documented, actual rendering needs device test

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable domain — CSS/accessibility standards don't change rapidly)
