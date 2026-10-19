# ResumeCanvas

Free resume builder for job seekers — live preview, four templates, and full offline support.

Static HTML/CSS/JS app with a live preview and four layouts: Classic, Compact, Student, and Sidebar. Each template carries its own demo resume; selecting a template previews its sample, and once you import or type a student's info, switching templates re-lays-out that same data. Dynamic add/remove and reordering for skills, education, certifications, projects, and work experience. Per-resume typeface choice (Times, Arial, Calibri) and a manual font size override down to a 10pt floor.

Extras: import an existing resume (.txt/.docx, paste, or phone-camera scan), browser-only voice dictation to shape the summary tone, a local "match against a job description" heat-map, a multi-resume library (drafts + saved) that survives reloads in this browser, and export via real PDF, .doc, print, native share, or a QR contact card.

## Local dev

Open `index.html` in any browser, or serve the directory with any static file server. No build step is required.

## Checks

Run the dependency-free smoke checks before deploying:

```bash
npm test
```

## Deploy

Static site plus one optional serverless function. Vercel auto-detects it; the included `vercel.json` sets the headers and CSP.

### Optional AI assist

`api/ai.js` is a Vercel function that uses the Claude API for two things: reading a messy resume into structured fields ("Read it with AI" in the import card) and tightening bullet wording ("Polish bullets with AI" above the preview). It is off until you set `ANTHROPIC_API_KEY` in the Vercel project's environment variables. Without the key the endpoint reports `enabled: false` and the UI hides every AI control, so the app keeps working fully offline. Text is sent only when the user picks an AI action and is never stored. The function uses `claude-opus-5-5` with structured outputs so the response always matches the app's import schema.

## Export options

- `DOWNLOAD PDF` builds a real PDF in the browser (no print dialog) via the bundled `vendor/pdf-writer.js`.
- `SHARE` opens the native share sheet to send the PDF, plus a scannable QR contact card.
- `WORD (.DOCX)` builds a real single-column Word document in the browser (`js/docx.js`, no dependencies).
- `COPY TEXT` copies a plain-text version for online application forms.
- `ATS SAFE` renders any template as one column with no tables or icons.
- `PRINT` opens the browser print dialog so users can also choose “Save as PDF”.

## Stack

- Plain HTML/CSS/JS, no runtime dependencies, no build step
- JetBrains Mono and Newsreader, self-hosted in `vendor/fonts` (OFL)
- External `styles.css` and `app.js` so Vercel can enforce a CSP without `unsafe-inline`
- Tactical dossier aesthetic, light/dark theme toggle, amber accent
- Installable PWA with an offline service worker

## Security hardening

- User-entered resume text is HTML-escaped before form re-rendering and preview output.
- Static deployment headers set a restrictive CSP, deny framing/object embedding, and disable unused browser permissions.
- Clipboard actions use a fallback path and show a failure toast if copying is blocked.

## Companion engine

The `.docx` generation engine (`resume_builder.py`) lives separately. The UI emits a JSON payload that the engine consumes to produce the final Word document.

## Built by

Christian Ortega · MDC Works · 2026
