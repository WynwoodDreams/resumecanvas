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
    const h = next
      ? next.getBoundingClientRect().top - rect.top
      : rect.height + (parseFloat(getComputedStyle(node).marginBottom) || 0);
    return { node, h };
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

  const pages = [[]];
  let pageH = 0;
  for (const item of measured) {
    const nextH = pageH + item.h;
    if (nextH > pageContentH && pages[pages.length - 1].length > 0) {
      const last = pages[pages.length - 1];
      // Walk the tail of the page and pull any "header-ish" rows forward so
      // an entry's title/loc never sit alone with whitespace below them.
      // Stop before emptying the page — if everything popped, the previous
      // page is degenerate but at least keeps one item to avoid blank pages.
      const orphans = [];
      while (last.length > 1 && isHeaderish(last[last.length - 1])) {
        orphans.unshift(last.pop());
      }
      pages.push(orphans);
      pageH = orphans.reduce((s, o) => s + o.h, 0);
    }
    pages[pages.length - 1].push(item);
    pageH += item.h;
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
