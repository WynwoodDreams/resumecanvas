// ResumeCanvas — real .docx export and plain-text export.
// A .docx is a zip of XML parts. We write the zip ourselves (STORE method,
// no compression, CRC-32) and emit a single-column WordprocessingML document
// straight from `state`: real paragraphs, real headings, bullet paragraphs,
// a right tab for dates. No tables, no text boxes, no images — it opens
// cleanly in Word, Google Docs and LibreOffice, and parses cleanly in ATS
// systems. Layout follows the active template's section order and labels.
//
// Classic script sharing the page's global scope with app.js.

// ── Minimal zip writer (STORE) ───────────────────────────────────────────
const _CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = _CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// files: [{ name, text }] → Uint8Array of a valid zip archive.
function buildZipStored(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  const u16 = (v) => [v & 0xFF, (v >>> 8) & 0xFF];
  const u32 = (v) => [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF];
  // Fixed DOS date/time so the output is deterministic.
  const dosTime = 0, dosDate = (1 << 5) | 1 | ((2024 - 1980) << 9);
  for (const f of files) {
    const name = enc.encode(f.name);
    const data = enc.encode(f.text);
    const crc = crc32(data);
    const local = new Uint8Array([
      0x50, 0x4B, 0x03, 0x04, ...u16(20), ...u16(0), ...u16(0), ...u16(dosTime), ...u16(dosDate),
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0),
    ]);
    parts.push(local, name, data);
    central.push(new Uint8Array([
      0x50, 0x4B, 0x01, 0x02, ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(dosTime), ...u16(dosDate),
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(offset),
    ]), name);
    offset += local.length + name.length + data.length;
  }
  const cdStart = offset;
  let cdLen = 0;
  for (const c of central) cdLen += c.length;
  const eocd = new Uint8Array([
    0x50, 0x4B, 0x05, 0x06, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length),
    ...u32(cdLen), ...u32(cdStart), ...u16(0),
  ]);
  const all = [...parts, ...central, eocd];
  const out = new Uint8Array(all.reduce((n, a) => n + a.length, 0));
  let p = 0;
  for (const a of all) { out.set(a, p); p += a.length; }
  return out;
}

// ── WordprocessingML helpers ─────────────────────────────────────────────
function xmlEsc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    // Strip control chars Word rejects.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function docxFontName() {
  const fam = (typeof FONT_FAMILIES !== "undefined" && FONT_FAMILIES[state.font_family]) ? state.font_family : "times";
  return { times: "Times New Roman", arial: "Arial", calibri: "Calibri" }[fam] || "Times New Roman";
}

// A run: text with optional bold/italic/size(pt).
function dRun(text, o = {}) {
  if (!text) return "";
  const props = [
    `<w:rFonts w:ascii="${xmlEsc(o.font)}" w:hAnsi="${xmlEsc(o.font)}" w:cs="${xmlEsc(o.font)}"/>`,
    o.bold ? "<w:b/>" : "",
    o.italic ? "<w:i/>" : "",
    o.caps ? "<w:caps/>" : "",
    `<w:sz w:val="${Math.round(o.size * 2)}"/>`,
  ].join("");
  return `<w:r><w:rPr>${props}</w:rPr><w:t xml:space="preserve">${xmlEsc(text)}</w:t></w:r>`;
}

// A paragraph from runs. o: { center, before, after, indent, hanging, border, tabRight, keepNext }
function dPara(runsXml, o = {}) {
  const ppr = [
    o.keepNext ? "<w:keepNext/>" : "",
    o.border ? `<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="000000"/></w:pBdr>` : "",
    o.tabRight ? `<w:tabs><w:tab w:val="right" w:pos="${o.tabRight}"/></w:tabs>` : "",
    `<w:spacing w:before="${o.before || 0}" w:after="${o.after || 0}" w:line="264" w:lineRule="auto"/>`,
    o.indent != null ? `<w:ind w:left="${o.indent}" w:hanging="${o.hanging || 0}"/>` : "",
    o.center ? `<w:jc w:val="center"/>` : "",
  ].join("");
  return `<w:p><w:pPr>${ppr}</w:pPr>${runsXml}</w:p>`;
}

// Build the document body from state. Single column in every template; the
// template still decides labels, section order and body size.
function buildDocxBodyXml() {
  const tpl = state.template;
  const cfg = tcfg(tpl);
  const font = docxFontName();
  const body = state.font_pt || cfg.bodyPt;
  const sectionPt = Math.max(body, cfg.sectionPt || body + 1);
  const CONTENT_TWIPS = 12240 - 2 * 1080; // page width minus 0.75in margins
  const out = [];
  const T = (text, o) => dRun(text, Object.assign({ font, size: body }, o));

  // Header
  out.push(dPara(T(state.name || "—", { bold: true, size: cfg.namePt || 18 }), { center: true, after: 40 }));
  let contact;
  if (cfg.header === "structured") {
    contact = [state.location, state.phone, state.email, state.linkedin, ...(state.links || [])].filter(Boolean).join(" | ");
    out.push(dPara(T(contact, { size: Math.max(9, body - 1) }), { center: true, after: 60, border: true }));
  } else {
    if ((state.contact_line1 || "").trim()) out.push(dPara(T(state.contact_line1, { size: Math.max(9, body - 1) }), { center: true }));
    if ((state.contact_line2 || "").trim()) out.push(dPara(T(state.contact_line2, { size: Math.max(9, body - 1) }), { center: true }));
    out.push(dPara("", { after: 60, border: true }));
  }

  const heading = (label) => out.push(dPara(T(label, { bold: true, size: sectionPt, caps: cfg.headerCase !== "plain" }), { before: 200, after: 80, border: true, keepNext: true }));
  const bullet = (text) => out.push(dPara(T("•\t" + text), { indent: 360, hanging: 360, after: 20 }));
  const titleDate = (left, right, o = {}) => out.push(dPara(
    T(left, o) + (right ? `<w:r><w:rPr><w:sz w:val="${body * 2}"/></w:rPr><w:tab/></w:r>` + T(right, { italic: o.dateItalic }) : ""),
    { tabRight: CONTENT_TWIPS, before: o.before || 100, after: 20, keepNext: true }
  ));

  if (state.section_enabled.summary !== false && (state.summary || "").trim()) {
    heading(cfg.labels.summary);
    out.push(dPara(T(state.summary), { after: 40 }));
  }

  const renderers = {
    education: () => {
      const items = (state.education || []).filter(e => e.school || e.degree);
      if (!items.length) return;
      heading(cfg.labels.education);
      items.forEach((e, i) => {
        titleDate(e.school || "", e.city || "", { bold: true, before: i ? 100 : 40 });
        if (e.degree || e.date) titleDate(e.degree || "", e.date || "", { before: 0 });
        if (e.subline_bold || e.subline_rest) out.push(dPara(T(e.subline_bold || "", { bold: true }) + T(e.subline_rest || ""), { after: 20 }));
        if (e.coursework) out.push(dPara(T("Relevant Coursework: ", { bold: true }) + T(e.coursework), { after: 20 }));
        if (e.certifications) out.push(dPara(T("Certifications: ", { bold: true }) + T(e.certifications), { after: 20 }));
      });
    },
    skills: () => {
      const mode = cfg.skillsMode;
      heading(cfg.labels.skills);
      if (mode === "two_column" || mode === "list") {
        const items = [];
        (state.skills_two_column || []).forEach(r => { if (r.left) items.push(r.left); if (r.right) items.push(r.right); });
        if (!items.length) return;
        items.forEach(bullet);
      } else if (mode === "inline") {
        out.push(dPara(T(state.skills_inline || ""), { after: 40 }));
      } else {
        (state.skills_categories || []).filter(c => c.label || c.content).forEach(c => {
          out.push(dPara(T(c.label ? c.label + ": " : "", { bold: true }) + T(c.content || ""), { after: 40 }));
        });
      }
    },
    certs: () => {
      if (!cfg.certs) return;
      const items = (state.certifications || []).filter(Boolean);
      if (!items.length) return;
      heading(cfg.labels.certs);
      items.forEach(bullet);
    },
    projects: () => {
      if (state.section_enabled.projects === false) return;
      const items = (state.projects || []).filter(p => p.title || (p.bullets || []).some(Boolean));
      if (!items.length) return;
      heading(cfg.labels.projects);
      items.forEach((p, i) => {
        titleDate(p.title || "", p.date || "", { bold: true, before: i ? 100 : 40 });
        if (p.location) out.push(dPara(T(p.location, { italic: true }), { after: 20 }));
        (p.bullets || []).filter(Boolean).forEach(bullet);
      });
    },
    experience: () => {
      if (state.section_enabled.experience === false) return;
      const items = (state.experience || []).filter(e => e.title || (e.bullets || []).some(Boolean));
      if (!items.length) return;
      heading(cfg.labels.experience);
      items.forEach((e, i) => {
        titleDate(e.title || "", e.date || "", { bold: true, before: i ? 100 : 40 });
        const sub = e.company_city || e.location;
        if (sub) out.push(dPara(T(sub, { italic: true }), { after: 20 }));
        (e.bullets || []).filter(Boolean).forEach(bullet);
      });
    },
  };
  for (const sec of (state.section_order[tpl] || [])) if (renderers[sec]) renderers[sec]();

  (state.custom_sections || []).forEach(sec => {
    const lines = (sec.bullets || []).filter(b => b && b.trim());
    if (!(sec.title || "").trim() && !lines.length) return;
    heading(sec.title || "Additional");
    lines.forEach(bullet);
  });

  return out.join("");
}

function buildDocxBytes() {
  const bodyXml = buildDocxBodyXml();
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>${bodyXml}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="800" w:right="1080" w:bottom="800" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body>
</w:document>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`;
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${xmlEsc(state.name || "Resume")} — Resume</dc:title><dc:creator>${xmlEsc(state.name || "")}</dc:creator>
</cp:coreProperties>`;
  return buildZipStored([
    { name: "[Content_Types].xml", text: contentTypes },
    { name: "_rels/.rels", text: rels },
    { name: "word/document.xml", text: document },
    { name: "docProps/core.xml", text: core },
  ]);
}

function downloadDocx() {
  try {
    const bytes = buildDocxBytes();
    downloadBlob(bytes, `${slugFileName(state.name)}-${state.template}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    toast("DOCX DOWNLOADED");
  } catch (err) {
    console.error("DOCX export failed", err);
    toast("DOCX EXPORT FAILED");
  }
}

// ── Plain text (for application forms) ───────────────────────────────────
function buildPlainText() {
  const tpl = state.template;
  const cfg = tcfg(tpl);
  const L = [];
  const H = (label) => { L.push(""); L.push(String(label || "").toUpperCase()); L.push("-".repeat(Math.min(40, String(label || "").length + 4))); };
  L.push(state.name || "");
  if (cfg.header === "structured") L.push([state.location, state.phone, state.email, state.linkedin, ...(state.links || [])].filter(Boolean).join(" | "));
  else { if (state.contact_line1) L.push(state.contact_line1); if (state.contact_line2) L.push(state.contact_line2); }
  if (state.section_enabled.summary !== false && (state.summary || "").trim()) { H(cfg.labels.summary); L.push(state.summary.trim()); }
  const sec = {
    education: () => {
      const items = (state.education || []).filter(e => e.school || e.degree);
      if (!items.length) return;
      H(cfg.labels.education);
      items.forEach(e => {
        L.push([e.school, e.city].filter(Boolean).join(", "));
        if (e.degree || e.date) L.push([e.degree, e.date].filter(Boolean).join(" — "));
        if (e.coursework) L.push("Relevant Coursework: " + e.coursework);
        L.push("");
      });
    },
    skills: () => {
      H(cfg.labels.skills);
      if (cfg.skillsMode === "two_column" || cfg.skillsMode === "list") {
        (state.skills_two_column || []).forEach(r => { if (r.left) L.push("- " + r.left); if (r.right) L.push("- " + r.right); });
      } else if (cfg.skillsMode === "inline") L.push(state.skills_inline || "");
      else (state.skills_categories || []).forEach(c => { if (c.label || c.content) L.push((c.label ? c.label + ": " : "") + (c.content || "")); });
    },
    certs: () => { if (!cfg.certs) return; const items = (state.certifications || []).filter(Boolean); if (!items.length) return; H(cfg.labels.certs); items.forEach(c => L.push("- " + c)); },
    projects: () => {
      if (state.section_enabled.projects === false) return;
      const items = (state.projects || []).filter(p => p.title || (p.bullets || []).some(Boolean));
      if (!items.length) return;
      H(cfg.labels.projects);
      items.forEach(p => { L.push([p.title, p.date].filter(Boolean).join(" — ")); if (p.location) L.push(p.location); (p.bullets || []).filter(Boolean).forEach(b => L.push("- " + b)); L.push(""); });
    },
    experience: () => {
      if (state.section_enabled.experience === false) return;
      const items = (state.experience || []).filter(e => e.title || (e.bullets || []).some(Boolean));
      if (!items.length) return;
      H(cfg.labels.experience);
      items.forEach(e => { L.push([e.title, e.date].filter(Boolean).join(" — ")); const sub = e.company_city || e.location; if (sub) L.push(sub); (e.bullets || []).filter(Boolean).forEach(b => L.push("- " + b)); L.push(""); });
    },
  };
  for (const s of (state.section_order[tpl] || [])) if (sec[s]) sec[s]();
  (state.custom_sections || []).forEach(c => {
    const lines = (c.bullets || []).filter(b => b && b.trim());
    if (!(c.title || "").trim() && !lines.length) return;
    H(c.title || "Additional");
    lines.forEach(b => L.push("- " + b));
  });
  return L.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function copyPlainText() {
  copyText(buildPlainText(), "PLAIN TEXT COPIED — PASTE INTO ANY FORM");
}
