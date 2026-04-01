#!/bin/bash
# ═══════════════════════════════════════════════════
# Vantx Docs — Build System
# Pipeline: MD → HTML (pandoc + brand CSS inline) → PDF (weasyprint)
# Also generates DOCX via pandoc for editing/sharing
# Usage: ./build.sh [filename] or ./build.sh (builds all)
# ═══════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTENT="$SCRIPT_DIR/content"
OUTPUT="$SCRIPT_DIR/output"
STYLE="$SCRIPT_DIR/style.css"
TEMPLATE="$SCRIPT_DIR/template.html"
REF="$SCRIPT_DIR/reference.docx"
ASSETS="$SCRIPT_DIR/assets"
HEADER_TMP="$SCRIPT_DIR/.header-includes.html"

mkdir -p "$OUTPUT"

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
</style>
CSSEOF

build_one() {
  local md="$1"
  local name=$(basename "$md" .md)
  local html="$OUTPUT/$name.html"
  local pdf="$OUTPUT/$name.pdf"
  local docx="$OUTPUT/$name.docx"

  echo "── Building: $name"

  # Create a cleaned temp markdown:
  # - Remove the duplicate logo line: ![](assets/logo.png)...
  # - Convert \newpage to <div style="page-break-before:always"></div>
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
    --resource-path="$ASSETS:$CONTENT:$SCRIPT_DIR" \
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

  # MD → DOCX (for editing/sharing)
  if [ -f "$REF" ]; then
    pandoc "$md" \
      --reference-doc="$REF" \
      --resource-path="$ASSETS:$CONTENT:$SCRIPT_DIR" \
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
  if [ -f "$CONTENT/$1.md" ]; then
    build_one "$CONTENT/$1.md"
  elif [ -f "$1" ]; then
    build_one "$1"
  else
    echo "Error: $1 not found"
    exit 1
  fi
else
  echo "═══ Vantx Docs Build ═══"
  echo ""
  count=0
  for md in "$CONTENT"/*.md; do
    [ -f "$md" ] || continue
    build_one "$md"
    count=$((count + 1))
  done
  echo "═══ Done: $count documents built ═══"
  echo ""
  ls -lhS "$OUTPUT"/*.pdf 2>/dev/null
fi

rm -f "$HEADER_TMP"
