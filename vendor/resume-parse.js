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
  const LOCATION_RE = /[A-Z][a-zA-Z.\s]+,\s*[A-Z]{2}(?:\s+\d{5})?/;
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

  function parseEducationBlocks(lines) {
    const blocks = groupByBlankLine(lines);
    return blocks.map((block) => {
      const dateLine = block.find((l) => DATE_TOKEN_RE.test(l)) || "";
      const degreeLine = block.find((l) => l !== dateLine && /(associate|bachelor|master|ph\.?d|degree|diploma|certificate|major|minor|gpa)/i.test(l)) || "";
      let school = block.find((l) => l !== degreeLine && l !== dateLine) || block[0] || "";
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

    return blocks.map((b) => {
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

  return {
    parseResumeText,
    isUnknownHeading,
    suggestDestination,
    parseSkills,
    parseEntryBlocks,
    SECTION_PATTERNS,
    OTHER_SECTION_WORDS,
    BULLET_RE,
  };
});
