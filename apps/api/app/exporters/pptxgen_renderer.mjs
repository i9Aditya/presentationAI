import fs from "node:fs";
import path from "node:path";
import pptxgen from "pptxgenjs";

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error("Usage: node pptxgen_renderer.mjs <document-json> <output-pptx>");
  process.exit(2);
}

const document = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "PresentationAI Local";
pptx.company = "PresentationAI";
pptx.subject = document.type;
pptx.title = document.title;
pptx.lang = document.language || "en-IN";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US"
};
pptx.defineLayout({ name: "LAYOUT_WIDE", width: 13.333, height: 7.5 });
pptx.margin = 0;
pptx.layout = "LAYOUT_WIDE";
pptx.slideWidth = 13.333;
pptx.slideHeight = 7.5;
pptx.layout = "LAYOUT_WIDE";
pptx.layout = "LAYOUT_WIDE";
pptx.layout = "LAYOUT_WIDE";

const W = 13.333;
const H = 7.5;
const theme = {
  ink: "14213D",
  slate: "475569",
  muted: "64748B",
  line: "CBD5E1",
  paper: "F8FAFC",
  white: "FFFFFF",
  blue: cleanHex(document.theme?.primary || "2563EB"),
  orange: cleanHex(document.theme?.accent || "F97316"),
  teal: "14B8A6",
  violet: "7C3AED",
  green: "10B981",
  rose: "E11D48"
};

function cleanHex(value) {
  const hex = String(value || "").replace("#", "").trim();
  return /^[0-9a-fA-F]{6}$/.test(hex) ? hex.toUpperCase() : "2563EB";
}

function audienceLabel() {
  return String(document.audience || "general").replaceAll("_", " ");
}

function addBackground(slide, variant = "light") {
  slide.background = { color: variant === "dark" ? theme.ink : theme.paper };
  if (variant === "dark") {
    slide.addShape(pptx.ShapeType.arc, { x: 8.3, y: -1.5, w: 5.8, h: 5.8, rotate: 0, line: { color: theme.blue, transparency: 100 }, fill: { color: theme.blue, transparency: 15 } });
    slide.addShape(pptx.ShapeType.arc, { x: 9.7, y: 3.7, w: 4.4, h: 4.4, line: { color: theme.orange, transparency: 100 }, fill: { color: theme.orange, transparency: 10 } });
  } else {
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, line: { color: theme.paper, transparency: 100 }, fill: { color: theme.paper } });
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: H, line: { color: theme.blue, transparency: 100 }, fill: { color: theme.blue } });
    for (let i = 0; i < 10; i += 1) {
      slide.addShape(pptx.ShapeType.line, { x: 10.1 + i * 0.28, y: 0.2, w: 0, h: 1.4, rotate: 42, line: { color: i % 2 === 0 ? "DBEAFE" : "E2E8F0", transparency: 12, width: 1 } });
    }
  }
}

function addFooter(slide, index, total, sectionTitle = "") {
  slide.addText("PresentationAI", { x: 0.42, y: 7.03, w: 1.55, h: 0.18, fontSize: 7.5, bold: true, color: theme.muted, margin: 0 });
  if (sectionTitle) {
    slide.addText(sectionTitle, { x: 2.05, y: 7.03, w: 7, h: 0.18, fontSize: 7.5, color: theme.muted, margin: 0, breakLine: false, fit: "shrink" });
  }
  slide.addShape(pptx.ShapeType.rect, { x: 10.7, y: 7.12, w: 1.4, h: 0.04, line: { color: "E2E8F0", transparency: 100 }, fill: { color: "E2E8F0" } });
  slide.addShape(pptx.ShapeType.rect, { x: 10.7, y: 7.12, w: Math.max(0.14, 1.4 * index / total), h: 0.04, line: { color: theme.blue, transparency: 100 }, fill: { color: theme.blue } });
  slide.addText(`${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, { x: 12.18, y: 7.02, w: 0.78, h: 0.2, fontSize: 7.5, bold: true, color: theme.muted, margin: 0, align: "right" });
}

function text(slide, value, opts) {
  slide.addText(String(value || ""), { margin: 0.06, breakLine: false, fit: "shrink", ...opts });
}

function addKicker(slide, value, x, y, color = theme.blue) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 1.7, h: 0.28, rectRadius: 0.04, line: { color, transparency: 100 }, fill: { color, transparency: 8 } });
  text(slide, value, { x: x + 0.13, y: y + 0.06, w: 1.44, h: 0.12, fontSize: 7.5, bold: true, color, margin: 0, align: "center" });
}

function extractBullets(section) {
  const bullets = [];
  for (const block of section.content_blocks || []) {
    if (block.type === "bullets") bullets.push(...(block.items || []));
    if (block.type === "text" && block.text) bullets.push(block.text);
  }
  return bullets.slice(0, 5).map((item) => String(item));
}

function firstChart(section) {
  return (section.content_blocks || []).find((block) => block.type === "chart");
}

function firstDiagram(section) {
  return (section.content_blocks || []).find((block) => block.type === "diagram");
}

function addCover() {
  const slide = pptx.addSlide();
  addBackground(slide, "dark");
  addKicker(slide, "EDITABLE PPTX", 0.72, 0.72, theme.orange);
  text(slide, document.title, { x: 0.72, y: 1.42, w: 7.5, h: 1.65, fontSize: 38, bold: true, color: theme.white, margin: 0.02, fit: "shrink" });
  text(slide, `Prepared for ${audienceLabel()} • Generated locally with Ollama + PptxGenJS`, { x: 0.76, y: 3.22, w: 7.3, h: 0.32, fontSize: 13, color: "CBD5E1", margin: 0 });
  slide.addShape(pptx.ShapeType.roundRect, { x: 0.76, y: 4.3, w: 3.1, h: 0.82, rectRadius: 0.06, line: { color: "334155", transparency: 20 }, fill: { color: "1E293B", transparency: 6 } });
  text(slide, "Output package", { x: 1.02, y: 4.48, w: 1.2, h: 0.16, fontSize: 8, bold: true, color: "94A3B8", margin: 0 });
  text(slide, "PPTX • DOCX • PDF", { x: 1.02, y: 4.72, w: 2.2, h: 0.18, fontSize: 12, bold: true, color: theme.white, margin: 0 });
  addHeroDevice(slide);
  slide.addNotes(`Opening slide for ${document.title}. Introduce the topic and audience context.`);
}

function addHeroDevice(slide) {
  slide.addShape(pptx.ShapeType.roundRect, { x: 8.25, y: 1.12, w: 4.1, h: 4.95, rectRadius: 0.08, line: { color: "475569", transparency: 20, width: 1 }, fill: { color: "0F172A", transparency: 0 } });
  slide.addShape(pptx.ShapeType.roundRect, { x: 8.55, y: 1.52, w: 3.5, h: 0.48, rectRadius: 0.05, line: { color: "1E293B", transparency: 100 }, fill: { color: "1E293B" } });
  text(slide, "AI generation workflow", { x: 8.78, y: 1.68, w: 2.8, h: 0.13, fontSize: 8.5, bold: true, color: theme.white, margin: 0 });
  const rows = [
    ["Prompt", theme.blue],
    ["Structure", theme.teal],
    ["Design", theme.orange],
    ["Export", theme.green]
  ];
  rows.forEach(([label, color], idx) => {
    const y = 2.38 + idx * 0.68;
    slide.addShape(pptx.ShapeType.ellipse, { x: 8.72, y, w: 0.28, h: 0.28, line: { color, transparency: 100 }, fill: { color } });
    slide.addShape(pptx.ShapeType.roundRect, { x: 9.18, y: y - 0.08, w: 2.55, h: 0.44, rectRadius: 0.04, line: { color: "334155", transparency: 50 }, fill: { color: "111827", transparency: 0 } });
    text(slide, label, { x: 9.42, y: y + 0.04, w: 1.8, h: 0.12, fontSize: 8.2, color: "E2E8F0", bold: true, margin: 0 });
    if (idx < rows.length - 1) slide.addShape(pptx.ShapeType.line, { x: 8.86, y: y + 0.28, w: 0, h: 0.36, line: { color: "475569", width: 1.1 } });
  });
  slide.addChart(pptx.ChartType.doughnut, [{ name: "Quality", labels: ["Design", "Content", "Export"], values: [42, 34, 24] }], {
    x: 9.12, y: 5.05, w: 1.1, h: 0.82,
    holeSize: 60,
    showLegend: false,
    showValue: false,
    showTitle: false,
    ser: [{ dataLabelPosition: "bestFit" }],
    chartColors: [theme.blue, theme.orange, theme.teal]
  });
  text(slide, "Editable shapes, charts and text", { x: 10.42, y: 5.31, w: 1.38, h: 0.2, fontSize: 7.5, color: "CBD5E1", margin: 0, fit: "shrink" });
}

function addAgenda() {
  const slide = pptx.addSlide();
  addBackground(slide);
  addKicker(slide, "DECK MAP", 0.62, 0.55, theme.blue);
  text(slide, "What this deck covers", { x: 0.62, y: 0.95, w: 4.8, h: 0.42, fontSize: 24, bold: true, color: theme.ink, margin: 0 });
  const items = (document.sections || []).slice(0, 6);
  items.forEach((section, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.72 + col * 6.0;
    const y = 1.78 + row * 1.28;
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.35, h: 0.92, rectRadius: 0.05, line: { color: "E2E8F0", width: 1 }, fill: { color: theme.white } });
    slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.22, y: y + 0.24, w: 0.42, h: 0.42, line: { color: palette(idx), transparency: 100 }, fill: { color: palette(idx) } });
    text(slide, String(idx + 1).padStart(2, "0"), { x: x + 0.31, y: y + 0.36, w: 0.22, h: 0.09, fontSize: 7, bold: true, color: theme.white, margin: 0, align: "center" });
    text(slide, section.title, { x: x + 0.86, y: y + 0.2, w: 3.95, h: 0.19, fontSize: 11, bold: true, color: theme.ink, margin: 0, fit: "shrink" });
    text(slide, (section.speaker_notes || "").slice(0, 96), { x: x + 0.86, y: y + 0.48, w: 4.0, h: 0.18, fontSize: 7.5, color: theme.muted, margin: 0, fit: "shrink" });
  });
  addFooter(slide, 2, totalSlides(), "Agenda");
  slide.addNotes("Use this slide to orient the audience before moving into details.");
}

function addSectionSlide(section, index) {
  const slide = pptx.addSlide();
  addBackground(slide);
  const color = palette(index);
  const bullets = extractBullets(section);
  const chart = firstChart(section);
  const diagram = firstDiagram(section);

  addKicker(slide, `SECTION ${String(index).padStart(2, "0")}`, 0.62, 0.48, color);
  text(slide, section.title, { x: 0.62, y: 0.88, w: 7.15, h: 0.58, fontSize: 24, bold: true, color: theme.ink, margin: 0, fit: "shrink" });
  text(slide, section.speaker_notes || "", { x: 0.64, y: 1.46, w: 6.85, h: 0.28, fontSize: 8.5, color: theme.muted, margin: 0, fit: "shrink" });

  if (chart) {
    addChartLayout(slide, bullets, chart, color);
  } else if (diagram) {
    addDiagramLayout(slide, bullets, diagram, color);
  } else if (index % 3 === 0) {
    addTimelineLayout(slide, bullets, color);
  } else {
    addCardLayout(slide, bullets, color, index);
  }

  addFooter(slide, index + 2, totalSlides(), section.title);
  slide.addNotes(section.speaker_notes || `Explain ${section.title}.`);
}

function addCardLayout(slide, bullets, color, index) {
  const leftBullets = bullets.slice(0, 4);
  leftBullets.forEach((item, idx) => {
    const x = 0.72 + (idx % 2) * 3.55;
    const y = 2.05 + Math.floor(idx / 2) * 1.45;
    addInfoCard(slide, item, idx, x, y, 3.18, 1.06, idx === 0 ? color : palette(idx + index));
  });
  addInsightPanel(slide, bullets[0] || "Key takeaway", color);
}

function addInfoCard(slide, item, idx, x, y, w, h, color) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.05, line: { color: "E2E8F0", width: 1 }, fill: { color: theme.white } });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h, line: { color, transparency: 100 }, fill: { color } });
  slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.22, y: y + 0.24, w: 0.38, h: 0.38, line: { color, transparency: 100 }, fill: { color, transparency: 6 } });
  text(slide, String(idx + 1), { x: x + 0.34, y: y + 0.34, w: 0.14, h: 0.08, fontSize: 6.5, bold: true, color, margin: 0, align: "center" });
  text(slide, item, { x: x + 0.78, y: y + 0.2, w: w - 1.03, h: 0.56, fontSize: 10.3, bold: true, color: theme.ink, margin: 0.01, fit: "shrink", valign: "mid" });
}

function addInsightPanel(slide, takeaway, color) {
  slide.addShape(pptx.ShapeType.roundRect, { x: 8.35, y: 1.75, w: 4.25, h: 4.65, rectRadius: 0.07, line: { color: "DBEAFE", width: 1 }, fill: { color: "EFF6FF" } });
  slide.addShape(pptx.ShapeType.chevron, { x: 8.72, y: 2.0, w: 0.52, h: 0.52, rotate: 0, line: { color, transparency: 100 }, fill: { color } });
  text(slide, "Key takeaway", { x: 9.42, y: 2.1, w: 1.6, h: 0.14, fontSize: 8, bold: true, color, margin: 0 });
  text(slide, takeaway, { x: 8.82, y: 2.78, w: 3.25, h: 0.92, fontSize: 18, bold: true, color: theme.ink, margin: 0, fit: "shrink", valign: "mid" });
  const stats = [["Editable", "100%"], ["Local", "AI"], ["Export", "PPTX"]];
  stats.forEach(([label, value], idx) => {
    const y = 4.28 + idx * 0.48;
    slide.addShape(pptx.ShapeType.roundRect, { x: 8.85, y, w: 2.88, h: 0.32, rectRadius: 0.03, line: { color: "BFDBFE", transparency: 40 }, fill: { color: theme.white, transparency: 5 } });
    text(slide, label, { x: 9.04, y: y + 0.1, w: 1.05, h: 0.08, fontSize: 6.5, color: theme.muted, margin: 0 });
    text(slide, value, { x: 10.72, y: y + 0.08, w: 0.82, h: 0.1, fontSize: 7.5, bold: true, color: theme.ink, margin: 0, align: "right" });
  });
}

function addChartLayout(slide, bullets, chart, color) {
  bullets.slice(0, 3).forEach((item, idx) => addInfoCard(slide, item, idx, 0.72, 2.0 + idx * 1.18, 4.4, 0.9, palette(idx)));
  const labels = chart.data?.labels || ["Quality", "Speed", "Cost"];
  const values = chart.data?.values || [80, 70, 90];
  slide.addShape(pptx.ShapeType.roundRect, { x: 5.8, y: 1.85, w: 6.62, h: 4.7, rectRadius: 0.06, line: { color: "E2E8F0" }, fill: { color: theme.white } });
  text(slide, chart.title || "Analysis", { x: 6.15, y: 2.12, w: 3.8, h: 0.18, fontSize: 11, bold: true, color: theme.ink, margin: 0 });
  slide.addChart(pptx.ChartType.bar, [{ name: chart.title || "Score", labels, values }], {
    x: 6.08,
    y: 2.55,
    w: 5.85,
    h: 3.2,
    catAxisLabelFontFace: "Aptos",
    catAxisLabelFontSize: 8,
    valAxisLabelFontSize: 8,
    showLegend: false,
    showTitle: false,
    showValue: true,
    showCatName: false,
    showLeaderLines: false,
    valAxisMinVal: 0,
    chartColors: [color, theme.orange, theme.teal, theme.violet],
    valGridLine: { color: "E2E8F0", transparency: 20 },
    valAxisLineColor: "CBD5E1",
    catAxisLineColor: "CBD5E1"
  });
}

function addDiagramLayout(slide, bullets, diagram, color) {
  const steps = ["Input", "Analyze", "Design", "Export"];
  steps.forEach((step, idx) => {
    const x = 5.52 + idx * 1.68;
    const y = 2.82;
    slide.addShape(pptx.ShapeType.ellipse, { x, y, w: 0.84, h: 0.84, line: { color: palette(idx), width: 1.2 }, fill: { color: "FFFFFF" } });
    text(slide, String(idx + 1), { x: x + 0.33, y: y + 0.31, w: 0.18, h: 0.1, fontSize: 8, bold: true, color: palette(idx), margin: 0, align: "center" });
    text(slide, step, { x: x - 0.18, y: y + 1.02, w: 1.2, h: 0.14, fontSize: 8.5, bold: true, color: theme.ink, align: "center", margin: 0 });
    if (idx < steps.length - 1) slide.addShape(pptx.ShapeType.line, { x: x + 0.88, y: y + 0.42, w: 0.78, h: 0, line: { color: "94A3B8", width: 1.4, beginArrowType: "none", endArrowType: "triangle" } });
  });
  slide.addShape(pptx.ShapeType.roundRect, { x: 5.45, y: 4.65, w: 6.55, h: 0.72, rectRadius: 0.05, line: { color: "E2E8F0" }, fill: { color: "F8FAFC" } });
  text(slide, diagram.title || "Workflow diagram", { x: 5.72, y: 4.88, w: 2.5, h: 0.12, fontSize: 8, bold: true, color, margin: 0 });
  text(slide, String(diagram.source || "").replaceAll("\n", " -> "), { x: 8.08, y: 4.86, w: 3.42, h: 0.14, fontSize: 7.5, color: theme.muted, margin: 0, fit: "shrink" });
  bullets.slice(0, 4).forEach((item, idx) => addInfoCard(slide, item, idx, 0.72, 2.0 + idx * 1.06, 4.1, 0.82, palette(idx)));
}

function addTimelineLayout(slide, bullets, color) {
  slide.addShape(pptx.ShapeType.line, { x: 0.92, y: 3.3, w: 10.9, h: 0, line: { color: "CBD5E1", width: 2 } });
  bullets.slice(0, 5).forEach((item, idx) => {
    const x = 0.95 + idx * 2.15;
    slide.addShape(pptx.ShapeType.ellipse, { x, y: 3.06, w: 0.48, h: 0.48, line: { color: palette(idx), transparency: 100 }, fill: { color: palette(idx) } });
    slide.addShape(pptx.ShapeType.roundRect, { x: x - 0.28, y: idx % 2 === 0 ? 1.92 : 4.0, w: 1.88, h: 0.82, rectRadius: 0.05, line: { color: "E2E8F0" }, fill: { color: theme.white } });
    text(slide, item, { x: x - 0.1, y: idx % 2 === 0 ? 2.13 : 4.2, w: 1.5, h: 0.32, fontSize: 7.5, bold: true, color: theme.ink, margin: 0, fit: "shrink", align: "center" });
  });
}

function addClosing() {
  const slide = pptx.addSlide();
  addBackground(slide, "dark");
  addKicker(slide, "NEXT STEPS", 0.76, 0.74, theme.teal);
  text(slide, "Ready for review and editing", { x: 0.76, y: 1.32, w: 6.2, h: 0.65, fontSize: 31, bold: true, color: theme.white, margin: 0, fit: "shrink" });
  text(slide, "Open the PPTX in PowerPoint or Google Slides and adjust text, colors, shapes, charts, or notes as needed.", { x: 0.8, y: 2.18, w: 5.8, h: 0.48, fontSize: 13, color: "CBD5E1", margin: 0, fit: "shrink" });
  ["Editable layouts", "Charts and cards", "Speaker notes", "DOCX/PDF exports"].forEach((item, idx) => {
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.86 + (idx % 2) * 3.1, y: 3.4 + Math.floor(idx / 2) * 0.88, w: 2.55, h: 0.52, rectRadius: 0.04, line: { color: "334155", transparency: 20 }, fill: { color: "1E293B", transparency: 0 } });
    text(slide, item, { x: 1.1 + (idx % 2) * 3.1, y: 3.57 + Math.floor(idx / 2) * 0.88, w: 2.0, h: 0.12, fontSize: 8.5, bold: true, color: theme.white, margin: 0 });
  });
  addHeroDevice(slide);
  slide.addNotes("Closing slide. Summarize and invite edits or questions.");
}

function palette(index) {
  return [theme.blue, theme.orange, theme.teal, theme.violet, theme.green, theme.rose][index % 6];
}

function totalSlides() {
  return (document.sections?.length || 0) + 3;
}

addCover();
addAgenda();
(document.sections || []).forEach((section, idx) => addSectionSlide(section, idx + 1));
addClosing();

await pptx.writeFile({ fileName: path.resolve(outputPath) });
