// ─────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────

let state = {
  template: "demo_4",
  font_pt: null, // null = use template default (12pt for D4, 11pt for D2). Manual override via font chips.
  font_family: "times", // global typeface: times | arial | calibri
  voice_profile: "", // session-only spoken intro used to flavor the resume's tone; never persisted
  section_enabled: { summary: true, projects: true, experience: true },
  section_order: {
    demo_4: ["education", "skills", "projects", "experience"],
    demo_2: ["skills", "education", "certs", "projects", "experience"],
    demo_1: ["skills", "education", "projects", "experience"],
    demo_5: ["education", "experience", "skills"],
    demo_6: ["skills", "education", "experience"],
    demo_8: ["skills", "education", "projects", "experience"],
  },
  match: { on: false, jd: "" },
  // Demo 4 header
  name: "Jane Doe",
  professional_title: "Business Administration Student",
  location: "North Miami, FL 33161",
  phone: "786-121-1112",
  email: "lurlene.carry001@mymdc.net",
  linkedin: "Linkedin.com/",
  links: [],
  // Demo 2 header
  contact_line1: "Miami, FL | (305) 555-1234",
  contact_line2: "JohnDoe123@gmail.com | LinkedIn.com/in/johndoe",
  // Both
  summary: "Business Administration student at Miami Dade College with hands-on experience in administrative operations, sales, and team coordination. Seeking internship opportunities in project management, human resources, marketing, logistics, or general management.",
  education: [
    {
      school: "Miami Dade College",
      city: "Miami, FL",
      degree: "Associate in Arts, Business | GPA: 3.5",
      date: "Expected: May 2027",
      // Demo 2 extras
      subline_bold: "",
      subline_rest: "",
      coursework: "",
      // Demo 8 extra
      certifications: "",
    },
  ],
  // Demo 4 skills
  skills_categories: [
    { label: "Technical", content: "Google Sheets, Microsoft Word, Microsoft Excel, Canva, Procreate, PDF Formatting Tools, Social Media Management, Google Workspace" },
    { label: "Administrative", content: "Data Entry, Records Management, Scheduling & Calendar Management, Document Preparation, Front Desk Operations, Event Coordination" },
    { label: "Professional", content: "Customer Service, Team Communication, Outreach & Relationship Building, Content Research, Vendor & Client Coordination" },
    { label: "Language", content: "English (Fluent), Haitian Creole (Intermediate)" },
  ],
  // Demo 2 skills
  skills_two_column: [
    { left: "Customer Service", right: "Time Management" },
    { left: "Microsoft Office Suite", right: "Team Collaboration" },
    { left: "Data Entry", right: "Problem Solving" },
    { left: "Social Media Management", right: "Event Coordination" },
    { left: "Bilingual: English & Haitian Creole", right: "Adaptable" },
  ],
  // Demo 5 skills (single pipe-separated line)
  skills_inline: "Customer Service │ Microsoft Office Suite │ Data Entry │ Social Media Management │ Time Management │ Team Collaboration │ Problem Solving │ Event Coordination │ Bilingual: English & Haitian Creole │ Adaptable",
  certifications: [
    "Google Digital Marketing & E-commerce Certificate (In Progress) — Coursera",
    "Microsoft Office Specialist: Excel Associate — Certiport (2024)",
  ],
  // Both
  projects: [
    {
      title: "Shark Cast — Co-Host & Outreach Team Lead",
      date: "November 2025 – Present",
      location: "Miami, FL",
      bullets: [
        "Co-host and produce podcast episodes covering business, marketing, and entrepreneurship topics",
        "Lead outreach strategy by coordinating a small team, assigning weekly tasks, and managing guest communications",
        "Research and develop engaging content to grow listener base and foster community engagement",
        "Build partnerships with community members and organizations by scheduling appearances aligned with podcast themes",
      ],
    },
  ],
  experience: [
    {
      title: "North Miami Senior High School — Office Staff",
      date: "August 2023 – July 2024",
      location: "North Miami, FL",
      company_city: "",
      bullets: [
        "Provided administrative support including filing, data entry, and document preparation for school staff",
        "Managed front desk operations, greeting visitors and directing inquiries to appropriate personnel",
        "Coordinated communication between students, parents, and faculty regarding school events and schedules",
        "Assisted with organizing school events and maintaining accurate student records",
      ],
    },
    {
      title: "Star Event Planning Company — Sales Lead",
      date: "August 2022 – April 2023",
      location: "Miami, FL",
      company_city: "",
      bullets: [
        "Led sales initiatives and client acquisition, consistently meeting and exceeding monthly targets",
        "Managed client relationships from initial consultation through event execution, ensuring high satisfaction",
        "Coordinated with event planning team to deliver customized solutions tailored to client needs and budgets",
      ],
    },
  ],
};

// Snapshot of the default state so RESET can restore it byte-for-byte
// even after the user has mutated `state` in place.
const _DEFAULT_STATE_JSON = JSON.stringify(state);

// ─────────────────────────────────────────────────────────
// PER-TEMPLATE DEMO CONTENT
// Each template carries its own demo resume. Selecting a template while the
// current resume is still an untouched demo swaps in THAT template's demo;
// once the user imports or types anything, switching only re-lays-out their
// real data (see the #tpl-dropdown handler). demo_1/2/4/6 share the MDC sample;
// demo_5 (Mass Communications) and demo_8 (Criminal Justice) carry their own.
// ─────────────────────────────────────────────────────────
const DEMO_CONTENT_KEYS = [
  "name", "professional_title", "location", "phone", "email", "linkedin", "links",
  "contact_line1", "contact_line2", "summary", "education", "skills_categories",
  "skills_two_column", "skills_inline", "certifications", "projects", "experience",
];

// A stable fingerprint of just the resume *content* (ignores template, fonts,
// match/voice transients) so we can tell an untouched demo from edited data.
function demoSignature(s) {
  return JSON.stringify(DEMO_CONTENT_KEYS.map((k) => s[k]));
}

const DEMO_SEEDS = (function buildDemoSeeds() {
  const fresh = (tpl) => Object.assign(JSON.parse(_DEFAULT_STATE_JSON), { template: tpl });
  const seeds = {};
  ["demo_1", "demo_2", "demo_4", "demo_6"].forEach((tpl) => { seeds[tpl] = fresh(tpl); });

  seeds.demo_5 = Object.assign(fresh("demo_5"), {
    name: "Jane Doe",
    contact_line1: "Miami, FL | (786) 438-7871 | JD@gmail.com",
    contact_line2: "Linkedin.com",
    summary: "Mass Communications student at Miami Dade College combining journalism, civic engagement, and design skills to support urban planning and community-focused initiatives. Trilingual communicator with hands-on experience in concept design, 3D modeling, and media outreach, plus a strong service background built across hospitality, retail, and education environments.",
    education: [{
      school: "Miami Dade College", city: "Miami, FL",
      degree: "Associate in Arts, Mass Communications", date: "Expected 2026",
      coursework: "journalism, civic engagement, and urban planning",
      subline_bold: "", subline_rest: "", certifications: "",
    }],
    skills_categories: [
      { label: "Design & Software", content: "Adobe Creative Suite, Rhino (3D modeling), Canva, Microsoft Office, Google Workspace" },
      { label: "Communications", content: "Media outreach, content creation, social media, public speaking, documentation, research" },
      { label: "Operations", content: "Event planning, scheduling, customer service, cash handling, front-desk operations" },
      { label: "Languages", content: "English (fluent), Spanish (expert), French (intermediate)" },
    ],
    projects: [],
    certifications: [],
    experience: [
      { title: "Intern", company_city: "The Blue House | Miami, FL", location: "", date: "January 2026 – Present", bullets: [
        "Support an urban planning project from concept through documentation, contributing to community-focused design work",
        "Create concept designs and 3D models using Adobe Creative Suite and Rhino",
        "Lead media outreach to communicate project goals and updates to broader audiences",
        "Document project progress and prepare materials for internal and external stakeholders",
      ] },
      { title: "Jewelry Sales Associate", company_city: "A&R Jewelry | Miami, FL", location: "", date: "August 2025 – Present", bullets: [
        "Create and sell custom jewelry, including permanent welded pieces, while upselling charms and accessories to increase per-customer revenue",
        "Manage high-volume customer interactions during in-store events, markets, and private parties",
        "Support birthday parties and special events, engaging guests of all ages to deliver a memorable experience",
        "Prepare jewelry samples and maintain a clean, inviting workspace",
      ] },
      { title: "Cashier / Customer Service", company_city: "Food Palace | Miami, FL", location: "", date: "August 2024 – October 2025", bullets: [
        "Operated cash register and processed customer orders accurately in a fast-paced environment",
        "Collaborated with team members through clear communication to maintain smooth daily operations",
        "Handled high-volume and challenging interactions with patience and attentive service",
      ] },
      { title: "Hostess / Server", company_city: "Sushi World | Miami, FL", location: "", date: "February 2023 – June 2025", bullets: [
        "Greeted and seated guests, delivering a welcoming first impression during peak hours",
        "Served food, drinks, and alcoholic beverages responsibly in line with safety standards",
        "Maintained calm and efficient service during high-volume shifts and completed thorough closing duties",
      ] },
    ],
  });

  seeds.demo_8 = Object.assign(fresh("demo_8"), {
    name: "Jane Doe",
    contact_line1: "Miami, FL 33132 | (305) 987-6543 | jdoe@student.mdc.edu | LinkedIn.com/in/janedoe",
    contact_line2: "",
    summary: "Miami Dade College Criminal Justice student with hands-on experience in security operations, access control, and administrative support. Committed to public safety, conflict de-escalation, and professional conduct. Seeking to apply law enforcement knowledge and field experience toward a career in criminal justice or public service.",
    skills_two_column: [
      { left: "Patrol & Access Control", right: "Incident Documentation & Reporting" },
      { left: "Conflict De-escalation", right: "Microsoft Office Suite" },
      { left: "Criminal Law & Procedure", right: "Bilingual: English & Spanish" },
      { left: "Emergency Response Protocols", right: "Customer & Client Relations" },
      { left: "Surveillance & Monitoring", right: "Data Entry & Records Management" },
    ],
    education: [{
      school: "Miami Dade College – The Honors College", city: "Miami, FL",
      degree: "Associate in Science, Criminal Justice | GPA: 3.75", date: "Expected Spring 2026",
      coursework: "Introduction to Criminal Justice, Criminal Law, Criminology, Juvenile Justice, Correctional Systems",
      subline_bold: "", subline_rest: "", certifications: "",
    }],
    projects: [
      { title: "Criminal Justice Club – Miami Dade College", date: "August 2024 – Present", location: "", bullets: [
        "Attend bi-weekly meetings to discuss current events in law enforcement, criminal policy reform, and legal procedure",
        "Participated in mock trial simulation organized by MDC faculty, applying knowledge of courtroom procedure and criminal law",
        "Volunteered at MDC's annual Public Safety Career Fair, connecting students with internship and employment opportunities in law enforcement",
      ] },
      { title: "Phi Theta Kappa Honor Society – Beta Theta Tau Chapter", date: "January 2024 – Present", location: "", bullets: [
        "Inducted based on academic achievement; maintain qualifying GPA while completing full-time coursework and employment",
        "Participated in community service initiatives including food drives and neighborhood outreach events in the Miami-Dade area",
      ] },
    ],
    certifications: [],
    experience: [
      { title: "Security Officer", company_city: "Secure 1st Protection Services | Miami, FL", location: "", date: "June 2023 – Present", bullets: [
        "Monitor 3 commercial properties across rotating shifts, conducting foot patrols and access point checks to deter unauthorized entry",
        "Respond to and document security incidents, preparing detailed written reports submitted to site supervisors and property management",
        "Enforce facility policies and coordinate with local law enforcement on 4+ reported incidents over a 12-month period",
        "De-escalate confrontational situations involving visitors and tenants, maintaining composure and adherence to post orders",
      ] },
      { title: "Office Assistant", company_city: "Coastal Realty Group | Doral, FL", location: "", date: "August 2022 – May 2023", bullets: [
        "Supported a 6-person administrative team with scheduling, correspondence, and data entry for 50+ active property listings",
        "Managed front-desk operations including client intake, phone routing, and document processing using Microsoft Office Suite",
      ] },
    ],
  });

  return seeds;
})();

// True when the live resume is still exactly one of the demos (so a template
// switch should load the next template's demo rather than relayout user data).
function currentDemoIsPristine() {
  const seed = DEMO_SEEDS[state.template];
  return !!seed && demoSignature(state) === demoSignature(seed);
}

// ─────────────────────────────────────────────────────────
// TEMPLATE CONFIG
// Per-template rendering choices. demo_4 keeps its own structured header
// path; demo_2/demo_1/demo_5 share the free-form contact-line header but
// diverge in skills layout, education layout, project layout, section
// header casing, and type sizing.
// ─────────────────────────────────────────────────────────

const TEMPLATES = {
  demo_4: {
    layout: "single", header: "structured", headerCase: "plain", skillsMode: "categories", eduMode: "demo4",
    projMode: "dated", expMode: "italic", certs: false,
    namePt: 20, sectionPt: 12, bodyPt: 12,
    name: "Categorical", desc: "Single column · 12pt body · skills as labeled categories. Good for broad skill profiles.",
    labels: { summary: "PROFILE SUMMARY", skills: "SKILLS", education: "EDUCATION", projects: "PROJECTS", experience: "WORK EXPERIENCE", certs: "CERTIFICATIONS" },
  },
  demo_2: {
    layout: "single", header: "lines", headerCase: "smallcaps", skillsMode: "two_column", eduMode: "demo2",
    projMode: "bullets", expMode: "company", certs: true,
    namePt: 16, sectionPt: 11, bodyPt: 11,
    name: "Two-Column Skills", desc: "Single column · smallCaps headers · two-column skill grid · certifications. Dense layout for technical hires.",
    labels: { summary: "PROFILE SUMMARY", skills: "HIGHLIGHTED SKILLS", education: "EDUCATION", projects: "PROJECTS", experience: "WORK EXPERIENCE", certs: "CERTIFICATIONS" },
  },
  demo_1: {
    layout: "single", header: "lines", headerCase: "title", skillsMode: "two_column", eduMode: "demo1",
    projMode: "paragraph", expMode: "company", certs: false,
    namePt: 18, sectionPt: 12, bodyPt: 11,
    name: "Highlighted Skills", desc: "Single column · title-case headers · bulleted skills · paragraph projects. Good for AI / data students.",
    labels: { summary: "Profile Summary", skills: "Highlighted Skills", education: "Education", projects: "Projects", experience: "Work Experience", certs: "Certifications" },
  },
  demo_5: {
    layout: "single", header: "lines", headerCase: "smallcaps", skillsMode: "categories", eduMode: "demo2",
    projMode: "dated", expMode: "company_first", certs: false,
    namePt: 16, sectionPt: 11, bodyPt: 11,
    name: "Mass Communications", desc: "Single column · smallCaps headers · summary, education, company-led experience, then categorized skills. Good for communications / media / design students.",
    labels: { summary: "SUMMARY", skills: "SKILLS", education: "EDUCATION", projects: "PROJECTS", experience: "PROFESSIONAL EXPERIENCE", certs: "CERTIFICATIONS" },
  },
  demo_6: {
    layout: "sidebar", header: "structured", headerCase: "smallcaps", skillsMode: "list", eduMode: "demo6",
    projMode: "none", expMode: "company_first", certs: false,
    namePt: 22, sectionPt: 11, bodyPt: 10,
    name: "Sidebar", desc: "Two columns · left sidebar holds contact, education, key skills · main column for about me and career highlights. Modern, design-forward.",
    labels: { summary: "ABOUT ME", skills: "KEY SKILLS", education: "EDUCATION", experience: "CAREER HIGHLIGHTS", contact: "CONTACT", certs: "CERTIFICATIONS" },
  },
  demo_8: {
    layout: "single", header: "lines", headerCase: "smallcaps", skillsMode: "two_column", eduMode: "demo2",
    projMode: "dated", expMode: "company", certs: false,
    namePt: 17, sectionPt: 11, bodyPt: 11,
    name: "Criminal Justice", desc: "Single column · smallCaps headers · highlighted two-column skills · campus involvement + work experience. Good for criminal justice / public-service students.",
    labels: { summary: "PROFILE SUMMARY", skills: "HIGHLIGHTED SKILLS", education: "EDUCATION", projects: "CAMPUS INVOLVEMENT & ACTIVITIES", experience: "WORK EXPERIENCE", certs: "CERTIFICATIONS" },
  },
};

const TEMPLATE_ORDER = ["demo_1", "demo_2", "demo_4", "demo_5", "demo_6", "demo_8"];

// Global typeface choice. `css` is the font stack used in the preview + .doc
// export; `pdf` is the base-14 family the PDF writer maps Times-* names onto
// (Calibri isn't a base-14 font, so it renders as Helvetica in the PDF).
const FONT_FAMILIES = {
  times:   { label: "Times New Roman", css: '"Times New Roman", Times, serif', pdf: "Times" },
  arial:   { label: "Arial", css: 'Arial, "Helvetica Neue", Helvetica, sans-serif', pdf: "Helvetica" },
  calibri: { label: "Calibri", css: 'Calibri, "Segoe UI", "Helvetica Neue", Arial, sans-serif', pdf: "Helvetica" },
};
function fontFamilyKey() { return FONT_FAMILIES[state.font_family] ? state.font_family : "times"; }

function tcfg(tpl) { return TEMPLATES[tpl || state.template] || TEMPLATES.demo_4; }
function tplBodyDefault(tpl) { return tcfg(tpl).bodyPt; }

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const HTML_ENTITY_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
};

function esc(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, (ch) => HTML_ENTITY_MAP[ch]);
}

const LINKIFY_RE = /([\w.+-]+@[\w-]+\.[\w.-]+)|((?:https?:\/\/|www\.)[^\s<>"'|,;)]+)|((?:[a-z0-9-]+\.)+(?:com|net|org|io|dev|me|co|app|ai|tech|xyz|edu|gov|info|us|uk|ca)(?:\/[^\s<>"'|,;)]*)?)/gi;

function linkify(s) {
  if (s == null) return "";
  const text = String(s);
  let out = "";
  let lastIdx = 0;
  let m;
  LINKIFY_RE.lastIndex = 0;
  while ((m = LINKIFY_RE.exec(text)) !== null) {
    out += esc(text.slice(lastIdx, m.index));
    let matched = m[0];
    let trailing = "";
    const t = matched.match(/[.,;:!?)\]]+$/);
    if (t) { trailing = t[0]; matched = matched.slice(0, -trailing.length); }
    let href;
    if (m[1]) href = `mailto:${matched}`;
    else if (m[2]) href = matched.toLowerCase().startsWith("http") ? matched : `https://${matched}`;
    else href = `https://${matched}`;
    out += `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="preview-link">${esc(matched)}</a>${esc(trailing)}`;
    lastIdx = m.index + m[0].length;
  }
  out += esc(text.slice(lastIdx));
  return out;
}

function setCaseId() {
  if (!state.name) { $("#caseId").textContent = "———"; return; }
  const initials = state.name.split(/\s+/).filter(Boolean).map(s => s[0]).join("").toUpperCase().slice(0, 3);
  const tpl = state.template.replace("_", "").toUpperCase();
  $("#caseId").textContent = `${initials}-${tpl}-${new Date().getFullYear().toString().slice(2)}`;
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1500);
}

// ─────────────────────────────────────────────────────────
// RENDER FORM
// ─────────────────────────────────────────────────────────

function renderHeader() {
  const body = $("#body-header");
  if (tcfg().header === "structured") {
    const titleRow = state.template === "demo_6"
      ? `<div class="row"><label>PROFESSIONAL TITLE</label><input type="text" data-bind="professional_title" value="${esc(state.professional_title || "")}" placeholder="e.g. Marketing Student"><div class="help">Shown under the name in the sidebar header.</div></div>`
      : "";
    const linkItems = state.links.map((url, i) => `
      <div class="item">
        <div class="item-head">
          <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> LINK</div>
          <button class="icon-btn" data-action="removeLink" data-index="${i}">REMOVE</button>
        </div>
        <input type="text" data-link="${i}" value="${esc(url)}" placeholder="github.com/yourname">
      </div>
    `).join("");
    body.innerHTML = `
      <div class="row"><label>FULL NAME</label><input type="text" class="required" data-bind="name" value="${esc(state.name)}" placeholder="Full name"></div>
      ${titleRow}
      <div class="row two">
        <div><label>LOCATION</label><input type="text" class="required" data-bind="location" value="${esc(state.location)}" placeholder="City, State ZIP"></div>
        <div><label>PHONE</label><input type="text" class="required" data-bind="phone" value="${esc(state.phone)}" placeholder="305-555-1234"></div>
      </div>
      <div class="row two">
        <div><label>EMAIL</label><input type="text" class="required" data-bind="email" value="${esc(state.email)}" placeholder="name@example.com"></div>
        <div><label>LINKEDIN</label><input type="text" data-bind="linkedin" value="${esc(state.linkedin)}" placeholder="linkedin.com/in/…"></div>
      </div>
      ${linkItems}
      <button class="add-btn" data-action="addLink">+ ADD LINK</button>
    `;
  } else {
    body.innerHTML = `
      <div class="row"><label>FULL NAME</label><input type="text" class="required" data-bind="name" value="${esc(state.name)}" placeholder="Full name"></div>
      <div class="row"><label>CONTACT LINE 1</label><input type="text" class="required" data-bind="contact_line1" value="${esc(state.contact_line1)}" placeholder="Miami, FL | (305) 555-1234"><div class="help">Free-form. Will appear as the first contact line.</div></div>
      <div class="row"><label>CONTACT LINE 2</label><input type="text" class="required" data-bind="contact_line2" value="${esc(state.contact_line2)}" placeholder="email | LinkedIn URL | site"><div class="help">Free-form. Second contact line. Can hold email + LinkedIn + portfolio.</div></div>
    `;
  }
  bind(body);
  bindLinks(body);
}

function bindLinks(container) {
  container.querySelectorAll("input[data-link]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.links[+el.dataset.link] = ev.target.value;
      renderPreview();
    });
  });
}

function renderSummary() {
  $("#summary").value = state.summary || "";
}

function renderEducation() {
  const body = $("#body-education");
  const eduSchemaIsDemo2 = state.template === "demo_2";
  const showCoursework = state.template !== "demo_4";
  body.innerHTML = state.education.map((e, i) => {
    const sublineFields = eduSchemaIsDemo2 ? `
      <div class="row"><label>SUB-LINE — BOLD PORTION (optional)</label><input type="text" data-edu="${i}" data-field="subline_bold" value="${esc(e.subline_bold || "")}" placeholder="e.g. Associate of Arts, Economics"><div class="help">Appears bold at start of a second line. Use for a secondary degree at the same school.</div></div>
      <div class="row"><label>SUB-LINE — REST (optional)</label><input type="text" data-edu="${i}" data-field="subline_rest" value="${esc(e.subline_rest || "")}" placeholder=" | Minor in Economy | Honors"><div class="help">Plain continuation. Include leading space and separator.</div></div>
    ` : "";
    const courseworkField = showCoursework ? `
      <div class="row"><label>RELEVANT COURSEWORK (optional)</label><input type="text" data-edu="${i}" data-field="coursework" value="${esc(e.coursework || "")}" placeholder="SQL, Tableau, Power BI, ..."></div>
    ` : "";
    const certsField = state.template === "demo_8" ? `
      <div class="row"><label>CERTIFICATIONS (optional)</label><input type="text" data-edu="${i}" data-field="certifications" value="${esc(e.certifications || "")}" placeholder="Google Analytics, HubSpot Inbound, ..."><div class="help">Comma-separated. Appears as a "Certifications:" line under this entry.</div></div>
    ` : "";
    const extra = sublineFields + courseworkField + certsField;
    return `
      <div class="item">
        <div class="item-head">
          <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> ENTRY</div>
          <button class="icon-btn" data-action="removeEdu" data-index="${i}">REMOVE</button>
        </div>
        <div class="row two">
          <div><label>SCHOOL</label><input type="text" class="required" data-edu="${i}" data-field="school" value="${esc(e.school || "")}" placeholder="Miami Dade College"></div>
          <div><label>CITY</label><input type="text" data-edu="${i}" data-field="city" value="${esc(e.city || "")}" placeholder="Miami, FL"></div>
        </div>
        <div class="row two">
          <div><label>DEGREE / FIELD</label><input type="text" class="required" data-edu="${i}" data-field="degree" value="${esc(e.degree || "")}" placeholder="Associate in Arts, Business"></div>
          <div><label>DATE</label><input type="text" class="required" data-edu="${i}" data-field="date" value="${esc(e.date || "")}" placeholder="${eduSchemaIsDemo2 ? '05/2026' : 'Expected: May 2027'}"></div>
        </div>
        ${extra}
      </div>
    `;
  }).join("") + `<button class="add-btn" data-action="addEdu">+ ADD EDUCATION ENTRY</button>`;
  bindEdu(body);
}

function renderSkills() {
  const body = $("#body-skills");
  const skillsMode = tcfg().skillsMode;
  if (skillsMode === "pipe") {
    body.innerHTML = `
      <div class="help skill-help">Single line of skills separated by " │ ". Renders as one flowing paragraph.</div>
      <div class="row"><label>SKILLS LINE</label><textarea data-bind="skills_inline" placeholder="Wireshark │ Nmap │ Splunk │ Python │ ...">${esc(state.skills_inline || "")}</textarea></div>
    `;
    bind(body);
  } else if (skillsMode === "categories") {
    body.innerHTML = state.skills_categories.map((c, i) => `
      <div class="item">
        <div class="item-head">
          <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> CATEGORY</div>
          <button class="icon-btn" data-action="removeSkillCat" data-index="${i}">REMOVE</button>
        </div>
        <div class="row"><label>LABEL</label><input type="text" data-skill-cat="${i}" data-field="label" value="${esc(c.label)}" placeholder="Technical / Administrative / Language"></div>
        <div class="row"><label>CONTENT</label><textarea data-skill-cat="${i}" data-field="content" placeholder="Comma-separated items">${esc(c.content)}</textarea></div>
      </div>
    `).join("") + `<button class="add-btn" data-action="addSkillCat">+ ADD CATEGORY</button>`;
    bindSkillCat(body);
  } else {
    body.innerHTML = `
      <div class="help skill-help">Two-column layout. Each row pairs a left item with a right item — bullets are added automatically.</div>
    ` + state.skills_two_column.map((r, i) => `
      <div class="item">
        <div class="item-head">
          <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> ROW</div>
          <button class="icon-btn" data-action="removeSkillRow" data-index="${i}">REMOVE</button>
        </div>
        <div class="row two">
          <div><label>LEFT</label><input type="text" data-skill-row="${i}" data-field="left" value="${esc(r.left)}" placeholder="SQL, MySQL, Power BI"></div>
          <div><label>RIGHT</label><input type="text" data-skill-row="${i}" data-field="right" value="${esc(r.right)}" placeholder="Pipeline Management"></div>
        </div>
      </div>
    `).join("") + `<button class="add-btn" data-action="addSkillRow">+ ADD ROW</button>`;
    bindSkillRow(body);
  }
}

function renderCerts() {
  const body = $("#certs-list");
  body.innerHTML = state.certifications.map((c, i) => `
    <div class="item">
      <div class="item-head">
        <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> CERTIFICATION</div>
        <button class="icon-btn" data-action="removeCert" data-index="${i}">REMOVE</button>
      </div>
      <input type="text" data-cert="${i}" value="${esc(c)}" placeholder="AWS Certified Solutions Architect – Associate (2024)">
    </div>
  `).join("");
  body.querySelectorAll("input[data-cert]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.certifications[+el.dataset.cert] = ev.target.value;
      render();
    });
  });
}

function renderProjects() {
  const body = $("#projects-list");
  const projMode = tcfg().projMode;
  const isParagraph = projMode === "paragraph" || projMode === "paragraph_inline";
  const bulletsLabel = isParagraph ? "DESCRIPTION" : "BULLETS";
  body.innerHTML = state.projects.map((p, i) => {
    const dateLocFields = tcfg().projMode === "dated" ? `
      <div class="row two">
        <div><label>DATE</label><input type="text" data-proj="${i}" data-field="date" value="${esc(p.date || "")}" placeholder="November 2025 – Present"></div>
        <div><label>LOCATION</label><input type="text" data-proj="${i}" data-field="location" value="${esc(p.location || "")}" placeholder="Miami, FL"></div>
      </div>
    ` : "";
    return `
      <div class="item">
        <div class="item-head">
          <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> PROJECT</div>
          <button class="icon-btn" data-action="removeProject" data-index="${i}">REMOVE</button>
        </div>
        <div class="row"><label>TITLE</label><input type="text" data-proj="${i}" data-field="title" value="${esc(p.title || "")}"></div>
        ${dateLocFields}
        <div class="row"><label>${bulletsLabel}</label>
          <div class="bullets" id="proj-bullets-${i}">
            ${(p.bullets || []).map((b, bi) => `
              <div class="bullet-row">
                <textarea data-proj-bullet="${i}" data-bullet-i="${bi}">${esc(b)}</textarea>
                <button class="mic-btn" type="button" data-action="micToggle" data-mic-target="projBullet:${i}:${bi}" aria-label="Dictate bullet" title="Dictate (voice)">🎤</button>
                <button class="icon-btn" data-action="removeProjBullet" data-index="${i}" data-bullet-index="${bi}">×</button>
              </div>
            `).join("")}
          </div>
          <button class="add-btn" data-action="addProjBullet" data-index="${i}">+ ADD BULLET</button>
        </div>
      </div>
    `;
  }).join("");
  bindProjects(body);
}

function renderExperience() {
  const body = $("#experience-list");
  body.innerHTML = state.experience.map((e, i) => {
    const sublineField = state.template === "demo_4"
      ? `<div class="row"><label>LOCATION (ITALIC LINE)</label><input type="text" data-exp="${i}" data-field="location" value="${esc(e.location || "")}" placeholder="North Miami, FL"></div>`
      : `<div class="row"><label>COMPANY · CITY (PLAIN LINE)</label><input type="text" data-exp="${i}" data-field="company_city" value="${esc(e.company_city || "")}" placeholder="Pinnacle Financial | Miami, FL"></div>`;
    return `
      <div class="item">
        <div class="item-head">
          <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> POSITION</div>
          <button class="icon-btn" data-action="removeExp" data-index="${i}">REMOVE</button>
        </div>
        <div class="row two">
          <div><label>TITLE</label><input type="text" data-exp="${i}" data-field="title" value="${esc(e.title || "")}"></div>
          <div><label>DATE</label><input type="text" data-exp="${i}" data-field="date" value="${esc(e.date || "")}" placeholder="2023 – Present"></div>
        </div>
        ${sublineField}
        <div class="row"><label>BULLETS</label>
          <div class="bullets" id="exp-bullets-${i}">
            ${(e.bullets || []).map((b, bi) => `
              <div class="bullet-row">
                <textarea data-exp-bullet="${i}" data-bullet-i="${bi}">${esc(b)}</textarea>
                <button class="mic-btn" type="button" data-action="micToggle" data-mic-target="expBullet:${i}:${bi}" aria-label="Dictate bullet" title="Dictate (voice)">🎤</button>
                <button class="icon-btn" data-action="removeExpBullet" data-index="${i}" data-bullet-index="${bi}">×</button>
              </div>
            `).join("")}
          </div>
          <button class="add-btn" data-action="addExpBullet" data-index="${i}">+ ADD BULLET</button>
        </div>
      </div>
    `;
  }).join("");
  bindExperience(body);
}

// ─────────────────────────────────────────────────────────
// BIND HELPERS
// ─────────────────────────────────────────────────────────

function bind(container) {
  container.querySelectorAll("[data-bind]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state[el.dataset.bind] = ev.target.value;
      setCaseId();
      renderPreview();
    });
  });
}
function bindEdu(container) {
  container.querySelectorAll("[data-edu]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.education[+el.dataset.edu][el.dataset.field] = ev.target.value;
      renderPreview();
    });
  });
}
function bindSkillCat(container) {
  container.querySelectorAll("[data-skill-cat]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.skills_categories[+el.dataset.skillCat][el.dataset.field] = ev.target.value;
      renderPreview();
    });
  });
}
function bindSkillRow(container) {
  container.querySelectorAll("[data-skill-row]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.skills_two_column[+el.dataset.skillRow][el.dataset.field] = ev.target.value;
      renderPreview();
    });
  });
}
function bindProjects(container) {
  container.querySelectorAll("[data-proj]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.projects[+el.dataset.proj][el.dataset.field] = ev.target.value;
      renderPreview();
    });
  });
  container.querySelectorAll("[data-proj-bullet]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.projects[+el.dataset.projBullet].bullets[+el.dataset.bulletI] = ev.target.value;
      renderPreview();
    });
  });
}
function bindExperience(container) {
  container.querySelectorAll("[data-exp]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.experience[+el.dataset.exp][el.dataset.field] = ev.target.value;
      renderPreview();
    });
  });
  container.querySelectorAll("[data-exp-bullet]").forEach(el => {
    el.addEventListener("input", (ev) => {
      state.experience[+el.dataset.expBullet].bullets[+el.dataset.bulletI] = ev.target.value;
      renderPreview();
    });
  });
}

// ─────────────────────────────────────────────────────────
// LIST ACTIONS
// ─────────────────────────────────────────────────────────

function addSkillCat() { state.skills_categories.push({ label: "", content: "" }); render(); }
function removeSkillCat(i) { state.skills_categories.splice(i, 1); render(); }
function addSkillRow() { state.skills_two_column.push({ left: "", right: "" }); render(); }
function removeSkillRow(i) { state.skills_two_column.splice(i, 1); render(); }
function addCert() { state.certifications.push(""); render(); }
function removeCert(i) { state.certifications.splice(i, 1); render(); }
function addLink() { state.links.push(""); render(); }
function removeLink(i) { state.links.splice(i, 1); render(); }
function addEdu() { state.education.push({ school: "", city: "", degree: "", date: "", subline_bold: "", subline_rest: "", coursework: "", certifications: "" }); render(); }
function removeEdu(i) { state.education.splice(i, 1); render(); }
function addProject() { state.projects.push({ title: "", date: "", location: "", bullets: [""] }); render(); }
function removeProject(i) { state.projects.splice(i, 1); render(); }
function addProjBullet(i) { state.projects[i].bullets.push(""); render(); }
function removeProjBullet(i, bi) { state.projects[i].bullets.splice(bi, 1); render(); }
function addExperience() { state.experience.push({ title: "", date: "", location: "", company_city: "", bullets: [""] }); render(); }
function removeExp(i) { state.experience.splice(i, 1); render(); }
function addExpBullet(i) { state.experience[i].bullets.push(""); render(); }
function removeExpBullet(i, bi) { state.experience[i].bullets.splice(bi, 1); render(); }
function toggleSection(name) {
  if (!(name in state.section_enabled)) return;
  state.section_enabled[name] = !state.section_enabled[name];
  applySectionToggleStates();
  recomputeSectionIndices();
  renderPreview();
}

function movePanel(section, dir) {
  const tpl = state.template;
  const order = state.section_order[tpl];
  if (!order) return;
  const idx = order.indexOf(section);
  if (idx === -1) return;
  const newIdx = dir === "up" ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= order.length) return;
  [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
  reorderPanels();
  recomputeSectionIndices();
  renderPreview();
}

const ACTIONS = {
  addSkillCat: () => addSkillCat(),
  removeSkillCat: (btn) => removeSkillCat(+btn.dataset.index),
  addSkillRow: () => addSkillRow(),
  removeSkillRow: (btn) => removeSkillRow(+btn.dataset.index),
  addCert: () => addCert(),
  removeCert: (btn) => removeCert(+btn.dataset.index),
  addEdu: () => addEdu(),
  removeEdu: (btn) => removeEdu(+btn.dataset.index),
  addLink: () => addLink(),
  removeLink: (btn) => removeLink(+btn.dataset.index),
  addProject: () => addProject(),
  removeProject: (btn) => removeProject(+btn.dataset.index),
  addProjBullet: (btn) => addProjBullet(+btn.dataset.index),
  removeProjBullet: (btn) => removeProjBullet(+btn.dataset.index, +btn.dataset.bulletIndex),
  addExperience: () => addExperience(),
  removeExp: (btn) => removeExp(+btn.dataset.index),
  addExpBullet: (btn) => addExpBullet(+btn.dataset.index),
  removeExpBullet: (btn) => removeExpBullet(+btn.dataset.index, +btn.dataset.bulletIndex),
  toggleSection: (btn) => toggleSection(btn.dataset.section),
  movePanel: (btn) => movePanel(btn.dataset.section, btn.dataset.dir),
  showCompile: () => showCompile(),
  closeModal: () => closeModal(),
  copyPayloadAndPrompt: () => copyPayloadAndPrompt(),
  downloadDoc: () => downloadDoc(),
  downloadPdf: () => downloadPdf(),
  printPDF: () => printPDF(),
  closeModalBackdrop: (el, ev) => { if (ev.target === el) closeModal(); },
  toggleIntake: () => $("#intake-card").classList.toggle("collapsed"),
  toggleVoice: () => { $("#voice-card").classList.toggle("collapsed"); markVoiceIntroSeen(); },
  voiceToggle: () => voiceToggle(),
  clearVoice: () => clearVoice(),
  voiceAnalyze: () => voiceAnalyze(),
  voiceRegenSummary: () => voiceRegenSummary(),
  voiceApplySummary: () => voiceApplySummary(),
  voiceApplySkills: () => voiceApplySkills(),
  voiceToggleChip: (btn) => voiceToggleChip(btn),
  voiceSetTone: (btn) => voiceSetTone(btn),
  toggleTheme: () => toggleTheme(),
  railJumpTop: () => railJumpTo("top"),
  railOpenIntake: () => railOpen("intake"),
  railOpenVoice: () => railOpen("voice"),
  parseImportText: () => parseImportFromPaste(),
  applyImport: () => applyImport(),
  closeImportModal: () => closeImportModal(),
  closeImportModalBackdrop: (el, ev) => { if (ev.target === el) closeImportModal(); },
  resetState: () => resetState(),
  openLibrary: () => openLibrary(),
  closeLibrary: () => closeLibrary(),
  closeLibraryBackdrop: (el, ev) => { if (ev.target === el) closeLibrary(); },
  libSwitch: (btn) => switchToResume(btn.dataset.id),
  libSaveDraft: (btn) => saveDraft(btn.dataset.id),
  libRename: (btn) => renameResume(btn.dataset.id),
  libDuplicate: (btn) => duplicateResume(btn.dataset.id),
  libDelete: (btn) => deleteResume(btn.dataset.id),
  newResumeBlank: () => createNewResume({ fromSample: false }),
  newResumeSample: () => createNewResume({ fromSample: true }),
  backupLibrary: () => exportLibraryBackup(),
  restoreLibraryBackup: () => { const inp = $("#library-restore-file"); if (inp) inp.click(); },
  openShareModal: () => openShareModal(),
  closeShareModal: () => closeShareModal(),
  closeShareBackdrop: (el, ev) => { if (ev.target === el) closeShareModal(); },
  sharePdf: () => sharePdf(),
  micToggle: (btn) => micToggle(btn),
  skipVoice: () => skipVoiceIntro(),
  triggerCamera: () => triggerCamera(),
  finalSaveToLibrary: () => finalSaveToLibrary(),
  finalBackToEdit: () => finalBackToEdit(),
  onboardImport: () => { dismissOnboard(); showGetStartedCard("intake"); },
  onboardScratch: () => onboardScratch(),
  onboardVoice: () => { dismissOnboard(); showGetStartedCard("voice"); },
  onboardExplore: () => dismissOnboard(),
  gsShowImport: () => showGetStartedCard("intake"),
  gsShowVoice: () => showGetStartedCard("voice"),
};

document.addEventListener("click", (ev) => {
  const actionEl = ev.target.closest("[data-action]");
  if (!actionEl) return;
  const handler = ACTIONS[actionEl.dataset.action];
  if (!handler) return;
  ev.preventDefault();
  handler(actionEl, ev);
});

// ─────────────────────────────────────────────────────────
// PANEL TOGGLES
// ─────────────────────────────────────────────────────────

$$(".panel header").forEach(h => {
  h.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-action]")) return;
    h.parentElement.classList.toggle("open");
  });
});

function applySectionToggleStates() {
  $$(".panel[data-optional='true']").forEach(panel => {
    const name = panel.dataset.section;
    const enabled = state.section_enabled[name] !== false;
    panel.classList.toggle("section-off", !enabled);
    const btn = panel.querySelector(".section-toggle");
    if (btn) {
      btn.textContent = enabled ? "INCLUDED" : "EXCLUDED";
      btn.setAttribute("aria-pressed", enabled ? "true" : "false");
    }
  });
}

function recomputeSectionIndices() {
  let n = 1;
  $$(".panel").forEach(panel => {
    if (panel.classList.contains("hidden")) return;
    const idxEl = panel.querySelector(".idx");
    if (idxEl) idxEl.textContent = String(n).padStart(2, "0");
    n += 1;
  });
}

// Pull each reorderable form panel into the order specified by
// state.section_order[template]. Sections not in the current template's
// order (e.g. certs in demo_4) are left untouched and hidden separately.
function reorderPanels() {
  const tpl = state.template;
  const order = state.section_order[tpl] || [];
  const panels = {};
  $$(".panel[data-reorderable='true']").forEach(p => { panels[p.dataset.section] = p; });
  const summaryPanel = $(".panel[data-section='summary']");
  let anchor = summaryPanel;
  for (const sec of order) {
    const panel = panels[sec];
    if (!panel) continue;
    if (anchor.nextElementSibling !== panel) anchor.after(panel);
    anchor = panel;
  }
  updateReorderButtonStates();
}

function updateReorderButtonStates() {
  const tpl = state.template;
  const order = state.section_order[tpl] || [];
  $$(".reorder-btn").forEach(btn => {
    const sec = btn.dataset.section;
    const idx = order.indexOf(sec);
    const dir = btn.dataset.dir;
    let disabled = false;
    if (idx === -1) disabled = true;
    else if (dir === "up" && idx === 0) disabled = true;
    else if (dir === "down" && idx === order.length - 1) disabled = true;
    btn.setAttribute("aria-disabled", disabled ? "true" : "false");
  });
}

// ─────────────────────────────────────────────────────────
// TEMPLATE SWITCH
// ─────────────────────────────────────────────────────────

// The dropdown options ship in index.html (so the picker is never empty even
// before/without JS). As a safety net, rebuild them from config if missing.
(function ensureTemplateDropdown() {
  const dd = $("#tpl-dropdown");
  if (!dd || (dd.options && dd.options.length > 0)) return;
  dd.innerHTML = TEMPLATE_ORDER.map(tpl => {
    const c = TEMPLATES[tpl];
    return `<option value="${tpl}">${esc(c.name)}</option>`;
  }).join("");
})();

$("#tpl-dropdown") && $("#tpl-dropdown").addEventListener("change", (ev) => {
  const tpl = ev.target.value;
  if (!TEMPLATES[tpl] || tpl === state.template) return;
  // Still showing an untouched demo? Load the chosen template's OWN demo so each
  // template previews its own sample. Once the user has imported or typed real
  // content, keep it and just re-lay it out in the new template.
  if (currentDemoIsPristine() && DEMO_SEEDS[tpl]) {
    replaceStateWith(DEMO_SEEDS[tpl]);
  } else {
    state.template = tpl;
  }
  state.font_pt = null; // reset font choice on template switch — each template has its own default
  $$("[data-font]").forEach(c => c.classList.remove("active"));
  $("#font-chip-default").classList.add("active");
  reorderPanels();
  setCaseId();
  render();
});

// Window resize re-paginates the preview at the new width.
let _resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => renderPreview(), 180);
});

// Font size chip selector — manual override only
$$("[data-font]").forEach(chip => {
  chip.addEventListener("click", () => {
    $$("[data-font]").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    const v = chip.dataset.font;
    state.font_pt = v === "default" ? null : parseInt(v, 10);
    renderPreview();
  });
});

// Typeface (font-family) chip selector — applies to the whole resume.
$$("[data-family]").forEach(chip => {
  chip.addEventListener("click", () => {
    $$("[data-family]").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    state.font_family = chip.dataset.family;
    renderPreview();
  });
});

// Voice-profile transcript: editable; mirrors into (session-only) state.
const _voiceTaEl = $("#voice-transcript");
if (_voiceTaEl) {
  _voiceTaEl.addEventListener("input", (ev) => { state.voice_profile = ev.target.value; });
}

// ─────────────────────────────────────────────────────────
// LIVE PREVIEW
// ─────────────────────────────────────────────────────────

function renderSummaryPreviewHtml() {
  const c = tcfg();
  let html = `<div class="resume-section-h">${esc(c.labels.summary)}</div>`;
  html += `<div>${linkify(state.summary)}</div>`;
  return html;
}

function renderEducationPreviewHtml(tpl) {
  const c = tcfg(tpl);
  let html = `<div class="resume-section-h">${esc(c.labels.education)}</div>`;
  state.education.forEach((e, idx) => {
    const gapClass = idx > 0 ? " edu-gap" : "";
    if (c.eduMode === "demo4") {
      html += `<div class="edu-row${gapClass}"><div class="strong">${esc(e.school)}</div><div class="strong">${esc(e.city)}</div></div>`;
      html += `<div class="edu-row"><div>${esc(e.degree)}</div><div>${esc(e.date)}</div></div>`;
    } else if (c.eduMode === "demo5") {
      // Degree (bold) first, then "school │ city │ date" on a plain subline.
      html += `<div class="edu-degree-bold${gapClass}">${esc(e.degree)}</div>`;
      const sub = [e.school, e.city, e.date].filter(Boolean).join(" │ ");
      if (sub) html += `<div class="edu-subline">${linkify(sub)}</div>`;
      if (e.coursework) {
        html += `<div class="edu-coursework"><span class="bold">Relevant Coursework: </span>${linkify(e.coursework)}</div>`;
      }
    } else if (c.eduMode === "demo6") {
      // Sidebar: compact "School (date) — Degree" line per entry.
      const head = [esc(e.school), e.date ? `(${esc(e.date)})` : ""].filter(Boolean).join(" ");
      html += `<div class="edu-line${gapClass}">${head}${e.degree ? ` — ${esc(e.degree)}` : ""}</div>`;
    } else if (c.eduMode === "demo8") {
      // "Degree (bold) School | City" left, date right; then coursework + certs lines.
      const left = [`<span class="bold">${esc(e.degree)}</span>`, esc(e.school)].filter(Boolean).join(" ")
        + (e.city ? ` | ${esc(e.city)}` : "");
      html += `<div class="entry-title-row${gapClass}"><div class="title-plain">${left}</div><div class="date">${esc(e.date)}</div></div>`;
      if (e.coursework) {
        html += `<div class="edu-coursework"><span class="bold">Coursework: </span>${linkify(e.coursework)}</div>`;
      }
      if (e.certifications) {
        html += `<div class="edu-coursework"><span class="bold">Certifications: </span>${linkify(e.certifications)}</div>`;
      }
    } else {
      // demo2 / demo1: school+city row, degree+date row, optional subline + coursework.
      const degRowClass = c.eduMode === "demo1" ? "edu-row" : "edu-degree-row";
      html += `<div class="edu-row${gapClass}"><div class="strong">${esc(e.school)}</div><div>${esc(e.city)}</div></div>`;
      html += `<div class="${degRowClass}"><div>${esc(e.degree)}</div><div>${esc(e.date)}</div></div>`;
      if (e.subline_bold || e.subline_rest) {
        html += `<div class="edu-subline"><span class="bold">${esc(e.subline_bold)}</span>${linkify(e.subline_rest)}</div>`;
      }
      if (e.coursework) {
        html += `<div class="edu-coursework"><span class="bold">Relevant Coursework: </span>${linkify(e.coursework)}</div>`;
      }
    }
  });
  return html;
}

function renderSkillsPreviewHtml(tpl) {
  const c = tcfg(tpl);
  let html = `<div class="resume-section-h">${esc(c.labels.skills)}</div>`;
  if (c.skillsMode === "categories") {
    state.skills_categories.forEach(cat => {
      html += `<div class="skill-cat"><span class="lbl">${esc(cat.label)}:</span> ${esc(cat.content)}</div>`;
    });
  } else if (c.skillsMode === "pipe") {
    html += `<div class="skills-line">${esc(state.skills_inline || "")}</div>`;
  } else if (c.skillsMode === "list") {
    // Sidebar: flat bullet list, flattening the two-column pairs in reading order.
    html += `<ul class="skills-list">`;
    state.skills_two_column.forEach(r => {
      if (r.left) html += `<li>${esc(r.left)}</li>`;
      if (r.right) html += `<li>${esc(r.right)}</li>`;
    });
    html += `</ul>`;
  } else {
    html += `<ul class="skills-2col">`;
    state.skills_two_column.forEach(r => {
      const left = r.left ? `<li class="left">${esc(r.left)}</li>` : `<li></li>`;
      const right = r.right ? `<div>• ${esc(r.right)}</div>` : `<div></div>`;
      html += left + right;
    });
    html += `</ul>`;
  }
  return html;
}

function renderCertsPreviewHtml() {
  let html = `<div class="resume-section-h">${esc(tcfg().labels.certs)}</div>`;
  html += `<ul class="bullets-list">`;
  state.certifications.forEach(c => { html += `<li>${linkify(c)}</li>`; });
  html += `</ul>`;
  return html;
}

function renderProjectsPreviewHtml(tpl) {
  const c = tcfg(tpl);
  let html = `<div class="resume-section-h">${esc(c.labels.projects)}</div>`;
  state.projects.forEach(p => {
    const bullets = (p.bullets || []).filter(Boolean);
    if (c.projMode === "dated") {
      html += `<div class="entry-title-row"><div class="title">${esc(p.title)}</div><div class="date">${esc(p.date)}</div></div>`;
      if (p.location) html += `<div class="entry-loc">${linkify(p.location)}</div>`;
      if (bullets.length) {
        html += `<ul class="bullets-list">`;
        bullets.forEach(b => { html += `<li>${linkify(b)}</li>`; });
        html += `</ul>`;
      }
    } else if (c.projMode === "paragraph_inline") {
      // demo5: "Title: description" — bold title, colon, description inline.
      const first = bullets.shift() || "";
      html += `<div class="proj-desc"><span class="bold">${esc(p.title)}:</span> ${linkify(first)}</div>`;
      bullets.forEach(b => { html += `<div class="proj-desc">${linkify(b)}</div>`; });
    } else if (c.projMode === "paragraph") {
      // demo1: bold title line, then description paragraph(s), no bullets.
      html += `<div class="proj-title">${esc(p.title)}</div>`;
      bullets.forEach(b => { html += `<div class="proj-desc">${linkify(b)}</div>`; });
    } else {
      html += `<div class="proj-title">${esc(p.title)}</div>`;
      if (bullets.length) {
        html += `<ul class="bullets-list">`;
        bullets.forEach(b => { html += `<li>${linkify(b)}</li>`; });
        html += `</ul>`;
      }
    }
  });
  return html;
}

function renderExperiencePreviewHtml(tpl) {
  const c = tcfg(tpl);
  let html = `<div class="resume-section-h">${esc(c.labels.experience)}</div>`;
  state.experience.forEach(en => {
    if (c.expMode === "company_first") {
      // demo6: "COMPANY | DATE" line, then job title, then bullets.
      const head = [en.company_city, en.date].filter(Boolean).join(" | ");
      html += `<div class="hl-company">${linkify(head)}</div>`;
      if (en.title) html += `<div class="hl-title">${esc(en.title)}</div>`;
    } else {
      html += `<div class="entry-title-row"><div class="title">${esc(en.title)}</div><div class="date">${esc(en.date)}</div></div>`;
      if (c.expMode === "italic") {
        if (en.location) html += `<div class="entry-loc">${linkify(en.location)}</div>`;
      } else {
        if (en.company_city) html += `<div class="exp-company">${linkify(en.company_city)}</div>`;
      }
    }
    if (en.bullets && en.bullets.length) {
      html += `<ul class="bullets-list">`;
      en.bullets.forEach(b => { if (b) html += `<li>${linkify(b)}</li>`; });
      html += `</ul>`;
    }
  });
  return html;
}

const PREVIEW_SECTION_RENDERERS = {
  education: (tpl) => renderEducationPreviewHtml(tpl),
  skills: (tpl) => renderSkillsPreviewHtml(tpl),
  certs: (tpl) => tcfg(tpl).certs ? renderCertsPreviewHtml() : "",
  projects: (tpl) => (state.section_enabled.projects && state.projects.length > 0) ? renderProjectsPreviewHtml(tpl) : "",
  experience: (tpl) => (state.section_enabled.experience && state.experience.length > 0) ? renderExperiencePreviewHtml(tpl) : "",
};

// Two-column sidebar layout (demo_6). Built as an HTML table so the columns
// survive both the browser preview and the Word (.doc) export, which has poor
// flex/grid support.
function renderSidebarPreviewHtml() {
  const tpl = state.template;
  const c = tcfg(tpl);
  let head = `<div class="resume-name">${esc(state.name) || "—"}</div>`;
  if (state.professional_title) head += `<div class="resume-title">${esc(state.professional_title)}</div>`;

  let side = `<div class="resume-section-h">${esc(c.labels.contact)}</div>`;
  const contactBits = [];
  if (state.phone) contactBits.push(`📞 ${esc(state.phone)}`);
  if (state.email) contactBits.push(`✉ ${linkify(state.email)}`);
  if (state.location) contactBits.push(`📍 ${esc(state.location)}`);
  if (state.linkedin) contactBits.push(`🔗 ${linkify(state.linkedin)}`);
  side += contactBits.map(b => `<div class="contact-line">${b}</div>`).join("");
  side += renderEducationPreviewHtml(tpl);
  side += renderSkillsPreviewHtml(tpl);

  let main = "";
  if (state.section_enabled.summary !== false) main += renderSummaryPreviewHtml();
  if (state.section_enabled.experience !== false && state.experience.length) {
    main += renderExperiencePreviewHtml(tpl);
  }

  return head +
    `<table class="sidebar-grid"><tbody><tr>` +
    `<td class="col-side">${side}</td>` +
    `<td class="col-main">${main}</td>` +
    `</tr></tbody></table>`;
}

function renderPreview() {
  // Re-checked on every keystroke: typing a real name is what compacts the
  // Get Started cards, and name edits only reach renderPreview, not render().
  updateGetStartedState();
  const tpl = state.template;
  const f = $("#preview");
  let html;
  if (tcfg(tpl).layout === "sidebar") {
    html = renderSidebarPreviewHtml();
  } else {
    html = `<div class="resume-name">${esc(state.name) || "—"}</div>`;
    if (tpl === "demo_4") {
      const extraLinks = (state.links || []).filter(Boolean).map(linkify).join(" | ");
      const contactParts = [esc(state.location), esc(state.phone), linkify(state.email), linkify(state.linkedin), extraLinks].filter(Boolean);
      html += `<div class="resume-contact">${contactParts.join(" | ")}</div>`;
    } else {
      const line2 = (state.contact_line2 || "").trim();
      html += `<div class="resume-contact">${linkify(state.contact_line1)}${line2 ? "<br>" + linkify(line2) : ""}</div>`;
      html += `<div class="resume-contact-divider"></div>`;
    }

    if (state.section_enabled.summary !== false) {
      html += renderSummaryPreviewHtml();
    }

    const order = state.section_order[tpl] || [];
    for (const sec of order) {
      const fn = PREVIEW_SECTION_RENDERERS[sec];
      if (fn) html += fn(tpl);
    }
  }

  const defaultFontPt = tcfg(tpl).bodyPt;
  const fontPt = state.font_pt || defaultFontPt;
  state._appliedFontPt = fontPt;

  // Render content into a single frame, then paginate by measuring children.
  const frameClass = `preview-frame ${tpl} font-${fontPt} family-${fontFamilyKey()}`;
  f.innerHTML = `<div class="${frameClass}">${html}</div>`;
  const pageCount = paginatePreview(frameClass);
  runMatch();

  // Stats: words + content density (entries + bullets) + active font + page count
  const text = f.innerText || "";
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const totalEntries =
    state.education.filter(e => e.school).length +
    state.projects.filter(p => p.title).length +
    state.experience.filter(e => e.title).length;
  const totalBullets =
    state.projects.reduce((n, p) => n + (p.bullets || []).filter(Boolean).length, 0) +
    state.experience.reduce((n, e) => n + (e.bullets || []).filter(Boolean).length, 0);
  const isDefault = fontPt === defaultFontPt;
  const fontClass = isDefault ? "ok" : "warn";
  const pageLabel = pageCount === 1 ? "1 page" : `${pageCount} pages`;
  $("#preview-stats").innerHTML =
    `${words} words &nbsp;·&nbsp; ${totalEntries} entries &nbsp;·&nbsp; ${totalBullets} bullets &nbsp;·&nbsp; <span class="${fontClass}">${fontPt}pt body</span> &nbsp;·&nbsp; ${pageLabel}`;

  $("#overflow-banner").className = "overflow-banner";
  $("#overflow-banner").innerHTML = "";

  mirrorPreviewToFinal();
  updateFinalActionState();
  schedulePersist();
}

// ─────────────────────────────────────────────────────────
// FINAL REVIEW PANE (phase 9)
// Mirrors the inline preview into a clean full-screen review surface
// with sticky "save / pdf / share / back" actions at the bottom.
// ─────────────────────────────────────────────────────────

function mirrorPreviewToFinal() {
  const src = $("#preview");
  const dst = $("#final-preview");
  if (!src || !dst) return;
  // The preview is already paginated into one-or-more .preview-frame nodes;
  // a shallow innerHTML clone gives us identical page layout for free.
  dst.innerHTML = src.innerHTML;

  // Update the meta line with bucket + page count.
  const meta = $("#final-meta");
  if (meta) {
    const pageCount = src.querySelectorAll(".preview-frame").length || 1;
    const pageLabel = pageCount === 1 ? "1 page" : `${pageCount} pages`;
    const bucket = activeBucket();
    const bucketLabel = bucket === "saved"
      ? `<span class="bucket saved">★ SAVED</span>`
      : `<span class="bucket">DRAFT</span>`;
    meta.innerHTML = `${bucketLabel} · ${pageLabel}`;
  }
}

function updateFinalActionState() {
  const btn = $("#final-save-btn");
  const label = $("#final-save-label");
  if (!btn || !label) return;
  const bucket = activeBucket();
  btn.classList.remove("is-saved", "is-full");
  btn.disabled = false;
  if (bucket === "saved") {
    btn.classList.add("is-saved");
    btn.disabled = true;
    label.textContent = "ALREADY SAVED";
    return;
  }
  if (_library.saved.length >= SAVED_LIMIT) {
    btn.classList.add("is-full");
    btn.disabled = true;
    label.textContent = `SAVED FULL (${SAVED_LIMIT}) — DELETE ONE`;
    return;
  }
  label.textContent = "SAVE TO LIBRARY";
}

function finalSaveToLibrary() {
  const active = activeResume();
  if (!active) return;
  if (activeBucket() === "saved") {
    toast("ALREADY IN SAVED");
    return;
  }
  if (_library.saved.length >= SAVED_LIMIT) {
    toast(`SAVED IS FULL — DELETE ONE FIRST`);
    return;
  }
  saveDraft(active.id);
  updateFinalActionState();
  // After save, the resume now lives in the saved bucket — refresh the pill +
  // meta so the FINAL pane immediately reflects the new state.
  mirrorPreviewToFinal();
}

function finalBackToEdit() {
  const swipe = window.__paneSwipe;
  if (swipe) {
    swipe.setActive("left");
    swipe.scrollToPane("left");
  }
}


// ─────────────────────────────────────────────────────────
// SUMMARY BINDING (single static field)
// ─────────────────────────────────────────────────────────

$("#summary").addEventListener("input", (ev) => {
  state.summary = ev.target.value;
  renderPreview();
});

// ─────────────────────────────────────────────────────────
// FULL RENDER
// ─────────────────────────────────────────────────────────

// Reflect state.template in the dropdown + section-panel visibility so a
// restored resume (or one switched via the library) shows the right UI.
function syncTemplateUI() {
  const cfg = tcfg();
  const dd = $("#tpl-dropdown");
  if (dd && dd.value !== state.template) dd.value = state.template;
  const desc = $("#tpl-desc");
  if (desc) desc.textContent = cfg.desc || "";
  const certsPanel = $("#panel-certs");
  if (certsPanel) certsPanel.classList.toggle("hidden", !cfg.certs);
  // Hide the Projects panel for templates whose section order omits projects.
  const order = state.section_order[state.template] || [];
  const projPanel = $(".panel[data-section='projects']");
  if (projPanel) {
    projPanel.classList.toggle("hidden", !order.includes("projects"));
    const projTitle = projPanel.querySelector("h2");
    if (projTitle) projTitle.textContent = cfg.labels.projects || "PROJECTS";
  }
  // Reflect the active typeface + size chips.
  const fam = fontFamilyKey();
  $$("[data-family]").forEach(c => c.classList.toggle("active", c.dataset.family === fam));
  $$("[data-font]").forEach(c => {
    const isActive = c.dataset.font === "default"
      ? state.font_pt == null
      : parseInt(c.dataset.font, 10) === state.font_pt;
    c.classList.toggle("active", isActive);
  });
}

function render() {
  // A full render() rebuilds the form DOM, which would orphan an active
  // mic button mid-stream. Stop dictation first so the user isn't stuck
  // with a phantom "listening" state and an unreachable target field.
  if (_recordingTarget) stopDictation();
  syncTemplateUI();
  renderHeader();
  renderSummary();
  renderEducation();
  renderSkills();
  if (tcfg().certs) renderCerts();
  renderProjects();
  renderExperience();
  applySectionToggleStates();
  reorderPanels();
  recomputeSectionIndices();
  setCaseId();
  renderPreview();
  updateLibraryPill();
  hideMicButtonsIfUnsupported();
  initVoiceOnce();
  updateGetStartedState();
}

// ─────────────────────────────────────────────────────────
// ONBOARDING + GET-STARTED VISIBILITY
// The launch overlay routes a new user to import / blank / voice. Once the
// resume carries a real name (not the demo placeholder), the bulky intake
// cards compact into two small reopeners on the "Get Started" group line.
// ─────────────────────────────────────────────────────────

function dismissOnboard() {
  const bg = $("#onboard-bg");
  if (bg) bg.classList.add("dismissed");
}

function onboardScratch() {
  dismissOnboard();
  createNewResume({ fromSample: false, name: "My Resume" });
  const nameInput = document.querySelector('[data-bind="name"]');
  if (nameInput) nameInput.focus();
}

// Expand + reveal one of the Get Started cards, even after the group has
// compacted (gs-force wins over the body.gs-done display:none rule).
function showGetStartedCard(card) {
  const el = $(card === "intake" ? "#intake-card" : "#voice-card");
  if (!el) return;
  el.classList.add("gs-force");
  el.classList.remove("collapsed");
  if (card === "voice") markVoiceIntroSeen();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  if (card === "intake") {
    const paste = $("#import-paste");
    if (paste) paste.focus({ preventScroll: true });
  }
}

// "Real data" heuristic: the user has replaced the demo placeholder name.
// Both demo seeds use "Jane Doe"; blank resumes start with "".
function hasUserData() {
  const name = (state.name || "").trim();
  return name !== "" && name.toLowerCase() !== "jane doe";
}

function updateGetStartedState() {
  document.body.classList.toggle("gs-done", hasUserData());
}

function initOnboarding() {
  const bg = $("#onboard-bg");
  if (!bg) return;
  // The ?voice=1 deep link already auto-opens the voice flow — don't stack
  // the chooser on top of it.
  try {
    if (new URLSearchParams(window.location.search).get("voice") === "1") {
      bg.classList.add("dismissed");
      return;
    }
  } catch (_err) { /* ignore */ }
  // Be honest about voice support (iOS Safari needs Siri/Dictation enabled;
  // some browsers lack the Web Speech API entirely): keep the path, reframe
  // it as typing.
  if (!isSpeechSupported()) {
    const label = $("#onboard-voice-label");
    const sub = $("#onboard-voice-sub");
    if (label) label.textContent = "WRITE A QUICK INTRO";
    if (sub) sub.textContent = "Voice capture isn't supported in this browser — type a few sentences and we'll draft a summary in your own words";
  }
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !bg.classList.contains("dismissed")) dismissOnboard();
  });
}

// Camera-scan capability note: without an in-browser TextDetector (anything
// other than Chrome on Android), reading the photo is a manual copy step —
// say so before the user takes the picture, not after.
function initCameraCapabilityNote() {
  if (typeof window.TextDetector === "function") return;
  const note = $("#camera-note");
  if (!note) return;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  note.textContent = isIOS
    ? "Heads up: this browser can't read text from photos automatically. After you snap the picture, use iOS Live Text (tap and hold the image) to copy the words, then paste them below."
    : "Heads up: this browser can't read text from photos automatically. After you snap the picture, copy the text with your phone's built-in text recognition, then paste it below.";
  note.classList.remove("hidden");
}

// ── Theme + app rail ───────────────────────────────────────────────────────
// Light by default; users opt into dark from the rail toggle. We persist the
// choice so subsequent loads are stable, and never auto-switch on system
// preference change so the editor doesn't flip mid-session.
const THEME_KEY = "resumecanvas:v1:theme";

function applySavedTheme() {
  let theme = "light";
  try { theme = localStorage.getItem(THEME_KEY) || "light"; } catch (_e) { /* ignore */ }
  setTheme(theme, { persist: false });
}

function setTheme(theme, opts) {
  const dark = theme === "dark";
  document.body.classList.toggle("theme-dark", dark);
  const btn = document.querySelector(".app-rail-btn.theme-toggle");
  if (btn) {
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
    btn.setAttribute("title", dark ? "Switch to light theme" : "Switch to dark theme");
  }
  if (!opts || opts.persist !== false) {
    try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch (_e) { /* ignore */ }
  }
}

function toggleTheme() {
  const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
  setTheme(next);
}

// Rail click handlers: scroll the left editor pane to the top, or toggle one
// of the optional intake/voice cards open before scrolling.
function railJumpTo(where) {
  let el = null;
  if (where === "top") el = document.querySelector(".pane.left");
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function railOpen(card) {
  showGetStartedCard(card);
}

function maybeAutoStartVoiceFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("voice") !== "1") return;
    if (!isSpeechSupported()) return;
    const card = $("#voice-card");
    if (card) card.classList.remove("collapsed");
    markVoiceIntroSeen();
    // Defer so the rest of the UI has a beat to settle before the mic prompt.
    setTimeout(() => { voiceToggle(); }, 350);
  } catch (_err) { /* URL not available — ignore */ }
}

async function sharePdf() {
  if (!navigator || typeof navigator.share !== "function") {
    toast("SHARING NOT SUPPORTED — USE DOWNLOAD");
    return;
  }
  try {
    const bytes = buildResumePdfBytes();
    const filename = `${slugFileName(state.name)}-${state.template}.pdf`;
    const file = new File([bytes], filename, { type: "application/pdf" });
    const data = {
      files: [file],
      title: `${state.name || "Resume"} — Resume`,
      text: `${state.name || ""}'s resume`,
    };
    // canShare with files is the right pre-flight; some browsers (older Android)
    // implement navigator.share but not canShare — fall through and try anyway.
    if (typeof navigator.canShare === "function" && !navigator.canShare(data)) {
      toast("THIS BROWSER CAN'T SHARE FILES");
      return;
    }
    await navigator.share(data);
  } catch (err) {
    // User cancellation throws AbortError — treat as a no-op, no toast spam.
    if (err && err.name === "AbortError") return;
    toast("SHARE FAILED — TRY DOWNLOAD");
    if (typeof console !== "undefined") console.error(err);
  }
}

function buildPayload() {
  const tpl = state.template;
  const cfg = tcfg(tpl);
  const order = state.section_order[tpl] || [];
  const summaryOn = state.section_enabled.summary !== false;
  const out = {
    name: state.name,
    summary: summaryOn ? state.summary : "",
    font_pt: state._appliedFontPt || cfg.bodyPt,
    font_family: FONT_FAMILIES[fontFamilyKey()].label,
    section_order: order.slice(),
  };
  const voice = (state.voice_profile || "").trim();
  if (voice) out.voice_profile = voice;

  // ── Header ──
  if (cfg.header === "structured") {
    out.location = state.location;
    out.phone = state.phone;
    out.email = state.email;
    out.linkedin = state.linkedin;
    out.links = (state.links || []).filter(Boolean);
    if (state.professional_title) out.professional_title = state.professional_title;
  } else {
    out.contact_line1 = state.contact_line1;
    out.contact_line2 = state.contact_line2;
  }

  // ── Education ──
  out.education = state.education
    .filter(e => e.school || e.degree)
    .map(e => {
      const ed = { school: e.school, city: e.city, degree: e.degree, date: e.date };
      if (cfg.eduMode === "demo2") { ed.subline_bold = e.subline_bold || ""; ed.subline_rest = e.subline_rest || ""; }
      if (e.coursework) ed.coursework = e.coursework;
      if (cfg.eduMode === "demo8" && e.certifications) ed.certifications = e.certifications;
      return ed;
    });

  // ── Skills ──
  if (cfg.skillsMode === "categories") {
    out.skills_categories = state.skills_categories.filter(c => c.label || c.content);
  } else if (cfg.skillsMode === "pipe") {
    out.skills_inline = state.skills_inline || "";
  } else if (cfg.skillsMode === "list") {
    out.skills = state.skills_two_column.flatMap(r => [r.left, r.right].filter(Boolean));
  } else {
    out.skills_two_column = state.skills_two_column
      .filter(r => r.left || r.right)
      .map(r => ({ left: r.left || "", right_with_bullet: r.right ? `• ${r.right}` : "" }));
  }

  if (cfg.certs) out.certifications = state.certifications.filter(Boolean);

  // ── Projects (only when this template includes them) ──
  if (order.includes("projects")) {
    out.projects = state.section_enabled.projects
      ? state.projects.filter(p => p.title).map(p => {
          const pr = { title: p.title, bullets: (p.bullets || []).filter(Boolean) };
          if (cfg.projMode === "dated") { pr.date = p.date; pr.location = p.location; }
          return pr;
        })
      : [];
  }

  // ── Experience ──
  out.experience = state.section_enabled.experience
    ? state.experience.filter(e => e.title || e.company_city).map(e => {
        const ex = { title: e.title, date: e.date, bullets: (e.bullets || []).filter(Boolean) };
        if (cfg.expMode === "italic") ex.location = e.location;
        else ex.company_city = e.company_city;
        return ex;
      })
    : [];

  return out;
}

function fallbackCopyText(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.className = "clipboard-fallback";
  document.body.appendChild(ta);
  ta.select();
  try {
    return document.execCommand("copy");
  } finally {
    ta.remove();
  }
}

async function copyText(text, successMessage) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else if (!fallbackCopyText(text)) {
      throw new Error("Clipboard fallback failed");
    }
    toast(successMessage);
    return true;
  } catch (err) {
    console.error("Copy failed", err);
    toast("COPY FAILED — SELECT TEXT MANUALLY");
    return false;
  }
}

function showCompile() {
  const payload = buildPayload();
  $("#json-out").textContent = JSON.stringify(payload, null, 2);
  $("#modal-tpl").textContent = state.template;
  $("#modal-bg").classList.add("show");
}

function closeModal() {
  $("#modal-bg").classList.remove("show");
}

async function copyPayloadAndPrompt() {
  const payload = JSON.stringify(buildPayload(), null, 2);
  const tpl = state.template;
  const voice = (state.voice_profile || "").trim();
  const voiceCue = voice
    ? `\n\nThe candidate described themselves out loud (transcript below). Use it to:\n` +
      `1. Match their natural voice and tone, especially in the summary, so it reads like a real person rather than generic AI.\n` +
      `2. Surface any genuine skills, tools, technologies, or competencies they mention into the skills section — only if clearly stated or strongly implied; never invent skills.\n` +
      `Treat it as voice/skill signal, not verbatim content: keep everything professional and ATS-friendly, don't copy phrasing word-for-word, and don't add facts (employers, dates, titles) that aren't already in the JSON.\n"""\n${voice}\n"""`
    : "";
  const styleRule = `\n\nNever use em dashes (—) or en dashes (–) anywhere in the output; use commas, periods, or hyphens instead.`;
  const text = `Generate this resume using template ${tpl}:\n\n\`\`\`json\n${payload}\n\`\`\`${voiceCue}${styleRule}`;
  const copied = await copyText(text, "PAYLOAD + PROMPT COPIED");
  if (copied) setTimeout(() => closeModal(), 600);
}

// ─────────────────────────────────────────────────────────
// IMPORT FROM EXISTING RESUME
// ─────────────────────────────────────────────────────────

let _pendingImport = null;

async function handleImportFile(file) {
  try {
    let text;
    if (/\.docx$/i.test(file.name)) {
      text = await extractDocxText(file);
    } else if (/\.txt$/i.test(file.name) || /^text\//.test(file.type) || !file.type) {
      text = await file.text();
    } else {
      toast("UNSUPPORTED FILE — paste text instead");
      return;
    }
    if (!text || !text.trim()) {
      toast("FILE WAS EMPTY");
      return;
    }
    showImportConfirm(RcParse.parseResumeText(text), file.name);
  } catch (err) {
    console.error("Import failed", err);
    toast("IMPORT FAILED — try pasting text instead");
  }
}

function parseImportFromPaste() {
  const text = $("#import-paste").value;
  if (!text.trim()) { toast("PASTE SOME TEXT FIRST"); return; }
  showImportConfirm(RcParse.parseResumeText(text), "(pasted)");
}

async function extractDocxText(file) {
  const buf = await file.arrayBuffer();
  const u8 = new Uint8Array(buf);
  const view = new DataView(buf);
  const TARGET = "word/document.xml";
  for (let i = 0; i <= u8.length - 30; i++) {
    if (u8[i] !== 0x50 || u8[i+1] !== 0x4b || u8[i+2] !== 0x03 || u8[i+3] !== 0x04) continue;
    const compression = view.getUint16(i + 8, true);
    const compSize = view.getUint32(i + 18, true);
    const nameLen = view.getUint16(i + 26, true);
    const extraLen = view.getUint16(i + 28, true);
    const nameStart = i + 30;
    if (nameStart + nameLen > u8.length) continue;
    const name = new TextDecoder().decode(u8.subarray(nameStart, nameStart + nameLen));
    if (name !== TARGET) continue;
    const dataStart = nameStart + nameLen + extraLen;
    const data = u8.subarray(dataStart, dataStart + compSize);
    let xml;
    if (compression === 0) {
      xml = new TextDecoder().decode(data);
    } else if (compression === 8 && typeof DecompressionStream !== "undefined") {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      xml = await new Response(stream).text();
    } else {
      throw new Error("Unsupported .docx compression");
    }
    return docxXmlToText(xml);
  }
  throw new Error("Not a valid .docx (document.xml missing)");
}

function docxXmlToText(xml) {
  const decode = (s) => s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const paragraphs = xml.split(/<w:p[\s>\/]/).slice(1);
  const lines = paragraphs.map(p => {
    const runs = [];
    const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let m;
    while ((m = re.exec(p))) runs.push(m[1]);
    return decode(runs.join(""));
  });
  return lines.join("\n");
}

function showImportConfirm(parsed, sourceName) {
  _pendingImport = parsed;
  const h = parsed.header;

  // Inline-editable single-value field (name/email/phone/location/linkedin).
  // Checkbox enabled even when empty so a missed field can be typed in and kept.
  const fieldRow = (key, label, value) => {
    const has = !!value;
    return `
    <div class="import-row import-field">
      <input type="checkbox" data-import-key="${key}" ${has ? "checked" : ""}>
      <div class="ir-label">${label}</div>
      <input type="text" class="ir-input" data-import-field="${key}" value="${esc(value)}" placeholder="none detected — type to add" aria-label="${label}">
    </div>`;
  };

  // Summary gets a wider editable textarea so long text can be reviewed/trimmed.
  const summaryRow = () => {
    const has = !!parsed.summary;
    return `
    <div class="import-row import-field import-summary">
      <input type="checkbox" data-import-key="summary" ${has ? "checked" : ""}>
      <div class="ir-label">PROFILE SUMMARY</div>
      <textarea class="ir-input ir-textarea" data-import-field="summary" rows="3" placeholder="none detected — type to add" aria-label="Profile summary">${esc(parsed.summary)}</textarea>
    </div>`;
  };

  // Collection row with an expandable preview of the actual parsed entries.
  const sectionRow = (key, label, n, detail, detailHtml) => {
    const has = n > 0;
    return `
    <div class="import-row import-section">
      <input type="checkbox" data-import-key="${key}" ${has ? "checked" : "disabled"}>
      <div class="ir-label">${label}</div>
      <div class="ir-value">
        ${has ? `<span class="count">${n}</span> ${esc(detail)}` : '<span class="none">none detected</span>'}
        ${has && detailHtml ? `<details class="ir-details"><summary>preview</summary><div class="ir-detail-body">${detailHtml}</div></details>` : ""}
      </div>
    </div>`;
  };

  const eduHtml = parsed.education.map((e) =>
    `<div class="ir-item">${esc([e.school, e.degree].filter(Boolean).join(" — ")) || "(entry)"}${e.date ? ` <span class="muted">(${esc(e.date)})</span>` : ""}</div>`).join("");
  const skillsHtml = `<div class="ir-chips">${parsed.skills.map((s) => `<span class="ir-chip">${esc(s)}</span>`).join("")}</div>`;
  const entryHtml = (entries) => entries.map((e) =>
    `<div class="ir-item"><strong>${esc(e.title || "(untitled)")}</strong>${e.date ? ` <span class="muted">${esc(e.date)}</span>` : ""}${e.location ? ` <span class="muted">${esc(e.location)}</span>` : ""}${e.bullets.length ? `<ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}</div>`).join("");
  const certHtml = parsed.certifications.map((c) => `<div class="ir-item">${esc(c)}</div>`).join("");

  // Surface sections we detected but have no standard home for, so nothing is
  // lost silently. Each gets a destination dropdown (pre-set to a smart guess)
  // so its content can be routed into a real section or skipped.
  const DEST_OPTIONS = [["skip", "Skip"], ["skills", "Skills"], ["experience", "Experience"], ["projects", "Projects"], ["certifications", "Certifications"]];
  const otherHtml = (parsed.other && parsed.other.length) ? `
    <div class="import-other">
      <div class="import-other-h">OTHER SECTIONS WE FOUND</div>
      <div class="import-other-note">These don't match a standard section. Pick where each should go &mdash; we've guessed a destination, but you can change it or skip it.</div>
      ${parsed.other.map((o, idx) => {
        const suggested = RcParse.suggestDestination(o.title);
        const opts = DEST_OPTIONS.map(([v, l]) => `<option value="${v}"${v === suggested ? " selected" : ""}>${l}</option>`).join("");
        return `
        <div class="ir-other-row">
          <details class="ir-details ir-other">
            <summary><span class="count">${o.lines.length}</span> ${esc(o.title)}</summary>
            <div class="ir-detail-body">${o.lines.map((l) => `<div class="ir-item">${esc(l)}</div>`).join("")}</div>
          </details>
          <label class="ir-route">Import as <select data-other-idx="${idx}" aria-label="Import ${esc(o.title)} as">${opts}</select></label>
        </div>`;
      }).join("")}
    </div>` : "";

  $("#import-preview").innerHTML = `
    <div class="import-source">SOURCE: <span class="amber">${esc(sourceName)}</span></div>
    ${fieldRow("name", "NAME", h.name)}
    ${fieldRow("email", "EMAIL", h.email)}
    ${fieldRow("phone", "PHONE", h.phone)}
    ${fieldRow("location", "LOCATION", h.location)}
    ${fieldRow("linkedin", "LINKEDIN", h.linkedin)}
    ${summaryRow()}
    ${sectionRow("education", "EDUCATION", parsed.education.length, parsed.education.length === 1 ? "entry" : "entries", eduHtml)}
    ${sectionRow("skills", "SKILLS", parsed.skills.length, "items", skillsHtml)}
    ${sectionRow("projects", "PROJECTS", parsed.projects.length, parsed.projects.length === 1 ? "block" : "blocks", entryHtml(parsed.projects))}
    ${sectionRow("experience", "WORK EXPERIENCE", parsed.experience.length, parsed.experience.length === 1 ? "position" : "positions", entryHtml(parsed.experience))}
    ${sectionRow("certifications", "CERTIFICATIONS", parsed.certifications.length, "items", certHtml)}
    ${otherHtml}
  `;
  $("#import-modal-bg").classList.add("show");
}

function closeImportModal() {
  $("#import-modal-bg").classList.remove("show");
}

function applyImport() {
  if (!_pendingImport) { closeImportModal(); return; }
  const enabled = {};
  $$("#import-preview input[type='checkbox']").forEach(cb => {
    enabled[cb.dataset.importKey] = cb.checked && !cb.disabled;
  });
  // Pick up any inline edits the user made to the contact/summary fields.
  const edited = {};
  $$("#import-preview [data-import-field]").forEach(inp => {
    edited[inp.dataset.importField] = inp.value.trim();
  });

  const p = _pendingImport;
  if (enabled.name) state.name = edited.name;
  if (enabled.email) state.email = edited.email;
  if (enabled.phone) state.phone = edited.phone;
  if (enabled.location) state.location = edited.location;
  if (enabled.linkedin) state.linkedin = edited.linkedin;
  if (enabled.summary) state.summary = edited.summary;

  // Mirror imported contact fields into demo_2's two contact lines.
  if (enabled.location || enabled.phone) {
    const line1 = [state.location, state.phone].filter(Boolean).join(" | ");
    if (line1) state.contact_line1 = line1;
  }
  if (enabled.email || enabled.linkedin) {
    const line2 = [state.email, state.linkedin].filter(Boolean).join(" | ");
    if (line2) state.contact_line2 = line2;
  }

  if (enabled.education && p.education.length) {
    state.education = p.education.map(e => ({
      school: e.school || "",
      city: e.city || "",
      degree: e.degree || "",
      date: e.date || "",
      subline_bold: "",
      subline_rest: "",
      coursework: "",
    }));
  }

  // Combine each destination's imported content with any "other" sections the
  // user routed into it (see the routing dropdowns in the modal).
  const skillsList = enabled.skills ? p.skills.slice() : [];
  const experienceList = enabled.experience ? p.experience.slice() : [];
  const projectsList = enabled.projects ? p.projects.slice() : [];
  const certList = enabled.certifications ? p.certifications.slice() : [];
  $$("#import-preview select[data-other-idx]").forEach(sel => {
    const o = p.other && p.other[+sel.dataset.otherIdx];
    if (!o) return;
    switch (sel.value) {
      case "skills": skillsList.push(...RcParse.parseSkills(o.lines)); break;
      case "experience": experienceList.push(...RcParse.parseEntryBlocks(o.lines)); break;
      case "projects": projectsList.push(...RcParse.parseEntryBlocks(o.lines)); break;
      case "certifications":
        certList.push(...o.lines.map(l => l.replace(RcParse.BULLET_RE, "").trim()).filter(Boolean));
        break;
      // "skip": leave the section out entirely.
    }
  });

  if (skillsList.length) {
    const seen = new Set();
    const skills = skillsList.filter(s => { const k = s.toLowerCase(); return s && !seen.has(k) && seen.add(k); });
    state.skills_categories = [{ label: "Technical", content: skills.join(", ") }];
    state.skills_inline = skills.join(" │ ");
    state.skills_two_column = [];
    for (let i = 0; i < skills.length; i += 2) {
      state.skills_two_column.push({ left: skills[i] || "", right: skills[i + 1] || "" });
    }
  }

  if (projectsList.length) {
    state.projects = projectsList.map(pr => ({
      title: pr.title || "",
      date: pr.date || "",
      location: pr.location || "",
      bullets: pr.bullets.length ? pr.bullets : [""],
    }));
    state.section_enabled.projects = true;
  }

  if (experienceList.length) {
    state.experience = experienceList.map(e => ({
      title: e.title || "",
      date: e.date || "",
      location: e.location || "",
      company_city: e.location || "",
      bullets: e.bullets.length ? e.bullets : [""],
    }));
    state.section_enabled.experience = true;
  }

  if (certList.length) {
    state.certifications = certList;
  }

  _pendingImport = null;
  deepStripEmDashes(state);
  closeImportModal();
  $("#intake-card").classList.add("collapsed");
  $("#import-paste").value = "";
  render();
  toast("IMPORT APPLIED");
}

// Library backup restore: read the chosen JSON and hand it to the library.
$("#library-restore-file").addEventListener("change", async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (file) applyLibraryBackup(await file.text());
  ev.target.value = "";
});

// File input + dropzone wiring (DOM is ready: app.js is deferred)
$("#import-file").addEventListener("change", async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (file) await handleImportFile(file);
  ev.target.value = "";
});

// ─────────────────────────────────────────────────────────
// CAMERA SCAN (phase 7)
// Captures a photo via the system camera. Tries the in-browser TextDetector
// when available (Chrome on Android); otherwise leans on the OS's built-in
// text-recognition (iOS Live Text / Google Lens) by showing the image
// inline and telling the user to long-press → copy → paste.
// ─────────────────────────────────────────────────────────

const cameraInput = $("#camera-input");
if (cameraInput) {
  cameraInput.addEventListener("change", async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (file) await handleCameraCapture(file);
    ev.target.value = "";
  });
}

function triggerCamera() {
  const input = $("#camera-input");
  if (!input) return;
  // Make the intake card visible if the user invoked from elsewhere.
  $("#intake-card").classList.remove("collapsed");
  input.click();
}

async function handleCameraCapture(file) {
  const preview = $("#camera-preview");
  const status = $("#cp-status");
  const img = $("#cp-image");
  const help = $("#cp-help");
  if (!preview || !status || !img || !help) return;

  const objectUrl = URL.createObjectURL(file);
  img.src = objectUrl;
  preview.classList.remove("hidden");
  status.className = "cp-status";
  status.textContent = "Reading image…";
  help.innerHTML = "";

  // Path A: in-browser TextDetector (Chrome on Android, behind no flag).
  if (typeof window.TextDetector === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      const detector = new window.TextDetector();
      const blocks = await detector.detect(bitmap);
      const text = blocks.map((b) => b.rawValue || "").join("\n").trim();
      if (text) {
        status.className = "cp-status ok";
        status.textContent = "TEXT DETECTED — REVIEW AND PARSE";
        const paste = $("#import-paste");
        if (paste) {
          paste.value = text;
          paste.focus();
        }
        help.innerHTML = `Edit the extracted text above if anything looks off, then tap <strong>▶ PARSE PASTED TEXT</strong>.`;
        return;
      }
      // Fall through to manual path if nothing was extracted.
    } catch (_err) {
      // Detector unavailable on this device — fall through to manual flow.
    }
  }

  // Path B: lean on the OS's built-in text recognition.
  status.className = "cp-status";
  status.textContent = "USE YOUR PHONE'S TEXT RECOGNITION";
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  if (isIOS) {
    help.innerHTML = `On iOS, <strong>tap and hold</strong> on text in the image above → <strong>Select All</strong> → <strong>Copy</strong>, then paste into the text box below.`;
  } else if (isAndroid) {
    help.innerHTML = `On Android, <strong>long-press</strong> the image → open in <strong>Google Lens</strong> or <strong>Photos</strong> → copy the text, then paste into the text box below.`;
  } else {
    help.innerHTML = `Open the image in your OS's photo viewer, copy the recognized text (most modern OSes do this automatically), and paste into the text box below.`;
  }
}

(() => {
  const dz = $("#dropzone");
  if (!dz) return;
  ["dragenter", "dragover"].forEach(t => dz.addEventListener(t, (e) => {
    e.preventDefault();
    dz.classList.add("drag-over");
  }));
  ["dragleave", "dragend"].forEach(t => dz.addEventListener(t, () => dz.classList.remove("drag-over")));
  dz.addEventListener("drop", async (e) => {
    e.preventDefault();
    dz.classList.remove("drag-over");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) await handleImportFile(file);
  });
  // Stop the browser from opening a file dropped outside the dropzone.
  ["dragover", "drop"].forEach(t => window.addEventListener(t, (e) => {
    if (e.target.closest("#dropzone")) return;
    e.preventDefault();
  }));
})();

// ─────────────────────────────────────────────────────────
// JOB-DESCRIPTION MATCH (local scoring · no AI · no exaggeration)
// ─────────────────────────────────────────────────────────
//
// We tokenize the JD and resume, collapse a small synonym/phrase set, and
// compare normalized term sets. Scores are coverage of JD-weighted terms.
// Missing keywords are phrased as gaps — never as bullets to add — so the
// user can't be nudged into claiming something untrue.

const MATCH_STOPWORDS = new Set([
  "a","an","the","and","or","but","of","to","in","for","on","with","at","by","from","as","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","should","could","may","might","can","this","that","these","those","you","your","our","we","they","their","them","its","it","what","which","who","when","where","why","how","all","each","every","both","few","more","most","some","such","no","nor","not","only","own","same","than","too","very","just","also","up","out","into","over","under","again","further","then","once","here","there","any","s","t","d","ll","m","o","re","ve","y","etc","via","per","upon","across","through","within","while","whether","including","include","includes","using","use","used","work","working","worked","ability","able","strong","excellent","good","great","required","preferred","plus","candidate","candidates","role","position","applicant","applicants","job","jobs","opportunity","company","companies","team","teams","year","years","yrs","new","other","others","day","days","time","times","based","level","levels","high","low","key","best","various","multiple","one","two","three","four","five","first","second","third","please","must","need","needs","needed","want","wants","look","looking","seeking","etc","make","makes","made","provide","provides","provided","helping","help","helps","helped","ensure","ensures","ensured","support","supports","supported","including","includes","included","across","along","among","beyond","over","into","upon","under","throughout","general","overall","daily","weekly","monthly","yearly","etc","you'll","we'll","they'll","i'm","you're","we're","they're","it's","that's","there's","here's","let's","cannot","can't","won't","don't","doesn't","didn't","isn't","aren't","wasn't","weren't","hasn't","haven't","hadn't"
]);

const MATCH_SYNONYMS = {
  // Tech shorthand
  "js": "javascript", "ts": "typescript", "py": "python",
  "node": "nodejs", "nodejs": "nodejs", "k8s": "kubernetes",
  "db": "database", "ml": "machinelearning", "ai": "artificialintelligence",
  "ux": "userexperience", "ui": "userinterface",
  "pm": "projectmanagement", "qa": "qualityassurance",
  "hr": "humanresources", "ms": "microsoft", "msft": "microsoft",
  "xls": "excel", "ppt": "powerpoint", "doc": "microsoftword",
  "aws": "aws", "gcp": "googlecloud", "azure": "azure",
  "ci": "continuousintegration", "cd": "continuousdeployment",
  // Verb forms → canonical root
  "managed": "manage", "managing": "manage", "manager": "manage", "management": "manage",
  "developed": "develop", "developing": "develop", "developer": "develop", "development": "develop",
  "led": "lead", "leading": "lead", "leader": "lead", "leadership": "lead",
  "communicated": "communicate", "communicating": "communicate", "communication": "communicate", "communications": "communicate",
  "coordinated": "coordinate", "coordinating": "coordinate", "coordination": "coordinate", "coordinator": "coordinate",
  "analyzed": "analyze", "analyzing": "analyze", "analysis": "analyze", "analytical": "analyze", "analyst": "analyze", "analytics": "analyze",
  "organized": "organize", "organizing": "organize", "organization": "organize", "organizational": "organize",
  "trained": "train", "training": "train", "trainer": "train",
  "presented": "present", "presenting": "present", "presentation": "present", "presentations": "present",
  "designed": "design", "designing": "design", "designer": "design",
  "built": "build", "building": "build", "builder": "build",
  "created": "create", "creating": "create", "creation": "create", "creator": "create", "creative": "create",
  "implemented": "implement", "implementing": "implement", "implementation": "implement",
  "delivered": "deliver", "delivering": "deliver", "delivery": "deliver",
  "researched": "research", "researching": "research", "researcher": "research",
  "documented": "document", "documenting": "document", "documentation": "document",
  "scheduled": "schedule", "scheduling": "schedule",
  "negotiated": "negotiate", "negotiating": "negotiate", "negotiation": "negotiate",
  "collaborated": "collaborate", "collaborating": "collaborate", "collaboration": "collaborate", "collaborative": "collaborate",
  "operated": "operate", "operating": "operate", "operation": "operate", "operations": "operate", "operational": "operate",
  "marketed": "marketing", "marketed": "marketing",
  "sales": "sale", "selling": "sale", "sold": "sale",
  "served": "serve", "serving": "serve", "service": "serve", "services": "serve",
  "supports": "support", "supporting": "support", "supported": "support",
  "clients": "client", "customers": "customer",
  "events": "event",
};

// Multi-word phrases collapsed pre-tokenization so they survive as single terms.
const MATCH_PHRASES = [
  ["project management", "projectmanagement"],
  ["product management", "productmanagement"],
  ["account management", "accountmanagement"],
  ["operations management", "operationsmanagement"],
  ["records management", "recordsmanagement"],
  ["time management", "timemanagement"],
  ["customer service", "customerservice"],
  ["client service", "customerservice"],
  ["data entry", "dataentry"],
  ["data analysis", "dataanalysis"],
  ["data analytics", "dataanalysis"],
  ["business administration", "businessadministration"],
  ["business operations", "businessoperations"],
  ["business development", "businessdevelopment"],
  ["social media", "socialmedia"],
  ["digital marketing", "digitalmarketing"],
  ["content creation", "contentcreation"],
  ["content marketing", "contentmarketing"],
  ["event planning", "eventplanning"],
  ["event coordination", "eventcoordination"],
  ["event management", "eventmanagement"],
  ["public speaking", "publicspeaking"],
  ["problem solving", "problemsolving"],
  ["critical thinking", "criticalthinking"],
  ["team work", "teamwork"],
  ["team building", "teambuilding"],
  ["team coordination", "teamcoordination"],
  ["user experience", "userexperience"],
  ["user interface", "userinterface"],
  ["machine learning", "machinelearning"],
  ["artificial intelligence", "artificialintelligence"],
  ["quality assurance", "qualityassurance"],
  ["human resources", "humanresources"],
  ["microsoft office", "microsoftoffice"],
  ["microsoft excel", "microsoftexcel"],
  ["microsoft word", "microsoftword"],
  ["microsoft powerpoint", "microsoftpowerpoint"],
  ["google workspace", "googleworkspace"],
  ["google docs", "googledocs"],
  ["google sheets", "googlesheets"],
  ["google drive", "googledrive"],
  ["power bi", "powerbi"],
  ["power point", "powerpoint"],
  ["front desk", "frontdesk"],
  ["administrative support", "administrativesupport"],
  ["office operations", "officeoperations"],
  ["calendar management", "calendarmanagement"],
  ["document preparation", "documentpreparation"],
  ["vendor management", "vendormanagement"],
  ["relationship building", "relationshipbuilding"],
  ["written communication", "writtencommunication"],
  ["verbal communication", "verbalcommunication"],
  ["bilingual", "bilingual"],
];

const MATCH_PHRASE_DISPLAY = Object.fromEntries(MATCH_PHRASES.map(([p, n]) => [n, p]));

function matchPreprocess(text) {
  if (!text) return "";
  let s = " " + text.toLowerCase() + " ";
  for (const [phrase, repl] of MATCH_PHRASES) {
    if (s.includes(phrase)) s = s.split(phrase).join(repl);
  }
  return s;
}

function normalizeTerm(token) {
  // Collapsed phrases ("dataanalysis", "humanresources") are already canonical —
  // don't strip suffixes from them or the display lookup breaks.
  if (MATCH_PHRASE_DISPLAY[token]) return token;
  if (MATCH_SYNONYMS[token]) return MATCH_SYNONYMS[token];
  let t = token;
  if (t.length > 5 && t.endsWith("ing")) t = t.slice(0, -3);
  else if (t.length > 4 && t.endsWith("ies")) t = t.slice(0, -3) + "y";
  else if (t.length > 4 && t.endsWith("ed")) t = t.slice(0, -2);
  else if (t.length > 4 && t.endsWith("es")) t = t.slice(0, -2);
  else if (t.length > 3 && t.endsWith("s")) t = t.slice(0, -1);
  if (MATCH_SYNONYMS[t]) return MATCH_SYNONYMS[t];
  return t;
}

function extractMatchTerms(text) {
  const set = new Set();
  const freq = new Map();
  const surface = new Map();
  if (!text || !text.trim()) return { set, freq, surface };
  const pre = matchPreprocess(text);
  const raws = pre.split(/[\s,;:.\/()\[\]{}<>!?"'`~=*•|·–—\-]+/);
  for (const raw of raws) {
    const cleaned = raw.replace(/^[^a-z0-9+#]+|[^a-z0-9+#.]+$/g, "");
    if (!cleaned || cleaned.length < 3) continue;
    if (/^\d+$/.test(cleaned)) continue;
    if (MATCH_STOPWORDS.has(cleaned)) continue;
    const n = normalizeTerm(cleaned);
    if (!n || n.length < 3 || MATCH_STOPWORDS.has(n)) continue;
    set.add(n);
    freq.set(n, (freq.get(n) || 0) + 1);
    if (!surface.has(n)) {
      surface.set(n, MATCH_PHRASE_DISPLAY[n] || cleaned);
    }
  }
  return { set, freq, surface };
}

function resumeSectionTexts() {
  const skillsMode = tcfg().skillsMode;
  const skillsText = skillsMode === "categories"
    ? state.skills_categories.map(c => `${c.label} ${c.content}`).join(" ")
    : skillsMode === "pipe"
    ? (state.skills_inline || "")
    : state.skills_two_column.map(r => `${r.left} ${r.right}`).join(" ");
  const expText = state.section_enabled.experience
    ? state.experience.map(e => `${e.title} ${(e.bullets || []).join(" ")}`).join(" ")
    : "";
  const projText = state.section_enabled.projects
    ? state.projects.map(p => `${p.title} ${(p.bullets || []).join(" ")}`).join(" ")
    : "";
  const summaryText = state.summary || "";
  return {
    skills: skillsText,
    experience: `${expText} ${projText}`.trim(),
    summary: summaryText,
    all: `${summaryText} ${skillsText} ${expText} ${projText}`,
  };
}

function coverageScore(jdFreq, sectionSet) {
  let total = 0, matched = 0;
  for (const [term, f] of jdFreq) {
    total += f;
    if (sectionSet.has(term)) matched += f;
  }
  if (total === 0) return 0;
  return Math.round((matched / total) * 100);
}

function analyzeMatch(jd) {
  const jdT = extractMatchTerms(jd);
  if (jdT.set.size === 0) return null;
  const sections = resumeSectionTexts();
  const skillsT = extractMatchTerms(sections.skills);
  const expT = extractMatchTerms(sections.experience);
  const summaryT = extractMatchTerms(sections.summary);
  const allT = extractMatchTerms(sections.all);

  const overall = coverageScore(jdT.freq, allT.set);
  const skills = coverageScore(jdT.freq, skillsT.set);
  const experience = coverageScore(jdT.freq, expT.set);
  const summary = coverageScore(jdT.freq, summaryT.set);

  // Missing: in JD but not in resume; rank by JD frequency.
  const missing = [];
  for (const [term, f] of jdT.freq) {
    if (!allT.set.has(term)) missing.push({ term, surface: jdT.surface.get(term) || term, freq: f });
  }
  missing.sort((a, b) => b.freq - a.freq || a.term.localeCompare(b.term));

  return {
    jdSet: jdT.set,
    jdTermCount: jdT.set.size,
    overall, skills, experience, summary,
    missing,
  };
}

function countTermHits(text, jdSet) {
  if (!text || !jdSet || jdSet.size === 0) return 0;
  const { set } = extractMatchTerms(text);
  let hits = 0;
  for (const t of set) if (jdSet.has(t)) hits++;
  return hits;
}

function bulletClass(hits, hotMin, warmMin) {
  if (hits >= hotMin) return "bullet-hot";
  if (hits >= warmMin) return "bullet-warm";
  return "bullet-cold";
}

function applyHeatMap(ctx) {
  const frames = $$("#preview .preview-frame");
  if (!ctx) {
    frames.forEach(f => f.classList.remove("match-mode"));
    $$("#preview .bullet-hot, #preview .bullet-warm, #preview .bullet-cold").forEach(el => {
      el.classList.remove("bullet-hot", "bullet-warm", "bullet-cold");
    });
    return;
  }
  frames.forEach(f => f.classList.add("match-mode"));
  $$("#preview .bullets-list li").forEach(li => {
    const hits = countTermHits(li.textContent, ctx.jdSet);
    li.classList.remove("bullet-hot", "bullet-warm", "bullet-cold");
    li.classList.add(bulletClass(hits, 2, 1));
  });
  $$("#preview .skill-cat").forEach(el => {
    const hits = countTermHits(el.textContent, ctx.jdSet);
    el.classList.remove("bullet-hot", "bullet-warm", "bullet-cold");
    el.classList.add(bulletClass(hits, 2, 1));
  });
  $$("#preview .skills-2col > *").forEach(el => {
    const hits = countTermHits(el.textContent, ctx.jdSet);
    el.classList.remove("bullet-hot", "bullet-warm", "bullet-cold");
    el.classList.add(hits >= 1 ? "bullet-hot" : "bullet-cold");
  });
}

function verdictFor(score, missingCount) {
  if (score >= 75) return `Strong match — ${missingCount} term${missingCount === 1 ? "" : "s"} from the JD not on the resume.`;
  if (score >= 55) return `Solid match — ${missingCount} key term${missingCount === 1 ? "" : "s"} missing. Worth tailoring.`;
  if (score >= 35) return `Partial match — ${missingCount} JD term${missingCount === 1 ? "" : "s"} missing. Add only what's true.`;
  return `Low match — ${missingCount} JD term${missingCount === 1 ? "" : "s"} missing. This role may not fit yet.`;
}

function gradeTone(score) {
  if (score >= 70) return "";
  if (score >= 45) return "warn";
  return "poor";
}

function barTone(score) {
  if (score >= 70) return "";
  if (score >= 45) return "warn";
  return "poor";
}

function renderMatchUI(ctx) {
  const scoreEl = $("#match-score");
  const missingEl = $("#match-missing");
  if (!ctx) {
    scoreEl.innerHTML = `<div class="match-placeholder">Paste a job description to score the resume.</div>`;
    missingEl.classList.add("hidden");
    missingEl.innerHTML = "";
    return;
  }
  const verdict = verdictFor(ctx.overall, ctx.missing.length);
  scoreEl.innerHTML = `
    <div class="grade-card">
      <div class="grade-circle ${gradeTone(ctx.overall)}">
        <div class="grade-num">${ctx.overall}</div>
        <div class="grade-lbl">/100</div>
      </div>
      <div class="grade-verdict">
        <div class="verdict-text">${esc(verdict)}</div>
        <div class="subscores">
          ${subscoreRow("SKILLS", ctx.skills)}
          ${subscoreRow("EXPERIENCE", ctx.experience)}
          ${subscoreRow("SUMMARY", ctx.summary)}
        </div>
      </div>
    </div>
  `;

  if (ctx.missing.length === 0) {
    missingEl.classList.remove("hidden");
    missingEl.innerHTML = `<div class="match-h">MISSING KEYWORDS</div><div class="missing-empty">▶ NO GAPS — every JD term shows up somewhere on the resume.</div>`;
    return;
  }
  const top = ctx.missing.slice(0, 16);
  const overflow = ctx.missing.length - top.length;
  const chips = top.map((m, i) => {
    const cls = i < 8 ? "missing-chip" : "missing-chip weak";
    return `<span class="${cls}">${esc(m.surface)}</span>`;
  }).join("");
  const more = overflow > 0 ? `<span class="missing-chip weak">+${overflow} more</span>` : "";
  missingEl.classList.remove("hidden");
  missingEl.innerHTML = `
    <div class="match-h">MISSING KEYWORDS <span class="match-note">found in JD, not on resume — add only if true</span></div>
    <div class="missing-list">${chips}${more}</div>
  `;
}

function widthBucket(pct) {
  // Round to nearest 5% so we can drive bar widths via CSS classes (no inline styles).
  const clamped = Math.max(0, Math.min(100, pct));
  return Math.round(clamped / 5) * 5;
}

function subscoreRow(label, pct) {
  const w = widthBucket(pct);
  return `
    <div class="subscore">
      <span class="lbl">${label}</span>
      <div class="bar"><span class="bar-fill w-${w} ${barTone(pct)}"></span></div>
      <span class="pct">${pct}</span>
    </div>
  `;
}

function runMatch() {
  if (!state.match.on) {
    applyHeatMap(null);
    return;
  }
  const ctx = state.match.jd.trim() ? analyzeMatch(state.match.jd) : null;
  applyHeatMap(ctx);
  renderMatchUI(ctx);
}

function toggleMatch() {
  state.match.on = !state.match.on;
  const chip = $("#match-chip");
  const chipText = $("#match-chip-text");
  const toolbar = $("#preview-toolbar");
  const panel = $("#match-panel");
  const missing = $("#match-missing");
  chip.setAttribute("aria-pressed", state.match.on ? "true" : "false");
  if (chipText) chipText.textContent = state.match.on ? "EXIT MATCH MODE" : "MATCH JOB DESCRIPTION";
  toolbar.classList.toggle("match-active", state.match.on);
  panel.classList.toggle("hidden", !state.match.on);
  if (!state.match.on) {
    missing.classList.add("hidden");
    missing.innerHTML = "";
  }
  runMatch();
  if (state.match.on) {
    const jd = $("#jd-input");
    if (jd) setTimeout(() => jd.focus(), 60);
  }
}

ACTIONS.toggleMatch = () => toggleMatch();

let _matchDebounce = null;
$("#jd-input").addEventListener("input", (ev) => {
  state.match.jd = ev.target.value;
  clearTimeout(_matchDebounce);
  _matchDebounce = setTimeout(() => runMatch(), 200);
});

// ─────────────────────────────────────────────────────────
// MOBILE PANE SWIPE / TABS
// ─────────────────────────────────────────────────────────

(function setupPaneSwipe() {
  const shell = document.getElementById("shell");
  const tabs = document.querySelectorAll(".pane-tab");
  if (!shell || tabs.length === 0) return;

  const panes = {
    left: shell.querySelector(".pane.left"),
    right: shell.querySelector(".pane.right"),
    final: shell.querySelector(".pane.final"),
  };
  const order = ["left", "right", "final"];

  function isMobile() {
    return window.matchMedia("(max-width: 1100px)").matches;
  }

  function scrollToPane(target) {
    const pane = panes[target];
    if (!pane || !isMobile()) return;
    shell.scrollTo({ left: pane.offsetLeft, behavior: "smooth" });
  }

  function setActive(target) {
    tabs.forEach(t => {
      const on = t.dataset.paneTarget === target;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.body.classList.toggle("viewing-final", target === "final");
    if (target === "final") {
      mirrorPreviewToFinal();
      updateFinalActionState();
    }
  }

  tabs.forEach(t => {
    t.addEventListener("click", () => {
      const target = t.dataset.paneTarget;
      setActive(target);
      scrollToPane(target);
    });
  });

  let _scrollTimer = null;
  shell.addEventListener("scroll", () => {
    if (!isMobile()) return;
    clearTimeout(_scrollTimer);
    _scrollTimer = setTimeout(() => {
      const w = shell.clientWidth || 1;
      const idx = Math.max(0, Math.min(order.length - 1, Math.round(shell.scrollLeft / w)));
      setActive(order[idx]);
    }, 60);
  });

  // Expose for action handlers (e.g. "KEEP EDITING" jumps back to EDIT).
  window.__paneSwipe = { setActive, scrollToPane };
})();

// Scale the preview to fit the viewport on mobile. The frame keeps its
// desktop nominal width (612px) so the layout — title/date alignment,
// pagination, wrapping — matches the desktop view exactly; we just zoom
// the visual size to fit the phone.
const PREVIEW_NOMINAL_WIDTH = 612;
function updatePreviewScale() {
  const wrap = document.querySelector(".pane.right .preview-wrap");
  if (!wrap) return;
  const isMobile = window.matchMedia("(max-width: 1100px)").matches;
  if (!isMobile) { wrap.style.zoom = ""; return; }
  const pane = wrap.closest(".pane.right");
  const cs = pane ? getComputedStyle(pane) : null;
  const padL = cs ? parseFloat(cs.paddingLeft) : 0;
  const padR = cs ? parseFloat(cs.paddingRight) : 0;
  const available = (pane ? pane.clientWidth : window.innerWidth) - padL - padR;
  const scale = Math.min(1, available / PREVIEW_NOMINAL_WIDTH);
  wrap.style.zoom = String(scale);
}
window.addEventListener("resize", updatePreviewScale);
window.addEventListener("load", updatePreviewScale);

// ─────────────────────────────────────────────────────────
// SERVICE WORKER REGISTRATION (phase 2)
// ─────────────────────────────────────────────────────────

if ("serviceWorker" in navigator) {
  // If a SW already controls this page, a later controllerchange means a new
  // version activated — reload once so the fresh app.js/styles.css take effect
  // (otherwise users keep running stale cached shell files after a deploy).
  const hadController = !!navigator.serviceWorker.controller;
  let _swReloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || _swReloaded) return;
    _swReloaded = true;
    window.location.reload();
  });
  // Defer registration to idle so it never delays first paint.
  const register = () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Registration failure is non-fatal — the app still works online.
    });
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register);
}

// ─────────────────────────────────────────────────────────
// MODAL ACCESSIBILITY
// Trap Tab focus inside the open dialog, close on Escape, and restore
// focus to the trigger on close. Wired via a class observer so the
// existing open/close helpers (which just toggle .show) stay untouched.
// ─────────────────────────────────────────────────────────

const MODAL_CLOSERS = {
  "modal-bg": closeModal,
  "import-modal-bg": closeImportModal,
  "library-modal-bg": closeLibrary,
  "share-modal-bg": closeShareModal,
};

let _modalLastFocus = null;

function modalFocusables(bg) {
  const sel = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(bg.querySelectorAll(sel)).filter((el) => el.offsetParent !== null);
}

function onModalOpened(bg) {
  _modalLastFocus = document.activeElement;
  const focusables = modalFocusables(bg);
  const target = focusables[0] || bg.querySelector(".modal");
  if (target && typeof target.focus === "function") {
    requestAnimationFrame(() => target.focus());
  }
}

function onModalClosed() {
  const last = _modalLastFocus;
  _modalLastFocus = null;
  if (last && typeof last.focus === "function" && document.contains(last)) {
    last.focus();
  }
}

function initModalA11y() {
  $$(".modal-bg").forEach((bg) => {
    let wasShown = bg.classList.contains("show");
    new MutationObserver(() => {
      const shown = bg.classList.contains("show");
      if (shown === wasShown) return;
      wasShown = shown;
      if (shown) onModalOpened(bg);
      else onModalClosed();
    }).observe(bg, { attributes: true, attributeFilter: ["class"] });
  });

  document.addEventListener("keydown", (ev) => {
    const bg = document.querySelector(".modal-bg.show");
    if (!bg) return;
    if (ev.key === "Escape") {
      ev.preventDefault();
      const closer = MODAL_CLOSERS[bg.id];
      if (closer) closer();
      else bg.classList.remove("show");
      return;
    }
    if (ev.key !== "Tab") return;
    const focusables = modalFocusables(bg);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (ev.shiftKey && (active === first || !bg.contains(active))) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && (active === last || !bg.contains(active))) {
      ev.preventDefault();
      first.focus();
    }
  });
}

// ─────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────

// Apply the saved theme before the first render so users don't see a flash
// of the light palette when they've opted into dark mode.
applySavedTheme();
restoreState();
render();
updatePreviewScale();
initModalA11y();
initOnboarding();
initCameraCapabilityNote();
