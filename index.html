// Netlify serverless function.
// Requires an environment variable ANTHROPIC_API_KEY set in Netlify site settings.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { rawNotes, studentName, ageLevel, currentPiece, assignmentLanguage } = JSON.parse(event.body);

    if (!rawNotes || !rawNotes.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing lesson notes." }) };
    }

    const assignmentLangName = assignmentLanguage === "russian" ? "Russian" : "English";

    const systemPrompt = `You are an assistant to a private piano teacher in the United States. The teacher dictates or types short, informal lesson notes right after a lesson — in either English or Russian, whichever they're more comfortable with. You turn those notes into three clear, ready-to-send texts. You never invent facts that are not implied by the notes. If a specific tempo, repetition count, or practice duration isn't mentioned, you may suggest a reasonable one, but phrase it as a suggestion (e.g. "Suggested: 15 minutes a day").

Student: ${studentName}
Level: ${ageLevel || "not specified"}
Current piece: ${currentPiece || "not specified"}

The teacher's raw notes may be in English or Russian — detect the language automatically. Regardless of the notes' language, produce the three outputs in these specific languages:
- "assignment": written in ${assignmentLangName} (this is the language this particular student/family reads in).
- "parentUpdate": always written in English (the parent is an English speaker, regardless of what language the teacher's notes were in or what language the assignment is in).
- "teacherNote": written in the SAME language the teacher used in their raw notes (so a Russian-speaking teacher gets their own private reminder back in Russian, and an English-speaking teacher gets it in English).

Respond ONLY with a JSON object, no markdown fences, no preamble, in exactly this shape:
{
  "assignment": "...",
  "parentUpdate": "...",
  "teacherNote": "..."
}

- "assignment": a short, clear weekly practice assignment for the student, written directly to them, warm and encouraging in tone, including a simple day-by-day plan if useful. Natural, fluent ${assignmentLangName} — not a literal word-for-word translation.
- "parentUpdate": 2-4 sentences for the parent, professional and warm, summarizing progress and this week's focus. No jargon. Natural, fluent English.
- "teacherNote": a short private note to self about what to check at the start of the next lesson.`;

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
        messages: [{ role: "user", content: rawNotes }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { statusCode: 502, body: JSON.stringify({ error: "AI request failed", detail: errText }) };
    }

    const data = await response.json();
    const textBlock = data.content.find(b => b.type === "text");
    const cleaned = (textBlock ? textBlock.text : "{}").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      statusCode: 200,
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
