// ─────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────

let state = {
  template: "demo_4",
  font_pt: null, // null = use template default (12pt for D4, 11pt for D2). Manual override via font chips.
  section_enabled: { summary: true, projects: true, experience: true },
  section_order: {
    demo_4: ["education", "skills", "projects", "experience"],
    demo_2: ["skills", "education", "certs", "projects", "experience"],
  },
  match: { on: false, jd: "" },
  // Demo 4 header
  name: "Jane Doe",
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
  if (state.template === "demo_4") {
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
  body.innerHTML = state.education.map((e, i) => {
    const extra = eduSchemaIsDemo2 ? `
      <div class="row"><label>SUB-LINE — BOLD PORTION (optional)</label><input type="text" data-edu="${i}" data-field="subline_bold" value="${esc(e.subline_bold || "")}" placeholder="e.g. Associate of Arts, Economics"><div class="help">Appears bold at start of a second line. Use for a secondary degree at the same school.</div></div>
      <div class="row"><label>SUB-LINE — REST (optional)</label><input type="text" data-edu="${i}" data-field="subline_rest" value="${esc(e.subline_rest || "")}" placeholder=" | Minor in Economy | Honors"><div class="help">Plain continuation. Include leading space and separator.</div></div>
      <div class="row"><label>RELEVANT COURSEWORK (optional)</label><input type="text" data-edu="${i}" data-field="coursework" value="${esc(e.coursework || "")}" placeholder="SQL, Tableau, Power BI, ..."></div>
    ` : "";
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
  if (state.template === "demo_4") {
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
        <div class="row"><label>BULLETS</label>
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
function addEdu() { state.education.push({ school: "", city: "", degree: "", date: "", subline_bold: "", subline_rest: "", coursework: "" }); render(); }
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
  triggerCamera: () => triggerCamera(),
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

$$(".tpl-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    if (chip.dataset.tpl === state.template) return;
    state.template = chip.dataset.tpl;
    state.font_pt = null; // reset font choice on template switch — each template has its own default
    $$(".tpl-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    $$("[data-font]").forEach(c => c.classList.remove("active"));
    $("#font-chip-default").classList.add("active");
    $("#panel-certs").classList.toggle("hidden", state.template !== "demo_2");
    reorderPanels();
    setCaseId();
    render();
  });
});

// Window resize re-paginates the preview at the new width.
let _resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => renderPreview(), 180);
});

// Font chip selector — manual override only
$$("[data-font]").forEach(chip => {
  chip.addEventListener("click", () => {
    $$("[data-font]").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    const v = chip.dataset.font;
    state.font_pt = v === "default" ? null : parseInt(v, 10);
    renderPreview();
  });
});

// ─────────────────────────────────────────────────────────
// LIVE PREVIEW
// ─────────────────────────────────────────────────────────

function renderSummaryPreviewHtml() {
  let html = `<div class="resume-section-h">PROFILE SUMMARY</div>`;
  html += `<div>${linkify(state.summary)}</div>`;
  return html;
}

function renderEducationPreviewHtml(tpl) {
  let html = `<div class="resume-section-h">EDUCATION</div>`;
  state.education.forEach((e, idx) => {
    const gapClass = idx > 0 ? " edu-gap" : "";
    if (tpl === "demo_4") {
      html += `<div class="edu-row${gapClass}"><div class="strong">${esc(e.school)}</div><div class="strong">${esc(e.city)}</div></div>`;
      html += `<div class="edu-row"><div>${esc(e.degree)}</div><div>${esc(e.date)}</div></div>`;
    } else {
      html += `<div class="edu-row${gapClass}"><div class="strong">${esc(e.school)}</div><div>${esc(e.city)}</div></div>`;
      html += `<div class="edu-degree-row"><div>${esc(e.degree)}</div><div>${esc(e.date)}</div></div>`;
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
  let html = "";
  if (tpl === "demo_4") {
    html += `<div class="resume-section-h">SKILLS</div>`;
    state.skills_categories.forEach(c => {
      html += `<div class="skill-cat"><span class="lbl">${esc(c.label)}:</span> ${esc(c.content)}</div>`;
    });
  } else {
    html += `<div class="resume-section-h">HIGHLIGHTED SKILLS</div>`;
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
  let html = `<div class="resume-section-h">CERTIFICATIONS</div>`;
  html += `<ul class="bullets-list">`;
  state.certifications.forEach(c => { html += `<li>${linkify(c)}</li>`; });
  html += `</ul>`;
  return html;
}

function renderProjectsPreviewHtml(tpl) {
  let html = `<div class="resume-section-h">PROJECTS</div>`;
  state.projects.forEach(p => {
    if (tpl === "demo_4") {
      html += `<div class="entry-title-row"><div class="title">${esc(p.title)}</div><div class="date">${esc(p.date)}</div></div>`;
      if (p.location) html += `<div class="entry-loc">${linkify(p.location)}</div>`;
    } else {
      html += `<div class="proj-title">${esc(p.title)}</div>`;
    }
    if (p.bullets && p.bullets.length) {
      html += `<ul class="bullets-list">`;
      p.bullets.forEach(b => { if (b) html += `<li>${linkify(b)}</li>`; });
      html += `</ul>`;
    }
  });
  return html;
}

function renderExperiencePreviewHtml(tpl) {
  let html = `<div class="resume-section-h">WORK EXPERIENCE</div>`;
  state.experience.forEach(en => {
    html += `<div class="entry-title-row"><div class="title">${esc(en.title)}</div><div class="date">${esc(en.date)}</div></div>`;
    if (tpl === "demo_4") {
      if (en.location) html += `<div class="entry-loc">${linkify(en.location)}</div>`;
    } else {
      if (en.company_city) html += `<div class="exp-company">${linkify(en.company_city)}</div>`;
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
  certs: (tpl) => tpl === "demo_2" ? renderCertsPreviewHtml() : "",
  projects: (tpl) => (state.section_enabled.projects && state.projects.length > 0) ? renderProjectsPreviewHtml(tpl) : "",
  experience: (tpl) => (state.section_enabled.experience && state.experience.length > 0) ? renderExperiencePreviewHtml(tpl) : "",
};

function renderPreview() {
  const tpl = state.template;
  const f = $("#preview");
  let html = `<div class="resume-name">${esc(state.name) || "—"}</div>`;
  if (tpl === "demo_4") {
    const extraLinks = (state.links || []).filter(Boolean).map(linkify).join(" | ");
    const contactParts = [esc(state.location), esc(state.phone), linkify(state.email), linkify(state.linkedin), extraLinks].filter(Boolean);
    html += `<div class="resume-contact">${contactParts.join(" | ")}</div>`;
  } else {
    html += `<div class="resume-contact">${linkify(state.contact_line1)}<br>${linkify(state.contact_line2)}</div>`;
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

  const defaultFontPt = tpl === "demo_4" ? 12 : 11;
  const fontPt = state.font_pt || defaultFontPt;
  state._appliedFontPt = fontPt;

  // Render content into a single frame, then paginate by measuring children.
  const frameClass = `preview-frame ${tpl} font-${fontPt}`;
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

  schedulePersist();
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

function render() {
  // A full render() rebuilds the form DOM, which would orphan an active
  // mic button mid-stream. Stop dictation first so the user isn't stuck
  // with a phantom "listening" state and an unreachable target field.
  if (_recordingTarget) stopDictation();
  renderHeader();
  renderSummary();
  renderEducation();
  renderSkills();
  if (state.template === "demo_2") renderCerts();
  renderProjects();
  renderExperience();
  applySectionToggleStates();
  reorderPanels();
  recomputeSectionIndices();
  setCaseId();
  renderPreview();
  updateLibraryPill();
  hideMicButtonsIfUnsupported();
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
  const fontPt = state._appliedFontPt || (state.template === "demo_4" ? 12 : 11);
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
  .preview-frame { font-family: Georgia, serif; line-height: 1.45; font-size: ${fontPt}pt; color: #020826; }
  .resume-name { text-align: center; font-weight: 700; margin: 0 0 3px 0; line-height: 1.1; font-size: ${state.template === "demo_4" ? "20pt" : "16pt"}; }
  .resume-contact { text-align: center; font-size: 9pt; padding-bottom: 4px; border-bottom: 0.5pt solid #c8b89f; margin-bottom: 8px; line-height: 1.35; }
  .demo_2 .resume-contact { border-bottom: none; }
  .resume-contact-divider { border-bottom: 0.5pt solid #c8b89f; margin: 2px 0 8px 0; }
  .resume-section-h { font-weight: 700; padding-bottom: 2px; border-bottom: 0.5pt solid #c8b89f; margin: 12px 0 6px 0; }
  .demo_2 .resume-section-h { font-variant: small-caps; letter-spacing: 0.04em; }
  .edu-row, .entry-title-row, .edu-degree-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .entry-title-row { margin: 8px 0 2px 0; }
  .title, .date, .strong, .bold, .lbl { font-weight: 700; }
  .date { white-space: nowrap; }
  .entry-loc { font-style: italic; margin: 0 0 4px 0; font-size: 0.95em; }
  .bullets-list { margin: 2px 0 0 0; padding-left: 18px; }
  .bullets-list li { margin: 2px 0; }
  .skill-cat { margin: 4px 0; }
  .skills-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; padding-left: 18px; margin: 4px 0; }
  .edu-gap { margin-top: 8px; }
  .proj-title { font-weight: 700; margin: 6px 0 2px 0; }
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
  const fontPt = state.font_pt || (tpl === "demo_4" ? 12 : 11);
  const NAME_PT = tpl === "demo_4" ? 20 : 16;
  const SECTION_PT = tpl === "demo_4" ? 12 : 11;
  const CONTACT_PT = 9;
  const BODY_PT = fontPt;

  const doc = new (global_RcPdf()).Doc({ marginL: 54, marginR: 54, marginT: 40, marginB: 40 });
  doc.lineH = 1.22;
  const contentW = doc.contentWidth();
  const xLeft = doc.marginL;
  const xRight = doc.pageW - doc.marginR;

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
    pdfSectionHeader(doc, "SUMMARY", SECTION_PT, tpl);
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
  // Demo 2: small caps approximation (uppercase the label) for visual parity.
  const text = tpl === "demo_2" ? label.toUpperCase() : label;
  doc.text(text, doc.marginL, doc._cur.y);
  doc.advance(2);
  doc.hline(doc.marginL, doc.pageW - doc.marginR, doc._cur.y, 0.5);
  doc.advance(6);
}

function pdfRenderEducation(doc, bodyPt, sectionPt, tpl, contentW, xLeft, xRight) {
  const items = (state.education || []).filter(e => (e.school || e.degree));
  if (items.length === 0) return;
  pdfSectionHeader(doc, "EDUCATION", sectionPt, tpl);
  doc.setFont("Times-Roman", bodyPt);
  items.forEach((e, idx) => {
    if (idx > 0) doc.advance(4);
    if (tpl === "demo_4") {
      // Row 1: school (bold) left, city right.
      const lineH = bodyPt * 1.2;
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
    } else {
      // Demo 2: school+city on row 1 bold, degree-row, optional subline + coursework.
      const lineH = bodyPt * 1.2;
      doc.ensure(lineH);
      doc.setFont("Times-Bold", bodyPt);
      doc.text(e.school || "", xLeft, doc._cur.y);
      if (e.city) doc.textRight(e.city, xRight, doc._cur.y);
      doc.advance(lineH);
      doc.ensure(lineH);
      doc.setFont("Times-Bold", bodyPt);
      doc.text(e.degree || "", xLeft, doc._cur.y);
      if (e.date) doc.textRight(e.date, xRight, doc._cur.y);
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
      if (e.coursework) {
        doc.setFont("Times-Bold", bodyPt);
        const labelW = global_RcPdf().measure("Times-Bold", bodyPt, "Relevant Coursework: ");
        doc.ensure(lineH);
        doc.text("Relevant Coursework: ", xLeft, doc._cur.y);
        doc.setFont("Times-Roman", bodyPt);
        // Wrap remainder beside the label, then continue on subsequent lines.
        doc.wrap(e.coursework, xLeft + labelW, doc._cur.y, contentW - labelW);
      }
    }
  });
}

function pdfRenderSkills(doc, bodyPt, sectionPt, tpl, contentW, xLeft, xRight) {
  if (tpl === "demo_4") {
    const cats = (state.skills_categories || []).filter(c => c.label || c.content);
    if (cats.length === 0) return;
    pdfSectionHeader(doc, "SKILLS", sectionPt, tpl);
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
  } else {
    const rows = (state.skills_two_column || []).filter(r => r.left || r.right);
    if (rows.length === 0) return;
    pdfSectionHeader(doc, "SKILLS", sectionPt, tpl);
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
  pdfSectionHeader(doc, "CERTIFICATIONS", sectionPt, tpl);
  doc.setFont("Times-Roman", bodyPt);
  items.forEach((c) => doc.bullet(c, xLeft, contentW));
}

function pdfRenderProjects(doc, bodyPt, sectionPt, tpl, contentW, xLeft, xRight) {
  const items = (state.projects || []).filter(p => p.title || (p.bullets || []).some(Boolean));
  if (items.length === 0) return;
  pdfSectionHeader(doc, "PROJECTS", sectionPt, tpl);
  items.forEach((p, idx) => {
    if (idx > 0) doc.advance(4);
    pdfEntryBlock(doc, bodyPt, contentW, xLeft, xRight, p, tpl);
  });
}

function pdfRenderExperience(doc, bodyPt, sectionPt, tpl, contentW, xLeft, xRight) {
  const items = (state.experience || []).filter(e => e.title || (e.bullets || []).some(Boolean));
  if (items.length === 0) return;
  pdfSectionHeader(doc, "WORK EXPERIENCE", sectionPt, tpl);
  items.forEach((e, idx) => {
    if (idx > 0) doc.advance(4);
    pdfEntryBlock(doc, bodyPt, contentW, xLeft, xRight, e, tpl);
  });
}

function pdfEntryBlock(doc, bodyPt, contentW, xLeft, xRight, entry, tpl) {
  const lineH = bodyPt * 1.2;
  doc.setFont("Times-Bold", bodyPt);
  doc.ensure(lineH);
  doc.text(entry.title || "", xLeft, doc._cur.y);
  if (entry.date) doc.textRight(entry.date, xRight, doc._cur.y);
  doc.advance(lineH);
  if (entry.location) {
    doc.setFont(tpl === "demo_2" ? "Times-Roman" : "Times-Italic", bodyPt);
    doc.ensure(lineH);
    doc.text(entry.location, xLeft, doc._cur.y);
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
      _baseValue = appendDictation(_baseValue, final);
    }
    const display = interim ? appendDictation(_baseValue, interim) : _baseValue;
    writeToMicTarget(_recordingTarget, display);
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

function findMicButton(targetId) {
  return document.querySelector(`.mic-btn[data-mic-target="${cssEscape(targetId)}"]`);
}

function findMicField(targetId) {
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
  renderPreview();
}

function syncMicTargetIntoState(targetId, value) {
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
  if (targetId) {
    const btn = findMicButton(targetId);
    if (btn) { btn.classList.remove("recording"); btn.setAttribute("aria-pressed", "false"); }
  }
  const hint = $("#mic-hint-summary");
  if (hint) hint.classList.remove("show");
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
  if (isSpeechSupported()) return;
  document.querySelectorAll(".mic-btn").forEach((el) => el.classList.add("hidden"));
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
  const summaryOn = state.section_enabled.summary !== false;
  const out = {
    name: state.name,
    summary: summaryOn ? state.summary : "",
    font_pt: state._appliedFontPt || (tpl === "demo_4" ? 12 : 11),
    section_order: (state.section_order[tpl] || []).slice(),
  };
  if (tpl === "demo_4") {
    out.location = state.location;
    out.phone = state.phone;
    out.email = state.email;
    out.linkedin = state.linkedin;
    out.links = (state.links || []).filter(Boolean);
    out.education = state.education
      .filter(e => e.school || e.degree)
      .map(e => ({ school: e.school, city: e.city, degree: e.degree, date: e.date }));
    out.skills_categories = state.skills_categories.filter(c => c.label || c.content);
    out.projects = state.section_enabled.projects
      ? state.projects.filter(p => p.title).map(p => ({
          title: p.title, date: p.date, location: p.location,
          bullets: (p.bullets || []).filter(Boolean),
        }))
      : [];
    out.experience = state.section_enabled.experience
      ? state.experience.filter(e => e.title).map(e => ({
          title: e.title, date: e.date, location: e.location,
          bullets: (e.bullets || []).filter(Boolean),
        }))
      : [];
  } else {
    out.contact_line1 = state.contact_line1;
    out.contact_line2 = state.contact_line2;
    out.education = state.education
      .filter(e => e.school || e.degree)
      .map(e => ({
        school: e.school, city: e.city,
        degree: e.degree, date: e.date,
        subline_bold: e.subline_bold || "",
        subline_rest: e.subline_rest || "",
        coursework: e.coursework || "",
      }));
    out.skills_two_column = state.skills_two_column
      .filter(r => r.left || r.right)
      .map(r => ({ left: r.left || "", right_with_bullet: r.right ? `• ${r.right}` : "" }));
    out.certifications = state.certifications.filter(Boolean);
    out.projects = state.section_enabled.projects
      ? state.projects.filter(p => p.title).map(p => ({
          title: p.title,
          bullets: (p.bullets || []).filter(Boolean),
        }))
      : [];
    out.experience = state.section_enabled.experience
      ? state.experience.filter(e => e.title).map(e => ({
          title: e.title, date: e.date, company_city: e.company_city,
          bullets: (e.bullets || []).filter(Boolean),
        }))
      : [];
  }
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
  const text = `Generate this resume using template ${tpl}:\n\n\`\`\`json\n${payload}\n\`\`\``;
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
  const skillsText = state.template === "demo_4"
    ? state.skills_categories.map(c => `${c.label} ${c.content}`).join(" ")
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
  };

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
      const target = shell.scrollLeft > shell.clientWidth / 2 ? "right" : "left";
      setActive(target);
    }, 60);
  });
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

restoreState();
render();
updatePreviewScale();
