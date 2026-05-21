// Minimal PDF 1.4 writer for ResumeCanvas
// No dependencies. Outputs a vector PDF with selectable, searchable text
// using the base-14 Times family (Roman / Bold / Italic / BoldItalic) +
// WinAnsi encoding so en-dash / em-dash / bullet / smart quotes render.
//
// Exposed as window.RcPdf.

(function (global) {
  "use strict";

  // ── Adobe Font Metrics: glyph widths in 1/1000em, ASCII 32–126 + a handful of
  //    WinAnsi extras we actually use (en/em dash, bullet, smart quotes).
  //    Lifted from the Adobe Type 1 AFMs for the base-14 fonts.
  const WIDTHS = {
    "Times-Roman": [
      250,333,408,500,500,833,778,333,333,333,500,564,250,333,250,278,
      500,500,500,500,500,500,500,500,500,500,278,278,564,564,564,444,
      921,722,667,667,722,611,556,722,722,333,389,722,611,889,722,722,
      556,722,667,556,611,722,722,944,722,722,611,333,278,333,469,500,
      333,444,500,444,500,444,333,500,500,278,278,500,278,778,500,500,
      500,500,333,389,278,500,500,722,500,500,444,480,200,480,541,
    ],
    "Times-Bold": [
      250,333,555,500,500,1000,833,333,333,333,500,570,250,333,250,278,
      500,500,500,500,500,500,500,500,500,500,333,333,570,570,570,500,
      930,722,667,722,722,667,611,778,778,389,500,778,667,944,722,778,
      611,778,722,556,667,722,722,1000,722,722,667,333,278,333,581,500,
      333,500,556,444,556,444,333,500,556,278,333,556,278,833,556,500,
      556,556,444,389,333,556,500,722,500,500,444,394,220,394,520,
    ],
    "Times-Italic": [
      250,333,420,500,500,833,778,333,333,333,500,675,250,333,250,278,
      500,500,500,500,500,500,500,500,500,500,333,333,675,675,675,500,
      920,611,611,667,722,611,611,722,722,333,444,667,556,833,667,722,
      611,722,611,500,556,722,611,833,611,556,556,389,278,389,422,500,
      333,500,500,444,500,444,278,500,500,278,278,444,278,722,500,500,
      500,500,389,389,278,500,444,667,444,444,389,400,275,400,541,
    ],
    "Times-BoldItalic": [
      250,389,555,500,500,833,778,333,333,333,500,570,250,333,250,278,
      500,500,500,500,500,500,500,500,500,500,333,333,570,570,570,500,
      832,667,667,667,722,667,667,722,778,389,500,667,611,889,722,722,
      611,722,667,556,611,722,667,889,667,611,611,333,278,333,570,500,
      333,500,500,444,500,444,333,500,556,278,278,500,278,778,556,500,
      500,500,389,389,278,556,444,667,500,444,389,348,220,348,570,
    ],
    "Helvetica": [
      278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,
      556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,
      1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,
      667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,
      333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,
      556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,
    ],
    "Helvetica-Bold": [
      278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,
      556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,
      975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,
      667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,
      333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,
      611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,
    ],
    "Helvetica-Oblique": [
      278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,
      556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,
      1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,
      667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,
      333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,
      556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,
    ],
    "Helvetica-BoldOblique": [
      278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,
      556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,
      975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,
      667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,
      333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,
      611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,
    ],
  };

  // WinAnsi codepoints we add manually beyond ASCII 32–126.
  // (Widths copied from the AFM extended set.)
  const EXTRA = {
    "Times-Roman":     { 0x95: 350, 0x96: 500, 0x97: 1000, 0x91: 333, 0x92: 333, 0x93: 444, 0x94: 444, 0x85: 1000, 0xA0: 250 },
    "Times-Bold":      { 0x95: 350, 0x96: 500, 0x97: 1000, 0x91: 333, 0x92: 333, 0x93: 500, 0x94: 500, 0x85: 1000, 0xA0: 250 },
    "Times-Italic":    { 0x95: 350, 0x96: 500, 0x97: 889,  0x91: 333, 0x92: 333, 0x93: 556, 0x94: 556, 0x85: 889,  0xA0: 250 },
    "Times-BoldItalic":{ 0x95: 350, 0x96: 500, 0x97: 1000, 0x91: 333, 0x92: 333, 0x93: 500, 0x94: 500, 0x85: 1000, 0xA0: 250 },
    "Helvetica":              { 0x95: 350, 0x96: 556, 0x97: 1000, 0x91: 222, 0x92: 222, 0x93: 333, 0x94: 333, 0x85: 1000, 0xA0: 278 },
    "Helvetica-Bold":         { 0x95: 350, 0x96: 556, 0x97: 1000, 0x91: 278, 0x92: 278, 0x93: 500, 0x94: 500, 0x85: 1000, 0xA0: 278 },
    "Helvetica-Oblique":      { 0x95: 350, 0x96: 556, 0x97: 1000, 0x91: 222, 0x92: 222, 0x93: 333, 0x94: 333, 0x85: 1000, 0xA0: 278 },
    "Helvetica-BoldOblique":  { 0x95: 350, 0x96: 556, 0x97: 1000, 0x91: 278, 0x92: 278, 0x93: 500, 0x94: 500, 0x85: 1000, 0xA0: 278 },
  };

  // Active font family. The renderer always asks for Times-* logical names;
  // when the family is Helvetica we transparently map those to the Helvetica
  // equivalents (Roman→base, Italic→Oblique) so call sites need no changes.
  let ACTIVE_FAMILY = "Times";
  const HELV_MAP = {
    "Times-Roman": "Helvetica",
    "Times-Bold": "Helvetica-Bold",
    "Times-Italic": "Helvetica-Oblique",
    "Times-BoldItalic": "Helvetica-BoldOblique",
  };
  function resolveFont(name) {
    return ACTIVE_FAMILY === "Helvetica" ? (HELV_MAP[name] || name) : name;
  }

  // Unicode → WinAnsi mapping for the punctuation people actually paste in.
  const UNICODE_MAP = {
    0x2013: 0x96, // en dash –
    0x2014: 0x97, // em dash —
    0x2022: 0x95, // bullet •
    0x2018: 0x91, // left single quote ‘
    0x2019: 0x92, // right single quote ’
    0x201C: 0x93, // left double quote “
    0x201D: 0x94, // right double quote ”
    0x2026: 0x85, // ellipsis …
    0x00A0: 0xA0, // nbsp
  };

  function widthOf(font, charCode) {
    if (charCode >= 32 && charCode <= 126) return WIDTHS[font][charCode - 32];
    const extra = EXTRA[font][charCode];
    return extra != null ? extra : WIDTHS[font][32 - 32]; // fallback = space width
  }

  function measure(font, sizePt, str) {
    font = resolveFont(font);
    let units = 0;
    for (let i = 0; i < str.length; i++) {
      units += widthOf(font, encodeChar(str.charCodeAt(i)));
    }
    return (units * sizePt) / 1000;
  }

  function encodeChar(code) {
    if (code >= 32 && code <= 126) return code;
    if (UNICODE_MAP[code] != null) return UNICODE_MAP[code];
    return 0x3F; // '?' for anything we can't represent
  }

  // PDF strings: parenthesized, with \, (, ) escaped. Encoded char-by-char.
  function pdfString(str) {
    let out = "(";
    for (let i = 0; i < str.length; i++) {
      const c = encodeChar(str.charCodeAt(i));
      if (c === 0x28) out += "\\(";
      else if (c === 0x29) out += "\\)";
      else if (c === 0x5C) out += "\\\\";
      else if (c < 32 || c > 126) out += "\\" + c.toString(8).padStart(3, "0");
      else out += String.fromCharCode(c);
    }
    return out + ")";
  }

  function PdfDoc(opts) {
    opts = opts || {};
    this.pageW = opts.pageW || 612;   // US Letter
    this.pageH = opts.pageH || 792;
    this.marginL = opts.marginL || 54;
    this.marginR = opts.marginR || 54;
    this.marginT = opts.marginT || 54;
    this.marginB = opts.marginB || 54;
    ACTIVE_FAMILY = "Times"; // each document starts on the default family
    this.font = "Times-Roman";
    this.size = 11;
    this.lineH = 1.25;
    this.pages = [];
    this._newPage();
  }

  PdfDoc.prototype._newPage = function () {
    const page = { ops: [], y: this.pageH - this.marginT };
    this.pages.push(page);
    this._cur = page;
    return page;
  };

  PdfDoc.prototype.setFont = function (font, size) {
    if (font) this.font = resolveFont(font);
    if (size != null) this.size = size;
  };

  // Switch the whole document's typeface: "Times" (default) or "Helvetica".
  PdfDoc.prototype.setFamily = function (family) {
    ACTIVE_FAMILY = family === "Helvetica" ? "Helvetica" : "Times";
    this.font = resolveFont(this.font);
  };

  PdfDoc.prototype.remaining = function () {
    return this._cur.y - this.marginB;
  };

  PdfDoc.prototype.advance = function (dy) {
    this._cur.y -= dy;
  };

  PdfDoc.prototype.ensure = function (dy) {
    if (this._cur.y - dy < this.marginB) this._newPage();
  };

  PdfDoc.prototype.contentWidth = function () {
    return this.pageW - this.marginL - this.marginR;
  };

  PdfDoc.prototype._textOp = function (x, y, str) {
    const fontKey = this._fontResourceKey(this.font);
    this._cur.ops.push(
      `BT /${fontKey} ${this.size} Tf 1 0 0 1 ${fmt(x)} ${fmt(y)} Tm ${pdfString(str)} Tj ET`
    );
  };

  PdfDoc.prototype._fontResourceKey = function (name) {
    return {
      "Times-Roman": "F1", "Times-Bold": "F2", "Times-Italic": "F3", "Times-BoldItalic": "F4",
      "Helvetica": "F5", "Helvetica-Bold": "F6", "Helvetica-Oblique": "F7", "Helvetica-BoldOblique": "F8",
    }[name] || "F1";
  };

  PdfDoc.prototype.text = function (str, x, y) {
    if (!str) return;
    this._textOp(x, y, str);
  };

  PdfDoc.prototype.textCentered = function (str, y) {
    const w = measure(this.font, this.size, str);
    const x = this.marginL + (this.contentWidth() - w) / 2;
    this._textOp(x, y, str);
  };

  PdfDoc.prototype.textRight = function (str, xRight, y) {
    const w = measure(this.font, this.size, str);
    this._textOp(xRight - w, y, str);
  };

  // Word-wrap text into the box [x, x+width]. Returns the y after the last line.
  PdfDoc.prototype.wrap = function (str, x, y, width) {
    const words = String(str || "").split(/\s+/).filter(Boolean);
    if (words.length === 0) return y;
    const lineHeight = this.size * this.lineH;
    let line = "";
    let curY = y;
    for (let i = 0; i < words.length; i++) {
      const next = line ? line + " " + words[i] : words[i];
      if (measure(this.font, this.size, next) > width && line) {
        this.ensure(lineHeight);
        this._textOp(x, this._cur.y, line);
        this._cur.y -= lineHeight;
        line = words[i];
      } else {
        line = next;
      }
    }
    if (line) {
      this.ensure(lineHeight);
      this._textOp(x, this._cur.y, line);
      this._cur.y -= lineHeight;
    }
    return this._cur.y;
  };

  // Hanging-indent bullet: leading "• " on first line, subsequent lines indented.
  PdfDoc.prototype.bullet = function (str, x, width) {
    const bulletW = measure(this.font, this.size, "• ");
    const indent = bulletW;
    const lineHeight = this.size * this.lineH;
    const words = String(str || "").split(/\s+/).filter(Boolean);
    if (words.length === 0) return;
    let line = "";
    let firstLine = true;
    for (let i = 0; i < words.length; i++) {
      const next = line ? line + " " + words[i] : words[i];
      const maxW = width - (firstLine ? 0 : indent);
      if (measure(this.font, this.size, next) > maxW && line) {
        this._flushBulletLine(line, x, indent, firstLine);
        firstLine = false;
        line = words[i];
      } else {
        line = next;
      }
    }
    if (line) this._flushBulletLine(line, x, indent, firstLine);
  };

  PdfDoc.prototype._flushBulletLine = function (line, x, indent, firstLine) {
    const lineHeight = this.size * this.lineH;
    this.ensure(lineHeight);
    if (firstLine) {
      this._textOp(x, this._cur.y, "• " + line);
    } else {
      this._textOp(x + indent, this._cur.y, line);
    }
    this._cur.y -= lineHeight;
  };

  PdfDoc.prototype.hline = function (x1, x2, y, weight) {
    weight = weight || 0.5;
    this._cur.ops.push(`q ${fmt(weight)} w ${fmt(x1)} ${fmt(y)} m ${fmt(x2)} ${fmt(y)} l S Q`);
  };

  PdfDoc.prototype.gap = function (dy) {
    this.advance(dy);
  };

  function fmt(n) {
    return Math.round(n * 1000) / 1000;
  }

  // ── PDF assembly ────────────────────────────────────────────────────────
  PdfDoc.prototype.build = function (meta) {
    meta = meta || {};
    const objects = []; // index 0 unused, real objects start at 1
    objects.push(null);

    const fontIds = {};
    ["Times-Roman", "Times-Bold", "Times-Italic", "Times-BoldItalic",
     "Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique"].forEach((name) => {
      const id = objects.length;
      fontIds[name] = id;
      objects.push(
        `<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`
      );
    });

    // Allocate page object IDs first so /Pages /Kids can reference them.
    const pageObjIds = this.pages.map(() => null);
    const contentObjIds = this.pages.map(() => null);
    pageObjIds.forEach((_, i) => {
      contentObjIds[i] = objects.length; objects.push("__placeholder__");
      pageObjIds[i] = objects.length; objects.push("__placeholder__");
    });

    const pagesObjId = objects.length;
    objects.push("__placeholder__");

    const catalogObjId = objects.length;
    objects.push(`<< /Type /Catalog /Pages ${pagesObjId} 0 R >>`);

    // Fill in content streams + page objects.
    this.pages.forEach((page, i) => {
      const stream = page.ops.join("\n") + "\n";
      objects[contentObjIds[i]] = `<< /Length ${stream.length} >>\nstream\n${stream}endstream`;
      const fontDict = Object.keys(fontIds).map((n) => `/${this._fontResourceKey(n)} ${fontIds[n]} 0 R`).join(" ");
      objects[pageObjIds[i]] =
        `<< /Type /Page /Parent ${pagesObjId} 0 R /MediaBox [0 0 ${this.pageW} ${this.pageH}] ` +
        `/Resources << /Font << ${fontDict} >> >> /Contents ${contentObjIds[i]} 0 R >>`;
    });

    objects[pagesObjId] =
      `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${this.pages.length} >>`;

    // Info dictionary (title + producer).
    const infoObjId = objects.length;
    const title = meta.title || "Resume";
    const author = meta.author || "";
    objects.push(`<< /Title ${pdfString(title)} /Author ${pdfString(author)} /Producer ${pdfString("ResumeCanvas")} >>`);

    // Serialize.
    const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    let body = header;
    const offsets = [0];
    for (let i = 1; i < objects.length; i++) {
      offsets.push(body.length);
      body += `${i} 0 obj\n${objects[i]}\nendobj\n`;
    }
    const xrefOffset = body.length;
    body += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < objects.length; i++) {
      body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    body +=
      `trailer\n<< /Size ${objects.length} /Root ${catalogObjId} 0 R /Info ${infoObjId} 0 R >>\n` +
      `startxref\n${xrefOffset}\n%%EOF`;

    // Convert to byte array (latin-1 is safe here since pdfString already
    // escaped anything outside 0x20–0x7E via octal).
    const bytes = new Uint8Array(body.length);
    for (let i = 0; i < body.length; i++) bytes[i] = body.charCodeAt(i) & 0xff;
    return bytes;
  };

  global.RcPdf = { Doc: PdfDoc, measure };
})(typeof window !== "undefined" ? window : globalThis);
