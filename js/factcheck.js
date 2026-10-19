// ResumeCanvas — "is this claim in the user's own words?" check.
//
// Every assisted rewrite (AI polish, AI import, voice-drafted summary) is
// compared to the text the user actually gave us. Anything that adds a hard
// claim the source doesn't contain is flagged so the UI can leave it
// unchecked and ask the user to confirm it is true:
//   • number   — 20, 20%, $5k, "five", "twice"
//   • scope    — led, managed, supervised, increased, team of, top …
//   • name     — a proper noun or tool (Salesforce, SQL, Google) not in the source
//
// Deterministic and local: no AI, no network. Pure — loaded in the page as
// window.RcFactCheck and require()-able by the Node tests.

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.RcFactCheck = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const NUMBER_WORDS = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
    nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
    hundred: 100, thousand: 1000, million: 1000000, dozen: 12, dozens: 12, hundreds: 100, thousands: 1000,
    twice: 2, double: 2, doubled: 2, triple: 3, tripled: 3, half: 0.5, single: 1,
  };

  // Words that raise the claimed scope of a role. Compared by stem, so
  // "management" in the source legitimises "managed" in the rewrite.
  const SCOPE_WORDS = [
    "led", "lead", "leading", "leader", "leadership", "headed", "directed", "director", "oversaw", "oversee", "overseeing",
    "managed", "manage", "managing", "manager", "supervised", "supervise", "supervising", "supervisor",
    "spearheaded", "spearhead", "founded", "founder", "launched", "launch", "pioneered", "established",
    "owned", "ownership", "chaired", "championed", "coordinated", "orchestrated",
    "increased", "increase", "decreased", "reduced", "reduce", "grew", "grow", "boosted", "improved", "improve",
    "generated", "saved", "exceeded", "surpassed", "outperformed", "maximized", "drove", "driving",
    "trained", "mentored", "coached", "hired", "recruited",
    "negotiated", "secured", "won", "awarded", "award", "promoted", "promotion",
    "senior", "head", "chief", "principal", "expert", "top", "best", "record", "revenue", "profit", "profits", "budget", "budgets",
    "strategy", "strategic", "enterprise", "company-wide", "nationwide", "global", "international",
  ];

  // Capitalised words that are just grammar or calendar, not new facts.
  const COMMON_CAPS = new Set(("i a an the and or of for to in on at by with as from my our we me " +
    "january february march april may june july august september october november december " +
    "jan feb mar apr jun jul aug sep sept oct nov dec monday tuesday wednesday thursday friday saturday sunday present").split(" "));

  function stem(w) {
    w = String(w).toLowerCase().replace(/[^a-z0-9+#]/g, "");
    if (w.length <= 4) return w;
    const base = w.replace(/(ments?|ings?|ers?|ed|es|s)$/, "") || w;
    return base.length > 4 ? base.replace(/e$/, "") : base; // manage ~ managed
  }

  function words(text) {
    return String(text || "").split(/[^A-Za-z0-9+#&$%.'-]+/).map((w) => w.replace(/^[.'-]+|[.'-]+$/g, "")).filter(Boolean);
  }

  // All numeric values mentioned in a text, as normalised strings.
  function numbersIn(text) {
    const out = new Set();
    const s = String(text || "");
    (s.match(/\$?\d[\d,]*(?:\.\d+)?\s*(?:%|k\b|m\b)?/gi) || []).forEach((n) => {
      const pct = /%/.test(n);
      let v = parseFloat(n.replace(/[$,%\s]/g, "").replace(/[km]$/i, ""));
      if (/k$/i.test(n.trim())) v *= 1000;
      if (/m$/i.test(n.trim())) v *= 1000000;
      if (!isNaN(v)) out.add(String(v) + (pct ? "%" : ""));
      if (!isNaN(v)) out.add(String(v));
    });
    words(s).forEach((w) => {
      const n = NUMBER_WORDS[w.toLowerCase()];
      if (n != null) out.add(String(n));
    });
    return out;
  }

  // Human-readable number tokens from the candidate (for the flag label).
  function numberTokens(text) {
    const s = String(text || "");
    const toks = (s.match(/\$?\d[\d,]*(?:\.\d+)?\s*(?:%|k\b|m\b)?/gi) || []).map((t) => t.trim());
    words(s).forEach((w) => { if (NUMBER_WORDS[w.toLowerCase()] != null) toks.push(w); });
    return toks;
  }

  function valueOf(tok) {
    const lw = tok.toLowerCase();
    if (NUMBER_WORDS[lw] != null) return [String(NUMBER_WORDS[lw])];
    let v = parseFloat(tok.replace(/[$,%\s]/g, "").replace(/[km]$/i, ""));
    if (/k$/i.test(tok)) v *= 1000;
    if (/m$/i.test(tok)) v *= 1000000;
    return /%/.test(tok) ? [String(v) + "%", String(v)] : [String(v)];
  }

  // Compare `candidate` to `source`; returns [{ kind, text }], deduplicated.
  function checkClaims(candidate, source) {
    const flags = [];
    const seen = new Set();
    const add = (kind, text) => { const k = kind + ":" + text.toLowerCase(); if (!seen.has(k)) { seen.add(k); flags.push({ kind, text }); } };
    const src = String(source || "");
    const srcLower = src.toLowerCase();

    // Numbers.
    const srcNums = numbersIn(src);
    for (const tok of numberTokens(candidate)) {
      if (!valueOf(tok).some((v) => srcNums.has(v))) add("number", tok);
    }

    // Scope words.
    const srcStems = new Set(words(src).map(stem));
    const scope = new Set(SCOPE_WORDS.map(stem));
    for (const w of words(candidate)) {
      const st = stem(w);
      if (scope.has(st) && !srcStems.has(st)) add("scope", w.toLowerCase());
    }
    if (/\bteam of\b/i.test(candidate) && !/\bteam of\b/i.test(src)) add("scope", "team of");

    // Names and tools: capitalised (not sentence-initial) or ALL-CAPS/symbol
    // tokens that never appear in the source, case-insensitively.
    String(candidate || "").split(/(?<=[.!?:])\s+|\n+/).forEach((sentence) => {
      const ws = words(sentence);
      ws.forEach((w, i) => {
        const bare = w.replace(/[$%]/g, "");
        if (!/[A-Za-z]/.test(bare)) return;
        const isCap = /^[A-Z]/.test(bare) && i > 0;
        const isTechy = /^[A-Z0-9+#&.]{2,}$/.test(bare) && /[A-Z]/.test(bare);
        if (!isCap && !isTechy) return;
        if (COMMON_CAPS.has(bare.toLowerCase())) return;
        if (srcLower.includes(bare.toLowerCase())) return;
        if (scope.has(stem(bare))) return; // already reported as scope
        add("name", bare);
      });
    });

    return flags;
  }

  // "Not in your original: 20%, led, Salesforce"
  function describeFlags(flags) {
    if (!flags || !flags.length) return "";
    return `Not in your own words: ${flags.map((f) => f.text).join(", ")}`;
  }

  return { checkClaims, describeFlags, numbersIn };
});
