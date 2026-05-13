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
assert(html.includes('data-action="toggleLayoutLock"'), 'toolbar must include layout lock action');
assert(app.includes('layout_lock'), 'app.js must track layout lock state');
assert(css.includes('.preview-frame.layout-locked'), 'styles.css must include layout lock styles');

console.log('Smoke checks passed');
