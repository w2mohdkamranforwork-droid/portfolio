// Vercel Serverless Function — /api/resume-status
//
// Diagnostic only: confirms which file in resume/ the chatbot is currently
// answering from, which sections it found in it, and surfaces extraction
// failures (e.g. a scanned PDF) that would otherwise only show up as a vague
// chat error.

const { loadResume } = require("../lib/resume-store.js");
const { parseResume } = require("../lib/resume-qa.js");

module.exports = async (req, res) => {
    const resume = loadResume();

    if (!resume.ok) {
        return res.status(200).json({ loaded: false, file: resume.file || null, error: resume.error });
    }

    const parsed = parseResume(resume.text);

    return res.status(200).json({
        loaded: true,
        file: `resume/${resume.file}`,
        updated: resume.updated,
        characters: resume.text.length,
        name: parsed.name,
        sections: parsed.sections.filter(s => s.type !== "header").map(s => `${s.title} (${s.type})`),
        preview: resume.text.slice(0, 200)
    });
};
