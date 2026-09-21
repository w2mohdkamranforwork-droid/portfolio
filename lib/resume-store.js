// Resume ingestion for SYS_CHAT.
//
// Drop a resume file into ./resume/ and the chatbot answers from it. No code
// edit, no restart: the newest supported file in that folder wins, and the
// cache is keyed on the file's mtime, so saving a new version is picked up on
// the very next question.
//
// Supported: .md .txt .json natively; .pdf and .docx are extracted here with
// zero dependencies (zlib is Node stdlib). A scanned/image-only PDF has no
// text layer to extract from — export .md or .txt in that case.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const RESUME_DIR = path.join(__dirname, "..", "resume");
const SUPPORTED = [".md", ".markdown", ".txt", ".json", ".pdf", ".docx"];
const SKIP_NAMES = new Set(["readme.md", "readme.txt"]);

// ---------------------------------------------------------------------------
// Decoding helpers
// ---------------------------------------------------------------------------

// PowerShell's `>` and Set-Content write UTF-16LE by default, which plain utf8
// parsing turns into interleaved NULs. Sniff the BOM like dev-server.js does.
function decodeText(buf) {
    if (buf[0] === 0xff && buf[1] === 0xfe) return buf.toString("utf16le", 2);
    if (buf[0] === 0xfe && buf[1] === 0xff) {
        const swapped = Buffer.from(buf.subarray(2));
        swapped.swap16();
        return swapped.toString("utf16le");
    }
    return buf.toString("utf8").replace(/^﻿/, "");
}

// ---------------------------------------------------------------------------
// PDF text extraction
// ---------------------------------------------------------------------------

function pdfUnescape(str) {
    return str.replace(/\\(n|r|t|b|f|\(|\)|\\|[0-7]{1,3})/g, (_, g) => {
        switch (g) {
            case "n": return "\n";
            case "r": return "\r";
            case "t": return "\t";
            case "b": return "\b";
            case "f": return "\f";
            case "(": return "(";
            case ")": return ")";
            case "\\": return "\\";
            default: return String.fromCharCode(parseInt(g, 8));
        }
    });
}

function hexStringToText(hex) {
    const clean = hex.replace(/[^0-9a-fA-F]/g, "");
    let out = "";
    for (let i = 0; i + 1 < clean.length; i += 2) {
        const code = parseInt(clean.substr(i, 2), 16);
        if (code) out += String.fromCharCode(code);
    }
    return out;
}

// Walk a decoded content stream pulling out the text-showing operators.
// Tj/TJ/'/" carry the glyphs; Td/TD/T*/ET move the cursor, which is the only
// signal a PDF gives that a visual line ended.
function extractPdfOperators(content) {
    let out = "";
    let i = 0;

    while (i < content.length) {
        const ch = content[i];

        if (ch === "(") {
            let depth = 1;
            let j = i + 1;
            let raw = "";
            while (j < content.length && depth > 0) {
                const c = content[j];
                if (c === "\\") { raw += c + (content[j + 1] || ""); j += 2; continue; }
                if (c === "(") depth++;
                else if (c === ")" && --depth === 0) break;
                raw += c;
                j++;
            }
            out += pdfUnescape(raw);
            i = j + 1;
            continue;
        }

        if (ch === "<" && content[i + 1] !== "<") {
            const end = content.indexOf(">", i);
            if (end !== -1 && end - i < 2048) {
                out += hexStringToText(content.slice(i + 1, end));
                i = end + 1;
                continue;
            }
        }

        const op = content.substr(i, 2);
        if (op === "Td" || op === "TD" || op === "T*" || op === "ET") {
            out += "\n";
            i += 2;
            continue;
        }

        i++;
    }

    return out;
}

function extractPdf(buf) {
    const parts = [];
    let i = 0;

    while (true) {
        const start = buf.indexOf("stream", i);
        if (start === -1) break;

        let dataStart = start + 6;
        if (buf[dataStart] === 0x0d) dataStart++;
        if (buf[dataStart] === 0x0a) dataStart++;

        const end = buf.indexOf("endstream", dataStart);
        if (end === -1) break;
        i = end + 9;

        const raw = buf.subarray(dataStart, end);
        let decoded;
        try {
            decoded = zlib.inflateSync(raw).toString("latin1");
        } catch {
            try { decoded = zlib.inflateRawSync(raw).toString("latin1"); }
            // Not Flate-compressed at all: some writers emit plain content
            // streams. The BT check below filters out genuine binary blobs.
            catch { decoded = raw.toString("latin1"); }
        }

        // Fonts and images are Flate-compressed too. A *text* content stream
        // always opens a text object with BT, so use that as the filter —
        // without it we would inflate a font file and emit binary noise.
        if (!/\bBT\b/.test(decoded)) continue;
        parts.push(extractPdfOperators(decoded));
    }

    return parts.join("\n");
}

// ---------------------------------------------------------------------------
// DOCX text extraction (a .docx is a zip; read one entry out of it)
// ---------------------------------------------------------------------------

function unzipEntry(buf, wanted) {
    // End-of-central-directory record: a fixed 22-byte tail plus up to 64KB of
    // optional comment, so scan backwards for its signature.
    let eocd = -1;
    const floor = Math.max(0, buf.length - 22 - 65535);
    for (let i = buf.length - 22; i >= floor; i--) {
        if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd === -1) return null;

    const count = buf.readUInt16LE(eocd + 10);
    let off = buf.readUInt32LE(eocd + 16);

    for (let n = 0; n < count; n++) {
        if (off + 46 > buf.length || buf.readUInt32LE(off) !== 0x02014b50) return null;

        const method = buf.readUInt16LE(off + 10);
        const compSize = buf.readUInt32LE(off + 20);
        const nameLen = buf.readUInt16LE(off + 28);
        const extraLen = buf.readUInt16LE(off + 30);
        const commentLen = buf.readUInt16LE(off + 32);
        const localOff = buf.readUInt32LE(off + 42);
        const name = buf.toString("utf8", off + 46, off + 46 + nameLen);

        if (name === wanted) {
            // The local header repeats the name/extra lengths and they can
            // differ from the central directory's — always re-read them here.
            const lNameLen = buf.readUInt16LE(localOff + 26);
            const lExtraLen = buf.readUInt16LE(localOff + 28);
            const dataStart = localOff + 30 + lNameLen + lExtraLen;
            const data = buf.subarray(dataStart, dataStart + compSize);
            return method === 0 ? data : zlib.inflateRawSync(data);
        }

        off += 46 + nameLen + extraLen + commentLen;
    }

    return null;
}

function extractDocx(buf) {
    const xml = unzipEntry(buf, "word/document.xml");
    if (!xml) throw new Error("not a readable .docx (word/document.xml missing)");

    return xml.toString("utf8")
        .replace(/<w:tab[^>]*\/>/g, "\t")
        .replace(/<w:br[^>]*\/>/g, "\n")
        .replace(/<\/w:p>/g, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&");
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

function tidy(text) {
    return text
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "")
        .trim();
}

// A PDF whose fonts use a custom encoding extracts as mojibake rather than
// failing outright. Catch that here so the visitor gets an actionable message
// instead of the model hallucinating over garbage.
function looksLikeProse(text) {
    if (text.length < 80) return false;
    const letters = (text.match(/[A-Za-z]/g) || []).length;
    return letters / text.length > 0.5;
}

function findResumeFile() {
    if (!fs.existsSync(RESUME_DIR)) return null;

    const candidates = fs.readdirSync(RESUME_DIR)
        .filter(name => !name.startsWith("."))
        .filter(name => !SKIP_NAMES.has(name.toLowerCase()))
        .filter(name => SUPPORTED.includes(path.extname(name).toLowerCase()))
        .map(name => {
            const full = path.join(RESUME_DIR, name);
            const stat = fs.statSync(full);
            return stat.isFile() ? { name, full, mtime: stat.mtimeMs, size: stat.size } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.mtime - a.mtime);

    return candidates[0] || null;
}

let cache = { key: null, value: null };

// Returns { ok: true, text, file, updated } or { ok: false, error, file? }.
function loadResume() {
    let found;
    try {
        found = findResumeFile();
    } catch (err) {
        return { ok: false, error: `Could not read the resume/ folder: ${err.message}` };
    }

    if (!found) {
        return { ok: false, error: "No resume file found in the resume/ folder." };
    }

    const key = `${found.full}:${found.mtime}:${found.size}`;
    if (cache.key === key) return cache.value;

    let result;
    try {
        const buf = fs.readFileSync(found.full);
        const ext = path.extname(found.name).toLowerCase();

        let text;
        if (ext === ".pdf") text = extractPdf(buf);
        else if (ext === ".docx") text = extractDocx(buf);
        else text = decodeText(buf);

        text = tidy(text);

        const binaryFormat = ext === ".pdf" || ext === ".docx";

        if (binaryFormat && !looksLikeProse(text)) {
            result = {
                ok: false,
                file: found.name,
                error: `'${found.name}' has no readable text layer (it may be a scan, or use ` +
                       `embedded fonts with a custom encoding). Save it as .md or .txt in resume/ instead.`
            };
        } else if (!text) {
            result = { ok: false, file: found.name, error: `'${found.name}' produced no text.` };
        } else {
            result = {
                ok: true,
                text,
                file: found.name,
                updated: new Date(found.mtime).toISOString()
            };
        }
    } catch (err) {
        result = { ok: false, file: found.name, error: `Could not read '${found.name}': ${err.message}` };
    }

    cache = { key, value: result };
    return result;
}

module.exports = { loadResume, RESUME_DIR };
