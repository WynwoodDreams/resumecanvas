// Tests for js/factcheck.js: assisted rewrites must not add claims the
// user never made. Run: node tests/factcheck.test.js (part of `npm test`).

const F = require("../js/factcheck.js");

// [candidate, source, expected flag texts (lower-case), note]
const CASES = [
  // Clean rewrites: same facts, better wording.
  ["Processed cash and card payments during busy shifts", "responsible for processing cash and card payments when it was busy", [], "pure rewording"],
  ["Greeted visitors and answered phones at the front desk", "I greeted visitors and answered the phones at front desk", [], "same facts"],
  ["Trained 5 new cashiers", "trained five new cashiers", [], "number word ↔ digit"],
  ["Served about 200 customers per shift", "helped around 200 customers each shift", [], "number kept"],
  ["Managed the store's social media", "in charge of social media, management liked it", [], "stem of management legitimises managed"],
  ["Used Excel and Canva to build flyers", "made flyers in excel and canva", [], "tools present (case-insensitive)"],
  ["Worked June 2021 to Present", "worked june 2021 to now", [], "months and Present are not names"],
  ["Cut wait times by 15%", "cut wait times by about 15 percent, 15%", [], "percent kept"],

  // Inflation the checker must catch.
  ["Increased sales by 20%", "helped with sales", ["increased", "20%"], "invented metric + scope"],
  ["Led a team of 10 cashiers", "worked with other cashiers", ["led", "10", "team of"], "invented leadership + size"],
  ["Supervised front desk operations", "worked the front desk", ["supervised"], "role inflated"],
  ["Generated $50k in revenue", "sold tickets", ["generated", "$50k", "revenue"], "invented money"],
  ["Built dashboards in Tableau and SQL", "built reports in excel", ["tableau", "sql"], "invented tools"],
  ["Spearheaded a company-wide initiative", "helped with a project", ["spearheaded", "company-wide"], "inflated scope"],
  ["Doubled social media followers", "posted on social media", ["doubled"], "number word claim"],
  ["Earned Employee of the Month at Target", "worked at target as a cashier", ["employee", "month"], "invented award names"],
];

let failures = 0;
for (const [cand, src, expected, note] of CASES) {
  const got = F.checkClaims(cand, src).map((f) => f.text.toLowerCase());
  const missing = expected.filter((e) => !got.includes(e));
  const extra = got.filter((g) => !expected.includes(g));
  if (missing.length || extra.length) {
    failures++;
    console.error(`✗ ${note}: “${cand}”\n    missing ${JSON.stringify(missing)} extra ${JSON.stringify(extra)}`);
  }
}
if (F.describeFlags([]) !== "") { failures++; console.error("✗ describeFlags([]) should be empty"); }
if (!/Not in your own words: 20%, led/.test(F.describeFlags([{ text: "20%" }, { text: "led" }]))) { failures++; console.error("✗ describeFlags format"); }

if (failures) { console.error(`\n${failures} fact-check case(s) failed`); process.exit(1); }
console.log(`Fact check: ${CASES.length} cases passed`);
