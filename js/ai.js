// ResumeCanvas — optional AI assist (client side).
// Talks to /api/ai (see api/ai.js). Everything here is additive: when the
// endpoint reports it is not configured, no AI controls are shown and the
// app behaves exactly as before. Text leaves the browser only when the user
// explicitly picks an AI action.
//
// Classic script sharing the page's global scope with app.js.

let _aiEnabled = false;
let _aiPolishPending = null; // [{ id, before, after, apply(text) }]

async function aiProbe() {
  try {
    const r = await fetch("./api/ai", { method: "GET", cache: "no-store" });
    if (!r.ok) return false;
    const j = await r.json();
    _aiEnabled = !!(j && j.enabled);
  } catch (_e) {
    _aiEnabled = false;
  }
  document.body.classList.toggle("ai-enabled", _aiEnabled);
  if (_aiEnabled && typeof renderQualityPanel === "function") renderQualityPanel();
  return _aiEnabled;
}

function aiIsEnabled() { return _aiEnabled; }

// Should an import go through the AI parser? Only when the endpoint is up and
// the user ticked the box in the intake card.
function aiParseWanted() {
  const box = document.getElementById("ai-parse-toggle");
  return _aiEnabled && !!(box && box.checked);
}

async function aiPost(payload) {
  const r = await fetch("./api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let j = null;
  try { j = await r.json(); } catch (_e) { /* non-JSON error page */ }
  if (!r.ok) throw new Error((j && j.error) || `AI request failed (${r.status})`);
  return j;
}

// Raw resume text → the same structure RcParse.parseResumeText returns.
async function aiParseResume(text) {
  const j = await aiPost({ op: "parse", text });
  if (!j || !j.parsed || !j.parsed.header) throw new Error("AI returned no resume");
  return j.parsed;
}

// Gather every non-empty bullet in the resume with a stable id and a setter.
function collectResumeBullets() {
  const out = [];
  (state.experience || []).forEach((e, i) => (e.bullets || []).forEach((b, bi) => {
    if (b && b.trim()) out.push({ id: `exp:${i}:${bi}`, text: b, owner: e.title || `Position ${i + 1}`, apply: (t) => { state.experience[i].bullets[bi] = t; } });
  }));
  (state.projects || []).forEach((p, i) => (p.bullets || []).forEach((b, bi) => {
    if (b && b.trim()) out.push({ id: `proj:${i}:${bi}`, text: b, owner: p.title || `Project ${i + 1}`, apply: (t) => { state.projects[i].bullets[bi] = t; } });
  }));
  (state.custom_sections || []).forEach((s, i) => (s.bullets || []).forEach((b, bi) => {
    if (b && b.trim()) out.push({ id: `custom:${i}:${bi}`, text: b, owner: s.title || `Section ${i + 1}`, apply: (t) => { state.custom_sections[i].bullets[bi] = t; } });
  }));
  return out;
}

async function aiPolishBullets() {
  if (!_aiEnabled) { toast("AI IS NOT CONFIGURED ON THIS DEPLOYMENT"); return; }
  const bullets = collectResumeBullets();
  if (!bullets.length) { toast("ADD A FEW BULLETS FIRST"); return; }
  const btn = document.getElementById("ai-polish-btn");
  if (btn) { btn.disabled = true; btn.textContent = "✦ POLISHING…"; }
  toast("ASKING AI TO TIGHTEN YOUR BULLETS…");
  try {
    const j = await aiPost({
      op: "polish",
      bullets: bullets.map((b) => ({ id: b.id, text: b.text })),
      context: { title: state.professional_title || "", summary: state.summary || "" },
    });
    const byId = new Map((j.bullets || []).map((b) => [b.id, b.text]));
    const changed = bullets
      .map((b) => ({ ...b, after: (byId.get(b.id) || "").trim() }))
      .filter((b) => b.after && b.after !== b.text.trim());
    if (!changed.length) { toast("✓ YOUR BULLETS ALREADY READ WELL"); return; }
    showAiPolishModal(changed);
  } catch (err) {
    console.error("polish failed", err);
    toast(String(err.message || "AI POLISH FAILED").toUpperCase());
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "✦ POLISH BULLETS WITH AI"; }
  }
}

function showAiPolishModal(changed) {
  _aiPolishPending = changed;
  const list = document.getElementById("ai-polish-list");
  const bg = document.getElementById("ai-modal-bg");
  if (!list || !bg) return;
  list.innerHTML = changed.map((c, i) => `
    <label class="ai-row">
      <input type="checkbox" data-ai-idx="${i}" checked>
      <span class="ai-row-body">
        <span class="ai-owner">${esc(c.owner)}</span>
        <span class="ai-before">${esc(c.text)}</span>
        <span class="ai-after">${esc(c.after)}</span>
      </span>
    </label>`).join("");
  bg.classList.add("show");
  const dlg = bg.querySelector(".modal");
  if (dlg) dlg.focus();
}

function closeAiModal() {
  const bg = document.getElementById("ai-modal-bg");
  if (bg) bg.classList.remove("show");
  _aiPolishPending = null;
}

function applyAiPolish() {
  const pending = _aiPolishPending || [];
  let n = 0;
  document.querySelectorAll("#ai-polish-list input[data-ai-idx]").forEach((cb) => {
    const c = pending[+cb.dataset.aiIdx];
    if (cb.checked && c) { c.apply(c.after); n += 1; }
  });
  closeAiModal();
  if (n) { render(); toast(`✓ APPLIED ${n} POLISHED BULLET${n === 1 ? "" : "S"}`); }
}
