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
// The app ships as classic scripts sharing one global scope: app.js plus the
// js/ modules. Assertions on "the app" apply to the combined source.
const APP_FILES = ['js/library.js', 'js/pagination.js', 'js/export.js', 'js/voice.js', 'app.js'];
const app = APP_FILES.map(read).join('\n');
for (const file of APP_FILES) {
  assert(html.includes(`<script src="./${file}" defer></script>`), `index.html must load deferred ${file}`);
}
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

// Android / TWA packaging
for (const png of ['icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png']) {
  assert(fs.existsSync(path.join(root, png)), `${png} must exist (Play Store requires PNG icons)`);
  assert(read('manifest.webmanifest').includes(png), `manifest must reference ${png}`);
  assert(read('sw.js').includes(png), `service worker must precache ${png}`);
}
const assetlinks = JSON.parse(read('.well-known/assetlinks.json'));
assert(assetlinks[0].target.package_name === 'com.wynwooddreams.resumecanvas', 'assetlinks.json must declare the Android package');
const twa = JSON.parse(read('twa-manifest.json'));
assert(twa.packageId === assetlinks[0].target.package_name, 'twa-manifest packageId must match assetlinks');
assert(twa.host === 'resumecanvas-seven.vercel.app', 'twa-manifest must point at the production host');

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
for (const file of APP_FILES) {
  assert(sw.includes(`./${file}`), `service worker must precache ${file}`);
}

// Library backup/restore (data safety: localStorage is best-effort only)
assert(app.includes('function exportLibraryBackup') && app.includes('function applyLibraryBackup'), 'library must implement backup export + restore');
assert(html.includes('data-action="backupLibrary"') && html.includes('id="library-restore-file"'), 'library modal must expose backup + restore controls');

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

// Resume parser module (phase A: extracted to vendor/resume-parse.js)
assert(fs.existsSync(path.join(root, 'vendor/resume-parse.js')), 'vendor/resume-parse.js must exist');
assert(html.includes('./vendor/resume-parse.js'), 'index.html must load the resume parser before app.js');
assert(sw.includes('./vendor/resume-parse.js'), 'service worker must precache the resume parser');
assert(app.includes('RcParse.parseResumeText'), 'app.js must call the extracted RcParse.parseResumeText');
assert(!/function parseResumeText/.test(app), 'app.js must not redefine the parser inline');

const RcParse = require('../vendor/resume-parse.js');
assert(typeof RcParse.parseResumeText === 'function', 'RcParse must export parseResumeText');

const sample = [
  'Jane Doe',
  'jane@example.com | (555) 123-4567 | Austin, TX',
  '',
  'SUMMARY',
  'Seasoned engineer with a focus on web apps.',
  '',
  'EXPERIENCE',
  'Senior Engineer — Acme Inc',
  'Jan 2020 - Present',
  '• Built the thing',
  '• Shipped the other thing',
  '',
  'SKILLS',
  'JavaScript, CSS, HTML',
  '',
  'AWARDS',
  '• Employee of the Year 2021',
  '',
  'VOLUNTEER EXPERIENCE',
  'Mentored students at a local coding bootcamp',
].join('\n');

const parsed = RcParse.parseResumeText(sample);
assert(parsed.header.name === 'Jane Doe', 'parser must read the name from the header');
assert(parsed.header.email === 'jane@example.com', 'parser must read the email from the header');
assert(/Seasoned engineer/.test(parsed.summary), 'parser must capture the summary text');
assert(parsed.skills.includes('JavaScript') && parsed.skills.includes('CSS'), 'parser must split skills');
assert(parsed.experience.length === 1 && parsed.experience[0].bullets.length === 2, 'parser must capture experience bullets');

// Unknown sections must be quarantined into `other`, not bleed into prior sections.
assert(Array.isArray(parsed.other), 'parser must return an `other` array for unmodeled sections');
const titles = parsed.other.map((o) => o.title.toLowerCase());
assert(titles.some((t) => /awards/.test(t)), 'AWARDS must be quarantined into `other`');
assert(titles.some((t) => /volunteer/.test(t)), 'VOLUNTEER EXPERIENCE must be quarantined into `other`');
assert(!parsed.skills.some((s) => /employee of the year/i.test(s)), 'awards content must not pollute skills');

// Messy real-world resume robustness (bullet-less, inline headings, loose dates).
// Weak resumes — the ones this tool exists to rescue — rarely use bullet glyphs,
// often collapse headings onto the content line, and write dates inconsistently.
const messy = [
  'JANE DOE',
  'jane.doe@gmail.com  •  (305) 555-1234  •  Miami, FL',
  '',
  'OBJECTIVE',
  'Hardworking individual seeking opportunity.',
  '',
  'EXPERIENCE',
  'Cashier, Walmart, Miami FL  2019-2021',
  'Handled register',
  'Helped customers',
  'Server  Olive Garden  2021 to present',
  'Took orders',
  '',
  'SKILLS: Microsoft Word, Excel, Customer Service, Teamwork',
  '',
  'EDUCATION',
  'Miami Dade College',
  'Associate in Arts, expected 2025',
].join('\n');
const m = RcParse.parseResumeText(messy);

// Inline "SKILLS: a, b, c" heading must be recognized and split into items.
assert(m.skills.length === 4 && m.skills.includes('Microsoft Word') && m.skills.includes('Teamwork'),
  'inline "SKILLS:" heading must be parsed into individual skills');
assert(!m.experience.some((e) => /microsoft word/i.test(e.title)),
  'inline skills line must not leak into experience as a fake job');

// Bullet-less, run-together experience must split into one entry per job, with
// the undated duty lines captured as bullets (not swallowed into the title).
assert(m.experience.length === 2, 'bullet-less experience must split into two jobs');
assert(/Cashier/.test(m.experience[0].title) && m.experience[0].date === '2019-2021',
  'first job title/date must be separated cleanly');
assert(m.experience[0].location === 'Miami FL',
  'a "City ST" location without a comma must still be detected');
assert(m.experience[0].bullets.join(' ') === 'Handled register Helped customers',
  'undated duty lines must become the first job\'s bullets');
assert(/Server/.test(m.experience[1].title) && m.experience[1].bullets.length === 1,
  'second job must own its own title and duty');

// Education: a degree line that also carries the date must yield both, not one.
assert(m.education.length === 1, 'education must produce a single entry');
assert(m.education[0].degree === 'Associate in Arts', 'degree must be isolated from its date');
assert(m.education[0].date === 'expected 2025', 'a date on the degree line must be split out intact');
assert(m.education[0].school === 'Miami Dade College', 'school must be identified separately');

// A clean multi-line header (no bullets, single date) must stay ONE entry — the
// new splitter must not over-segment well-formed resumes.
const clean = RcParse.parseResumeText([
  'EXPERIENCE',
  'Software Engineer',
  'Acme Corporation',
  '2020 - 2023',
].join('\n'));
assert(clean.experience.length === 1, 'a single dated multi-line header must not be over-split');
assert(/Software Engineer/.test(clean.experience[0].title), 'multi-line header title must survive');

// A single entry described in plain prose (no bullets, no date) must keep its
// description lines as bullets rather than dropping them.
const prose = RcParse.parseResumeText([
  'PROJECTS',
  'Budget Tracker App',
  'Built a React app to track expenses',
  'Used Firebase for storage',
].join('\n'));
assert(prose.projects.length === 1, 'a single prose project must be one entry');
assert(prose.projects[0].title === 'Budget Tracker App', 'prose project title must be the first line');
assert(prose.projects[0].bullets.length === 2, 'prose project description lines must be kept as bullets');

// A state code that is really a non-location two-capital token must NOT match.
assert(!RcParse.LOCATION_RE.test('Microsoft IT Support'), 'two capitals that are not a state must not read as a location');

// Import review UI (phase B: trustworthy confirm modal)
assert(app.includes('data-import-field'), 'import modal must render inline-editable contact fields');
assert(app.includes('ir-details') && app.includes('ir-detail-body'), 'import modal must render expandable section previews');
assert(app.includes('OTHER SECTIONS WE FOUND'), 'import modal must surface the unmodeled "other" sections group');
assert(/\[data-import-field\]/.test(app), 'applyImport must read edited contact/summary field values');
assert(css.includes('.ir-input') && css.includes('.ir-details'), 'styles.css must style editable import fields + previews');
assert(css.includes('.import-other'), 'styles.css must style the "other sections" group');

// Routing of unmodeled sections (phase C)
assert(typeof RcParse.suggestDestination === 'function', 'RcParse must export suggestDestination');
assert(RcParse.suggestDestination('Volunteer Experience') === 'experience', 'volunteer should default to experience');
assert(RcParse.suggestDestination('Languages') === 'skills', 'languages should default to skills');
assert(RcParse.suggestDestination('Awards & Honors') === 'certifications', 'awards should default to certifications');
assert(RcParse.suggestDestination('Publications') === 'projects', 'publications should default to projects');
assert(RcParse.suggestDestination('Hobbies') === 'skip', 'unrecognized sections should default to skip');
assert(typeof RcParse.parseSkills === 'function' && typeof RcParse.parseEntryBlocks === 'function', 'RcParse must expose parseSkills + parseEntryBlocks for routing');
assert(app.includes('data-other-idx'), 'import modal must render a destination dropdown per other-section');
assert(app.includes('select[data-other-idx]'), 'applyImport must read the routing dropdowns');
assert(css.includes('.ir-route'), 'styles.css must style the routing dropdown');

console.log('Smoke checks passed');
