// ResumeCanvas — optional AI parse & polish endpoint (Vercel serverless function).
//
// The app is fully usable without this. When ANTHROPIC_API_KEY is set on the
// Vercel project, the UI gains two optional actions: "read my resume with AI"
// (messy text → the same structured JSON the local parser produces, but far
// more reliably) and "polish bullets" (tighten wording; never invent facts).
//
// Privacy: text is sent to the Claude API only when the user explicitly
// chooses an AI action. Nothing is stored server-side.
//
//   GET  /api/ai            → { enabled: boolean }
//   POST /api/ai {op:"parse",  text}             → { parsed }
//   POST /api/ai {op:"polish", bullets:[{id,text}], context:{title,summary}} → { bullets:[{id,text}] }

const Anthropic = require("@anthropic-ai/sdk");
const { zodOutputFormat } = require("@anthropic-ai/sdk/helpers/zod");
const { z } = require("zod");

const MODEL = "claude-opus-5-5";
const MAX_TEXT_CHARS = 30000;
const MAX_BULLETS = 40;

const Entry = z.object({
  title: z.string(),
  date: z.string(),
  location: z.string(),
  bullets: z.array(z.string()),
});

const ParsedResume = z.object({
  header: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    linkedin: z.string(),
    location: z.string(),
  }),
  summary: z.string(),
  skills: z.array(z.string()),
  education: z.array(z.object({
    school: z.string(),
    city: z.string(),
    degree: z.string(),
    date: z.string(),
  })),
  experience: z.array(Entry),
  projects: z.array(Entry),
  certifications: z.array(z.string()),
  other: z.array(z.object({ title: z.string(), lines: z.array(z.string()) })),
});

const PolishedBullets = z.object({
  bullets: z.array(z.object({ id: z.string(), text: z.string() })),
});

const PARSE_SYSTEM = `You convert raw resume text into structured JSON for a resume builder.
Rules:
- Copy the person's own words. Do not invent, embellish, or infer facts that are not in the text. Leave a field as an empty string or empty array when the text does not contain it.
- "experience" holds paid or volunteer positions; "projects" holds academic, personal or portfolio projects. Each entry's title should read "Role, Organization" or the project name; dates like "Jun 2023 – Present"; location like "Miami, FL".
- Bullets are the responsibility/achievement lines under an entry, without leading bullet glyphs.
- "skills" is a flat list of individual skills (split comma or pipe separated lists).
- Section headings that do not fit any field (Volunteer, Awards, Languages, Publications, Interests...) go in "other" with their lines.
- The summary is the objective/profile paragraph if present, as one string.`;

const POLISH_SYSTEM = `You tighten resume bullet points for a job seeker.
For each bullet, return an improved version that:
- starts with a strong action verb in the same tense the original implies (past for past roles, present for current),
- keeps every fact exactly as stated — never add numbers, tools, outcomes, or scope that are not in the original,
- removes filler ("responsible for", "helped with", "various"), and
- stays within one or two lines (max ~25 words).
If a bullet is already strong, return it unchanged. Return every bullet id you were given, once.`;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_TEXT_CHARS * 2) throw new Error("PAYLOAD_TOO_LARGE");
  }
  return raw ? JSON.parse(raw) : {};
}

async function handleParse(client, body) {
  const text = String(body.text || "").trim();
  if (!text) return { status: 400, body: { error: "text is required" } };
  if (text.length > MAX_TEXT_CHARS) return { status: 413, body: { error: `text exceeds ${MAX_TEXT_CHARS} characters` } };
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: zodOutputFormat(ParsedResume) },
    system: PARSE_SYSTEM,
    messages: [{ role: "user", content: `Resume text:\n\n${text}` }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return { status: 502, body: { error: "The model did not return a structured resume" } };
  }
  const parsed = response.parsed_output;
  parsed.other = parsed.other.map((o) => ({ ...o, text: o.lines.join("\n") }));
  return { status: 200, body: { parsed } };
}

async function handlePolish(client, body) {
  const bullets = Array.isArray(body.bullets) ? body.bullets : [];
  const clean = bullets
    .filter((b) => b && typeof b.id === "string" && typeof b.text === "string" && b.text.trim())
    .slice(0, MAX_BULLETS)
    .map((b) => ({ id: b.id, text: b.text.trim().slice(0, 600) }));
  if (!clean.length) return { status: 400, body: { error: "bullets are required" } };
  const ctx = body.context && typeof body.context === "object" ? body.context : {};
  const contextLine = [ctx.title ? `Target role/title: ${String(ctx.title).slice(0, 120)}` : "", ctx.summary ? `Summary: ${String(ctx.summary).slice(0, 600)}` : ""].filter(Boolean).join("\n");
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: zodOutputFormat(PolishedBullets) },
    system: POLISH_SYSTEM,
    messages: [{ role: "user", content: `${contextLine ? contextLine + "\n\n" : ""}Bullets (JSON):\n${JSON.stringify(clean)}` }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return { status: 502, body: { error: "The model did not return polished bullets" } };
  }
  const byId = new Map(clean.map((b) => [b.id, b.text]));
  const out = response.parsed_output.bullets.filter((b) => byId.has(b.id) && b.text.trim());
  return { status: 200, body: { bullets: out } };
}

module.exports = async (req, res) => {
  const enabled = !!process.env.ANTHROPIC_API_KEY;
  if (req.method === "GET") return json(res, 200, { enabled });
  if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return json(res, 405, { error: "method not allowed" }); }
  if (!enabled) return json(res, 503, { error: "AI features are not configured on this deployment" });

  let body;
  try { body = await readBody(req); } catch (err) {
    return json(res, err.message === "PAYLOAD_TOO_LARGE" ? 413 : 400, { error: "invalid request body" });
  }

  const client = new Anthropic();
  try {
    let result;
    if (body.op === "parse") result = await handleParse(client, body);
    else if (body.op === "polish") result = await handlePolish(client, body);
    else result = { status: 400, body: { error: "op must be 'parse' or 'polish'" } };
    return json(res, result.status, result.body);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) return json(res, 503, { error: "AI features are misconfigured (invalid API key)" });
    if (err instanceof Anthropic.RateLimitError) return json(res, 429, { error: "AI is busy — try again in a moment" });
    if (err instanceof Anthropic.APIError) return json(res, 502, { error: `AI request failed (${err.status})` });
    console.error("ai endpoint error", err);
    return json(res, 500, { error: "AI request failed" });
  }
};
