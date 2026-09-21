// Vercel Serverless Function — /api/chat
//
// Answers visitor questions about Mohammad straight from the resume file in
// ./resume/. No LLM, no API key, no network call: lib/resume-qa.js routes the
// question to the matching resume section and quotes it. Swap the resume file
// and the answers change on the next question — nothing here needs editing.
//
// Request body:  { query: string, context?: string[] }
// Response body: { reply: string, answer?: object, source: string }
//   answer — structured cards (intro, sections of items, note, suggestions)
//            that chatbot.js renders; reply is the same content as plain text.

const { loadResume } = require("../lib/resume-store.js");
const { answer, toPlainText } = require("../lib/resume-qa.js");

const MAX_QUERY_LENGTH = 500;

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    let body = req.body;
    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch {
            return res.status(400).json({ error: "Malformed JSON body." });
        }
    }

    const raw = body?.query ?? body?.message;
    const query = typeof raw === "string" ? raw.trim() : "";

    if (!query) {
        return res.status(400).json({ error: "Missing 'query'." });
    }
    if (query.length > MAX_QUERY_LENGTH) {
        return res.status(400).json({ error: `'query' must be under ${MAX_QUERY_LENGTH} characters.` });
    }

    const resume = loadResume();

    if (resume.ok) {
        const result = answer(query, resume.text);
        return res.status(200).json({ reply: toPlainText(result), answer: result, source: `resume/${resume.file}` });
    }

    // No usable resume: fall back to the best chunk chatbot.js retrieved from
    // data/knowledge-base.js, so the widget still answers instead of going dark.
    console.warn("SYS_CHAT: no usable resume —", resume.error);
    const fallback = Array.isArray(body?.context) ? body.context.find(c => typeof c === "string") : null;

    if (!fallback) {
        return res.status(503).json({ error: `No resume loaded. ${resume.error}` });
    }
    return res.status(200).json({ reply: fallback, source: "data/knowledge-base.js" });
};
