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

test.describe("voice-first layout", () => {
  test("the command bar is the hero: above both panes, with suggestions and key + say pairs", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    const hero = page.locator("#hero");
    await expect(hero).toBeVisible();
    await expect(page.locator("#hero #cmd-input")).toBeVisible();
    const heroBox = await hero.boundingBox();
    const shellBox = await page.locator("#shell").boundingBox();
    expect(heroBox.y + heroBox.height).toBeLessThanOrEqual(shellBox.y + 1);
    // Suggestions are real commands; a blank chip fills the bar and selects the blank.
    const chips = page.locator("#cmd-suggest .hero-chip");
    await expect(chips.first()).toBeVisible();
    await chips.filter({ hasText: "to my skills" }).first().click();
    await expect(page.locator("#cmd-input")).toBeFocused();
    await expect(page.locator("#cmd-input")).toHaveValue(/add … to my skills/);
    // Every trigger shows a shortcut and a spoken phrase together.
    const triggers = page.locator(".hero-trigger");
    for (let i = 0; i < await triggers.count(); i++) {
      const t = triggers.nth(i);
      expect((await t.locator("kbd").textContent()).trim().length).toBeGreaterThan(0);
      await expect(t.locator(".say")).toHaveText(/“.+”/);
    }
  });

  test("suggestions follow the field being edited", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.evaluate(() => document.querySelector('.panel[data-section="experience"]').classList.add("open"));
    await page.locator('input[data-exp="1"][data-field="date"]').focus();
    await expect(page.locator("#cmd-suggest")).toContainText("remove the last bullet");
    await expect(page.locator("#cmd-suggest")).toContainText("change the date to");
  });

  test("keyboard shortcuts and spoken app commands do the same things", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    // The page picks ⌘ on Apple user agents (the iPhone viewport project is one) and Ctrl elsewhere.
    const mod = await page.evaluate(() => (cmdIsMac() ? "Meta" : "Control"));
    // Mod+K focuses the bar; "/" does too.
    await page.locator('[data-bind="name"]').focus();
    await page.keyboard.press(`${mod}+k`);
    await expect(page.locator("#cmd-input")).toBeFocused();
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await page.locator('#tpl-dropdown').focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("/");
    await expect(page.locator("#cmd-input")).toBeFocused();
    // Mod+I opens the import card; the spoken twin does the same.
    await page.keyboard.press(`${mod}+i`);
    await expect(page.locator("#intake-card")).not.toHaveClass(/collapsed/);
    await page.evaluate(() => document.getElementById("intake-card").classList.add("collapsed"));
    await page.locator("#cmd-input").fill("open import");
    await page.locator("#cmd-input").press("Enter");
    await expect(page.locator("#intake-card")).not.toHaveClass(/collapsed/);
    // A spoken template switch runs at once, without a preview card.
    await page.locator("#cmd-input").fill("use the compact template");
    await page.locator("#cmd-input").press("Enter");
    await expect(page.locator("#tpl-dropdown")).toHaveValue("demo_2");
    await expect(page.locator("#cmd-preview")).toBeHidden();
    // "?" opens the help card listing keys next to phrases.
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Shift+?");
    await expect(page.locator("#cmd-preview .cmd-help")).toBeVisible();
    await expect(page.locator("#cmd-preview .cmd-help")).toContainText("dictate my summary");
  });

  test("listening lights up the waveform and Esc stops it", async ({ page }) => {
    await page.addInitScript(() => {
      class HangingRec { start() { this.onstart && this.onstart(); } stop() { this.onend && this.onend(); } }
      window.SpeechRecognition = HangingRec;
      window.webkitSpeechRecognition = HangingRec;
    });
    await page.goto("/");
    await dismissOnboarding(page);
    await page.locator("#cmd-mic").click();
    await expect(page.locator("body")).toHaveClass(/cmd-listening/);
    await expect(page.locator("#cmd-status")).toContainText("LISTENING");
    await expect(page.locator("#cmd-wave-left .vm-bar")).toHaveCount(14);
    await page.keyboard.press("Escape");
    await expect(page.locator("body")).not.toHaveClass(/cmd-listening/);
  });
});

// Regressions found in the 2026-11 review.
test.describe("review fixes", () => {
  const SAMPLE = [
    "Maria Lopez", "maria@example.com | 305-555-0100", "",
    "EDUCATION", "Miami Dade College — Associate in Arts, 2026", "",
    "SKILLS", "Python, SQL, Excel", "",
    "EXPERIENCE", "Cashier, Sunset Groceries   2021 – 2022", "- Served 200 customers a day",
  ].join("\n");

  test("controls inside a modal work: checkboxes untick and previews open", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /IMPORT WHAT YOU HAVE/ }).click();
    await page.locator("#import-paste").fill(SAMPLE);
    await page.getByRole("button", { name: /PARSE PASTED TEXT/ }).click();
    await expect(page.locator("#import-modal-bg")).toBeVisible();
    const box = page.locator('#import-preview input[data-import-key="name"]');
    await expect(box).toBeChecked();
    await box.click();
    await expect(box).not.toBeChecked();
    const details = page.locator("#import-preview details").first();
    await details.locator("summary").click();
    await expect(details).toHaveAttribute("open", "");
    // The unticked name is left out of the import.
    await page.getByRole("button", { name: "APPLY IMPORT" }).click();
    await expect(page.locator("#preview")).not.toContainText("Maria Lopez");
    await expect(page.locator("#preview")).toContainText("Served 200 customers a day");
  });

  test("RESTORE BACKUP opens the file chooser", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.locator("#library-pill").click();
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /RESTORE BACKUP/ }).click();
    await chooser;
  });

  test("a resume started from scratch survives a reload before it has a name", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /START FROM SCRATCH/ }).click();
    await page.locator('.panel[data-section="summary"] header h2').click();
    await page.locator("#summary").fill("Ten minutes of careful writing.");
    await page.waitForTimeout(500); // debounced persist
    await page.reload();
    await expect(page.locator("#onboard-bg")).toBeHidden();
    await expect(page.locator("#summary")).toHaveValue("Ten minutes of careful writing.");
  });

  test("an untouched sample starts fresh; an edited one (name unchanged) is restored", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.waitForTimeout(500);
    await page.reload();
    await expect(page.locator("#onboard-bg")).toBeVisible();
    // Editing the sample (name left as it is) is real work too.
    await dismissOnboarding(page);
    await page.locator('.panel[data-section="summary"] header h2').click();
    await page.locator("#summary").fill("My own summary on the sample.");
    await page.waitForTimeout(500);
    await page.reload();
    await expect(page.locator("#onboard-bg")).toBeHidden();
    await expect(page.locator("#preview")).toContainText("My own summary on the sample.");
  });

  test("skills, contact details and the company line follow the resume across templates", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /START FROM SCRATCH/ }).click();
    // Typed in the Student template: separate contact fields, skill categories, a job location.
    await page.locator('[data-bind="name"]').fill("Maria Lopez");
    await page.locator('[data-bind="location"]').fill("Miami, FL");
    await page.locator('[data-bind="phone"]').fill("305-555-0100");
    await page.locator('[data-bind="email"]').fill("maria@example.com");
    await page.locator('.panel[data-section="skills"] header h2').click();
    await page.locator('[data-skill-cat="0"][data-field="content"]').fill("Python, SQL, Adobe (Photoshop, Illustrator)");
    await page.locator('.panel[data-section="experience"] header h2').click();
    await page.getByRole("button", { name: "+ ADD POSITION" }).click();
    await page.locator('[data-exp="0"][data-field="title"]').fill("Cashier");
    await page.locator('[data-exp="0"][data-field="location"]').fill("Sunset Groceries, Miami");

    const preview = page.locator("#preview");
    for (const tpl of ["demo_2", "demo_5", "demo_6"]) {
      await page.evaluate((t) => pickTemplate(t), tpl);
      for (const text of ["maria@example.com", "305-555-0100", "Miami, FL", "Python", "SQL", "Adobe (Photoshop, Illustrator)", "Sunset Groceries, Miami"]) {
        await expect(preview, `${tpl} shows ${text}`).toContainText(text);
      }
    }
    // Edit the two-column skills in Compact, then go back: the category label
    // survives and the new skill arrives.
    await page.evaluate(() => pickTemplate("demo_2"));
    await page.locator('[data-skill-row="1"][data-field="right"]').fill("Tableau");
    await page.evaluate(() => pickTemplate("demo_4"));
    await expect(preview).toContainText("Technical: Python, SQL, Adobe (Photoshop, Illustrator), Tableau");
    // Contact lines edited in Classic flow back into the separate fields.
    await page.evaluate(() => pickTemplate("demo_5"));
    await page.locator('[data-bind="contact_line2"]').fill("maria.lopez@example.com | linkedin.com/in/maria");
    await page.evaluate(() => pickTemplate("demo_4"));
    await expect(page.locator('[data-bind="email"]')).toHaveValue("maria.lopez@example.com");
    await expect(page.locator('[data-bind="linkedin"]')).toHaveValue("linkedin.com/in/maria");
    await expect(page.locator('[data-bind="phone"]')).toHaveValue("305-555-0100");
  });

  test("the QR contact card uses the contact lines the template shows", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.evaluate(() => pickTemplate("demo_5"));
    await page.locator('[data-bind="name"]').fill("Maria Lopez");
    await page.locator('[data-bind="contact_line1"]').fill("Hialeah, FL | (786) 555-0142 | maria@example.com");
    const vcard = await page.evaluate(() => buildVCard());
    expect(vcard).toContain("EMAIL;TYPE=INTERNET:maria@example.com");
    expect(vcard).toContain("TEL;TYPE=CELL:(786) 555-0142");
    expect(vcard).not.toContain("mymdc.net");
  });

  test("the Classic PDF puts the company line first, like the preview", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.evaluate(() => pickTemplate("demo_5"));
    const order = await page.evaluate(() => {
      const bytes = buildResumePdfBytes();
      const text = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
      return [text.indexOf("The Blue House"), text.indexOf("(Intern)")];
    });
    expect(order[0]).toBeGreaterThan(0);
    expect(order[1]).toBeGreaterThan(order[0]);
  });

  test("match mode counts short tech terms and education", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    const r = await page.evaluate(() => {
      state.skills_categories = [{ label: "Technical", content: "JavaScript, UX research" }];
      state.education[0].degree = "Bachelor of Science, Nursing";
      const m = analyzeMatch("Looking for JS and UX experience. Bachelor degree in nursing required.");
      return m.missing.map((x) => x.term);
    });
    for (const term of ["javascript", "userexperience", "bachelor", "nurs"]) expect(r).not.toContain(term);
  });
});

test.describe("hero", () => {
  test("scrolling does not flip the hero back and forth or move the page", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "the hero only compacts on wide screens");
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto("/");
    await dismissOnboarding(page);
    const height = () => page.evaluate(() => document.documentElement.scrollHeight);
    const before = await height();
    // Every offset the old code bounced on: it compacted at 72px, which
    // shortened the page and threw the scroll position back to the top.
    for (const y of [80, 120, 200]) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(150);
      expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(y);
    }
    await page.evaluate(() => {
      window.__flips = 0;
      new MutationObserver(() => { window.__flips += 1; }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    });
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);
    await expect(page.locator("body")).toHaveClass(/hero-compact/);
    expect(await page.evaluate(() => window.__flips)).toBe(1);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(600);
    expect(await height()).toBe(before);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator("body")).not.toHaveClass(/hero-compact/);
    expect(await height()).toBe(before);
  });
});
