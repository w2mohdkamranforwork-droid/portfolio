// Vercel Serverless Function — /api/chat
//
// This is the ONLY place the LLM API key is ever touched. It is read from an
// environment variable at request time and never sent to, or embedded in,
// any frontend bundle. Configure it in the Vercel dashboard:
//   Project -> Settings -> Environment Variables -> OPENAI_API_KEY
// (or run `vercel env add OPENAI_API_KEY` from the CLI), then redeploy.
//
// Request body (sent by chatbot.js, which already did the retrieval step
// client-side): { query: string, context: string[] }
// Response body: { reply: string }

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";
const MAX_CONTEXT_CHUNKS = 4;
const MAX_QUERY_LENGTH = 500;

const SYSTEM_PROMPT = `You are SYS_CHAT, the AI assistant embedded in Mohammad Kamran Ansari's developer portfolio.
Answer ONLY using the CONTEXT block below, which was retrieved from Mohammad's resume, skills, education, and project data.
Rules:
- Stay strictly on topic: Mohammad's background, skills, experience, projects, and how to contact him.
- If the answer isn't in the CONTEXT, say you don't have that information in the local knowledge base and suggest the visitor use the contact form instead of guessing.
- Keep replies concise (2-5 sentences, or a short bullet list for multi-item answers like project lists).
- Match a technical, terminal-style tone, but stay plain-text (no markdown headers, no code fences).`;

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("SYS_CHAT: OPENAI_API_KEY is not set.");
        return res.status(500).json({ error: "AI service is not configured on the server." });
    }

    let body = req.body;
    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch {
            return res.status(400).json({ error: "Malformed JSON body." });
        }
    }

    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const context = Array.isArray(body?.context) ? body.context.filter(c => typeof c === "string") : [];

    if (!query) {
        return res.status(400).json({ error: "Missing 'query'." });
    }
    if (query.length > MAX_QUERY_LENGTH) {
        return res.status(400).json({ error: `'query' must be under ${MAX_QUERY_LENGTH} characters.` });
    }

    const contextBlock = context.slice(0, MAX_CONTEXT_CHUNKS)
        .map((chunk, i) => `[${i + 1}] ${chunk}`)
        .join("\n\n");

    try {
        const upstream = await fetch(OPENAI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL,
                temperature: 0.4,
                max_tokens: 400,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    {
                        role: "user",
                        content: `CONTEXT:\n${contextBlock || "(no relevant context retrieved)"}\n\nVISITOR QUESTION: ${query}`
                    }
                ]
            })
        });

        if (!upstream.ok) {
            const errText = await upstream.text();
            console.error("SYS_CHAT: upstream LLM error", upstream.status, errText);
            return res.status(502).json({ error: "AI service returned an error." });
        }

        const data = await upstream.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            return res.status(502).json({ error: "AI service returned an empty response." });
        }

        return res.status(200).json({ reply });
    } catch (err) {
        console.error("SYS_CHAT: request to LLM failed", err);
        return res.status(502).json({ error: "Could not reach the AI service." });
    }
};
