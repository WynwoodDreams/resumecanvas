// ─────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────

let state = {
  template: "demo_4",
  font_pt: null, // null = use template default (12pt for D4, 11pt for D2). Manual override via font chips.
  section_enabled: { projects: true, experience: true },
  // Demo 4 header
  name: "Jane Doe",
  location: "North Miami, FL 33161",
  phone: "786-121-1112",
  email: "lurlene.carry001@mymdc.net",
  linkedin: "Linkedin.com/",
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
  if (state.template === "demo_4") {
    body.innerHTML = `
      <div class="row"><label>FULL NAME</label><input type="text" class="required" data-bind="name" value="${esc(state.name)}" placeholder="Full name"></div>
      <div class="row two">
        <div><label>LOCATION</label><input type="text" class="required" data-bind="location" value="${esc(state.location)}" placeholder="City, State ZIP"></div>
        <div><label>PHONE</label><input type="text" class="required" data-bind="phone" value="${esc(state.phone)}" placeholder="305-555-1234"></div>
      </div>
      <div class="row two">
        <div><label>EMAIL</label><input type="text" class="required" data-bind="email" value="${esc(state.email)}" placeholder="name@example.com"></div>
        <div><label>LINKEDIN</label><input type="text" data-bind="linkedin" value="${esc(state.linkedin)}" placeholder="linkedin.com/in/…"></div>
      </div>
    `;
  } else {
    body.innerHTML = `
      <div class="row"><label>FULL NAME</label><input type="text" class="required" data-bind="name" value="${esc(state.name)}" placeholder="Full name"></div>
      <div class="row"><label>CONTACT LINE 1</label><input type="text" class="required" data-bind="contact_line1" value="${esc(state.contact_line1)}" placeholder="Miami, FL | (305) 555-1234"><div class="help">Free-form. Will appear as the first contact line.</div></div>
      <div class="row"><label>CONTACT LINE 2</label><input type="text" class="required" data-bind="contact_line2" value="${esc(state.contact_line2)}" placeholder="email | LinkedIn URL | site"><div class="help">Free-form. Second contact line. Can hold email + LinkedIn + portfolio.</div></div>
    `;
  }
  bind(body);
}

function renderSummary() {
  $("#summary").value = state.summary || "";
}

function renderEducation() {
  const body = $("#body-education");
  const eduSchemaIsDemo2 = state.template === "demo_2";
  body.innerHTML = state.education.map((e, i) => {
    const extra = eduSchemaIsDemo2 ? `
      <div class="row"><label>SUB-LINE — BOLD PORTION (optional)</label><input type="text" data-edu="${i}" data-field="subline_bold" value="${esc(e.subline_bold || "")}" placeholder="e.g. Associate of Arts, Economics"><div class="help">Appears bold at start of a second line. Use for a secondary degree at the same school.</div></div>
      <div class="row"><label>SUB-LINE — REST (optional)</label><input type="text" data-edu="${i}" data-field="subline_rest" value="${esc(e.subline_rest || "")}" placeholder=" | Minor in Economy | Honors"><div class="help">Plain continuation. Include leading space and separator.</div></div>
      <div class="row"><label>RELEVANT COURSEWORK (optional)</label><input type="text" data-edu="${i}" data-field="coursework" value="${esc(e.coursework || "")}" placeholder="SQL, Tableau, Power BI, ..."></div>
    ` : "";
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
  if (state.template === "demo_4") {
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
  body.innerHTML = state.projects.map((p, i) => {
    const dateLocFields = state.template === "demo_4" ? `
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
        <div class="row"><label>BULLETS</label>
          <div class="bullets" id="proj-bullets-${i}">
            ${(p.bullets || []).map((b, bi) => `
              <div class="bullet-row">
                <textarea data-proj-bullet="${i}" data-bullet-i="${bi}">${esc(b)}</textarea>
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
function addEdu() { state.education.push({ school: "", city: "", degree: "", date: "", subline_bold: "", subline_rest: "", coursework: "" }); render(); }
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

const ACTIONS = {
  addSkillCat: () => addSkillCat(),
  removeSkillCat: (btn) => removeSkillCat(+btn.dataset.index),
  addSkillRow: () => addSkillRow(),
  removeSkillRow: (btn) => removeSkillRow(+btn.dataset.index),
  addCert: () => addCert(),
  removeCert: (btn) => removeCert(+btn.dataset.index),
  addEdu: () => addEdu(),
  removeEdu: (btn) => removeEdu(+btn.dataset.index),
  addProject: () => addProject(),
  removeProject: (btn) => removeProject(+btn.dataset.index),
  addProjBullet: (btn) => addProjBullet(+btn.dataset.index),
  removeProjBullet: (btn) => removeProjBullet(+btn.dataset.index, +btn.dataset.bulletIndex),
  addExperience: () => addExperience(),
  removeExp: (btn) => removeExp(+btn.dataset.index),
  addExpBullet: (btn) => addExpBullet(+btn.dataset.index),
  removeExpBullet: (btn) => removeExpBullet(+btn.dataset.index, +btn.dataset.bulletIndex),
  toggleSection: (btn) => toggleSection(btn.dataset.section),
  copyJSON: () => copyJSON(),
  showCompile: () => showCompile(),
  closeModal: () => closeModal(),
  copyPayloadAndPrompt: () => copyPayloadAndPrompt(),
  downloadDoc: () => downloadDoc(),
  printPDF: () => printPDF(),
  closeModalBackdrop: (el, ev) => { if (ev.target === el) closeModal(); },
  toggleIntake: () => $("#intake-card").classList.toggle("collapsed"),
  parseImportText: () => parseImportFromPaste(),
  applyImport: () => applyImport(),
  closeImportModal: () => closeImportModal(),
  closeImportModalBackdrop: (el, ev) => { if (ev.target === el) closeImportModal(); },
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

// ─────────────────────────────────────────────────────────
// TEMPLATE SWITCH
// ─────────────────────────────────────────────────────────

$$(".tpl-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    if (chip.dataset.tpl === state.template) return;
    state.template = chip.dataset.tpl;
    state.font_pt = null; // reset font choice on template switch — each template has its own default
    $$(".tpl-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    $$("[data-font]").forEach(c => c.classList.remove("active"));
    $("#font-chip-default").classList.add("active");
    $("#panel-certs").classList.toggle("hidden", state.template !== "demo_2");
    setCaseId();
    render();
  });
});

// Window resize re-paginates the preview at the new width.
let _resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => renderPreview(), 180);
});

// Font chip selector — manual override only
$$("[data-font]").forEach(chip => {
  chip.addEventListener("click", () => {
    $$("[data-font]").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    const v = chip.dataset.font;
    state.font_pt = v === "default" ? null : parseInt(v, 10);
    renderPreview();
  });
});

// ─────────────────────────────────────────────────────────
// LIVE PREVIEW
// ─────────────────────────────────────────────────────────

function renderPreview() {
  const tpl = state.template;
  const f = $("#preview");
  let html = `<div class="resume-name">${esc(state.name) || "—"}</div>`;
  if (tpl === "demo_4") {
    html += `<div class="resume-contact">${esc(state.location)} | ${esc(state.phone)} | ${linkify(state.email)} | ${linkify(state.linkedin)}</div>`;
  } else {
    html += `<div class="resume-contact">${linkify(state.contact_line1)}<br>${linkify(state.contact_line2)}</div>`;
    html += `<div class="resume-contact-divider"></div>`;
  }

  // Profile Summary
  html += `<div class="resume-section-h">PROFILE SUMMARY</div>`;
  html += `<div>${linkify(state.summary)}</div>`;

  if (tpl === "demo_2") {
    // Demo 2: skills section comes BEFORE education
    html += `<div class="resume-section-h">HIGHLIGHTED SKILLS</div>`;
    html += `<ul class="skills-2col">`;
    state.skills_two_column.forEach(r => {
      const left = r.left ? `<li class="left">${esc(r.left)}</li>` : `<li></li>`;
      const right = r.right ? `<div>• ${esc(r.right)}</div>` : `<div></div>`;
      html += left + right;
    });
    html += `</ul>`;
  }

  // Education
  html += `<div class="resume-section-h">EDUCATION</div>`;
  state.education.forEach((e, idx) => {
    const gapClass = idx > 0 ? " edu-gap" : "";
    if (tpl === "demo_4") {
      html += `<div class="edu-row${gapClass}"><div class="strong">${esc(e.school)}</div><div class="strong">${esc(e.city)}</div></div>`;
      html += `<div class="edu-row"><div>${esc(e.degree)}</div><div>${esc(e.date)}</div></div>`;
    } else {
      html += `<div class="edu-row${gapClass}"><div class="strong">${esc(e.school)}</div><div>${esc(e.city)}</div></div>`;
      html += `<div class="edu-degree-row"><div>${esc(e.degree)}</div><div>${esc(e.date)}</div></div>`;
      if (e.subline_bold || e.subline_rest) {
        html += `<div class="edu-subline"><span class="bold">${esc(e.subline_bold)}</span>${linkify(e.subline_rest)}</div>`;
      }
      if (e.coursework) {
        html += `<div class="edu-coursework"><span class="bold">Relevant Coursework: </span>${linkify(e.coursework)}</div>`;
      }
    }
  });

  if (tpl === "demo_4") {
    // Demo 4: skills come AFTER education
    html += `<div class="resume-section-h">SKILLS</div>`;
    state.skills_categories.forEach(c => {
      html += `<div class="skill-cat"><span class="lbl">${esc(c.label)}:</span> ${esc(c.content)}</div>`;
    });
  } else {
    // Demo 2 certifications
    html += `<div class="resume-section-h">CERTIFICATIONS</div>`;
    html += `<ul class="bullets-list">`;
    state.certifications.forEach(c => { html += `<li>${linkify(c)}</li>`; });
    html += `</ul>`;
  }

  // Projects
  if (state.section_enabled.projects && state.projects.length > 0) {
    html += `<div class="resume-section-h">PROJECTS</div>`;
    state.projects.forEach(p => {
      if (tpl === "demo_4") {
        html += `<div class="entry-title-row"><div class="title">${esc(p.title)}</div><div class="date">${esc(p.date)}</div></div>`;
        if (p.location) html += `<div class="entry-loc">${linkify(p.location)}</div>`;
      } else {
        html += `<div class="proj-title">${esc(p.title)}</div>`;
      }
      if (p.bullets && p.bullets.length) {
        html += `<ul class="bullets-list">`;
        p.bullets.forEach(b => { if (b) html += `<li>${linkify(b)}</li>`; });
        html += `</ul>`;
      }
    });
  }

  // Work Experience
  if (state.section_enabled.experience && state.experience.length > 0) {
    html += `<div class="resume-section-h">WORK EXPERIENCE</div>`;
    state.experience.forEach(en => {
      html += `<div class="entry-title-row"><div class="title">${esc(en.title)}</div><div class="date">${esc(en.date)}</div></div>`;
      if (tpl === "demo_4") {
        if (en.location) html += `<div class="entry-loc">${linkify(en.location)}</div>`;
      } else {
        if (en.company_city) html += `<div class="exp-company">${linkify(en.company_city)}</div>`;
      }
      if (en.bullets && en.bullets.length) {
        html += `<ul class="bullets-list">`;
        en.bullets.forEach(b => { if (b) html += `<li>${linkify(b)}</li>`; });
        html += `</ul>`;
      }
    });
  }

  const defaultFontPt = tpl === "demo_4" ? 12 : 11;
  const fontPt = state.font_pt || defaultFontPt;
  state._appliedFontPt = fontPt;

  // Render content into a single frame, then paginate by measuring children.
  const frameClass = `preview-frame ${tpl} font-${fontPt}`;
  f.innerHTML = `<div class="${frameClass}">${html}</div>`;
  const pageCount = paginatePreview(frameClass);

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
}

// Measures the first .preview-frame inside #preview and, if its content
// would overflow one page, splits its children into stacked frames.
// Returns the resulting page count.
function paginatePreview(frameClass) {
  const wrap = $("#preview");
  const firstFrame = wrap.firstElementChild;
  if (!firstFrame) return 0;

  // Page content area: aspect-ratio gives us paper-shaped frame height;
  // subtract vertical padding (22 top + 36 bottom = 58px from .preview-frame).
  const paperH = firstFrame.clientHeight;
  const pageContentH = paperH - 58;
  // Guard against pre-layout race (clientHeight 0) — leave as one page.
  if (paperH <= 0 || pageContentH <= 0) return 1;
  if (firstFrame.scrollHeight <= paperH + 1) return 1; // fits on one page

  // Measure each top-level child while still in the live frame.
  const children = Array.from(firstFrame.children);
  const measured = children.map(node => {
    const cs = getComputedStyle(node);
    const mt = parseFloat(cs.marginTop) || 0;
    const mb = parseFloat(cs.marginBottom) || 0;
    return { node, h: node.offsetHeight + mt + mb };
  });

  const pages = [[]];
  let pageH = 0;
  for (const item of measured) {
    const nextH = pageH + item.h;
    if (nextH > pageContentH && pages[pages.length - 1].length > 0) {
      const last = pages[pages.length - 1];
      // Don't strand a section header at the bottom of a page — push it forward.
      const tail = last[last.length - 1];
      if (tail && tail.node.classList.contains("resume-section-h")) {
        last.pop();
        pages.push([tail]);
        pageH = tail.h;
      } else {
        pages.push([]);
        pageH = 0;
      }
    }
    pages[pages.length - 1].push(item);
    pageH += item.h;
  }

  wrap.innerHTML = "";
  pages.forEach((page, i) => {
    if (i > 0) {
      const label = document.createElement("div");
      label.className = "page-label";
      label.innerHTML = `<span>▸ PAGE ${i + 1}</span>`;
      wrap.appendChild(label);
    }
    const frame = document.createElement("div");
    frame.className = frameClass;
    page.forEach(item => frame.appendChild(item.node));
    wrap.appendChild(frame);
  });
  return pages.length;
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

function render() {
  renderHeader();
  renderSummary();
  renderEducation();
  renderSkills();
  if (state.template === "demo_2") renderCerts();
  renderProjects();
  renderExperience();
  applySectionToggleStates();
  recomputeSectionIndices();
  setCaseId();
  renderPreview();
}

// ─────────────────────────────────────────────────────────
// PAYLOAD / EXPORT
// ─────────────────────────────────────────────────────────


function slugFileName(name) {
  const slug = (name || "resume")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "resume";
}

function buildExportDocument() {
  renderPreview();
  const title = esc(state.name || "Resume");
  const fontPt = state._appliedFontPt || (state.template === "demo_4" ? 12 : 11);
  // Flatten the paginated frames back into one content flow — Word repaginates
  // at its own page size; preview pixel breaks don't translate.
  const frames = $("#preview").querySelectorAll(".preview-frame");
  const combined = Array.from(frames).map(f => f.innerHTML).join("\n");
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page { size: Letter; margin: 0.5in; }
  body { margin: 0; background: #fff; color: #020826; }
  .preview-frame { font-family: Georgia, serif; line-height: 1.45; font-size: ${fontPt}pt; color: #020826; }
  .resume-name { text-align: center; font-weight: 700; margin: 0 0 3px 0; line-height: 1.1; font-size: ${state.template === "demo_4" ? "20pt" : "16pt"}; }
  .resume-contact { text-align: center; font-size: 9pt; padding-bottom: 4px; border-bottom: 0.5pt solid #c8b89f; margin-bottom: 8px; line-height: 1.35; }
  .demo_2 .resume-contact { border-bottom: none; }
  .resume-contact-divider { border-bottom: 0.5pt solid #c8b89f; margin: 2px 0 8px 0; }
  .resume-section-h { font-weight: 700; padding-bottom: 2px; border-bottom: 0.5pt solid #c8b89f; margin: 12px 0 6px 0; }
  .demo_2 .resume-section-h { font-variant: small-caps; letter-spacing: 0.04em; }
  .edu-row, .entry-title-row, .edu-degree-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .entry-title-row { margin: 8px 0 2px 0; }
  .title, .date, .strong, .bold, .lbl { font-weight: 700; }
  .date { white-space: nowrap; }
  .entry-loc { font-style: italic; margin: 0 0 4px 0; font-size: 0.95em; }
  .bullets-list { margin: 2px 0 0 0; padding-left: 18px; }
  .bullets-list li { margin: 2px 0; }
  .skill-cat { margin: 4px 0; }
  .skills-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; padding-left: 18px; margin: 4px 0; }
  .edu-gap { margin-top: 8px; }
  .proj-title { font-weight: 700; margin: 6px 0 2px 0; }
</style>
</head>
<body>
<div class="preview-frame ${state.template}">${combined}</div>
</body>
</html>`;
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.className = "hidden";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function downloadDoc() {
  const filename = `${slugFileName(state.name)}-${state.template}.doc`;
  downloadBlob(buildExportDocument(), filename, "application/msword;charset=utf-8");
  toast("DOC DOWNLOADED");
}

function printPDF() {
  renderPreview();
  toast("PRINT DIALOG OPENING");
  setTimeout(() => window.print(), 100);
}

function buildPayload() {
  const tpl = state.template;
  const out = { name: state.name, summary: state.summary, font_pt: state._appliedFontPt || (tpl === "demo_4" ? 12 : 11) };
  if (tpl === "demo_4") {
    out.location = state.location;
    out.phone = state.phone;
    out.email = state.email;
    out.linkedin = state.linkedin;
    out.education = state.education
      .filter(e => e.school || e.degree)
      .map(e => ({ school: e.school, city: e.city, degree: e.degree, date: e.date }));
    out.skills_categories = state.skills_categories.filter(c => c.label || c.content);
    out.projects = state.section_enabled.projects
      ? state.projects.filter(p => p.title).map(p => ({
          title: p.title, date: p.date, location: p.location,
          bullets: (p.bullets || []).filter(Boolean),
        }))
      : [];
    out.experience = state.section_enabled.experience
      ? state.experience.filter(e => e.title).map(e => ({
          title: e.title, date: e.date, location: e.location,
          bullets: (e.bullets || []).filter(Boolean),
        }))
      : [];
  } else {
    out.contact_line1 = state.contact_line1;
    out.contact_line2 = state.contact_line2;
    out.education = state.education
      .filter(e => e.school || e.degree)
      .map(e => ({
        school: e.school, city: e.city,
        degree: e.degree, date: e.date,
        subline_bold: e.subline_bold || "",
        subline_rest: e.subline_rest || "",
        coursework: e.coursework || "",
      }));
    out.skills_two_column = state.skills_two_column
      .filter(r => r.left || r.right)
      .map(r => ({ left: r.left || "", right_with_bullet: r.right ? `• ${r.right}` : "" }));
    out.certifications = state.certifications.filter(Boolean);
    out.projects = state.section_enabled.projects
      ? state.projects.filter(p => p.title).map(p => ({
          title: p.title,
          bullets: (p.bullets || []).filter(Boolean),
        }))
      : [];
    out.experience = state.section_enabled.experience
      ? state.experience.filter(e => e.title).map(e => ({
          title: e.title, date: e.date, company_city: e.company_city,
          bullets: (e.bullets || []).filter(Boolean),
        }))
      : [];
  }
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

function copyJSON() {
  const json = JSON.stringify(buildPayload(), null, 2);
  copyText(json, "JSON COPIED");
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
  const text = `Generate this resume using template ${tpl}:\n\n\`\`\`json\n${payload}\n\`\`\``;
  const copied = await copyText(text, "PAYLOAD + PROMPT COPIED");
  if (copied) setTimeout(() => closeModal(), 600);
}

// ─────────────────────────────────────────────────────────
// IMPORT FROM EXISTING RESUME
// ─────────────────────────────────────────────────────────

let _pendingImport = null;

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
    showImportConfirm(parseResumeText(text), file.name);
  } catch (err) {
    console.error("Import failed", err);
    toast("IMPORT FAILED — try pasting text instead");
  }
}

function parseImportFromPaste() {
  const text = $("#import-paste").value;
  if (!text.trim()) { toast("PASTE SOME TEXT FIRST"); return; }
  showImportConfirm(parseResumeText(text), "(pasted)");
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

function parseResumeText(text) {
  const rawLines = text.replace(/\r/g, "").split("\n").map(l => l.replace(/•/g, "•").replace(/\t/g, " ").trim());
  const sections = { header: [], summary: [], education: [], skills: [], projects: [], experience: [], certifications: [] };
  let current = "header";
  for (const line of rawLines) {
    const matched = SECTION_PATTERNS.find(([, re]) => re.test(line));
    if (matched) { current = matched[0]; continue; }
    sections[current].push(line);
  }

  const header = parseHeader(sections.header);
  const summary = sections.summary.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  const skills = parseSkills(sections.skills);
  const education = parseEducationBlocks(sections.education);
  const projects = parseEntryBlocks(sections.projects);
  const experience = parseEntryBlocks(sections.experience);
  const certifications = sections.certifications.filter(Boolean).map(l => l.replace(BULLET_RE, ""));

  return { header, summary, skills, education, projects, experience, certifications };
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
    cleaned.split(/[,;|·•]/).forEach(piece => {
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
  return blocks.map(block => {
    const dateLine = block.find(l => DATE_TOKEN_RE.test(l)) || "";
    const degreeLine = block.find(l => l !== dateLine && /(associate|bachelor|master|ph\.?d|degree|diploma|certificate|major|minor|gpa)/i.test(l)) || "";
    let school = block.find(l => l !== degreeLine && l !== dateLine) || block[0] || "";
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

  return blocks.map(b => {
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

function showImportConfirm(parsed, sourceName) {
  _pendingImport = parsed;
  const summarySnippet = parsed.summary.length > 180 ? parsed.summary.slice(0, 180) + "…" : parsed.summary;
  const row = (key, label, value, hasContent) => `
    <label class="import-row">
      <input type="checkbox" data-import-key="${key}" ${hasContent ? "checked" : "disabled"}>
      <div class="ir-label">${label}</div>
      <div class="ir-value">${hasContent ? esc(value) : '<span class="none">none detected</span>'}</div>
    </label>
  `;
  const count = (key, label, n, detail) => `
    <label class="import-row">
      <input type="checkbox" data-import-key="${key}" ${n > 0 ? "checked" : "disabled"}>
      <div class="ir-label">${label}</div>
      <div class="ir-value">${n > 0 ? `<span class="count">${n}</span> ${esc(detail)}` : '<span class="none">none detected</span>'}</div>
    </label>
  `;
  const h = parsed.header;
  $("#import-preview").innerHTML = `
    <div class="import-source">SOURCE: <span class="amber">${esc(sourceName)}</span></div>
    ${row("name", "NAME", h.name, !!h.name)}
    ${row("email", "EMAIL", h.email, !!h.email)}
    ${row("phone", "PHONE", h.phone, !!h.phone)}
    ${row("location", "LOCATION", h.location, !!h.location)}
    ${row("linkedin", "LINKEDIN", h.linkedin, !!h.linkedin)}
    ${row("summary", "PROFILE SUMMARY", summarySnippet, !!parsed.summary)}
    ${count("education", "EDUCATION", parsed.education.length, parsed.education.length === 1 ? "entry" : "entries")}
    ${count("skills", "SKILLS", parsed.skills.length, "items")}
    ${count("projects", "PROJECTS", parsed.projects.length, parsed.projects.length === 1 ? "block" : "blocks")}
    ${count("experience", "WORK EXPERIENCE", parsed.experience.length, parsed.experience.length === 1 ? "position" : "positions")}
    ${count("certifications", "CERTIFICATIONS", parsed.certifications.length, "items")}
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

  const p = _pendingImport;
  const h = p.header;
  if (enabled.name) state.name = h.name;
  if (enabled.email) state.email = h.email;
  if (enabled.phone) state.phone = h.phone;
  if (enabled.location) state.location = h.location;
  if (enabled.linkedin) state.linkedin = h.linkedin;
  if (enabled.summary) state.summary = p.summary;

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

  if (enabled.skills && p.skills.length) {
    state.skills_categories = [{ label: "Technical", content: p.skills.join(", ") }];
    state.skills_two_column = [];
    for (let i = 0; i < p.skills.length; i += 2) {
      state.skills_two_column.push({ left: p.skills[i] || "", right: p.skills[i + 1] || "" });
    }
  }

  if (enabled.projects) {
    if (p.projects.length) {
      state.projects = p.projects.map(pr => ({
        title: pr.title || "",
        date: pr.date || "",
        location: pr.location || "",
        bullets: pr.bullets.length ? pr.bullets : [""],
      }));
      state.section_enabled.projects = true;
    }
  }

  if (enabled.experience && p.experience.length) {
    state.experience = p.experience.map(e => ({
      title: e.title || "",
      date: e.date || "",
      location: e.location || "",
      company_city: e.location || "",
      bullets: e.bullets.length ? e.bullets : [""],
    }));
    state.section_enabled.experience = true;
  }

  if (enabled.certifications && p.certifications.length) {
    state.certifications = p.certifications;
  }

  _pendingImport = null;
  closeImportModal();
  $("#intake-card").classList.add("collapsed");
  $("#import-paste").value = "";
  render();
  toast("IMPORT APPLIED");
}

// File input + dropzone wiring (DOM is ready: app.js is deferred)
$("#import-file").addEventListener("change", async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (file) await handleImportFile(file);
  ev.target.value = "";
});

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
// INIT
// ─────────────────────────────────────────────────────────

render();
