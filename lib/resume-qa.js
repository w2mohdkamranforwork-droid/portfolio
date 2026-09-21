// Local question answering over the resume in ./resume/ — no LLM, no API key.
//
// The resume is split into sections by its headings. A question is routed to
// the section it's about (skills, projects, contact...) and, if it names
// something specific (".NET", "React", "Crisfood"), narrowed to the lines that
// mention it. Every reply is quoted straight from the resume, so nothing is
// ever invented; the trade-off is extractive answers rather than written prose.

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

// Section title -> canonical type. First match wins.
const SECTION_TYPES = [
    ["experience", /experience|employment|work history|internship|career/],
    ["education", /education|academic|qualification/],
    ["skills", /skill|technolog|tech stack|competenc|tools|expertise/],
    ["projects", /project|portfolio/],
    ["certifications", /certif|course|training|licen[cs]e/],
    ["achievements", /achiev|award|honou?r|accomplish/],
    ["testimonials", /testimonial|review|reference|recommend/],
    ["summary", /summary|profile|objective|about/],
    ["contact", /contact/],
    ["languages", /^languages?$/]
];

// Plain-text headings as they appear in PDF/DOCX exports ("Work Experience:").
const KNOWN_HEADINGS = /^(work |professional |technical |key |core |academic )?(experience|education|skills|projects|certifications?|achievements|awards|summary|profile|objective|about me|contact|languages|interests|hobbies|testimonials|references|internships?|publications|volunteering)\s*:?$/i;

// Question -> which section it's asking about. Order matters where one
// question trips several: "what projects has he worked on" wants projects,
// not experience, so projects sits above experience.
const INTENTS = [
    ["contact", /\b(contact|e-?mail|mail|phone|mobile|number|call|whatsapp|reach|hire|linkedin|github|location|located|based|live|lives|address)\b/],
    ["education", /\b(educat\w*|degree|college|universit\w*|stud(y|ied|ying)|b\.?tech|diploma|cgpa|gpa|school|qualif\w*|marks|percentage|graduat\w*)\b/],
    ["certifications", /\b(certif\w*|courses?|training)\b/],
    ["achievements", /\b(achiev\w*|awards?|honou?rs?)\b/],
    ["testimonials", /\b(reviews?|testimonials?|feedback|clients?|recommend\w*|references?)\b/],
    ["projects", /\b(projects?|built|build|apps?|applications?|made|developed|portfolio)\b/],
    ["experience", /\b(experience[ds]?|work(ed|ing)?|jobs?|intern\w*|employ\w*|compan(y|ies)|career|roles?)\b/],
    ["skills", /\b(skills?|tech|technolog\w*|stack|languages?|frameworks?|tools?|knows?|proficien\w*|expert\w*|strengths?)\b/],
    ["summary", /\b(who|about|summary|introduc\w*|yourself|himself|herself|overview|profile|background)\b/]
];

const STOPWORDS = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "am", "of", "in",
    "on", "at", "to", "for", "with", "and", "or", "but", "do", "does", "did",
    "have", "has", "had", "i", "you", "he", "she", "it", "we", "they", "what",
    "which", "who", "whom", "how", "when", "where", "why", "this", "that", "his",
    "her", "him", "your", "my", "me", "can", "could", "would", "should", "will",
    "tell", "show", "list", "give", "please", "any", "all", "some", "top", "much",
    "many", "there", "their", "any", "does", "doing", "done", "get", "got", "also",
    "more", "most", "details", "detail", "info", "information", "name", "s",
    "today", "now", "currently", "current", "latest", "right", "like", "really",
    // Hinglish, since visitors to an Indian portfolio will type it.
    "kya", "hai", "hain", "uska", "uski", "uske", "unka", "unki", "unke", "ka",
    "ki", "ke", "ko", "se", "mein", "me", "batao", "bataiye", "kaun", "kon",
    "kitna", "kitne", "aur", "bhi", "kaise", "kahan", "kab"
]);

const ALIASES = {
    dotnet: ".net", csharp: "c#", js: "javascript", ts: "typescript",
    reactjs: "react", nextjs: "next.js", nodejs: "node.js", node: "node.js",
    py: "python", mongo: "mongodb", postgres: "postgresql", k8s: "kubernetes"
};

const GREETING = /^(hi+|hello|hey+|yo|hola|namaste|salam|assalamualaikum|good (morning|afternoon|evening))\b/;
const CONTACT_LINE = /@|\+?\d[\d\s-]{7,}\d|linkedin|github|https?:|www\.|availab|based in|location/i;

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

function tokenize(text) {
    return (text.toLowerCase().match(/[a-z0-9+#./-]+/g) || [])
        // Trim stray punctuation, but keep ".net" whole — its dot is the name.
        .map(t => t.replace(/^[./-]+(?!net\b)/, "").replace(/[./-]+$/, ""))
        .filter(t => t.length > 1);
}

function stripMarkdown(line) {
    return line
        .replace(/^#{1,6}\s+/, "")
        .replace(/^([-*•▪◦·]|\d+[.)])\s+/, "")
        .replace(/\*\*|__|`/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function truncate(text, max) {
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(" — "));
    return (stop > max * 0.5 ? cut.slice(0, stop + 1) : cut.slice(0, cut.lastIndexOf(" "))) + " …";
}

// Edit distance counting a swap of neighbours as one edit, so "expeirnces"
// is 2 away from "experiences" rather than 3.
function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
            }
        }
    }
    return d[a.length][b.length];
}

// Longer words tolerate two typos, shorter ones only one.
function closeEnough(word, target) {
    if (word.length < 4 || target.length < 4) return false;
    return editDistance(word, target) <= (target.length >= 8 ? 2 : 1);
}

// Section words visitors misspell. A typo is only corrected when the word
// isn't itself in the resume, so "contract" never becomes "contact".
const TOPIC_WORDS = [
    "experience", "experiences", "education", "skills", "projects", "project",
    "contact", "certifications", "testimonials", "achievements", "internship",
    "internships", "summary", "qualification"
];

function fixTopicTypos(q, resumeWords) {
    return q.replace(/[a-z]{5,}/g, word => {
        if (TOPIC_WORDS.includes(word) || resumeWords.has(word) || STOPWORDS.has(word)) return word;
        return TOPIC_WORDS.find(t => closeEnough(word, t)) || word;
    });
}

function termMatches(term, tokens) {
    // Substring matching lets "react" hit "react.js" and ".net" hit
    // "asp.net", but only for terms long enough not to match everything.
    return tokens.some(t => t === term || (term.length >= 3 && t.includes(term)));
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function headingOf(line) {
    const raw = line.trim();
    const md = raw.match(/^#{2,6}\s+(.+)$/);
    if (md) return stripMarkdown(md[1]);

    const t = raw.replace(/\*\*|__/g, "").trim();
    if (KNOWN_HEADINGS.test(t)) return t.replace(/:$/, "");
    // PDF/DOCX exports usually set section titles in capitals: "WORK EXPERIENCE".
    if (t.length >= 4 && t.length <= 40 && /^[A-Z][A-Z &/,-]+$/.test(t)) return t;
    return null;
}

function sectionType(title) {
    const lower = title.toLowerCase();
    const hit = SECTION_TYPES.find(([, re]) => re.test(lower));
    return hit ? hit[0] : "other";
}

// A section body -> answerable items. Paragraphs stay whole; bullet lists and
// line-per-fact blocks (the header, most PDF text) split into one item per
// line, with hard-wrapped continuation lines folded back into their item.
function itemsOf(body) {
    const paras = body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const items = [];

    const isBullet = l => /^([-*•▪◦·]|\d+[.)])\s/.test(l);
    // "systems. Combines..." carries on the sentence above it; a new fact
    // ("Email: ...", "Bandra, Mumbai") starts with a capital or a symbol, and
    // an email/phone/URL line always stands alone even though it may be lowercase.
    const continues = (prev, line) =>
        !CONTACT_LINE.test(line) && (/^[a-z]/.test(line) || /[,&—-]$/.test(prev));

    for (const para of paras) {
        const lines = para.split("\n").map(l => l.trim()).filter(Boolean);
        const bullets = lines.filter(isBullet).length;

        if (bullets > 1 || (paras.length === 1 && lines.length > 1)) {
            const start = items.length;
            for (const line of lines) {
                const prev = items.length > start ? items[items.length - 1] : null;
                const joins = prev !== null && (bullets > 1 ? !isBullet(line) : continues(prev, line));
                if (joins) items[items.length - 1] += " " + line;
                else items.push(line);
            }
        } else {
            items.push(lines.join(" "));
        }
    }

    return items.map(stripMarkdown).filter(Boolean);
}

function parseResume(text) {
    const sections = [{ title: "Header", lines: [] }];

    for (const line of text.split("\n")) {
        const heading = headingOf(line);
        if (heading) sections.push({ title: heading, lines: [] });
        else sections[sections.length - 1].lines.push(line);
    }

    const parsed = sections
        .map(s => {
            const items = itemsOf(s.lines.join("\n"));
            return {
                title: s.title,
                type: s.title === "Header" ? "header" : sectionType(s.title),
                items,
                tokens: items.map(tokenize)
            };
        })
        .filter(s => s.items.length);

    const header = parsed.find(s => s.type === "header");
    const name = header ? header.items[0] : "the candidate";

    return { sections: parsed, name };
}

// ---------------------------------------------------------------------------
// Structuring — resume lines -> display cards
// ---------------------------------------------------------------------------
//
// An answer is { intro, sections: [{ title, items }], note, suggestions }.
// Each item is { title, tag, subtitle, text, chips, href }: e.g.
//   "Advanced CRUD Solutions (Production Ready) — High-performance ... Tech: C#, MVC"
// becomes title "Advanced CRUD Solutions", tag "Production Ready", the prose
// as text, and ["C#", "MVC"] as chips. Anything that doesn't fit the pattern
// simply lands in text, so an unusual resume degrades to plain paragraphs.

function splitTag(title) {
    const m = title.match(/^(.*?)\s*\(([^()]{1,60})\)\s*$/);
    return m && m[1] ? { title: m[1].trim(), tag: m[2].trim() } : { title: title.trim(), tag: null };
}

function linkFor(text) {
    const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]*\w/);
    if (email) return `mailto:${email[0]}`;
    const url = text.match(/https?:\/\/[^\s|,]+|(?:www\.)?(?:linkedin|github)\.com\/[^\s|,]+/i);
    if (url) return url[0].startsWith("http") ? url[0] : `https://${url[0]}`;
    const phone = text.match(/\+?\d[\d\s-]{7,}\d/);
    if (phone) return `tel:${phone[0].replace(/[\s-]/g, "")}`;
    return null;
}

function firstSentence(text, max = 300) {
    // A sentence ends at . ! ? followed by whitespace, so "ASP.NET" survives.
    const m = text.match(/^.*?[.!?](?=\s|$)/);
    let s = m ? m[0] : text;
    if (s.length > max) {
        // Cut at a clause boundary rather than mid-phrase.
        const cut = s.slice(0, max);
        const at = Math.max(cut.lastIndexOf(", "), cut.lastIndexOf("; "));
        s = (at > max * 0.5 ? cut.slice(0, at) : cut.slice(0, cut.lastIndexOf(" "))) + "…";
    }
    return s;
}

function structureItem(raw, type) {
    let text = raw.trim();
    let chips = [];
    let title = null;
    let tag = null;
    let subtitle = null;

    // Trailing "Tech: C#, SQL Server." -> chips.
    const techAt = text.search(/\b(Tech(nologies| stack)?|Stack|Built with)\s*:\s*/i);
    if (techAt > 0) {
        chips = text.slice(techAt).replace(/^[^:]*:\s*/, "").replace(/\.\s*$/, "")
            .split(/,\s*/).map(s => s.trim()).filter(Boolean);
        text = text.slice(0, techAt).trim();
    }

    // "Title — rest" or "Label: rest". A colon only counts as a label when no
    // sentence ends before it, so prose containing a colon stays prose.
    const dash = text.search(/\s[—–]\s/);
    const colon = text.search(/:\s/);
    if (dash > 0 && dash <= 90) {
        title = text.slice(0, dash);
        text = text.slice(dash + 3).trim();
    } else if (colon > 0 && colon <= 60 && !/[.!?]\s/.test(text.slice(0, colon))) {
        title = text.slice(0, colon);
        text = text.slice(colon + 1).trim();
    }

    if (title) ({ title, tag } = splitTag(title));

    // "Crisfood (Jan 2023 - June 2023) Collaborated..." — in experience and
    // education, a short name plus a parenthetical right after the title is the
    // company/school and its dates. (Elsewhere "AWS (EC2/S3)" is just a skill.)
    const lead = title && (type === "experience" || type === "education") &&
        text.match(/^([^()]{2,50}?)\s*\(([^()]{1,40})\)\s*[.,]?\s*/);
    // Initials like "M. H. Saboo" are fine; a whole sentence before the "(" isn't.
    if (lead && !/\.\s+[a-z]|[!?]/.test(lead[1])) {
        subtitle = lead[1].trim();
        if (!tag) tag = lead[2].trim();
        text = text.slice(lead[0].length).trim();
    }

    // Skills lines: comma lists become chips ("Python: Django, Flask" too, as
    // Python + Django + Flask); only genuine prose is left as text, shown
    // under the chips since the chips are the point of a skills entry.
    let chipsFirst = false;
    if (type === "skills" && !chips.length && text) {
        const shortList = s => {
            const parts = s.replace(/\.$/, "").split(/,\s*/).map(p => p.trim()).filter(Boolean);
            return parts.length && parts.every(p => p.length <= 32) ? parts : null;
        };
        const prose = [];
        for (const sentence of text.split(/\.\s+(?=[A-Z])/)) {
            const labelled = sentence.match(/^([\w#+. ]{1,20}):\s*(.+)$/);
            const parts = labelled ? shortList(labelled[2]) : shortList(sentence);
            if (parts && (labelled || parts.length >= 2)) chips.push(...(labelled ? [labelled[1].trim(), ...parts] : parts));
            else prose.push(sentence);
        }
        if (chips.length) {
            chipsFirst = true;
            text = prose.join(". ");
        }
    }

    return { title, tag, subtitle, text: text || null, chips, href: null, chipsFirst };
}

function displayTitle(section) {
    if (section.type === "header") return "Profile";
    // "WORK EXPERIENCE" from a PDF -> "Work Experience".
    return section.title === section.title.toUpperCase()
        ? section.title.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase())
        : section.title;
}

function sectionBlock(section, { compact = false, limit = 8 } = {}) {
    let items = section.items.map(i => structureItem(i, section.type));
    let note = null;

    if (compact) {
        items.forEach(it => {
            if (it.text) it.text = firstSentence(it.text);
            it.chips = it.chips.slice(0, 6);
        });
        if (items.length > limit) {
            note = `+${items.length - limit} more in the ${displayTitle(section)} section.`;
            items = items.slice(0, limit);
        }
    }

    return { block: { title: displayTitle(section), items }, note };
}

// ---------------------------------------------------------------------------
// Answering
// ---------------------------------------------------------------------------

function suggestionsFor(resume) {
    const list = resume.sections
        .filter(s => s.type !== "header")
        .map(s => ({ label: displayTitle(s), query: `Show ${displayTitle(s)}` }));
    list.push({ label: "Contact", query: "Contact info" });
    return list;
}

function who(resume) {
    const first = resume.name === "the candidate" ? "the candidate" : resume.name.split(/\s+/)[0];
    return { first, possessive: `${first}'s` };
}

const SECTION_INTROS = {
    projects: (p, n) => n === 1 ? `Here's the project on ${p} resume:` : `Here are the ${n} projects on ${p} resume:`,
    skills: p => `Here's ${p} skill set:`,
    experience: p => `Here's ${p} work experience:`,
    education: p => `Here's ${p} education:`,
    certifications: p => `Here are ${p} certifications:`,
    achievements: p => `Here are ${p} achievements:`,
    testimonials: p => `Here's what people have said about ${p} work:`
};

function sectionsAnswer(resume, sections) {
    const { possessive } = who(resume);
    const total = sections.reduce((n, s) => n + s.items.length, 0);
    const long = sections.reduce((n, s) => n + s.items.join(" ").length, 0) > 900;

    const blocks = [];
    const notes = [];
    for (const section of sections) {
        const { block, note } = sectionBlock(section, { compact: long });
        blocks.push(block);
        if (note) notes.push(note);
    }

    const introFor = SECTION_INTROS[sections[0].type];
    return {
        intro: introFor ? introFor(possessive, total) : `Here's the ${displayTitle(sections[0])} section of ${possessive} resume:`,
        sections: blocks,
        note: notes.length ? notes.join(" ") + " Ask about one by name for the full details." : (long ? "Ask about any one by name for the full details." : null)
    };
}

function contactAnswer(resume) {
    const lines = resume.sections
        .filter(s => s.type === "header" || s.type === "contact")
        .flatMap(s => s.items)
        .filter(l => CONTACT_LINE.test(l))
        // "Email: a@b.com | Phone: 123" -> one row per channel.
        .flatMap(l => l.split(/\s+\|\s+/));

    if (!lines.length) return null;

    const items = lines.map(line => {
        const item = structureItem(line, "contact");
        item.href = linkFor(item.text || line);
        return item;
    });

    return {
        intro: `You can reach ${who(resume).first} here:`,
        sections: [{ title: "Contact", items }],
        note: "Or use the contact form on this page."
    };
}

function summaryAnswer(resume) {
    const header = resume.sections.find(s => s.type === "header");
    const facts = header ? header.items.filter(l => !CONTACT_LINE.test(l)) : [];
    const summary = resume.sections.find(s => s.type === "summary");
    if (!facts.length && !summary) return null;

    return {
        intro: null,
        sections: [{
            title: "About",
            items: [{
                title: facts[0] || resume.name,
                tag: null,
                subtitle: facts.slice(1, 3).join(" · ") || null,
                text: summary ? summary.items.join(" ") : null,
                chips: [],
                href: null
            }]
        }],
        note: null
    };
}

function helpAnswer(resume, intro) {
    return { intro, sections: [], note: null, suggestions: suggestionsFor(resume) };
}

// Score every resume item for the specific terms in the question.
function searchTerms(resume, terms, intents) {
    const hits = [];

    resume.sections.forEach((section, si) => {
        section.items.forEach((item, ii) => {
            const matched = terms.filter(t => termMatches(t, section.tokens[ii])).length;
            if (!matched) return;
            const boost = intents.includes(section.type) ? 0.5 : 0;
            hits.push({ section, item, score: matched + boost, order: si * 1000 + ii });
        });
    });

    if (!hits.length) return [];

    // Prefer items matching the most terms; among equals, favour the section
    // the question was about, then resume order.
    const best = Math.max(...hits.map(h => Math.floor(h.score)));
    return hits
        .filter(h => Math.floor(h.score) === best)
        .sort((a, b) => b.score - a.score || a.order - b.order)
        .slice(0, 4);
}

function hitsAnswer(resume, hits, shown) {
    const blocks = [];
    for (const hit of hits) {
        const title = displayTitle(hit.section);
        let block = blocks.find(b => b.title === title);
        if (!block) blocks.push(block = { title, items: [] });
        const item = structureItem(hit.item, hit.section.type);
        if (item.text) item.text = truncate(item.text, 400);
        block.items.push(item);
    }
    return {
        intro: `Here's what ${who(resume).possessive} resume says about ${shown}:`,
        sections: blocks,
        note: null
    };
}

// Show the visitor's own spelling of a term (".NET", not ".net").
function displayTerms(question, terms) {
    const shown = terms.map(t => {
        const at = question.toLowerCase().indexOf(t);
        return at >= 0 ? question.slice(at, at + t.length) : t;
    });
    return shown.length > 1 ? `${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}` : shown[0];
}

function answer(question, resumeText) {
    const resume = parseResume(resumeText);
    const { possessive } = who(resume);
    const resumeWords = new Set(resume.sections.flatMap(s => s.tokens.flat()));
    const q = fixTopicTypos(question.toLowerCase().replace(/\bdot\s?net\b/g, ".net").trim(), resumeWords);

    if (GREETING.test(q) && q.split(/\s+/).length <= 4) {
        return helpAnswer(resume, `Hi! I'm ${possessive} portfolio assistant. Ask me about the experience, skills, or projects on the resume, or pick a topic:`);
    }

    const intents = INTENTS.filter(([, re]) => re.test(q)).map(([key]) => key);

    // What's left after removing the "which section" words is the specific
    // thing being asked about: ".net", "crisfood", "azure"...
    let remainder = q;
    INTENTS.forEach(([, re]) => { remainder = remainder.replace(new RegExp(re.source, "g"), " "); });
    // The person's own name isn't a search term — including common spellings
    // of it ("kamaran", "mohammed", "muhammad").
    const nameTokens = tokenize(resume.name);
    const isName = t => nameTokens.some(n => n === t || closeEnough(t, n));
    let terms = [...new Set(
        tokenize(remainder)
            .filter(t => !STOPWORDS.has(t) && !isName(t))
            .map(t => ALIASES[t] || t)
    )];

    // A question naming a section outright ("Show Interests") routes there,
    // even for section types the intent list doesn't know about.
    const named = resume.sections.find(s => s.type !== "header" && q.includes(s.title.toLowerCase()));
    if (named) {
        const titleTokens = new Set(tokenize(named.title));
        terms = terms.filter(t => !titleTokens.has(t));
    }

    const primary = intents[0];

    if (primary === "contact" && !terms.length) {
        return contactAnswer(resume) || helpAnswer(resume, `There are no contact details in ${possessive} resume.`);
    }

    if (terms.length) {
        const shown = displayTerms(question.replace(/\bdot\s?net\b/gi, ".NET"), terms);
        const hits = searchTerms(resume, terms, intents);
        if (hits.length) return hitsAnswer(resume, hits, shown);

        const fallback = primary && resume.sections.filter(s => s.type === primary);
        if (fallback && fallback.length) {
            const base = sectionsAnswer(resume, fallback);
            base.intro = `${possessive} resume doesn't mention ${shown}. Here's what it lists under ${displayTitle(fallback[0])} instead:`;
            return base;
        }
        // No section intent either: likely off-topic ("weather"), so say what
        // this assistant is for rather than just "not found".
        return helpAnswer(resume, primary
            ? `${possessive} resume doesn't mention ${shown}. Try one of these topics:`
            : `I can only answer questions about ${possessive} resume, and it doesn't mention ${shown}. Try one of these topics:`);
    }

    if (named && (!primary || primary === named.type || named.type === "other")) {
        return sectionsAnswer(resume, [named]);
    }

    if (primary === "summary") {
        return summaryAnswer(resume) || helpAnswer(resume, `Here's what I can tell you about from ${possessive} resume:`);
    }

    if (primary) {
        const matching = resume.sections.filter(s => s.type === primary);
        if (matching.length) return sectionsAnswer(resume, matching);
        return helpAnswer(resume, `${possessive} resume doesn't have a ${primary} section. Try one of these:`);
    }

    return helpAnswer(resume, `I couldn't match that to anything in ${possessive} resume. Try one of these topics:`);
}

// Plain-text rendering of an answer — sent alongside the structured form for
// clients (or logs) that can't render cards.
function toPlainText(ans) {
    const out = [];
    if (ans.intro) out.push(ans.intro);
    for (const section of ans.sections) {
        const lines = [`${section.title.toUpperCase()}:`];
        for (const it of section.items) {
            const head = [it.title, it.tag && `(${it.tag})`].filter(Boolean).join(" ");
            const parts = [head, it.subtitle, it.text, it.chips.length ? it.chips.join(", ") : null].filter(Boolean);
            lines.push(`- ${parts.join(" — ")}`);
        }
        out.push(lines.join("\n"));
    }
    if (ans.note) out.push(ans.note);
    if (ans.suggestions) out.push(`Topics: ${ans.suggestions.map(s => s.label).join(", ")}`);
    return out.join("\n\n");
}

module.exports = { answer, toPlainText, parseResume };
