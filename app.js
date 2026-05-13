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
    { left: "Customer Service", right_with_bullet: "• Time Management" },
    { left: "Microsoft Office Suite", right_with_bullet: "• Team Collaboration" },
    { left: "Data Entry", right_with_bullet: "• Problem Solving" },
    { left: "Social Media Management", right_with_bullet: "• Event Coordination" },
    { left: "Bilingual: English & Haitian Creole", right_with_bullet: "• Adaptable" },
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
      <div class="row"><label>FULL NAME</label><input type="text" data-bind="name" value="${esc(state.name)}"></div>
      <div class="row two">
        <div><label>LOCATION</label><input type="text" data-bind="location" value="${esc(state.location)}" placeholder="City, State ZIP"></div>
        <div><label>PHONE</label><input type="text" data-bind="phone" value="${esc(state.phone)}" placeholder="305-555-1234"></div>
      </div>
      <div class="row two">
        <div><label>EMAIL</label><input type="text" data-bind="email" value="${esc(state.email)}"></div>
        <div><label>LINKEDIN</label><input type="text" data-bind="linkedin" value="${esc(state.linkedin)}"></div>
      </div>
    `;
  } else {
    body.innerHTML = `
      <div class="row"><label>FULL NAME</label><input type="text" data-bind="name" value="${esc(state.name)}"></div>
      <div class="row"><label>CONTACT LINE 1</label><input type="text" data-bind="contact_line1" value="${esc(state.contact_line1)}" placeholder="Miami, FL | (305) 555-1234"><div class="help">Free-form. Will appear as the first contact line.</div></div>
      <div class="row"><label>CONTACT LINE 2</label><input type="text" data-bind="contact_line2" value="${esc(state.contact_line2)}" placeholder="email | LinkedIn URL | site"><div class="help">Free-form. Second contact line. Can hold email + LinkedIn + portfolio.</div></div>
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
          <div><label>SCHOOL</label><input type="text" data-edu="${i}" data-field="school" value="${esc(e.school || "")}"></div>
          <div><label>CITY</label><input type="text" data-edu="${i}" data-field="city" value="${esc(e.city || "")}"></div>
        </div>
        <div class="row two">
          <div><label>DEGREE / FIELD</label><input type="text" data-edu="${i}" data-field="degree" value="${esc(e.degree || "")}"></div>
          <div><label>DATE</label><input type="text" data-edu="${i}" data-field="date" value="${esc(e.date || "")}" placeholder="${eduSchemaIsDemo2 ? '05/2026' : 'Expected: May 2027'}"></div>
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
      <div class="help skill-help">Two-column layout. Each row pairs a left item with a right item. The right item should start with <code>•</code> if you want a bullet (matches the master).</div>
    ` + state.skills_two_column.map((r, i) => `
      <div class="item">
        <div class="item-head">
          <div class="lbl"><span class="n">${String(i+1).padStart(2,'0')}</span> ROW</div>
          <button class="icon-btn" data-action="removeSkillRow" data-index="${i}">REMOVE</button>
        </div>
        <div class="row two">
          <div><label>LEFT</label><input type="text" data-skill-row="${i}" data-field="left" value="${esc(r.left)}" placeholder="SQL, MySQL, Power BI"></div>
          <div><label>RIGHT (with • bullet)</label><input type="text" data-skill-row="${i}" data-field="right_with_bullet" value="${esc(r.right_with_bullet)}" placeholder="• Pipeline Management"></div>
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
function addSkillRow() { state.skills_two_column.push({ left: "", right_with_bullet: "" }); render(); }
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
    html += `<div class="resume-contact">${esc(state.location)} | ${esc(state.phone)} | <a href="#" class="preview-link">${esc(state.email)}</a> | <a href="#" class="preview-link">${esc(state.linkedin)}</a></div>`;
  } else {
    html += `<div class="resume-contact">${esc(state.contact_line1)}<br>${esc(state.contact_line2)}</div>`;
    html += `<div class="resume-contact-divider"></div>`;
  }

  // Profile Summary
  html += `<div class="resume-section-h">PROFILE SUMMARY</div>`;
  html += `<div>${esc(state.summary)}</div>`;

  if (tpl === "demo_2") {
    // Demo 2: skills section comes BEFORE education
    html += `<div class="resume-section-h">HIGHLIGHTED SKILLS</div>`;
    html += `<ul class="skills-2col">`;
    state.skills_two_column.forEach(r => {
      const left = r.left ? `<li class="left">${esc(r.left)}</li>` : `<li></li>`;
      const right = r.right_with_bullet ? `<div>${esc(r.right_with_bullet)}</div>` : `<div></div>`;
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
        html += `<div class="edu-subline"><span class="bold">${esc(e.subline_bold)}</span>${esc(e.subline_rest)}</div>`;
      }
      if (e.coursework) {
        html += `<div class="edu-coursework"><span class="bold">Relevant Coursework: </span>${esc(e.coursework)}</div>`;
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
    state.certifications.forEach(c => { html += `<li>${esc(c)}</li>`; });
    html += `</ul>`;
  }

  // Projects
  if (state.section_enabled.projects && state.projects.length > 0) {
    html += `<div class="resume-section-h">PROJECTS</div>`;
    state.projects.forEach(p => {
      if (tpl === "demo_4") {
        html += `<div class="entry-title-row"><div class="title">${esc(p.title)}</div><div class="date">${esc(p.date)}</div></div>`;
        if (p.location) html += `<div class="entry-loc">${esc(p.location)}</div>`;
      } else {
        html += `<div class="proj-title">${esc(p.title)}</div>`;
      }
      if (p.bullets && p.bullets.length) {
        html += `<ul class="bullets-list">`;
        p.bullets.forEach(b => { if (b) html += `<li>${esc(b)}</li>`; });
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
        if (en.location) html += `<div class="entry-loc">${esc(en.location)}</div>`;
      } else {
        if (en.company_city) html += `<div class="exp-company">${esc(en.company_city)}</div>`;
      }
      if (en.bullets && en.bullets.length) {
        html += `<ul class="bullets-list">`;
        en.bullets.forEach(b => { if (b) html += `<li>${esc(b)}</li>`; });
        html += `</ul>`;
      }
    });
  }

  f.innerHTML = html;

  // The preview renders at the user-selected (or default) font size.
  // We do NOT auto-measure pages from preview pixels — CSS at 696px wide with
  // web fonts doesn't match Word at 7.25" wide with system fonts, so any
  // pixel-based page count from the preview is unreliable. The user picks
  // the size manually; the .docx output uses that exact size.
  const defaultFontPt = tpl === "demo_4" ? 12 : 11;
  const fontPt = state.font_pt || defaultFontPt;
  f.className = `preview-frame ${tpl} font-${fontPt}`;
  state._appliedFontPt = fontPt;

  // Stats: words + content density (entries + bullets) + active font
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
  $("#preview-stats").innerHTML =
    `${words} words &nbsp;·&nbsp; ${totalEntries} entries &nbsp;·&nbsp; ${totalBullets} bullets &nbsp;·&nbsp; <span class="${fontClass}">${fontPt}pt body</span>`;

  // Hide the overflow banner — no false alarms
  $("#overflow-banner").className = "overflow-banner";
  $("#overflow-banner").innerHTML = "";

  // Hide page break marker — preview is a visual reference, not a page-count authority
  $("#page-break-1").classList.add("hidden");
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
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page { size: Letter; margin: 0.5in; }
  body { margin: 0; background: #fff; color: #000; }
  .preview-frame { font-family: Georgia, serif; line-height: 1.45; font-size: ${fontPt}pt; color: #1a1a17; }
  .resume-name { text-align: center; font-weight: 700; margin: 0 0 3px 0; line-height: 1.1; font-size: ${state.template === "demo_4" ? "20pt" : "16pt"}; }
  .resume-contact { text-align: center; font-size: 9pt; padding-bottom: 4px; border-bottom: 0.5pt solid #c8c2b3; margin-bottom: 8px; line-height: 1.35; }
  .demo_2 .resume-contact { border-bottom: none; }
  .resume-contact-divider { border-bottom: 0.5pt solid #c8c2b3; margin: 2px 0 8px 0; }
  .resume-section-h { font-weight: 700; padding-bottom: 2px; border-bottom: 0.5pt solid #c8c2b3; margin: 12px 0 6px 0; }
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
${$("#preview").outerHTML}
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
    out.skills_two_column = state.skills_two_column.filter(r => r.left || r.right_with_bullet);
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
// INIT
// ─────────────────────────────────────────────────────────

render();
