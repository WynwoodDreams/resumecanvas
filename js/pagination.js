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

  // Measure each top-level child while still in the live frame. Use the
  // distance between consecutive siblings' rendered tops rather than
  // offsetHeight + both margins: adjacent vertical margins collapse, so
  // summing them overestimates total height and breaks pages too early.
  const children = Array.from(firstFrame.children);
  const measured = children.map((node, i) => {
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
  ]);
  function isHeaderish(item) {
    if (!item || !item.node || !item.node.classList) return false;
    for (const cls of KEEP_WITH_NEXT) {
      if (item.node.classList.contains(cls)) return true;
    }
    return false;
  }

  // An item opening a page contributes its top margin too (see `mt` above).
  const itemH = (item, firstOnPage) => item.h + (firstOnPage ? item.mt : 0);

  const pages = [[]];
  let pageH = 0;
  for (const item of measured) {
    let cur = pages[pages.length - 1];
    if (pageH + itemH(item, cur.length === 0) > pageContentH && cur.length > 0) {
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
      pageH = orphans.reduce((s, o, idx) => s + itemH(o, idx === 0), 0);
    }
    pageH += itemH(item, cur.length === 0);
    cur.push(item);
  }

  wrap.innerHTML = "";
  pages.forEach((page, i) => {
    if (i > 0) {
      const label = document.createElement("div");
      label.className = "page-label";
      label.innerHTML = `<span>▸ PAGE ${i + 1}</span>`;
      wrap.appendChild(label);
    }
    const frame = document.createElement("div");
    frame.className = frameClass;
    page.forEach(item => frame.appendChild(item.node));
    wrap.appendChild(frame);
  });
  return pages.length;
}
