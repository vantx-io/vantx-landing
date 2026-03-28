# Vantx Docs — Documentation System

## Structure

```
docs/
├── build.sh              ← Converts all MD → DOCX → PDF
├── reference.docx        ← Style template (fonts, colors, margins)
├── README.md
├── assets/
│   ├── logo.png          ← Vantx logo (dark bg)
│   ├── logo-dark.png     ← Vantx logo (dark bg, large)
│   └── logo-white.png    ← Vantx logo (white, small)
├── content/              ← Markdown source files (single source of truth)
│   ├── 01-catalogo-v5.md         ← Service catalog (EN)
│   ├── 02-business-plan.md       ← Business plan (EN)
│   ├── 03-compensacion-vendedores.md ← Seller compensation
│   ├── 04-producthunt-plan.md    ← PH launch plan
│   ├── 05-mision-vision-valores.md ← Mission/Vision/Values
│   ├── 06-arquitectura-infra.md  ← Infrastructure architecture
│   ├── 07-demo-checkup-novapay-en.md ← Demo checkup (English)
│   ├── 08-demo-checkup-novapay-es.md ← Demo checkup (Español)
│   └── 09-website-design-system.md ← Website architecture & design system
└── output/               ← Generated DOCX + PDF (don't commit)
```

## Usage

```bash
# Build all documents
./build.sh

# Build a specific document
./build.sh 01-catalogo-v5
```

## Edit workflow

1. Edit the `.md` file in `content/`
2. Run `./build.sh`
3. Updated DOCX + PDF appear in `output/`

## Dependencies

- **pandoc** ≥ 3.x
- **LibreOffice** (headless, for DOCX → PDF)

## Brand

- Company: **Vantx** (capital V, lowercase antx)
- Website: **vantx.io**
- Email: **hello@vantx.io**
- Calendly: **calendly.com/hello-vantx/15min**
- Style guide: **../landing/brand/style-guide.html**

## Live Website

The live site lives in `../landing/` and is deployed to **vantx.io**. Key pages:

| Page | Path | Status |
|---|---|---|
| Landing / Home | `landing/index.html` | Live |
| Performance as a Service | `landing/services/performance.html` | Live |
| Observability as a Service | `landing/services/observability.html` | Live |
| Fractional SRE | `landing/services/fractional-sre.html` | Live |
| Fractional QA Tech Lead | `landing/services/qa-tech-lead.html` | Live |
| Mission & Values | `landing/about/mission.html` | Live |
| Brand Style Guide | `landing/brand/style-guide.html` | Live |
| Welcome (post-purchase) | `landing/welcome.html` | Live |
| Privacy Policy | `landing/legal/privacy.html` | Live |
| Terms of Service | `landing/legal/terms.html` | Live |
| llms.txt (AI-readable) | `landing/llms.txt` | Live |
| Sitemap | `landing/sitemap.xml` | Live |

## Design System

The website uses a custom design system documented in the Brand Style Guide (`landing/brand/style-guide.html`). Key references:

- **Fonts:** DM Sans (primary), JetBrains Mono (data/mono) — self-hosted
- **Primary color:** Forest Green `#1B6B4A`
- **Background:** Parchment `#F8F7F4` (warm, not white)
- **Dark mode:** `#1A1917` background, `#259B6E` green accent
- **CSS architecture:** `tokens.css` → `base.css` → `landing.css` / `detail.css`
- **i18n:** EN + ES via `i18n/en.json` and `i18n/es.json`
