# ResumeCanvas

Student resume builder for the Miami Dade College Works program.

Single-page HTML app. Two master templates (Demo 4, Demo 2) with live preview, dynamic add/remove for skills, education, projects, and work experience. Manual font size override down to a 10pt floor.

## Local dev

Open `index.html` in any browser. No build step.

## Deploy

Static site. Vercel auto-detects it. No configuration needed beyond the included `vercel.json`.

## Stack

- Plain HTML/CSS/JS, no dependencies, no build step
- JetBrains Mono and Newsreader (Google Fonts)
- Tactical dossier aesthetic, dark theme, amber accent

## Companion engine

The `.docx` generation engine (`resume_builder.py`) lives separately. The UI emits a JSON payload that the engine consumes to produce the final Word document.

## Built by

Christian Ortega · MDC Works · 2026
