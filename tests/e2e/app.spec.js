// E2E tests that actually drive the UI — load the page, click through the
// onboarding, type into the form, watch the preview, export a PDF, and
// check the pagination math against the rendered frames.
const { test, expect } = require("@playwright/test");

async function dismissOnboarding(page) {
  await page.getByRole("button", { name: /EXPLORE THE SAMPLE RESUME/ }).click();
  await expect(page.locator("#onboard-bg")).toBeHidden();
}

test.describe("onboarding", () => {
  test("shows the chooser on launch and EXPLORE reveals the sample", async ({ page }) => {
    await page.goto("/");
    const onboard = page.locator("#onboard-bg");
    await expect(onboard).toBeVisible();
    await expect(onboard.getByRole("button", { name: /IMPORT WHAT YOU HAVE/ })).toBeVisible();
    await dismissOnboarding(page);
    // Sample resume is loaded behind the overlay.
    await expect(page.locator("#preview")).toContainText("Jane Doe");
  });

  test("START FROM SCRATCH creates a blank resume and focuses the name field", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /START FROM SCRATCH/ }).click();
    await expect(page.locator("#onboard-bg")).toBeHidden();
    const name = page.locator('[data-bind="name"]');
    await expect(name).toHaveValue("");
    await expect(name).toBeFocused();
  });

  test("the START SCREEN button reopens the chooser without losing data", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.locator('[data-bind="name"]').fill("Ada Lovelace");
    await page.getByRole("button", { name: /START SCREEN/ }).click();
    await expect(page.locator("#onboard-bg")).toBeVisible();
    await dismissOnboarding(page);
    await expect(page.locator("#preview")).toContainText("Ada Lovelace");
  });

  test("IMPORT opens the intake card", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /IMPORT WHAT YOU HAVE/ }).click();
    await expect(page.locator("#intake-card")).not.toHaveClass(/collapsed/);
    await expect(page.locator("#import-paste")).toBeVisible();
  });
});

test.describe("editing", () => {
  test("typing a name updates the live preview", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    const name = page.locator('[data-bind="name"]');
    await name.fill("Ada Lovelace");
    await expect(page.locator("#preview")).toContainText("Ada Lovelace");
    await expect(page.locator("#preview")).not.toContainText("Jane Doe");
  });

  test("a real name compacts the Get Started cards into reopeners", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await expect(page.locator("#intake-card")).toBeVisible();
    await page.locator('[data-bind="name"]').fill("Ada Lovelace");
    await expect(page.locator("body")).toHaveClass(/gs-done/);
    await expect(page.locator("#intake-card")).toBeHidden();
    await expect(page.locator("#voice-card")).toBeHidden();
    // The mini reopener brings the intake card back.
    await page.getByRole("button", { name: "⤓ IMPORT" }).click();
    await expect(page.locator("#intake-card")).toBeVisible();
  });

  test("pasted resume text imports through the confirm modal", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /IMPORT WHAT YOU HAVE/ }).click();
    await page.locator("#import-paste").fill(
      [
        "Grace Hopper",
        "grace@example.com | (555) 000-1111 | Arlington, VA",
        "",
        "SUMMARY",
        "Computer scientist and pioneer of compiler design.",
        "",
        "SKILLS",
        "COBOL, Compilers, Leadership",
      ].join("\n")
    );
    await page.getByRole("button", { name: /PARSE PASTED TEXT/ }).click();
    await expect(page.locator("#import-modal-bg")).toHaveClass(/show/);
    await page.getByRole("button", { name: "APPLY IMPORT" }).click();
    await expect(page.locator("#preview")).toContainText("Grace Hopper");
    await expect(page.locator("#preview")).toContainText("compiler design");
    // Importing onto the untouched sample must not keep the sample's other
    // sections (its projects, phone, summary) as if they were the user's.
    await expect(page.locator("#preview")).not.toContainText("Shark Cast");
    await expect(page.locator("#preview")).not.toContainText("786-121-1112");
  });

  test("a PDF resume imports through the confirm modal", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /IMPORT WHAT YOU HAVE/ }).click();
    // Build a real PDF with the app's own writer so the test needs no fixture.
    const bytes = await page.evaluate(() => {
      const d = new window.RcPdf.Doc();
      d.setFont("Times-Bold", 14); d.text("Alan Turing", 72, 720);
      d.setFont("Times-Roman", 11); d.text("alan@example.com | (555) 010-2020 | Manchester, NH", 72, 702);
      d.setFont("Times-Bold", 11); d.text("SUMMARY", 72, 672);
      d.setFont("Times-Roman", 11); d.text("Mathematician and founder of theoretical computer science.", 72, 656);
      d.setFont("Times-Bold", 11); d.text("SKILLS", 72, 626);
      d.setFont("Times-Roman", 11); d.text("Cryptanalysis, Logic, Morphogenesis", 72, 610);
      return Array.from(d.build({ title: "t" }));
    });
    await page.locator("#import-file").setInputFiles({ name: "turing.pdf", mimeType: "application/pdf", buffer: Buffer.from(bytes) });
    await expect(page.locator("#import-modal-bg")).toHaveClass(/show/, { timeout: 15000 });
    await page.getByRole("button", { name: "APPLY IMPORT" }).click();
    await expect(page.locator("#preview")).toContainText("Alan Turing");
    await expect(page.locator("#preview")).toContainText("theoretical computer science");
    await expect(page.locator("#preview")).toContainText("Cryptanalysis");
  });

  test("content suggestions flag weak bullets and focus the field", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /START FROM SCRATCH/ }).click();
    await page.locator('[data-bind="name"]').fill("Ada Lovelace");
    await page.evaluate(() => {
      state.experience = [{ title: "Analyst", date: "", location: "", company_city: "Babbage & Co", bullets: ["Responsible for the engine", "Built the first algorithm"] }];
      render();
    });
    const panel = page.locator("#quality-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(/action verb/);
    await expect(panel).toContainText(/Missing dates/);
    await panel.getByRole("button", { name: /action verb/ }).first().click();
    await expect(page.locator('textarea[data-exp-bullet="0"][data-bullet-i="0"]')).toBeFocused();
  });

  test("template gallery thumbnails switch the template", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    const cards = page.locator(".tpl-card");
    await expect(cards).toHaveCount(4);
    const initial = await page.locator("#tpl-dropdown").inputValue();
    await expect(page.locator(".tpl-card.active")).toHaveAttribute("data-tpl", initial);
    await page.locator('.tpl-card[data-tpl="demo_6"]').click();
    await expect(page.locator("#tpl-dropdown")).toHaveValue("demo_6");
    await expect(page.locator(".tpl-card.active")).toHaveAttribute("data-tpl", "demo_6");
    await expect(page.locator("#preview .sidebar-grid")).toBeVisible();
  });

  test("an additional section appears in the preview and the PDF", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /START FROM SCRATCH/ }).click();
    await page.locator('[data-bind="name"]').fill("Ada Lovelace");
    await page.evaluate(() => document.querySelector('.panel[data-section="custom"]').classList.add("open"));
    await page.getByRole("button", { name: "+ ADD SECTION" }).click();
    await page.locator('input[data-custom="0"]').fill("Volunteer Experience");
    await page.locator('textarea[data-custom-bullet="0"]').fill("Organized a food drive serving 300 families");
    await expect(page.locator("#preview")).toContainText("Volunteer Experience");
    await expect(page.locator("#preview")).toContainText("300 families");
    const inPdf = await page.evaluate(() => new TextDecoder("latin1").decode(buildResumePdfBytes()).includes("Volunteer Experience"));
    expect(inPdf).toBe(true);
  });

  test("the preview page count matches the exported PDF for the sample", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    const r = await page.evaluate(() => ({
      preview: document.querySelectorAll("#preview .preview-frame").length,
      pdf: (new TextDecoder("latin1").decode(buildResumePdfBytes()).match(/\/Type \/Page\b/g) || []).length,
    }));
    expect(r.preview).toBe(r.pdf);
  });

  test("WORD export downloads a valid .docx and COPY TEXT yields plain text", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    const dl = page.waitForEvent("download");
    await page.getByRole("button", { name: "WORD (.DOCX)" }).click();
    const download = await dl;
    expect(download.suggestedFilename()).toMatch(/\.docx$/);
    const buf = require("fs").readFileSync(await download.path());
    expect(buf.subarray(0, 2).toString()).toBe("PK"); // zip signature
    const text = await page.evaluate(() => buildPlainText());
    expect(text).toContain("Jane Doe");
    expect(text).toMatch(/\n-{4,}\n/); // section rule
  });

  test("ATS SAFE renders the sidebar template as a single column", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.locator("#tpl-dropdown").selectOption("demo_6");
    await expect(page.locator("#preview .sidebar-grid")).toHaveCount(1);
    await page.locator("#ats-chip").click();
    await expect(page.locator("#preview .sidebar-grid")).toHaveCount(0);
    await expect(page.locator("#ats-chip")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#preview")).toContainText("Jane Doe");
  });

  test("a draft with real data survives a reload and skips the chooser", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /START FROM SCRATCH/ }).click();
    await page.locator('[data-bind="name"]').fill("Ada Lovelace");
    await page.waitForTimeout(500); // debounced persist
    await page.reload();
    await expect(page.locator("#onboard-bg")).toBeHidden();
    await expect(page.locator('[data-bind="name"]')).toHaveValue("Ada Lovelace");
    await expect(page.locator("#preview")).toContainText("Ada Lovelace");
  });

  test("AI controls stay hidden when /api/ai is not configured", async ({ page }) => {
    await page.route("**/api/ai", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ enabled: false }) }));
    await page.goto("/");
    await page.getByRole("button", { name: /IMPORT WHAT YOU HAVE/ }).click();
    await expect(page.locator("#ai-parse-row")).toBeHidden();
    await expect(page.locator("#ai-polish-btn")).toHaveCount(0);
  });

  test("with AI configured, import reads through the endpoint and polish applies bullets", async ({ page }) => {
    await page.route("**/api/ai", async (route) => {
      const req = route.request();
      if (req.method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ enabled: true }) });
      const body = req.postDataJSON();
      if (body.op === "parse") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ parsed: {
          header: { name: "Grace Hopper", email: "grace@example.com", phone: "", linkedin: "", location: "Arlington, VA" },
          summary: "Pioneer of compiler design.", skills: ["COBOL", "Compilers"],
          education: [], projects: [], certifications: [], other: [],
          experience: [{ title: "Rear Admiral, US Navy", date: "1943 – 1986", location: "", bullets: ["Responsible for the development of COBOL"] }],
        } }) });
      }
      if (body.op === "polish") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ bullets: body.bullets.map((b) => ({ id: b.id, text: "Led the development of COBOL" })) }) });
      }
      return route.fulfill({ status: 400, body: "{}" });
    });
    await page.goto("/");
    await page.getByRole("button", { name: /IMPORT WHAT YOU HAVE/ }).click();
    await expect(page.locator("#ai-parse-row")).toBeVisible();
    await page.locator("#import-paste").fill("Grace Hopper\nanything — the mocked endpoint decides");
    await page.getByRole("button", { name: /PARSE PASTED TEXT/ }).click();
    await expect(page.locator("#import-modal-bg")).toHaveClass(/show/);
    await page.getByRole("button", { name: "APPLY IMPORT" }).click();
    await expect(page.locator("#preview")).toContainText("Rear Admiral, US Navy");
    // Polish: the quality panel offers the AI button once there are bullets.
    await page.locator("#ai-polish-btn").click();
    await expect(page.locator("#ai-modal-bg")).toHaveClass(/show/);
    await expect(page.locator("#ai-polish-list")).toContainText("Led the development of COBOL");
    await page.getByRole("button", { name: "APPLY SELECTED" }).click();
    await expect(page.locator("#preview")).toContainText("Led the development of COBOL");
    await expect(page.locator("#preview")).not.toContainText("Responsible for");
  });

  test("typing several characters into a certification keeps focus and text", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.locator("#tpl-dropdown").selectOption("demo_2");
    await page.evaluate(() => document.querySelectorAll(".panel").forEach((p) => p.classList.add("open")));
    const cert = page.locator('input[data-cert="0"]');
    await cert.click();
    await cert.press("End");
    await page.keyboard.type("XYZ", { delay: 30 });
    await expect(cert).toBeFocused();
    await expect(cert).toHaveValue(/XYZ$/);
    await expect(page.locator("#preview")).toContainText("XYZ");
  });
});

test.describe("pagination", () => {
  test("long content splits into multiple non-overflowing pages", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    // Inflate the resume well past one page, straight through the app's own
    // state + render entry points (same globals the UI uses).
    await page.evaluate(() => {
      const bullets = Array.from({ length: 6 }, (_, i) =>
        `Did an important and reasonably long thing number ${i + 1} that wraps across the page width`);
      state.experience = Array.from({ length: 8 }, (_, i) => ({
        title: `Position ${i + 1}`,
        date: "2020 - 2024",
        location: "Miami, FL",
        company_city: `Company ${i + 1} — Miami, FL`,
        bullets: bullets.slice(),
      }));
      render();
    });
    const frames = page.locator("#preview .preview-frame");
    await expect(async () => {
      expect(await frames.count()).toBeGreaterThan(1);
    }).toPass();
    // No frame may clip content: scrollHeight must not exceed the visible box.
    const metrics = await frames.evaluateAll((els) =>
      els.map((el) => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight })));
    const overflowing = metrics.filter((m) => m.scrollHeight > m.clientHeight + 2);
    expect(overflowing, `frame metrics: ${JSON.stringify(metrics)}`).toEqual([]);
  });
});

test.describe("export", () => {
  test("DOWNLOAD PDF produces a .pdf download", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    const downloadPromise = page.waitForEvent("download");
    await page.locator('#preview-toolbar [data-action="downloadPdf"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});

test.describe("library backup", () => {
  test("backup downloads a JSON and restoring it brings the data back", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.locator('[data-bind="name"]').fill("Backup Person");

    // Download the backup.
    await page.locator("#library-pill").click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /BACKUP ALL/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^resumecanvas-backup-.*\.json$/);
    const backupPath = await download.path();

    // Diverge, then restore over it (accepting the confirm dialog).
    await page.locator('#library-modal-bg [data-action="closeLibrary"]').first().click();
    await page.locator('[data-bind="name"]').fill("Someone Else");
    await expect(page.locator("#preview")).toContainText("Someone Else");
    page.on("dialog", (dialog) => dialog.accept());
    await page.locator("#library-restore-file").setInputFiles(backupPath);
    await expect(page.locator("#preview")).toContainText("Backup Person");
  });
});

test.describe("feature-detection fallbacks", () => {
  test("without the Web Speech API, voice reframes as typing and mics hide", async ({ page }) => {
    await page.addInitScript(() => {
      delete window.SpeechRecognition;
      delete window.webkitSpeechRecognition;
      Object.defineProperty(window, "SpeechRecognition", { value: undefined });
      Object.defineProperty(window, "webkitSpeechRecognition", { value: undefined });
    });
    await page.goto("/");
    // Onboarding is honest about it.
    await expect(page.locator("#onboard-voice-label")).toHaveText("WRITE A QUICK INTRO");
    await dismissOnboarding(page);
    // Mic affordances are gone; the typed path remains.
    await expect(page.locator("#voice-rec-btn")).toBeHidden();
    await expect(page.locator(".mic-btn").first()).toBeHidden();
  });

  test("without TextDetector, the camera scan warns before capture", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "TextDetector", { value: undefined });
    });
    await page.goto("/");
    await page.getByRole("button", { name: /IMPORT WHAT YOU HAVE/ }).click();
    await expect(page.locator("#camera-note")).toBeVisible();
    await expect(page.locator("#camera-note")).toContainText(/can't read text from photos automatically/);
  });
});

test.describe("command bar", () => {
  test("a typed command previews first, applies only on confirm, and undoes", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    const summaryBefore = await page.evaluate(() => state.summary);
    await page.locator("#cmd-input").fill("add Python to my skills");
    await page.locator("#cmd-input").press("Enter");
    const card = page.locator("#cmd-preview");
    await expect(card).toBeVisible();
    await expect(card).toContainText("Skills");
    await expect(card).toContainText("Python");
    // Nothing changes until confirmed.
    await expect(page.locator("#preview")).not.toContainText("Python");
    await card.getByRole("button", { name: /APPLY/ }).click();
    await expect(page.locator("#preview")).toContainText("Python");
    expect(await page.evaluate(() => state.summary)).toBe(summaryBefore);
    await expect(page.locator("#cmd-undo")).toBeEnabled();
    await page.locator("#cmd-undo").click();
    await expect(page.locator("#preview")).not.toContainText("Python");
    await expect(page.locator("#cmd-undo")).toBeDisabled();
  });

  test("an ambiguous entry asks which one, and only that section changes", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    const expBefore = await page.evaluate(() => JSON.stringify(state.experience));
    await page.locator("#cmd-input").fill("change the date for north miami senior high school to June 2022");
    await page.locator("#cmd-input").press("Enter");
    const choices = page.locator("#cmd-preview .cmd-choice");
    await expect(choices).toHaveCount(2);
    await choices.filter({ hasText: "Education" }).click();
    await expect(page.locator("#cmd-preview")).toContainText("June 2022");
    await page.locator("#cmd-input").press("Enter"); // empty Enter applies the open preview
    await expect.poll(() => page.evaluate(() => state.education.find((e) => /North Miami/.test(e.school)).date)).toBe("June 2022");
    expect(await page.evaluate(() => JSON.stringify(state.experience))).toBe(expBefore);
  });

  test("the field being edited is the default target", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.evaluate(() => document.querySelector('.panel[data-section="experience"]').classList.add("open"));
    await page.locator('input[data-exp="1"][data-field="date"]').focus();
    await expect(page.locator("#cmd-context")).toBeVisible();
    await expect(page.locator("#cmd-context")).toContainText("Experience");
    await page.locator("#cmd-input").fill("change the date to march 2020 to present");
    await page.locator("#cmd-input").press("Enter");
    await page.locator("#cmd-preview").getByRole("button", { name: /APPLY/ }).click();
    expect(await page.evaluate(() => state.experience[1].date)).toBe("March 2020 – Present");
  });

  test("errors never change anything and keep the text for correction", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    const before = await page.evaluate(() => JSON.stringify(state));
    await page.locator("#cmd-input").fill("delete costco");
    await page.locator("#cmd-input").press("Enter");
    await expect(page.locator("#cmd-preview .cmd-error")).toContainText("couldn't find");
    await expect(page.locator("#cmd-input")).toHaveValue("delete costco");
    expect(await page.evaluate(() => JSON.stringify(state))).toBe(before);
  });

  test("undo history is dropped when a different resume loads", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.locator("#cmd-input").fill("add Tableau to my skills");
    await page.locator("#cmd-input").press("Enter");
    await page.locator("#cmd-input").press("Enter");
    await expect(page.locator("#cmd-undo")).toBeEnabled();
    await page.locator("#tpl-dropdown").selectOption("demo_2"); // edited sample → keeps data, no reload
    await page.evaluate(() => replaceStateWith(blankResumeState()));
    await expect(page.locator("#cmd-undo")).toBeDisabled();
  });

  test("spoken loop: say a change, hear it back, say yes", async ({ page }) => {
    // Scripted microphone: each start() "hears" the next phrase.
    await page.addInitScript(() => {
      window.__heard = ["add sql to my skills", "yes"];
      class FakeRec {
        start() {
          const text = window.__heard.shift();
          if (text == null) throw new Error("no more phrases");
          setTimeout(() => {
            const alt = [{ transcript: text }];
            alt.isFinal = true;
            this.onresult && this.onresult({ resultIndex: 0, results: [Object.assign(alt, { isFinal: true })] });
            this.onend && this.onend();
          }, 30);
        }
        stop() { this.onend && this.onend(); }
      }
      window.SpeechRecognition = FakeRec;
      window.webkitSpeechRecognition = FakeRec;
      // No speech synthesis in the test: the bar listens for the answer right away.
      try { delete window.speechSynthesis; } catch (_e) { /* ignore */ }
      Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
    });
    await page.goto("/");
    await dismissOnboarding(page);
    await page.locator("#cmd-mic").click();
    await expect(page.locator("#preview")).toContainText("Sql", { timeout: 5000 });
    await expect(page.locator("#cmd-preview")).toBeHidden();
    await expect(page.locator("#cmd-undo")).toBeEnabled();
  });
});
