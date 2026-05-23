// ─────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────

let state = {
  template: "demo_4",
  font_pt: null, // null = use template default (12pt for D4, 11pt for D2). Manual override via font chips.
  font_family: "times", // global typeface: times | arial | calibri
  voice_profile: "", // session-only spoken intro used to flavor the resume's tone; never persisted
  section_enabled: { summary: true, projects: true, experience: true },
  section_order: {
    demo_4: ["education", "skills", "projects", "experience"],
    demo_2: ["skills", "education", "certs", "projects", "experience"],
    demo_1: ["skills", "education", "projects", "experience"],
    demo_5: ["skills", "education", "projects", "experience"],
    demo_6: ["skills", "education", "experience"],
    demo_8: ["skills", "experience", "education"],
  },
  match: { on: false, jd: "" },
  // Demo 4 header
  name: "Jane Doe",
  professional_title: "Business Administration Student",
  location: "North Miami, FL 33161",
  phone: "786-121-1112",
  email: "lurlene.carry001@mymdc.net",
  linkedin: "Linkedin.com/",
  links: [],
  // Demo 2 header
  contact_line1: "Miami, FL | (305) 555-1234",
  contact_line2: "JohnDoe123@gmail.com | LinkedIn.com/in/johndoe",
  // Both
  summary: "Business Administration student at Miami Dade College with hands-on experience in administrative operations, sales, and team coordination. Seeking internship opportunities in project management, human resources, marketing, logistics, or general management.",
  education: [
    {
      school: "Miami Dade College",
      city: "Miami, FL",
      degree: "Associate in Arts, Business | GPA: 3.5",
      date: "Expected: May 2027",
      // Demo 2 extras
      subline_bold: "",
      subline_rest: "",
      coursework: "",
      // Demo 8 extra
      certifications: "",
    },
  ],
  // Demo 4 skills
  skills_categories: [
    { label: "Technical", content: "Google Sheets, Microsoft Word, Microsoft Excel, Canva, Procreate, PDF Formatting Tools, Social Media Management, Google Workspace" },
    { label: "Administrative", content: "Data Entry, Records Management, Scheduling & Calendar Management, Document Preparation, Front Desk Operations, Event Coordination" },
    { label: "Professional", content: "Customer Service, Team Communication, Outreach & Relationship Building, Content Research, Vendor & Client Coordination" },
    { label: "Language", content: "English (Fluent), Haitian Creole (Intermediate)" },
  ],
  // Demo 2 skills
  skills_two_column: [
    { left: "Customer Service", right: "Time Management" },
    { left: "Microsoft Office Suite", right: "Team Collaboration" },
    { left: "Data Entry", right: "Problem Solving" },
    { left: "Social Media Management", right: "Event Coordination" },
    { left: "Bilingual: English & Haitian Creole", right: "Adaptable" },
  ],
  // Demo 5 skills (single pipe-separated line)
  skills_inline: "Customer Service │ Microsoft Office Suite │ Data Entry │ Social Media Management │ Time Management │ Team Collaboration │ Problem Solving │ Event Coordination │ Bilingual: English & Haitian Creole │ Adaptable",
  certifications: [
    "Google Digital Marketing & E-commerce Certificate (In Progress) — Coursera",
    "Microsoft Office Specialist: Excel Associate — Certiport (2024)",
  ],
  // Both
  projects: [
    {
      title: "Shark Cast — Co-Host & Outreach Team Lead",
      date: "November 2025 – Present",
      location: "Miami, FL",
      bullets: [
        "Co-host and produce podcast episodes covering business, marketing, and entrepreneurship topics",
        "Lead outreach strategy by coordinating a small team, assigning weekly tasks, and managing guest communications",
        "Research and develop engaging content to grow listener base and foster community engagement",
        "Build partnerships with community members and organizations by scheduling appearances aligned with podcast themes",
      ],
    },
  ],
  experience: [
    {
      title: "North Miami Senior High School — Office Staff",
      date: "August 2023 – July 2024",
      location: "North Miami, FL",
      company_city: "",
      bullets: [
        "Provided administrative support including filing, data entry, and document preparation for school staff",
        "Managed front desk operations, greeting visitors and directing inquiries to appropriate personnel",
        "Coordinated communication between students, parents, and faculty regarding school events and schedules",
        "Assisted with organizing school events and maintaining accurate student records",
      ],
    },
    {
      title: "Star Event Planning Company — Sales Lead",
      date: "August 2022 – April 2023",
      location: "Miami, FL",
      company_city: "",
      bullets: [
        "Led sales initiatives and client acquisition, consistently meeting and exceeding monthly targets",
        "Managed client relationships from initial consultation through event execution, ensuring high satisfaction",
        "Coordinated with event planning team to deliver customized solutions tailored to client needs and budgets",
      ],
    },
  ],
};

// Snapshot of the default state so RESET can restore it byte-for-byte
// even after the user has mutated `state` in place.
const _DEFAULT_STATE_JSON = JSON.stringify(state);

// ─────────────────────────────────────────────────────────
// TEMPLATE CONFIG
// Per-template rendering choices. demo_4 keeps its own structured header
// path; demo_2/demo_1/demo_5 share the free-form contact-line header but
// diverge in skills layout, education layout, project layout, section
// header casing, and type sizing.
// ─────────────────────────────────────────────────────────

const TEMPLATES = {
  demo_4: {
    layout: "single", header: "structured", headerCase: "plain", skillsMode: "categories", eduMode: "demo4",
    projMode: "dated", expMode: "italic", certs: false,
    namePt: 20, sectionPt: 12, bodyPt: 12,
    name: "Single column · Categorical", desc: "12pt body, skills as labeled categories (Technical, Administrative, etc). Best for students with broad skill profiles.",
    labels: { summary: "PROFILE SUMMARY", skills: "SKILLS", education: "EDUCATION", projects: "PROJECTS", experience: "WORK EXPERIENCE", certs: "CERTIFICATIONS" },
  },
  demo_2: {
    layout: "single", header: "lines", headerCase: "smallcaps", skillsMode: "two_column", eduMode: "demo2",
    projMode: "bullets", expMode: "company", certs: true,
    namePt: 16, sectionPt: 11, bodyPt: 11,
    name: "Single column · Two-col skills", desc: "11pt smallCaps headers, two-column skill grid, certifications section. Best for technical hires with more density.",
    labels: { summary: "PROFILE SUMMARY", skills: "HIGHLIGHTED SKILLS", education: "EDUCATION", projects: "PROJECTS", experience: "WORK EXPERIENCE", certs: "CERTIFICATIONS" },
  },
  demo_1: {
    layout: "single", header: "lines", headerCase: "title", skillsMode: "two_column", eduMode: "demo1",
    projMode: "paragraph", expMode: "company", certs: false,
    namePt: 18, sectionPt: 12, bodyPt: 11,
    name: "Single column · Highlighted skills", desc: "Title-case headers, two-column bulleted skills, coursework lists, paragraph-style projects. Best for AI / data students.",
    labels: { summary: "Profile Summary", skills: "Highlighted Skills", education: "Education", projects: "Projects", experience: "Work Experience", certs: "Certifications" },
  },
  demo_5: {
    layout: "single", header: "lines", headerCase: "smallcaps", skillsMode: "pipe", eduMode: "demo5",
    projMode: "paragraph_inline", expMode: "company", certs: false,
    namePt: 16, sectionPt: 11, bodyPt: 11,
    name: "Single column · Inline skills", desc: "smallCaps headers, single pipe-separated skills line, degree-first education, \"Title: description\" projects. Best for cybersecurity / IT.",
    labels: { summary: "SUMMARY", skills: "SKILLS", education: "EDUCATION", projects: "PROJECTS", experience: "WORK EXPERIENCE", certs: "CERTIFICATIONS" },
  },
  demo_6: {
    layout: "sidebar", header: "structured", headerCase: "smallcaps", skillsMode: "list", eduMode: "demo6",
    projMode: "none", expMode: "company_first", certs: false,
    namePt: 22, sectionPt: 11, bodyPt: 10,
    name: "Two column · Sidebar", desc: "Left sidebar (contact, education, key skills) beside a main column (about me, career highlights). Best for a modern, design-forward look.",
    labels: { summary: "ABOUT ME", skills: "KEY SKILLS", education: "EDUCATION", experience: "CAREER HIGHLIGHTS", contact: "CONTACT", certs: "CERTIFICATIONS" },
  },
  demo_8: {
    layout: "single", header: "lines", headerCase: "smallcaps", skillsMode: "categories", eduMode: "demo8",
    projMode: "none", expMode: "company", certs: false,
    namePt: 17, sectionPt: 11, bodyPt: 11,
    name: "Single column · Marketing", desc: "Single contact line, PROFILE summary, categorized skills & tools, dated experience, education with coursework + certifications. Best for marketing / business.",
    labels: { summary: "PROFILE", skills: "SKILLS & TOOLS", education: "EDUCATION", projects: "PROJECTS", experience: "EXPERIENCE", certs: "CERTIFICATIONS" },
  },
};

const TEMPLATE_ORDER = ["demo_1", "demo_2", "demo_4", "demo_5", "demo_6", "demo_8"];

// Global typeface choice. `css` is the font stack used in the preview + .doc
// export; `pdf` is the base-14 family the PDF writer maps Times-* names onto
// (Calibri isn't a base-14 font, so it renders as Helvetica in the PDF).
const FONT_FAMILIES = {
  times:   { label: "Times New Roman", css: '"Times New Roman", Times, serif', pdf: "Times" },
  arial:   { label: "Arial", css: 'Arial, "Helvetica Neue", Helvetica, sans-serif', pdf: "Helvetica" },
  calibri: { label: "Calibri", css: 'Calibri, "Segoe UI", "Helvetica Neue", Arial, sans-serif', pdf: "Helvetica" },
};
function fontFamilyKey() { return FONT_FAMILIES[state.font_family] ? state.font_family : "times"; }

function tcfg(tpl) { return TEMPLATES[tpl || state.template] || TEMPLATES.demo_4; }
function tplBodyDefault(tpl) { return tcfg(tpl).bodyPt; }

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const HTML_ENTITY_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
};

function esc(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, (ch) => HTML_ENTITY_MAP[ch]);
}

const LINKIFY_RE = /([\w.+-]+@[\w-]+\.[\w.-]+)|((?:https?:\/\/|www\.)[^\s<>"'|,;)]+)|((?:[a-z0-9-]+\.)+(?:com|net|org|io|dev|me|co|app|ai|tech|xyz|edu|gov|info|us|uk|ca)(?:\/[^\s<>"'|,;)]*)?)/gi;

function linkify(s) {
  if (s == null) return "";
  const text = String(s);
  let out = "";
  let lastIdx = 0;
  let m;
  LINKIFY_RE.lastIndex = 0;
  while ((m = LINKIFY_RE.exec(text)) !== null) {
    out += esc(text.slice(lastIdx, m.index));
    let matched = m[0];
    let trailing = "";
    const t = matched.match(/[.,;:!?)\]]+$/);
    if (t) { trailing = t[0]; matched = matched.slice(0, -trailing.length); }
    let href;
    if (m[1]) href = `mailto:${matched}`;
    else if (m[2]) href = matched.toLowerCase().startsWith("http") ? matched : `https://${matched}`;
    else href = `https://${matched}`;
    out += `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="preview-link">${esc(matched)}</a>${esc(trailing)}`;
    lastIdx = m.index + m[0].length;
  }
  out += esc(text.slice(lastIdx));
  return out;
}

function setCaseId() {
  if (!state.name) { $("#caseId").textContent = "———"; return; }
  const initials = state.name.split(/\s+/).filter(Boolean).map(s => s[0]).join("").toUpperCase().slice(0, 3);
  const tpl = state.template.replace("_", "").toUpperCase();
  $("#caseId").textContent = `${initials}-${tpl}-${new Date().getFullYear().toString().slice(2)}`;
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1500);
}

// ─────────────────────────────────────────────────────────
// AUTOSAVE + LIBRARY (phases 1, 3, 8)
// Two buckets: DRAFTS (work-in-progress, max 3) and SAVED (finished,
// max 3). SAVE moves a draft into the saved bucket. Editing a saved
// entry mutates it in place — no "make a new draft on edit" magic.
// ─────────────────────────────────────────────────────────

const LEGACY_STATE_KEY   = "resumecanvas:v1:state";   // single-resume slot
const LEGACY_LIBRARY_KEY = "resumecanvas:v2:library"; // flat list
const LIBRARY_KEY        = "resumecanvas:v3:library"; // drafts + saved

const DRAFT_LIMIT = 3;
const SAVED_LIMIT = 3;

let _persistTimer = null;
let _saveIndicatorTimer = null;
let _library = { drafts: [], saved: [], activeId: null };

function showSaveIndicator(mode) {
  const el = $("#save-indicator");
  const txt = $("#save-text");
  if (!el || !txt) return;
  clearTimeout(_saveIndicatorTimer);
  el.classList.add("show");
  if (mode === "saving") {
    el.classList.add("saving");
    txt.textContent = "SAVING…";
  } else {
    el.classList.remove("saving");
    txt.textContent = "SAVED";
    _saveIndicatorTimer = setTimeout(() => el.classList.remove("show"), 1400);
  }
}

function newResumeId() {
  return "r_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

function bucketArr(bucket) {
  return bucket === "saved" ? _library.saved : _library.drafts;
}

function findResume(id) {
  for (const bucket of ["drafts", "saved"]) {
    const arr = bucketArr(bucket);
    const idx = arr.findIndex((r) => r.id === id);
    if (idx !== -1) return { resume: arr[idx], bucket, index: idx };
  }
  return null;
}

function activeResume() {
  if (!_library.activeId) return null;
  const found = findResume(_library.activeId);
  return found ? found.resume : null;
}

function activeBucket() {
  if (!_library.activeId) return null;
  const found = findResume(_library.activeId);
  return found ? found.bucket : null;
}

function defaultResumeName() {
  return "Untitled Resume";
}

function writeLibrary() {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(_library));
  } catch (_err) {
    // Quota or disabled — fail quiet, in-memory state remains usable.
  }
}

function persistStateNow() {
  const active = activeResume();
  if (active) {
    active.state = JSON.parse(JSON.stringify(state));
    active.state.match = { on: false, jd: "" }; // never persist JD across sessions
    active.state.voice_profile = ""; // spoken intro stays in-session only — never saved
    active.updatedAt = Date.now();
  }
  writeLibrary();
  showSaveIndicator("saved");
  updateLibraryPill();
}

function schedulePersist() {
  showSaveIndicator("saving");
  clearTimeout(_persistTimer);
  _persistTimer = setTimeout(persistStateNow, 250);
}

// Replace every top-level key in `state` with the values from a fresh snapshot.
// Functions/handlers reference `state` by closure, so mutating in place keeps
// them bound to the live object instead of a stale reference.
function replaceStateWith(snapshot) {
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, JSON.parse(JSON.stringify(snapshot)));
  state.match = { on: false, jd: "" };
  ensureStateDefaults();
}

// Backfill keys that may be absent in resumes persisted before newer templates
// existed (e.g. section_order entries for demo_1/demo_5, skills_inline).
function ensureStateDefaults() {
  const defaults = JSON.parse(_DEFAULT_STATE_JSON);
  state.section_order = state.section_order || {};
  for (const tpl of Object.keys(defaults.section_order)) {
    if (!Array.isArray(state.section_order[tpl])) {
      state.section_order[tpl] = defaults.section_order[tpl].slice();
    }
  }
  if (typeof state.skills_inline !== "string") state.skills_inline = defaults.skills_inline;
  if (!FONT_FAMILIES[state.font_family]) state.font_family = defaults.font_family;
}

function loadLibrary() {
  let raw;
  try { raw = localStorage.getItem(LIBRARY_KEY); } catch (_err) { return null; }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.drafts) && Array.isArray(parsed.saved)) return parsed;
  } catch (_err) { /* fallthrough */ }
  return null;
}

function migrateLegacyLibrary() {
  let raw;
  try { raw = localStorage.getItem(LEGACY_LIBRARY_KEY); } catch (_err) { return null; }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.resumes)) return null;
    // Everything from the flat v2 list moves into drafts. Soft over-cap is
    // tolerated on migration — the per-bucket limit only blocks new additions.
    return {
      drafts: parsed.resumes,
      saved: [],
      activeId: parsed.activeId || (parsed.resumes[0] && parsed.resumes[0].id) || null,
      _migratedFromV2: true,
    };
  } catch (_err) { return null; }
}

function migrateLegacyState() {
  let raw;
  try { raw = localStorage.getItem(LEGACY_STATE_KEY); } catch (_err) { return null; }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const id = newResumeId();
    const now = Date.now();
    const resume = { id, name: parsed.name ? `${parsed.name}'s resume` : defaultResumeName(), createdAt: now, updatedAt: now, state: parsed };
    return { drafts: [resume], saved: [], activeId: id, _migratedFromLegacy: true };
  } catch (_err) { return null; }
}

function seedLibrary() {
  const id = newResumeId();
  const now = Date.now();
  const seed = JSON.parse(_DEFAULT_STATE_JSON);
  return { drafts: [{ id, name: "MDC Sample Resume", createdAt: now, updatedAt: now, state: seed }], saved: [], activeId: id };
}

function restoreState() {
  const loaded = loadLibrary() || migrateLegacyLibrary() || migrateLegacyState();
  _library = loaded || seedLibrary();
  const wasV2 = !!_library._migratedFromV2;
  const wasLegacy = !!_library._migratedFromLegacy;
  delete _library._migratedFromV2;
  delete _library._migratedFromLegacy;
  // Guarantee activeId points at something that still exists.
  if (!activeResume()) {
    const fallback = _library.drafts[0] || _library.saved[0];
    _library.activeId = fallback ? fallback.id : null;
  }
  const active = activeResume();
  if (active && active.state) {
    for (const key of Object.keys(state)) {
      if (key in active.state) state[key] = active.state[key];
    }
    state.match = { on: false, jd: "" };
    ensureStateDefaults();
  }
  writeLibrary();
  // Only retire the legacy keys after we've confirmed the new library wrote.
  try {
    const check = localStorage.getItem(LIBRARY_KEY);
    if (check) {
      if (wasV2) localStorage.removeItem(LEGACY_LIBRARY_KEY);
      if (wasLegacy) localStorage.removeItem(LEGACY_STATE_KEY);
    }
  } catch (_err) { /* keep legacy as fallback */ }
}

function updateLibraryPill() {
  const nameEl = $("#library-pill-name");
  const countEl = $("#library-pill-count");
  const active = activeResume();
  if (nameEl) nameEl.textContent = active ? active.name : defaultResumeName();
  if (countEl) countEl.textContent = `${_library.drafts.length + _library.saved.length}`;
}

function switchToResume(id) {
  if (id === _library.activeId) { closeLibrary(); return; }
  // Snapshot the resume we're leaving so any unsaved edits survive the switch.
  persistStateNow();
  const found = findResume(id);
  if (!found) return;
  _library.activeId = id;
  replaceStateWith(found.resume.state);
  writeLibrary();
  closeLibrary();
  render();
  toast(`SWITCHED → ${found.resume.name.toUpperCase()}`);
}

function createNewResume(opts) {
  if (_library.drafts.length >= DRAFT_LIMIT) {
    toast(`DRAFT LIMIT REACHED — DELETE ONE FIRST`);
    return;
  }
  persistStateNow(); // save the current one before swapping out
  const id = newResumeId();
  const now = Date.now();
  const seed = opts && opts.fromSample ? JSON.parse(_DEFAULT_STATE_JSON) : blankResumeState();
  const name = (opts && opts.name) || (opts && opts.fromSample ? "New Sample Resume" : "New Blank Resume");
  _library.drafts.push({ id, name, createdAt: now, updatedAt: now, state: seed });
  _library.activeId = id;
  replaceStateWith(seed);
  writeLibrary();
  closeLibrary();
  render();
  toast("DRAFT CREATED");
}

function blankResumeState() {
  const defaults = JSON.parse(_DEFAULT_STATE_JSON);
  return {
    ...defaults,
    name: "",
    location: "",
    phone: "",
    email: "",
    linkedin: "",
    links: [],
    contact_line1: "",
    contact_line2: "",
    summary: "",
    education: [{ school: "", city: "", degree: "", date: "", subline_bold: "", subline_rest: "", coursework: "" }],
    skills_categories: [{ label: "Technical", content: "" }],
    skills_two_column: [{ left: "", right: "" }],
    certifications: [],
    projects: [],
    experience: [],
    section_enabled: { summary: true, projects: true, experience: true },
    match: { on: false, jd: "" },
  };
}

function duplicateResume(id) {
  const found = findResume(id);
  if (!found) return;
  // Duplicates land in drafts (the working bucket). Saved cannot grow this way.
  if (_library.drafts.length >= DRAFT_LIMIT) {
    toast("DRAFT LIMIT REACHED — DELETE ONE FIRST");
    return;
  }
  persistStateNow();
  const copy = JSON.parse(JSON.stringify(found.resume));
  copy.id = newResumeId();
  copy.name = `${found.resume.name} (copy)`;
  copy.createdAt = Date.now();
  copy.updatedAt = Date.now();
  _library.drafts.push(copy);
  _library.activeId = copy.id;
  replaceStateWith(copy.state);
  writeLibrary();
  renderLibraryList();
  updateLibraryPill();
  render();
  toast("DUPLICATED → DRAFTS");
}

function saveDraft(id) {
  const found = findResume(id);
  if (!found || found.bucket !== "drafts") return;
  if (_library.saved.length >= SAVED_LIMIT) {
    toast(`SAVED IS FULL (${SAVED_LIMIT}) — DELETE ONE FIRST`);
    return;
  }
  // Persist current state into the draft before we move it, otherwise the
  // act of saving a non-active draft would freeze an outdated snapshot.
  if (id === _library.activeId) persistStateNow();
  const [moved] = _library.drafts.splice(found.index, 1);
  moved.updatedAt = Date.now();
  _library.saved.push(moved);
  writeLibrary();
  renderLibraryList();
  updateLibraryPill();
  toast(`SAVED → "${moved.name.toUpperCase()}"`);
}

function renameResume(id) {
  const found = findResume(id);
  if (!found) return;
  const next = prompt("Rename this resume:", found.resume.name);
  if (next == null) return;
  const trimmed = next.trim();
  if (!trimmed) return;
  found.resume.name = trimmed.slice(0, 60);
  found.resume.updatedAt = Date.now();
  writeLibrary();
  renderLibraryList();
  updateLibraryPill();
}

function deleteResume(id) {
  const found = findResume(id);
  if (!found) return;
  const bucketLabel = found.bucket === "saved" ? "saved" : "draft";
  const ok = confirm(`Delete ${bucketLabel} "${found.resume.name}"? This cannot be undone.`);
  if (!ok) return;
  bucketArr(found.bucket).splice(found.index, 1);
  // If we just deleted the active resume, fall back to the next available one.
  if (_library.activeId === id) {
    const fallback = _library.drafts[0] || _library.saved[0];
    if (fallback) {
      _library.activeId = fallback.id;
      replaceStateWith(fallback.state);
    } else {
      // Both buckets empty — seed a fresh draft so the form never goes blank.
      const fresh = seedLibrary();
      _library = fresh;
      const newActive = activeResume();
      if (newActive) replaceStateWith(newActive.state);
    }
  }
  writeLibrary();
  renderLibraryList();
  updateLibraryPill();
  render();
  toast("DELETED");
}

function openLibrary() {
  renderLibraryList();
  const bg = $("#library-modal-bg");
  if (bg) bg.classList.add("show");
}

function closeLibrary() {
  const bg = $("#library-modal-bg");
  if (bg) bg.classList.remove("show");
}

function libraryRowHtml(r, bucket, fmt) {
  const isActive = r.id === _library.activeId;
  const person = (r.state && r.state.name) ? r.state.name : "(no name yet)";
  const tpl = r.state && r.state.template ? r.state.template.replace("_", " ").toUpperCase() : "—";
  const when = r.updatedAt ? fmt.format(new Date(r.updatedAt)) : "—";
  const saveBtn = bucket === "drafts"
    ? `<button class="lib-btn save" data-action="libSaveDraft" data-id="${esc(r.id)}" ${_library.saved.length >= SAVED_LIMIT ? "disabled" : ""} title="${_library.saved.length >= SAVED_LIMIT ? "Saved bucket is full — delete one to save this draft" : "Move this draft into Saved"}">★ SAVE</button>`
    : "";
  return `
    <div class="lib-row ${isActive ? "active" : ""}" role="listitem">
      <div class="lib-main">
        <div class="lib-name">${esc(r.name)} <span class="lib-active-flag">● ACTIVE</span></div>
        <div class="lib-meta">
          <span class="person">${esc(person)}</span>
          <span class="tag">${esc(tpl)}</span>
          <span>${esc(when)}</span>
        </div>
      </div>
      <div class="lib-actions">
        <button class="lib-btn primary" data-action="libSwitch" data-id="${esc(r.id)}">OPEN</button>
        ${saveBtn}
        <button class="lib-btn" data-action="libRename" data-id="${esc(r.id)}">RENAME</button>
        <button class="lib-btn" data-action="libDuplicate" data-id="${esc(r.id)}" ${_library.drafts.length >= DRAFT_LIMIT ? "disabled" : ""}>DUPLICATE</button>
        <button class="lib-btn danger" data-action="libDelete" data-id="${esc(r.id)}">DELETE</button>
      </div>
    </div>
  `;
}

function renderLibraryList() {
  const list = $("#library-list");
  if (!list) return;
  const fmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const sortFn = (a, b) => {
    if (a.id === _library.activeId) return -1;
    if (b.id === _library.activeId) return 1;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  };
  const draftRows = _library.drafts.slice().sort(sortFn).map((r) => libraryRowHtml(r, "drafts", fmt)).join("");
  const savedRows = _library.saved.slice().sort(sortFn).map((r) => libraryRowHtml(r, "saved", fmt)).join("");

  const draftsOverCap = _library.drafts.length > DRAFT_LIMIT;
  const savedOverCap = _library.saved.length > SAVED_LIMIT;
  const draftsHeaderClass = _library.drafts.length >= DRAFT_LIMIT ? "lib-bucket-h full" : "lib-bucket-h";
  const savedHeaderClass = _library.saved.length >= SAVED_LIMIT ? "lib-bucket-h full" : "lib-bucket-h";

  list.innerHTML = `
    <div class="${draftsHeaderClass}">
      <span class="lib-bucket-title">DRAFTS</span>
      <span class="lib-bucket-count">${_library.drafts.length}/${DRAFT_LIMIT}</span>
      <span class="lib-bucket-hint">${_library.drafts.length === 0 ? "No drafts yet." : (draftsOverCap ? "OVER CAP — delete some to add new drafts" : "Work in progress · autosaves as you type")}</span>
    </div>
    ${draftRows || `<div class="lib-empty">No drafts. Use the buttons below to create one.</div>`}
    <div class="${savedHeaderClass}">
      <span class="lib-bucket-title">★ SAVED</span>
      <span class="lib-bucket-count">${_library.saved.length}/${SAVED_LIMIT}</span>
      <span class="lib-bucket-hint">${_library.saved.length === 0 ? "Tap ★ SAVE on a draft to file it here." : (savedOverCap ? "OVER CAP — delete some to file more" : "Finished versions · max " + SAVED_LIMIT)}</span>
    </div>
    ${savedRows || `<div class="lib-empty">Nothing saved yet.</div>`}
  `;

  // Toggle the "+ NEW" buttons in the modal footer based on draft headroom.
  const blankBtn = list.parentElement && list.parentElement.querySelector('[data-action="newResumeBlank"]');
  const sampleBtn = list.parentElement && list.parentElement.querySelector('[data-action="newResumeSample"]');
  const draftsFull = _library.drafts.length >= DRAFT_LIMIT;
  [blankBtn, sampleBtn].forEach((btn) => {
    if (!btn) return;
    btn.disabled = draftsFull;
    btn.title = draftsFull ? "Drafts is full — delete one to add a new draft" : "";
  });
}

function resetState() {
  const active = activeResume();
  const label = active ? active.name : "this resume";
  const ok = confirm(`Reset "${label}" to the sample data? Other saved resumes are untouched.`);
  if (!ok) return;
  const fresh = JSON.parse(_DEFAULT_STATE_JSON);
  replaceStateWith(fresh);
  if (active) {
    active.state = JSON.parse(JSON.stringify(state));
    active.updatedAt = Date.now();
    writeLibrary();
  }
  closeModal();
  render();
  toast("RESET COMPLETE");
}

// ─────────────────────────────────────────────────────────
// RENDER FORM
// ─────────────────────────────────────────────────────────

function renderHeader() {
  const body = $("#body-header");
  if (tcfg().header === "structured") {
    const titleRow = state.template === "demo_6"
      ? `<div class="row"><label>PROFESSIONAL TITLE</label><input type="text" data-bind="professional_title" value="${esc(state.professional_title || "")}" placeholder="e.g. Marketing Student"><div class="help">Shown under the name in the sidebar header.</div></div>`
      : "";
    const linkItems = state.links.map((url, i) => `
      <div class="item">
        <div class="item-head">
          <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> LINK</div>
          <button class="icon-btn" data-action="removeLink" data-index="${i}">REMOVE</button>
        </div>
        <input type="text" data-link="${i}" value="${esc(url)}" placeholder="github.com/yourname">
      </div>
    `).join("");
    body.innerHTML = `
      <div class="row"><label>FULL NAME</label><input type="text" class="required" data-bind="name" value="${esc(state.name)}" placeholder="Full name"></div>
      ${titleRow}
      <div class="row two">
        <div><label>LOCATION</label><input type="text" class="required" data-bind="location" value="${esc(state.location)}" placeholder="City, State ZIP"></div>
        <div><label>PHONE</label><input type="text" class="required" data-bind="phone" value="${esc(state.phone)}" placeholder="305-555-1234"></div>
      </div>
      <div class="row two">
        <div><label>EMAIL</label><input type="text" class="required" data-bind="email" value="${esc(state.email)}" placeholder="name@example.com"></div>
        <div><label>LINKEDIN</label><input type="text" data-bind="linkedin" value="${esc(state.linkedin)}" placeholder="linkedin.com/in/…"></div>
      </div>
      ${linkItems}
      <button class="add-btn" data-action="addLink">+ ADD LINK</button>
    `;
  } else {
    body.innerHTML = `
      <div class="row"><label>FULL NAME</label><input type="text" class="required" data-bind="name" value="${esc(state.name)}" placeholder="Full name"></div>
      <div class="row"><label>CONTACT LINE 1</label><input type="text" class="required" data-bind="contact_line1" value="${esc(state.contact_line1)}" placeholder="Miami, FL | (305) 555-1234"><div class="help">Free-form. Will appear as the first contact line.</div></div>
      <div class="row"><label>CONTACT LINE 2</label><input type="text" class="required" data-bind="contact_line2" value="${esc(state.contact_line2)}" placeholder="email | LinkedIn URL | site"><div class="help">Free-form. Second contact line. Can hold email + LinkedIn + portfolio.</div></div>
    `;
  }
  bind(body);
  bindLinks(body);
}

function bindLinks(container) {
  container.querySelectorAll("input[data-link]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.links[+el.dataset.link] = ev.target.value;
      renderPreview();
    });
  });
}

function renderSummary() {
  $("#summary").value = state.summary || "";
}

function renderEducation() {
  const body = $("#body-education");
  const eduSchemaIsDemo2 = state.template === "demo_2";
  const showCoursework = state.template !== "demo_4";
  body.innerHTML = state.education.map((e, i) => {
    const sublineFields = eduSchemaIsDemo2 ? `
      <div class="row"><label>SUB-LINE — BOLD PORTION (optional)</label><input type="text" data-edu="${i}" data-field="subline_bold" value="${esc(e.subline_bold || "")}" placeholder="e.g. Associate of Arts, Economics"><div class="help">Appears bold at start of a second line. Use for a secondary degree at the same school.</div></div>
      <div class="row"><label>SUB-LINE — REST (optional)</label><input type="text" data-edu="${i}" data-field="subline_rest" value="${esc(e.subline_rest || "")}" placeholder=" | Minor in Economy | Honors"><div class="help">Plain continuation. Include leading space and separator.</div></div>
    ` : "";
    const courseworkField = showCoursework ? `
      <div class="row"><label>RELEVANT COURSEWORK (optional)</label><input type="text" data-edu="${i}" data-field="coursework" value="${esc(e.coursework || "")}" placeholder="SQL, Tableau, Power BI, ..."></div>
    ` : "";
    const certsField = state.template === "demo_8" ? `
      <div class="row"><label>CERTIFICATIONS (optional)</label><input type="text" data-edu="${i}" data-field="certifications" value="${esc(e.certifications || "")}" placeholder="Google Analytics, HubSpot Inbound, ..."><div class="help">Comma-separated. Appears as a "Certifications:" line under this entry.</div></div>
    ` : "";
    const extra = sublineFields + courseworkField + certsField;
    return `
      <div class="item">
        <div class="item-head">
          <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> ENTRY</div>
          <button class="icon-btn" data-action="removeEdu" data-index="${i}">REMOVE</button>
        </div>
        <div class="row two">
          <div><label>SCHOOL</label><input type="text" class="required" data-edu="${i}" data-field="school" value="${esc(e.school || "")}" placeholder="Miami Dade College"></div>
          <div><label>CITY</label><input type="text" data-edu="${i}" data-field="city" value="${esc(e.city || "")}" placeholder="Miami, FL"></div>
        </div>
        <div class="row two">
          <div><label>DEGREE / FIELD</label><input type="text" class="required" data-edu="${i}" data-field="degree" value="${esc(e.degree || "")}" placeholder="Associate in Arts, Business"></div>
          <div><label>DATE</label><input type="text" class="required" data-edu="${i}" data-field="date" value="${esc(e.date || "")}" placeholder="${eduSchemaIsDemo2 ? '05/2026' : 'Expected: May 2027'}"></div>
        </div>
        ${extra}
      </div>
    `;
  }).join("") + `<button class="add-btn" data-action="addEdu">+ ADD EDUCATION ENTRY</button>`;
  bindEdu(body);
}

function renderSkills() {
  const body = $("#body-skills");
  const skillsMode = tcfg().skillsMode;
  if (skillsMode === "pipe") {
    body.innerHTML = `
      <div class="help skill-help">Single line of skills separated by " │ ". Renders as one flowing paragraph.</div>
      <div class="row"><label>SKILLS LINE</label><textarea data-bind="skills_inline" placeholder="Wireshark │ Nmap │ Splunk │ Python │ ...">${esc(state.skills_inline || "")}</textarea></div>
    `;
    bind(body);
  } else if (skillsMode === "categories") {
    body.innerHTML = state.skills_categories.map((c, i) => `
      <div class="item">
        <div class="item-head">
          <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> CATEGORY</div>
          <button class="icon-btn" data-action="removeSkillCat" data-index="${i}">REMOVE</button>
        </div>
        <div class="row"><label>LABEL</label><input type="text" data-skill-cat="${i}" data-field="label" value="${esc(c.label)}" placeholder="Technical / Administrative / Language"></div>
        <div class="row"><label>CONTENT</label><textarea data-skill-cat="${i}" data-field="content" placeholder="Comma-separated items">${esc(c.content)}</textarea></div>
      </div>
    `).join("") + `<button class="add-btn" data-action="addSkillCat">+ ADD CATEGORY</button>`;
    bindSkillCat(body);
  } else {
    body.innerHTML = `
      <div class="help skill-help">Two-column layout. Each row pairs a left item with a right item — bullets are added automatically.</div>
    ` + state.skills_two_column.map((r, i) => `
      <div class="item">
        <div class="item-head">
          <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> ROW</div>
          <button class="icon-btn" data-action="removeSkillRow" data-index="${i}">REMOVE</button>
        </div>
        <div class="row two">
          <div><label>LEFT</label><input type="text" data-skill-row="${i}" data-field="left" value="${esc(r.left)}" placeholder="SQL, MySQL, Power BI"></div>
          <div><label>RIGHT</label><input type="text" data-skill-row="${i}" data-field="right" value="${esc(r.right)}" placeholder="Pipeline Management"></div>
        </div>
      </div>
    `).join("") + `<button class="add-btn" data-action="addSkillRow">+ ADD ROW</button>`;
    bindSkillRow(body);
  }
}

function renderCerts() {
  const body = $("#certs-list");
  body.innerHTML = state.certifications.map((c, i) => `
    <div class="item">
      <div class="item-head">
        <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> CERTIFICATION</div>
        <button class="icon-btn" data-action="removeCert" data-index="${i}">REMOVE</button>
      </div>
      <input type="text" data-cert="${i}" value="${esc(c)}" placeholder="AWS Certified Solutions Architect – Associate (2024)">
    </div>
  `).join("");
  body.querySelectorAll("input[data-cert]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.certifications[+el.dataset.cert] = ev.target.value;
      render();
    });
  });
}

function renderProjects() {
  const body = $("#projects-list");
  const projMode = tcfg().projMode;
  const isParagraph = projMode === "paragraph" || projMode === "paragraph_inline";
  const bulletsLabel = isParagraph ? "DESCRIPTION" : "BULLETS";
  body.innerHTML = state.projects.map((p, i) => {
    const dateLocFields = state.template === "demo_4" ? `
      <div class="row two">
        <div><label>DATE</label><input type="text" data-proj="${i}" data-field="date" value="${esc(p.date || "")}" placeholder="November 2025 – Present"></div>
        <div><label>LOCATION</label><input type="text" data-proj="${i}" data-field="location" value="${esc(p.location || "")}" placeholder="Miami, FL"></div>
      </div>
    ` : "";
    return `
      <div class="item">
        <div class="item-head">
          <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> PROJECT</div>
          <button class="icon-btn" data-action="removeProject" data-index="${i}">REMOVE</button>
        </div>
        <div class="row"><label>TITLE</label><input type="text" data-proj="${i}" data-field="title" value="${esc(p.title || "")}"></div>
        ${dateLocFields}
        <div class="row"><label>${bulletsLabel}</label>
          <div class="bullets" id="proj-bullets-${i}">
            ${(p.bullets || []).map((b, bi) => `
              <div class="bullet-row">
                <textarea data-proj-bullet="${i}" data-bullet-i="${bi}">${esc(b)}</textarea>
                <button class="mic-btn" type="button" data-action="micToggle" data-mic-target="projBullet:${i}:${bi}" aria-label="Dictate bullet" title="Dictate (voice)">🎤</button>
                <button class="icon-btn" data-action="removeProjBullet" data-index="${i}" data-bullet-index="${bi}">×</button>
              </div>
            `).join("")}
          </div>
          <button class="add-btn" data-action="addProjBullet" data-index="${i}">+ ADD BULLET</button>
        </div>
      </div>
    `;
  }).join("");
  bindProjects(body);
}

function renderExperience() {
  const body = $("#experience-list");
  body.innerHTML = state.experience.map((e, i) => {
    const sublineField = state.template === "demo_4"
      ? `<div class="row"><label>LOCATION (ITALIC LINE)</label><input type="text" data-exp="${i}" data-field="location" value="${esc(e.location || "")}" placeholder="North Miami, FL"></div>`
      : `<div class="row"><label>COMPANY · CITY (PLAIN LINE)</label><input type="text" data-exp="${i}" data-field="company_city" value="${esc(e.company_city || "")}" placeholder="Pinnacle Financial | Miami, FL"></div>`;
    return `
      <div class="item">
        <div class="item-head">
          <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> POSITION</div>
          <button class="icon-btn" data-action="removeExp" data-index="${i}">REMOVE</button>
        </div>
        <div class="row two">
          <div><label>TITLE</label><input type="text" data-exp="${i}" data-field="title" value="${esc(e.title || "")}"></div>
          <div><label>DATE</label><input type="text" data-exp="${i}" data-field="date" value="${esc(e.date || "")}" placeholder="2023 – Present"></div>
        </div>
        ${sublineField}
        <div class="row"><label>BULLETS</label>
          <div class="bullets" id="exp-bullets-${i}">
            ${(e.bullets || []).map((b, bi) => `
              <div class="bullet-row">
                <textarea data-exp-bullet="${i}" data-bullet-i="${bi}">${esc(b)}</textarea>
                <button class="mic-btn" type="button" data-action="micToggle" data-mic-target="expBullet:${i}:${bi}" aria-label="Dictate bullet" title="Dictate (voice)">🎤</button>
                <button class="icon-btn" data-action="removeExpBullet" data-index="${i}" data-bullet-index="${bi}">×</button>
              </div>
            `).join("")}
          </div>
          <button class="add-btn" data-action="addExpBullet" data-index="${i}">+ ADD BULLET</button>
        </div>
      </div>
    `;
  }).join("");
  bindExperience(body);
}

// ─────────────────────────────────────────────────────────
// BIND HELPERS
// ─────────────────────────────────────────────────────────

function bind(container) {
  container.querySelectorAll("[data-bind]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state[el.dataset.bind] = ev.target.value;
      setCaseId();
      renderPreview();
    });
  });
}
function bindEdu(container) {
  container.querySelectorAll("[data-edu]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.education[+el.dataset.edu][el.dataset.field] = ev.target.value;
      renderPreview();
    });
  });
}
function bindSkillCat(container) {
  container.querySelectorAll("[data-skill-cat]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.skills_categories[+el.dataset.skillCat][el.dataset.field] = ev.target.value;
      renderPreview();
    });
  });
}
function bindSkillRow(container) {
  container.querySelectorAll("[data-skill-row]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.skills_two_column[+el.dataset.skillRow][el.dataset.field] = ev.target.value;
      renderPreview();
    });
  });
}
function bindProjects(container) {
  container.querySelectorAll("[data-proj]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.projects[+el.dataset.proj][el.dataset.field] = ev.target.value;
      renderPreview();
    });
  });
  container.querySelectorAll("[data-proj-bullet]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.projects[+el.dataset.projBullet].bullets[+el.dataset.bulletI] = ev.target.value;
      renderPreview();
    });
  });
}
function bindExperience(container) {
  container.querySelectorAll("[data-exp]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.experience[+el.dataset.exp][el.dataset.field] = ev.target.value;
      renderPreview();
    });
  });
  container.querySelectorAll("[data-exp-bullet]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.experience[+el.dataset.expBullet].bullets[+el.dataset.bulletI] = ev.target.value;
      renderPreview();
    });
  });
}

// ─────────────────────────────────────────────────────────
// LIST ACTIONS
// ─────────────────────────────────────────────────────────

function addSkillCat() { state.skills_categories.push({ label: "", content: "" }); render(); }
function removeSkillCat(i) { state.skills_categories.splice(i, 1); render(); }
function addSkillRow() { state.skills_two_column.push({ left: "", right: "" }); render(); }
function removeSkillRow(i) { state.skills_two_column.splice(i, 1); render(); }
function addCert() { state.certifications.push(""); render(); }
function removeCert(i) { state.certifications.splice(i, 1); render(); }
function addLink() { state.links.push(""); render(); }
function removeLink(i) { state.links.splice(i, 1); render(); }
function addEdu() { state.education.push({ school: "", city: "", degree: "", date: "", subline_bold: "", subline_rest: "", coursework: "", certifications: "" }); render(); }
function removeEdu(i) { state.education.splice(i, 1); render(); }
function addProject() { state.projects.push({ title: "", date: "", location: "", bullets: [""] }); render(); }
function removeProject(i) { state.projects.splice(i, 1); render(); }
function addProjBullet(i) { state.projects[i].bullets.push(""); render(); }
function removeProjBullet(i, bi) { state.projects[i].bullets.splice(bi, 1); render(); }
function addExperience() { state.experience.push({ title: "", date: "", location: "", company_city: "", bullets: [""] }); render(); }
function removeExp(i) { state.experience.splice(i, 1); render(); }
function addExpBullet(i) { state.experience[i].bullets.push(""); render(); }
function removeExpBullet(i, bi) { state.experience[i].bullets.splice(bi, 1); render(); }
function toggleSection(name) {
  if (!(name in state.section_enabled)) return;
  state.section_enabled[name] = !state.section_enabled[name];
  applySectionToggleStates();
  recomputeSectionIndices();
  renderPreview();
}

function movePanel(section, dir) {
  const tpl = state.template;
  const order = state.section_order[tpl];
  if (!order) return;
  const idx = order.indexOf(section);
  if (idx === -1) return;
  const newIdx = dir === "up" ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= order.length) return;
  [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
  reorderPanels();
  recomputeSectionIndices();
  renderPreview();
}

const ACTIONS = {
  addSkillCat: () => addSkillCat(),
  removeSkillCat: (btn) => removeSkillCat(+btn.dataset.index),
  addSkillRow: () => addSkillRow(),
  removeSkillRow: (btn) => removeSkillRow(+btn.dataset.index),
  addCert: () => addCert(),
  removeCert: (btn) => removeCert(+btn.dataset.index),
  addEdu: () => addEdu(),
  removeEdu: (btn) => removeEdu(+btn.dataset.index),
  addLink: () => addLink(),
  removeLink: (btn) => removeLink(+btn.dataset.index),
  addProject: () => addProject(),
  removeProject: (btn) => removeProject(+btn.dataset.index),
  addProjBullet: (btn) => addProjBullet(+btn.dataset.index),
  removeProjBullet: (btn) => removeProjBullet(+btn.dataset.index, +btn.dataset.bulletIndex),
  addExperience: () => addExperience(),
  removeExp: (btn) => removeExp(+btn.dataset.index),
  addExpBullet: (btn) => addExpBullet(+btn.dataset.index),
  removeExpBullet: (btn) => removeExpBullet(+btn.dataset.index, +btn.dataset.bulletIndex),
  toggleSection: (btn) => toggleSection(btn.dataset.section),
  movePanel: (btn) => movePanel(btn.dataset.section, btn.dataset.dir),
  copyJSON: () => copyJSON(),
  showCompile: () => showCompile(),
  closeModal: () => closeModal(),
  copyPayloadAndPrompt: () => copyPayloadAndPrompt(),
  downloadDoc: () => downloadDoc(),
  downloadPdf: () => downloadPdf(),
  printPDF: () => printPDF(),
  closeModalBackdrop: (el, ev) => { if (ev.target === el) closeModal(); },
  toggleIntake: () => $("#intake-card").classList.toggle("collapsed"),
  toggleVoice: () => { $("#voice-card").classList.toggle("collapsed"); markVoiceIntroSeen(); },
  voiceToggle: () => voiceToggle(),
  clearVoice: () => clearVoice(),
  voiceAnalyze: () => voiceAnalyze(),
  voiceRegenSummary: () => voiceRegenSummary(),
  voiceApplySummary: () => voiceApplySummary(),
  voiceApplySkills: () => voiceApplySkills(),
  voiceToggleChip: (btn) => voiceToggleChip(btn),
  voiceSetTone: (btn) => voiceSetTone(btn),
  toggleTheme: () => toggleTheme(),
  railJumpTop: () => railJumpTo("top"),
  railOpenIntake: () => railOpen("intake"),
  railOpenVoice: () => railOpen("voice"),
  railJumpSkills: () => railJumpTo("skills"),
  parseImportText: () => parseImportFromPaste(),
  applyImport: () => applyImport(),
  closeImportModal: () => closeImportModal(),
  closeImportModalBackdrop: (el, ev) => { if (ev.target === el) closeImportModal(); },
  resetState: () => resetState(),
  openLibrary: () => openLibrary(),
  closeLibrary: () => closeLibrary(),
  closeLibraryBackdrop: (el, ev) => { if (ev.target === el) closeLibrary(); },
  libSwitch: (btn) => switchToResume(btn.dataset.id),
  libSaveDraft: (btn) => saveDraft(btn.dataset.id),
  libRename: (btn) => renameResume(btn.dataset.id),
  libDuplicate: (btn) => duplicateResume(btn.dataset.id),
  libDelete: (btn) => deleteResume(btn.dataset.id),
  newResumeBlank: () => createNewResume({ fromSample: false }),
  newResumeSample: () => createNewResume({ fromSample: true }),
  openShareModal: () => openShareModal(),
  closeShareModal: () => closeShareModal(),
  closeShareBackdrop: (el, ev) => { if (ev.target === el) closeShareModal(); },
  sharePdf: () => sharePdf(),
  micToggle: (btn) => micToggle(btn),
  voiceFabToggle: () => voiceFabToggle(),
  skipVoice: () => skipVoiceIntro(),
  triggerCamera: () => triggerCamera(),
  finalSaveToLibrary: () => finalSaveToLibrary(),
  finalBackToEdit: () => finalBackToEdit(),
};

document.addEventListener("click", (ev) => {
  const actionEl = ev.target.closest("[data-action]");
  if (!actionEl) return;
  const handler = ACTIONS[actionEl.dataset.action];
  if (!handler) return;
  ev.preventDefault();
  handler(actionEl, ev);
});

// ─────────────────────────────────────────────────────────
// PANEL TOGGLES
// ─────────────────────────────────────────────────────────

$$(".panel header").forEach(h => {
  h.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-action]")) return;
    h.parentElement.classList.toggle("open");
  });
});

function applySectionToggleStates() {
  $$(".panel[data-optional='true']").forEach(panel => {
    const name = panel.dataset.section;
    const enabled = state.section_enabled[name] !== false;
    panel.classList.toggle("section-off", !enabled);
    const btn = panel.querySelector(".section-toggle");
    if (btn) {
      btn.textContent = enabled ? "INCLUDED" : "EXCLUDED";
      btn.setAttribute("aria-pressed", enabled ? "true" : "false");
    }
  });
}

function recomputeSectionIndices() {
  let n = 1;
  $$(".panel").forEach(panel => {
    if (panel.classList.contains("hidden")) return;
    const idxEl = panel.querySelector(".idx");
    if (idxEl) idxEl.textContent = String(n).padStart(2, "0");
    n += 1;
  });
}

// Pull each reorderable form panel into the order specified by
// state.section_order[template]. Sections not in the current template's
// order (e.g. certs in demo_4) are left untouched and hidden separately.
function reorderPanels() {
  const tpl = state.template;
  const order = state.section_order[tpl] || [];
  const panels = {};
  $$(".panel[data-reorderable='true']").forEach(p => { panels[p.dataset.section] = p; });
  const summaryPanel = $(".panel[data-section='summary']");
  let anchor = summaryPanel;
  for (const sec of order) {
    const panel = panels[sec];
    if (!panel) continue;
    if (anchor.nextElementSibling !== panel) anchor.after(panel);
    anchor = panel;
  }
  updateReorderButtonStates();
}

function updateReorderButtonStates() {
  const tpl = state.template;
  const order = state.section_order[tpl] || [];
  $$(".reorder-btn").forEach(btn => {
    const sec = btn.dataset.section;
    const idx = order.indexOf(sec);
    const dir = btn.dataset.dir;
    let disabled = false;
    if (idx === -1) disabled = true;
    else if (dir === "up" && idx === 0) disabled = true;
    else if (dir === "down" && idx === order.length - 1) disabled = true;
    btn.setAttribute("aria-disabled", disabled ? "true" : "false");
  });
}

// ─────────────────────────────────────────────────────────
// TEMPLATE SWITCH
// ─────────────────────────────────────────────────────────

// The dropdown options ship in index.html (so the picker is never empty even
// before/without JS). As a safety net, rebuild them from config if missing.
(function ensureTemplateDropdown() {
  const dd = $("#tpl-dropdown");
  if (!dd || (dd.options && dd.options.length > 0)) return;
  dd.innerHTML = TEMPLATE_ORDER.map(tpl => {
    const c = TEMPLATES[tpl];
    const code = tpl.replace("_", " ").replace(/\b\w/g, m => m.toUpperCase());
    return `<option value="${tpl}">${code} — ${esc(c.name)}</option>`;
  }).join("");
})();

$("#tpl-dropdown") && $("#tpl-dropdown").addEventListener("change", (ev) => {
  const tpl = ev.target.value;
  if (!TEMPLATES[tpl] || tpl === state.template) return;
  state.template = tpl;
  state.font_pt = null; // reset font choice on template switch — each template has its own default
  $$("[data-font]").forEach(c => c.classList.remove("active"));
  $("#font-chip-default").classList.add("active");
  reorderPanels();
  setCaseId();
  render();
});

// Window resize re-paginates the preview at the new width.
let _resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => renderPreview(), 180);
});

// Font size chip selector — manual override only
$$("[data-font]").forEach(chip => {
  chip.addEventListener("click", () => {
    $$("[data-font]").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    const v = chip.dataset.font;
    state.font_pt = v === "default" ? null : parseInt(v, 10);
    renderPreview();
  });
});

// Typeface (font-family) chip selector — applies to the whole resume.
$$("[data-family]").forEach(chip => {
  chip.addEventListener("click", () => {
    $$("[data-family]").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    state.font_family = chip.dataset.family;
    renderPreview();
  });
});

// Voice-profile transcript: editable; mirrors into (session-only) state.
const _voiceTaEl = $("#voice-transcript");
if (_voiceTaEl) {
  _voiceTaEl.addEventListener("input", (ev) => { state.voice_profile = ev.target.value; });
}

// ─────────────────────────────────────────────────────────
// LIVE PREVIEW
// ─────────────────────────────────────────────────────────

function renderSummaryPreviewHtml() {
  const c = tcfg();
  let html = `<div class="resume-section-h">${esc(c.labels.summary)}</div>`;
  html += `<div>${linkify(state.summary)}</div>`;
  return html;
}

function renderEducationPreviewHtml(tpl) {
  const c = tcfg(tpl);
  let html = `<div class="resume-section-h">${esc(c.labels.education)}</div>`;
  state.education.forEach((e, idx) => {
    const gapClass = idx > 0 ? " edu-gap" : "";
    if (c.eduMode === "demo4") {
      html += `<div class="edu-row${gapClass}"><div class="strong">${esc(e.school)}</div><div class="strong">${esc(e.city)}</div></div>`;
      html += `<div class="edu-row"><div>${esc(e.degree)}</div><div>${esc(e.date)}</div></div>`;
    } else if (c.eduMode === "demo5") {
      // Degree (bold) first, then "school │ city │ date" on a plain subline.
      html += `<div class="edu-degree-bold${gapClass}">${esc(e.degree)}</div>`;
      const sub = [e.school, e.city, e.date].filter(Boolean).join(" │ ");
      if (sub) html += `<div class="edu-subline">${linkify(sub)}</div>`;
      if (e.coursework) {
        html += `<div class="edu-coursework"><span class="bold">Relevant Coursework: </span>${linkify(e.coursework)}</div>`;
      }
    } else if (c.eduMode === "demo6") {
      // Sidebar: compact "School (date) — Degree" line per entry.
      const head = [esc(e.school), e.date ? `(${esc(e.date)})` : ""].filter(Boolean).join(" ");
      html += `<div class="edu-line${gapClass}">${head}${e.degree ? ` — ${esc(e.degree)}` : ""}</div>`;
    } else if (c.eduMode === "demo8") {
      // "Degree (bold) School | City" left, date right; then coursework + certs lines.
      const left = [`<span class="bold">${esc(e.degree)}</span>`, esc(e.school)].filter(Boolean).join(" ")
        + (e.city ? ` | ${esc(e.city)}` : "");
      html += `<div class="entry-title-row${gapClass}"><div class="title-plain">${left}</div><div class="date">${esc(e.date)}</div></div>`;
      if (e.coursework) {
        html += `<div class="edu-coursework"><span class="bold">Coursework: </span>${linkify(e.coursework)}</div>`;
      }
      if (e.certifications) {
        html += `<div class="edu-coursework"><span class="bold">Certifications: </span>${linkify(e.certifications)}</div>`;
      }
    } else {
      // demo2 / demo1: school+city row, degree+date row, optional subline + coursework.
      const degRowClass = c.eduMode === "demo1" ? "edu-row" : "edu-degree-row";
      html += `<div class="edu-row${gapClass}"><div class="strong">${esc(e.school)}</div><div>${esc(e.city)}</div></div>`;
      html += `<div class="${degRowClass}"><div>${esc(e.degree)}</div><div>${esc(e.date)}</div></div>`;
      if (e.subline_bold || e.subline_rest) {
        html += `<div class="edu-subline"><span class="bold">${esc(e.subline_bold)}</span>${linkify(e.subline_rest)}</div>`;
      }
      if (e.coursework) {
        html += `<div class="edu-coursework"><span class="bold">Relevant Coursework: </span>${linkify(e.coursework)}</div>`;
      }
    }
  });
  return html;
}

function renderSkillsPreviewHtml(tpl) {
  const c = tcfg(tpl);
  let html = `<div class="resume-section-h">${esc(c.labels.skills)}</div>`;
  if (c.skillsMode === "categories") {
    state.skills_categories.forEach(cat => {
      html += `<div class="skill-cat"><span class="lbl">${esc(cat.label)}:</span> ${esc(cat.content)}</div>`;
    });
  } else if (c.skillsMode === "pipe") {
    html += `<div class="skills-line">${esc(state.skills_inline || "")}</div>`;
  } else if (c.skillsMode === "list") {
    // Sidebar: flat bullet list, flattening the two-column pairs in reading order.
    html += `<ul class="skills-list">`;
    state.skills_two_column.forEach(r => {
      if (r.left) html += `<li>${esc(r.left)}</li>`;
      if (r.right) html += `<li>${esc(r.right)}</li>`;
    });
    html += `</ul>`;
  } else {
    html += `<ul class="skills-2col">`;
    state.skills_two_column.forEach(r => {
      const left = r.left ? `<li class="left">${esc(r.left)}</li>` : `<li></li>`;
      const right = r.right ? `<div>• ${esc(r.right)}</div>` : `<div></div>`;
      html += left + right;
    });
    html += `</ul>`;
  }
  return html;
}

function renderCertsPreviewHtml() {
  let html = `<div class="resume-section-h">${esc(tcfg().labels.certs)}</div>`;
  html += `<ul class="bullets-list">`;
  state.certifications.forEach(c => { html += `<li>${linkify(c)}</li>`; });
  html += `</ul>`;
  return html;
}

function renderProjectsPreviewHtml(tpl) {
  const c = tcfg(tpl);
  let html = `<div class="resume-section-h">${esc(c.labels.projects)}</div>`;
  state.projects.forEach(p => {
    const bullets = (p.bullets || []).filter(Boolean);
    if (c.projMode === "dated") {
      html += `<div class="entry-title-row"><div class="title">${esc(p.title)}</div><div class="date">${esc(p.date)}</div></div>`;
      if (p.location) html += `<div class="entry-loc">${linkify(p.location)}</div>`;
      if (bullets.length) {
        html += `<ul class="bullets-list">`;
        bullets.forEach(b => { html += `<li>${linkify(b)}</li>`; });
        html += `</ul>`;
      }
    } else if (c.projMode === "paragraph_inline") {
      // demo5: "Title: description" — bold title, colon, description inline.
      const first = bullets.shift() || "";
      html += `<div class="proj-desc"><span class="bold">${esc(p.title)}:</span> ${linkify(first)}</div>`;
      bullets.forEach(b => { html += `<div class="proj-desc">${linkify(b)}</div>`; });
    } else if (c.projMode === "paragraph") {
      // demo1: bold title line, then description paragraph(s), no bullets.
      html += `<div class="proj-title">${esc(p.title)}</div>`;
      bullets.forEach(b => { html += `<div class="proj-desc">${linkify(b)}</div>`; });
    } else {
      html += `<div class="proj-title">${esc(p.title)}</div>`;
      if (bullets.length) {
        html += `<ul class="bullets-list">`;
        bullets.forEach(b => { html += `<li>${linkify(b)}</li>`; });
        html += `</ul>`;
      }
    }
  });
  return html;
}

function renderExperiencePreviewHtml(tpl) {
  const c = tcfg(tpl);
  let html = `<div class="resume-section-h">${esc(c.labels.experience)}</div>`;
  state.experience.forEach(en => {
    if (c.expMode === "company_first") {
      // demo6: "COMPANY | DATE" line, then job title, then bullets.
      const head = [en.company_city, en.date].filter(Boolean).join(" | ");
      html += `<div class="hl-company">${linkify(head)}</div>`;
      if (en.title) html += `<div class="hl-title">${esc(en.title)}</div>`;
    } else {
      html += `<div class="entry-title-row"><div class="title">${esc(en.title)}</div><div class="date">${esc(en.date)}</div></div>`;
      if (c.expMode === "italic") {
        if (en.location) html += `<div class="entry-loc">${linkify(en.location)}</div>`;
      } else {
        if (en.company_city) html += `<div class="exp-company">${linkify(en.company_city)}</div>`;
      }
    }
    if (en.bullets && en.bullets.length) {
      html += `<ul class="bullets-list">`;
      en.bullets.forEach(b => { if (b) html += `<li>${linkify(b)}</li>`; });
      html += `</ul>`;
    }
  });
  return html;
}

const PREVIEW_SECTION_RENDERERS = {
  education: (tpl) => renderEducationPreviewHtml(tpl),
  skills: (tpl) => renderSkillsPreviewHtml(tpl),
  certs: (tpl) => tcfg(tpl).certs ? renderCertsPreviewHtml() : "",
  projects: (tpl) => (state.section_enabled.projects && state.projects.length > 0) ? renderProjectsPreviewHtml(tpl) : "",
  experience: (tpl) => (state.section_enabled.experience && state.experience.length > 0) ? renderExperiencePreviewHtml(tpl) : "",
};

// Two-column sidebar layout (demo_6). Built as an HTML table so the columns
// survive both the browser preview and the Word (.doc) export, which has poor
// flex/grid support.
function renderSidebarPreviewHtml() {
  const tpl = state.template;
  const c = tcfg(tpl);
  let head = `<div class="resume-name">${esc(state.name) || "—"}</div>`;
  if (state.professional_title) head += `<div class="resume-title">${esc(state.professional_title)}</div>`;

  let side = `<div class="resume-section-h">${esc(c.labels.contact)}</div>`;
  const contactBits = [];
  if (state.phone) contactBits.push(`📞 ${esc(state.phone)}`);
  if (state.email) contactBits.push(`✉ ${linkify(state.email)}`);
  if (state.location) contactBits.push(`📍 ${esc(state.location)}`);
  if (state.linkedin) contactBits.push(`🔗 ${linkify(state.linkedin)}`);
  side += contactBits.map(b => `<div class="contact-line">${b}</div>`).join("");
  side += renderEducationPreviewHtml(tpl);
  side += renderSkillsPreviewHtml(tpl);

  let main = "";
  if (state.section_enabled.summary !== false) main += renderSummaryPreviewHtml();
  if (state.section_enabled.experience !== false && state.experience.length) {
    main += renderExperiencePreviewHtml(tpl);
  }

  return head +
    `<table class="sidebar-grid"><tbody><tr>` +
    `<td class="col-side">${side}</td>` +
    `<td class="col-main">${main}</td>` +
    `</tr></tbody></table>`;
}

function renderPreview() {
  const tpl = state.template;
  const f = $("#preview");
  let html;
  if (tcfg(tpl).layout === "sidebar") {
    html = renderSidebarPreviewHtml();
  } else {
    html = `<div class="resume-name">${esc(state.name) || "—"}</div>`;
    if (tpl === "demo_4") {
      const extraLinks = (state.links || []).filter(Boolean).map(linkify).join(" | ");
      const contactParts = [esc(state.location), esc(state.phone), linkify(state.email), linkify(state.linkedin), extraLinks].filter(Boolean);
      html += `<div class="resume-contact">${contactParts.join(" | ")}</div>`;
    } else {
      const line2 = (state.contact_line2 || "").trim();
      html += `<div class="resume-contact">${linkify(state.contact_line1)}${line2 ? "<br>" + linkify(line2) : ""}</div>`;
      html += `<div class="resume-contact-divider"></div>`;
    }

    if (state.section_enabled.summary !== false) {
      html += renderSummaryPreviewHtml();
    }

    const order = state.section_order[tpl] || [];
    for (const sec of order) {
      const fn = PREVIEW_SECTION_RENDERERS[sec];
      if (fn) html += fn(tpl);
    }
  }

  const defaultFontPt = tcfg(tpl).bodyPt;
  const fontPt = state.font_pt || defaultFontPt;
  state._appliedFontPt = fontPt;

  // Render content into a single frame, then paginate by measuring children.
  const frameClass = `preview-frame ${tpl} font-${fontPt} family-${fontFamilyKey()}`;
  f.innerHTML = `<div class="${frameClass}">${html}</div>`;
  const pageCount = paginatePreview(frameClass);
  runMatch();

  // Stats: words + content density (entries + bullets) + active font + page count
  const text = f.innerText || "";
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const totalEntries =
    state.education.filter(e => e.school).length +
    state.projects.filter(p => p.title).length +
    state.experience.filter(e => e.title).length;
  const totalBullets =
    state.projects.reduce((n, p) => n + (p.bullets || []).filter(Boolean).length, 0) +
    state.experience.reduce((n, e) => n + (e.bullets || []).filter(Boolean).length, 0);
  const isDefault = fontPt === defaultFontPt;
  const fontClass = isDefault ? "ok" : "warn";
  const pageLabel = pageCount === 1 ? "1 page" : `${pageCount} pages`;
  $("#preview-stats").innerHTML =
    `${words} words &nbsp;·&nbsp; ${totalEntries} entries &nbsp;·&nbsp; ${totalBullets} bullets &nbsp;·&nbsp; <span class="${fontClass}">${fontPt}pt body</span> &nbsp;·&nbsp; ${pageLabel}`;

  $("#overflow-banner").className = "overflow-banner";
  $("#overflow-banner").innerHTML = "";

  mirrorPreviewToFinal();
  updateFinalActionState();
  schedulePersist();
}

// ─────────────────────────────────────────────────────────
// FINAL REVIEW PANE (phase 9)
// Mirrors the inline preview into a clean full-screen review surface
// with sticky "save / pdf / share / back" actions at the bottom.
// ─────────────────────────────────────────────────────────

function mirrorPreviewToFinal() {
  const src = $("#preview");
  const dst = $("#final-preview");
  if (!src || !dst) return;
  // The preview is already paginated into one-or-more .preview-frame nodes;
  // a shallow innerHTML clone gives us identical page layout for free.
  dst.innerHTML = src.innerHTML;

  // Update the meta line with bucket + page count.
  const meta = $("#final-meta");
  if (meta) {
    const pageCount = src.querySelectorAll(".preview-frame").length || 1;
    const pageLabel = pageCount === 1 ? "1 page" : `${pageCount} pages`;
    const bucket = activeBucket();
    const bucketLabel = bucket === "saved"
      ? `<span class="bucket saved">★ SAVED</span>`
      : `<span class="bucket">DRAFT</span>`;
    meta.innerHTML = `${bucketLabel} · ${pageLabel}`;
  }
}

function updateFinalActionState() {
  const btn = $("#final-save-btn");
  const label = $("#final-save-label");
  if (!btn || !label) return;
  const bucket = activeBucket();
  btn.classList.remove("is-saved", "is-full");
  btn.disabled = false;
  if (bucket === "saved") {
    btn.classList.add("is-saved");
    btn.disabled = true;
    label.textContent = "ALREADY SAVED";
    return;
  }
  if (_library.saved.length >= SAVED_LIMIT) {
    btn.classList.add("is-full");
    btn.disabled = true;
    label.textContent = `SAVED FULL (${SAVED_LIMIT}) — DELETE ONE`;
    return;
  }
  label.textContent = "SAVE TO LIBRARY";
}

function finalSaveToLibrary() {
  const active = activeResume();
  if (!active) return;
  if (activeBucket() === "saved") {
    toast("ALREADY IN SAVED");
    return;
  }
  if (_library.saved.length >= SAVED_LIMIT) {
    toast(`SAVED IS FULL — DELETE ONE FIRST`);
    return;
  }
  saveDraft(active.id);
  updateFinalActionState();
  // After save, the resume now lives in the saved bucket — refresh the pill +
  // meta so the FINAL pane immediately reflects the new state.
  mirrorPreviewToFinal();
}

function finalBackToEdit() {
  const swipe = window.__paneSwipe;
  if (swipe) {
    swipe.setActive("left");
    swipe.scrollToPane("left");
  }
}

// Measures the first .preview-frame inside #preview and, if its content
// would overflow one page, splits its children into stacked frames.
// Returns the resulting page count.
function paginatePreview(frameClass) {
  const wrap = $("#preview");
  const firstFrame = wrap.firstElementChild;
  if (!firstFrame) return 0;

  // Page content area: aspect-ratio gives us paper-shaped frame height;
  // subtract vertical padding (22 top + 36 bottom = 58px from .preview-frame).
  const paperH = firstFrame.clientHeight;
  const pageContentH = paperH - 58;
  // Guard against pre-layout race (clientHeight 0) — leave as one page.
  if (paperH <= 0 || pageContentH <= 0) return 1;
  if (firstFrame.scrollHeight <= paperH + 1) return 1; // fits on one page

  // Measure each top-level child while still in the live frame.
  const children = Array.from(firstFrame.children);
  const measured = children.map(node => {
    const cs = getComputedStyle(node);
    const mt = parseFloat(cs.marginTop) || 0;
    const mb = parseFloat(cs.marginBottom) || 0;
    return { node, h: node.offsetHeight + mt + mb };
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

// ─────────────────────────────────────────────────────────
// SUMMARY BINDING (single static field)
// ─────────────────────────────────────────────────────────

$("#summary").addEventListener("input", (ev) => {
  state.summary = ev.target.value;
  renderPreview();
});

// ─────────────────────────────────────────────────────────
// FULL RENDER
// ─────────────────────────────────────────────────────────

// Reflect state.template in the dropdown + section-panel visibility so a
// restored resume (or one switched via the library) shows the right UI.
function syncTemplateUI() {
  const cfg = tcfg();
  const dd = $("#tpl-dropdown");
  if (dd && dd.value !== state.template) dd.value = state.template;
  const desc = $("#tpl-desc");
  if (desc) desc.textContent = cfg.desc || "";
  const certsPanel = $("#panel-certs");
  if (certsPanel) certsPanel.classList.toggle("hidden", !cfg.certs);
  // Hide the Projects panel for templates whose section order omits projects.
  const order = state.section_order[state.template] || [];
  const projPanel = $(".panel[data-section='projects']");
  if (projPanel) projPanel.classList.toggle("hidden", !order.includes("projects"));
  // Reflect the active typeface + size chips.
  const fam = fontFamilyKey();
  $$("[data-family]").forEach(c => c.classList.toggle("active", c.dataset.family === fam));
  $$("[data-font]").forEach(c => {
    const isActive = c.dataset.font === "default"
      ? state.font_pt == null
      : parseInt(c.dataset.font, 10) === state.font_pt;
    c.classList.toggle("active", isActive);
  });
}

function render() {
  // A full render() rebuilds the form DOM, which would orphan an active
  // mic button mid-stream. Stop dictation first so the user isn't stuck
  // with a phantom "listening" state and an unreachable target field.
  if (_recordingTarget) stopDictation();
  syncTemplateUI();
  renderHeader();
  renderSummary();
  renderEducation();
  renderSkills();
  if (tcfg().certs) renderCerts();
  renderProjects();
  renderExperience();
  applySectionToggleStates();
  reorderPanels();
  recomputeSectionIndices();
  setCaseId();
  renderPreview();
  updateLibraryPill();
  hideMicButtonsIfUnsupported();
  initVoiceFabOnce();
}

// ─────────────────────────────────────────────────────────
// PAYLOAD / EXPORT
// ─────────────────────────────────────────────────────────


function slugFileName(name) {
  const slug = (name || "resume")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "resume";
}

function buildExportDocument() {
  renderPreview();
  const title = esc(state.name || "Resume");
  const fontPt = state._appliedFontPt || tcfg().bodyPt;
  // Flatten the paginated frames back into one content flow — Word repaginates
  // at its own page size; preview pixel breaks don't translate.
  const frames = $("#preview").querySelectorAll(".preview-frame");
  const combined = Array.from(frames).map(f => f.innerHTML).join("\n");
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page { size: Letter; margin: 0.5in; }
  body { margin: 0; background: #fff; color: #020826; }
  .preview-frame { font-family: ${FONT_FAMILIES[fontFamilyKey()].css}; line-height: 1.45; font-size: ${fontPt}pt; color: #020826; }
  .resume-name { text-align: center; font-weight: 700; margin: 0 0 3px 0; line-height: 1.1; font-size: ${tcfg().namePt}pt; }
  .resume-title { text-align: center; font-size: 11pt; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 8px 0; color: #555; }
  .resume-contact { text-align: center; font-size: 9pt; padding-bottom: 4px; border-bottom: 0.5pt solid #c8b89f; margin-bottom: 8px; line-height: 1.35; }
  .demo_2 .resume-contact, .demo_1 .resume-contact, .demo_5 .resume-contact { border-bottom: none; }
  .resume-contact-divider { border-bottom: 0.5pt solid #c8b89f; margin: 2px 0 8px 0; }
  .resume-section-h { font-weight: 700; padding-bottom: 2px; border-bottom: 0.5pt solid #c8b89f; margin: 12px 0 6px 0; }
  .demo_2 .resume-section-h, .demo_5 .resume-section-h, .demo_6 .resume-section-h, .demo_8 .resume-section-h { font-variant: small-caps; letter-spacing: 0.04em; }
  .edu-row, .entry-title-row, .edu-degree-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .entry-title-row { margin: 8px 0 2px 0; }
  .title, .date, .strong, .bold, .lbl { font-weight: 700; }
  .date { white-space: nowrap; }
  .entry-loc { font-style: italic; margin: 0 0 4px 0; font-size: 0.95em; }
  .bullets-list { margin: 2px 0 0 0; padding-left: 18px; }
  .bullets-list li { margin: 2px 0; }
  .skill-cat { margin: 4px 0; }
  .skills-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; padding-left: 18px; margin: 4px 0; }
  .skills-list { margin: 4px 0; padding-left: 18px; }
  .skills-list li { margin: 2px 0; }
  .skills-line { margin: 4px 0; line-height: 1.5; }
  .proj-desc { margin: 2px 0; }
  .edu-gap { margin-top: 8px; }
  .edu-line { margin: 3px 0; }
  .edu-subline, .edu-coursework { margin: 2px 0; }
  .edu-degree-bold { font-weight: 700; margin: 4px 0 0 0; }
  .proj-title { font-weight: 700; margin: 6px 0 2px 0; }
  .exp-company { margin: 0 0 2px 0; }
  .hl-company { font-weight: 700; margin: 8px 0 0 0; }
  .hl-title { font-style: italic; margin: 0 0 2px 0; }
  .contact-line { margin: 2px 0; font-size: 0.95em; }
  .sidebar-grid { width: 100%; border-collapse: collapse; }
  .sidebar-grid .col-side { width: 34%; vertical-align: top; padding-right: 16px; border-right: 0.5pt solid #c8b89f; }
  .sidebar-grid .col-main { width: 66%; vertical-align: top; padding-left: 16px; }
  .demo_6 .resume-section-h:first-child, .col-side .resume-section-h:first-child, .col-main .resume-section-h:first-child { margin-top: 0; }
</style>
</head>
<body>
<div class="preview-frame ${state.template}">${combined}</div>
</body>
</html>`;
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.className = "hidden";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function downloadDoc() {
  const filename = `${slugFileName(state.name)}-${state.template}.doc`;
  downloadBlob(buildExportDocument(), filename, "application/msword;charset=utf-8");
  toast("DOC DOWNLOADED");
}

function printPDF() {
  renderPreview();
  toast("PRINT DIALOG OPENING");
  setTimeout(() => window.print(), 100);
}

// ─────────────────────────────────────────────────────────
// REAL PDF EXPORT (phase 4)
// Walks `state` and emits a vector PDF via vendor/pdf-writer.js.
// ─────────────────────────────────────────────────────────

function buildResumePdfBytes() {
  if (!global_RcPdf()) throw new Error("PDF writer not loaded");
  const tpl = state.template;
  const cfg = tcfg(tpl);
  const fontPt = state.font_pt || cfg.bodyPt;
  const NAME_PT = cfg.namePt;
  const SECTION_PT = cfg.sectionPt;
  const CONTACT_PT = 9;
  const BODY_PT = fontPt;

  const doc = new (global_RcPdf()).Doc({ marginL: 54, marginR: 54, marginT: 40, marginB: 40 });
  if (typeof doc.setFamily === "function") doc.setFamily(FONT_FAMILIES[fontFamilyKey()].pdf);
  doc.lineH = 1.22;
  const contentW = doc.contentWidth();
  const xLeft = doc.marginL;
  const xRight = doc.pageW - doc.marginR;

  if (cfg.layout === "sidebar") {
    pdfBuildSidebar(doc, cfg, BODY_PT, SECTION_PT, contentW, xLeft, xRight);
    return doc.build({ title: `${state.name || "Resume"} — Resume`, author: state.name || "" });
  }

  // ── Header (name + contact) ─────────────────────────────────────────────
  doc.setFont("Times-Bold", NAME_PT);
  doc.ensure(NAME_PT * 1.1);
  doc.advance(NAME_PT * 0.85);
  doc.textCentered(state.name || "—", doc._cur.y);
  doc.advance(NAME_PT * 0.55);

  doc.setFont("Times-Roman", CONTACT_PT);
  if (tpl === "demo_4") {
    const extraLinks = (state.links || []).filter(Boolean).join(" | ");
    const parts = [state.location, state.phone, state.email, state.linkedin, extraLinks].filter(Boolean);
    pdfWrapCentered(doc, parts.join("  |  "), contentW);
    doc.advance(2);
    doc.hline(xLeft, xRight, doc._cur.y, 0.5);
    doc.advance(8);
  } else {
    pdfWrapCentered(doc, state.contact_line1, contentW);
    pdfWrapCentered(doc, state.contact_line2, contentW);
    doc.advance(2);
    doc.hline(xLeft, xRight, doc._cur.y, 0.5);
    doc.advance(8);
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  if (state.section_enabled.summary !== false && (state.summary || "").trim()) {
    pdfSectionHeader(doc, cfg.labels.summary, SECTION_PT, tpl);
    doc.setFont("Times-Roman", BODY_PT);
    doc.wrap(state.summary, xLeft, doc._cur.y, contentW);
    doc.advance(2);
  }

  // ── Sections in user-defined order ──────────────────────────────────────
  const order = state.section_order[tpl] || [];
  const renderers = {
    education: () => pdfRenderEducation(doc, BODY_PT, SECTION_PT, tpl, contentW, xLeft, xRight),
    skills:    () => pdfRenderSkills(doc, BODY_PT, SECTION_PT, tpl, contentW, xLeft, xRight),
    certs:     () => pdfRenderCerts(doc, BODY_PT, SECTION_PT, tpl, contentW, xLeft, xRight),
    projects:  () => state.section_enabled.projects !== false && pdfRenderProjects(doc, BODY_PT, SECTION_PT, tpl, contentW, xLeft, xRight),
    experience:() => state.section_enabled.experience !== false && pdfRenderExperience(doc, BODY_PT, SECTION_PT, tpl, contentW, xLeft, xRight),
  };
  for (const sec of order) {
    const fn = renderers[sec];
    if (fn) fn();
  }

  return doc.build({ title: `${state.name || "Resume"} — Resume`, author: state.name || "" });
}

// Column-local section header: bold label + an underline only as wide as the column.
function pdfColHeader(doc, label, sizePt, x, w) {
  doc.advance(6);
  doc.ensure(sizePt * 1.2 + 6);
  doc.setFont("Times-Bold", sizePt);
  doc.text(label, x, doc._cur.y);
  doc.advance(2);
  doc.hline(x, x + w, doc._cur.y, 0.5);
  doc.advance(6);
}

// Two-column sidebar layout (demo_6). Renders the side column, resets the
// cursor to the top, then renders the main column beside it, with a divider.
function pdfBuildSidebar(doc, cfg, bodyPt, sectionPt, contentW, xLeft, xRight) {
  const NAME_PT = cfg.namePt;
  // ── Header: name + professional title, centered, full width ──
  doc.setFont("Times-Bold", NAME_PT);
  doc.ensure(NAME_PT * 1.1);
  doc.advance(NAME_PT * 0.85);
  doc.textCentered(state.name || "—", doc._cur.y);
  doc.advance(NAME_PT * 0.5);
  if (state.professional_title) {
    doc.setFont("Times-Roman", 11);
    doc.textCentered(String(state.professional_title).toUpperCase(), doc._cur.y);
    doc.advance(11 * 1.5);
  }
  doc.hline(xLeft, xRight, doc._cur.y, 0.5);
  doc.advance(10);

  const colGap = 22;
  const sideW = Math.round(contentW * 0.34);
  const mainW = contentW - sideW - colGap;
  const sideX = xLeft;
  const mainX = xLeft + sideW + colGap;
  const topY = doc._cur.y;

  // ── Side column: contact, education, key skills ──
  doc._cur.y = topY;
  pdfColHeader(doc, cfg.labels.contact, sectionPt, sideX, sideW);
  doc.setFont("Times-Roman", 9);
  // Emoji icons can't be encoded by the Times/WinAnsi font set, so labels are plain text.
  [state.phone, state.email, state.location, state.linkedin].filter(Boolean).forEach(line => {
    doc.wrap(line, sideX, doc._cur.y, sideW);
  });

  const eduItems = (state.education || []).filter(e => e.school || e.degree);
  if (eduItems.length) {
    pdfColHeader(doc, cfg.labels.education, sectionPt, sideX, sideW);
    doc.setFont("Times-Roman", bodyPt);
    eduItems.forEach((e, i) => {
      if (i > 0) doc.advance(3);
      const head = [e.school, e.date ? `(${e.date})` : ""].filter(Boolean).join(" ");
      const full = head + (e.degree ? ` — ${e.degree}` : "");
      doc.wrap(full, sideX, doc._cur.y, sideW);
    });
  }

  const skillItems = [];
  (state.skills_two_column || []).forEach(r => { if (r.left) skillItems.push(r.left); if (r.right) skillItems.push(r.right); });
  if (skillItems.length) {
    pdfColHeader(doc, cfg.labels.skills, sectionPt, sideX, sideW);
    doc.setFont("Times-Roman", bodyPt);
    skillItems.forEach(s => doc.bullet(s, sideX, sideW));
  }
  const sideEndY = doc._cur.y;

  // ── Main column: about me, career highlights ──
  doc._cur.y = topY;
  if (state.section_enabled.summary !== false && (state.summary || "").trim()) {
    pdfColHeader(doc, cfg.labels.summary, sectionPt, mainX, mainW);
    doc.setFont("Times-Roman", bodyPt);
    doc.wrap(state.summary, mainX, doc._cur.y, mainW);
  }
  const expItems = (state.experience || []).filter(e => e.title || (e.bullets || []).some(Boolean));
  if (state.section_enabled.experience !== false && expItems.length) {
    pdfColHeader(doc, cfg.labels.experience, sectionPt, mainX, mainW);
    const lineH = bodyPt * 1.2;
    expItems.forEach((e, i) => {
      if (i > 0) doc.advance(5);
      const head = [e.company_city, e.date].filter(Boolean).join(" | ");
      if (head) {
        doc.setFont("Times-Bold", bodyPt);
        doc.wrap(head, mainX, doc._cur.y, mainW);
      }
      if (e.title) {
        doc.setFont("Times-Italic", bodyPt);
        doc.ensure(lineH);
        doc.text(e.title, mainX, doc._cur.y);
        doc.advance(lineH);
      }
      doc.setFont("Times-Roman", bodyPt);
      (e.bullets || []).filter(Boolean).forEach(b => doc.bullet(b, mainX, mainW));
    });
  }
  const mainEndY = doc._cur.y;

  // ── Vertical divider between the two columns ──
  const divX = xLeft + sideW + colGap / 2;
  const botY = Math.min(sideEndY, mainEndY);
  if (botY < topY) doc._cur.ops.push(`q 0.5 w ${divX} ${topY} m ${divX} ${botY} l S Q`);
}

function global_RcPdf() {
  return (typeof window !== "undefined") ? window.RcPdf : null;
}

function pdfWrapCentered(doc, str, width) {
  if (!str) return;
  const words = String(str).split(/\s+/).filter(Boolean);
  if (words.length === 0) return;
  const lineH = doc.size * doc.lineH;
  let line = "";
  const linesOut = [];
  for (let i = 0; i < words.length; i++) {
    const next = line ? line + " " + words[i] : words[i];
    if (global_RcPdf().measure(doc.font, doc.size, next) > width && line) {
      linesOut.push(line);
      line = words[i];
    } else {
      line = next;
    }
  }
  if (line) linesOut.push(line);
  for (const l of linesOut) {
    doc.ensure(lineH);
    doc.textCentered(l, doc._cur.y);
    doc.advance(lineH);
  }
}

function pdfSectionHeader(doc, label, sizePt, tpl) {
  const lineH = sizePt * 1.2;
  doc.advance(8);
  doc.ensure(lineH + 6);
  doc.setFont("Times-Bold", sizePt);
  // Labels carry their own casing from the template config.
  doc.text(label, doc.marginL, doc._cur.y);
  doc.advance(2);
  doc.hline(doc.marginL, doc.pageW - doc.marginR, doc._cur.y, 0.5);
  doc.advance(6);
}

function pdfRenderCoursework(doc, e, bodyPt, contentW, xLeft) {
  if (!e.coursework) return;
  const lineH = bodyPt * 1.2;
  doc.setFont("Times-Bold", bodyPt);
  const labelW = global_RcPdf().measure("Times-Bold", bodyPt, "Relevant Coursework: ");
  doc.ensure(lineH);
  doc.text("Relevant Coursework: ", xLeft, doc._cur.y);
  doc.setFont("Times-Roman", bodyPt);
  doc.wrap(e.coursework, xLeft + labelW, doc._cur.y, contentW - labelW);
}

function pdfRenderEducation(doc, bodyPt, sectionPt, tpl, contentW, xLeft, xRight) {
  const cfg = tcfg(tpl);
  const mode = cfg.eduMode;
  const items = (state.education || []).filter(e => (e.school || e.degree));
  if (items.length === 0) return;
  pdfSectionHeader(doc, cfg.labels.education, sectionPt, tpl);
  doc.setFont("Times-Roman", bodyPt);
  const lineH = bodyPt * 1.2;
  items.forEach((e, idx) => {
    if (idx > 0) doc.advance(4);
    if (mode === "demo4") {
      // Row 1: school (bold) left, city right.
      doc.ensure(lineH);
      doc.setFont("Times-Bold", bodyPt);
      doc.text(e.school || "", xLeft, doc._cur.y);
      if (e.city) doc.textRight(e.city, xRight, doc._cur.y);
      doc.advance(lineH);
      // Row 2: degree (regular) left, date right.
      doc.ensure(lineH);
      doc.setFont("Times-Roman", bodyPt);
      doc.text(e.degree || "", xLeft, doc._cur.y);
      if (e.date) {
        doc.setFont("Times-Bold", bodyPt);
        doc.textRight(e.date, xRight, doc._cur.y);
        doc.setFont("Times-Roman", bodyPt);
      }
      doc.advance(lineH);
    } else if (mode === "demo5") {
      // Degree (bold) on its own line, then "school │ city │ date" plain subline.
      doc.ensure(lineH);
      doc.setFont("Times-Bold", bodyPt);
      doc.text(e.degree || "", xLeft, doc._cur.y);
      doc.advance(lineH);
      const sub = [e.school, e.city, e.date].filter(Boolean).join(" │ ");
      if (sub) {
        doc.setFont("Times-Roman", bodyPt);
        doc.wrap(sub, xLeft, doc._cur.y, contentW);
      }
      doc.setFont("Times-Roman", bodyPt);
      pdfRenderCoursework(doc, e, bodyPt, contentW, xLeft);
    } else {
      // demo2 / demo1: school+city row 1, degree-row, optional subline + coursework.
      doc.ensure(lineH);
      doc.setFont("Times-Bold", bodyPt);
      doc.text(e.school || "", xLeft, doc._cur.y);
      if (e.city) doc.textRight(e.city, xRight, doc._cur.y);
      doc.advance(lineH);
      doc.ensure(lineH);
      // demo2 bolds the degree row; demo1 keeps it regular weight.
      doc.setFont(mode === "demo1" ? "Times-Roman" : "Times-Bold", bodyPt);
      doc.text(e.degree || "", xLeft, doc._cur.y);
      if (e.date) {
        if (mode === "demo1") doc.setFont("Times-Bold", bodyPt);
        doc.textRight(e.date, xRight, doc._cur.y);
      }
      doc.advance(lineH);
      doc.setFont("Times-Roman", bodyPt);
      if (e.subline_bold || e.subline_rest) {
        doc.ensure(lineH);
        let x = xLeft;
        if (e.subline_bold) {
          doc.setFont("Times-Bold", bodyPt);
          doc.text(e.subline_bold + (e.subline_rest ? " " : ""), x, doc._cur.y);
          x += global_RcPdf().measure("Times-Bold", bodyPt, e.subline_bold + (e.subline_rest ? " " : ""));
          doc.setFont("Times-Roman", bodyPt);
        }
        if (e.subline_rest) doc.text(e.subline_rest, x, doc._cur.y);
        doc.advance(lineH);
      }
      pdfRenderCoursework(doc, e, bodyPt, contentW, xLeft);
    }
  });
}

function pdfRenderSkills(doc, bodyPt, sectionPt, tpl, contentW, xLeft, xRight) {
  const cfg = tcfg(tpl);
  if (cfg.skillsMode === "categories") {
    const cats = (state.skills_categories || []).filter(c => c.label || c.content);
    if (cats.length === 0) return;
    pdfSectionHeader(doc, cfg.labels.skills, sectionPt, tpl);
    doc.setFont("Times-Roman", bodyPt);
    cats.forEach((c) => {
      const lineH = bodyPt * 1.2;
      const labelText = (c.label || "") + ": ";
      doc.setFont("Times-Bold", bodyPt);
      const labelW = global_RcPdf().measure("Times-Bold", bodyPt, labelText);
      doc.ensure(lineH);
      doc.text(labelText, xLeft, doc._cur.y);
      doc.setFont("Times-Roman", bodyPt);
      // Place the content starting after the label; wrap will hang under the label.
      const yBefore = doc._cur.y;
      doc.text(truncateToWidth(doc, c.content || "", contentW - labelW), xLeft + labelW, yBefore);
      doc.advance(lineH);
      // If content overflowed one line, wrap the remainder underneath.
      const fits = global_RcPdf().measure("Times-Roman", bodyPt, c.content || "") <= contentW - labelW;
      if (!fits) {
        const remainder = remainderAfterFit(doc, c.content || "", contentW - labelW);
        if (remainder) doc.wrap(remainder, xLeft, doc._cur.y, contentW);
      }
    });
  } else if (cfg.skillsMode === "pipe") {
    const line = (state.skills_inline || "").trim();
    if (!line) return;
    pdfSectionHeader(doc, cfg.labels.skills, sectionPt, tpl);
    doc.setFont("Times-Roman", bodyPt);
    doc.wrap(line, xLeft, doc._cur.y, contentW);
  } else {
    const rows = (state.skills_two_column || []).filter(r => r.left || r.right);
    if (rows.length === 0) return;
    pdfSectionHeader(doc, cfg.labels.skills, sectionPt, tpl);
    doc.setFont("Times-Roman", bodyPt);
    const colW = (contentW - 24) / 2;
    const colLx = xLeft;
    const colRx = xLeft + colW + 24;
    rows.forEach((r) => {
      const lineH = bodyPt * 1.2;
      doc.ensure(lineH);
      if (r.left) doc.text("• " + r.left, colLx, doc._cur.y);
      if (r.right) doc.text("• " + r.right, colRx, doc._cur.y);
      doc.advance(lineH);
    });
  }
}

function truncateToWidth(doc, str, width) {
  if (!str) return "";
  if (global_RcPdf().measure(doc.font, doc.size, str) <= width) return str;
  // Walk words until adding the next would overflow.
  const words = str.split(/\s+/);
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const next = line ? line + " " + words[i] : words[i];
    if (global_RcPdf().measure(doc.font, doc.size, next) > width) break;
    line = next;
  }
  return line;
}

function remainderAfterFit(doc, str, width) {
  const head = truncateToWidth(doc, str, width);
  if (head === str) return "";
  // Slice off the leading text + the joining whitespace.
  let rest = str.slice(head.length);
  while (rest.length && /\s/.test(rest[0])) rest = rest.slice(1);
  return rest;
}

function pdfRenderCerts(doc, bodyPt, sectionPt, tpl, contentW, xLeft) {
  const items = (state.certifications || []).filter(Boolean);
  if (items.length === 0) return;
  pdfSectionHeader(doc, tcfg(tpl).labels.certs, sectionPt, tpl);
  doc.setFont("Times-Roman", bodyPt);
  items.forEach((c) => doc.bullet(c, xLeft, contentW));
}

function pdfRenderProjects(doc, bodyPt, sectionPt, tpl, contentW, xLeft, xRight) {
  const cfg = tcfg(tpl);
  const items = (state.projects || []).filter(p => p.title || (p.bullets || []).some(Boolean));
  if (items.length === 0) return;
  pdfSectionHeader(doc, cfg.labels.projects, sectionPt, tpl);
  const lineH = bodyPt * 1.2;
  items.forEach((p, idx) => {
    if (idx > 0) doc.advance(4);
    const bullets = (p.bullets || []).filter(Boolean);
    if (cfg.projMode === "paragraph_inline") {
      // demo5: "Title: description" — bold title + colon, then description paragraphs.
      const first = bullets.shift() || "";
      doc.setFont("Times-Bold", bodyPt);
      const labelText = (p.title || "") + ": ";
      const labelW = global_RcPdf().measure("Times-Bold", bodyPt, labelText);
      doc.ensure(lineH);
      doc.text(labelText, xLeft, doc._cur.y);
      doc.setFont("Times-Roman", bodyPt);
      doc.text(truncateToWidth(doc, first, contentW - labelW), xLeft + labelW, doc._cur.y);
      doc.advance(lineH);
      const fits = global_RcPdf().measure("Times-Roman", bodyPt, first) <= contentW - labelW;
      if (!fits) {
        const rem = remainderAfterFit(doc, first, contentW - labelW);
        if (rem) doc.wrap(rem, xLeft, doc._cur.y, contentW);
      }
      bullets.forEach((b) => doc.wrap(b, xLeft, doc._cur.y, contentW));
    } else if (cfg.projMode === "paragraph") {
      // demo1: bold title line, then plain description paragraphs (no bullets).
      doc.setFont("Times-Bold", bodyPt);
      doc.ensure(lineH);
      doc.text(p.title || "", xLeft, doc._cur.y);
      doc.advance(lineH);
      doc.setFont("Times-Roman", bodyPt);
      bullets.forEach((b) => doc.wrap(b, xLeft, doc._cur.y, contentW));
    } else if (cfg.projMode === "dated") {
      pdfEntryBlock(doc, bodyPt, contentW, xLeft, xRight, p, tpl, "italic");
    } else {
      // demo2: bold title line, then bullets (no date).
      doc.setFont("Times-Bold", bodyPt);
      doc.ensure(lineH);
      doc.text(p.title || "", xLeft, doc._cur.y);
      doc.advance(lineH);
      doc.setFont("Times-Roman", bodyPt);
      bullets.forEach((b) => doc.bullet(b, xLeft, contentW));
    }
  });
}

function pdfRenderExperience(doc, bodyPt, sectionPt, tpl, contentW, xLeft, xRight) {
  const cfg = tcfg(tpl);
  const items = (state.experience || []).filter(e => e.title || (e.bullets || []).some(Boolean));
  if (items.length === 0) return;
  pdfSectionHeader(doc, cfg.labels.experience, sectionPt, tpl);
  items.forEach((e, idx) => {
    if (idx > 0) doc.advance(4);
    pdfEntryBlock(doc, bodyPt, contentW, xLeft, xRight, e, tpl, cfg.expMode);
  });
}

function pdfEntryBlock(doc, bodyPt, contentW, xLeft, xRight, entry, tpl, mode) {
  const lineH = bodyPt * 1.2;
  doc.setFont("Times-Bold", bodyPt);
  doc.ensure(lineH);
  doc.text(entry.title || "", xLeft, doc._cur.y);
  if (entry.date) doc.textRight(entry.date, xRight, doc._cur.y);
  doc.advance(lineH);
  // Subline: italic location (demo4) or plain company · city line (others).
  const subline = mode === "italic" ? entry.location : (entry.company_city || entry.location);
  if (subline) {
    doc.setFont(mode === "italic" ? "Times-Italic" : "Times-Roman", bodyPt);
    doc.ensure(lineH);
    doc.text(subline, xLeft, doc._cur.y);
    doc.advance(lineH);
  }
  doc.setFont("Times-Roman", bodyPt);
  (entry.bullets || []).filter(Boolean).forEach((b) => doc.bullet(b, xLeft, contentW));
}

function downloadPdf() {
  try {
    const bytes = buildResumePdfBytes();
    const filename = `${slugFileName(state.name)}-${state.template}.pdf`;
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.className = "hidden";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    toast("PDF DOWNLOADED");
  } catch (err) {
    toast("PDF EXPORT FAILED — TRY PRINT");
    // Keep diagnostic in console for debugging without leaking to the UI.
    if (typeof console !== "undefined") console.error(err);
  }
}

// ─────────────────────────────────────────────────────────
// SHARE + QR (phase 5)
// ─────────────────────────────────────────────────────────

function buildVCard() {
  // Strip any leading "mailto:" or "tel:" the user might have pasted in.
  const clean = (s) => String(s || "").trim().replace(/^(mailto:|tel:)/i, "");
  const name = clean(state.name);
  const email = clean(state.email) || pickContactPart(state.contact_line2, /[\w.+-]+@[\w.-]+/);
  const phone = clean(state.phone) || pickContactPart(state.contact_line1, /[+\d][\d().\s-]{7,}/);
  const location = clean(state.location) || pickContactPart(state.contact_line1, /^[^|()]+/);
  const linkedin = clean(state.linkedin) || pickContactPart(state.contact_line2, /linkedin\.com\/\S+/i);
  const url = linkedin && !/^https?:/i.test(linkedin) ? `https://${linkedin}` : linkedin;
  // Naive N field — last name = last token, first = the rest.
  const parts = name.split(/\s+/).filter(Boolean);
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : (parts[0] || "");
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  if (name) lines.push(`N:${vCardEscape(last)};${vCardEscape(first)};;;`);
  if (name) lines.push(`FN:${vCardEscape(name)}`);
  if (phone) lines.push(`TEL;TYPE=CELL:${vCardEscape(phone)}`);
  if (email) lines.push(`EMAIL;TYPE=INTERNET:${vCardEscape(email)}`);
  if (url) lines.push(`URL:${vCardEscape(url)}`);
  if (location) lines.push(`ADR;TYPE=HOME:;;${vCardEscape(location)};;;;`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

function pickContactPart(line, re) {
  if (!line) return "";
  const m = String(line).match(re);
  return m ? m[0].trim().replace(/[|,]+$/, "").trim() : "";
}

function vCardEscape(s) {
  return String(s || "").replace(/[\\,;]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
}

function openShareModal() {
  const bg = $("#share-modal-bg");
  if (!bg) return;
  bg.classList.add("show");
  renderShareModal();
}

function closeShareModal() {
  const bg = $("#share-modal-bg");
  if (bg) bg.classList.remove("show");
}

function renderShareModal() {
  const frame = $("#qr-frame");
  const preview = $("#vcard-preview");
  const qrFallback = $("#share-qr-fallback");
  const pdfFallback = $("#share-pdf-fallback");
  const shareBtn = $("#share-pdf-btn");

  // vCard preview text
  const vcard = buildVCard();
  if (preview) preview.textContent = vcard;

  // QR render — depends on vendor/qr.js
  if (frame) {
    frame.innerHTML = "";
    if (window.RcQr) {
      try {
        const r = window.RcQr.encode(vcard, "M");
        frame.innerHTML = window.RcQr.toSvg(r.modules, { scale: 6, margin: 3 });
        if (qrFallback) qrFallback.hidden = true;
      } catch (err) {
        frame.innerHTML = `<div class="qr-empty">CONTACT TOO LONG — clear extra fields</div>`;
        if (typeof console !== "undefined") console.error(err);
      }
    } else {
      frame.innerHTML = `<div class="qr-empty">QR not loaded</div>`;
      if (qrFallback) qrFallback.hidden = false;
    }
  }

  // Web Share API availability — checked at open time, not at load,
  // because canShare needs a File instance to evaluate correctly.
  if (shareBtn && pdfFallback) {
    const supported = typeof navigator !== "undefined" && typeof navigator.share === "function";
    if (!supported) {
      shareBtn.disabled = true;
      pdfFallback.hidden = false;
    } else {
      shareBtn.disabled = false;
      pdfFallback.hidden = true;
    }
  }
}

// ─────────────────────────────────────────────────────────
// VOICE DICTATION (phase 6)
// Uses the Web Speech API to transcribe directly into bullet/summary fields.
// Feature-detected at first use; hidden gracefully where unsupported.
// ─────────────────────────────────────────────────────────

let _recognition = null;
let _recordingTarget = null;
let _baseValue = "";
// Snapshot of _baseValue from before the last appended chunk so "scratch that"
// can undo the most recent thing the user dictated.
let _lastBaseSnapshot = "";

function getSpeechCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function isSpeechSupported() {
  return !!getSpeechCtor();
}

function ensureRecognition() {
  if (_recognition) return _recognition;
  const Ctor = getSpeechCtor();
  if (!Ctor) return null;
  const r = new Ctor();
  r.continuous = true;
  r.interimResults = true;
  r.lang = (navigator.language || "en-US");
  r.onresult = (ev) => {
    if (!_recordingTarget) return;
    let interim = "";
    let final = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const res = ev.results[i];
      if (res.isFinal) final += res[0].transcript;
      else interim += res[0].transcript;
    }
    if (final) {
      const segments = processVoiceCommands(final, _recordingTarget);
      applyVoiceSegments(segments);
    }
    if (interim && _recordingTarget) {
      writeToMicTarget(_recordingTarget, appendDictation(_baseValue, interim));
    }
    // Silence-based auto-stop for the voice-intro recorder: reset on every chunk.
    if (_recordingTarget === "voiceProfile" && (interim || final)) armVoiceSilenceTimer();
  };
  r.onerror = (ev) => {
    if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
      toast("MIC BLOCKED — CHECK PERMISSIONS");
    } else if (ev.error === "no-speech") {
      // Silent — recognition restarts on its own in continuous mode.
      return;
    } else {
      toast(`MIC ERROR — ${String(ev.error || "").toUpperCase()}`);
    }
    stopDictation();
  };
  r.onend = () => {
    // If we ended without an explicit stop, surface the change anyway.
    if (_recordingTarget) finalizeDictation();
  };
  _recognition = r;
  return r;
}

function appendDictation(base, addition) {
  const b = (base || "").replace(/\s+$/, "");
  const a = (addition || "").replace(/^\s+/, "");
  if (!b) return a;
  if (!a) return b;
  return `${b} ${a}`;
}

// ── Inline voice commands ──────────────────────────────────────────────────
// Recognised at the *end* of a final transcript chunk: punctuation
// ("period", "comma"), structural moves ("new bullet"), edit corrections
// ("scratch that"), and session control ("stop listening"). Phrases that
// only make sense in some contexts (e.g. "new bullet" outside a bullet
// field) are ignored and pass through as literal text.
const VOICE_COMMANDS = [
  { re: /\b(scratch|delete|cancel|forget)\s+that\b/i, op: "scratchThat" },
  { re: /\b(new|next)\s+(bullet|point|line\s+item)\b/i, op: "newBullet", needs: ["projBullet", "expBullet"] },
  { re: /\b(stop|end)\s+(dictation|listening|recording)\b/i, op: "stopDictation" },
  { re: /\b(new\s+line|new\s+paragraph|line\s+break)\b/i, op: "newLine" },
  { re: /\bquestion\s+mark\b/i, op: "punct", char: "?" },
  { re: /\bexclamation\s+(mark|point)\b/i, op: "punct", char: "!" },
  { re: /\bperiod\b|\bfull\s+stop\b/i, op: "punct", char: "." },
  { re: /\bcomma\b/i, op: "punct", char: "," },
  { re: /\bcolon\b/i, op: "punct", char: ":" },
  { re: /\bsemi[-\s]?colon\b/i, op: "punct", char: ";" },
];

function commandAppliesToTarget(cmd, target) {
  if (!cmd.needs) return true;
  if (!target) return false;
  const kind = target.split(":")[0];
  return cmd.needs.includes(kind);
}

function processVoiceCommands(text, target) {
  const segments = [];
  let remaining = text;
  // Iteratively peel off the earliest command match; intervening prose
  // becomes text segments, recognised commands become command segments.
  while (remaining) {
    let best = null;
    for (const c of VOICE_COMMANDS) {
      if (!commandAppliesToTarget(c, target)) continue;
      const m = c.re.exec(remaining);
      if (!m) continue;
      if (!best || m.index < best.match.index) best = { cmd: c, match: m };
    }
    if (!best) { segments.push({ text: remaining }); break; }
    const pre = remaining.slice(0, best.match.index);
    if (pre) segments.push({ text: pre });
    segments.push({ command: best.cmd.op, char: best.cmd.char });
    remaining = remaining.slice(best.match.index + best.match[0].length);
  }
  return segments;
}

function applyVoiceSegments(segments) {
  for (let i = 0; i < segments.length; i++) {
    if (!_recordingTarget) break;
    const seg = segments[i];
    if (seg.text) {
      _lastBaseSnapshot = _baseValue;
      _baseValue = appendDictation(_baseValue, seg.text);
      writeToMicTarget(_recordingTarget, _baseValue);
      continue;
    }
    if (seg.command === "newBullet") {
      // Hand the remaining segments to the bullet-switcher so anything the
      // user said *after* "new bullet" lands in the freshly created bullet.
      newBulletDuringDictation(segments.slice(i + 1));
      return;
    }
    if (seg.command) executeVoiceCommand(seg.command, seg.char);
  }
}

function executeVoiceCommand(op, char) {
  if (!_recordingTarget) return;
  switch (op) {
    case "scratchThat": {
      _baseValue = _lastBaseSnapshot;
      writeToMicTarget(_recordingTarget, _baseValue);
      toast("✓ SCRATCHED");
      return;
    }
    case "punct": {
      _lastBaseSnapshot = _baseValue;
      _baseValue = _baseValue.replace(/\s+$/, "") + (char || ".");
      writeToMicTarget(_recordingTarget, _baseValue);
      return;
    }
    case "newLine": {
      _lastBaseSnapshot = _baseValue;
      _baseValue = _baseValue.replace(/\s+$/, "") + "\n";
      writeToMicTarget(_recordingTarget, _baseValue);
      return;
    }
    case "stopDictation": {
      if (_recordingTarget === "voiceProfile") stopVoiceRecording();
      else stopDictation();
      return;
    }
  }
}

// "new bullet" in a project/experience bullet: stash current text, splice an
// empty bullet right after the current one, re-render, and resume dictation
// on the freshly created bullet. SpeechRecognition.start() can throw
// InvalidStateError if called during the previous engine's teardown, so we
// defer the restart by a tick. Any segments the user spoke after "new bullet"
// are replayed into the new bullet once dictation resumes.
function newBulletDuringDictation(remainingSegments) {
  const target = _recordingTarget;
  if (!target) return;
  const parts = target.split(":");
  const kind = parts[0];
  if (kind !== "projBullet" && kind !== "expBullet") return;
  const i = +parts[1], bi = +parts[2];
  const arr = kind === "projBullet" ? state.projects[i]?.bullets : state.experience[i]?.bullets;
  if (!arr) return;
  stopDictation();
  arr.splice(bi + 1, 0, "");
  render();
  const nextTarget = `${kind}:${i}:${bi + 1}`;
  toast("✓ NEW BULLET");
  setTimeout(() => {
    startDictation(nextTarget);
    if (_recordingTarget === nextTarget && remainingSegments && remainingSegments.length) {
      applyVoiceSegments(remainingSegments);
    }
  }, 140);
}

function findMicButton(targetId) {
  return document.querySelector(`.mic-btn[data-mic-target="${cssEscape(targetId)}"]`);
}

function findMicField(targetId) {
  if (targetId === "voiceProfile") return $("#voice-transcript");
  if (targetId === "summary") return $("#summary");
  const parts = targetId.split(":");
  if (parts[0] === "projBullet") return document.querySelector(`textarea[data-proj-bullet="${+parts[1]}"][data-bullet-i="${+parts[2]}"]`);
  if (parts[0] === "expBullet")  return document.querySelector(`textarea[data-exp-bullet="${+parts[1]}"][data-bullet-i="${+parts[2]}"]`);
  return null;
}

function cssEscape(s) {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(s);
  return String(s).replace(/["\\]/g, "\\$&");
}

function writeToMicTarget(targetId, value) {
  const el = findMicField(targetId);
  if (!el) return;
  el.value = value;
  // Mirror into state by reusing the existing input handlers' logic.
  syncMicTargetIntoState(targetId, value);
  // The voice profile only flavors generation — it isn't shown in the preview,
  // so skip the (otherwise per-word) re-render for it.
  if (targetId !== "voiceProfile") renderPreview();
}

function syncMicTargetIntoState(targetId, value) {
  if (targetId === "voiceProfile") { state.voice_profile = value; return; }
  if (targetId === "summary") { state.summary = value; return; }
  const parts = targetId.split(":");
  const i = +parts[1], bi = +parts[2];
  if (parts[0] === "projBullet" && state.projects[i]) {
    state.projects[i].bullets[bi] = value;
  } else if (parts[0] === "expBullet" && state.experience[i]) {
    state.experience[i].bullets[bi] = value;
  }
}

function startDictation(targetId) {
  if (!isSpeechSupported()) {
    toast("VOICE INPUT NOT SUPPORTED ON THIS BROWSER");
    return;
  }
  if (_recordingTarget) stopDictation();
  const r = ensureRecognition();
  if (!r) return;
  const field = findMicField(targetId);
  if (!field) return;
  _recordingTarget = targetId;
  _baseValue = field.value || "";
  _lastBaseSnapshot = _baseValue;
  try {
    r.start();
  } catch (_err) {
    // start() while already started throws InvalidStateError — best-effort restart.
    try { r.stop(); setTimeout(() => r.start(), 50); } catch (_e) { /* give up */ }
  }
  const btn = findMicButton(targetId);
  if (btn) { btn.classList.add("recording"); btn.setAttribute("aria-pressed", "true"); }
  if (targetId === "summary") {
    const hint = $("#mic-hint-summary");
    if (hint) hint.classList.add("show");
  }
  setVoiceFabState(true, targetId);
  toast("LISTENING… TAP MIC TO STOP");
}

function stopDictation() {
  if (_recognition && _recordingTarget) {
    try { _recognition.stop(); } catch (_err) { /* ignore */ }
  }
  finalizeDictation();
}

function finalizeDictation() {
  const targetId = _recordingTarget;
  _recordingTarget = null;
  _baseValue = "";
  setVoiceFabState(false);
  if (targetId === "voiceProfile") {
    clearVoiceTimers();
    setVoiceButtonState(false);
    const words = (state.voice_profile || "").trim().split(/\s+/).filter(Boolean).length;
    updateVoiceStatus(words ? `Captured ${words} word${words === 1 ? "" : "s"} — edit freely below.` : "");
    return;
  }
  if (targetId) {
    const btn = findMicButton(targetId);
    if (btn) { btn.classList.remove("recording"); btn.setAttribute("aria-pressed", "false"); }
  }
  const hint = $("#mic-hint-summary");
  if (hint) hint.classList.remove("show");
}

// ── Voice personality recorder ──────────────────────────────────────────────
// Reuses the SpeechRecognition engine (target "voiceProfile"). Stops on ~2s
// of silence after the user starts speaking; a hard safety cap keeps the
// recorder from running indefinitely if the API never fires events.
// Only the transcribed text is kept; raw audio is never stored.
let _voiceStopTimer = null;
let _voiceTick = null;
let _voiceSilenceTimer = null;
let _voiceStartedAt = 0;
const VOICE_SAFETY_CAP_SECONDS = 90;
const VOICE_SILENCE_MS = 2000;

function voiceToggle() {
  if (_recordingTarget === "voiceProfile") { stopVoiceRecording(); return; }
  if (!isSpeechSupported()) {
    toast("VOICE INPUT NOT SUPPORTED — TYPE YOUR INTRO BELOW");
    return;
  }
  markVoiceIntroSeen();
  startDictation("voiceProfile");
  if (_recordingTarget !== "voiceProfile") return; // start failed (e.g. mic blocked)
  setVoiceButtonState(true);
  _voiceStartedAt = Date.now();
  updateVoiceStatus("● Listening… speak naturally");
  _voiceTick = setInterval(() => {
    const elapsed = Math.floor((Date.now() - _voiceStartedAt) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(1, "0");
    const ss = String(elapsed % 60).padStart(2, "0");
    updateVoiceStatus(`● Listening… ${mm}:${ss} — pause to stop`);
    if (elapsed >= VOICE_SAFETY_CAP_SECONDS) stopVoiceRecording();
  }, 1000);
  _voiceStopTimer = setTimeout(stopVoiceRecording, VOICE_SAFETY_CAP_SECONDS * 1000);
}

function armVoiceSilenceTimer() {
  if (_voiceSilenceTimer) clearTimeout(_voiceSilenceTimer);
  _voiceSilenceTimer = setTimeout(stopVoiceRecording, VOICE_SILENCE_MS);
}

function stopVoiceRecording() {
  clearVoiceTimers();
  stopDictation(); // → finalizeDictation resets the button + status
}

function clearVoiceTimers() {
  if (_voiceStopTimer) { clearTimeout(_voiceStopTimer); _voiceStopTimer = null; }
  if (_voiceTick) { clearInterval(_voiceTick); _voiceTick = null; }
  if (_voiceSilenceTimer) { clearTimeout(_voiceSilenceTimer); _voiceSilenceTimer = null; }
}

function setVoiceButtonState(recording) {
  const btn = $("#voice-rec-btn");
  if (!btn) return;
  btn.classList.toggle("recording", recording);
  btn.setAttribute("aria-pressed", recording ? "true" : "false");
  btn.textContent = recording ? "■ STOP RECORDING" : "🎤 START RECORDING";
}

function updateVoiceStatus(msg) {
  const el = $("#voice-status");
  if (el) el.textContent = msg || "";
}

function clearVoice() {
  if (_recordingTarget === "voiceProfile") stopVoiceRecording();
  state.voice_profile = "";
  const ta = $("#voice-transcript");
  if (ta) ta.value = "";
  updateVoiceStatus("");
  const review = $("#voice-review");
  if (review) review.classList.add("hidden");
}

// ── Voice analysis → suggested summary + skills (client-side, heuristic) ─────
// Speech-to-text is noisy, so we only ever *suggest*: the user reviews/edits
// the drafted summary and toggles skill chips before anything is applied.

const VOICE_TRAITS = [
  "Hard-working", "Dependable", "Reliable", "Detail-oriented", "Organized",
  "Motivated", "Driven", "Creative", "Analytical", "Adaptable", "Collaborative",
  "Proactive", "Dedicated", "Passionate", "Ambitious", "Resourceful", "Personable",
  "Professional", "Punctual", "Efficient", "Friendly", "Outgoing", "Confident",
  "Curious", "Persistent", "Charismatic", "Team-oriented", "Self-motivated",
];
// Aliases for words speech-to-text commonly returns or people say casually.
const VOICE_TRAIT_ALIASES = {
  "hardworking": "Hard-working", "hard working": "Hard-working",
  "detail oriented": "Detail-oriented", "self motivated": "Self-motivated",
  "team oriented": "Team-oriented", "dependable": "Dependable",
};
const VOICE_SKILLS = [
  "Customer Service", "Project Management", "Data Entry", "Social Media Management",
  "Social Media", "Data Analysis", "Graphic Design", "Public Speaking", "Time Management",
  "Team Leadership", "Leadership", "Content Creation", "Content Writing", "Copywriting",
  "Digital Marketing", "Email Marketing", "SEO", "Video Editing", "Photography",
  "Problem Solving", "Critical Thinking", "Bookkeeping", "Sales", "Marketing", "Accounting",
  "Research", "Communication", "Written Communication", "Interpersonal Skills", "Teamwork",
  "Collaboration", "Organization", "Multitasking", "Attention to Detail", "Conflict Resolution",
  "Microsoft Excel", "Microsoft Office", "Microsoft Word", "Microsoft Teams", "Google Workspace", "Google Sheets",
  "Google Docs", "Excel", "PowerPoint", "Outlook", "Python", "Java", "JavaScript", "TypeScript", "C++",
  "C#", "SQL", "HTML", "CSS", "R", "Go", "Rust", "Swift", "Kotlin", "Ruby",
  "React", "React Native", "Next.js", "Vue.js", "Svelte", "Astro", "Angular", "Tailwind CSS",
  "Node.js", "Express", "Django", "Flask", "FastAPI", "Ruby on Rails",
  "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Git", "GitHub", "GitLab", "CI/CD", "Linux",
  "Machine Learning", "Deep Learning", "Generative AI", "Prompt Engineering", "LLMs",
  "Canva", "Photoshop", "Illustrator", "InDesign", "Figma", "Sketch", "Adobe XD", "Procreate",
  "Adobe Express", "CapCut", "Premiere Pro", "After Effects", "DaVinci Resolve",
  "Tableau", "Power BI", "Looker", "QuickBooks", "Salesforce",
  "HubSpot", "Mailchimp", "Klaviyo", "WordPress", "Shopify", "Notion", "Slack", "Trello", "Asana",
  "Google Analytics", "Meta Ads Manager", "TikTok Ads", "LinkedIn Ads", "Zoom",
  "Scheduling", "Event Coordination", "Event Planning",
  "Inventory Management", "Cash Handling", "Point of Sale", "Filing", "Recordkeeping",
  "Spanish", "Bilingual", "Tutoring", "Mentoring", "Phone Etiquette", "Front Desk Operations",
];
// How speech-to-text often transcribes a skill → its canonical resume form.
const VOICE_SKILL_ALIASES = {
  "power point": "PowerPoint", "powerpoint": "PowerPoint",
  "java script": "JavaScript", "word press": "WordPress",
  "quick books": "QuickBooks", "cap cut": "CapCut", "in design": "InDesign",
  "power bi": "Power BI", "google analytics": "Google Analytics",
  "people skills": "Interpersonal Skills", "people person": "Interpersonal Skills",
  "soft skills": "Communication", "detail oriented": "Attention to Detail",
  "attention to detail": "Attention to Detail", "ms office": "Microsoft Office",
  "microsoft excel": "Microsoft Excel", "ms excel": "Microsoft Excel",
  "spread sheets": "Excel", "spreadsheets": "Excel", "search engine optimization": "SEO",
  "point of sale": "Point of Sale", "pos system": "Point of Sale",
  "social media marketing": "Social Media Management", "team player": "Teamwork",
  "public speaker": "Public Speaking", "problem solver": "Problem Solving",
  "customer support": "Customer Service", "client service": "Customer Service",
  "data analytics": "Data Analysis", "video editor": "Video Editing",
  "graphic designer": "Graphic Design", "book keeping": "Bookkeeping",
  // Modern stacks — speech-to-text strips dots and merges words.
  "next js": "Next.js", "nextjs": "Next.js",
  "node js": "Node.js", "nodejs": "Node.js",
  "vue js": "Vue.js", "vuejs": "Vue.js",
  "react js": "React", "reactjs": "React",
  "react native": "React Native",
  "type script": "TypeScript", "typescript": "TypeScript",
  "tailwind": "Tailwind CSS", "tailwind css": "Tailwind CSS",
  "ruby on rails": "Ruby on Rails", "rails": "Ruby on Rails",
  "fast api": "FastAPI", "fastapi": "FastAPI",
  // Cloud & devops
  "amazon web services": "AWS", "a w s": "AWS",
  "google cloud platform": "Google Cloud", "gcp": "Google Cloud",
  "ci cd": "CI/CD", "ci/cd": "CI/CD",
  "git hub": "GitHub", "git lab": "GitLab",
  // AI/ML
  "machine learning": "Machine Learning", "deep learning": "Deep Learning",
  "generative ai": "Generative AI", "gen ai": "Generative AI",
  "prompt engineering": "Prompt Engineering",
  "large language models": "LLMs", "l l m s": "LLMs", "llm": "LLMs",
  // Design / video tools
  "adobe xd": "Adobe XD",
  "after effects": "After Effects",
  "davinci resolve": "DaVinci Resolve", "da vinci resolve": "DaVinci Resolve",
  // Office / collab
  "ms teams": "Microsoft Teams", "microsoft teams": "Microsoft Teams",
  "ms word": "Microsoft Word",
  // Ads
  "tik tok ads": "TikTok Ads", "tiktok ads": "TikTok Ads",
  "linked in ads": "LinkedIn Ads", "linkedin ads": "LinkedIn Ads",
  "facebook ads": "Meta Ads Manager", "meta ads": "Meta Ads Manager",
};
// Verb→skill mapping. Helps when a speaker describes what they *did* without
// naming the skill outright ("I built a small web app" → Project Management,
// "I tutored classmates" → Tutoring). Kept conservative to avoid false hits.
const VOICE_VERB_SKILLS = [
  { re: /\b(design(ed|s|ing)?|redesign(ed|s|ing)?)\b/i, skill: "Graphic Design" },
  { re: /\b(led|leading|leads|lead\s+a|manag(ed|es|ing|ement))\b/i, skill: "Leadership" },
  { re: /\b(present(ed|s|ing|ation)|spoke\s+(in\s+front|publicly)|gave\s+a\s+talk)\b/i, skill: "Public Speaking" },
  { re: /\b(tutor(ed|s|ing)?|taught|teach(ing|es)?)\b/i, skill: "Tutoring" },
  { re: /\b(collaborat(ed|e|es|ing|ion))\b/i, skill: "Collaboration" },
  { re: /\b(research(ed|es|ing)?)\b/i, skill: "Research" },
  { re: /\b(analyz(ed|es|ing|e)|analys(ed|es|ing|e))\b/i, skill: "Data Analysis" },
  { re: /\b(edit(ed|s|ing)\s+(videos?|reels?|clips?)|video\s+edit(or|ing))\b/i, skill: "Video Editing" },
  { re: /\b(photograph(ed|s|ing|y)|shot\s+photos|took\s+photos)\b/i, skill: "Photography" },
  { re: /\b(train(ed|s|ing)\s+(new\s+hires|staff|team|people|interns))\b/i, skill: "Mentoring" },
  { re: /\b(schedul(ed|es|ing)|booked\s+appointments)\b/i, skill: "Scheduling" },
  { re: /\b(wrote|writing|written|author(ed|ing)?)\b/i, skill: "Written Communication" },
  { re: /\b(sold|sales|selling|upsold|closed\s+deals)\b/i, skill: "Sales" },
  { re: /\b(bookkeep(ing|er)?|reconcil(ed|es|ing|iation))\b/i, skill: "Bookkeeping" },
  { re: /\b(organiz(ed|es|ing|ation))\b/i, skill: "Organization" },
  { re: /\b(mentor(ed|s|ing)?)\b/i, skill: "Mentoring" },
  { re: /\b(built|building|develop(ed|s|ing)?|shipped|launched|created)\b[^.!?\n]{0,40}\b(app|website|project|product|platform|tool|feature|side[-\s]project|portfolio)s?\b/i, skill: "Project Management" },
  { re: /\b(ran|run\s+a|managing)\s+(events?|meetings?|workshops?)\b/i, skill: "Event Coordination" },
  { re: /\b(handled\s+cash|cashier|cash\s+register)\b/i, skill: "Cash Handling" },
  { re: /\b(answered\s+phones?|phone\s+calls?|customer\s+calls?)\b/i, skill: "Phone Etiquette" },
  { re: /\b(front\s+desk|reception(ist)?)\b/i, skill: "Front Desk Operations" },
];
const VOICE_FIELDS = [
  "business", "marketing", "finance", "accounting", "information technology",
  "computer science", "cybersecurity", "data science", "graphic design", "design",
  "healthcare", "nursing", "education", "engineering", "communications", "psychology",
  "hospitality", "management", "technology",
];

function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function voiceMatchTerms(lower, terms) {
  const found = [];
  for (const t of terms) {
    const re = new RegExp(`\\b${escapeRegExp(t.toLowerCase())}\\b`, "i");
    if (re.test(lower)) found.push(t);
  }
  // Drop shorter terms that are substrings of a longer matched term
  // (e.g. keep "Social Media Management", drop "Social Media").
  return found.filter(t =>
    !found.some(o => o !== t && o.toLowerCase().includes(t.toLowerCase()))
  );
}

function analyzeVoiceProfile(text) {
  const lower = ` ${String(text || "").toLowerCase()} `;
  const traits = voiceMatchTerms(lower, VOICE_TRAITS);
  for (const [alias, canon] of Object.entries(VOICE_TRAIT_ALIASES)) {
    if (new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(lower) && !traits.includes(canon)) traits.push(canon);
  }
  const skills = voiceMatchTerms(lower, VOICE_SKILLS);
  for (const [alias, canon] of Object.entries(VOICE_SKILL_ALIASES)) {
    if (new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(lower) && !skills.includes(canon)) skills.push(canon);
  }
  // Verb-driven skills: pick up things the user *did* without naming them.
  for (const v of VOICE_VERB_SKILLS) {
    if (v.re.test(lower) && !skills.includes(v.skill)) skills.push(v.skill);
  }
  // Re-apply substring de-dupe now that aliases may have added longer canon forms.
  const dedupedSkills = skills.filter(t =>
    !skills.some(o => o !== t && o.toLowerCase().includes(t.toLowerCase()))
  );
  let field = voiceMatchTerms(lower, VOICE_FIELDS)[0] || "";
  if (!field) field = fieldFromEducation();
  const isStudent = /\bstudent\b/.test(lower) || educationLooksCurrent();
  return { traits, skills: dedupedSkills, field, status: isStudent ? "student" : "professional" };
}

function fieldFromEducation() {
  const deg = (state.education && state.education[0] && state.education[0].degree) || "";
  // "Associate in Arts, Business | GPA: 3.5" → "Business"
  const m = deg.split(/[,|]/).map(s => s.trim()).filter(Boolean);
  const tail = m.length > 1 ? m[1] : "";
  const cleaned = tail.replace(/gpa.*$/i, "").trim();
  return /^[a-z &]+$/i.test(cleaned) && cleaned.length <= 30 ? cleaned : "";
}

function educationLooksCurrent() {
  return (state.education || []).some(e => /expected|present|current/i.test(`${e.date || ""}`));
}

function joinList(arr, conj = "and") {
  const a = arr.filter(Boolean);
  if (a.length === 0) return "";
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} ${conj} ${a[1]}`;
  return `${a.slice(0, -1).join(", ")}, ${conj} ${a[a.length - 1]}`;
}

function lc(s) { return (s || "").charAt(0).toLowerCase() + (s || "").slice(1); }
function cap(s) { return (s || "").charAt(0).toUpperCase() + (s || "").slice(1); }
function tidy(s) {
  return s.replace(/\s+/g, " ").replace(/\s+([.,])/g, "$1").replace(/\.\.+/g, ".").trim();
}

// Em dashes are banned everywhere on the canvas. Replace em/en dashes (and the
// horizontal-bar variant) with a plain hyphen, then tidy any " - " spacing.
const EM_DASH_RE = /[—–―]/;
function stripEmDashes(s) {
  return typeof s === "string" ? s.replace(/[—–―]/g, "-") : s;
}
function deepStripEmDashes(obj) {
  if (typeof obj === "string") return stripEmDashes(obj);
  if (Array.isArray(obj)) return obj.map(deepStripEmDashes);
  if (obj && typeof obj === "object") {
    for (const k of Object.keys(obj)) obj[k] = deepStripEmDashes(obj[k]);
  }
  return obj;
}
// Catch every field before its own input handler reads the value. Capture phase
// runs first, and the 1:1 replacement keeps the caret position valid.
document.addEventListener("input", (ev) => {
  const el = ev.target;
  if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return;
  if (typeof el.value !== "string" || !EM_DASH_RE.test(el.value)) return;
  const start = el.selectionStart, end = el.selectionEnd;
  el.value = stripEmDashes(el.value);
  try { el.setSelectionRange(start, end); } catch (_err) { /* ignore */ }
}, true);

// Expand whatever signal we have (often just a sentence or two) into a full,
// standard-form professional summary: identity → work-style / strengths →
// goal. Varies with `variant` so it never reads identically twice, and the
// `tone` picker swaps the phrase bank so the same facts can land formal,
// direct, warm, or concise. We add legitimate professional framing (work
// ethic, collaboration, eagerness to learn) but never invent hard facts —
// employers, titles, dates, or skills.
function buildVoiceCtx(a) {
  const field = a.field ? a.field.toLowerCase() : "";
  const traits = (a.traits || []).slice(0, 2).map(lc);
  const traitStr = joinList(traits);
  const firstTrait = traits[0] || "";
  const skills = (a.skills || []).filter(s => s.toLowerCase() !== field).slice(0, 4);
  const skillStr = joinList(skills);
  const status = a.status || "professional";
  const subject = field ? `${field} ${status}` : status;
  return { field, traits, traitStr, firstTrait, skills, skillStr, status, subject };
}

const VOICE_TONE_PRESETS = {
  standard: {
    format: "full",
    opener: [
      (c) => c.traitStr ? `${cap(c.traitStr.split(" and ")[0])}${c.traits[1] ? `, ${c.traits[1]}` : ""} ${c.subject}` : `Motivated ${c.subject}`,
      (c) => `${cap(c.subject)}${c.traitStr ? ` known for being ${c.traitStr}` : ""}`,
      (c) => `Dedicated ${c.subject}${c.traitStr ? ` who is ${c.traitStr}` : ""}`,
    ],
    middle: [
      (c) => c.skillStr ? `with hands-on strengths in ${c.skillStr}` : `with a genuine drive to learn and contribute`,
      (c) => c.skillStr ? `bringing practical experience with ${c.skillStr}` : `eager to take on responsibility and grow`,
      (c) => c.skillStr ? `comfortable applying ${c.skillStr}` : `ready to add value from day one`,
    ],
    strength: [
      (c) => `Known for ${c.traitStr ? `being ${c.traitStr} and consistently ` : ""}following through on commitments, with a steady focus on quality and getting things done.`,
      (c) => `Brings ${c.firstTrait ? `a ${c.firstTrait}, ` : "a positive, "}team-oriented approach and picks up new tools and processes quickly.`,
      (_c) => `Communicates clearly, takes initiative, and stays composed under pressure and tight deadlines.`,
      (c) => `Balances independent work with strong collaboration, and approaches every task with ${c.traitStr ? `${c.firstTrait} energy` : "reliability and care"}.`,
    ],
    closer: [
      (c) => `Seeking ${c.field ? `${c.field} ` : ""}opportunities to apply these strengths and continue growing professionally.`,
      (_c) => `Looking to contribute to a collaborative team and deliver dependable, high-quality results.`,
      (c) => `Eager to step into a ${c.field ? `${c.field} ` : ""}role where reliability and initiative make a real difference.`,
    ],
  },
  formal: {
    format: "full",
    opener: [
      (c) => `${cap(c.subject)} with demonstrated capability${c.skillStr ? ` across ${c.skillStr}` : " in core professional disciplines"}`,
      (c) => `A ${c.traitStr ? `${c.traitStr} ` : ""}${c.subject} with a record of consistent performance`,
      (c) => `${cap(c.subject)} who upholds professional standards${c.traitStr ? ` and brings ${c.traitStr} attributes` : ""}`,
    ],
    middle: [
      (c) => c.skillStr ? `supported by hands-on proficiency in ${c.skillStr}` : `supported by a methodical approach to every assignment`,
      (_c) => `with an emphasis on accuracy, accountability, and follow-through`,
      (_c) => `drawing on disciplined work habits and structured execution`,
    ],
    strength: [
      (_c) => `Maintains rigorous attention to detail across all responsibilities and communicates progress with clarity and professionalism.`,
      (_c) => `Approaches every assignment with diligence and a commitment to delivering high-caliber outcomes.`,
      (_c) => `Sustains composure under pressure and consistently meets project commitments on schedule.`,
    ],
    closer: [
      (c) => `Seeking a ${c.field ? `${c.field} ` : ""}position in which these capabilities can contribute meaningfully to organisational objectives.`,
      (_c) => `Open to opportunities that require reliability, precision, and continued professional development.`,
      (c) => `Pursuing a role within ${c.field || "a results-driven environment"} that values discipline and sustained performance.`,
    ],
  },
  direct: {
    format: "full",
    opener: [
      (c) => `${c.traitStr ? cap(c.firstTrait) + " " : ""}${c.subject}${c.skillStr ? ` who works with ${c.skillStr}` : ""}`,
      (c) => `${cap(c.subject)}. ${c.skillStr ? `Builds with ${c.skillStr}` : "Picks up new tools fast"}`,
      (c) => `${cap(c.subject)} focused on shipping`,
    ],
    middle: [
      (_c) => `hits deadlines and asks the right questions`,
      (_c) => `owns problems end-to-end and follows through`,
      (c) => c.skillStr ? `comfortable across ${c.skillStr}` : `learns by doing and moves fast`,
    ],
    strength: [
      (_c) => `Low-maintenance, decision-ready, and clear in communication.`,
      (_c) => `Strong on follow-up. Comfortable making calls and adjusting on the fly.`,
      (_c) => `Cuts to the point, shares progress honestly, and finishes what I start.`,
    ],
    closer: [
      (c) => `Looking for a ${c.field ? `${c.field} ` : ""}role where I can add value fast.`,
      (_c) => `Open to roles that put initiative and judgment to work.`,
      (c) => `Want to join a ${c.field ? `${c.field} team` : "team"} that ships and learns quickly.`,
    ],
  },
  warm: {
    format: "full",
    opener: [
      (c) => `${cap(c.subject)} who genuinely enjoys ${c.field ? `the ${c.field} world` : "helping teams do their best work"}`,
      (c) => `Friendly, ${c.traitStr || "reliable"} ${c.subject} happy to roll up sleeves and pitch in`,
      (c) => `${cap(c.subject)} with a warm, ${c.traitStr || "collaborative"} approach to the work`,
    ],
    middle: [
      (c) => c.skillStr ? `with a real love for ${c.skillStr}` : `with a real love for learning new things together`,
      (c) => c.skillStr ? `bringing positive energy to ${c.skillStr}` : `bringing positive energy to every project`,
      (_c) => `always ready to support teammates, clients, and the people around me`,
    ],
    strength: [
      (_c) => `Easy to work with, patient with the messy parts, and quick to celebrate other people's wins.`,
      (_c) => `Believes in the long game: listening first, asking thoughtful questions, and showing up consistently.`,
      (_c) => `Builds trust through kindness, follow-through, and clear, honest communication.`,
    ],
    closer: [
      (c) => `Looking for a ${c.field ? `${c.field} ` : ""}team where I can grow alongside people who care about the work.`,
      (_c) => `Hoping to join a place that values heart as much as hustle.`,
      (c) => `Excited to find a ${c.field ? `${c.field} team` : "team"} where good people and good work go together.`,
    ],
  },
  concise: {
    format: "compact",
    opener: [
      (c) => `${c.traitStr ? cap(c.firstTrait) + " " : ""}${c.subject}${c.skillStr ? ` with strengths in ${c.skillStr}` : ""}`,
      (c) => `${cap(c.subject)}${c.skillStr ? ` skilled in ${c.skillStr}` : ""}`,
      (c) => `${cap(c.traitStr || "Motivated")} ${c.subject}${c.skillStr ? ` (${c.skillStr})` : ""}`,
    ],
    closer: [
      (c) => `Seeking ${c.field ? `${c.field} ` : ""}opportunities to contribute and grow.`,
      (_c) => `Open to roles that put these strengths to work.`,
      (c) => `Looking for a ${c.field ? `${c.field} role` : "team"} where I can add value quickly.`,
    ],
  },
};

function composeVoiceSummary(a, variant, tone) {
  const ctx = buildVoiceCtx(a);
  const preset = VOICE_TONE_PRESETS[tone] || VOICE_TONE_PRESETS.standard;
  const v = Math.abs(variant | 0);
  const pick = (arr, off) => arr[(v + off) % arr.length](ctx);
  if (preset.format === "compact") {
    const s1 = pick(preset.opener, 0);
    const s2 = pick(preset.closer, 2);
    return stripEmDashes(tidy(`${cap(s1)}. ${s2}`));
  }
  const s1 = `${pick(preset.opener, 0)}, ${pick(preset.middle, 1)}.`;
  const s2 = pick(preset.strength, 0);
  const s3 = pick(preset.closer, 2);
  return stripEmDashes(tidy(`${cap(s1)} ${cap(s2)} ${s3}`));
}

let _voiceAnalysis = null;
let _voiceVariant = 0;
let _voiceTone = "standard";

function voiceAnalyze() {
  const text = (state.voice_profile || "").trim();
  if (!text) { toast("RECORD OR TYPE YOUR INTRO FIRST"); return; }
  markVoiceIntroSeen();
  _voiceAnalysis = analyzeVoiceProfile(text);
  _voiceVariant = 0;
  renderVoiceReview();
  const review = $("#voice-review");
  if (review) review.classList.remove("hidden");
  toast("ANALYZED — REVIEW & APPLY BELOW");
}

function renderVoiceReview() {
  if (!_voiceAnalysis) return;
  syncVoiceToneButtons();
  const draft = $("#voice-summary-draft");
  if (draft) draft.value = composeVoiceSummary(_voiceAnalysis, _voiceVariant, _voiceTone);
  // Show the current summary for comparison if one exists.
  const cur = $("#voice-current-summary");
  if (cur) {
    const existing = (state.summary || "").trim();
    if (existing) { cur.textContent = `Current: ${existing}`; cur.classList.remove("hidden"); }
    else cur.classList.add("hidden");
  }
  // Skill chips = detected hard skills + trait words; all selected by default.
  const chipBox = $("#voice-skill-chips");
  if (chipBox) {
    const items = [...(_voiceAnalysis.skills || []), ..._voiceAnalysis.traits || []];
    chipBox.innerHTML = items.length
      ? items.map(s => `<button type="button" class="voice-chip selected" data-action="voiceToggleChip" role="checkbox" aria-checked="true">${esc(s)}</button>`).join("")
      : `<div class="vr-empty">No clear skills detected — add them in the Skills section, or reword and try again.</div>`;
  }
}

function voiceRegenSummary() {
  if (!_voiceAnalysis) return;
  _voiceVariant += 1;
  const draft = $("#voice-summary-draft");
  if (draft) draft.value = composeVoiceSummary(_voiceAnalysis, _voiceVariant, _voiceTone);
}

function voiceSetTone(btn) {
  const tone = (btn && btn.dataset && btn.dataset.tone) || "standard";
  if (!VOICE_TONE_PRESETS[tone]) return;
  _voiceTone = tone;
  syncVoiceToneButtons();
  if (!_voiceAnalysis) return;
  const draft = $("#voice-summary-draft");
  if (draft) draft.value = composeVoiceSummary(_voiceAnalysis, _voiceVariant, _voiceTone);
}

function syncVoiceToneButtons() {
  document.querySelectorAll(".voice-tone-btn").forEach((b) => {
    const sel = b.dataset && b.dataset.tone === _voiceTone;
    b.classList.toggle("selected", sel);
    b.setAttribute("aria-selected", sel ? "true" : "false");
  });
}

function voiceToggleChip(btn) {
  btn.classList.toggle("selected");
  btn.setAttribute("aria-checked", btn.classList.contains("selected") ? "true" : "false");
}

function voiceApplySummary() {
  const draft = $("#voice-summary-draft");
  const text = draft ? stripEmDashes(draft.value.trim()) : "";
  if (!text) { toast("NOTHING TO APPLY"); return; }
  state.summary = text;
  state.section_enabled.summary = true;
  renderSummary();
  applySectionToggleStates();
  renderPreview();
  schedulePersist();
  toast("SUMMARY UPDATED");
}

function voiceApplySkills() {
  const chips = $$("#voice-skill-chips .voice-chip.selected").map(c => c.textContent.trim()).filter(Boolean);
  if (!chips.length) { toast("SELECT AT LEAST ONE SKILL"); return; }
  const added = addSkillsToState(chips);
  if (!added) { toast("THOSE SKILLS ARE ALREADY LISTED"); return; }
  render();
  toast(`ADDED ${added} SKILL${added === 1 ? "" : "S"}`);
}

// Merge new skills into whatever shape the current template uses, skipping dupes.
function addSkillsToState(skills) {
  const cfg = tcfg();
  const existing = new Set();
  const note = (s) => { const t = (s || "").trim().toLowerCase(); if (t) existing.add(t); };
  if (cfg.skillsMode === "categories") {
    state.skills_categories.forEach(c => (c.content || "").split(",").forEach(note));
  } else if (cfg.skillsMode === "pipe") {
    (state.skills_inline || "").split(/[│|]/).forEach(note);
  } else {
    state.skills_two_column.forEach(r => { note(r.left); note(r.right); });
  }
  const add = skills.filter(s => !existing.has(s.trim().toLowerCase()));
  if (!add.length) return 0;
  if (cfg.skillsMode === "categories") {
    let cat = state.skills_categories.find(c => /core|strength|highlight|key/i.test(c.label || ""));
    if (!cat) { cat = { label: "Core Strengths", content: "" }; state.skills_categories.push(cat); }
    const cur = (cat.content || "").split(",").map(s => s.trim()).filter(Boolean);
    cat.content = cur.concat(add).join(", ");
  } else if (cfg.skillsMode === "pipe") {
    const cur = (state.skills_inline || "").trim();
    state.skills_inline = cur ? `${cur} │ ${add.join(" │ ")}` : add.join(" │ ");
  } else {
    for (let i = 0; i < add.length; i += 2) {
      state.skills_two_column.push({ left: add[i] || "", right: add[i + 1] || "" });
    }
  }
  return add.length;
}

function micToggle(btn) {
  const targetId = btn.dataset.micTarget;
  if (!targetId) return;
  if (_recordingTarget === targetId) stopDictation();
  else startDictation(targetId);
}

// Hide mic buttons up-front in browsers without Speech API support, so users
// don't see an affordance they can't use.
function hideMicButtonsIfUnsupported() {
  if (isSpeechSupported()) {
    const fab = $("#voice-fab");
    if (fab) fab.classList.remove("hidden");
    return;
  }
  document.querySelectorAll(".mic-btn").forEach((el) => el.classList.add("hidden"));
  // The voice recorder falls back to typing — hide its record button and say so.
  const vbtn = $("#voice-rec-btn");
  if (vbtn) vbtn.classList.add("hidden");
  const fab = $("#voice-fab");
  if (fab) fab.classList.add("hidden");
  updateVoiceStatus("Voice capture isn't supported here — type your intro below.");
}

// ── Floating dictation mic (FAB) ───────────────────────────────────────────
// Targets the last-focused dictatable field; if none, opens the voice-intro
// card and records into the intro transcript. Also driven by Ctrl/Cmd+Shift+M.
let _lastFocusedMicTarget = null;

function getTargetForElement(el) {
  if (!el) return null;
  if (el.id === "voice-transcript") return "voiceProfile";
  if (el.id === "summary") return "summary";
  if (el.dataset && el.hasAttribute && el.hasAttribute("data-proj-bullet") && el.hasAttribute("data-bullet-i")) {
    return `projBullet:${el.dataset.projBullet}:${el.dataset.bulletI}`;
  }
  if (el.dataset && el.hasAttribute && el.hasAttribute("data-exp-bullet") && el.hasAttribute("data-bullet-i")) {
    return `expBullet:${el.dataset.expBullet}:${el.dataset.bulletI}`;
  }
  return null;
}

function setVoiceFabState(recording, targetId) {
  const fab = $("#voice-fab");
  if (fab) {
    fab.classList.toggle("recording", !!recording);
    fab.setAttribute("aria-pressed", recording ? "true" : "false");
  }
  document.body.classList.toggle("voice-recording", !!recording);
  const labelEl = $("#voice-fab-label");
  if (labelEl) labelEl.textContent = recording ? "STOP" : "DICTATE";
  const live = $("#voice-fab-live");
  if (live) {
    if (recording) {
      const where = targetId === "voiceProfile" ? "voice intro"
        : targetId === "summary" ? "summary"
        : targetId && targetId.startsWith("projBullet:") ? "project bullet"
        : targetId && targetId.startsWith("expBullet:") ? "experience bullet"
        : "focused field";
      live.textContent = `Dictation started — listening into ${where}.`;
    } else {
      live.textContent = "Dictation stopped.";
    }
  }
  if (recording) startLevelMeter();
  else stopLevelMeter();
}

// ── First-visit handling for the voice card ────────────────────────────────
// On a brand-new install we expand the voice card so users actually see the
// fastest path through the form. After any engagement (record, skip, toggle,
// analyze) we remember the choice and never auto-expand again.
const VOICE_INTRO_SEEN_KEY = "resumecanvas:v1:voice-intro-seen";

function hasSeenVoiceIntro() {
  try { return localStorage.getItem(VOICE_INTRO_SEEN_KEY) === "1"; }
  catch (_e) { return true; }
}

function markVoiceIntroSeen() {
  try { localStorage.setItem(VOICE_INTRO_SEEN_KEY, "1"); } catch (_e) { /* ignore */ }
  const card = $("#voice-card");
  if (card) card.classList.remove("voice-fresh");
}

function applyVoiceIntroDefaultState() {
  if (hasSeenVoiceIntro()) return;
  if (!isSpeechSupported()) return; // no point promoting a feature they can't use
  const card = $("#voice-card");
  if (!card) return;
  card.classList.remove("collapsed");
  card.classList.add("voice-fresh");
}

function skipVoiceIntro() {
  const card = $("#voice-card");
  if (card) card.classList.add("collapsed");
  markVoiceIntroSeen();
  const nameInput = document.querySelector('[data-bind="name"]');
  if (nameInput && typeof nameInput.focus === "function") nameInput.focus();
}

// ── Input-level meter ──────────────────────────────────────────────────────
// Three small bars driven by the user's mic via getUserMedia + AnalyserNode.
// Strictly cosmetic: if the browser declines or the API isn't there, the
// bars just stay flat. We only attempt this when mic permission is already
// "granted" to avoid double-prompting the user alongside SpeechRecognition.
let _meterStream = null;
let _meterAudioCtx = null;
let _meterAnalyser = null;
let _meterRaf = null;
let _meterBars = null;

function collectMeterBars() {
  const nodes = document.querySelectorAll(".voice-meter .vm-bar");
  const cardBars = [], fabBars = [];
  nodes.forEach((n) => {
    const parent = n.parentElement;
    if (!parent) return;
    if (parent.id === "voice-meter-card") cardBars.push(n);
    else if (parent.id === "voice-meter-fab") fabBars.push(n);
  });
  return { cardBars, fabBars };
}

async function startLevelMeter() {
  if (_meterStream) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  // Don't trigger an extra permission prompt — only run if mic is already granted.
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const p = await navigator.permissions.query({ name: "microphone" });
      if (p && p.state !== "granted") return;
    }
  } catch (_e) { /* permissions API may not support "microphone" — fall through */ }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    _meterStream = stream;
    _meterAudioCtx = new Ctx();
    const src = _meterAudioCtx.createMediaStreamSource(stream);
    _meterAnalyser = _meterAudioCtx.createAnalyser();
    _meterAnalyser.fftSize = 64;
    _meterAnalyser.smoothingTimeConstant = 0.6;
    src.connect(_meterAnalyser);
    _meterBars = collectMeterBars();
    tickLevelMeter();
  } catch (_err) {
    // Optional feature — fail silently and leave recording running.
    stopLevelMeter();
  }
}

function tickLevelMeter() {
  if (!_meterAnalyser) return;
  const buf = new Uint8Array(_meterAnalyser.frequencyBinCount);
  _meterAnalyser.getByteFrequencyData(buf);
  const n = buf.length;
  const third = Math.max(1, Math.floor(n / 3));
  const lo = meterBandAvg(buf, 0, third);
  const mid = meterBandAvg(buf, third, third * 2);
  const hi = meterBandAvg(buf, third * 2, n);
  const levels = [bandToLevel(lo), bandToLevel(mid), bandToLevel(hi)];
  paintMeter(_meterBars && _meterBars.cardBars, levels);
  paintMeter(_meterBars && _meterBars.fabBars, levels);
  _meterRaf = requestAnimationFrame(tickLevelMeter);
}

function meterBandAvg(buf, lo, hi) {
  let s = 0, n = 0;
  for (let i = lo; i < hi; i++) { s += buf[i]; n++; }
  return n ? s / n : 0;
}

function bandToLevel(v) {
  // 0..255 → 0..5 with a slight bias so quiet rooms don't flicker at level 1.
  if (v < 18) return 0;
  if (v < 40) return 1;
  if (v < 70) return 2;
  if (v < 105) return 3;
  if (v < 150) return 4;
  return 5;
}

function paintMeter(bars, levels) {
  if (!bars) return;
  for (let i = 0; i < bars.length && i < levels.length; i++) {
    bars[i].setAttribute("data-level", String(levels[i]));
  }
}

function stopLevelMeter() {
  if (_meterRaf) { cancelAnimationFrame(_meterRaf); _meterRaf = null; }
  if (_meterStream) {
    try { _meterStream.getTracks().forEach((t) => t.stop()); } catch (_e) { /* ignore */ }
    _meterStream = null;
  }
  if (_meterAudioCtx) {
    try { _meterAudioCtx.close(); } catch (_e) { /* ignore */ }
    _meterAudioCtx = null;
  }
  _meterAnalyser = null;
  // Reset all bars to 0 so the meter doesn't freeze on its last frame.
  document.querySelectorAll(".voice-meter .vm-bar").forEach((b) => b.setAttribute("data-level", "0"));
}

function voiceFabToggle() {
  if (!isSpeechSupported()) {
    toast("VOICE INPUT NOT SUPPORTED ON THIS BROWSER");
    return;
  }
  if (_recordingTarget) {
    if (_recordingTarget === "voiceProfile") stopVoiceRecording();
    else stopDictation();
    return;
  }
  const target = _lastFocusedMicTarget;
  if (target && findMicField(target)) {
    startDictation(target);
    return;
  }
  // Nothing useful focused — open the voice-intro card and start there.
  const card = $("#voice-card");
  if (card) card.classList.remove("collapsed");
  markVoiceIntroSeen();
  voiceToggle();
}

function setupVoiceFocusTracking() {
  document.addEventListener("focusin", (ev) => {
    const target = getTargetForElement(ev.target);
    if (target) _lastFocusedMicTarget = target;
  });
  // Keep the FAB from stealing focus (and blurring the textarea) on click.
  const fab = $("#voice-fab");
  if (fab) {
    fab.addEventListener("mousedown", (ev) => ev.preventDefault());
    fab.addEventListener("pointerdown", (ev) => ev.preventDefault());
  }
}

function setupVoiceHotkey() {
  document.addEventListener("keydown", (ev) => {
    // Ctrl+Shift+M (or Cmd+Shift+M) toggles dictation on the focused field.
    if (!ev.shiftKey) return;
    if (!(ev.ctrlKey || ev.metaKey)) return;
    const k = (ev.key || "").toLowerCase();
    if (k !== "m") return;
    ev.preventDefault();
    voiceFabToggle();
  });
}

let _voiceFabInitialized = false;
function initVoiceFabOnce() {
  if (_voiceFabInitialized) return;
  _voiceFabInitialized = true;
  setupVoiceFocusTracking();
  setupVoiceHotkey();
  applyVoiceIntroDefaultState();
  maybeAutoStartVoiceFromUrl();
}

// ── Theme + app rail ───────────────────────────────────────────────────────
// Light by default; users opt into dark from the rail toggle. We persist the
// choice so subsequent loads are stable, and never auto-switch on system
// preference change so the editor doesn't flip mid-session.
const THEME_KEY = "resumecanvas:v1:theme";

function applySavedTheme() {
  let theme = "light";
  try { theme = localStorage.getItem(THEME_KEY) || "light"; } catch (_e) { /* ignore */ }
  setTheme(theme, { persist: false });
}

function setTheme(theme, opts) {
  const dark = theme === "dark";
  document.body.classList.toggle("theme-dark", dark);
  const btn = document.querySelector(".app-rail-btn.theme-toggle");
  if (btn) {
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
    btn.setAttribute("title", dark ? "Switch to light theme" : "Switch to dark theme");
  }
  if (!opts || opts.persist !== false) {
    try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch (_e) { /* ignore */ }
  }
}

function toggleTheme() {
  const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
  setTheme(next);
}

// Rail click handlers: scroll the left editor pane to a specific panel, or
// toggle one of the optional intake/voice cards open before scrolling.
function railJumpTo(where) {
  let el = null;
  if (where === "top") el = document.querySelector(".pane.left");
  else if (where === "skills") el = document.querySelector('.panel[data-section="skills"]');
  if (!el) return;
  if (where === "skills" && !el.classList.contains("open")) el.classList.add("open");
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function railOpen(card) {
  const id = card === "intake" ? "intake-card" : "voice-card";
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("collapsed");
  if (card === "voice") markVoiceIntroSeen();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function maybeAutoStartVoiceFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("voice") !== "1") return;
    if (!isSpeechSupported()) return;
    const card = $("#voice-card");
    if (card) card.classList.remove("collapsed");
    markVoiceIntroSeen();
    // Defer so the rest of the UI has a beat to settle before the mic prompt.
    setTimeout(() => { voiceToggle(); }, 350);
  } catch (_err) { /* URL not available — ignore */ }
}

async function sharePdf() {
  if (!navigator || typeof navigator.share !== "function") {
    toast("SHARING NOT SUPPORTED — USE DOWNLOAD");
    return;
  }
  try {
    const bytes = buildResumePdfBytes();
    const filename = `${slugFileName(state.name)}-${state.template}.pdf`;
    const file = new File([bytes], filename, { type: "application/pdf" });
    const data = {
      files: [file],
      title: `${state.name || "Resume"} — Resume`,
      text: `${state.name || ""}'s resume`,
    };
    // canShare with files is the right pre-flight; some browsers (older Android)
    // implement navigator.share but not canShare — fall through and try anyway.
    if (typeof navigator.canShare === "function" && !navigator.canShare(data)) {
      toast("THIS BROWSER CAN'T SHARE FILES");
      return;
    }
    await navigator.share(data);
  } catch (err) {
    // User cancellation throws AbortError — treat as a no-op, no toast spam.
    if (err && err.name === "AbortError") return;
    toast("SHARE FAILED — TRY DOWNLOAD");
    if (typeof console !== "undefined") console.error(err);
  }
}

function buildPayload() {
  const tpl = state.template;
  const cfg = tcfg(tpl);
  const order = state.section_order[tpl] || [];
  const summaryOn = state.section_enabled.summary !== false;
  const out = {
    name: state.name,
    summary: summaryOn ? state.summary : "",
    font_pt: state._appliedFontPt || cfg.bodyPt,
    font_family: FONT_FAMILIES[fontFamilyKey()].label,
    section_order: order.slice(),
  };
  const voice = (state.voice_profile || "").trim();
  if (voice) out.voice_profile = voice;

  // ── Header ──
  if (cfg.header === "structured") {
    out.location = state.location;
    out.phone = state.phone;
    out.email = state.email;
    out.linkedin = state.linkedin;
    out.links = (state.links || []).filter(Boolean);
    if (state.professional_title) out.professional_title = state.professional_title;
  } else {
    out.contact_line1 = state.contact_line1;
    out.contact_line2 = state.contact_line2;
  }

  // ── Education ──
  out.education = state.education
    .filter(e => e.school || e.degree)
    .map(e => {
      const ed = { school: e.school, city: e.city, degree: e.degree, date: e.date };
      if (cfg.eduMode === "demo2") { ed.subline_bold = e.subline_bold || ""; ed.subline_rest = e.subline_rest || ""; }
      if (e.coursework) ed.coursework = e.coursework;
      if (cfg.eduMode === "demo8" && e.certifications) ed.certifications = e.certifications;
      return ed;
    });

  // ── Skills ──
  if (cfg.skillsMode === "categories") {
    out.skills_categories = state.skills_categories.filter(c => c.label || c.content);
  } else if (cfg.skillsMode === "pipe") {
    out.skills_inline = state.skills_inline || "";
  } else if (cfg.skillsMode === "list") {
    out.skills = state.skills_two_column.flatMap(r => [r.left, r.right].filter(Boolean));
  } else {
    out.skills_two_column = state.skills_two_column
      .filter(r => r.left || r.right)
      .map(r => ({ left: r.left || "", right_with_bullet: r.right ? `• ${r.right}` : "" }));
  }

  if (cfg.certs) out.certifications = state.certifications.filter(Boolean);

  // ── Projects (only when this template includes them) ──
  if (order.includes("projects")) {
    out.projects = state.section_enabled.projects
      ? state.projects.filter(p => p.title).map(p => {
          const pr = { title: p.title, bullets: (p.bullets || []).filter(Boolean) };
          if (cfg.projMode === "dated") { pr.date = p.date; pr.location = p.location; }
          return pr;
        })
      : [];
  }

  // ── Experience ──
  out.experience = state.section_enabled.experience
    ? state.experience.filter(e => e.title || e.company_city).map(e => {
        const ex = { title: e.title, date: e.date, bullets: (e.bullets || []).filter(Boolean) };
        if (cfg.expMode === "italic") ex.location = e.location;
        else ex.company_city = e.company_city;
        return ex;
      })
    : [];

  return out;
}

function fallbackCopyText(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.className = "clipboard-fallback";
  document.body.appendChild(ta);
  ta.select();
  try {
    return document.execCommand("copy");
  } finally {
    ta.remove();
  }
}

async function copyText(text, successMessage) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else if (!fallbackCopyText(text)) {
      throw new Error("Clipboard fallback failed");
    }
    toast(successMessage);
    return true;
  } catch (err) {
    console.error("Copy failed", err);
    toast("COPY FAILED — SELECT TEXT MANUALLY");
    return false;
  }
}

function copyJSON() {
  const json = JSON.stringify(buildPayload(), null, 2);
  copyText(json, "JSON COPIED");
}

function showCompile() {
  const payload = buildPayload();
  $("#json-out").textContent = JSON.stringify(payload, null, 2);
  $("#modal-tpl").textContent = state.template;
  $("#modal-bg").classList.add("show");
}

function closeModal() {
  $("#modal-bg").classList.remove("show");
}

async function copyPayloadAndPrompt() {
  const payload = JSON.stringify(buildPayload(), null, 2);
  const tpl = state.template;
  const voice = (state.voice_profile || "").trim();
  const voiceCue = voice
    ? `\n\nThe candidate described themselves out loud (transcript below). Use it to:\n` +
      `1. Match their natural voice and tone, especially in the summary, so it reads like a real person rather than generic AI.\n` +
      `2. Surface any genuine skills, tools, technologies, or competencies they mention into the skills section — only if clearly stated or strongly implied; never invent skills.\n` +
      `Treat it as voice/skill signal, not verbatim content: keep everything professional and ATS-friendly, don't copy phrasing word-for-word, and don't add facts (employers, dates, titles) that aren't already in the JSON.\n"""\n${voice}\n"""`
    : "";
  const styleRule = `\n\nNever use em dashes (—) or en dashes (–) anywhere in the output; use commas, periods, or hyphens instead.`;
  const text = `Generate this resume using template ${tpl}:\n\n\`\`\`json\n${payload}\n\`\`\`${voiceCue}${styleRule}`;
  const copied = await copyText(text, "PAYLOAD + PROMPT COPIED");
  if (copied) setTimeout(() => closeModal(), 600);
}

// ─────────────────────────────────────────────────────────
// IMPORT FROM EXISTING RESUME
// ─────────────────────────────────────────────────────────

let _pendingImport = null;

const SECTION_PATTERNS = [
  ["summary", /^(profile\s+summary|professional\s+summary|career\s+summary|summary|objective|profile|about\s+me|about)\s*:?\s*$/i],
  ["education", /^(education|academic\s+background|academics)\s*:?\s*$/i],
  ["skills", /^(highlighted\s+skills|technical\s+skills|core\s+competencies|competencies|skills)\s*:?\s*$/i],
  ["projects", /^(projects|project\s+experience|key\s+projects|selected\s+projects)\s*:?\s*$/i],
  ["experience", /^(work\s+experience|professional\s+experience|employment\s+history|experience|employment)\s*:?\s*$/i],
  ["certifications", /^(certifications?|certificates|licenses(\s*&\s*certifications)?|licenses)\s*:?\s*$/i],
];

const BULLET_RE = /^[•*\-‒–—◦·▪]\s+/;
const DATE_TOKEN_RE = /((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\b\d{4}\b|present|current|expected)/i;
const LOCATION_RE = /[A-Z][a-zA-Z.\s]+,\s*[A-Z]{2}(?:\s+\d{5})?/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(?:\+?\d[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:[\w-]+\.)?linkedin\.com\/[^\s|]+/i;

async function handleImportFile(file) {
  try {
    let text;
    if (/\.docx$/i.test(file.name)) {
      text = await extractDocxText(file);
    } else if (/\.txt$/i.test(file.name) || /^text\//.test(file.type) || !file.type) {
      text = await file.text();
    } else {
      toast("UNSUPPORTED FILE — paste text instead");
      return;
    }
    if (!text || !text.trim()) {
      toast("FILE WAS EMPTY");
      return;
    }
    showImportConfirm(parseResumeText(text), file.name);
  } catch (err) {
    console.error("Import failed", err);
    toast("IMPORT FAILED — try pasting text instead");
  }
}

function parseImportFromPaste() {
  const text = $("#import-paste").value;
  if (!text.trim()) { toast("PASTE SOME TEXT FIRST"); return; }
  showImportConfirm(parseResumeText(text), "(pasted)");
}

async function extractDocxText(file) {
  const buf = await file.arrayBuffer();
  const u8 = new Uint8Array(buf);
  const view = new DataView(buf);
  const TARGET = "word/document.xml";
  for (let i = 0; i <= u8.length - 30; i++) {
    if (u8[i] !== 0x50 || u8[i+1] !== 0x4b || u8[i+2] !== 0x03 || u8[i+3] !== 0x04) continue;
    const compression = view.getUint16(i + 8, true);
    const compSize = view.getUint32(i + 18, true);
    const nameLen = view.getUint16(i + 26, true);
    const extraLen = view.getUint16(i + 28, true);
    const nameStart = i + 30;
    if (nameStart + nameLen > u8.length) continue;
    const name = new TextDecoder().decode(u8.subarray(nameStart, nameStart + nameLen));
    if (name !== TARGET) continue;
    const dataStart = nameStart + nameLen + extraLen;
    const data = u8.subarray(dataStart, dataStart + compSize);
    let xml;
    if (compression === 0) {
      xml = new TextDecoder().decode(data);
    } else if (compression === 8 && typeof DecompressionStream !== "undefined") {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      xml = await new Response(stream).text();
    } else {
      throw new Error("Unsupported .docx compression");
    }
    return docxXmlToText(xml);
  }
  throw new Error("Not a valid .docx (document.xml missing)");
}

function docxXmlToText(xml) {
  const decode = (s) => s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const paragraphs = xml.split(/<w:p[\s>\/]/).slice(1);
  const lines = paragraphs.map(p => {
    const runs = [];
    const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let m;
    while ((m = re.exec(p))) runs.push(m[1]);
    return decode(runs.join(""));
  });
  return lines.join("\n");
}

function parseResumeText(text) {
  const rawLines = text.replace(/\r/g, "").split("\n").map(l => l.replace(/•/g, "•").replace(/\t/g, " ").trim());
  const sections = { header: [], summary: [], education: [], skills: [], projects: [], experience: [], certifications: [] };
  let current = "header";
  for (const line of rawLines) {
    const matched = SECTION_PATTERNS.find(([, re]) => re.test(line));
    if (matched) { current = matched[0]; continue; }
    sections[current].push(line);
  }

  const header = parseHeader(sections.header);
  const summary = sections.summary.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  const skills = parseSkills(sections.skills);
  const education = parseEducationBlocks(sections.education);
  const projects = parseEntryBlocks(sections.projects);
  const experience = parseEntryBlocks(sections.experience);
  const certifications = sections.certifications.filter(Boolean).map(l => l.replace(BULLET_RE, ""));

  return { header, summary, skills, education, projects, experience, certifications };
}

function parseHeader(lines) {
  const nonEmpty = lines.filter(Boolean);
  const name = nonEmpty[0] || "";
  const rest = nonEmpty.slice(1).join(" | ");
  const email = (rest.match(EMAIL_RE) || [""])[0];
  const phone = (rest.match(PHONE_RE) || [""])[0];
  const linkedin = (rest.match(LINKEDIN_RE) || [""])[0];
  const location = (rest.match(LOCATION_RE) || [""])[0];
  return { name, email, phone, linkedin, location };
}

function parseSkills(lines) {
  const seen = new Set();
  const items = [];
  for (const raw of lines) {
    if (!raw) continue;
    const cleaned = raw.replace(BULLET_RE, "").replace(/^[A-Z][a-zA-Z]+:\s*/, ""); // drop "Category: " prefixes
    cleaned.split(/[,;|·•]/).forEach(piece => {
      const t = piece.trim();
      if (t && !seen.has(t.toLowerCase())) {
        seen.add(t.toLowerCase());
        items.push(t);
      }
    });
  }
  return items;
}

function parseEducationBlocks(lines) {
  const blocks = groupByBlankLine(lines);
  return blocks.map(block => {
    const dateLine = block.find(l => DATE_TOKEN_RE.test(l)) || "";
    const degreeLine = block.find(l => l !== dateLine && /(associate|bachelor|master|ph\.?d|degree|diploma|certificate|major|minor|gpa)/i.test(l)) || "";
    let school = block.find(l => l !== degreeLine && l !== dateLine) || block[0] || "";
    let city = "";
    const splitMatch = school.match(/^(.+?)\s*[—–\-|]\s*(.+)$/);
    if (splitMatch && LOCATION_RE.test(splitMatch[2])) {
      school = splitMatch[1].trim();
      city = splitMatch[2].trim();
    } else {
      const cityInDate = (dateLine.match(LOCATION_RE) || [""])[0];
      if (cityInDate) city = cityInDate;
    }
    return { school, city, degree: degreeLine, date: dateLine };
  });
}

function parseEntryBlocks(lines) {
  const blocks = [];
  let cur = null;
  for (const line of lines) {
    if (!line) {
      if (cur) { blocks.push(cur); cur = null; }
      continue;
    }
    const isBullet = BULLET_RE.test(line);
    if (isBullet) {
      if (!cur) cur = { heading: [], bullets: [] };
      cur.bullets.push(line.replace(BULLET_RE, ""));
    } else {
      // a non-bullet line after bullets starts a new block
      if (cur && cur.bullets.length) { blocks.push(cur); cur = null; }
      if (!cur) cur = { heading: [], bullets: [] };
      cur.heading.push(line);
    }
  }
  if (cur) blocks.push(cur);

  return blocks.map(b => {
    const headingJoined = b.heading.join(" | ");
    const date = (headingJoined.match(new RegExp(`${DATE_TOKEN_RE.source}\\s*[–\\-—]+\\s*${DATE_TOKEN_RE.source}|${DATE_TOKEN_RE.source}`, "i")) || [""])[0];
    const location = (headingJoined.match(LOCATION_RE) || [""])[0];
    let title = b.heading[0] || "";
    // strip trailing date/location from title line
    title = title.replace(DATE_TOKEN_RE, "").replace(LOCATION_RE, "").replace(/[\s|–—\-]+$/, "").trim();
    return { title, date, location, bullets: b.bullets };
  });
}

function groupByBlankLine(lines) {
  const out = [];
  let cur = [];
  for (const l of lines) {
    if (!l) {
      if (cur.length) { out.push(cur); cur = []; }
    } else {
      cur.push(l);
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

function showImportConfirm(parsed, sourceName) {
  _pendingImport = parsed;
  const summarySnippet = parsed.summary.length > 180 ? parsed.summary.slice(0, 180) + "…" : parsed.summary;
  const row = (key, label, value, hasContent) => `
    <label class="import-row">
      <input type="checkbox" data-import-key="${key}" ${hasContent ? "checked" : "disabled"}>
      <div class="ir-label">${label}</div>
      <div class="ir-value">${hasContent ? esc(value) : '<span class="none">none detected</span>'}</div>
    </label>
  `;
  const count = (key, label, n, detail) => `
    <label class="import-row">
      <input type="checkbox" data-import-key="${key}" ${n > 0 ? "checked" : "disabled"}>
      <div class="ir-label">${label}</div>
      <div class="ir-value">${n > 0 ? `<span class="count">${n}</span> ${esc(detail)}` : '<span class="none">none detected</span>'}</div>
    </label>
  `;
  const h = parsed.header;
  $("#import-preview").innerHTML = `
    <div class="import-source">SOURCE: <span class="amber">${esc(sourceName)}</span></div>
    ${row("name", "NAME", h.name, !!h.name)}
    ${row("email", "EMAIL", h.email, !!h.email)}
    ${row("phone", "PHONE", h.phone, !!h.phone)}
    ${row("location", "LOCATION", h.location, !!h.location)}
    ${row("linkedin", "LINKEDIN", h.linkedin, !!h.linkedin)}
    ${row("summary", "PROFILE SUMMARY", summarySnippet, !!parsed.summary)}
    ${count("education", "EDUCATION", parsed.education.length, parsed.education.length === 1 ? "entry" : "entries")}
    ${count("skills", "SKILLS", parsed.skills.length, "items")}
    ${count("projects", "PROJECTS", parsed.projects.length, parsed.projects.length === 1 ? "block" : "blocks")}
    ${count("experience", "WORK EXPERIENCE", parsed.experience.length, parsed.experience.length === 1 ? "position" : "positions")}
    ${count("certifications", "CERTIFICATIONS", parsed.certifications.length, "items")}
  `;
  $("#import-modal-bg").classList.add("show");
}

function closeImportModal() {
  $("#import-modal-bg").classList.remove("show");
}

function applyImport() {
  if (!_pendingImport) { closeImportModal(); return; }
  const enabled = {};
  $$("#import-preview input[type='checkbox']").forEach(cb => {
    enabled[cb.dataset.importKey] = cb.checked && !cb.disabled;
  });

  const p = _pendingImport;
  const h = p.header;
  if (enabled.name) state.name = h.name;
  if (enabled.email) state.email = h.email;
  if (enabled.phone) state.phone = h.phone;
  if (enabled.location) state.location = h.location;
  if (enabled.linkedin) state.linkedin = h.linkedin;
  if (enabled.summary) state.summary = p.summary;

  // Mirror imported contact fields into demo_2's two contact lines.
  if (enabled.location || enabled.phone) {
    const line1 = [state.location, state.phone].filter(Boolean).join(" | ");
    if (line1) state.contact_line1 = line1;
  }
  if (enabled.email || enabled.linkedin) {
    const line2 = [state.email, state.linkedin].filter(Boolean).join(" | ");
    if (line2) state.contact_line2 = line2;
  }

  if (enabled.education && p.education.length) {
    state.education = p.education.map(e => ({
      school: e.school || "",
      city: e.city || "",
      degree: e.degree || "",
      date: e.date || "",
      subline_bold: "",
      subline_rest: "",
      coursework: "",
    }));
  }

  if (enabled.skills && p.skills.length) {
    state.skills_categories = [{ label: "Technical", content: p.skills.join(", ") }];
    state.skills_inline = p.skills.join(" │ ");
    state.skills_two_column = [];
    for (let i = 0; i < p.skills.length; i += 2) {
      state.skills_two_column.push({ left: p.skills[i] || "", right: p.skills[i + 1] || "" });
    }
  }

  if (enabled.projects) {
    if (p.projects.length) {
      state.projects = p.projects.map(pr => ({
        title: pr.title || "",
        date: pr.date || "",
        location: pr.location || "",
        bullets: pr.bullets.length ? pr.bullets : [""],
      }));
      state.section_enabled.projects = true;
    }
  }

  if (enabled.experience && p.experience.length) {
    state.experience = p.experience.map(e => ({
      title: e.title || "",
      date: e.date || "",
      location: e.location || "",
      company_city: e.location || "",
      bullets: e.bullets.length ? e.bullets : [""],
    }));
    state.section_enabled.experience = true;
  }

  if (enabled.certifications && p.certifications.length) {
    state.certifications = p.certifications;
  }

  _pendingImport = null;
  deepStripEmDashes(state);
  closeImportModal();
  $("#intake-card").classList.add("collapsed");
  $("#import-paste").value = "";
  render();
  toast("IMPORT APPLIED");
}

// File input + dropzone wiring (DOM is ready: app.js is deferred)
$("#import-file").addEventListener("change", async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (file) await handleImportFile(file);
  ev.target.value = "";
});

// ─────────────────────────────────────────────────────────
// CAMERA SCAN (phase 7)
// Captures a photo via the system camera. Tries the in-browser TextDetector
// when available (Chrome on Android); otherwise leans on the OS's built-in
// text-recognition (iOS Live Text / Google Lens) by showing the image
// inline and telling the user to long-press → copy → paste.
// ─────────────────────────────────────────────────────────

const cameraInput = $("#camera-input");
if (cameraInput) {
  cameraInput.addEventListener("change", async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (file) await handleCameraCapture(file);
    ev.target.value = "";
  });
}

function triggerCamera() {
  const input = $("#camera-input");
  if (!input) return;
  // Make the intake card visible if the user invoked from elsewhere.
  $("#intake-card").classList.remove("collapsed");
  input.click();
}

async function handleCameraCapture(file) {
  const preview = $("#camera-preview");
  const status = $("#cp-status");
  const img = $("#cp-image");
  const help = $("#cp-help");
  if (!preview || !status || !img || !help) return;

  const objectUrl = URL.createObjectURL(file);
  img.src = objectUrl;
  preview.classList.remove("hidden");
  status.className = "cp-status";
  status.textContent = "Reading image…";
  help.innerHTML = "";

  // Path A: in-browser TextDetector (Chrome on Android, behind no flag).
  if (typeof window.TextDetector === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      const detector = new window.TextDetector();
      const blocks = await detector.detect(bitmap);
      const text = blocks.map((b) => b.rawValue || "").join("\n").trim();
      if (text) {
        status.className = "cp-status ok";
        status.textContent = "TEXT DETECTED — REVIEW AND PARSE";
        const paste = $("#import-paste");
        if (paste) {
          paste.value = text;
          paste.focus();
        }
        help.innerHTML = `Edit the extracted text above if anything looks off, then tap <strong>▶ PARSE PASTED TEXT</strong>.`;
        return;
      }
      // Fall through to manual path if nothing was extracted.
    } catch (_err) {
      // Detector unavailable on this device — fall through to manual flow.
    }
  }

  // Path B: lean on the OS's built-in text recognition.
  status.className = "cp-status";
  status.textContent = "USE YOUR PHONE'S TEXT RECOGNITION";
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  if (isIOS) {
    help.innerHTML = `On iOS, <strong>tap and hold</strong> on text in the image above → <strong>Select All</strong> → <strong>Copy</strong>, then paste into the text box below.`;
  } else if (isAndroid) {
    help.innerHTML = `On Android, <strong>long-press</strong> the image → open in <strong>Google Lens</strong> or <strong>Photos</strong> → copy the text, then paste into the text box below.`;
  } else {
    help.innerHTML = `Open the image in your OS's photo viewer, copy the recognized text (most modern OSes do this automatically), and paste into the text box below.`;
  }
}

(() => {
  const dz = $("#dropzone");
  if (!dz) return;
  ["dragenter", "dragover"].forEach(t => dz.addEventListener(t, (e) => {
    e.preventDefault();
    dz.classList.add("drag-over");
  }));
  ["dragleave", "dragend"].forEach(t => dz.addEventListener(t, () => dz.classList.remove("drag-over")));
  dz.addEventListener("drop", async (e) => {
    e.preventDefault();
    dz.classList.remove("drag-over");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) await handleImportFile(file);
  });
  // Stop the browser from opening a file dropped outside the dropzone.
  ["dragover", "drop"].forEach(t => window.addEventListener(t, (e) => {
    if (e.target.closest("#dropzone")) return;
    e.preventDefault();
  }));
})();

// ─────────────────────────────────────────────────────────
// JOB-DESCRIPTION MATCH (local scoring · no AI · no exaggeration)
// ─────────────────────────────────────────────────────────
//
// We tokenize the JD and resume, collapse a small synonym/phrase set, and
// compare normalized term sets. Scores are coverage of JD-weighted terms.
// Missing keywords are phrased as gaps — never as bullets to add — so the
// user can't be nudged into claiming something untrue.

const MATCH_STOPWORDS = new Set([
  "a","an","the","and","or","but","of","to","in","for","on","with","at","by","from","as","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","should","could","may","might","can","this","that","these","those","you","your","our","we","they","their","them","its","it","what","which","who","when","where","why","how","all","each","every","both","few","more","most","some","such","no","nor","not","only","own","same","than","too","very","just","also","up","out","into","over","under","again","further","then","once","here","there","any","s","t","d","ll","m","o","re","ve","y","etc","via","per","upon","across","through","within","while","whether","including","include","includes","using","use","used","work","working","worked","ability","able","strong","excellent","good","great","required","preferred","plus","candidate","candidates","role","position","applicant","applicants","job","jobs","opportunity","company","companies","team","teams","year","years","yrs","new","other","others","day","days","time","times","based","level","levels","high","low","key","best","various","multiple","one","two","three","four","five","first","second","third","please","must","need","needs","needed","want","wants","look","looking","seeking","etc","make","makes","made","provide","provides","provided","helping","help","helps","helped","ensure","ensures","ensured","support","supports","supported","including","includes","included","across","along","among","beyond","over","into","upon","under","throughout","general","overall","daily","weekly","monthly","yearly","etc","you'll","we'll","they'll","i'm","you're","we're","they're","it's","that's","there's","here's","let's","cannot","can't","won't","don't","doesn't","didn't","isn't","aren't","wasn't","weren't","hasn't","haven't","hadn't"
]);

const MATCH_SYNONYMS = {
  // Tech shorthand
  "js": "javascript", "ts": "typescript", "py": "python",
  "node": "nodejs", "nodejs": "nodejs", "k8s": "kubernetes",
  "db": "database", "ml": "machinelearning", "ai": "artificialintelligence",
  "ux": "userexperience", "ui": "userinterface",
  "pm": "projectmanagement", "qa": "qualityassurance",
  "hr": "humanresources", "ms": "microsoft", "msft": "microsoft",
  "xls": "excel", "ppt": "powerpoint", "doc": "microsoftword",
  "aws": "aws", "gcp": "googlecloud", "azure": "azure",
  "ci": "continuousintegration", "cd": "continuousdeployment",
  // Verb forms → canonical root
  "managed": "manage", "managing": "manage", "manager": "manage", "management": "manage",
  "developed": "develop", "developing": "develop", "developer": "develop", "development": "develop",
  "led": "lead", "leading": "lead", "leader": "lead", "leadership": "lead",
  "communicated": "communicate", "communicating": "communicate", "communication": "communicate", "communications": "communicate",
  "coordinated": "coordinate", "coordinating": "coordinate", "coordination": "coordinate", "coordinator": "coordinate",
  "analyzed": "analyze", "analyzing": "analyze", "analysis": "analyze", "analytical": "analyze", "analyst": "analyze", "analytics": "analyze",
  "organized": "organize", "organizing": "organize", "organization": "organize", "organizational": "organize",
  "trained": "train", "training": "train", "trainer": "train",
  "presented": "present", "presenting": "present", "presentation": "present", "presentations": "present",
  "designed": "design", "designing": "design", "designer": "design",
  "built": "build", "building": "build", "builder": "build",
  "created": "create", "creating": "create", "creation": "create", "creator": "create", "creative": "create",
  "implemented": "implement", "implementing": "implement", "implementation": "implement",
  "delivered": "deliver", "delivering": "deliver", "delivery": "deliver",
  "researched": "research", "researching": "research", "researcher": "research",
  "documented": "document", "documenting": "document", "documentation": "document",
  "scheduled": "schedule", "scheduling": "schedule",
  "negotiated": "negotiate", "negotiating": "negotiate", "negotiation": "negotiate",
  "collaborated": "collaborate", "collaborating": "collaborate", "collaboration": "collaborate", "collaborative": "collaborate",
  "operated": "operate", "operating": "operate", "operation": "operate", "operations": "operate", "operational": "operate",
  "marketed": "marketing", "marketed": "marketing",
  "sales": "sale", "selling": "sale", "sold": "sale",
  "served": "serve", "serving": "serve", "service": "serve", "services": "serve",
  "supports": "support", "supporting": "support", "supported": "support",
  "clients": "client", "customers": "customer",
  "events": "event",
};

// Multi-word phrases collapsed pre-tokenization so they survive as single terms.
const MATCH_PHRASES = [
  ["project management", "projectmanagement"],
  ["product management", "productmanagement"],
  ["account management", "accountmanagement"],
  ["operations management", "operationsmanagement"],
  ["records management", "recordsmanagement"],
  ["time management", "timemanagement"],
  ["customer service", "customerservice"],
  ["client service", "customerservice"],
  ["data entry", "dataentry"],
  ["data analysis", "dataanalysis"],
  ["data analytics", "dataanalysis"],
  ["business administration", "businessadministration"],
  ["business operations", "businessoperations"],
  ["business development", "businessdevelopment"],
  ["social media", "socialmedia"],
  ["digital marketing", "digitalmarketing"],
  ["content creation", "contentcreation"],
  ["content marketing", "contentmarketing"],
  ["event planning", "eventplanning"],
  ["event coordination", "eventcoordination"],
  ["event management", "eventmanagement"],
  ["public speaking", "publicspeaking"],
  ["problem solving", "problemsolving"],
  ["critical thinking", "criticalthinking"],
  ["team work", "teamwork"],
  ["team building", "teambuilding"],
  ["team coordination", "teamcoordination"],
  ["user experience", "userexperience"],
  ["user interface", "userinterface"],
  ["machine learning", "machinelearning"],
  ["artificial intelligence", "artificialintelligence"],
  ["quality assurance", "qualityassurance"],
  ["human resources", "humanresources"],
  ["microsoft office", "microsoftoffice"],
  ["microsoft excel", "microsoftexcel"],
  ["microsoft word", "microsoftword"],
  ["microsoft powerpoint", "microsoftpowerpoint"],
  ["google workspace", "googleworkspace"],
  ["google docs", "googledocs"],
  ["google sheets", "googlesheets"],
  ["google drive", "googledrive"],
  ["power bi", "powerbi"],
  ["power point", "powerpoint"],
  ["front desk", "frontdesk"],
  ["administrative support", "administrativesupport"],
  ["office operations", "officeoperations"],
  ["calendar management", "calendarmanagement"],
  ["document preparation", "documentpreparation"],
  ["vendor management", "vendormanagement"],
  ["relationship building", "relationshipbuilding"],
  ["written communication", "writtencommunication"],
  ["verbal communication", "verbalcommunication"],
  ["bilingual", "bilingual"],
];

const MATCH_PHRASE_DISPLAY = Object.fromEntries(MATCH_PHRASES.map(([p, n]) => [n, p]));

function matchPreprocess(text) {
  if (!text) return "";
  let s = " " + text.toLowerCase() + " ";
  for (const [phrase, repl] of MATCH_PHRASES) {
    if (s.includes(phrase)) s = s.split(phrase).join(repl);
  }
  return s;
}

function normalizeTerm(token) {
  // Collapsed phrases ("dataanalysis", "humanresources") are already canonical —
  // don't strip suffixes from them or the display lookup breaks.
  if (MATCH_PHRASE_DISPLAY[token]) return token;
  if (MATCH_SYNONYMS[token]) return MATCH_SYNONYMS[token];
  let t = token;
  if (t.length > 5 && t.endsWith("ing")) t = t.slice(0, -3);
  else if (t.length > 4 && t.endsWith("ies")) t = t.slice(0, -3) + "y";
  else if (t.length > 4 && t.endsWith("ed")) t = t.slice(0, -2);
  else if (t.length > 4 && t.endsWith("es")) t = t.slice(0, -2);
  else if (t.length > 3 && t.endsWith("s")) t = t.slice(0, -1);
  if (MATCH_SYNONYMS[t]) return MATCH_SYNONYMS[t];
  return t;
}

function extractMatchTerms(text) {
  const set = new Set();
  const freq = new Map();
  const surface = new Map();
  if (!text || !text.trim()) return { set, freq, surface };
  const pre = matchPreprocess(text);
  const raws = pre.split(/[\s,;:.\/()\[\]{}<>!?"'`~=*•|·–—\-]+/);
  for (const raw of raws) {
    const cleaned = raw.replace(/^[^a-z0-9+#]+|[^a-z0-9+#.]+$/g, "");
    if (!cleaned || cleaned.length < 3) continue;
    if (/^\d+$/.test(cleaned)) continue;
    if (MATCH_STOPWORDS.has(cleaned)) continue;
    const n = normalizeTerm(cleaned);
    if (!n || n.length < 3 || MATCH_STOPWORDS.has(n)) continue;
    set.add(n);
    freq.set(n, (freq.get(n) || 0) + 1);
    if (!surface.has(n)) {
      surface.set(n, MATCH_PHRASE_DISPLAY[n] || cleaned);
    }
  }
  return { set, freq, surface };
}

function resumeSectionTexts() {
  const skillsMode = tcfg().skillsMode;
  const skillsText = skillsMode === "categories"
    ? state.skills_categories.map(c => `${c.label} ${c.content}`).join(" ")
    : skillsMode === "pipe"
    ? (state.skills_inline || "")
    : state.skills_two_column.map(r => `${r.left} ${r.right}`).join(" ");
  const expText = state.section_enabled.experience
    ? state.experience.map(e => `${e.title} ${(e.bullets || []).join(" ")}`).join(" ")
    : "";
  const projText = state.section_enabled.projects
    ? state.projects.map(p => `${p.title} ${(p.bullets || []).join(" ")}`).join(" ")
    : "";
  const summaryText = state.summary || "";
  return {
    skills: skillsText,
    experience: `${expText} ${projText}`.trim(),
    summary: summaryText,
    all: `${summaryText} ${skillsText} ${expText} ${projText}`,
  };
}

function coverageScore(jdFreq, sectionSet) {
  let total = 0, matched = 0;
  for (const [term, f] of jdFreq) {
    total += f;
    if (sectionSet.has(term)) matched += f;
  }
  if (total === 0) return 0;
  return Math.round((matched / total) * 100);
}

function analyzeMatch(jd) {
  const jdT = extractMatchTerms(jd);
  if (jdT.set.size === 0) return null;
  const sections = resumeSectionTexts();
  const skillsT = extractMatchTerms(sections.skills);
  const expT = extractMatchTerms(sections.experience);
  const summaryT = extractMatchTerms(sections.summary);
  const allT = extractMatchTerms(sections.all);

  const overall = coverageScore(jdT.freq, allT.set);
  const skills = coverageScore(jdT.freq, skillsT.set);
  const experience = coverageScore(jdT.freq, expT.set);
  const summary = coverageScore(jdT.freq, summaryT.set);

  // Missing: in JD but not in resume; rank by JD frequency.
  const missing = [];
  for (const [term, f] of jdT.freq) {
    if (!allT.set.has(term)) missing.push({ term, surface: jdT.surface.get(term) || term, freq: f });
  }
  missing.sort((a, b) => b.freq - a.freq || a.term.localeCompare(b.term));

  return {
    jdSet: jdT.set,
    jdTermCount: jdT.set.size,
    overall, skills, experience, summary,
    missing,
  };
}

function countTermHits(text, jdSet) {
  if (!text || !jdSet || jdSet.size === 0) return 0;
  const { set } = extractMatchTerms(text);
  let hits = 0;
  for (const t of set) if (jdSet.has(t)) hits++;
  return hits;
}

function bulletClass(hits, hotMin, warmMin) {
  if (hits >= hotMin) return "bullet-hot";
  if (hits >= warmMin) return "bullet-warm";
  return "bullet-cold";
}

function applyHeatMap(ctx) {
  const frames = $$("#preview .preview-frame");
  if (!ctx) {
    frames.forEach(f => f.classList.remove("match-mode"));
    $$("#preview .bullet-hot, #preview .bullet-warm, #preview .bullet-cold").forEach(el => {
      el.classList.remove("bullet-hot", "bullet-warm", "bullet-cold");
    });
    return;
  }
  frames.forEach(f => f.classList.add("match-mode"));
  $$("#preview .bullets-list li").forEach(li => {
    const hits = countTermHits(li.textContent, ctx.jdSet);
    li.classList.remove("bullet-hot", "bullet-warm", "bullet-cold");
    li.classList.add(bulletClass(hits, 2, 1));
  });
  $$("#preview .skill-cat").forEach(el => {
    const hits = countTermHits(el.textContent, ctx.jdSet);
    el.classList.remove("bullet-hot", "bullet-warm", "bullet-cold");
    el.classList.add(bulletClass(hits, 2, 1));
  });
  $$("#preview .skills-2col > *").forEach(el => {
    const hits = countTermHits(el.textContent, ctx.jdSet);
    el.classList.remove("bullet-hot", "bullet-warm", "bullet-cold");
    el.classList.add(hits >= 1 ? "bullet-hot" : "bullet-cold");
  });
}

function verdictFor(score, missingCount) {
  if (score >= 75) return `Strong match — ${missingCount} term${missingCount === 1 ? "" : "s"} from the JD not on the resume.`;
  if (score >= 55) return `Solid match — ${missingCount} key term${missingCount === 1 ? "" : "s"} missing. Worth tailoring.`;
  if (score >= 35) return `Partial match — ${missingCount} JD term${missingCount === 1 ? "" : "s"} missing. Add only what's true.`;
  return `Low match — ${missingCount} JD term${missingCount === 1 ? "" : "s"} missing. This role may not fit yet.`;
}

function gradeTone(score) {
  if (score >= 70) return "";
  if (score >= 45) return "warn";
  return "poor";
}

function barTone(score) {
  if (score >= 70) return "";
  if (score >= 45) return "warn";
  return "poor";
}

function renderMatchUI(ctx) {
  const scoreEl = $("#match-score");
  const missingEl = $("#match-missing");
  if (!ctx) {
    scoreEl.innerHTML = `<div class="match-placeholder">Paste a job description to score the resume.</div>`;
    missingEl.classList.add("hidden");
    missingEl.innerHTML = "";
    return;
  }
  const verdict = verdictFor(ctx.overall, ctx.missing.length);
  scoreEl.innerHTML = `
    <div class="grade-card">
      <div class="grade-circle ${gradeTone(ctx.overall)}">
        <div class="grade-num">${ctx.overall}</div>
        <div class="grade-lbl">/100</div>
      </div>
      <div class="grade-verdict">
        <div class="verdict-text">${esc(verdict)}</div>
        <div class="subscores">
          ${subscoreRow("SKILLS", ctx.skills)}
          ${subscoreRow("EXPERIENCE", ctx.experience)}
          ${subscoreRow("SUMMARY", ctx.summary)}
        </div>
      </div>
    </div>
  `;

  if (ctx.missing.length === 0) {
    missingEl.classList.remove("hidden");
    missingEl.innerHTML = `<div class="match-h">MISSING KEYWORDS</div><div class="missing-empty">▶ NO GAPS — every JD term shows up somewhere on the resume.</div>`;
    return;
  }
  const top = ctx.missing.slice(0, 16);
  const overflow = ctx.missing.length - top.length;
  const chips = top.map((m, i) => {
    const cls = i < 8 ? "missing-chip" : "missing-chip weak";
    return `<span class="${cls}">${esc(m.surface)}</span>`;
  }).join("");
  const more = overflow > 0 ? `<span class="missing-chip weak">+${overflow} more</span>` : "";
  missingEl.classList.remove("hidden");
  missingEl.innerHTML = `
    <div class="match-h">MISSING KEYWORDS <span class="match-note">found in JD, not on resume — add only if true</span></div>
    <div class="missing-list">${chips}${more}</div>
  `;
}

function widthBucket(pct) {
  // Round to nearest 5% so we can drive bar widths via CSS classes (no inline styles).
  const clamped = Math.max(0, Math.min(100, pct));
  return Math.round(clamped / 5) * 5;
}

function subscoreRow(label, pct) {
  const w = widthBucket(pct);
  return `
    <div class="subscore">
      <span class="lbl">${label}</span>
      <div class="bar"><span class="bar-fill w-${w} ${barTone(pct)}"></span></div>
      <span class="pct">${pct}</span>
    </div>
  `;
}

function runMatch() {
  if (!state.match.on) {
    applyHeatMap(null);
    return;
  }
  const ctx = state.match.jd.trim() ? analyzeMatch(state.match.jd) : null;
  applyHeatMap(ctx);
  renderMatchUI(ctx);
}

function toggleMatch() {
  state.match.on = !state.match.on;
  const chip = $("#match-chip");
  const chipText = $("#match-chip-text");
  const toolbar = $("#preview-toolbar");
  const panel = $("#match-panel");
  const missing = $("#match-missing");
  chip.setAttribute("aria-pressed", state.match.on ? "true" : "false");
  if (chipText) chipText.textContent = state.match.on ? "EXIT MATCH MODE" : "MATCH JOB DESCRIPTION";
  toolbar.classList.toggle("match-active", state.match.on);
  panel.classList.toggle("hidden", !state.match.on);
  if (!state.match.on) {
    missing.classList.add("hidden");
    missing.innerHTML = "";
  }
  runMatch();
  if (state.match.on) {
    const jd = $("#jd-input");
    if (jd) setTimeout(() => jd.focus(), 60);
  }
}

ACTIONS.toggleMatch = () => toggleMatch();

let _matchDebounce = null;
$("#jd-input").addEventListener("input", (ev) => {
  state.match.jd = ev.target.value;
  clearTimeout(_matchDebounce);
  _matchDebounce = setTimeout(() => runMatch(), 200);
});

// ─────────────────────────────────────────────────────────
// MOBILE PANE SWIPE / TABS
// ─────────────────────────────────────────────────────────

(function setupPaneSwipe() {
  const shell = document.getElementById("shell");
  const tabs = document.querySelectorAll(".pane-tab");
  if (!shell || tabs.length === 0) return;

  const panes = {
    left: shell.querySelector(".pane.left"),
    right: shell.querySelector(".pane.right"),
    final: shell.querySelector(".pane.final"),
  };
  const order = ["left", "right", "final"];

  function isMobile() {
    return window.matchMedia("(max-width: 1100px)").matches;
  }

  function scrollToPane(target) {
    const pane = panes[target];
    if (!pane || !isMobile()) return;
    shell.scrollTo({ left: pane.offsetLeft, behavior: "smooth" });
  }

  function setActive(target) {
    tabs.forEach(t => {
      const on = t.dataset.paneTarget === target;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.body.classList.toggle("viewing-final", target === "final");
    if (target === "final") {
      mirrorPreviewToFinal();
      updateFinalActionState();
    }
  }

  tabs.forEach(t => {
    t.addEventListener("click", () => {
      const target = t.dataset.paneTarget;
      setActive(target);
      scrollToPane(target);
    });
  });

  let _scrollTimer = null;
  shell.addEventListener("scroll", () => {
    if (!isMobile()) return;
    clearTimeout(_scrollTimer);
    _scrollTimer = setTimeout(() => {
      const w = shell.clientWidth || 1;
      const idx = Math.max(0, Math.min(order.length - 1, Math.round(shell.scrollLeft / w)));
      setActive(order[idx]);
    }, 60);
  });

  // Expose for action handlers (e.g. "KEEP EDITING" jumps back to EDIT).
  window.__paneSwipe = { setActive, scrollToPane };
})();

// Scale the preview to fit the viewport on mobile. The frame keeps its
// desktop nominal width (612px) so the layout — title/date alignment,
// pagination, wrapping — matches the desktop view exactly; we just zoom
// the visual size to fit the phone.
const PREVIEW_NOMINAL_WIDTH = 612;
function updatePreviewScale() {
  const wrap = document.querySelector(".pane.right .preview-wrap");
  if (!wrap) return;
  const isMobile = window.matchMedia("(max-width: 1100px)").matches;
  if (!isMobile) { wrap.style.zoom = ""; return; }
  const pane = wrap.closest(".pane.right");
  const cs = pane ? getComputedStyle(pane) : null;
  const padL = cs ? parseFloat(cs.paddingLeft) : 0;
  const padR = cs ? parseFloat(cs.paddingRight) : 0;
  const available = (pane ? pane.clientWidth : window.innerWidth) - padL - padR;
  const scale = Math.min(1, available / PREVIEW_NOMINAL_WIDTH);
  wrap.style.zoom = String(scale);
}
window.addEventListener("resize", updatePreviewScale);
window.addEventListener("load", updatePreviewScale);

// ─────────────────────────────────────────────────────────
// SERVICE WORKER REGISTRATION (phase 2)
// ─────────────────────────────────────────────────────────

if ("serviceWorker" in navigator) {
  // If a SW already controls this page, a later controllerchange means a new
  // version activated — reload once so the fresh app.js/styles.css take effect
  // (otherwise users keep running stale cached shell files after a deploy).
  const hadController = !!navigator.serviceWorker.controller;
  let _swReloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || _swReloaded) return;
    _swReloaded = true;
    window.location.reload();
  });
  // Defer registration to idle so it never delays first paint.
  const register = () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Registration failure is non-fatal — the app still works online.
    });
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register);
}

// ─────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────

// Apply the saved theme before the first render so users don't see a flash
// of the light palette when they've opted into dark mode.
applySavedTheme();
restoreState();
render();
updatePreviewScale();
