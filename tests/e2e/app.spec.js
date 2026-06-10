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
