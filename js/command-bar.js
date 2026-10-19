// ResumeCanvas — command bar: talk or type a change, preview it, confirm, undo.
//
// Flow:  speech/text → RcCommands.parseCommand → preview card (+ highlight on
// the resume, + spoken read-back when the command was spoken) → "yes"/APPLY →
// RcCommands.applyCommand (section-locked) → render → undo record.
//
// Nothing is ever applied without a preview. Undo restores only the section
// the command touched, and history is dropped whenever the whole resume is
// swapped (library switch, import, sample change) so an undo can never write
// one resume's section into another.
//
// Classic script sharing the page's global scope with app.js.

const CMD_HISTORY_MAX = 15;
let _cmdPending = null;      // { cmd } or { options: [cmd], prompt }
let _cmdHistory = [];        // [{ label, undo, owner }]
let _cmdContext = null;      // { section, index } of the field last edited
let _cmdRec = null;          // SpeechRecognition used for commands only
let _cmdListening = false;
let _cmdFromVoice = false;   // read back + auto-listen only for spoken commands
let _cmdPendingText = "";    // the input text that produced the open preview

// ── Context: which section/entry the user is working in ───────────────────
const CMD_DATASET_INDEX = [
  ["exp", "experience"], ["expBullet", "experience"],
  ["edu", "education"],
  ["proj", "projects"], ["projBullet", "projects"],
  ["custom", "custom"], ["customBullet", "custom"],
  ["cert", "certs"],
];

function cmdTrackContext(ev) {
  const el = ev.target;
  if (!el || !el.closest) return;
  const panel = el.closest(".panel[data-section]");
  if (!panel) return;
  const section = panel.dataset.section;
  let index = null;
  for (const [key, sec] of CMD_DATASET_INDEX) {
    if (el.dataset && el.dataset[key] != null && sec === section) { index = +el.dataset[key]; break; }
  }
  _cmdContext = { section, index };
  cmdRenderContext();
}

function cmdRenderContext() {
  const wrap = document.getElementById("cmd-context");
  const label = document.getElementById("cmd-context-label");
  if (!wrap || !label) return;
  if (!_cmdContext || !RcCommands.SECTION_LABEL[_cmdContext.section]) { wrap.hidden = true; return; }
  let text = RcCommands.SECTION_LABEL[_cmdContext.section];
  const list = _cmdContext.section === "custom" ? state.custom_sections : state[_cmdContext.section];
  const e = _cmdContext.index != null && Array.isArray(list) ? list[_cmdContext.index] : null;
  if (e) text += ` › ${_cmdContext.section === "education" ? (e.school || e.degree || "untitled") : (e.title || "untitled")}`;
  label.textContent = text;
  wrap.hidden = false;
}

function cmdClearContext() { _cmdContext = null; cmdRenderContext(); }

// ── Highlight the target on the live preview ──────────────────────────────
function cmdTargetText(cmd) {
  const list = cmd.section === "custom" ? state.custom_sections : state[cmd.section];
  if (cmd.index != null && Array.isArray(list) && list[cmd.index]) {
    const e = list[cmd.index];
    return cmd.section === "education" ? (e.school || e.degree) : e.title;
  }
  return null;
}

function cmdHighlight(cmd, flash) {
  cmdClearHighlight();
  const root = document.getElementById("preview");
  if (!root || !cmd) return;
  let el = null;
  const needle = String(cmdTargetText(cmd) || "").trim().slice(0, 24).toLowerCase();
  if (needle) {
    // The smallest element whose text contains the entry's name.
    const all = Array.from(root.querySelectorAll(".preview-frame *"));
    el = all.filter((n) => n.textContent.toLowerCase().includes(needle))
      .sort((a, b) => a.textContent.length - b.textContent.length)[0] || null;
  }
  if (!el && cmd.section === "header") el = root.querySelector(".resume-name");
  if (!el) {
    // Section-level commands (skills, summary, certs) highlight the heading.
    const want = String(cmd.section === "custom" ? (cmdTargetText(cmd) || "") : (tcfg().labels[cmd.section] || "")).trim().toLowerCase();
    if (want) el = Array.from(root.querySelectorAll(".resume-section-h")).find((h) => h.textContent.trim().toLowerCase() === want) || null;
  }
  if (!el) return;
  // Outline the entry's whole heading row (title + date), not just the name.
  el = el.closest(".entry-title-row, .edu-row, .hl-company, .proj-title, .exp-company") || el;
  el.classList.add("cmd-target");
  if (flash) el.classList.add("cmd-flash");
  try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (_e) { /* old engines */ }
  if (flash) setTimeout(() => el.classList.remove("cmd-target", "cmd-flash"), 1600);
}

function cmdClearHighlight() {
  document.querySelectorAll("#preview .cmd-target").forEach((n) => n.classList.remove("cmd-target", "cmd-flash"));
}

// ── Preview card ──────────────────────────────────────────────────────────
function cmdCard(html) {
  const card = document.getElementById("cmd-preview");
  if (!card) return;
  card.innerHTML = html;
  card.classList.toggle("hidden", !html);
}

function cmdDescribeHtml(cmd) {
  const d = RcCommands.describeCommand(state, cmd);
  const before = d.before ? `<div class="cmd-before">${esc(d.before)}</div>` : "";
  const after = d.after ? `<div class="cmd-after">${esc(d.after)}</div>` : "";
  return `<div class="cmd-where">${esc(d.where)}</div><div class="cmd-verb">${esc(d.verb)}</div>${before}${after}`;
}

function cmdSpeakableSummary(cmd) {
  const d = RcCommands.describeCommand(state, cmd);
  const what = d.after || d.before || "";
  return `${d.verb} in ${d.where.replace(" › ", ", ")}${what ? `: ${what}` : ""}.`;
}

function cmdShowPreview(cmd) {
  // Dry run: surface "already there" / "not found" before asking to confirm.
  try { RcCommands.applyCommand(state, cmd); } catch (err) { return cmdShowError(err.message.replace(/^SECTION_LOCK: /, "")); }
  _cmdPending = { cmd };
  cmdCard(`${cmdDescribeHtml(cmd)}
    <div class="cmd-actions">
      <button class="compile-btn" type="button" data-action="cmdApply">✓ APPLY</button>
      <button class="copy-btn" type="button" data-action="cmdCancel">CANCEL</button>
      <span class="cmd-hint">${_cmdFromVoice ? "Say “yes” or “cancel”" : "Enter to apply · Esc to cancel"}</span>
    </div>`);
  cmdHighlight(cmd, false);
  if (_cmdFromVoice) cmdSay(`${cmdSpeakableSummary(cmd)} Say yes to apply.`, true);
}

function cmdShowChoices(r) {
  _cmdPending = { options: r.options, prompt: r.prompt };
  const items = r.options.map((cmd, i) => {
    const d = RcCommands.describeCommand(state, cmd);
    return `<button class="cmd-choice" type="button" data-action="cmdChoose" data-choice="${i}"><b>${i + 1}.</b> ${esc(d.where)}</button>`;
  }).join("");
  cmdCard(`<div class="cmd-verb">${esc(r.prompt)}</div><div class="cmd-choices">${items}</div>
    <div class="cmd-actions"><button class="copy-btn" type="button" data-action="cmdCancel">CANCEL</button></div>`);
  if (_cmdFromVoice) {
    const spoken = r.options.map((cmd, i) => `${i + 1}: ${RcCommands.describeCommand(state, cmd).where.replace(" › ", ", ")}`).join(". ");
    cmdSay(`${r.prompt} ${spoken}.`, true);
  }
}

function cmdShowError(message) {
  _cmdPending = null;
  cmdClearHighlight();
  cmdCard(`<div class="cmd-error">${esc(message)}</div>`);
  if (_cmdFromVoice) cmdSay(message, false);
}

function cmdCancel(quiet) {
  _cmdPending = null;
  cmdClearHighlight();
  cmdCard("");
  if (!quiet) toast("CANCELLED — NOTHING CHANGED");
}

// ── Apply / undo ──────────────────────────────────────────────────────────
function cmdOwner() { return (typeof _library !== "undefined" && _library) ? _library.activeId : null; }

function cmdApply() {
  const p = _cmdPending;
  if (!p || !p.cmd) { toast("NOTHING TO APPLY"); return; }
  let res;
  try { res = RcCommands.applyCommand(state, p.cmd); } catch (err) { return cmdShowError(err.message.replace(/^SECTION_LOCK: /, "")); }
  const d = RcCommands.describeCommand(state, p.cmd);
  // Copy back only the locked section's keys; everything else in `state`
  // (including edits typed since the preview) stays exactly as it is.
  for (const k of RcCommands.SECTION_KEYS[p.cmd.section]) {
    if (res.state[k] === undefined) delete state[k]; else state[k] = res.state[k];
  }
  _cmdHistory.push({ label: `${d.verb} · ${d.where}`, undo: res.undo, owner: cmdOwner() });
  if (_cmdHistory.length > CMD_HISTORY_MAX) _cmdHistory.shift();
  _cmdPending = null;
  cmdCard("");
  const input = document.getElementById("cmd-input");
  if (input) input.value = "";
  render();
  cmdRenderHistory();
  cmdHighlight(p.cmd, true);
  toast(`✓ ${d.verb.toUpperCase()} — SAY “UNDO” TO REVERT`);
}

function cmdUndo() {
  const last = _cmdHistory[_cmdHistory.length - 1];
  if (!last) { toast("NOTHING TO UNDO"); return; }
  if (last.owner !== cmdOwner()) { cmdClearHistory(); toast("NOTHING TO UNDO ON THIS RESUME"); return; }
  _cmdHistory.pop();
  for (const [k, v] of Object.entries(last.undo.before)) {
    if (v === null) delete state[k]; else state[k] = JSON.parse(JSON.stringify(v));
  }
  cmdCancel(true);
  render();
  cmdRenderHistory();
  toast(`↶ UNDONE: ${last.label.toUpperCase()}`);
  if (_cmdFromVoice) cmdSay(`Undone. ${last.label.replace(" · ", " in ")}.`, false);
}

// Called by replaceStateWith() and applyImport(): the resume underneath the
// history has been replaced, so its undo records no longer apply.
function cmdClearHistory() {
  _cmdHistory = [];
  _cmdPending = null;
  cmdCard("");
  cmdRenderHistory();
}

function cmdRenderHistory() {
  const btn = document.getElementById("cmd-undo");
  const box = document.getElementById("cmd-history");
  const list = document.getElementById("cmd-history-list");
  const n = _cmdHistory.length;
  if (btn) {
    btn.disabled = !n;
    btn.title = n ? `Undo: ${_cmdHistory[n - 1].label}` : "Nothing to undo";
  }
  if (box && list) {
    box.hidden = !n;
    const sum = box.querySelector("summary");
    if (sum) sum.textContent = `Recent changes (${n})`;
    list.innerHTML = _cmdHistory.slice().reverse().map((h) => `<li>${esc(h.label)}</li>`).join("");
  }
}

// ── Text entry point ──────────────────────────────────────────────────────
function cmdChoose(i) {
  const p = _cmdPending;
  if (!p || !p.options || !p.options[i]) return;
  cmdShowPreview(p.options[i]);
}

// While choosing, accept "one", "the second", "education", or part of a name.
function cmdPickFromSpeech(text) {
  const p = _cmdPending;
  if (!p || !p.options) return -1;
  const t = String(text).toLowerCase();
  const nums = [/\b(one|first|1|number one)\b/, /\b(two|second|2|number two)\b/, /\b(three|third|3)\b/, /\b(four|fourth|4)\b/];
  for (let i = 0; i < p.options.length; i++) if (nums[i] && nums[i].test(t)) return i;
  const bySection = p.options.findIndex((c) => t.includes(RcCommands.SECTION_LABEL[c.section].toLowerCase()));
  if (bySection >= 0 && p.options.filter((c) => c.section === p.options[bySection].section).length === 1) return bySection;
  return -1;
}

function cmdHandle(text, fromVoice) {
  _cmdFromVoice = !!fromVoice;
  _cmdPendingText = String(text).trim();
  const input = document.getElementById("cmd-input");
  if (_cmdPending && _cmdPending.options) {
    const pick = cmdPickFromSpeech(text);
    if (pick >= 0) { if (input) input.value = ""; return cmdChoose(pick); }
  }
  const r = RcCommands.parseCommand(text, state, _cmdContext);
  switch (r.status) {
    case "undo": if (input) input.value = ""; return cmdUndo();
    case "confirm":
      if (input) input.value = "";
      if (_cmdPending && _cmdPending.cmd) return cmdApply();
      return toast("NOTHING TO CONFIRM");
    case "cancel": if (input) input.value = ""; return cmdCancel(false);
    case "choose": return cmdShowChoices(r);
    case "ok": return cmdShowPreview(r.cmd);
    default: return cmdShowError(r.message);
  }
}

function cmdSubmit() {
  const input = document.getElementById("cmd-input");
  const text = input ? input.value.trim() : "";
  // Enter on an open preview applies it, unless the user edited the text
  // (then it is a new command).
  if (_cmdPending && _cmdPending.cmd && (!text || text === _cmdPendingText)) { cmdApply(); return; }
  if (!text) return;
  cmdHandle(text, false);
}

// ── Voice ─────────────────────────────────────────────────────────────────
function cmdSetMic(on) {
  _cmdListening = on;
  const mic = document.getElementById("cmd-mic");
  if (mic) { mic.classList.toggle("recording", on); mic.setAttribute("aria-pressed", on ? "true" : "false"); }
}

function cmdListen() {
  const Ctor = typeof getSpeechCtor === "function" ? getSpeechCtor() : null;
  if (!Ctor) { toast("VOICE ISN'T SUPPORTED IN THIS BROWSER — TYPE INSTEAD"); return; }
  if (_cmdListening && _cmdRec) { try { _cmdRec.stop(); } catch (_e) { /* ignore */ } return; }
  // Field dictation and command listening share the microphone.
  if (typeof _recordingTarget !== "undefined" && _recordingTarget && typeof stopDictation === "function") stopDictation();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (!_cmdRec) {
    _cmdRec = new Ctor();
    _cmdRec.continuous = false;
    _cmdRec.interimResults = true;
    _cmdRec.lang = navigator.language || "en-US";
    _cmdRec.onresult = (ev) => {
      const input = document.getElementById("cmd-input");
      let interim = "", final = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript; else interim += ev.results[i][0].transcript;
      }
      if (input) input.value = (final || interim).trim();
      if (final.trim()) cmdHandle(final.trim(), true);
    };
    _cmdRec.onerror = (ev) => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") toast("MIC BLOCKED — CHECK PERMISSIONS");
      cmdSetMic(false);
    };
    _cmdRec.onend = () => cmdSetMic(false);
  }
  try { _cmdRec.start(); cmdSetMic(true); } catch (_e) { cmdSetMic(false); }
}

// Read the preview back and, if it needs an answer, listen once for it.
function cmdSay(text, thenListen) {
  const synth = window.speechSynthesis;
  const listen = () => { if (thenListen && _cmdPending) setTimeout(cmdListen, 250); };
  if (!synth || typeof SpeechSynthesisUtterance === "undefined") { listen(); return; }
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.onend = listen;
    u.onerror = listen;
    synth.speak(u);
  } catch (_e) { listen(); }
}

// ── Wiring ────────────────────────────────────────────────────────────────
function initCommandBar() {
  const input = document.getElementById("cmd-input");
  if (!input || typeof RcCommands === "undefined") return;
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") { ev.preventDefault(); cmdSubmit(); }
    else if (ev.key === "Escape" && _cmdPending) { ev.preventDefault(); cmdCancel(false); }
  });
  document.addEventListener("focusin", cmdTrackContext);
  const mic = document.getElementById("cmd-mic");
  if (mic && !(typeof isSpeechSupported === "function" && isSpeechSupported())) mic.hidden = true;
  cmdRenderHistory();
}
