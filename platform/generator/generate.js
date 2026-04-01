#!/usr/bin/env node
/**
 * Vantix Deliverable Generator
 * 
 * Usage:
 *   node generate.js <input.md> [--output ./output]
 * 
 * Reads a markdown file with YAML frontmatter and generates:
 *   - DOCX report (Word)
 *   - PDF (via LibreOffice conversion)
 *   - PPTX presentation (for checkup type)
 *   - XLSX data (for monthly/checkup types)
 */

const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageBreak, PageNumber } = require("docx");
const { execSync } = require("child_process");

// ═══════════════════════════════════════
// CONFIG & BRAND
// ═══════════════════════════════════════
const COLORS = { D: "1B2A4A", A: "2E75B6", G: "27AE60", O: "E67E22", R: "C0392B", GL: "F5F5F5", GM: "CCCCCC", W: "FFFFFF" };
const ASSETS_DIR = path.join(__dirname, "assets");
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: COLORS.GM };
const thinBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const cm = { top: 80, bottom: 80, left: 120, right: 120 };

// ═══════════════════════════════════════
// PARSE MARKDOWN
// ═══════════════════════════════════════
function parseMarkdown(content) {
  // Extract YAML frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) throw new Error("No YAML frontmatter found");

  const meta = {};
  fmMatch[1].split("\n").forEach(line => {
    const match = line.match(/^(\w[\w_]*)\s*:\s*(.+)$/);
    if (match) {
      let val = match[2].trim();
      if (val.startsWith('"') || val.startsWith("'")) val = val.slice(1, -1);
      meta[match[1]] = val;
    }
    // Handle array items
    const arrMatch = line.match(/^\s+-\s+(.+)$/);
    if (arrMatch) {
      const lastKey = Object.keys(meta).pop();
      if (!Array.isArray(meta[lastKey])) meta[lastKey] = [];
      meta[lastKey].push(arrMatch[1].trim());
    }
  });

  // Parse sections
  const body = content.slice(fmMatch[0].length).trim();
  const sections = [];
  let currentSection = null;
  let currentSubsection = null;

  body.split("\n").forEach(line => {
    if (line.startsWith("## ")) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: line.slice(3).trim(), content: [], subsections: [] };
      currentSubsection = null;
    } else if (line.startsWith("### ") && currentSection) {
      currentSubsection = { title: line.slice(4).trim(), content: [] };
      currentSection.subsections.push(currentSubsection);
    } else if (currentSubsection) {
      currentSubsection.content.push(line);
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  });
  if (currentSection) sections.push(currentSection);

  return { meta, sections };
}

// ═══════════════════════════════════════
// PARSE TABLES FROM MD
// ═══════════════════════════════════════
function parseMdTable(lines) {
  const tableLines = lines.filter(l => l.trim().startsWith("|"));
  if (tableLines.length < 3) return null; // need header + separator + at least 1 row

  const parseRow = line => line.split("|").filter(c => c.trim()).map(c => c.trim());
  const headers = parseRow(tableLines[0]);
  // Skip separator line (index 1)
  const rows = tableLines.slice(2).map(parseRow);

  return { headers, rows };
}

// ═══════════════════════════════════════
// DOCX HELPERS
// ═══════════════════════════════════════
function hCell(text, width) {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, shading: { fill: COLORS.D, type: ShadingType.CLEAR },
    borders: thinBorders, margins: cm, verticalAlign: "center",
    children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text, bold: true, color: COLORS.W, font: "Calibri", size: 20 })] })] });
}
function dCell(text, width, opts = {}) {
  const color = text.includes("CRÍTICO") || text.includes("FALLA") ? COLORS.R :
    text.includes("ALTO") || text.includes("MEJORA") || text.includes("⚠") ? COLORS.O :
    text.includes("OK") || text.includes("✓") || text.includes("PASS") ? COLORS.G : (opts.color || "333333");
  return new TableCell({ width: { size: width, type: WidthType.DXA }, shading: opts.sh ? { fill: opts.sh, type: ShadingType.CLEAR } : undefined,
    borders: thinBorders, margins: cm, verticalAlign: "center",
    children: [new Paragraph({ alignment: opts.align || AlignmentType.LEFT, children: [new TextRun({ text, font: "Calibri", size: 20, bold: opts.bold || false, color })] })] });
}

function makeDocTable(tableData) {
  if (!tableData) return [];
  const cols = tableData.headers.length;
  const totalWidth = 9360;
  const colW = Math.floor(totalWidth / cols);
  const colWidths = Array(cols).fill(colW);
  colWidths[cols - 1] = totalWidth - colW * (cols - 1); // adjust last

  return [new Table({
    width: { size: totalWidth, type: WidthType.DXA }, columnWidths: colWidths,
    rows: [
      new TableRow({ children: tableData.headers.map((h, i) => hCell(h, colWidths[i])) }),
      ...tableData.rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => dCell(cell, colWidths[ci], { sh: ri % 2 === 0 ? COLORS.GL : COLORS.W, bold: ci === 0 }))
      }))
    ]
  })];
}

function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun({ text: t, bold: true, font: "Calibri", size: 32, color: COLORS.D })] }); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: t, bold: true, font: "Calibri", size: 26, color: COLORS.A })] }); }
function h3(t) { return new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: t, bold: true, font: "Calibri", size: 23, color: COLORS.D })] }); }
function p(t) { return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, font: "Calibri", size: 21, color: "444444" })] }); }
function bulletP(t) { return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, font: "Calibri", size: 21, color: "444444" })] }); }
function spacer(h = 200) { return new Paragraph({ spacing: { after: h }, children: [] }); }

function mdLinesToDocElements(lines) {
  const elements = [];
  const table = parseMdTable(lines);
  if (table) {
    elements.push(...makeDocTable(table));
    elements.push(spacer(100));
  }

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("|")) return;
    if (trimmed.startsWith("- **")) {
      const match = trimmed.match(/- \*\*(.+?)\*\*:\s*(.+)/);
      if (match) {
        elements.push(new Paragraph({ spacing: { after: 60 }, children: [
          new TextRun({ text: match[1] + ": ", font: "Calibri", size: 21, bold: true, color: COLORS.D }),
          new TextRun({ text: match[2], font: "Calibri", size: 21, color: "444444" }),
        ]}));
      }
    } else if (trimmed.startsWith("- ")) {
      elements.push(bulletP(trimmed.slice(2)));
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      elements.push(p(trimmed.replace(/\*\*/g, "")));
    } else if (trimmed.startsWith("**")) {
      const match = trimmed.match(/\*\*(.+?)\*\*:?\s*(.*)/);
      if (match) {
        elements.push(new Paragraph({ spacing: { after: 60 }, children: [
          new TextRun({ text: match[1] + (match[2] ? ": " : ""), font: "Calibri", size: 21, bold: true, color: COLORS.D }),
          new TextRun({ text: match[2] || "", font: "Calibri", size: 21, color: "444444" }),
        ]}));
      }
    } else if (trimmed.length > 0) {
      elements.push(p(trimmed));
    }
  });
  return elements;
}

// ═══════════════════════════════════════
// GENERATE DOCX
// ═══════════════════════════════════════
async function generateDocx(parsed, outputPath) {
  const { meta, sections } = parsed;
  const logoPath = path.join(ASSETS_DIR, "vantix-logo-h-transparent.png");
  const hasLogo = fs.existsSync(logoPath);

  const typeLabels = {
    checkup: "PERFORMANCE CHECKUP",
    monthly: "INFORME MENSUAL DE PERFORMANCE",
    weekly: "REPORTE SEMANAL DE PERFORMANCE",
    evaluation: "EVALUACIÓN DE PERFORMANCE",
  };

  const children = [];

  // Cover
  if (hasLogo) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new ImageRun({ data: fs.readFileSync(logoPath), transformation: { width: 220, height: 50 }, type: "png" })
    ]}));
  }
  children.push(spacer(200));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
    new TextRun({ text: typeLabels[meta.type] || "INFORME", font: "Calibri", size: 36, bold: true, color: COLORS.D })
  ]}));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
    new TextRun({ text: meta.client || "", font: "Calibri", size: 24, color: COLORS.A })
  ]}));
  if (meta.period || meta.week || meta.month) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: meta.period || meta.week || meta.month, font: "Calibri", size: 18, color: "999999" })
    ]}));
  }
  if (meta.loom_link) {
    children.push(spacer(100));
    children.push(new Paragraph({ spacing: { after: 120 }, children: [
      new TextRun({ text: "Video Loom: ", font: "Calibri", size: 21, bold: true, color: COLORS.A }),
      new TextRun({ text: meta.loom_link, font: "Calibri", size: 21, color: COLORS.A, italics: true }),
    ]}));
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Sections
  let sectionNum = 1;
  sections.forEach(section => {
    children.push(h1(`${sectionNum}. ${section.title}`));
    children.push(...mdLinesToDocElements(section.content));

    section.subsections.forEach(sub => {
      children.push(h2(sub.title));
      children.push(...mdLinesToDocElements(sub.content));
    });

    sectionNum++;
  });

  // Footer
  children.push(spacer(200));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.A, space: 8 } },
    children: [
      new TextRun({ text: "Preparado por Vantix Consulting | ", font: "Calibri", size: 20, color: "999999" }),
      new TextRun({ text: "contact@vantix.cl", font: "Calibri", size: 20, color: COLORS.A, bold: true }),
    ]
  }));

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Calibri", color: COLORS.D }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Calibri", color: COLORS.A }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      ]
    },
    numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Vantix | ${meta.client_short || meta.client} | ${meta.type}`, font: "Calibri", size: 16, color: "999999", italics: true })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Confidencial | ", font: "Calibri", size: 16, color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 16, color: "999999" })] })] }) },
      children,
    }]
  });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buf);
  console.log(`✓ DOCX: ${outputPath}`);
  return outputPath;
}

// ═══════════════════════════════════════
// CONVERT TO PDF
// ═══════════════════════════════════════
function convertToPdf(docxPath) {
  const dir = path.dirname(docxPath);
  try {
    execSync(`python3 /mnt/skills/public/docx/scripts/office/soffice.py --headless --convert-to pdf "${docxPath}"`, { cwd: dir, stdio: "pipe" });
    const pdfPath = docxPath.replace(".docx", ".pdf");
    console.log(`✓ PDF: ${pdfPath}`);
    return pdfPath;
  } catch (e) {
    // Try direct libreoffice
    try {
      execSync(`libreoffice --headless --convert-to pdf "${docxPath}" --outdir "${dir}"`, { stdio: "pipe" });
      const pdfPath = docxPath.replace(".docx", ".pdf");
      console.log(`✓ PDF: ${pdfPath}`);
      return pdfPath;
    } catch (e2) {
      console.log(`⚠ PDF conversion failed (install LibreOffice). DOCX still available.`);
      return null;
    }
  }
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
╔══════════════════════════════════════════╗
║  Vantix Deliverable Generator            ║
╚══════════════════════════════════════════╝

Usage: node generate.js <input.md> [--output ./output]

Supported types (set in frontmatter):
  checkup   → DOCX + PDF report
  monthly   → DOCX + PDF report
  weekly    → DOCX + PDF report

Examples:
  node generate.js examples/checkup-novapay.md
  node generate.js examples/monthly-novapay-abril.md --output ./delivery

For AI-enhanced generation with Claude:
  claude "Read SKILL.md, then process examples/checkup-novapay.md and generate all deliverables"
`);
    return;
  }

  const inputPath = args[0];
  const outputIdx = args.indexOf("--output");
  const outputDir = outputIdx >= 0 ? args[outputIdx + 1] : path.join(__dirname, "output");

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n📄 Reading: ${inputPath}`);
  const content = fs.readFileSync(inputPath, "utf8");
  const parsed = parseMarkdown(content);

  console.log(`📋 Type: ${parsed.meta.type}`);
  console.log(`🏢 Client: ${parsed.meta.client}`);
  console.log(`📅 Period: ${parsed.meta.period || parsed.meta.week || parsed.meta.month || parsed.meta.date}`);
  console.log(`📊 Sections: ${parsed.sections.length}`);
  console.log(`\n🔨 Generating deliverables...\n`);

  const clientShort = parsed.meta.client_short || parsed.meta.client.replace(/\s+/g, "");
  const typeLabel = parsed.meta.type;
  const dateLabel = (parsed.meta.month || parsed.meta.week || parsed.meta.date || "").replace(/\s+/g, "-").replace(/[—\/]/g, "-").toLowerCase();

  // Generate DOCX
  const docxName = `${clientShort}-${typeLabel}${dateLabel ? "-" + dateLabel : ""}.docx`;
  const docxPath = path.join(outputDir, docxName);
  await generateDocx(parsed, docxPath);

  // Generate PDF
  convertToPdf(docxPath);

  console.log(`\n✅ Done! Files in: ${outputDir}\n`);

  // Hint for PPTX/XLSX
  if (parsed.meta.type === "checkup" || parsed.meta.type === "monthly") {
    console.log(`💡 Para generar PPTX y XLSX, usa Claude:`);
    console.log(`   claude "Lee SKILL.md y el archivo ${inputPath}, genera la presentación PPTX y el Excel de evaluación"\n`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
