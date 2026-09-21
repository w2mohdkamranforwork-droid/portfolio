// Local dev server: static files + /api/chat, zero dependencies.
//   node dev-server.js   ->   http://localhost:3000
// Exists because opening index.html via file:// gives the chatbot no
// /api/chat to talk to, and `vercel dev` needs a global install.
const http = require("http");
const fs = require("fs");
const path = require("path");

// Minimal .env.local loader. Decodes UTF-16 too — PowerShell's `>` and
// Set-Content write UTF-16LE by default, which plain utf8 parsing mangles.
const envFile = path.join(__dirname, ".env.local");
if (fs.existsSync(envFile)) {
    const raw = fs.readFileSync(envFile);
    const text = (raw[0] === 0xff && raw[1] === 0xfe ? raw.toString("utf16le", 2) : raw.toString("utf8"))
        .replace(/^\uFEFF/, "");
    for (const line of text.split(/\r?\n/)) {
        const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)$/);
        // Don't override an already-set variable — matches dotenv, and keeps
        // a real env var from being clobbered by a stale placeholder file.
        if (m && !line.trimStart().startsWith("#") && process.env[m[1]] === undefined) {
            process.env[m[1]] = m[2].trim().replace(/^["'](.*)["']$/, "$1");
        }
    }
}

const TYPES = {
    ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
    ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
    ".ico": "image/x-icon", ".txt": "text/plain", ".xml": "application/xml"
};

http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");

    // Mirror the Vercel function routing: /api/<name> -> api/<name>.js, with
    // the same req.body / res.status() / res.json() shims those handlers expect.
    const apiRoute = url.pathname.match(/^\/api\/([\w-]+)$/);
    if (apiRoute) {
        const handlerPath = path.join(__dirname, "api", `${apiRoute[1]}.js`);
        if (!fs.existsSync(handlerPath)) { res.statusCode = 404; return res.end("Not found"); }

        const chunks = [];
        for await (const c of req) chunks.push(c);
        req.body = chunks.length ? Buffer.concat(chunks).toString() : "";
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (obj) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); return res; };

        // Drop api/ and lib/ modules from require's cache each request so code
        // edits take effect on reload without restarting the server.
        for (const cached of Object.keys(require.cache)) {
            if (cached.startsWith(path.join(__dirname, "api")) || cached.startsWith(path.join(__dirname, "lib"))) {
                delete require.cache[cached];
            }
        }
        return require(handlerPath)(req, res);
    }

    // Static. Resolve inside the project root only — no ../ escapes.
    const rel = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    let file = path.join(__dirname, rel);
    if (!file.startsWith(__dirname)) { res.statusCode = 403; return res.end("Forbidden"); }
    // Never serve dotfiles/dotdirs (.env.local, .git) or server-only code.
    if (rel.split(/[\\/]/).some(seg => seg.startsWith(".")) || /^[\\/](lib|api)[\\/]/.test(rel)) {
        res.statusCode = 404; return res.end("Not found");
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");

    fs.readFile(file, (err, data) => {
        if (err) { res.statusCode = 404; return res.end("Not found"); }
        res.setHeader("Content-Type", TYPES[path.extname(file).toLowerCase()] || "application/octet-stream");
        // Dev only: always revalidate, so an edited chatbot.js/.css shows up on a
        // plain refresh instead of the browser serving a stale cached copy.
        res.setHeader("Cache-Control", "no-cache");
        res.end(data);
    });
}).listen(3000, () => console.log("SYS_CHAT dev server -> http://localhost:3000"));
