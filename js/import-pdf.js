// ResumeCanvas — PDF import.
// Extracts the text of a PDF resume in the browser using the vendored pdf.js
// (vendor/pdfjs, Apache-2.0). The library is ~1.5 MB with its worker, so it is
// loaded lazily the first time a PDF is chosen, never on page load.
//
// Text in a PDF is positioned glyph runs, not lines, so we rebuild lines by
// grouping runs that share a baseline and ordering them left to right. Gaps
// between runs become spaces; a wide gap (two-column layouts, tab-aligned
// dates) becomes a double space so the parser can still split title/date.
//
// Classic script sharing the page's global scope with app.js.

const PDFJS_SRC = "./vendor/pdfjs/pdf.min.js";
const PDFJS_WORKER_SRC = "./vendor/pdfjs/pdf.worker.min.js";
let _pdfjsLoading = null;

function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (_pdfjsLoading) return _pdfjsLoading;
  _pdfjsLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = PDFJS_SRC;
    s.async = true;
    s.onload = () => {
      if (!window.pdfjsLib) { reject(new Error("pdf.js failed to initialise")); return; }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
      resolve(window.pdfjsLib);
    };
    s.onerror = () => { _pdfjsLoading = null; reject(new Error("pdf.js failed to load")); };
    document.head.appendChild(s);
  });
  return _pdfjsLoading;
}

// Group a page's text items into lines. Items carry a transform matrix whose
// [4],[5] are x,y of the baseline; items within ~40% of a line height of each
// other share a line.
function pdfItemsToLines(items) {
  const runs = items
    .filter((it) => typeof it.str === "string" && it.str.length)
    .map((it) => ({
      str: it.str,
      x: it.transform[4],
      y: it.transform[5],
      w: it.width || 0,
      h: Math.abs(it.transform[3]) || Math.abs(it.height) || 10,
      eol: !!it.hasEOL,
    }));
  if (!runs.length) return [];
  runs.sort((a, b) => (b.y - a.y) || (a.x - b.x));
  const lines = [];
  let cur = null;
  for (const r of runs) {
    const tol = Math.max(2, r.h * 0.4);
    if (cur && Math.abs(cur.y - r.y) <= tol) {
      cur.runs.push(r);
    } else {
      cur = { y: r.y, runs: [r] };
      lines.push(cur);
    }
  }
  return lines.map((line) => {
    line.runs.sort((a, b) => a.x - b.x);
    let text = "";
    let prev = null;
    for (const r of line.runs) {
      if (prev) {
        const gap = r.x - (prev.x + prev.w);
        const space = Math.max(2.5, prev.h * 0.25);
        if (gap > space * 6) text += "  ";       // column / tab-aligned gap
        else if (gap > space * 0.6 && !/\s$/.test(text) && !/^\s/.test(r.str)) text += " ";
      }
      text += r.str;
      prev = r;
    }
    return text.replace(/\s+$/g, "");
  });
}

// Returns the PDF's text with one line per visual line and a blank line
// between pages. Throws on encrypted or image-only PDFs with no text layer.
async function extractPdfText(file) {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true }).promise;
  const pages = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      pages.push(pdfItemsToLines(content.items).join("\n"));
    }
  } finally {
    try { await doc.destroy(); } catch (_e) { /* ignore */ }
  }
  const text = pages.join("\n\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) throw new Error("PDF_NO_TEXT");
  return text;
}
