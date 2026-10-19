// Routing tests for spoken/typed edit commands (js/commands.js).
// Each phrase must resolve to the expected section and entry — or ask —
// and every applied command must leave every other section untouched.
// Run: node tests/commands.test.js   (also part of `npm test`)

const assert = require("assert");
const C = require("../js/commands.js");

const fixture = () => ({
  name: "Jane Doe", professional_title: "Business Student", location: "North Miami, FL", phone: "786-121-1112",
  email: "jane@example.com", linkedin: "linkedin.com/in/jane",
  contact_line1: "North Miami, FL | 786-121-1112", contact_line2: "jane@example.com | linkedin.com/in/jane",
  summary: "Business student with front desk experience.",
  skills_categories: [{ label: "Technical", content: "Excel, Canva" }],
  skills_two_column: [{ left: "Excel", right: "Canva" }],
  skills_inline: "Excel │ Canva",
  certifications: ["Microsoft Office Specialist: Excel Associate"],
  custom_sections: [{ title: "Volunteer Experience", bullets: ["Food drive organizer"] }],
  education: [
    { school: "Miami Dade College", city: "Miami, FL", degree: "Associate in Arts, Business", date: "Expected May 2027", coursework: "" },
    { school: "North Miami Senior High School", city: "North Miami, FL", degree: "High School Diploma", date: "June 2023", coursework: "" },
  ],
  projects: [{ title: "Shark Cast Podcast", date: "2025 – Present", location: "Miami, FL", bullets: ["Co-host episodes"] }],
  experience: [
    { title: "North Miami Senior High School — Office Staff", date: "2023 – 2024", location: "North Miami, FL", company_city: "", bullets: ["Filed records", "Greeted visitors"] },
    { title: "Star Event Planning — Sales Lead", date: "2022 – 2023", location: "Miami, FL", company_city: "", bullets: ["Led sales"] },
    { title: "Sunset Groceries — Cashier", date: "2021 – 2022", location: "North Miami, FL", company_city: "", bullets: ["Ran the register"] },
  ],
  template: "demo_4", font_family: "times", section_enabled: { summary: true, projects: true, experience: true },
});

// [phrase, expected, ctx?]
//   expected: { status, action, section, index, field, value, values, bulletIndex, options }
const CASES = [
  // ── Skills never touch anything else
  ["add Python to my skills", { action: "add_skills", section: "skills", values: ["Python"] }],
  ["add python and sql to my skills", { action: "add_skills", section: "skills", values: ["Python", "Sql"] }],
  ["can you please add Power BI to the skills section", { action: "add_skills", section: "skills", values: ["Power BI"] }],
  ["add a skill: public speaking", { action: "add_skills", section: "skills", values: ["Public Speaking"] }],
  ["add skills Tableau, Figma", { action: "add_skills", section: "skills", values: ["Tableau", "Figma"] }],
  ["remove Canva from my skills", { action: "remove_skills", section: "skills", values: ["Canva"] }],
  ["delete the skill excel", { action: "remove_skills", section: "skills", values: ["Excel"] }],
  ["in skills, add customer service", { action: "add_skills", section: "skills", values: ["Customer Service"] }],
  ["add Adobe Photoshop to my skill set", { action: "add_skills", section: "skills", values: ["Adobe Photoshop"] }],

  // ── Summary
  ["change my summary to Motivated business student seeking a marketing internship", { action: "set_summary", section: "summary", value: "Motivated business student seeking a marketing internship" }],
  ["update the profile to hardworking and detail oriented", { action: "set_summary", section: "summary", value: "Hardworking and detail oriented" }],
  ["my summary should say bilingual customer service pro", { action: "set_summary", section: "summary", value: "Bilingual customer service pro" }],
  ["add to my summary that I speak Spanish", { action: "append_summary", section: "summary", value: "I speak Spanish" }],
  ["rewrite my about me as eager to learn", { action: "set_summary", section: "summary", value: "Eager to learn" }],

  // ── Education vs experience: the collision case
  ["change the date for north miami senior high school to 2019 to 2023", { status: "choose" }],
  ["change the date for my north miami high school job to august 2023 to july 2024", { action: "set_field", section: "experience", index: 0, field: "date", value: "August 2023 – July 2024" }],
  ["in education change the date for north miami senior high school to june 2022", { action: "set_field", section: "education", index: 1, field: "date", value: "June 2022" }],
  ["change the graduation date for north miami high school to may 2023", { action: "set_field", section: "education", index: 1, field: "date", value: "May 2023" }],
  ["change the degree for north miami high school to diploma with honors", { action: "set_field", section: "education", index: 1, field: "degree", value: "Diploma with Honors" }],
  ["change the date for north miami senior high school to 2019 to 2023", { action: "set_field", section: "education", index: 1, field: "date" }, { section: "education", index: 1 }],
  ["change the date for my north miami school to 2023 under education", { action: "set_field", section: "education", index: 1 }],

  // ── Entry fields
  ["change the date for sunset groceries to june 2021 to present", { action: "set_field", section: "experience", index: 2, field: "date", value: "June 2021 – Present" }],
  ["update the title of star event planning to Sales Lead and Event Coordinator", { action: "set_field", section: "experience", index: 1, field: "title", value: "Sales Lead and Event Coordinator" }],
  ["change sunset grocery's location to miami gardens fl", { action: "set_field", section: "experience", index: 2, field: "location", value: "Miami Gardens Fl" }],
  ["change the school for miami dade to Miami Dade College North Campus", { action: "set_field", section: "education", index: 0, field: "school", value: "Miami Dade College North Campus" }],
  ["change the date for miami dade college to expected december 2026", { action: "set_field", section: "education", index: 0, field: "date", value: "Expected December 2026" }],
  ["change the degree for miami dade to associate in science", { action: "set_field", section: "education", index: 0, field: "degree", value: "Associate in Science" }],
  ["change the date for shark cast to 2024 to now", { action: "set_field", section: "projects", index: 0, field: "date", value: "2024 – Present" }],
  ["rename shark cast podcast to The Shark Cast", { action: "set_field", section: "projects", index: 0, field: "title", value: "The Shark Cast" }],
  ["rename miami dade college to MDC", { action: "set_field", section: "education", index: 0, field: "school", value: "MDC" }],
  ["change the date for my first job to 2023 to 2025", { action: "set_field", section: "experience", index: 0, field: "date", value: "2023 – 2025" }],
  ["change the date for my last job to 2020 to 2022", { action: "set_field", section: "experience", index: 2, field: "date" }],
  ["change the date to march 2024", { action: "set_field", section: "experience", index: 1, field: "date", value: "March 2024" }, { section: "experience", index: 1 }],
  ["change the date to march 2024", { status: "error" }],
  ["change the role for miami dade to student", { status: "error" }],

  // ── Bullets
  ["add a bullet to sunset groceries saying trained five new cashiers", { action: "add_bullet", section: "experience", index: 2, value: "Trained five new cashiers" }],
  ["add a bullet to sunset groceries trained five new cashiers", { action: "add_bullet", section: "experience", index: 2, value: "Trained five new cashiers" }],
  ["add bullet to star event planning: closed 20 contracts in one quarter.", { action: "add_bullet", section: "experience", index: 1, value: "Closed 20 contracts in one quarter" }],
  ["add another point under shark cast saying booked 12 guests", { action: "add_bullet", section: "projects", index: 0, value: "Booked 12 guests" }],
  ["add a bullet to volunteer experience saying led 30 volunteers", { action: "add_bullet", section: "custom", index: 0, value: "Led 30 volunteers" }],
  ["add a bullet saying handled cash deposits", { action: "add_bullet", section: "experience", index: 2, value: "Handled cash deposits" }, { section: "experience", index: 2 }],
  ["remove the last bullet from my north miami job", { action: "remove_bullet", section: "experience", index: 0, bulletIndex: 1 }],
  ["delete the first bullet from star event planning", { action: "remove_bullet", section: "experience", index: 1, bulletIndex: 0 }],
  ["remove the fifth bullet from sunset groceries", { status: "error" }],
  ["add a bullet to miami dade college saying deans list", { status: "error" }],

  // ── Contact
  ["change my phone number to 305 555 0100", { action: "set_contact", section: "header", field: "phone", value: "305 555 0100" }],
  ["update my email to jane dot doe at gmail dot com", { action: "set_contact", section: "header", field: "email", value: "jane.doe@gmail.com" }],
  ["change my name to jane marie doe", { action: "set_contact", section: "header", field: "name", value: "Jane Marie Doe" }],
  ["set my location to fort lauderdale fl", { action: "set_contact", section: "header", field: "location", value: "Fort Lauderdale Fl" }],

  // ── New / removed entries
  ["add a job as barista at starbucks", { action: "add_entry", section: "experience", value: "Barista at Starbucks" }],
  ["add a new school florida international university", { action: "add_entry", section: "education", value: "Florida International University" }],
  ["add a project called budget tracker app", { action: "add_entry", section: "projects", value: "Budget Tracker App" }],
  ["add a section called languages", { action: "add_entry", section: "custom", value: "Languages" }],
  ["add a certification: google analytics", { action: "add_cert", section: "certs", value: "Google Analytics" }],
  ["remove the certification excel associate", { action: "remove_cert", section: "certs", index: 0 }],
  ["delete sunset groceries", { action: "remove_entry", section: "experience", index: 2 }],
  ["remove shark cast", { action: "remove_entry", section: "projects", index: 0 }],
  ["delete costco", { status: "error" }],

  // ── Control words
  ["undo", { status: "undo" }],
  ["scratch that", { status: "undo" }],
  ["yes", { status: "confirm" }],
  ["go ahead", { status: "confirm" }],
  ["cancel", { status: "cancel" }],
  ["never mind", { status: "cancel" }],
  ["", { status: "error" }],
  ["make it pop", { status: "error" }],
];

let failures = 0;
const check = (cond, msg) => { if (!cond) { failures++; console.error("✗ " + msg); } };

for (const [phrase, exp, ctx] of CASES) {
  const st = fixture();
  const r = C.parseCommand(phrase, st, ctx || null);
  const status = exp.status || "ok";
  const label = `“${phrase}”${ctx ? ` (ctx ${ctx.section}#${ctx.index})` : ""}`;
  if (r.status !== status) { check(false, `${label}: status ${r.status} (${r.message || ""}), expected ${status}`); continue; }
  if (status !== "ok") continue;
  const cmd = r.cmd;
  for (const k of ["action", "section", "index", "field", "value", "bulletIndex"]) {
    if (exp[k] !== undefined) check(cmd[k] === exp[k], `${label}: ${k} = ${JSON.stringify(cmd[k])}, expected ${JSON.stringify(exp[k])}`);
  }
  if (exp.values) check(JSON.stringify(cmd.values) === JSON.stringify(exp.values), `${label}: values = ${JSON.stringify(cmd.values)}, expected ${JSON.stringify(exp.values)}`);

  // Every parsed command must apply cleanly, touch only its section, and be
  // fully reversible through its undo record.
  let res;
  try { res = C.applyCommand(st, cmd); } catch (e) { check(false, `${label}: apply threw ${e.message}`); continue; }
  const allowed = C.SECTION_KEYS[cmd.section];
  for (const k of Object.keys(st)) {
    if (!allowed.includes(k)) check(JSON.stringify(st[k]) === JSON.stringify(res.state[k]), `${label}: changed ${k} outside ${cmd.section}`);
  }
  check(JSON.stringify(st) !== JSON.stringify(res.state), `${label}: applied but nothing changed`);
  const restored = Object.assign({}, res.state, res.undo.before);
  check(JSON.stringify(restored) === JSON.stringify(st), `${label}: undo did not restore the original`);
  const d = C.describeCommand(st, cmd);
  check(d && d.where && d.verb, `${label}: no preview description`);
}

// Ambiguity offers both sections, each fully resolved.
{
  const r = C.parseCommand("change the date for north miami senior high school to 2019 to 2023", fixture());
  const secs = (r.options || []).map((o) => o.section).sort();
  check(JSON.stringify(secs) === JSON.stringify(["education", "experience"]), `collision options = ${JSON.stringify(secs)}`);
}

// The lock holds even if a command is malformed to reach outside its section.
{
  const st = fixture();
  assert.throws(() => C.applyCommand(st, { action: "set_contact", section: "skills", field: "phone", value: "x" }), /SECTION_LOCK/);
  assert.throws(() => C.applyCommand(st, { action: "set_summary", section: "education", value: "x" }), /SECTION_LOCK/);
}

// Adding a skill that already exists is refused instead of duplicating it.
assert.throws(() => C.applyCommand(fixture(), { action: "add_skills", section: "skills", values: ["excel"] }), /already/);

if (failures) {
  console.error(`\n${failures} command routing check(s) failed`);
  process.exit(1);
}
console.log(`Command routing: ${CASES.length} phrases passed`);
