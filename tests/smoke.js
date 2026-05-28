const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => {
  throw new Error(message);
};
const assert = (condition, message) => {
  if (!condition) fail(message);
};

const html = read('index.html');
const app = read('app.js');
const css = read('styles.css');
const vercel = JSON.parse(read('vercel.json'));

assert(html.includes('<link rel="stylesheet" href="./styles.css">'), 'index.html must load external styles.css');
assert(html.includes('<script src="./app.js" defer></script>'), 'index.html must load deferred app.js');
assert(!/<script>/.test(html), 'index.html must not contain inline script blocks');
assert(!/<style>/.test(html), 'index.html must not contain inline style blocks');
assert(!/\son\w+=/i.test(html), 'index.html must not contain inline event handlers');
assert(!/\sstyle=/i.test(html), 'index.html must not contain inline style attributes');
// CSSOM writes (element.style.x = …) are CSP-safe; only inline event-handler
// attributes, HTML style="" attributes, and unsafe-inline require unsafe-inline.
assert(!/\bon\w+\s*=\s*["']|style\s*=\s*["']|setAttribute\(\s*["']style|unsafe-inline/i.test(app), 'app.js must avoid inline handlers/style attributes and unsafe-inline CSP dependencies');

new Function(app);

const cspHeader = vercel.headers?.[0]?.headers?.find((header) => header.key === 'Content-Security-Policy');
assert(cspHeader, 'vercel.json must define a Content-Security-Policy header');
assert(!cspHeader.value.includes("'unsafe-inline'"), 'CSP must not allow unsafe-inline');
assert(cspHeader.value.includes("script-src 'self'"), 'CSP must restrict scripts to self');
assert(cspHeader.value.includes("style-src 'self' https://fonts.googleapis.com"), 'CSP must allow local CSS and Google Fonts CSS only');
assert(css.includes('.hidden'), 'styles.css must include reusable hidden class');
assert(css.includes('.preview-frame.font-10'), 'styles.css must include preview font sizing classes');

assert(html.includes('data-action="downloadDoc"'), 'toolbar must include a DOC download action');
assert(html.includes('data-action="printPDF"'), 'toolbar must include a PDF/print action');
assert(app.includes('function downloadDoc()'), 'app.js must implement DOC downloads');
assert(app.includes('application/msword'), 'DOC export must use a Word-compatible MIME type');
assert(app.includes('window.print()'), 'PDF export must open the browser print/save-PDF flow');
assert(css.includes('.preview-toolbar'), 'styles.css must include visible toolbar styling');
assert(css.includes('@media print'), 'styles.css must include print/PDF styles');

// PWA shell (phase 2)
const manifest = JSON.parse(read('manifest.webmanifest'));
assert(manifest.name && manifest.start_url, 'manifest.webmanifest must include name + start_url');
assert(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'manifest.webmanifest must declare icons');
assert(fs.existsSync(path.join(root, 'sw.js')), 'sw.js (service worker) must exist');
assert(fs.existsSync(path.join(root, 'icon.svg')), 'icon.svg must exist');
assert(fs.existsSync(path.join(root, 'icon-maskable.svg')), 'icon-maskable.svg must exist');
assert(fs.existsSync(path.join(root, 'apple-touch-icon.svg')), 'apple-touch-icon.svg must exist');
assert(html.includes('rel="manifest"'), 'index.html must link the web manifest');
assert(html.includes('apple-mobile-web-app-capable'), 'index.html must declare apple-mobile-web-app-capable');
assert(app.includes('serviceWorker') && app.includes('./sw.js'), 'app.js must register the service worker');

// Resume library (phase 3)
assert(html.includes('id="library-modal-bg"'), 'index.html must include the library modal');
assert(html.includes('id="library-pill"'), 'index.html must include the library pill in the topbar');
assert(app.includes('LIBRARY_KEY') && app.includes('resumecanvas:v3:library'), 'app.js must persist the resume library under resumecanvas:v3:library');
assert(app.includes('function switchToResume'), 'app.js must implement switchToResume');
assert(app.includes('function createNewResume'), 'app.js must implement createNewResume');
assert(app.includes('function duplicateResume'), 'app.js must implement duplicateResume');
assert(app.includes('function deleteResume'), 'app.js must implement deleteResume');
assert(app.includes('function saveDraft'), 'app.js must implement saveDraft (move draft → saved)');
assert(app.includes('DRAFT_LIMIT') && app.includes('SAVED_LIMIT'), 'app.js must enforce per-bucket caps');
assert(app.includes('migrateLegacyLibrary'), 'app.js must migrate the v2 single-list library shape');
assert(css.includes('.lib-row'), 'styles.css must style library rows');
assert(css.includes('.lib-bucket-h'), 'styles.css must style the drafts/saved bucket headers');

// Final review pane (phase 9)
assert(html.includes('id="pane-final"') && html.includes('data-pane-target="final"'), 'index.html must include the FINAL swipe pane + tab');
assert(html.includes('id="final-preview"'), 'index.html must include the mirrored final preview container');
assert(html.includes('data-action="finalSaveToLibrary"'), 'index.html must wire finalSaveToLibrary');
assert(app.includes('function mirrorPreviewToFinal') && app.includes('function updateFinalActionState'), 'app.js must implement final-pane preview mirroring + action state');
assert(css.includes('.final-actions') && css.includes('.final-btn'), 'styles.css must style the final-pane action bar');

// Real PDF export (phase 4)
assert(fs.existsSync(path.join(root, 'vendor/pdf-writer.js')), 'vendor/pdf-writer.js must exist');
const pdfWriter = read('vendor/pdf-writer.js');
assert(pdfWriter.includes('RcPdf') && pdfWriter.includes('Times-Roman'), 'pdf-writer.js must expose RcPdf and embed Times font widths');
assert(html.includes('data-action="downloadPdf"'), 'toolbar must include a real PDF download action');
assert(app.includes('function downloadPdf') && app.includes('application/pdf'), 'app.js must implement downloadPdf with the application/pdf MIME');
assert(app.includes('buildResumePdfBytes'), 'app.js must implement buildResumePdfBytes');
const sw = read('sw.js');
assert(sw.includes('./vendor/pdf-writer.js'), 'service worker must precache the PDF writer for offline export');

// Native share + QR vCard (phase 5)
assert(fs.existsSync(path.join(root, 'vendor/qr.js')), 'vendor/qr.js must exist');
const qr = read('vendor/qr.js');
assert(qr.includes('RcQr') && qr.includes('encode'), 'qr.js must expose RcQr.encode');
assert(html.includes('id="share-modal-bg"'), 'index.html must include the share modal');
assert(html.includes('data-action="openShareModal"'), 'toolbar must expose the share modal');
assert(app.includes('function buildVCard') && app.includes('BEGIN:VCARD'), 'app.js must build a vCard for the QR code');
assert(app.includes('navigator.share'), 'app.js must use the Web Share API');
assert(sw.includes('./vendor/qr.js'), 'service worker must precache the QR encoder');
assert(css.includes('.share-modal') && css.includes('.qr-frame'), 'styles.css must style the share modal and QR frame');

// Voice-to-bullet (phase 6)
assert(app.includes('SpeechRecognition'), 'app.js must feature-detect SpeechRecognition');
assert(app.includes('function micToggle') && app.includes('function startDictation'), 'app.js must implement micToggle + startDictation');
assert(html.includes('data-mic-target="summary"'), 'index.html must wire a mic button on the summary textarea');
assert(css.includes('.mic-btn') && css.includes('.mic-btn.recording'), 'styles.css must style mic buttons with a recording state');
const permPolicy = vercel.headers[0].headers.find((h) => h.key === 'Permissions-Policy');
assert(permPolicy && permPolicy.value.includes('microphone=(self)'), 'Permissions-Policy must allow microphone=(self) for voice dictation');

// Camera scan (phase 7)
assert(html.includes('id="camera-input"') && html.includes('capture="environment"'), 'index.html must include the camera capture input');
assert(html.includes('data-action="triggerCamera"'), 'index.html must include the camera trigger button');
assert(app.includes('function triggerCamera') && app.includes('function handleCameraCapture'), 'app.js must implement camera scan handlers');
assert(app.includes('TextDetector'), 'app.js must attempt in-browser TextDetector OCR when available');
assert(permPolicy.value.includes('camera=(self)'), 'Permissions-Policy must allow camera=(self) for in-app camera scan');
assert(css.includes('.camera-preview'), 'styles.css must style the camera preview card');
const swCacheRule = vercel.headers?.find((rule) => rule.source === '/sw.js');
assert(swCacheRule, 'vercel.json must include a /sw.js header rule');
assert(swCacheRule.headers.some((h) => h.key === 'Cache-Control' && h.value.includes('max-age=0')), '/sw.js must be served with max-age=0 so updates land immediately');

console.log('Smoke checks passed');
