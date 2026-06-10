// ResumeCanvas — payload build, .doc/.pdf export, print, share + QR vCard
// Classic script sharing the global scope with app.js (same pattern as
// vendor/): declarations only at load time; call sites live in app.js.

// ─────────────────────────────────────────────────────────
// PAYLOAD / EXPORT
// ─────────────────────────────────────────────────────────


function slugFileName(name) {
  const slug = (name || "resume")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "resume";
}

function buildExportDocument() {
  renderPreview();
  const title = esc(state.name || "Resume");
  const fontPt = state._appliedFontPt || tcfg().bodyPt;
  // Flatten the paginated frames back into one content flow — Word repaginates
  // at its own page size; preview pixel breaks don't translate.
  const frames = $("#preview").querySelectorAll(".preview-frame");
  const combined = Array.from(frames).map(f => f.innerHTML).join("\n");
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page { size: Letter; margin: 0.5in; }
  body { margin: 0; background: #fff; color: #020826; }
  .preview-frame { font-family: ${FONT_FAMILIES[fontFamilyKey()].css}; line-height: 1.45; font-size: ${fontPt}pt; color: #020826; }
  .resume-name { text-align: center; font-weight: 700; margin: 0 0 3px 0; line-height: 1.1; font-size: ${tcfg().namePt}pt; }
  .resume-title { text-align: center; font-size: 11pt; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 8px 0; color: #555; }
  .resume-contact { text-align: center; font-size: 9pt; padding-bottom: 4px; border-bottom: 0.5pt solid #c8b89f; margin-bottom: 8px; line-height: 1.35; }
  .demo_2 .resume-contact, .demo_1 .resume-contact, .demo_5 .resume-contact { border-bottom: none; }
  .resume-contact-divider { border-bottom: 0.5pt solid #c8b89f; margin: 2px 0 8px 0; }
  .resume-section-h { font-weight: 700; padding-bottom: 2px; border-bottom: 0.5pt solid #c8b89f; margin: 12px 0 6px 0; }
  .demo_2 .resume-section-h, .demo_5 .resume-section-h, .demo_6 .resume-section-h, .demo_8 .resume-section-h { font-variant: small-caps; letter-spacing: 0.04em; }
  .edu-row, .entry-title-row, .edu-degree-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .entry-title-row { margin: 8px 0 2px 0; }
  .title, .date, .strong, .bold, .lbl { font-weight: 700; }
  .date { white-space: nowrap; }
  .entry-loc { font-style: italic; margin: 0 0 4px 0; font-size: 0.95em; }
  .bullets-list { margin: 2px 0 0 0; padding-left: 18px; }
  .bullets-list li { margin: 2px 0; }
  .skill-cat { margin: 4px 0; }
  .skills-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; padding-left: 18px; margin: 4px 0; }
  .skills-list { margin: 4px 0; padding-left: 18px; }
  .skills-list li { margin: 2px 0; }
  .skills-line { margin: 4px 0; line-height: 1.5; }
  .proj-desc { margin: 2px 0; }
  .edu-gap { margin-top: 8px; }
  .edu-line { margin: 3px 0; }
  .edu-subline, .edu-coursework { margin: 2px 0; }
  .edu-degree-bold { font-weight: 700; margin: 4px 0 0 0; }
  .proj-title { font-weight: 700; margin: 6px 0 2px 0; }
  .exp-company { margin: 0 0 2px 0; }
  .hl-company { font-weight: 700; margin: 8px 0 0 0; }
  .hl-title { font-style: italic; margin: 0 0 2px 0; }
  .contact-line { margin: 2px 0; font-size: 0.95em; }
  .sidebar-grid { width: 100%; border-collapse: collapse; }
  .sidebar-grid .col-side { width: 34%; vertical-align: top; padding-right: 16px; border-right: 0.5pt solid #c8b89f; }
  .sidebar-grid .col-main { width: 66%; vertical-align: top; padding-left: 16px; }
  .demo_6 .resume-section-h:first-child, .col-side .resume-section-h:first-child, .col-main .resume-section-h:first-child { margin-top: 0; }
</style>
</head>
<body>
<div class="preview-frame ${state.template}">${combined}</div>
</body>
</html>`;
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.className = "hidden";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function downloadDoc() {
  const filename = `${slugFileName(state.name)}-${state.template}.doc`;
  downloadBlob(buildExportDocument(), filename, "application/msword;charset=utf-8");
  toast("DOC DOWNLOADED");
}

function printPDF() {
  renderPreview();
  toast("PRINT DIALOG OPENING");
  setTimeout(() => window.print(), 100);
}

// ─────────────────────────────────────────────────────────
// REAL PDF EXPORT (phase 4)
// Walks `state` and emits a vector PDF via vendor/pdf-writer.js.
// ─────────────────────────────────────────────────────────

function buildResumePdfBytes() {
  if (!global_RcPdf()) throw new Error("PDF writer not loaded");
  const tpl = state.template;
  const cfg = tcfg(tpl);
  const fontPt = state.font_pt || cfg.bodyPt;
  const NAME_PT = cfg.namePt;
  const SECTION_PT = cfg.sectionPt;
  const CONTACT_PT = 9;
  const BODY_PT = fontPt;

  const doc = new (global_RcPdf()).Doc({ marginL: 54, marginR: 54, marginT: 40, marginB: 40 });
  if (typeof doc.setFamily === "function") doc.setFamily(FONT_FAMILIES[fontFamilyKey()].pdf);
  doc.lineH = 1.22;
  const contentW = doc.contentWidth();
  const xLeft = doc.marginL;
  const xRight = doc.pageW - doc.marginR;

  if (cfg.layout === "sidebar") {
    pdfBuildSidebar(doc, cfg, BODY_PT, SECTION_PT, contentW, xLeft, xRight);
    return doc.build({ title: `${state.name || "Resume"} — Resume`, author: state.name || "" });
  }

  // ── Header (name + contact) ─────────────────────────────────────────────
  doc.setFont("Times-Bold", NAME_PT);
  doc.ensure(NAME_PT * 1.1);
  doc.advance(NAME_PT * 0.85);
  doc.textCentered(state.name || "—", doc._cur.y);
  doc.advance(NAME_PT * 0.55);

  doc.setFont("Times-Roman", CONTACT_PT);
  if (tpl === "demo_4") {
    const extraLinks = (state.links || []).filter(Boolean).join(" | ");
    const parts = [state.location, state.phone, state.email, state.linkedin, extraLinks].filter(Boolean);
    pdfWrapCentered(doc, parts.join("  |  "), contentW);
    doc.advance(2);
    doc.hline(xLeft, xRight, doc._cur.y, 0.5);
    doc.advance(8);
  } else {
    pdfWrapCentered(doc, state.contact_line1, contentW);
    pdfWrapCentered(doc, state.contact_line2, contentW);
    doc.advance(2);
    doc.hline(xLeft, xRight, doc._cur.y, 0.5);
    doc.advance(8);
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  if (state.section_enabled.summary !== false && (state.summary || "").trim()) {
    pdfSectionHeader(doc, cfg.labels.summary, SECTION_PT, tpl);
    doc.setFont("Times-Roman", BODY_PT);
    doc.wrap(state.summary, xLeft, doc._cur.y, contentW);
    doc.advance(2);
  }

  // ── Sections in user-defined order ──────────────────────────────────────
  const order = state.section_order[tpl] || [];
  const renderers = {
    education: () => pdfRenderEducation(doc, BODY_PT, SECTION_PT, tpl, contentW, xLeft, xRight),
    skills:    () => pdfRenderSkills(doc, BODY_PT, SECTION_PT, tpl, contentW, xLeft, xRight),
    certs:     () => pdfRenderCerts(doc, BODY_PT, SECTION_PT, tpl, contentW, xLeft, xRight),
    projects:  () => state.section_enabled.projects !== false && pdfRenderProjects(doc, BODY_PT, SECTION_PT, tpl, contentW, xLeft, xRight),
    experience:() => state.section_enabled.experience !== false && pdfRenderExperience(doc, BODY_PT, SECTION_PT, tpl, contentW, xLeft, xRight),
  };
  for (const sec of order) {
    const fn = renderers[sec];
    if (fn) fn();
  }

  return doc.build({ title: `${state.name || "Resume"} — Resume`, author: state.name || "" });
}

// Column-local section header: bold label + an underline only as wide as the column.
function pdfColHeader(doc, label, sizePt, x, w) {
  doc.advance(6);
  doc.ensure(sizePt * 1.2 + 6);
  doc.setFont("Times-Bold", sizePt);
  doc.text(label, x, doc._cur.y);
  doc.advance(2);
  doc.hline(x, x + w, doc._cur.y, 0.5);
  doc.advance(6);
}

// Two-column sidebar layout (demo_6). Renders the side column, resets the
// cursor to the top, then renders the main column beside it, with a divider.
function pdfBuildSidebar(doc, cfg, bodyPt, sectionPt, contentW, xLeft, xRight) {
  const NAME_PT = cfg.namePt;
  // ── Header: name + professional title, centered, full width ──
  doc.setFont("Times-Bold", NAME_PT);
  doc.ensure(NAME_PT * 1.1);
  doc.advance(NAME_PT * 0.85);
  doc.textCentered(state.name || "—", doc._cur.y);
  doc.advance(NAME_PT * 0.5);
  if (state.professional_title) {
    doc.setFont("Times-Roman", 11);
    doc.textCentered(String(state.professional_title).toUpperCase(), doc._cur.y);
    doc.advance(11 * 1.5);
  }
  doc.hline(xLeft, xRight, doc._cur.y, 0.5);
  doc.advance(10);

  const colGap = 22;
  const sideW = Math.round(contentW * 0.34);
  const mainW = contentW - sideW - colGap;
  const sideX = xLeft;
  const mainX = xLeft + sideW + colGap;
  const topY = doc._cur.y;

  // ── Side column: contact, education, key skills ──
  doc._cur.y = topY;
  pdfColHeader(doc, cfg.labels.contact, sectionPt, sideX, sideW);
  doc.setFont("Times-Roman", 9);
  // Emoji icons can't be encoded by the Times/WinAnsi font set, so labels are plain text.
  [state.phone, state.email, state.location, state.linkedin].filter(Boolean).forEach(line => {
    doc.wrap(line, sideX, doc._cur.y, sideW);
  });

  const eduItems = (state.education || []).filter(e => e.school || e.degree);
  if (eduItems.length) {
    pdfColHeader(doc, cfg.labels.education, sectionPt, sideX, sideW);
    doc.setFont("Times-Roman", bodyPt);
    eduItems.forEach((e, i) => {
      if (i > 0) doc.advance(3);
      const head = [e.school, e.date ? `(${e.date})` : ""].filter(Boolean).join(" ");
      const full = head + (e.degree ? ` — ${e.degree}` : "");
      doc.wrap(full, sideX, doc._cur.y, sideW);
    });
  }

  const skillItems = [];
  (state.skills_two_column || []).forEach(r => { if (r.left) skillItems.push(r.left); if (r.right) skillItems.push(r.right); });
  if (skillItems.length) {
    pdfColHeader(doc, cfg.labels.skills, sectionPt, sideX, sideW);
    doc.setFont("Times-Roman", bodyPt);
    skillItems.forEach(s => doc.bullet(s, sideX, sideW));
  }
  const sideEndY = doc._cur.y;

  // ── Main column: about me, career highlights ──
  doc._cur.y = topY;
  if (state.section_enabled.summary !== false && (state.summary || "").trim()) {
    pdfColHeader(doc, cfg.labels.summary, sectionPt, mainX, mainW);
    doc.setFont("Times-Roman", bodyPt);
    doc.wrap(state.summary, mainX, doc._cur.y, mainW);
  }
  const expItems = (state.experience || []).filter(e => e.title || (e.bullets || []).some(Boolean));
  if (state.section_enabled.experience !== false && expItems.length) {
    pdfColHeader(doc, cfg.labels.experience, sectionPt, mainX, mainW);
    const lineH = bodyPt * 1.2;
    expItems.forEach((e, i) => {
      if (i > 0) doc.advance(5);
      const head = [e.company_city, e.date].filter(Boolean).join(" | ");
      if (head) {
        doc.setFont("Times-Bold", bodyPt);
        doc.wrap(head, mainX, doc._cur.y, mainW);
      }
      if (e.title) {
        doc.setFont("Times-Italic", bodyPt);
        doc.ensure(lineH);
        doc.text(e.title, mainX, doc._cur.y);
        doc.advance(lineH);
      }
      doc.setFont("Times-Roman", bodyPt);
      (e.bullets || []).filter(Boolean).forEach(b => doc.bullet(b, mainX, mainW));
    });
  }
  const mainEndY = doc._cur.y;

  // ── Vertical divider between the two columns ──
  const divX = xLeft + sideW + colGap / 2;
  const botY = Math.min(sideEndY, mainEndY);
  if (botY < topY) doc._cur.ops.push(`q 0.5 w ${divX} ${topY} m ${divX} ${botY} l S Q`);
}

function global_RcPdf() {
  return (typeof window !== "undefined") ? window.RcPdf : null;
}

function pdfWrapCentered(doc, str, width) {
  if (!str) return;
  const words = String(str).split(/\s+/).filter(Boolean);
  if (words.length === 0) return;
  const lineH = doc.size * doc.lineH;
  let line = "";
  const linesOut = [];
  for (let i = 0; i < words.length; i++) {
    const next = line ? line + " " + words[i] : words[i];
    if (global_RcPdf().measure(doc.font, doc.size, next) > width && line) {
      linesOut.push(line);
      line = words[i];
    } else {
      line = next;
    }
  }
  if (line) linesOut.push(line);
  for (const l of linesOut) {
    doc.ensure(lineH);
    doc.textCentered(l, doc._cur.y);
    doc.advance(lineH);
  }
}

function pdfSectionHeader(doc, label, sizePt, tpl) {
  const lineH = sizePt * 1.2;
  doc.advance(8);
  doc.ensure(lineH + 6);
  doc.setFont("Times-Bold", sizePt);
  // Labels carry their own casing from the template config.
  doc.text(label, doc.marginL, doc._cur.y);
  doc.advance(2);
  doc.hline(doc.marginL, doc.pageW - doc.marginR, doc._cur.y, 0.5);
  doc.advance(6);
}

function pdfRenderCoursework(doc, e, bodyPt, contentW, xLeft) {
  if (!e.coursework) return;
  const lineH = bodyPt * 1.2;
  doc.setFont("Times-Bold", bodyPt);
  const labelW = global_RcPdf().measure("Times-Bold", bodyPt, "Relevant Coursework: ");
  doc.ensure(lineH);
  doc.text("Relevant Coursework: ", xLeft, doc._cur.y);
  doc.setFont("Times-Roman", bodyPt);
  doc.wrap(e.coursework, xLeft + labelW, doc._cur.y, contentW - labelW);
}

function pdfRenderEducation(doc, bodyPt, sectionPt, tpl, contentW, xLeft, xRight) {
  const cfg = tcfg(tpl);
  const mode = cfg.eduMode;
  const items = (state.education || []).filter(e => (e.school || e.degree));
  if (items.length === 0) return;
  pdfSectionHeader(doc, cfg.labels.education, sectionPt, tpl);
  doc.setFont("Times-Roman", bodyPt);
  const lineH = bodyPt * 1.2;
  items.forEach((e, idx) => {
    if (idx > 0) doc.advance(4);
    if (mode === "demo4") {
      // Row 1: school (bold) left, city right.
      doc.ensure(lineH);
      doc.setFont("Times-Bold", bodyPt);
      doc.text(e.school || "", xLeft, doc._cur.y);
      if (e.city) doc.textRight(e.city, xRight, doc._cur.y);
      doc.advance(lineH);
      // Row 2: degree (regular) left, date right.
      doc.ensure(lineH);
      doc.setFont("Times-Roman", bodyPt);
      doc.text(e.degree || "", xLeft, doc._cur.y);
      if (e.date) {
        doc.setFont("Times-Bold", bodyPt);
        doc.textRight(e.date, xRight, doc._cur.y);
        doc.setFont("Times-Roman", bodyPt);
      }
      doc.advance(lineH);
    } else if (mode === "demo5") {
      // Degree (bold) on its own line, then "school │ city │ date" plain subline.
      doc.ensure(lineH);
      doc.setFont("Times-Bold", bodyPt);
      doc.text(e.degree || "", xLeft, doc._cur.y);
      doc.advance(lineH);
      const sub = [e.school, e.city, e.date].filter(Boolean).join(" │ ");
      if (sub) {
        doc.setFont("Times-Roman", bodyPt);
        doc.wrap(sub, xLeft, doc._cur.y, contentW);
      }
      doc.setFont("Times-Roman", bodyPt);
      pdfRenderCoursework(doc, e, bodyPt, contentW, xLeft);
    } else {
      // demo2 / demo1: school+city row 1, degree-row, optional subline + coursework.
      doc.ensure(lineH);
      doc.setFont("Times-Bold", bodyPt);
      doc.text(e.school || "", xLeft, doc._cur.y);
      if (e.city) doc.textRight(e.city, xRight, doc._cur.y);
      doc.advance(lineH);
      doc.ensure(lineH);
      // demo2 bolds the degree row; demo1 keeps it regular weight.
      doc.setFont(mode === "demo1" ? "Times-Roman" : "Times-Bold", bodyPt);
      doc.text(e.degree || "", xLeft, doc._cur.y);
      if (e.date) {
        if (mode === "demo1") doc.setFont("Times-Bold", bodyPt);
        doc.textRight(e.date, xRight, doc._cur.y);
      }
      doc.advance(lineH);
      doc.setFont("Times-Roman", bodyPt);
      if (e.subline_bold || e.subline_rest) {
        doc.ensure(lineH);
        let x = xLeft;
        if (e.subline_bold) {
          doc.setFont("Times-Bold", bodyPt);
          doc.text(e.subline_bold + (e.subline_rest ? " " : ""), x, doc._cur.y);
          x += global_RcPdf().measure("Times-Bold", bodyPt, e.subline_bold + (e.subline_rest ? " " : ""));
          doc.setFont("Times-Roman", bodyPt);
        }
        if (e.subline_rest) doc.text(e.subline_rest, x, doc._cur.y);
        doc.advance(lineH);
      }
      pdfRenderCoursework(doc, e, bodyPt, contentW, xLeft);
    }
  });
}

function pdfRenderSkills(doc, bodyPt, sectionPt, tpl, contentW, xLeft, xRight) {
  const cfg = tcfg(tpl);
  if (cfg.skillsMode === "categories") {
    const cats = (state.skills_categories || []).filter(c => c.label || c.content);
    if (cats.length === 0) return;
    pdfSectionHeader(doc, cfg.labels.skills, sectionPt, tpl);
    doc.setFont("Times-Roman", bodyPt);
    cats.forEach((c) => {
      const lineH = bodyPt * 1.2;
      const labelText = (c.label || "") + ": ";
      doc.setFont("Times-Bold", bodyPt);
      const labelW = global_RcPdf().measure("Times-Bold", bodyPt, labelText);
      doc.ensure(lineH);
      doc.text(labelText, xLeft, doc._cur.y);
      doc.setFont("Times-Roman", bodyPt);
      // Place the content starting after the label; wrap will hang under the label.
      const yBefore = doc._cur.y;
      doc.text(truncateToWidth(doc, c.content || "", contentW - labelW), xLeft + labelW, yBefore);
      doc.advance(lineH);
      // If content overflowed one line, wrap the remainder underneath.
      const fits = global_RcPdf().measure("Times-Roman", bodyPt, c.content || "") <= contentW - labelW;
      if (!fits) {
        const remainder = remainderAfterFit(doc, c.content || "", contentW - labelW);
        if (remainder) doc.wrap(remainder, xLeft, doc._cur.y, contentW);
      }
    });
  } else if (cfg.skillsMode === "pipe") {
    const line = (state.skills_inline || "").trim();
    if (!line) return;
    pdfSectionHeader(doc, cfg.labels.skills, sectionPt, tpl);
    doc.setFont("Times-Roman", bodyPt);
    doc.wrap(line, xLeft, doc._cur.y, contentW);
  } else {
    const rows = (state.skills_two_column || []).filter(r => r.left || r.right);
    if (rows.length === 0) return;
    pdfSectionHeader(doc, cfg.labels.skills, sectionPt, tpl);
    doc.setFont("Times-Roman", bodyPt);
    const colW = (contentW - 24) / 2;
    const colLx = xLeft;
    const colRx = xLeft + colW + 24;
    rows.forEach((r) => {
      const lineH = bodyPt * 1.2;
      doc.ensure(lineH);
      if (r.left) doc.text("• " + r.left, colLx, doc._cur.y);
      if (r.right) doc.text("• " + r.right, colRx, doc._cur.y);
      doc.advance(lineH);
    });
  }
}

function truncateToWidth(doc, str, width) {
  if (!str) return "";
  if (global_RcPdf().measure(doc.font, doc.size, str) <= width) return str;
  // Walk words until adding the next would overflow.
  const words = str.split(/\s+/);
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const next = line ? line + " " + words[i] : words[i];
    if (global_RcPdf().measure(doc.font, doc.size, next) > width) break;
    line = next;
  }
  return line;
}

function remainderAfterFit(doc, str, width) {
  const head = truncateToWidth(doc, str, width);
  if (head === str) return "";
  // Slice off the leading text + the joining whitespace.
  let rest = str.slice(head.length);
  while (rest.length && /\s/.test(rest[0])) rest = rest.slice(1);
  return rest;
}

function pdfRenderCerts(doc, bodyPt, sectionPt, tpl, contentW, xLeft) {
  const items = (state.certifications || []).filter(Boolean);
  if (items.length === 0) return;
  pdfSectionHeader(doc, tcfg(tpl).labels.certs, sectionPt, tpl);
  doc.setFont("Times-Roman", bodyPt);
  items.forEach((c) => doc.bullet(c, xLeft, contentW));
}

function pdfRenderProjects(doc, bodyPt, sectionPt, tpl, contentW, xLeft, xRight) {
  const cfg = tcfg(tpl);
  const items = (state.projects || []).filter(p => p.title || (p.bullets || []).some(Boolean));
  if (items.length === 0) return;
  pdfSectionHeader(doc, cfg.labels.projects, sectionPt, tpl);
  const lineH = bodyPt * 1.2;
  items.forEach((p, idx) => {
    if (idx > 0) doc.advance(4);
    const bullets = (p.bullets || []).filter(Boolean);
    if (cfg.projMode === "paragraph_inline") {
      // demo5: "Title: description" — bold title + colon, then description paragraphs.
      const first = bullets.shift() || "";
      doc.setFont("Times-Bold", bodyPt);
      const labelText = (p.title || "") + ": ";
      const labelW = global_RcPdf().measure("Times-Bold", bodyPt, labelText);
      doc.ensure(lineH);
      doc.text(labelText, xLeft, doc._cur.y);
      doc.setFont("Times-Roman", bodyPt);
      doc.text(truncateToWidth(doc, first, contentW - labelW), xLeft + labelW, doc._cur.y);
      doc.advance(lineH);
      const fits = global_RcPdf().measure("Times-Roman", bodyPt, first) <= contentW - labelW;
      if (!fits) {
        const rem = remainderAfterFit(doc, first, contentW - labelW);
        if (rem) doc.wrap(rem, xLeft, doc._cur.y, contentW);
      }
      bullets.forEach((b) => doc.wrap(b, xLeft, doc._cur.y, contentW));
    } else if (cfg.projMode === "paragraph") {
      // demo1: bold title line, then plain description paragraphs (no bullets).
      doc.setFont("Times-Bold", bodyPt);
      doc.ensure(lineH);
      doc.text(p.title || "", xLeft, doc._cur.y);
      doc.advance(lineH);
      doc.setFont("Times-Roman", bodyPt);
      bullets.forEach((b) => doc.wrap(b, xLeft, doc._cur.y, contentW));
    } else if (cfg.projMode === "dated") {
      pdfEntryBlock(doc, bodyPt, contentW, xLeft, xRight, p, tpl, "italic");
    } else {
      // demo2: bold title line, then bullets (no date).
      doc.setFont("Times-Bold", bodyPt);
      doc.ensure(lineH);
      doc.text(p.title || "", xLeft, doc._cur.y);
      doc.advance(lineH);
      doc.setFont("Times-Roman", bodyPt);
      bullets.forEach((b) => doc.bullet(b, xLeft, contentW));
    }
  });
}

function pdfRenderExperience(doc, bodyPt, sectionPt, tpl, contentW, xLeft, xRight) {
  const cfg = tcfg(tpl);
  const items = (state.experience || []).filter(e => e.title || (e.bullets || []).some(Boolean));
  if (items.length === 0) return;
  pdfSectionHeader(doc, cfg.labels.experience, sectionPt, tpl);
  items.forEach((e, idx) => {
    if (idx > 0) doc.advance(4);
    pdfEntryBlock(doc, bodyPt, contentW, xLeft, xRight, e, tpl, cfg.expMode);
  });
}

function pdfEntryBlock(doc, bodyPt, contentW, xLeft, xRight, entry, tpl, mode) {
  const lineH = bodyPt * 1.2;
  doc.setFont("Times-Bold", bodyPt);
  doc.ensure(lineH);
  doc.text(entry.title || "", xLeft, doc._cur.y);
  if (entry.date) doc.textRight(entry.date, xRight, doc._cur.y);
  doc.advance(lineH);
  // Subline: italic location (demo4) or plain company · city line (others).
  const subline = mode === "italic" ? entry.location : (entry.company_city || entry.location);
  if (subline) {
    doc.setFont(mode === "italic" ? "Times-Italic" : "Times-Roman", bodyPt);
    doc.ensure(lineH);
    doc.text(subline, xLeft, doc._cur.y);
    doc.advance(lineH);
  }
  doc.setFont("Times-Roman", bodyPt);
  (entry.bullets || []).filter(Boolean).forEach((b) => doc.bullet(b, xLeft, contentW));
}

function downloadPdf() {
  try {
    const bytes = buildResumePdfBytes();
    const filename = `${slugFileName(state.name)}-${state.template}.pdf`;
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.className = "hidden";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    toast("PDF DOWNLOADED");
  } catch (err) {
    toast("PDF EXPORT FAILED — TRY PRINT");
    // Keep diagnostic in console for debugging without leaking to the UI.
    if (typeof console !== "undefined") console.error(err);
  }
}

// ─────────────────────────────────────────────────────────
// SHARE + QR (phase 5)
// ─────────────────────────────────────────────────────────

function buildVCard() {
  // Strip any leading "mailto:" or "tel:" the user might have pasted in.
  const clean = (s) => String(s || "").trim().replace(/^(mailto:|tel:)/i, "");
  const name = clean(state.name);
  const email = clean(state.email) || pickContactPart(state.contact_line2, /[\w.+-]+@[\w.-]+/);
  const phone = clean(state.phone) || pickContactPart(state.contact_line1, /[+\d][\d().\s-]{7,}/);
  const location = clean(state.location) || pickContactPart(state.contact_line1, /^[^|()]+/);
  const linkedin = clean(state.linkedin) || pickContactPart(state.contact_line2, /linkedin\.com\/\S+/i);
  const url = linkedin && !/^https?:/i.test(linkedin) ? `https://${linkedin}` : linkedin;
  // Naive N field — last name = last token, first = the rest.
  const parts = name.split(/\s+/).filter(Boolean);
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : (parts[0] || "");
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  if (name) lines.push(`N:${vCardEscape(last)};${vCardEscape(first)};;;`);
  if (name) lines.push(`FN:${vCardEscape(name)}`);
  if (phone) lines.push(`TEL;TYPE=CELL:${vCardEscape(phone)}`);
  if (email) lines.push(`EMAIL;TYPE=INTERNET:${vCardEscape(email)}`);
  if (url) lines.push(`URL:${vCardEscape(url)}`);
  if (location) lines.push(`ADR;TYPE=HOME:;;${vCardEscape(location)};;;;`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

function pickContactPart(line, re) {
  if (!line) return "";
  const m = String(line).match(re);
  return m ? m[0].trim().replace(/[|,]+$/, "").trim() : "";
}

function vCardEscape(s) {
  return String(s || "").replace(/[\\,;]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
}

function openShareModal() {
  const bg = $("#share-modal-bg");
  if (!bg) return;
  bg.classList.add("show");
  renderShareModal();
}

function closeShareModal() {
  const bg = $("#share-modal-bg");
  if (bg) bg.classList.remove("show");
}

function renderShareModal() {
  const frame = $("#qr-frame");
  const preview = $("#vcard-preview");
  const qrFallback = $("#share-qr-fallback");
  const pdfFallback = $("#share-pdf-fallback");
  const shareBtn = $("#share-pdf-btn");

  // vCard preview text
  const vcard = buildVCard();
  if (preview) preview.textContent = vcard;

  // QR render — depends on vendor/qr.js
  if (frame) {
    frame.innerHTML = "";
    if (window.RcQr) {
      try {
        const r = window.RcQr.encode(vcard, "M");
        frame.innerHTML = window.RcQr.toSvg(r.modules, { scale: 6, margin: 3 });
        if (qrFallback) qrFallback.hidden = true;
      } catch (err) {
        frame.innerHTML = `<div class="qr-empty">CONTACT TOO LONG — clear extra fields</div>`;
        if (typeof console !== "undefined") console.error(err);
      }
    } else {
      frame.innerHTML = `<div class="qr-empty">QR not loaded</div>`;
      if (qrFallback) qrFallback.hidden = false;
    }
  }

  // Web Share API availability — checked at open time, not at load,
  // because canShare needs a File instance to evaluate correctly.
  if (shareBtn && pdfFallback) {
    const supported = typeof navigator !== "undefined" && typeof navigator.share === "function";
    if (!supported) {
      shareBtn.disabled = true;
      pdfFallback.hidden = false;
    } else {
      shareBtn.disabled = false;
      pdfFallback.hidden = true;
    }
  }
}

