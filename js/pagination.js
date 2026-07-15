// ResumeCanvas — preview pagination (splits one overflowing frame into pages)
// Classic script sharing the global scope with app.js (same pattern as
// vendor/): declarations only at load time; call sites live in app.js.

// Measures the first .preview-frame inside #preview and, if its content
// would overflow one page, splits its children into stacked frames.
// Returns the resulting page count.
function paginatePreview(frameClass) {
  const wrap = $("#preview");
  const firstFrame = wrap.firstElementChild;
  if (!firstFrame) return 0;

  // On mobile the preview wrapper carries a CSS zoom (updatePreviewScale).
  // Under zoom, getBoundingClientRect() reports scaled values while
  // clientHeight stays in layout px — mixing them packs ~1/zoom too much
  // content per page. Neutralize the zoom for the measurement pass and
  // restore it after; engines disagree on which metrics zoom affects, so
  // measuring unzoomed is the only portable option.
  const scaler = wrap.closest(".preview-wrap");
  const prevZoom = scaler ? scaler.style.zoom : "";
  if (scaler) scaler.style.zoom = "";
  try {
    return paginatePreviewUnscaled(wrap, firstFrame, frameClass);
  } finally {
    if (scaler) scaler.style.zoom = prevZoom;
  }
}

// Classes that introduce an entry (title row, italic location, demo_2's
// proj/exp/edu sub-headers). Anything in this set should never be the LAST
// item on a page — it should travel forward with the content it's heading.
const KEEP_WITH_NEXT = new Set([
  "resume-section-h",
  "entry-title-row",
  "entry-loc",
  "edu-row",
  "edu-degree-row",
  "edu-subline",
  "edu-coursework",
  "proj-title",
  "exp-company",
  "hl-company",
  "hl-title",
]);

function isHeaderish(item) {
  if (!item || !item.node || !item.node.classList) return false;
  for (const cls of KEEP_WITH_NEXT) {
    if (item.node.classList.contains(cls)) return true;
  }
  return false;
}

// Measure each child of a live container. Use the distance between
// consecutive siblings' rendered tops rather than offsetHeight + both
// margins: adjacent vertical margins collapse, so summing them
// overestimates total height and breaks pages too early.
function measureFlowChildren(container) {
  const children = Array.from(container.children);
  return children.map((node, i) => {
    const rect = node.getBoundingClientRect();
    const next = children[i + 1];
    const cs = getComputedStyle(node);
    const h = next
      ? next.getBoundingClientRect().top - rect.top
      : rect.height + (parseFloat(cs.marginBottom) || 0);
    // marginTop is needed separately: the top-to-top delta charges the gap
    // *above* an item to its predecessor, so an item that ends up first on a
    // later page re-introduces its own top margin uncounted.
    return { node, h, mt: parseFloat(cs.marginTop) || 0 };
  });
}

// An item opening a page contributes its top margin too (see `mt` above).
function flowItemH(item, firstOnPage) { return item.h + (firstOnPage ? item.mt : 0); }

// Split measured items into page-sized buckets. The first page may have a
// different capacity (e.g. the sidebar layout's page 1 also carries the
// name/title head above the columns).
function chunkFlow(measured, firstPageH, pageH) {
  const pages = [[]];
  let cap = firstPageH;
  let used = 0;
  for (const item of measured) {
    let cur = pages[pages.length - 1];
    if (used + flowItemH(item, cur.length === 0) > cap && cur.length > 0) {
      // Walk the tail of the page and pull any "header-ish" rows forward so
      // an entry's title/loc never sit alone with whitespace below them.
      // Stop before emptying the page — if everything popped, the previous
      // page is degenerate but at least keeps one item to avoid blank pages.
      const orphans = [];
      while (cur.length > 1 && isHeaderish(cur[cur.length - 1])) {
        orphans.unshift(cur.pop());
      }
      pages.push(orphans);
      cur = orphans;
      cap = pageH;
      used = orphans.reduce((s, o, idx) => s + flowItemH(o, idx === 0), 0);
    }
    used += flowItemH(item, cur.length === 0);
    cur.push(item);
  }
  return pages;
}

function appendPageLabel(wrap, pageNo) {
  const label = document.createElement("div");
  label.className = "page-label";
  label.innerHTML = `<span>▸ PAGE ${pageNo}</span>`;
  wrap.appendChild(label);
}

function paginatePreviewUnscaled(wrap, firstFrame, frameClass) {
  // Page content area: aspect-ratio gives us paper-shaped frame height;
  // subtract the frame's actual vertical padding (it varies by breakpoint,
  // so it must be read from computed style, not hardcoded).
  const paperH = firstFrame.clientHeight;
  const frameCS = getComputedStyle(firstFrame);
  const pageContentH = paperH
    - (parseFloat(frameCS.paddingTop) || 0)
    - (parseFloat(frameCS.paddingBottom) || 0);
  // Guard against pre-layout race (clientHeight 0) — leave as one page.
  if (paperH <= 0 || pageContentH <= 0) return 1;
  if (firstFrame.scrollHeight <= paperH + 1) return 1; // fits on one page

  // The sidebar layout renders its two columns as one <table>, which can't be
  // split as a single child — paginate each column's flow instead.
  const grid = firstFrame.querySelector("table.sidebar-grid");
  if (grid) return paginateSidebarUnscaled(wrap, firstFrame, frameClass, grid, pageContentH);

  const measured = measureFlowChildren(firstFrame);
  const pages = chunkFlow(measured, pageContentH, pageContentH);

  wrap.innerHTML = "";
  pages.forEach((page, i) => {
    if (i > 0) appendPageLabel(wrap, i + 1);
    const frame = document.createElement("div");
    frame.className = frameClass;
    page.forEach(item => frame.appendChild(item.node));
    wrap.appendChild(frame);
  });
  return pages.length;
}

// Sidebar (demo_6) pagination: the head (name/title) stays on page 1, then
// the side and main columns flow independently across pages, emitting one
// two-column table per page so the layout and divider repeat on every page.
function paginateSidebarUnscaled(wrap, firstFrame, frameClass, grid, pageContentH) {
  const head = [];
  for (const child of Array.from(firstFrame.children)) {
    if (child === grid) break;
    head.push(child);
  }
  const frameCS = getComputedStyle(firstFrame);
  const contentTop = firstFrame.getBoundingClientRect().top + (parseFloat(frameCS.paddingTop) || 0);
  const headH = grid.getBoundingClientRect().top - contentTop;
  let firstPageH = pageContentH - headH;
  if (firstPageH <= 0) firstPageH = pageContentH; // degenerate: head taller than a page

  const side = grid.querySelector(".col-side");
  const main = grid.querySelector(".col-main");
  const sidePages = side ? chunkFlow(measureFlowChildren(side), firstPageH, pageContentH) : [[]];
  const mainPages = main ? chunkFlow(measureFlowChildren(main), firstPageH, pageContentH) : [[]];
  const pageCount = Math.max(sidePages.length, mainPages.length);

  wrap.innerHTML = "";
  for (let i = 0; i < pageCount; i++) {
    if (i > 0) appendPageLabel(wrap, i + 1);
    const frame = document.createElement("div");
    frame.className = frameClass;
    if (i === 0) head.forEach(node => frame.appendChild(node));
    const table = document.createElement("table");
    table.className = "sidebar-grid";
    const tbody = document.createElement("tbody");
    const tr = document.createElement("tr");
    const tdSide = document.createElement("td");
    tdSide.className = "col-side";
    (sidePages[i] || []).forEach(item => tdSide.appendChild(item.node));
    const tdMain = document.createElement("td");
    tdMain.className = "col-main";
    (mainPages[i] || []).forEach(item => tdMain.appendChild(item.node));
    tr.appendChild(tdSide);
    tr.appendChild(tdMain);
    tbody.appendChild(tr);
    table.appendChild(tbody);
    frame.appendChild(table);
    wrap.appendChild(frame);
  }
  return pageCount;
}
