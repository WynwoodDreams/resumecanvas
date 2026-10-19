// ResumeCanvas — spoken/typed edit commands: parse → preview → section-locked apply.
//
// Pure logic, no DOM. Loaded as a classic script in the page (window.RcCommands)
// and require()-able in Node so tests/commands.test.js can exercise the router
// against a phrase set.
//
// Three guarantees the UI relies on:
//   1. ROUTING NEVER GUESSES ACROSS SECTIONS. An explicit section word ("in
//      education", "my … job") restricts the search; ties between entries
//      return status "choose" instead of picking one.
//   2. SECTION LOCK. applyCommand() works on a copy and then verifies that
//      every top-level key outside the command's section is byte-identical.
//      If any other key changed, it throws — even if a parser rule is wrong.
//   3. SCOPED UNDO. applyCommand() returns the before-values of exactly the
//      keys it touched, so undo restores that section and nothing else.

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.RcCommands = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ── Sections and the state keys each one owns ────────────────────────────
  const SECTION_KEYS = {
    header: ["name", "professional_title", "location", "phone", "email", "linkedin", "contact_line1", "contact_line2"],
    summary: ["summary"],
    skills: ["skills_categories", "skills_two_column", "skills_inline"],
    education: ["education"],
    experience: ["experience"],
    projects: ["projects"],
    certs: ["certifications"],
    custom: ["custom_sections"],
  };

  const SECTION_LABEL = {
    header: "Contact", summary: "Summary", skills: "Skills", education: "Education",
    experience: "Experience", projects: "Projects", certs: "Certifications", custom: "Additional",
  };

  // Words that name a section. Used both for explicit scoping ("in education")
  // and as hints inside a target ("my starbucks job").
  const SECTION_WORDS = {
    experience: ["experience", "experiences", "work", "job", "jobs", "position", "positions", "role", "employer", "employment"],
    education: ["education", "school", "schools", "college", "university", "degree", "studies", "schooling"],
    projects: ["project", "projects"],
    certs: ["certification", "certifications", "certificate", "certificates", "cert", "certs"],
    skills: ["skill", "skills"],
    summary: ["summary", "profile", "objective", "bio"],
    custom: ["section"],
  };

  // Entry fields by section, keyed by the words people say.
  const FIELD_WORDS = {
    experience: { date: "date", dates: "date", years: "date", title: "title", role: "title", position: "title", "job title": "title", location: "location", city: "location", company: "company_city", employer: "company_city" },
    education: { date: "date", dates: "date", years: "date", "graduation date": "date", school: "school", "school name": "school", college: "school", degree: "degree", major: "degree", city: "city", location: "city", coursework: "coursework" },
    projects: { date: "date", dates: "date", title: "title", name: "title", location: "location", city: "location" },
  };
  const FIELD_RE = "graduation date|school name|job title|date|dates|years|title|role|position|location|city|company|employer|school|college|degree|major|coursework|name";

  const CONTACT_FIELDS = {
    name: "name", "full name": "name",
    email: "email", "email address": "email",
    phone: "phone", "phone number": "phone", number: "phone", "cell": "phone",
    location: "location", city: "location", address: "location",
    linkedin: "linkedin", "linkedin url": "linkedin", "linkedin profile": "linkedin",
    title: "professional_title", headline: "professional_title", "professional title": "professional_title",
  };
  const CONTACT_RE = "full name|name|email address|email|phone number|phone|cell|number|location|city|address|linkedin url|linkedin profile|linkedin|professional title|headline|title";

  const STOP = new Set(("the my a an of for at in on to and with from as is i me that this entry one my my our " +
    "please change update set fix make add remove delete").split(/\s+/));

  // ── Text helpers ─────────────────────────────────────────────────────────
  const clone = (v) => JSON.parse(JSON.stringify(v));

  function tokens(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9+#]+/g, " ").split(" ").filter((t) => t && !STOP.has(t));
  }

  function tokenMatch(a, b) {
    if (a === b) return true;
    // Tolerate plurals and small transcription slips ("grocery" ~ "groceries").
    if (a.length >= 4 && b.length >= 4) {
      const n = Math.min(a.length, b.length) - (Math.min(a.length, b.length) >= 6 ? 2 : 1);
      return a.slice(0, n) === b.slice(0, n);
    }
    return false;
  }

  const SMALL = new Set(["a", "an", "and", "of", "the", "for", "in", "on", "at", "to", "with", "or"]);
  // Speech engines return lower-case text; title-case names and skills, but
  // leave anything the user typed with capitals alone.
  function titleCase(s) {
    s = String(s || "").trim();
    if (s !== s.toLowerCase()) return s;
    return s.split(/\s+/).map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
  }

  function sentence(s) {
    s = String(s || "").trim().replace(/\s+/g, " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function bulletText(s) { return sentence(s).replace(/[.;,]+$/, ""); }

  const MONTHS = "january february march april may june july august september october november december jan feb mar apr jun jul aug sep sept oct nov dec".split(" ");
  function formatDate(s) {
    let v = String(s || "").trim();
    v = v.replace(/\s+(?:to|through|thru|until|till|-|–|—)\s+/gi, " – ");
    v = v.replace(/\b(present|now|current|currently|today)\b/gi, "Present");
    v = v.replace(/\b[a-z]+\b/g, (w) => (MONTHS.includes(w.toLowerCase()) ? w.charAt(0).toUpperCase() + w.slice(1) : w));
    return v.charAt(0).toUpperCase() + v.slice(1);
  }

  function formatValue(field, v) {
    if (field === "date") return formatDate(v);
    if (field === "email") return String(v).trim().replace(/\s+at\s+/i, "@").replace(/\s+dot\s+/gi, ".").replace(/\s+/g, "").toLowerCase();
    if (field === "phone") return String(v).trim();
    if (field === "linkedin") return String(v).trim().replace(/\s+/g, "");
    if (field === "coursework") return sentence(v);
    return titleCase(v);
  }

  // Strip politeness and filler so "can you please change…" parses the same.
  function normalize(text) {
    let t = String(text || "").trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
    const lead = /^(please|can you|could you|would you|will you|i want to|i'd like to|i would like to|i need to|let's|lets|go ahead and|hey|ok|okay|so|um|uh)\s+/i;
    let prev;
    do { prev = t; t = t.replace(lead, ""); } while (t !== prev);
    t = t.replace(/\s+please$/i, "");
    t = t.replace(/\be-mail\b/gi, "email").replace(/\bskill ?set\b/gi, "skills").replace(/\bwork history\b/gi, "experience");
    return t.trim();
  }

  // ── Entry lookup ─────────────────────────────────────────────────────────
  const ENTRY_SECTIONS = ["experience", "education", "projects", "custom"];

  function entryLabel(section, e) {
    if (!e) return "";
    if (section === "experience") return [e.title, e.company_city].filter(Boolean).join(" ");
    if (section === "education") return [e.school, e.degree].filter(Boolean).join(" ");
    return e.title || "";
  }

  function entryName(section, e) {
    if (!e) return "";
    if (section === "education") return e.school || e.degree || "(untitled school)";
    return e.title || "(untitled)";
  }

  function entriesOf(st, section) {
    if (section === "custom") return st.custom_sections || [];
    return st[section] || [];
  }

  const ORDINALS = { first: 0, "1st": 0, second: 1, "2nd": 1, third: 2, "3rd": 2, fourth: 3, "4th": 3, fifth: 4, "5th": 4 };
  const NEWEST = /\b(latest|current|most recent|newest|recent|top)\b/i;

  // Score every entry against the spoken target. Returns candidates sorted by
  // score; each has { section, index, score, matched }.
  function findEntries(st, target, scope) {
    const sections = scope ? [scope] : ENTRY_SECTIONS;
    const tTokens = tokens(target);
    const hintFor = (sec, labelTokens) => (SECTION_WORDS[sec] || []).some((w) => tTokens.includes(w) && !labelTokens.includes(w));
    const out = [];
    for (const sec of sections) {
      const list = entriesOf(st, sec);
      list.forEach((e, index) => {
        const lt = tokens(entryLabel(sec, e));
        if (!lt.length) return;
        // A section word in the target that is NOT part of this entry's own
        // name points elsewhere: "the north miami job" is not the school.
        const otherHint = ENTRY_SECTIONS.some((o) => o !== sec && hintFor(o, lt));
        const ownHint = hintFor(sec, lt);
        if (otherHint && !ownHint) return;
        const matched = tTokens.filter((t) => !Object.values(SECTION_WORDS).some((ws) => ws.includes(t) && !lt.includes(t)))
          .filter((t, i, arr) => arr.indexOf(t) === i)
          .filter((t) => lt.some((l) => tokenMatch(t, l))).length;
        if (!matched) return;
        out.push({ section: sec, index, matched, score: matched + 0.5 * (matched / lt.length) + (ownHint ? 1 : 0) });
      });
    }
    // Ordinals: "my first job", "the last school", "my current job".
    if (!out.length) {
      const sec = scope || ENTRY_SECTIONS.find((s) => (SECTION_WORDS[s] || []).some((w) => tTokens.includes(w)));
      const list = sec ? entriesOf(st, sec) : [];
      if (sec && list.length) {
        const low = String(target).toLowerCase();
        let idx = null;
        for (const [w, i] of Object.entries(ORDINALS)) if (new RegExp(`\\b${w}\\b`).test(low)) idx = i;
        if (/\blast\b/.test(low)) idx = list.length - 1;
        if (idx == null && NEWEST.test(low)) idx = 0;
        if (idx == null && list.length === 1) idx = 0;
        if (idx != null && idx < list.length) out.push({ section: sec, index: idx, matched: 1, score: 1 });
      }
    }
    return out.sort((a, b) => b.score - a.score);
  }

  // Pick one entry or report ambiguity. `ctx` = { section, index } of the
  // field the user last touched; it breaks ties, never overrides a clear match.
  function resolveEntry(st, target, scope, ctx) {
    const c = findEntries(st, target, scope);
    if (!c.length) return { none: true };
    const top = c[0];
    const ties = c.filter((x) => top.score - x.score < 1);
    if (ties.length === 1) return { hit: top };
    if (ctx) {
      const inCtx = ties.filter((x) => x.section === ctx.section && (ctx.index == null || x.index === ctx.index));
      if (inCtx.length === 1) return { hit: inCtx[0] };
    }
    return { ties: ties.slice(0, 4) };
  }

  // When there is no separator word, find where the target ends and the
  // content begins: the shortest prefix that matches an entry best.
  function splitTargetValue(st, rest, scope) {
    const words = rest.split(/\s+/);
    let best = { k: 0, m: 0 };
    for (let k = 1; k < words.length; k++) {
      const c = findEntries(st, words.slice(0, k).join(" "), scope);
      const m = c.length ? c[0].matched : 0;
      if (m > best.m) best = { k, m };
    }
    if (!best.m) return null;
    return { target: words.slice(0, best.k).join(" "), value: words.slice(best.k).join(" ") };
  }

  // Explicit scope: "in education …", "… under experience", "education: …".
  function extractScope(text) {
    const names = "work experience|experience|education|projects?|skills|summary|certifications?|contact(?: info)?";
    const map = (w) => {
      w = w.toLowerCase();
      if (/experience/.test(w)) return "experience";
      if (/project/.test(w)) return "projects";
      if (/certification/.test(w)) return "certs";
      if (/contact/.test(w)) return "header";
      return w;
    };
    let m = text.match(new RegExp(`^(${names})\\s*[:,]\\s*(.+)$`, "i"));
    if (m) return { scope: map(m[1]), text: m[2] };
    m = text.match(new RegExp(`^(?:in|under|for)\\s+(?:my\\s+|the\\s+)?(${names})(?:\\s+section)?\\s*,?\\s+(.+)$`, "i"));
    if (m) return { scope: map(m[1]), text: m[2] };
    m = text.match(new RegExp(`^(.+?)\\s+(?:in|under|on)\\s+(?:my\\s+|the\\s+)?(${names})(?:\\s+section)?$`, "i"));
    if (m) return { scope: map(m[2]), text: m[1] };
    return { scope: null, text };
  }

  // ── Parser ───────────────────────────────────────────────────────────────
  // Returns one of:
  //   { status: "ok", cmd }
  //   { status: "choose", prompt, options: [cmd] }
  //   { status: "error", message }
  //   { status: "undo" } | { status: "confirm" } | { status: "cancel" }
  function parseCommand(input, st, ctx) {
    const raw = normalize(input);
    if (!raw) return { status: "error", message: "Say what to change, e.g. “add Excel to my skills”." };
    if (/^(undo|undo that|scratch that|go back|revert( that)?|take that back)$/i.test(raw)) return { status: "undo" };
    if (/^(yes|yeah|yep|yup|confirm|apply|apply it|do it|go|go ahead|correct|that's right|sounds good|ok do it|okay do it)$/i.test(raw)) return { status: "confirm" };
    if (/^(no|nope|cancel|stop|never ?mind|forget it|don't|do not)$/i.test(raw)) return { status: "cancel" };

    const { scope, text } = extractScope(raw);
    const ok = (cmd) => ({ status: "ok", cmd });
    const err = (message) => ({ status: "error", message });
    let m;

    // Resolve an entry for an entry-level command; produces ok/choose/error.
    const withEntry = (target, build, allowed) => {
      const sc = scope && ENTRY_SECTIONS.includes(scope) ? scope : null;
      if (scope && !sc) return err(`${SECTION_LABEL[scope]} has no entries to change that way.`);
      let r;
      if (!target || !target.trim()) {
        if (ctx && ENTRY_SECTIONS.includes(ctx.section) && ctx.index != null && (!sc || sc === ctx.section)) {
          r = { hit: { section: ctx.section, index: ctx.index } };
        } else {
          return err("Which entry? Name it, e.g. “…for Sunset Groceries…”.");
        }
      } else {
        r = resolveEntry(st, target, sc, ctx);
      }
      const usable = (h) => !allowed || allowed.includes(h.section);
      if (r.none) return err(sc ? `I couldn't find “${target}” in ${SECTION_LABEL[sc]}.` : `I couldn't find “${target}” on your resume.`);
      if (r.hit) {
        if (!usable(r.hit)) return err(`That works on ${allowed.map((s) => SECTION_LABEL[s]).join(" or ")} entries only.`);
        return build(r.hit);
      }
      const options = r.ties.filter(usable).map((h) => build(h)).filter((x) => x.status === "ok").map((x) => x.cmd);
      if (!options.length) return err("I couldn't match that to an entry.");
      if (options.length === 1) return ok(options[0]);
      return { status: "choose", prompt: `Which one did you mean?`, options };
    };

    // Skills ───────────────────────────────────────────────────────────────
    const splitList = (s) => String(s).split(/\s*(?:,|;|\band\b|&|\bplus\b)\s*/i).map((x) => titleCase(x.replace(/^(?:skills?|the)\s+/i, ""))).filter(Boolean);
    if ((m = text.match(/^(?:add|include|put|list)\s+(.+?)\s+(?:to|in|into|under|on)\s+(?:my\s+|the\s+)?skills?(?:\s+section)?$/i))
      || (m = text.match(/^(?:add|include)\s+(?:a\s+|the\s+|new\s+)?skills?\s*:?\s+(.+)$/i))
      || (scope === "skills" && (m = text.match(/^(?:add|include)\s+(.+)$/i)))) {
      return ok({ action: "add_skills", section: "skills", values: splitList(m[1]) });
    }
    if ((m = text.match(/^(?:remove|delete|take out|drop|take off)\s+(.+?)\s+(?:from|off|out of)\s+(?:my\s+|the\s+)?skills?(?:\s+section)?$/i))
      || (m = text.match(/^(?:remove|delete|drop)\s+(?:the\s+)?skills?\s*:?\s+(.+)$/i))
      || (scope === "skills" && (m = text.match(/^(?:remove|delete|drop)\s+(.+)$/i)))) {
      return ok({ action: "remove_skills", section: "skills", values: splitList(m[1]) });
    }

    // Summary ──────────────────────────────────────────────────────────────
    const SUM = "summary|profile|about me|objective|bio|professional summary";
    if ((m = text.match(new RegExp(`^(?:change|update|set|replace|rewrite|make)\\s+(?:my\\s+|the\\s+)?(?:${SUM})\\s+(?:to|as|with|so it says|to say)\\s*:?\\s+(.+)$`, "i")))
      || (m = text.match(new RegExp(`^(?:my\\s+|the\\s+)?(?:${SUM})\\s+(?:should say|should read|is)\\s*:?\\s+(.+)$`, "i")))
      || (scope === "summary" && (m = text.match(/^(?:change|set|make|rewrite)(?:\s+it)?\s+(?:to|as)\s+(.+)$/i)))) {
      return ok({ action: "set_summary", section: "summary", value: sentence(m[1]) });
    }
    if ((m = text.match(new RegExp(`^add\\s+(?:to\\s+)?(?:my\\s+|the\\s+)?(?:${SUM})\\s*:?\\s+(?:that\\s+)?(.+)$`, "i")))
      || (m = text.match(new RegExp(`^add\\s+(.+?)\\s+to\\s+(?:my\\s+|the\\s+)?(?:${SUM})$`, "i")))
      || (scope === "summary" && (m = text.match(/^add\s+(.+)$/i)))) {
      return ok({ action: "append_summary", section: "summary", value: sentence(m[1]) });
    }

    // Certifications ───────────────────────────────────────────────────────
    if ((m = text.match(/^add\s+(?:a\s+|the\s+|my\s+)?(?:certification|certificate|cert)\s*:?\s+(?:for\s+|called\s+)?(.+)$/i))
      || (m = text.match(/^add\s+(.+?)\s+to\s+(?:my\s+|the\s+)?certifications?$/i))
      || (scope === "certs" && (m = text.match(/^add\s+(.+)$/i)))) {
      return ok({ action: "add_cert", section: "certs", value: titleCase(m[1]) });
    }
    if ((m = text.match(/^(?:remove|delete)\s+(?:the\s+|my\s+)?(?:certification|certificate|cert)\s*:?\s+(.+)$/i))
      || (m = text.match(/^(?:remove|delete)\s+(.+?)\s+from\s+(?:my\s+|the\s+)?certifications?$/i))) {
      const list = st.certifications || [];
      const t = tokens(m[1]);
      const idx = list.findIndex((c) => t.length && t.every((x) => tokens(c).some((y) => tokenMatch(x, y))));
      if (idx < 0) return err(`I couldn't find a certification matching “${m[1]}”.`);
      return ok({ action: "remove_cert", section: "certs", index: idx });
    }

    // Bullets ──────────────────────────────────────────────────────────────
    const SEP = /\s*(?::|—|\bsaying\b|\bthat says\b|\bwhich says\b|\bthat reads\b|\breading\b|\bwith the text\b|,)\s*/i;
    if ((m = text.match(/^add\s+(?:a\s+|another\s+|one more\s+|new\s+)?(?:bullet(?: point)?|point|line)\s+(?:to|for|under|in|on)\s+(?:my\s+|the\s+)?(.+)$/i))) {
      let target, value;
      const parts = m[1].split(SEP);
      if (parts.length >= 2 && parts[0] && parts.slice(1).join(" ").trim()) {
        target = parts[0];
        value = m[1].slice(m[1].search(SEP)).replace(SEP, "");
      } else {
        const sp = splitTargetValue(st, m[1], scope && ENTRY_SECTIONS.includes(scope) ? scope : null);
        if (!sp || !sp.value) return err("Say the bullet after the entry, e.g. “add a bullet to Sunset Groceries saying trained new cashiers”.");
        target = sp.target; value = sp.value;
      }
      return withEntry(target, (h) => ok({ action: "add_bullet", section: h.section, index: h.index, value: bulletText(value) }), ["experience", "projects", "custom"]);
    }
    if ((m = text.match(/^add\s+(?:a\s+|another\s+|one more\s+|new\s+)?(?:bullet(?: point)?|point|line)\s*(?::|saying|that says)?\s*(.+)$/i))) {
      return withEntry("", (h) => ok({ action: "add_bullet", section: h.section, index: h.index, value: bulletText(m[1]) }), ["experience", "projects", "custom"]);
    }
    if ((m = text.match(/^(?:remove|delete)\s+(?:the\s+)?(last|first|second|third|fourth|fifth|\d+(?:st|nd|rd|th)?)\s+(?:bullet(?: point)?|point|line)(?:\s+(?:from|in|under|of|on)\s+(?:my\s+|the\s+)?(.+))?$/i))) {
      const which = m[1].toLowerCase();
      return withEntry(m[2] || "", (h) => {
        const bullets = (entriesOf(st, h.section)[h.index].bullets || []);
        const n = bullets.length;
        if (!n) return err(`${entryName(h.section, entriesOf(st, h.section)[h.index])} has no bullets.`);
        let bi = which === "last" ? n - 1 : (ORDINALS[which] != null ? ORDINALS[which] : parseInt(which, 10) - 1);
        if (!(bi >= 0 && bi < n)) return err(`That entry only has ${n} bullet${n === 1 ? "" : "s"}.`);
        return ok({ action: "remove_bullet", section: h.section, index: h.index, bulletIndex: bi });
      }, ["experience", "projects", "custom"]);
    }

    // Contact fields ("change my phone number to …") ──────────────────────
    if ((m = text.match(new RegExp(`^(?:change|update|set|make|fix)\\s+(?:my\\s+|the\\s+)?(${CONTACT_RE})\\s+(?:to|as)\\s+(.+)$`, "i")))
      && (!scope || scope === "header")) {
      const field = CONTACT_FIELDS[m[1].toLowerCase()];
      return ok({ action: "set_contact", section: "header", field, value: formatValue(field, m[2]) });
    }

    // Entry fields ─────────────────────────────────────────────────────────
    const fieldFor = (sec, word) => (FIELD_WORDS[sec] || {})[String(word).toLowerCase()];
    const setField = (target, word, value) => withEntry(target, (h) => {
      const field = fieldFor(h.section, word);
      if (!field) return err(`${SECTION_LABEL[h.section]} entries don't have a “${word}”.`);
      return ok({ action: "set_field", section: h.section, index: h.index, field, value: formatValue(field, value) });
    }, ["experience", "education", "projects"]);
    if ((m = text.match(new RegExp(`^(?:change|update|set|fix|make|correct)\\s+(?:the\\s+|my\\s+)?(${FIELD_RE})\\s+(?:of|for|at|on|in|from)\\s+(?:my\\s+|the\\s+)?(.+?)\\s+(?:to|as)\\s+(.+)$`, "i")))) {
      return setField(m[2], m[1], m[3]);
    }
    if ((m = text.match(new RegExp(`^(?:change|update|set|fix|correct)\\s+(?:the\\s+|my\\s+)?(${FIELD_RE})\\s+(?:to|as)\\s+(.+)$`, "i")))) {
      return setField("", m[1], m[2]);
    }
    if ((m = text.match(new RegExp(`^(?:change|update|set|fix|correct)\\s+(?:the\\s+|my\\s+)?(.+?)(?:'s|s')?\\s+(${FIELD_RE})\\s+(?:to|as)\\s+(.+)$`, "i")))) {
      return setField(m[1], m[2], m[3]);
    }
    if ((m = text.match(/^rename\s+(?:my\s+|the\s+)?(.+?)\s+(?:to|as)\s+(.+)$/i))) {
      return withEntry(m[1], (h) => {
        const field = h.section === "education" ? "school" : "title";
        return ok({ action: "set_field", section: h.section, index: h.index, field, value: formatValue(field, m[2]) });
      });
    }

    // New entries ──────────────────────────────────────────────────────────
    if ((m = text.match(/^add\s+(?:a\s+|an\s+|new\s+|another\s+)*(?:job|position|role|work experience|experience|internship)\s*:?\s+(?:as\s+(?:an?\s+)?|at\s+)?(.+)$/i))
      || (scope === "experience" && (m = text.match(/^add\s+(?:a\s+|an\s+|new\s+)?(.+)$/i)))) {
      return ok({ action: "add_entry", section: "experience", value: titleCase(m[1]) });
    }
    if ((m = text.match(/^add\s+(?:a\s+|an\s+|new\s+|another\s+)*(?:school|education|college|university)\s*:?\s+(.+)$/i))
      || (scope === "education" && (m = text.match(/^add\s+(?:a\s+|an\s+|new\s+)?(.+)$/i)))) {
      return ok({ action: "add_entry", section: "education", value: titleCase(m[1]) });
    }
    if ((m = text.match(/^add\s+(?:a\s+|an\s+|new\s+|another\s+)*project\s*:?\s+(?:called\s+|named\s+)?(.+)$/i))
      || (scope === "projects" && (m = text.match(/^add\s+(?:a\s+|an\s+|new\s+)?(.+)$/i)))) {
      return ok({ action: "add_entry", section: "projects", value: titleCase(m[1]) });
    }
    if ((m = text.match(/^add\s+(?:a\s+|an\s+|new\s+)?section\s*:?\s+(?:called\s+|named\s+)?(.+)$/i))) {
      return ok({ action: "add_entry", section: "custom", value: titleCase(m[1]) });
    }

    // Remove an entry ──────────────────────────────────────────────────────
    if ((m = text.match(/^(?:remove|delete|take out|get rid of)\s+(?:my\s+|the\s+)?(.+?)(?:\s+entry)?$/i))) {
      return withEntry(m[1], (h) => ok({ action: "remove_entry", section: h.section, index: h.index }));
    }

    return err("I didn't catch which part to change. Try “add Excel to my skills” or “change the date for Sunset Groceries to 2021 to 2022”.");
  }

  // ── Preview text ─────────────────────────────────────────────────────────
  const FIELD_LABEL = { date: "date", title: "title", location: "location", company_city: "company", school: "school", degree: "degree", city: "city", coursework: "coursework", name: "name", professional_title: "title", phone: "phone", email: "email", linkedin: "LinkedIn" };

  // { where, verb, before, after } for the confirmation card.
  function describeCommand(st, cmd) {
    const sec = SECTION_LABEL[cmd.section];
    const entry = cmd.index != null ? entriesOf(st, cmd.section)[cmd.index] : null;
    const where = entry ? `${sec} › ${entryName(cmd.section, entry)}` : sec;
    switch (cmd.action) {
      case "add_skills": return { where, verb: `Add skill${cmd.values.length === 1 ? "" : "s"}`, before: "", after: cmd.values.join(", ") };
      case "remove_skills": return { where, verb: `Remove skill${cmd.values.length === 1 ? "" : "s"}`, before: cmd.values.join(", "), after: "" };
      case "set_summary": return { where, verb: "Replace summary", before: st.summary || "", after: cmd.value };
      case "append_summary": return { where, verb: "Add to summary", before: st.summary || "", after: [st.summary, cmd.value].filter(Boolean).join(" ") };
      case "add_cert": return { where, verb: "Add certification", before: "", after: cmd.value };
      case "remove_cert": return { where, verb: "Remove certification", before: (st.certifications || [])[cmd.index], after: "" };
      case "add_bullet": return { where, verb: "Add bullet", before: "", after: cmd.value };
      case "remove_bullet": return { where, verb: `Remove bullet ${cmd.bulletIndex + 1}`, before: entry.bullets[cmd.bulletIndex], after: "" };
      case "set_contact": return { where, verb: `Change ${FIELD_LABEL[cmd.field] || cmd.field}`, before: st[cmd.field] || "", after: cmd.value };
      case "set_field": return { where, verb: `Change ${FIELD_LABEL[cmd.field] || cmd.field}`, before: entry[cmd.field] || "", after: cmd.value };
      case "add_entry": return { where: sec, verb: cmd.section === "custom" ? "Add section" : `Add ${cmd.section === "education" ? "school" : cmd.section === "projects" ? "project" : "position"} at the top`, before: "", after: cmd.value };
      case "remove_entry": return { where, verb: "Remove entire entry", before: entryName(cmd.section, entry), after: "" };
      default: return { where, verb: cmd.action, before: "", after: "" };
    }
  }

  // ── Apply (section-locked) ───────────────────────────────────────────────
  function skillsAll(st) {
    const out = [];
    (st.skills_categories || []).forEach((c) => String(c.content || "").split(/\s*,\s*/).forEach((s) => s && out.push(s)));
    (st.skills_two_column || []).forEach((r) => { if (r.left) out.push(r.left); if (r.right) out.push(r.right); });
    String(st.skills_inline || "").split(/\s*[│|]\s*/).forEach((s) => s && out.push(s));
    return out;
  }

  function mutate(st, cmd) {
    const entries = cmd.index != null ? entriesOf(st, cmd.section) : null;
    const entry = entries ? entries[cmd.index] : null;
    if (cmd.index != null && !entry && cmd.action !== "remove_cert") throw new Error("That entry no longer exists.");
    switch (cmd.action) {
      case "add_skills": {
        // Every template keeps its own skills shape; update all three so the
        // skill survives a template switch.
        const have = new Set(skillsAll(st).map((s) => s.toLowerCase()));
        const add = cmd.values.filter((v) => !have.has(v.toLowerCase()));
        if (!add.length) throw new Error("Those skills are already on your resume.");
        if (!st.skills_categories || !st.skills_categories.length) st.skills_categories = [{ label: "Skills", content: "" }];
        const cat = st.skills_categories[0];
        cat.content = [cat.content, ...add].filter(Boolean).join(", ");
        st.skills_two_column = st.skills_two_column || [];
        for (const v of add) {
          const row = st.skills_two_column.find((r) => !r.left || !r.right);
          if (row && !row.left) row.left = v; else if (row) row.right = v; else st.skills_two_column.push({ left: v, right: "" });
        }
        st.skills_inline = [st.skills_inline, ...add].filter(Boolean).join(" │ ");
        return;
      }
      case "remove_skills": {
        const kill = new Set(cmd.values.map((v) => v.toLowerCase()));
        const before = skillsAll(st).length;
        (st.skills_categories || []).forEach((c) => { c.content = String(c.content || "").split(/\s*,\s*/).filter((s) => s && !kill.has(s.toLowerCase())).join(", "); });
        const cells = [];
        (st.skills_two_column || []).forEach((r) => { if (r.left) cells.push(r.left); if (r.right) cells.push(r.right); });
        const keep = cells.filter((s) => !kill.has(s.toLowerCase()));
        if (keep.length !== cells.length) {
          st.skills_two_column = [];
          for (let i = 0; i < keep.length; i += 2) st.skills_two_column.push({ left: keep[i], right: keep[i + 1] || "" });
        }
        st.skills_inline = String(st.skills_inline || "").split(/\s*[│|]\s*/).filter((s) => s && !kill.has(s.toLowerCase())).join(" │ ");
        if (skillsAll(st).length === before) throw new Error(`I couldn't find ${cmd.values.join(", ")} in your skills.`);
        return;
      }
      case "set_summary": st.summary = cmd.value; return;
      case "append_summary": st.summary = [String(st.summary || "").trim(), cmd.value].filter(Boolean).join(" "); return;
      case "add_cert": st.certifications = (st.certifications || []).concat(cmd.value); return;
      case "remove_cert":
        if (!(st.certifications || [])[cmd.index]) throw new Error("That certification no longer exists.");
        st.certifications.splice(cmd.index, 1); return;
      case "add_bullet": {
        entry.bullets = entry.bullets || [];
        const last = entry.bullets.length - 1;
        if (last >= 0 && !String(entry.bullets[last]).trim()) entry.bullets[last] = cmd.value;
        else entry.bullets.push(cmd.value);
        return;
      }
      case "remove_bullet":
        if (!(entry.bullets || [])[cmd.bulletIndex] && entry.bullets[cmd.bulletIndex] !== "") throw new Error("That bullet no longer exists.");
        entry.bullets.splice(cmd.bulletIndex, 1); return;
      case "set_contact": {
        const old = String(st[cmd.field] || "").trim();
        st[cmd.field] = cmd.value;
        // Templates with free-form contact lines show these values inline.
        if (old && ["location", "phone", "email", "linkedin"].includes(cmd.field)) {
          ["contact_line1", "contact_line2"].forEach((k) => { if (st[k] && st[k].includes(old)) st[k] = st[k].split(old).join(cmd.value); });
        }
        return;
      }
      case "set_field": entry[cmd.field] = cmd.value; return;
      case "add_entry": {
        const blank = {
          experience: { title: cmd.value, date: "", location: "", company_city: "", bullets: [""] },
          education: { school: cmd.value, city: "", degree: "", date: "", subline_bold: "", subline_rest: "", coursework: "", certifications: "" },
          projects: { title: cmd.value, date: "", location: "", bullets: [""] },
          custom: { title: cmd.value, bullets: [""] },
        }[cmd.section];
        if (cmd.section === "custom") (st.custom_sections = st.custom_sections || []).push(blank);
        else (st[cmd.section] = st[cmd.section] || []).unshift(blank);
        return;
      }
      case "remove_entry": entries.splice(cmd.index, 1); return;
      default: throw new Error(`Unknown action ${cmd.action}`);
    }
  }

  // Apply to a copy, verify the lock, and return the new state plus the
  // before-values of the touched keys (for undo).
  function applyCommand(st, cmd) {
    const allowed = SECTION_KEYS[cmd.section];
    if (!allowed) throw new Error(`Unknown section ${cmd.section}`);
    const next = clone(st);
    mutate(next, cmd);
    const keys = new Set([...Object.keys(st), ...Object.keys(next)]);
    for (const k of keys) {
      if (allowed.includes(k)) continue;
      if (JSON.stringify(st[k]) !== JSON.stringify(next[k])) {
        throw new Error(`SECTION_LOCK: a ${SECTION_LABEL[cmd.section]} command tried to change “${k}”.`);
      }
    }
    const before = {};
    for (const k of allowed) before[k] = clone(st[k] === undefined ? null : st[k]);
    return { state: next, undo: { section: cmd.section, before } };
  }

  return { parseCommand, describeCommand, applyCommand, SECTION_KEYS, SECTION_LABEL, normalize, findEntries };
});
