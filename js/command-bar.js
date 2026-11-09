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

// The bar also runs APP COMMANDS (RcCommands.parseAppCommand): "show the
// preview", "use the compact template", "dictate my summary". Those move
// around the app or start a tool and never touch resume content, so they
// run at once, with no preview step. Every one has a keyboard twin
// (see CMD_KEYS) and the help card lists both side by side.

const CMD_HISTORY_MAX = 15;
const CMD_SUGGEST_MAX = 5;
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
  cmdRefreshSuggestions();
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

// ── Contextual suggestions ────────────────────────────────────────────────
// Real, parseable commands for wherever the user is working. "…" marks the
// part they fill in (the chip drops the text into the bar and selects the
// blank); chips without a blank run straight to the preview step.
function cmdShortName(section, e) {
  if (!e) return "";
  let n = section === "education" ? (e.school || e.degree || "") : (e.title || "");
  n = String(n).split(/\s+[—–-]\s+/)[0].trim();
  return n.length > 30 ? `${n.slice(0, 28).trim()}…` : n;
}

function cmdSuggestionList(st, ctx, historyLen) {
  const out = [];
  const push = (text) => { if (text && !out.includes(text) && out.length < CMD_SUGGEST_MAX) out.push(text); };
  const list = (sec) => (sec === "custom" ? st.custom_sections : st[sec]) || [];
  const entry = ctx && ctx.index != null ? list(ctx.section)[ctx.index] : null;
  const sec = ctx ? ctx.section : null;
  if (entry && (sec === "experience" || sec === "projects" || sec === "custom")) {
    push("add a bullet: …");
    if (sec !== "custom") push("change the date to …");
    if ((entry.bullets || []).length) push("remove the last bullet");
    if (sec === "projects") push(`rename ${cmdShortName(sec, entry)} to …`);
  } else if (entry && sec === "education") {
    push("change the graduation date to …");
    push("change the degree to …");
    push("change the school to …");
  } else if (sec === "skills") {
    push("add … to my skills");
    const first = (st.skills_categories || []).map((c) => String(c.content || "").split(/\s*[,│|]\s*/)[0]).filter(Boolean)[0];
    if (first) push(`remove ${first} from my skills`);
  } else if (sec === "summary") {
    push("change my summary to …");
    push("add to my summary that …");
  } else if (sec === "header") {
    push("change my title to …");
    push("change my phone number to …");
    push("change my email to …");
  } else if (sec === "certs") {
    push("add a certification: …");
    if ((st.certifications || []).length) push(`remove the certification ${String(st.certifications[0]).split(":")[0]}`);
  } else if (sec === "experience" || sec === "projects") {
    push(sec === "experience" ? "add a job: …" : "add a project: …");
  }
  // General purpose fallbacks, always useful.
  push("add … to my skills");
  const job = (st.experience || [])[0];
  if (job) push(`add a bullet to ${cmdShortName("experience", job)}: …`);
  push("change my title to …");
  push("change my summary to …");
  push("add a project: …");
  if (historyLen) { out.pop(); out.unshift("undo"); }
  return out.slice(0, CMD_SUGGEST_MAX);
}

function cmdRefreshSuggestions() {
  const box = document.getElementById("cmd-suggest");
  if (!box || typeof state === "undefined") return;
  const items = cmdSuggestionList(state, _cmdContext, _cmdHistory.length);
  box.innerHTML = items.map((text) => {
    const fill = text.includes("…");
    const label = esc(text).replace("…", '<span class="ellip">…</span>');
    return `<button class="toolbar-chip hero-chip${fill ? " fillin" : ""}" type="button" data-action="cmdSuggest" data-cmd="${esc(text)}" title="${fill ? "Fill in the blank, then press Enter" : "Preview this change"}">${label}</button>`;
  }).join("");
}

function cmdUseSuggestion(btn) {
  const text = btn && btn.dataset ? btn.dataset.cmd : "";
  const input = document.getElementById("cmd-input");
  if (!text || !input) return;
  input.value = text;
  input.focus();
  const i = text.indexOf("…");
  if (i >= 0) { try { input.setSelectionRange(i, i + 1); } catch (_e) { /* ignore */ } return; }
  cmdHandle(text, false);
}

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
  cmdRefreshSuggestions();
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
  cmdRefreshSuggestions();
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
  cmdRefreshSuggestions();
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
  if (typeof RcCommands.parseAppCommand === "function") {
    const ac = RcCommands.parseAppCommand(text);
    if (ac) { if (input) input.value = ""; return cmdRunAppCommand(ac, fromVoice); }
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
  document.body.classList.toggle("cmd-listening", !!on);
  // The waveform beside the bar shares the voice card's analyser. Only start
  // it when no field dictation owns the mic (that one drives the same bars).
  if (typeof startLevelMeter === "function" && typeof stopLevelMeter === "function") {
    const dictating = typeof _recordingTarget !== "undefined" && _recordingTarget;
    if (on) startLevelMeter(); else if (!dictating) stopLevelMeter();
  }
  cmdRenderStatus();
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
    // The command grammar is English. With the browser set to another
    // language the engine would transcribe in that language and nothing
    // would parse, so commands always listen in English. (Field dictation
    // keeps the browser's language: see ensureRecognition in voice.js.)
    _cmdRec.lang = /^en\b/i.test(navigator.language || "") ? navigator.language : "en-US";
    _cmdRec.onresult = (ev) => {
      const input = document.getElementById("cmd-input");
      let interim = "", final = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript; else interim += ev.results[i][0].transcript;
      }
      if (input) input.value = (final || interim).trim();
      if (final.trim()) cmdHandle(final.trim(), true);
    };
    // Permission is granted by the time the engine starts, so a first-run
    // meter attempt that bailed on "prompt" can succeed now.
    _cmdRec.onstart = () => { if (_cmdListening && typeof startLevelMeter === "function") startLevelMeter(); };
    _cmdRec.onerror = (ev) => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") toast("MIC BLOCKED — CHECK PERMISSIONS");
      else if (ev.error === "no-speech") toast("DIDN'T HEAR ANYTHING — TAP THE MIC AND TRY AGAIN");
      else if (ev.error === "audio-capture") toast("NO MICROPHONE FOUND");
      else if (ev.error === "network") toast("VOICE NEEDS A CONNECTION — TYPE THE CHANGE INSTEAD");
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

// ── App commands: navigation and tools ───────────────────────────────────
function cmdSpeechOk() { return typeof isSpeechSupported === "function" && isSpeechSupported(); }

function cmdLeaveOnboarding() {
  const bg = document.getElementById("onboard-bg");
  if (bg && !bg.hidden && !bg.classList.contains("dismissed") && typeof dismissOnboard === "function") dismissOnboard();
}

function cmdGoPane(target) {
  if (window.__paneSwipe) { window.__paneSwipe.setActive(target); window.__paneSwipe.scrollToPane(target); }
}

function cmdFocusInput() {
  cmdLeaveOnboarding();
  const input = document.getElementById("cmd-input");
  if (!input) return;
  try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (_e) { window.scrollTo(0, 0); }
  input.focus({ preventScroll: true });
  input.select();
}

function cmdFocusListen() {
  cmdFocusInput();
  if (cmdSpeechOk()) cmdListen();
  else toast("VOICE ISN'T SUPPORTED IN THIS BROWSER — TYPE INSTEAD");
}

// A spoken/typed app command, a hero trigger click and a keyboard shortcut
// all end up here. `fromVoice` adds a short spoken acknowledgement.
function cmdRunAppCommand(ac, fromVoice) {
  const say = (t) => { if (fromVoice) cmdSay(t, false); };
  const act = (name) => { if (typeof ACTIONS !== "undefined" && ACTIONS[name]) ACTIONS[name](document.querySelector(`[data-action="${name}"]`) || document.body, { target: null }); };
  switch (ac.action) {
    case "help": cmdShowHelp(); return;
    case "listen": cmdFocusListen(); return;
    case "focus_command": cmdFocusInput(); return;
    case "dictate_summary": {
      cmdLeaveOnboarding();
      cmdGoPane("left");
      const panel = document.querySelector('.panel[data-section="summary"]');
      if (panel) panel.classList.add("open");
      const field = document.getElementById("summary");
      const micBtn = document.querySelector('.mic-btn[data-mic-target="summary"]');
      if (cmdSpeechOk() && micBtn && typeof micToggle === "function") {
        // Let the command mic release before the field mic takes over.
        setTimeout(() => { micToggle(micBtn); if (field) field.scrollIntoView({ block: "center", behavior: "smooth" }); }, _cmdListening ? 400 : 0);
        say("Listening for your summary.");
      } else if (field) { field.focus(); toast("TYPE YOUR SUMMARY — VOICE ISN'T SUPPORTED HERE"); }
      return;
    }
    case "voice_intro": {
      cmdLeaveOnboarding();
      cmdGoPane("left");
      if (typeof showGetStartedCard === "function") showGetStartedCard("voice");
      if (cmdSpeechOk() && typeof voiceToggle === "function" && !(typeof _recordingTarget !== "undefined" && _recordingTarget)) {
        setTimeout(voiceToggle, _cmdListening ? 400 : 150);
        say("Go ahead, tell me about yourself.");
      }
      return;
    }
    case "import":
      cmdLeaveOnboarding();
      cmdGoPane("left");
      if (typeof showGetStartedCard === "function") showGetStartedCard("intake");
      say("Import is open. Drop a file or paste your resume.");
      return;
    case "match": {
      cmdLeaveOnboarding();
      cmdGoPane("right");
      const chip = document.getElementById("match-chip");
      if (chip && chip.getAttribute("aria-pressed") !== "true" && typeof toggleMatch === "function") toggleMatch();
      const jd = document.getElementById("jd-input");
      if (jd) { jd.focus({ preventScroll: true }); jd.scrollIntoView({ block: "center", behavior: "smooth" }); }
      say("Paste the job description to score the match.");
      return;
    }
    case "pane_edit": cmdLeaveOnboarding(); cmdGoPane("left"); if (typeof scrollAppToTop === "function") scrollAppToTop(); return;
    case "pane_preview": {
      cmdLeaveOnboarding(); cmdGoPane("right");
      const pv = document.getElementById("preview");
      if (pv) pv.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    case "pane_final": cmdLeaveOnboarding(); cmdGoPane("final"); if (!window.matchMedia("(max-width: 1100px)").matches) toast("FINAL REVIEW IS A PHONE VIEW — THE PREVIEW ON THE RIGHT IS LIVE"); return;
    case "top": if (typeof scrollAppToTop === "function") scrollAppToTop(); return;
    case "template":
      if (ac.arg && typeof pickTemplate === "function") { pickTemplate(ac.arg); toast(`TEMPLATE: ${String(ac.label || "").toUpperCase()}`); say(`Switched to the ${ac.label} template.`); }
      return;
    case "download_pdf": act("downloadPdf"); say("Downloading the PDF."); return;
    case "download_docx": act("downloadDocx"); say("Downloading the Word document."); return;
    case "copy_text": act("copyPlainText"); return;
    case "print": act("printPDF"); return;
    case "share": act("openShareModal"); return;
    case "library": act("openLibrary"); return;
    case "ats_on": case "ats_off": {
      const want = ac.action === "ats_on";
      if (typeof state !== "undefined" && !!state.ats_safe !== want) act("toggleAts");
      else toast(want ? "ATS-SAFE LAYOUT IS ALREADY ON" : "ATS-SAFE LAYOUT IS ALREADY OFF");
      return;
    }
    case "fit_one_page": act("fitOnePage"); return;
    case "theme_dark": case "theme_light":
      if (typeof setTheme === "function") setTheme(ac.action === "theme_dark" ? "dark" : "light");
      say(ac.action === "theme_dark" ? "Dark theme." : "Light theme.");
      return;
    case "start_screen": act("showOnboarding"); return;
    default: cmdShowError("I don't know that command yet. Say “help” to see what works.");
  }
}

// ── Keyboard shortcuts: the typed twins of the spoken app commands ───────
// `mod` is ⌘ on Apple platforms and Ctrl elsewhere. Each entry names the
// app command it fires so the help card can show the pair.
const CMD_KEYS = [
  { combo: "mod+k", action: "focus_command" },
  { combo: "mod+shift+k", action: "listen" },
  { combo: "mod+shift+s", action: "dictate_summary" },
  { combo: "mod+shift+u", action: "voice_intro" },
  { combo: "mod+i", action: "import" },
  { combo: "mod+shift+m", action: "match" },
];

function cmdIsMac() {
  try {
    const uad = navigator.userAgentData;
    if (uad && uad.platform) return /mac|ios/i.test(uad.platform);
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform || "") || /Mac OS X/.test(navigator.userAgent || "");
  } catch (_e) { return false; }
}

function cmdKeyLabel(combo) {
  const mac = cmdIsMac();
  return String(combo).split("+").map((part) => {
    if (part === "mod") return mac ? "⌘" : "Ctrl";
    if (part === "shift") return mac ? "⇧" : "Shift";
    if (part === "alt") return mac ? "⌥" : "Alt";
    if (part === "enter") return mac ? "↩" : "Enter";
    if (part === "esc") return "Esc";
    return part.length === 1 ? part.toUpperCase() : part;
  }).join(mac ? "" : "+");
}

function cmdFillShortcutLabels() {
  document.querySelectorAll("[data-shortcut]").forEach((el) => { el.textContent = cmdKeyLabel(el.dataset.shortcut); });
}

function cmdInEditable(el) {
  if (!el) return false;
  const tag = (el.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
}

function cmdOnKeydown(ev) {
  if (ev.defaultPrevented || ev.isComposing) return;
  if (document.querySelector(".modal-bg.show")) return;
  const key = String(ev.key || "").toLowerCase();
  const mod = cmdIsMac() ? ev.metaKey : ev.ctrlKey;
  if (mod && !ev.altKey) {
    const combo = `mod+${ev.shiftKey ? "shift+" : ""}${key}`;
    const hit = CMD_KEYS.find((k) => k.combo === combo);
    if (hit) { ev.preventDefault(); cmdRunAppCommand({ action: hit.action }, false); return; }
    // ⌘Z in an empty command bar undoes the last applied command.
    if (key === "z" && !ev.shiftKey && ev.target && ev.target.id === "cmd-input" && !ev.target.value) { ev.preventDefault(); cmdUndo(); }
    return;
  }
  if (ev.key === "Escape" && _cmdListening) { ev.preventDefault(); cmdListen(); return; }
  if (ev.altKey || cmdInEditable(ev.target)) return;
  if (ev.key === "/") { ev.preventDefault(); cmdFocusInput(); }
  else if (ev.key === "?") { ev.preventDefault(); cmdShowHelp(); }
}

// ── Help card: every spoken command next to its key ──────────────────────
function cmdShowHelp() {
  cmdLeaveOnboarding();
  _cmdPending = null;
  cmdClearHighlight();
  const speech = cmdSpeechOk();
  const edits = ["add Excel to my skills", "change my summary to …", "add a bullet to Sunset Groceries: trained new cashiers", "change the date for my cashier job to 2021 to 2022", "remove the last bullet from Shark Cast Podcast", "add a certification: Google IT Support", "rename my sales lead job to Sales Associate", "undo"];
  const keyFor = (action) => { const k = CMD_KEYS.find((x) => x.action === action); return k ? `<kbd class="kbd">${esc(cmdKeyLabel(k.combo))}</kbd>` : ""; };
  const apps = (RcCommands.APP_COMMANDS || []).filter((c) => speech || !["listen", "dictate_summary"].includes(c.action))
    .map((c) => `<li>${keyFor(c.action) || (c.key === "?" ? '<kbd class="kbd">?</kbd>' : "")}<span class="say">“${esc(c.say[0])}”</span></li>`).join("");
  cmdCard(`<div class="cmd-help">
    <h4>Change the resume — previews first, then “yes” or Enter</h4>
    <ul>${edits.map((e) => `<li><span class="cmd-help-ex">${esc(e)}</span></li>`).join("")}</ul>
    <h4>Get around — runs right away, by key or by voice</h4>
    <ul>${apps}</ul>
    <h4>Keys</h4>
    <ul>
      <li><kbd class="kbd">${esc(cmdKeyLabel("mod+k"))}</kbd> or <kbd class="kbd">/</kbd><span>type a command</span></li>
      ${speech ? `<li><kbd class="kbd">${esc(cmdKeyLabel("mod+shift+k"))}</kbd><span>start or stop listening</span></li>` : ""}
      <li><kbd class="kbd">Enter</kbd><span>apply the previewed change</span></li>
      <li><kbd class="kbd">Esc</kbd><span>cancel the preview${speech ? " or stop the mic" : ""}</span></li>
      <li><kbd class="kbd">${esc(cmdKeyLabel("mod+z"))}</kbd><span>undo (in an empty bar)</span></li>
      <li><kbd class="kbd">?</kbd><span>this card</span></li>
    </ul>
    <div class="cmd-actions"><button class="copy-btn" type="button" data-action="cmdCancel">CLOSE</button></div>
  </div>`);
  const card = document.getElementById("cmd-preview");
  if (card) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

// ── Status line under the bar ─────────────────────────────────────────────
function cmdRenderStatus() {
  const el = document.getElementById("cmd-status");
  if (!el) return;
  const k = (combo) => `<kbd class="kbd">${esc(cmdKeyLabel(combo))}</kbd>`;
  if (_cmdListening) {
    el.classList.add("listening");
    el.innerHTML = `<span class="live-dot" aria-hidden="true"></span><span>LISTENING — SPEAK NOW</span><span>·</span>${k("esc")}<span>to stop</span><span>·</span><span class="say">“cancel”</span>`;
    return;
  }
  el.classList.remove("listening");
  if (cmdSpeechOk()) {
    el.innerHTML = `${k("mod+shift+k")}<span>to speak</span><span>·</span>${k("mod+k")}<span>to type</span><span>·</span><kbd class="kbd">?</kbd><span>what can I say</span>`;
  } else {
    el.innerHTML = `<span>Voice isn't supported in this browser.</span>${k("mod+k")}<span>to type a change</span><span>·</span><kbd class="kbd">?</kbd><span>what can I type</span>`;
  }
}

// ── Hero: compact once the page scrolls (desktop) ─────────────────────────
// The full hero scrolls with the page. Once the page has scrolled by the
// difference between the full and the compact height, the hero swaps to the
// compact bar and pins under the top bar. At exactly that point the compact
// bar covers the strip the full hero still showed, and the lost height is
// given back as margin-bottom, so the content below does not move.
//
// It must not move: this used to shrink a sticky hero at a fixed scroll
// offset, which shortened the page, which pulled the scroll position back
// under the threshold, which expanded the hero again — a visible flicker for
// as long as the wheel kept turning.
function cmdInitHeroCompact() {
  const hero = document.getElementById("hero");
  if (!hero) return;
  let compact = false;
  let fullH = 0, compactH = 0;
  const narrow = () => window.matchMedia("(max-width: 1100px)").matches;
  const apply = (on) => {
    compact = on;
    document.body.classList.toggle("hero-compact", on);
    hero.style.marginBottom = on ? `${Math.max(0, fullH - compactH)}px` : "";
  };
  // Read both heights in one synchronous pass (no paint in between).
  const measure = () => {
    if (narrow()) { if (compact) apply(false); return; }
    document.body.classList.remove("hero-compact");
    hero.style.marginBottom = "";
    fullH = hero.offsetHeight;
    document.body.classList.add("hero-compact");
    compactH = hero.offsetHeight;
    document.body.classList.remove("hero-compact");
    compact = false;
    update();
  };
  const update = () => {
    if (narrow()) { if (compact) apply(false); return; }
    // The full hero grows and shrinks (preview card, wrapped suggestions).
    if (!compact) fullH = hero.offsetHeight;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const next = fullH > compactH && y > fullH - compactH;
    if (next !== compact) apply(next);
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  measure();
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
  document.addEventListener("keydown", cmdOnKeydown);
  const mic = document.getElementById("cmd-mic");
  if (mic && !cmdSpeechOk()) mic.hidden = true;
  cmdFillShortcutLabels();
  cmdRenderStatus();
  cmdRenderHistory();
  cmdRefreshSuggestions();
  cmdInitHeroCompact();
  // Entry names in the suggestions follow what the user types.
  let t = null;
  document.addEventListener("input", (ev) => {
    if (ev.target && ev.target.id === "cmd-input") return;
    clearTimeout(t);
    t = setTimeout(cmdRefreshSuggestions, 400);
  });
}
