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
assert(!/onclick=|\sstyle=|\.style\b|unsafe-inline/i.test(app), 'app.js must avoid inline handlers/styles and unsafe-inline CSP dependencies');

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
assert(app.includes('LIBRARY_KEY') && app.includes('resumecanvas:v2:library'), 'app.js must persist the resume library under resumecanvas:v2:library');
assert(app.includes('function switchToResume'), 'app.js must implement switchToResume');
assert(app.includes('function createNewResume'), 'app.js must implement createNewResume');
assert(app.includes('function duplicateResume'), 'app.js must implement duplicateResume');
assert(app.includes('function deleteResume'), 'app.js must implement deleteResume');
assert(css.includes('.lib-row'), 'styles.css must style library rows');
const swCacheRule = vercel.headers?.find((rule) => rule.source === '/sw.js');
assert(swCacheRule, 'vercel.json must include a /sw.js header rule');
assert(swCacheRule.headers.some((h) => h.key === 'Cache-Control' && h.value.includes('max-age=0')), '/sw.js must be served with max-age=0 so updates land immediately');

console.log('Smoke checks passed');
