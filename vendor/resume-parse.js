// ─────────────────────────────────────────────────────────
// RESUME TEXT PARSER
// Pure, DOM-free parsing of pasted/imported resume text into the
// structured shape the app consumes. Kept in its own module so it can be
// unit-tested under Node (see tests/) and reused by app.js in the browser.
// ─────────────────────────────────────────────────────────

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.RcParse = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

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
  // A "City ST" / "City, ST" location. The two-letter token must be a real US
  // state/territory code so we don't mistake "Microsoft IT" or "Project QA"
  // (any capitalized word + two capitals) for a location.
  const US_STATE = "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|PR";
  const LOCATION_RE = new RegExp(`[A-Z][a-zA-Z.]+(?:\\s+[A-Z][a-zA-Z.]+)*,?\\s+(?:${US_STATE})\\b(?:\\s+\\d{5})?`);
  // Matches a single date token OR a "start – end" range (en/em dash, hyphen, or
  // the word "to"). Used to pull dates out of, and scrub them from, heading lines.
  const DATE_RANGE_RE = new RegExp(`${DATE_TOKEN_RE.source}\\s*(?:[–\\-—]+|\\bto\\b)\\s*${DATE_TOKEN_RE.source}|${DATE_TOKEN_RE.source}`, "i");
  const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
  const PHONE_RE = /(?:\+?\d[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
  const LINKEDIN_RE = /(?:https?:\/\/)?(?:[\w-]+\.)?linkedin\.com\/[^\s|]+/i;

  // Whole-line names of resume sections the app has no first-class home for.
  // Matched against the full heading text (anchored) to avoid eating entry
  // titles that merely start with one of these words (e.g. "Research Assistant").
  const OTHER_SECTION_WORDS = /^(volunteer( experience| work)?|community (service|involvement)|leadership( experience)?|awards?( (and|&) honou?rs?)?|honou?rs?( (and|&) awards?)?|achievements?|accomplishments?|languages?|publications?|research( experience)?|references?|interests?|hobbies|activities|extracurricular( activities)?|affiliations?|professional affiliations?|memberships?|professional development|training|(relevant )?coursework|courses|portfolio|patents?|presentations?|additional information)$/i;

  // Suggest a default destination section for an unmodeled "other" section,
  // based on its heading. Returns one of: skills | experience | projects |
  // certifications | skip. Used to pre-select the routing dropdown in the
  // import modal; the user can always override.
  function suggestDestination(title) {
    const t = String(title || "").toLowerCase();
    if (/(volunteer|community|leadership|extracurricular|activities|affiliation|membership)/.test(t)) return "experience";
    if (/(language|tool|technolog|proficienc|competenc|software|framework)/.test(t)) return "skills";
    if (/(award|honou?r|achievement|accomplishment|recognition|scholarship)/.test(t)) return "certifications";
    if (/(publication|research|presentation|patent|portfolio|project)/.test(t)) return "projects";
    return "skip";
  }

  // Recognize an "inline" section heading where the label and its content share
  // one line, e.g. "SKILLS: Word, Excel" or "Education: Miami Dade College".
  // Many real-world (and pasted) resumes collapse the heading onto the content
  // line; without this they'd leak into whatever section came before. Returns
  // { section, rest } or null. The label is validated against the same anchored
  // SECTION_PATTERNS used for standalone headings, so it can't misfire on prose
  // like "References: available on request".
  function matchInlineSection(line) {
    const ci = line.indexOf(":");
    if (ci <= 0) return null;
    const label = line.slice(0, ci + 1); // keep the colon so the optional ":?" matches
    const rest = line.slice(ci + 1).trim();
    if (!rest) return null; // bare "HEADING:" — a standalone heading, handled elsewhere
    const m = SECTION_PATTERNS.find(([, re]) => re.test(label));
    return m ? { section: m[0], rest } : null;
  }

  function nextNonEmpty(lines, i) {
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j]) return lines[j];
    }
    return "";
  }

  // Decide whether a line that matched no known section is an unmodeled
  // section heading (so its content gets quarantined instead of bleeding into
  // the previous known section). Curated names always count; generic
  // ALL-CAPS / colon-terminated lines count only when the following line is
  // not an entry sub-header (date/location) or a bullet — which would mean
  // this is a job/project title, not a section break.
  function isUnknownHeading(line, nextLine) {
    const l = (line || "").trim();
    if (!l || BULLET_RE.test(l)) return false;
    if (l.length > 45 || l.split(/\s+/).length > 6) return false;
    if (EMAIL_RE.test(l) || PHONE_RE.test(l) || LINKEDIN_RE.test(l) || /https?:\/\//i.test(l)) return false;
    if (/[.,;]$/.test(l)) return false;
    const core = l.replace(/:$/, "").trim();
    if (!core || LOCATION_RE.test(core) || DATE_TOKEN_RE.test(core)) return false;
    if (OTHER_SECTION_WORDS.test(core)) return true;
    const letters = core.replace(/[^A-Za-z]/g, "");
    const isAllCaps = letters.length >= 2 && core === core.toUpperCase();
    const endsColon = /:$/.test(l);
    if (!isAllCaps && !endsColon) return false;
    const nx = (nextLine || "").trim();
    if (BULLET_RE.test(nx) || DATE_TOKEN_RE.test(nx) || LOCATION_RE.test(nx)) return false;
    return true;
  }

  function parseResumeText(text) {
    const rawLines = String(text || "").replace(/\r/g, "").split("\n").map((l) => l.replace(/\t/g, " ").trim());
    const sections = { header: [], summary: [], education: [], skills: [], projects: [], experience: [], certifications: [] };
    const other = []; // unmodeled sections: { title, lines }
    let current = "header";
    let currentOther = null;
    let enteredBody = false;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const matched = SECTION_PATTERNS.find(([, re]) => re.test(line));
      if (matched) {
        current = matched[0];
        currentOther = null;
        enteredBody = true;
        continue;
      }
      // "SKILLS: a, b, c" style inline headings: switch sections and keep the
      // trailing content as that section's first line.
      const inline = matchInlineSection(line);
      if (inline) {
        current = inline.section;
        currentOther = null;
        enteredBody = true;
        sections[current].push(inline.rest);
        continue;
      }
      // Only quarantine unknown headings once we're past the implicit header
      // block, so an ALL-CAPS name/contact line up top isn't misread.
      if (enteredBody && isUnknownHeading(line, nextNonEmpty(rawLines, i))) {
        currentOther = { title: line.replace(/:$/, "").trim(), lines: [] };
        other.push(currentOther);
        current = "other";
        continue;
      }
      if (current === "other") {
        if (currentOther) currentOther.lines.push(line);
      } else {
        sections[current].push(line);
      }
    }

    const header = parseHeader(sections.header);
    const summary = sections.summary.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    const skills = parseSkills(sections.skills);
    const education = parseEducationBlocks(sections.education);
    const projects = parseEntryBlocks(sections.projects);
    const experience = parseEntryBlocks(sections.experience);
    const certifications = sections.certifications.filter(Boolean).map((l) => l.replace(BULLET_RE, ""));
    const otherSections = other
      .map((o) => {
        const lines = o.lines.filter(Boolean);
        return { title: o.title, lines, text: lines.join("\n") };
      })
      .filter((o) => o.title && o.lines.length);

    return { header, summary, skills, education, projects, experience, certifications, other: otherSections };
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
      cleaned.split(/[,;|·•]/).forEach((piece) => {
        const t = piece.trim();
        if (t && !seen.has(t.toLowerCase())) {
          seen.add(t.toLowerCase());
          items.push(t);
        }
      });
    }
    return items;
  }

  const DEGREE_RE = /(associate|bachelor|master|ph\.?d|doctorate|m\.?b\.?a|b\.?s\.?\b|m\.?s\.?\b|b\.?a\.?\b|m\.?a\.?\b|degree|diploma|certificate|high\s+school|g\.?e\.?d|major|minor|gpa)/i;
  // A graduation date: an optional "Expected/Anticipated/Graduated" qualifier,
  // optional month, a year, and an optional range end. Anchored so we capture the
  // whole "expected 2025" rather than just the word "expected".
  const GRAD_DATE_RE = /(?:expected|anticipated|graduat(?:ed|ion))?\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?\d{4}(?:\s*(?:[–\-—]+|\bto\b)\s*(?:present|current|\d{4}))?/i;

  function parseEducationBlocks(lines) {
    const blocks = groupByBlankLine(lines);
    return blocks.map((block) => {
      // Identify the degree line first (by keyword) so a degree that also carries
      // a date ("Associate in Arts, expected 2025") isn't stolen by the date scan.
      let degree = block.find((l) => DEGREE_RE.test(l)) || "";
      const dateLine = block.find((l) => l !== degree && DATE_TOKEN_RE.test(l)) || "";
      let school = block.find((l) => l !== degree && l !== dateLine) || block[0] || "";

      let date = dateLine;
      if (!date && GRAD_DATE_RE.test(degree)) {
        // Date lives on the degree line — split it out so each field is clean.
        const dm = degree.match(GRAD_DATE_RE);
        date = dm[0].trim();
        degree = degree.replace(dm[0], "").replace(/[\s,;–—\-]+$/, "").trim();
      }

      let city = "";
      const splitMatch = school.match(/^(.+?)\s*[—–\-|]\s*(.+)$/);
      if (splitMatch && LOCATION_RE.test(splitMatch[2])) {
        school = splitMatch[1].trim();
        city = splitMatch[2].trim();
      } else {
        const cityInSchool = (school.match(LOCATION_RE) || [""])[0];
        const cityInDate = (dateLine.match(LOCATION_RE) || [""])[0];
        if (cityInDate) city = cityInDate;
        else if (cityInSchool && cityInSchool !== school) city = cityInSchool;
      }
      return { school, city, degree, date };
    });
  }

  // Split one blank-line-delimited block into entries. Real resumes (especially
  // weak/pasted ones) rarely use bullet glyphs and often omit blank lines between
  // jobs, so we can't rely on either alone. Strategy:
  //   • A block with no bullets and at most one date is treated as a single entry
  //     whose heading is the whole block (preserves clean multi-line "title /
  //     company / date" headers).
  //   • Otherwise we walk the lines: a dated line opens a new entry once the
  //     current one is "closed" (already has bullets or its own date); a plain,
  //     undated line after the heading becomes a bullet (a duty), not a new title.
  //     A single undated line directly after a titleless start is the title.
  function splitBlockEntries(block) {
    const bulletCount = block.filter((l) => BULLET_RE.test(l)).length;
    const dateCount = block.filter((l) => !BULLET_RE.test(l) && DATE_TOKEN_RE.test(l)).length;
    if (bulletCount === 0 && dateCount <= 1) {
      // A single entry. The first line is the title; any date/location line stays
      // in the heading; every other (prose) line becomes a duty so weak resumes
      // that describe a role in plain sentences don't lose that content.
      const heading = [];
      const bullets = [];
      block.forEach((l, idx) => {
        if (idx === 0 || DATE_TOKEN_RE.test(l) || LOCATION_RE.test(l)) heading.push(l);
        else bullets.push(l);
      });
      return [{ heading, bullets }];
    }
    const entries = [];
    let cur = null;
    const flush = () => { if (cur && (cur.heading.length || cur.bullets.length)) entries.push(cur); cur = null; };
    for (const line of block) {
      if (BULLET_RE.test(line)) {
        if (!cur) cur = { heading: [], bullets: [], headingHasDate: false };
        cur.bullets.push(line.replace(BULLET_RE, ""));
        continue;
      }
      const hasDate = DATE_TOKEN_RE.test(line);
      if (!cur) { cur = { heading: [line], bullets: [], headingHasDate: hasDate }; continue; }
      if (hasDate) {
        const closed = cur.bullets.length > 0 || cur.headingHasDate;
        if (closed) { flush(); cur = { heading: [line], bullets: [], headingHasDate: true }; }
        else { cur.heading.push(line); cur.headingHasDate = true; } // date line completing the header
      } else if (cur.heading.length === 0 && !cur.headingHasDate) {
        cur.heading.push(line); // first heading line (block opened on a bullet)
      } else {
        cur.bullets.push(line); // undated prose after the heading → a duty
      }
    }
    flush();
    return entries;
  }

  function parseEntryBlocks(lines) {
    const blocks = groupByBlankLine(lines);
    const entries = [];
    for (const block of blocks) entries.push(...splitBlockEntries(block));

    return entries.map((b) => {
      const headingJoined = b.heading.join(" | ");
      const date = (headingJoined.match(DATE_RANGE_RE) || [""])[0];
      const location = (headingJoined.match(LOCATION_RE) || [""])[0];
      let title = b.heading[0] || "";
      // strip date(s) and location from the title line, then trim leftover
      // separators/commas from both ends
      title = title
        .replace(new RegExp(DATE_RANGE_RE.source, "ig"), "")
        .replace(LOCATION_RE, "")
        .replace(/^[\s,|–—\-]+|[\s,|–—\-]+$/g, "")
        .trim();
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

  return {
    parseResumeText,
    isUnknownHeading,
    suggestDestination,
    parseSkills,
    parseEntryBlocks,
    SECTION_PATTERNS,
    OTHER_SECTION_WORDS,
    BULLET_RE,
    LOCATION_RE,
  };
});
