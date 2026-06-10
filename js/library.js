// ResumeCanvas — resume library: autosave, drafts/saved buckets, backup
// Classic script sharing the global scope with app.js (same pattern as
// vendor/): declarations only at load time; call sites live in app.js.

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
  return { drafts: [{ id, name: "Sample Resume", createdAt: now, updatedAt: now, state: seed }], saved: [], activeId: id };
}

function restoreState() {
  // Meeting-room workflow: every launch starts fresh from the original demo
  // sample, so the six layouts always present the John/Jane Doe placeholder
  // content. Anything imported or typed during a session overwrites the visible
  // resume — exactly what you want while building a student's resume to export —
  // but is intentionally NOT carried across launches. Reopening the app always
  // returns to a clean set of demos. To keep a finished resume, export it
  // (PDF / DOC / print); in-app library entries are session-only by design.
  //
  // (loadLibrary / migrateLegacyLibrary / migrateLegacyState remain available
  // for the in-session multi-resume library, but are no longer used to seed the
  // baseline — the baseline is always the demos.)
  replaceStateWith(JSON.parse(_DEFAULT_STATE_JSON));
  _library = seedLibrary();
  writeLibrary();
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
  const seed = DEMO_SEEDS[state.template] || JSON.parse(_DEFAULT_STATE_JSON);
  replaceStateWith(seed);
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
// BACKUP / RESTORE
// localStorage is best-effort only (iOS evicts web storage after ~7 days
// of disuse), so users can file the whole library to a JSON they own and
// bring it back later — on this device or another.
// ─────────────────────────────────────────────────────────

function exportLibraryBackup() {
  persistStateNow(); // capture in-flight edits before snapshotting
  const payload = {
    app: "resumecanvas",
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    library: { drafts: _library.drafts, saved: _library.saved, activeId: _library.activeId },
  };
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(JSON.stringify(payload, null, 2), `resumecanvas-backup-${stamp}.json`, "application/json");
  toast("BACKUP DOWNLOADED — KEEP IT SOMEWHERE SAFE");
}

// Accepts both a full backup file and a bare library object. Replaces the
// current library after the user confirms; like the v2 migration, a backup
// that exceeds the per-bucket caps is tolerated — caps only gate new adds.
function applyLibraryBackup(text) {
  let lib;
  try {
    const parsed = JSON.parse(text);
    lib = parsed && parsed.library ? parsed.library : parsed;
  } catch (_err) {
    toast("NOT A VALID BACKUP FILE");
    return;
  }
  const valid = (r) => r && typeof r === "object" && typeof r.id === "string" && r.state && typeof r.state === "object";
  const drafts = Array.isArray(lib && lib.drafts) ? lib.drafts.filter(valid) : [];
  const saved = Array.isArray(lib && lib.saved) ? lib.saved.filter(valid) : [];
  if (drafts.length + saved.length === 0) {
    toast("NOT A VALID BACKUP FILE");
    return;
  }
  const total = drafts.length + saved.length;
  const ok = confirm(`Restore ${total} resume${total === 1 ? "" : "s"} from this backup? This replaces everything currently in the library.`);
  if (!ok) return;
  const all = drafts.concat(saved);
  const activeId = all.some((r) => r.id === lib.activeId) ? lib.activeId : all[0].id;
  _library = { drafts, saved, activeId };
  replaceStateWith(all.find((r) => r.id === activeId).state);
  writeLibrary();
  render();
  renderLibraryList();
  toast(`RESTORED ${total} RESUME${total === 1 ? "" : "S"}`);
}
