# ResumeCanvas

Student resume builder for the Miami Dade College Works program.

Static HTML/CSS/JS app. Two master templates (Demo 4, Demo 2) with live preview, dynamic add/remove for skills, education, projects, and work experience. Manual font size override down to a 10pt floor.

## Local dev

Open `index.html` in any browser, or serve the directory with any static file server. No build step is required.

## Checks

Run the dependency-free smoke checks before deploying:

```bash
npm test
```

## Deploy

Static site. Vercel auto-detects it. No configuration needed beyond the included `vercel.json`.

## Export options

- `DOWNLOAD .DOC` saves the live preview as a Word-compatible `.doc` file.
- `SAVE PDF` opens the browser print dialog so users can choose “Save as PDF”.
- `PAYLOAD` keeps the JSON handoff available for the companion `.docx` engine.

## Stack

- Plain HTML/CSS/JS, no runtime dependencies, no build step
- JetBrains Mono and Newsreader (Google Fonts)
- External `styles.css` and `app.js` so Vercel can enforce a CSP without `unsafe-inline`
- Tactical dossier aesthetic, dark theme, amber accent

## Security hardening

- User-entered resume text is HTML-escaped before form re-rendering and preview output.
- Static deployment headers set a restrictive CSP, deny framing/object embedding, and disable unused browser permissions.
- Clipboard actions use a fallback path and show a failure toast if copying is blocked.

## Companion engine

The `.docx` generation engine (`resume_builder.py`) lives separately. The UI emits a JSON payload that the engine consumes to produce the final Word document.

## Built by

Christian Ortega · MDC Works · 2026
