// Netlify serverless function.
// Requires an environment variable ANTHROPIC_API_KEY set in Netlify site settings.

const LANGUAGE_NAMES = {
  russian: "Russian",
  english: "English",
  spanish: "Spanish",
  french: "French",
};

async function callClaude(systemPrompt, userContent) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw { statusCode: 502, message: "AI request failed", detail: errText };
  }

  const data = await response.json();
  const textBlock = data.content.find(b => b.type === "text");
  const cleaned = (textBlock ? textBlock.text : "{}").replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const mode = body.mode || "draft";

    if (mode === "draft") {
      const { rawNotes, studentName, ageLevel, currentPiece, instrument } = body;

      if (!rawNotes || !rawNotes.trim()) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing lesson notes." }) };
      }

      const systemPrompt = `You are helping a private music teacher turn quick spoken lesson notes into a draft they can review before sending anything. The teacher dictates in whichever language they're comfortable with (Russian, English, Spanish, or French).

Student: ${studentName}
Instrument: ${instrument || "not specified"}
Level: ${ageLevel || "not specified"}
Current piece: ${currentPiece || "not specified"}

CRITICAL RULE: Stick very closely to what the teacher actually said. Do NOT invent specific details the teacher didn't mention — no invented tempos, repetition counts, practice-minute numbers, day-by-day schedules, or specific technical exercises that weren't referenced in the notes. If the teacher didn't give a specific duration or plan, keep the phrasing general (e.g. "practice this regularly this week") rather than making up a number or schedule. It's fine to phrase things naturally, warmly, and in complete sentences — but every concrete detail must trace back to something the teacher actually said. Use language appropriate to the instrument (e.g. bowing for violin, embouchure for wind instruments, hands for piano) — don't assume piano-specific terms unless the instrument is piano.

Detect the language the teacher's raw notes are written in, and write ALL THREE outputs below in that SAME language (this is a draft for the teacher's own review, not the final version — language matching matters more than anything else here).

Respond ONLY with a JSON object, no markdown fences, no preamble, in exactly this shape:
{
  "draftAssignment": "...",
  "draftParentUpdate": "...",
  "teacherNote": "..."
}

- "draftAssignment": a short, warm practice assignment addressed directly to the student, based only on what the teacher said.
- "draftParentUpdate": 2-4 sentences for the parent, summarizing progress and this week's focus, based only on what the teacher said.
- "teacherNote": a short private note to self about what to check at the start of the next lesson.`;

      const parsed = await callClaude(systemPrompt, rawNotes);
      return { statusCode: 200, body: JSON.stringify(parsed) };
    }

    if (mode === "finalize") {
      const { draftAssignment, draftParentUpdate, assignmentLanguage } = body;

      if (!draftAssignment || !draftParentUpdate) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing draft texts." }) };
      }

      const targetLangName = LANGUAGE_NAMES[assignmentLanguage] || "English";

      const systemPrompt = `You are translating two teacher-approved texts for a music studio. This is a TRANSLATION task, not a rewriting task: do not add, remove, or embellish any information — translate faithfully and naturally, preserving the exact meaning and level of detail of the source text.

Both texts go to the same student's family, so both must end up in the SAME target language: ${targetLangName}.

Respond ONLY with a JSON object, no markdown fences, no preamble, in exactly this shape:
{
  "assignment": "...",
  "parentUpdate": "..."
}

- "assignment": translate the student assignment text into natural, fluent ${targetLangName}. If it is already in ${targetLangName}, lightly polish it for tone/fluency only — no content changes.
- "parentUpdate": translate the parent update text into natural, fluent ${targetLangName}. If it is already in ${targetLangName}, lightly polish it for tone/fluency only — no content changes.`;

      const userContent = `STUDENT ASSIGNMENT (source):\n${draftAssignment}\n\nPARENT UPDATE (source):\n${draftParentUpdate}`;
      const parsed = await callClaude(systemPrompt, userContent);
      return { statusCode: 200, body: JSON.stringify(parsed) };
    }

    if (mode === "repertoire") {
      const { query, instrument, ageLevel } = body;

      if (!query || !query.trim()) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing search query." }) };
      }

      const systemPrompt = `You are a knowledgeable music repertoire advisor helping a private music teacher find pieces for a student.

Instrument: ${instrument || "not specified"}
Student level: ${ageLevel || "not specified"}

Based on the teacher's request, suggest 5 real, well-known pieces (or studies/etudes) genuinely suited to the request.

CRITICAL ACCURACY RULE: Only suggest pieces you are confident actually exist and are correctly attributed. Never invent a piece title, never invent a composer name, and never attribute a real piece to the wrong composer. If the teacher names a specific composer, only suggest works that composer genuinely wrote — do not invent a plausible-sounding title in their style. If you cannot think of enough genuine, well-known pieces that fit the request precisely, it is better to suggest fewer than 5 correct ones, or to suggest the closest genuinely-existing alternatives (e.g. a similar composer or a slightly different level), rather than inventing anything. Use the exact, commonly-used title and full composer name as they appear in standard sheet music catalogs (e.g. IMSLP), since these will be used to search for sheet music.

Prefer pieces that are widely taught and likely to have publicly available sheet music (public domain classical repertoire is ideal when appropriate for the level).

Respond ONLY with a JSON object, no markdown fences, no preamble, in exactly this shape:
{
  "pieces": [
    { "title": "...", "composer": "...", "level": "...", "why": "..." }
  ]
}

- "title": the piece's exact, standard title (and movement/number if relevant).
- "composer": the composer's full name, correctly spelled.
- "level": a short level descriptor (e.g. "Early intermediate").
- "why": one short sentence on why this piece fits the request.`;

      const parsed = await callClaude(systemPrompt, query);
      const pieces = Array.isArray(parsed.pieces) ? parsed.pieces : [];
      const withLinks = pieces.map(p => ({
        ...p,
        imslpUrl: `https://www.google.com/search?q=${encodeURIComponent("site:imslp.org " + p.title + " " + p.composer)}`,
        musicnotesUrl: `https://www.google.com/search?q=${encodeURIComponent("site:musicnotes.com " + p.title + " " + p.composer)}`,
      }));
      return { statusCode: 200, body: JSON.stringify({ pieces: withLinks }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Unknown mode." }) };
  } catch (err) {
    if (err && err.statusCode) {
      return { statusCode: err.statusCode, body: JSON.stringify({ error: err.message, detail: err.detail }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
