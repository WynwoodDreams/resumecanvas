// ResumeCanvas — content quality checks.
// Cheap, local, deterministic nudges that run on every preview render and
// surface above the preview: weak bullets, over-long summaries, missing or
// inconsistent dates. Each finding can focus the offending field. Nothing
// here rewrites the user's text.
//
// Classic script sharing the page's global scope with app.js.

const QC_SUMMARY_MAX_WORDS = 60;
const QC_BULLET_MAX_WORDS = 30;

// Common resume action verbs (base form). Words ending in "ed" are also
// accepted as past-tense verbs so the list stays short.
const QC_VERBS = new Set(("achieve administer advise analyze assemble assess assist audit author automate budget build calculate " +
  "chair coach collaborate communicate compile complete conduct consolidate construct consult coordinate counsel create cut " +
  "debug decrease define deliver design develop devise diagnose direct document draft drive edit eliminate engineer enhance " +
  "establish evaluate execute expand facilitate forecast formulate found generate grow guide handle hire identify implement " +
  "improve increase influence initiate inspect install instruct integrate interpret interview introduce investigate launch lead " +
  "maintain manage market measure mentor migrate model monitor motivate negotiate operate optimize organize overhaul oversee " +
  "partner perform pioneer plan prepare present process produce program promote propose prototype provide publish raise " +
  "recommend reconcile record recruit redesign reduce refine report research resolve restructure review revise schedule secure " +
  "serve ship simplify solve spearhead standardize streamline strengthen supervise support teach test track train transform " +
  "translate troubleshoot tutor update upgrade validate volunteer win write " +
  // irregular past tenses that the "-ed" rule misses
  "built led wrote drove grew taught sold won ran made took oversaw brought began held kept set cut found met").split(/\s+/));

function qcFirstWord(text) {
  return String(text || "").trim().replace(/^[•\-*–—]\s*/, "").split(/\s+/)[0] || "";
}

function qcStartsWithVerb(text) {
  const w = qcFirstWord(text).toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return true; // empty bullets are handled elsewhere
  if (QC_VERBS.has(w)) return true;
  if (w.endsWith("ed") && w.length > 4) return true;
  if (w.endsWith("s") && QC_VERBS.has(w.slice(0, -1))) return true; // "leads", "builds"
  return false;
}

function qcWordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function qcHasNumber(text) {
  return /\d|%|\$/.test(String(text || ""));
}

// Classify a date string's style so we can spot a resume mixing "Jan 2020",
// "01/2020" and "2020". Returns null when there is no recognisable date.
function qcDateStyle(text) {
  const s = String(text || "").trim();
  if (!s) return null;
  if (/[A-Za-z]{3,9}\.?\s+\d{4}/.test(s)) return "month-year";
  if (/\b\d{1,2}\/\d{4}\b/.test(s)) return "numeric";
  if (/\b\d{4}\b/.test(s)) return "year";
  return null;
}

// Build the findings list for the current state. Each finding:
// { level: "warn"|"info", text, focus: CSS selector or null, panel: section }
function computeQualityChecks(st) {
  const out = [];
  if (typeof hasUserData === "function" && !hasUserData()) return out; // never nag on the sample
  const enabled = st.section_enabled || {};

  // Summary length.
  if (enabled.summary !== false) {
    const n = qcWordCount(st.summary);
    if (n > QC_SUMMARY_MAX_WORDS) {
      out.push({ level: "warn", text: `Summary is ${n} words — aim for under ${QC_SUMMARY_MAX_WORDS}.`, focus: "#summary", panel: "summary" });
    }
  }

  // Bullets: verbs, numbers, length.
  const bullets = [];
  if (enabled.experience !== false) {
    (st.experience || []).forEach((e, i) => (e.bullets || []).forEach((b, bi) => {
      if (b && b.trim()) bullets.push({ text: b, sel: `textarea[data-exp-bullet="${i}"][data-bullet-i="${bi}"]`, panel: "experience", owner: e.title || `job ${i + 1}` });
    }));
  }
  if (enabled.projects !== false) {
    (st.projects || []).forEach((p, i) => (p.bullets || []).forEach((b, bi) => {
      if (b && b.trim()) bullets.push({ text: b, sel: `textarea[data-proj-bullet="${i}"][data-bullet-i="${bi}"]`, panel: "projects", owner: p.title || `project ${i + 1}` });
    }));
  }
  const weak = bullets.filter((b) => !qcStartsWithVerb(b.text));
  weak.slice(0, 3).forEach((b) => {
    out.push({ level: "warn", text: `Start with an action verb: "${qcFirstWord(b.text)}…" (${b.owner})`, focus: b.sel, panel: b.panel });
  });
  if (weak.length > 3) out.push({ level: "info", text: `${weak.length - 3} more bullet${weak.length - 3 === 1 ? "" : "s"} don't start with a verb.`, focus: weak[3].sel, panel: weak[3].panel });

  const long = bullets.filter((b) => qcWordCount(b.text) > QC_BULLET_MAX_WORDS);
  long.slice(0, 2).forEach((b) => {
    out.push({ level: "info", text: `Bullet is ${qcWordCount(b.text)} words — trim to one or two lines (${b.owner}).`, focus: b.sel, panel: b.panel });
  });

  if (bullets.length >= 3) {
    const withNum = bullets.filter((b) => qcHasNumber(b.text)).length;
    if (withNum / bullets.length < 0.34) {
      const first = bullets.find((b) => !qcHasNumber(b.text));
      out.push({ level: "info", text: `Only ${withNum} of ${bullets.length} bullets include a number — add results (%, $, counts, time saved).`, focus: first ? first.sel : null, panel: first ? first.panel : "experience" });
    }
  }

  // Dates: missing and inconsistent.
  const styles = new Set();
  if (enabled.experience !== false) {
    (st.experience || []).forEach((e, i) => {
      if (!e.title && !(e.bullets || []).some(Boolean)) return;
      if (!String(e.date || "").trim()) {
        out.push({ level: "warn", text: `Missing dates for ${e.title || `job ${i + 1}`}.`, focus: `input[data-exp="${i}"][data-field="date"]`, panel: "experience" });
      } else { const s = qcDateStyle(e.date); if (s) styles.add(s); }
    });
  }
  (st.education || []).forEach((e, i) => {
    if (!e.school && !e.degree) return;
    if (!String(e.date || "").trim()) {
      out.push({ level: "info", text: `No graduation date for ${e.school || `education ${i + 1}`}.`, focus: `input[data-edu="${i}"][data-field="date"]`, panel: "education" });
    } else { const s = qcDateStyle(e.date); if (s) styles.add(s); }
  });
  if (styles.size > 1) {
    out.push({ level: "info", text: "Dates use mixed formats — pick one style (e.g. \"Jan 2024\") everywhere.", focus: null, panel: "experience" });
  }

  return out;
}

function renderQualityPanel() {
  const panel = document.getElementById("quality-panel");
  if (!panel) return;
  const findings = computeQualityChecks(state);
  if (!findings.length) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }
  const warns = findings.filter((f) => f.level === "warn").length;
  const head = `<div class="qp-head"><span class="qp-title">${warns ? "✦ " : "✓ "}${findings.length} suggestion${findings.length === 1 ? "" : "s"}</span><button class="icon-btn qp-toggle" type="button" data-action="toggleQuality" aria-expanded="true">HIDE</button></div>`;
  const items = findings.map((f, i) =>
    `<button class="qp-item ${f.level}" type="button" data-action="qualityFocus" data-qc="${i}"${f.focus ? "" : " disabled"}>${esc(f.text)}</button>`
  ).join("");
  panel.innerHTML = head + `<div class="qp-list">${items}</div>`;
  panel.classList.remove("hidden");
  panel._findings = findings;
}

// Open the owning form panel and focus the field a finding points at.
function qualityFocus(el) {
  const panel = document.getElementById("quality-panel");
  const f = panel && panel._findings && panel._findings[+el.dataset.qc];
  if (!f || !f.focus) return;
  const section = document.querySelector(`.panel[data-section="${f.panel}"]`);
  if (section) section.classList.add("open");
  const target = document.querySelector(f.focus);
  if (target) {
    target.scrollIntoView({ block: "center", behavior: "smooth" });
    target.focus({ preventScroll: true });
  }
}

function toggleQualityPanel(btn) {
  const panel = document.getElementById("quality-panel");
  if (!panel) return;
  const collapsed = panel.classList.toggle("collapsed");
  btn.textContent = collapsed ? "SHOW" : "HIDE";
  btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
}
