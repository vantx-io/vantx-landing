#!/bin/bash
# ═══════════════════════════════════════════════════
# Vantx Report Engine — Build System
# Pipeline: MD → HTML (pandoc + brand CSS inline) → PDF (weasyprint)
# Also generates DOCX via pandoc for editing/sharing
#
# Usage:
#   ./build.sh                      # Build all demos
#   ./build.sh demos/filename.md    # Build one demo
#   ./build.sh templates/           # Build all templates (preview)
# ═══════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT="$SCRIPT_DIR/output"
ASSETS="$SCRIPT_DIR/assets"

# Reuse brand assets from docs
STYLE="$ROOT_DIR/docs/style.css"
TEMPLATE="$ROOT_DIR/docs/template.html"
REF="$ROOT_DIR/docs/reference.docx"
HEADER_TMP="$SCRIPT_DIR/.header-includes.html"

mkdir -p "$OUTPUT"

# Symlink logo from docs assets if not present
[ -f "$ASSETS/logo.png" ] || ln -sf "$ROOT_DIR/docs/assets/logo.png" "$ASSETS/logo.png"
[ -f "$ASSETS/logo-dark.png" ] || ln -sf "$ROOT_DIR/docs/assets/logo-dark.png" "$ASSETS/logo-dark.png"

# Encode logo as base64 data URI so HTML is self-contained
LOGO_B64="data:image/png;base64,$(base64 -i "$ASSETS/logo.png" | tr -d '\n')"

# Build a <style> block to inject into the HTML via --include-in-header
cat > "$HEADER_TMP" <<CSSEOF
<style>
$(cat "$STYLE")

/* Cover page */
.cover {
  page-break-after: always;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 700px;
}
.cover__logo { width: 140px; margin-bottom: 48px; }
.cover__bar { width: 60px; height: 3px; background: #1B6B4A; margin-bottom: 32px; }
.cover__title {
  font-family: 'DM Sans', sans-serif;
  font-size: 32pt; font-weight: 700;
  letter-spacing: -0.03em; line-height: 1.1;
  color: #1A1A17; margin: 0 0 12px 0;
  border: none; padding: 0;
}
.cover__subtitle {
  font-family: 'DM Sans', sans-serif;
  font-size: 14pt; font-weight: 400;
  color: #5C5C56; margin: 0 0 40px 0;
}
.cover__meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9pt; color: #6B6B64; line-height: 1.8;
}
.cover__meta span { display: block; }
.cover__footer {
  margin-top: auto; padding-top: 32px;
  border-top: 1px solid #E2E1DC;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8pt; color: #B0AFA8;
}

/* Report-specific: status badges */
.status-pass { color: #1B6B4A; font-weight: 700; }
.status-fail { color: #C0392B; font-weight: 700; }
.status-warn { color: #D4A017; font-weight: 700; }

/* Report-specific: metric highlight */
.metric-hero {
  font-family: 'JetBrains Mono', monospace;
  font-size: 24pt; font-weight: 700;
  color: #1B6B4A; display: block;
  margin: 8px 0;
}
</style>
CSSEOF

build_one() {
  local md="$1"
  local name=$(basename "$md" .md)
  local html="$OUTPUT/$name.html"
  local pdf="$OUTPUT/$name.pdf"
  local docx="$OUTPUT/$name.docx"

  echo "── Building: $name"

  # Clean temp markdown
  local tmp_md="$OUTPUT/.tmp-$name.md"
  sed \
    -e '/^!\[.*\](assets\/logo.*)/d' \
    -e 's/^\\newpage$/<div style="page-break-before:always"><\/div>/' \
    -e '/^\\$/d' \
    "$md" > "$tmp_md"

  # MD → HTML with brand template + inline CSS + embedded logo
  pandoc "$tmp_md" \
    --template="$TEMPLATE" \
    --include-in-header="$HEADER_TMP" \
    --variable="logo-data-uri:$LOGO_B64" \
    --resource-path="$ASSETS:$ASSETS/charts:$SCRIPT_DIR:$ROOT_DIR/docs" \
    --from=markdown+pipe_tables+yaml_metadata_block+fenced_code_blocks+inline_notes+smart+raw_html \
    --to=html5 \
    --standalone \
    --output="$html" \
    2>&1

  echo "   ✓ HTML: $html"

  # HTML → PDF via weasyprint
  if command -v weasyprint &>/dev/null; then
    weasyprint "$html" "$pdf" \
      --base-url="$SCRIPT_DIR/" \
      2>&1 | grep -v "^$" || true
    echo "   ✓ PDF:  $pdf"
  else
    echo "   ⚠ PDF skipped (weasyprint not found — brew install weasyprint)"
  fi

  # MD → DOCX
  if [ -f "$REF" ]; then
    pandoc "$md" \
      --reference-doc="$REF" \
      --resource-path="$ASSETS:$ASSETS/charts:$SCRIPT_DIR:$ROOT_DIR/docs" \
      --from=markdown+pipe_tables+yaml_metadata_block+fenced_code_blocks+inline_notes+smart \
      --to=docx \
      --output="$docx" \
      2>&1
    echo "   ✓ DOCX: $docx"
  fi

  rm -f "$tmp_md"
  echo ""
}

# Build one or all
if [ -n "$1" ]; then
  if [ -f "$1" ]; then
    build_one "$1"
  elif [ -d "$1" ]; then
    echo "═══ Vantx Report Engine — Building: $1 ═══"
    echo ""
    count=0
    for md in "$1"/*.md; do
      [ -f "$md" ] || continue
      build_one "$md"
      count=$((count + 1))
    done
    echo "═══ Done: $count reports built ═══"
  else
    echo "Error: $1 not found"
    exit 1
  fi
else
  echo "═══ Vantx Report Engine — Building all demos ═══"
  echo ""
  count=0
  for md in "$SCRIPT_DIR/demos"/*.md; do
    [ -f "$md" ] || continue
    build_one "$md"
    count=$((count + 1))
  done
  echo "═══ Done: $count reports built ═══"
  echo ""
  ls -lhS "$OUTPUT"/*.pdf 2>/dev/null
fi

rm -f "$HEADER_TMP"
