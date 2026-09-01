// ============================================================================
// SYS_CHAT — client-side RAG portfolio assistant
//
// Architecture:
//   Retrieval (R): pure-JS keyword/TF relevance scoring over
//                  window.PORTFOLIO_KNOWLEDGE_BASE (data/knowledge-base.js),
//                  run entirely in the browser — no network call, no API key.
//   Generation (G): the query + the top retrieved chunks are POSTed to the
//                  same-origin `/api/chat` Vercel serverless function, which
//                  holds the LLM API key server-side and returns the reply.
//                  That endpoint only exists once this site is deployed (or
//                  run via `vercel dev`) — opened directly as a file:// page,
//                  retrieval still works but generation will show a clear
//                  "backend not reachable" message instead of failing silently.
// ============================================================================

(function () {
    const STOPWORDS = new Set([
        "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
        "of", "in", "on", "at", "to", "for", "with", "and", "or", "but",
        "do", "does", "did", "have", "has", "had", "i", "you", "he", "she",
        "it", "we", "they", "what", "who", "whom", "which", "this", "that",
        "his", "her", "your", "my", "me", "can", "could", "would", "should",
        "tell", "about", "me"
    ]);

    function tokenize(text) {
        return (text.toLowerCase().match(/[a-z0-9+.#/]+/g) || [])
            .filter(tok => tok.length > 1 && !STOPWORDS.has(tok));
    }

    // Score = sum over query tokens of how often that token (or a token
    // containing it, e.g. "dotnet" query hitting ".net" chunk keywords)
    // appears in the chunk's text, with keyword-field hits weighted 3x
    // heavier than plain body-text hits since they mark the chunk's topic.
    function scoreChunk(queryTokens, chunk) {
        const bodyTokens = tokenize(chunk.text);
        const keywordTokens = chunk.keywords.flatMap(tokenize);
        let score = 0;

        queryTokens.forEach(qt => {
            bodyTokens.forEach(bt => {
                if (bt === qt || bt.includes(qt) || qt.includes(bt)) score += 1;
            });
            keywordTokens.forEach(kt => {
                if (kt === qt || kt.includes(qt) || qt.includes(kt)) score += 3;
            });
        });

        return score;
    }

    function retrieveTopChunks(query, k) {
        const kb = window.PORTFOLIO_KNOWLEDGE_BASE || [];
        const queryTokens = tokenize(query);

        const ranked = kb
            .map(chunk => ({ chunk, score: scoreChunk(queryTokens, chunk) }))
            .sort((a, b) => b.score - a.score);

        const matched = ranked.filter(r => r.score > 0).slice(0, k);
        if (matched.length > 0) return matched.map(r => r.chunk);

        // No keyword overlap at all — fall back to a sane baseline (bio +
        // contact) so the model still has *something* grounded to work from
        // instead of answering with zero context.
        return kb.filter(c => c.id === "bio" || c.id === "contact").slice(0, k);
    }

    const SUGGESTED_PROMPTS = [
        "What is Mohammad's .NET experience?",
        "Show top projects",
        "Contact info"
    ];

    const LOADING_SEQUENCE = [
        "[SYS]: Querying local matrix...",
        "[SYS]: Retrieving context blocks...",
        "[SYS]: Awaiting model response..."
    ];

    document.addEventListener("DOMContentLoaded", () => {
        const floatingGroup = document.querySelector(".floating-btn-group");
        if (!floatingGroup) return;

        // ---- Build widget DOM -------------------------------------------------
        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.id = "sys-chat-toggle";
        toggleBtn.className = "sys-chat-toggle";
        toggleBtn.setAttribute("aria-label", "Open SYS_CHAT AI assistant");
        toggleBtn.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 17 10 11 4 5"></polyline>
                <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
        `;
        floatingGroup.prepend(toggleBtn);

        const panel = document.createElement("div");
        panel.id = "sys-chat-panel";
        panel.className = "sys-chat-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-label", "SYS_CHAT AI assistant");
        panel.innerHTML = `
            <div class="sys-chat-header">
                <div class="sys-chat-title">
                    <span class="sys-chat-bracket">[</span>SYS_CHAT<span class="sys-chat-slash"> // </span>AI_ASSISTANT<span class="sys-chat-bracket">]</span>
                    <span class="sys-chat-cursor" aria-hidden="true"></span>
                </div>
                <button type="button" class="sys-chat-close" aria-label="Close chat">&times;</button>
            </div>
            <div class="sys-chat-status">
                <span class="sys-chat-status-item"><span class="sys-chat-dot"></span>STATUS: ONLINE</span>
                <span class="sys-chat-status-item"><span class="sys-chat-dot sys-chat-dot-alt"></span>MODEL: ACTIVE</span>
            </div>
            <div class="sys-chat-messages" id="sys-chat-messages"></div>
            <div class="sys-chat-prompts" id="sys-chat-prompts"></div>
            <form class="sys-chat-input-row" id="sys-chat-form">
                <span class="sys-chat-prompt-glyph">&gt;</span>
                <input type="text" id="sys-chat-input" class="sys-chat-input" placeholder="Ask about skills, projects, experience..." autocomplete="off">
                <button type="submit" class="sys-chat-send" aria-label="Send message">SEND</button>
            </form>
        `;
        document.body.appendChild(panel);

        const messagesEl = panel.querySelector("#sys-chat-messages");
        const promptsEl = panel.querySelector("#sys-chat-prompts");
        const formEl = panel.querySelector("#sys-chat-form");
        const inputEl = panel.querySelector("#sys-chat-input");
        const closeBtn = panel.querySelector(".sys-chat-close");

        // ---- Suggested prompt pills --------------------------------------------
        SUGGESTED_PROMPTS.forEach(prompt => {
            const pill = document.createElement("button");
            pill.type = "button";
            pill.className = "sys-chat-pill";
            pill.textContent = prompt;
            pill.addEventListener("click", () => sendMessage(prompt));
            promptsEl.appendChild(pill);
        });

        // ---- Message rendering --------------------------------------------------
        function appendMessage(role, html) {
            const row = document.createElement("div");
            row.className = `sys-chat-msg sys-chat-msg-${role}`;
            row.innerHTML = html;
            messagesEl.appendChild(row);
            messagesEl.scrollTop = messagesEl.scrollHeight;
            return row;
        }

        function escapeHtml(value) {
            const div = document.createElement("div");
            div.textContent = value;
            return div.innerHTML;
        }

        function appendUserMessage(text) {
            appendMessage("user", `<span class="sys-chat-bubble">${escapeHtml(text)}</span>`);
        }

        function appendAiMessage(text) {
            appendMessage("ai", `<span class="sys-chat-ai-tag">[AI]:</span> <span class="sys-chat-ai-text">${escapeHtml(text)}</span>`);
        }

        function appendErrorMessage(text) {
            appendMessage("error", `<span class="sys-chat-ai-tag sys-chat-error-tag">[ERR]:</span> <span class="sys-chat-ai-text">${escapeHtml(text)}</span>`);
        }

        function appendLoadingMessage() {
            const row = appendMessage("loading", `<span class="sys-chat-ai-tag">[AI]:</span> <span class="sys-chat-loading-text"></span><span class="sys-chat-cursor" aria-hidden="true"></span>`);
            const textEl = row.querySelector(".sys-chat-loading-text");
            let step = 0;
            textEl.textContent = LOADING_SEQUENCE[0];
            const timer = setInterval(() => {
                step = (step + 1) % LOADING_SEQUENCE.length;
                textEl.textContent = LOADING_SEQUENCE[step];
                messagesEl.scrollTop = messagesEl.scrollHeight;
            }, 900);
            return { row, stop: () => clearInterval(timer) };
        }

        // ---- Send flow: retrieve locally, generate via /api/chat ---------------
        let inFlight = false;

        async function sendMessage(rawText) {
            const text = (rawText != null ? rawText : inputEl.value).trim();
            if (!text || inFlight) return;

            if (promptsEl.parentNode) promptsEl.remove();

            inputEl.value = "";
            appendUserMessage(text);

            const topChunks = retrieveTopChunks(text, 2);
            const loading = appendLoadingMessage();
            inFlight = true;
            formEl.querySelector(".sys-chat-send").disabled = true;

            try {
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query: text,
                        context: topChunks.map(c => c.text)
                    })
                });

                let data = null;
                try { data = await res.json(); } catch { /* non-JSON error body, e.g. a raw 404/501 page */ }

                if (!res.ok) {
                    throw new Error(data && data.error ? data.error : `HTTP ${res.status}`);
                }

                loading.stop();
                loading.row.remove();
                appendAiMessage((data && data.reply) || "No response generated.");
            } catch (err) {
                loading.stop();
                loading.row.remove();
                appendErrorMessage(
                    err.message === "Failed to fetch"
                        ? "Connection to AI core failed. The /api/chat endpoint only runs when this " +
                          "site is deployed to Vercel (or via `vercel dev`/a Node dev server) — it isn't " +
                          "reachable from a local file:// preview."
                        : `Connection to AI core failed. ${err.message}`
                );
                console.error("SYS_CHAT generation error:", err);
            } finally {
                inFlight = false;
                formEl.querySelector(".sys-chat-send").disabled = false;
                inputEl.focus();
            }
        }

        formEl.addEventListener("submit", (e) => {
            e.preventDefault();
            sendMessage();
        });

        // ---- Open / close ---------------------------------------------------------
        function openPanel() {
            panel.classList.add("open");
            toggleBtn.setAttribute("aria-expanded", "true");
            inputEl.focus();
        }

        function closePanel() {
            panel.classList.remove("open");
            toggleBtn.setAttribute("aria-expanded", "false");
        }

        toggleBtn.addEventListener("click", () => {
            panel.classList.contains("open") ? closePanel() : openPanel();
        });
        closeBtn.addEventListener("click", closePanel);
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
        });
    });
})();
