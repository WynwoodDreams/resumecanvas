// ResumeCanvas — voice dictation + voice-intro card (Web Speech API)
// Classic script sharing the global scope with app.js (same pattern as
// vendor/): declarations only at load time; call sites live in app.js.

// ─────────────────────────────────────────────────────────
// VOICE DICTATION (phase 6)
// Uses the Web Speech API to transcribe directly into bullet/summary fields.
// Feature-detected at first use; hidden gracefully where unsupported.
// ─────────────────────────────────────────────────────────

let _recognition = null;
let _recordingTarget = null;
let _pendingDictationTarget = null; // field to start once the engine's onend fires
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
    // A mic tap on another field while this one was live is parked here,
    // because start() throws until the engine has fully stopped.
    if (_pendingDictationTarget) {
      const next = _pendingDictationTarget;
      _pendingDictationTarget = null;
      startDictation(next);
    }
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
  if (_recordingTarget) {
    // Switching fields mid-dictation: recognition.stop() is asynchronous and
    // start() throws InvalidStateError until onend fires. Park the new target
    // and let onend start it, instead of racing (which left the mic live with
    // no target, or threw out of a timer).
    _pendingDictationTarget = targetId;
    stopDictation();
    // Safety net in case onend never arrives (engine already dead).
    setTimeout(() => {
      if (_pendingDictationTarget === targetId && !_recordingTarget) {
        _pendingDictationTarget = null;
        startDictation(targetId);
      }
    }, 600);
    return;
  }
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
    try {
      r.stop();
      setTimeout(() => {
        try { r.start(); } catch (_e2) { if (_recordingTarget === targetId) finalizeDictation(); }
      }, 50);
    } catch (_e) { /* give up */ }
  }
  const btn = findMicButton(targetId);
  if (btn) { btn.classList.add("recording"); btn.setAttribute("aria-pressed", "true"); }
  if (targetId === "summary") {
    const hint = $("#mic-hint-summary");
    if (hint) hint.classList.add("show");
  }
  setRecordingMeter(true);
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
  setRecordingMeter(false);
  if (targetId === "voiceProfile") {
    clearVoiceTimers();
    setVoiceButtonState(false);
    const words = (state.voice_profile || "").trim().split(/\s+/).filter(Boolean).length;
    updateVoiceStatus(words ? `Captured ${words} word${words === 1 ? "" : "s"} — edit freely below.` : "");
    updateVoiceAnalyzeCue();
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

// Pulse the ANALYZE & SUGGEST button while a transcript is waiting on it and
// no suggestions are showing yet — it's the step users tend to miss.
function updateVoiceAnalyzeCue() {
  const btn = $("#voice-analyze-btn");
  if (!btn) return;
  const review = $("#voice-review");
  const reviewOpen = !!(review && !review.classList.contains("hidden"));
  const hasText = !!(state.voice_profile || "").trim();
  btn.classList.toggle("ready", hasText && !reviewOpen);
}

function clearVoice() {
  if (_recordingTarget === "voiceProfile") stopVoiceRecording();
  state.voice_profile = "";
  const ta = $("#voice-transcript");
  if (ta) ta.value = "";
  updateVoiceStatus("");
  const review = $("#voice-review");
  if (review) review.classList.add("hidden");
  updateVoiceAnalyzeCue();
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
  // Everything below describes who the person IS, so it is read from the
  // intro with their stated goal removed: wanting a marketing internship
  // does not make marketing their field or a skill they have.
  const goal = extractVoiceGoal(text);
  const full = ` ${String(text || "").toLowerCase()} `;
  const lower = goal ? full.replace(goal.text.toLowerCase(), " ") : full;
  const traits = voiceMatchTerms(lower, VOICE_TRAITS);
  for (const [alias, canon] of Object.entries(VOICE_TRAIT_ALIASES)) {
    if (new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(lower) && !traits.includes(canon)) traits.push(canon);
  }
  const skills = voiceMatchTerms(lower, VOICE_SKILLS);
  for (const [alias, canon] of Object.entries(VOICE_SKILL_ALIASES)) {
    if (new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(lower) && !skills.includes(canon)) skills.push(canon);
  }
  const dedupe = (arr) => arr.filter(t => !arr.some(o => o !== t && o.toLowerCase().includes(t.toLowerCase())));
  // Skills the user actually named (or an alias of one) — the only skills the
  // drafted summary may mention.
  const stated = dedupe(skills.slice());
  // Verb-driven skills ("I helped customers" → Customer Service) are our
  // inference, not the user's words: offered as unselected chips only.
  const implied = [];
  for (const v of VOICE_VERB_SKILLS) {
    if (v.re.test(lower) && !stated.includes(v.skill) && !implied.includes(v.skill)) implied.push(v.skill);
  }
  // No field in what they said about themselves → use their education entry.
  let field = voiceMatchTerms(lower, VOICE_FIELDS)[0] || "";
  if (!field) field = fieldFromEducation();
  const isStudent = /\bstudent\b/.test(lower) || educationLooksCurrent();
  return {
    traits, skills: stated, implied: dedupe(implied).filter(t => !stated.some(s => s.toLowerCase().includes(t.toLowerCase()))),
    field, status: isStudent ? "student" : "professional", goal,
  };
}

// What the person said they want, in their own words:
//   "I'm looking for a marketing internship"  → { kind: "seek", text: "a marketing internship" }
//   "I want to work in healthcare"            → { kind: "aim", text: "work in healthcare" }
//   "I'm really interested in graphic design" → { kind: "interest", text: "graphic design" }
function extractVoiceGoal(text) {
  const t = ` ${String(text || "").replace(/\s+/g, " ")} `;
  const patterns = [
    ["seek", /\b(?:looking for|searching for|seeking|hoping for|hoping to (?:find|get|land)|want to (?:find|get|land)|trying to (?:find|get|land)|would like to (?:find|get)|i'd like to (?:find|get))\s+(.+)/i],
    ["aim", /\b(?:i want to|i'd like to|i would like to|i hope to|i'm hoping to|i am hoping to|hoping to|i plan to|my goal is to|my dream is to|i'm trying to|i am trying to)\s+(.+)/i],
    ["interest", /\b(?:interested in|passionate about|excited about)\s+(.+)/i],
  ];
  for (const [kind, re] of patterns) {
    const m = t.match(re);
    if (!m) continue;
    let g = m[1].split(/[.!?;]|\s(?:because|since|so that|so i|and i|but|where i|which)\s/i)[0].trim();
    g = g.split(/\s+/).slice(0, 12).join(" ").replace(/[,\s]+$/, "");
    if (g && g.split(/\s+/).length >= 1) return { kind, text: lc(g) };
  }
  return null;
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

// Draft a summary ONLY from what the person told us: their own trait words,
// skills they named, their field / student status (also from their education
// entry), and the goal they stated. No stock strengths ("works well under
// pressure", "proven track record"): if they didn't say it, the draft doesn't
// claim it. Tones change the wording, never the facts.
function buildVoiceCtx(a) {
  const field = a.field ? a.field.toLowerCase() : "";
  const traits = (a.traits || []).slice(0, 2).map(lc);
  const skills = (a.skills || []).filter(s => s.toLowerCase() !== field).slice(0, 4);
  const status = a.status || "professional";
  return {
    field, traits, T: joinList(traits), skills, S: joinList(skills),
    subject: field ? `${field} ${status}` : status, goal: a.goal || null,
  };
}

function aOrAn(phrase) { return /^[aeiou]/i.test(phrase) ? `an ${phrase}` : `a ${phrase}`; }

// Each tone: opener(ctx, v) → identity phrase; skills connector; goal
// sentences by goal kind; and a fallback when no goal was stated.
const VOICE_TONE_PRESETS = {
  standard: {
    opener: [(c) => c.T ? `${c.T} ${c.subject}` : c.subject, (c) => c.T ? `${c.subject} who is ${c.T}` : c.subject],
    skills: ["with skills in", "who works with"],
    goal: { seek: ["Seeking %s.", "Looking for %s."], aim: ["Hoping to %s.", "Aiming to %s."], interest: ["Interested in %s.", "Especially interested in %s."] },
    fallback: [(c) => `Seeking ${c.field ? `${c.field} ` : "new "}opportunities.`, (c) => `Looking for ${c.field ? `${aOrAn(c.field)} ` : "a new "}role.`],
  },
  formal: {
    opener: [(c) => c.T ? `${aOrAn(c.T)} ${c.subject}` : aOrAn(c.subject), (c) => c.T ? `${c.subject}, ${c.T}` : c.subject],
    skills: ["with skills in", "who uses"],
    goal: { seek: ["Pursuing %s.", "Seeking %s."], aim: ["Aiming to %s.", "Seeking to %s."], interest: ["Particularly interested in %s.", "Interested in %s."] },
    fallback: [(c) => `Seeking a position${c.field ? ` in ${c.field}` : ""}.`, (c) => `Pursuing ${c.field ? `${c.field} ` : "professional "}opportunities.`],
  },
  direct: {
    opener: [(c) => c.T ? `${c.T} ${c.subject}` : c.subject, (c) => c.subject],
    skills: ["who works with", "using"],
    goal: { seek: ["Looking for %s.", "After %s."], aim: ["Wants to %s.", "Ready to %s."], interest: ["Into %s.", "Focused on %s."] },
    fallback: [(c) => `Looking for ${c.field ? `${aOrAn(c.field)} ` : "a "}role.`, (c) => `Open to ${c.field ? `${c.field} ` : ""}roles.`],
  },
  warm: {
    opener: [(c) => c.T ? `${c.T} ${c.subject}` : c.subject, (c) => c.T ? `${c.subject} who is ${c.T}` : c.subject],
    skills: ["with skills in", "who brings skills in"],
    goal: { seek: ["Hoping to find %s.", "Excited to find %s."], aim: ["Hoping to %s.", "Excited to %s."], interest: ["Excited about %s.", "Drawn to %s."] },
    fallback: [(c) => `Hoping to join ${c.field ? `${aOrAn(c.field)} ` : "a "}team.`, (c) => `Excited about ${c.field ? `${c.field} ` : "new "}opportunities.`],
  },
  concise: {
    opener: [(c) => c.T ? `${c.T} ${c.subject}` : c.subject, (c) => c.subject],
    skills: ["skilled in", "with"],
    goal: { seek: ["Seeking %s.", "Seeking %s."], aim: ["Aiming to %s.", "Aiming to %s."], interest: ["Interested in %s.", "Interested in %s."] },
    fallback: [(c) => `Seeking ${c.field ? `${c.field} ` : ""}roles.`, (c) => `Seeking ${c.field ? `${c.field} ` : ""}roles.`],
  },
};

function composeVoiceSummary(a, variant, tone) {
  const c = buildVoiceCtx(a);
  const p = VOICE_TONE_PRESETS[tone] || VOICE_TONE_PRESETS.standard;
  const v = Math.abs(variant | 0);
  const pick = (arr, off = 0) => arr[(v + off) % arr.length];
  let first = pick(p.opener)(c);
  if (c.S) first += ` ${pick(p.skills, 1)} ${c.S}`;
  const second = c.goal && p.goal[c.goal.kind]
    ? pick(p.goal[c.goal.kind]).replace("%s", c.goal.text)
    : pick(p.fallback)(c);
  return stripEmDashes(tidy(`${cap(first)}. ${second}`));
}

// The source the drafted summary is checked against: what the user said plus
// the education facts we are allowed to borrow (field, student status).
function voiceSummarySource() {
  const edu = (state.education || []).map(e => [e.school, e.degree, e.date].join(" ")).join(" ");
  return `${state.voice_profile || ""} ${edu}`;
}

function renderVoiceSummaryFlags() {
  const draft = $("#voice-summary-draft");
  const box = $("#voice-summary-flags");
  if (!draft || !box || typeof RcFactCheck === "undefined") return [];
  const flags = RcFactCheck.checkClaims(draft.value, voiceSummarySource());
  box.textContent = flags.length ? `⚠ ${RcFactCheck.describeFlags(flags)}. Make sure it's true before you apply it.` : "";
  box.classList.toggle("hidden", !flags.length);
  return flags;
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
  updateVoiceAnalyzeCue();
  toast("ANALYZED — REVIEW & APPLY BELOW");
}

function renderVoiceReview() {
  if (!_voiceAnalysis) return;
  syncVoiceToneButtons();
  const draft = $("#voice-summary-draft");
  if (draft) draft.value = composeVoiceSummary(_voiceAnalysis, _voiceVariant, _voiceTone);
  renderVoiceSummaryFlags();
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
    const said = [...(_voiceAnalysis.skills || []), ...(_voiceAnalysis.traits || [])];
    const implied = _voiceAnalysis.implied || [];
    const chip = (s, on, extra) => `<button type="button" class="voice-chip${on ? " selected" : ""}${extra ? " implied" : ""}" data-action="voiceToggleChip" data-skill="${esc(s)}" role="checkbox" aria-checked="${on}"${extra ? ` title="We inferred this from what you described. Only keep it if it's true."` : ""}>${esc(s)}${extra ? `<span class="voice-chip-tag"> · implied</span>` : ""}</button>`;
    chipBox.innerHTML = (said.length || implied.length)
      ? said.map(s => chip(s, true, false)).join("") + implied.map(s => chip(s, false, true)).join("")
      : `<div class="vr-empty">No clear skills detected — add them in the Skills section, or reword and try again.</div>`;
  }
}

function voiceRegenSummary() {
  if (!_voiceAnalysis) return;
  _voiceVariant += 1;
  const draft = $("#voice-summary-draft");
  if (draft) draft.value = composeVoiceSummary(_voiceAnalysis, _voiceVariant, _voiceTone);
  renderVoiceSummaryFlags();
}

function voiceSetTone(btn) {
  const tone = (btn && btn.dataset && btn.dataset.tone) || "standard";
  if (!VOICE_TONE_PRESETS[tone]) return;
  _voiceTone = tone;
  syncVoiceToneButtons();
  if (!_voiceAnalysis) return;
  const draft = $("#voice-summary-draft");
  if (draft) draft.value = composeVoiceSummary(_voiceAnalysis, _voiceVariant, _voiceTone);
  renderVoiceSummaryFlags();
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
  const flags = renderVoiceSummaryFlags();
  if (flags.length && !confirm(`${RcFactCheck.describeFlags(flags)}.\n\nOnly keep these if they're true. Apply the summary anyway?`)) return;
  state.summary = text;
  state.section_enabled.summary = true;
  renderSummary();
  applySectionToggleStates();
  renderPreview();
  schedulePersist();
  toast("SUMMARY UPDATED");
}

function voiceApplySkills() {
  const chips = $$("#voice-skill-chips .voice-chip.selected").map(c => (c.dataset.skill || c.textContent).trim()).filter(Boolean);
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
  if (isSpeechSupported()) return;
  document.querySelectorAll(".mic-btn").forEach((el) => el.classList.add("hidden"));
  // The voice recorder falls back to typing — hide its record button and say so.
  const vbtn = $("#voice-rec-btn");
  if (vbtn) vbtn.classList.add("hidden");
  updateVoiceStatus("Voice capture isn't supported here — type your intro below.");
}

// Toggle the body recording flag (reveals the voice-intro level meter) and
// drive the shared input-level meter for any active dictation target.
function setRecordingMeter(recording) {
  document.body.classList.toggle("voice-recording", !!recording);
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
  // Keep the optional voice card COLLAPSED so the resume form (and the
  // auto-focused name field on a fresh resume) stays above the fold. The
  // onboarding overlay already offers "TALK IT OUT" as a top-level choice, so
  // re-expanding it inside the editor would double-promote it and bury the
  // actual fields. We only flag it as new with a subtle highlight; the user
  // opens it from its header, the VOICE rail button, or the gs-mini reopener.
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
  return Array.from(document.querySelectorAll("#voice-meter-card .vm-bar"));
}

let _meterGen = 0; // bumped by stopLevelMeter so an in-flight start() knows it is stale
async function startLevelMeter() {
  if (_meterStream) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  const gen = ++_meterGen;
  // Don't trigger an extra permission prompt — only run if mic is already granted.
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const p = await navigator.permissions.query({ name: "microphone" });
      if (p && p.state !== "granted") return;
    }
  } catch (_e) { /* permissions API may not support "microphone" — fall through */ }
  if (gen !== _meterGen) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (gen !== _meterGen) {
      // Dictation stopped while the mic was being opened — release it instead
      // of leaving the tab's recording indicator on.
      try { stream.getTracks().forEach((t) => t.stop()); } catch (_e) { /* ignore */ }
      return;
    }
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
  paintMeter(_meterBars, levels);
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
  _meterGen++;
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

let _voiceInitialized = false;
function initVoiceOnce() {
  if (_voiceInitialized) return;
  _voiceInitialized = true;
  applyVoiceIntroDefaultState();
  maybeAutoStartVoiceFromUrl();
}


// Re-check the drafted summary as the person edits it.
document.addEventListener("input", (ev) => {
  if (ev.target && ev.target.id === "voice-summary-draft" && typeof renderVoiceSummaryFlags === "function") renderVoiceSummaryFlags();
});
