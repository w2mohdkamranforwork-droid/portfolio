// ============================================================================
// Portfolio Assistant — resume-grounded chat widget
//
// Architecture:
//   Grounding:     the answer comes from the resume file in ./resume/, read
//                  server-side by /api/chat. Swapping that file changes the
//                  answers — nothing in this file needs to know about it.
//   Retrieval (R): pure-JS keyword/TF relevance scoring over
//                  window.PORTFOLIO_KNOWLEDGE_BASE (data/knowledge-base.js),
//                  run entirely in the browser — no network call, no API key.
//                  Sent along as a *fallback* the server only uses if the
//                  resume folder is empty or unreadable.
//   Generation (G): the query + those fallback chunks are POSTed to the
//                  same-origin `/api/chat` Vercel serverless function, which
//                  answers from the resume locally — no LLM, no API key.
//                  That endpoint needs a server: run `node dev-server.js`
//                  locally (or deploy to Vercel). Opened directly as a file://
//                  page, retrieval still works but generation shows a clear
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
        "Searching the resume...",
        "Finding the relevant section...",
        "Preparing your answer..."
    ];

    document.addEventListener("DOMContentLoaded", () => {
        const floatingGroup = document.querySelector(".floating-btn-group");
        if (!floatingGroup) return;

        // ---- Build widget DOM -------------------------------------------------
        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.id = "sys-chat-toggle";
        toggleBtn.className = "sys-chat-toggle";
        toggleBtn.setAttribute("aria-label", "Open Portfolio Assistant");
        toggleBtn.innerHTML = `
            <span class="sys-chat-toggle-pill" aria-hidden="true"><span class="sys-chat-toggle-text">Chat with resume</span></span>
            <svg class="sys-chat-toggle-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 17 10 11 4 5"></polyline>
                <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
        `;
        floatingGroup.prepend(toggleBtn);

        const panel = document.createElement("div");
        panel.id = "sys-chat-panel";
        panel.className = "sys-chat-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-label", "Portfolio Assistant");
        panel.innerHTML = `
            <div class="sys-chat-header">
                <div class="sys-chat-title">
                    Portfolio Assistant
                    <span class="sys-chat-cursor" aria-hidden="true"></span>
                </div>
                <button type="button" class="sys-chat-close" aria-label="Close chat">&times;</button>
            </div>
            <div class="sys-chat-status">
                <span class="sys-chat-status-item"><span class="sys-chat-dot"></span>STATUS: ONLINE</span>
                <span class="sys-chat-status-item"><span class="sys-chat-dot sys-chat-dot-alt"></span>SOURCE: RESUME</span>
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

        // Structured answers from /api/chat render as cards. Built with DOM APIs
        // and textContent throughout, so resume text never touches innerHTML.
        function el(tag, className, text) {
            const node = document.createElement(tag);
            if (className) node.className = className;
            if (text) node.textContent = text;
            return node;
        }

        const SAFE_HREF = /^(mailto:|tel:|https:\/\/)/i;

        function renderItem(item) {
            const card = el("div", "sc-item");

            if (item.title || item.tag) {
                const head = el("div", "sc-item-head");
                if (item.title) head.appendChild(el("span", "sc-item-title", item.title));
                if (item.tag) head.appendChild(el("span", "sc-tag", item.tag));
                card.appendChild(head);
            }
            if (item.subtitle) card.appendChild(el("div", "sc-item-sub", item.subtitle));

            const chips = item.chips && item.chips.length ? el("div", "sc-chips") : null;
            if (chips) item.chips.forEach(chip => chips.appendChild(el("span", "sc-chip", chip)));
            if (chips && item.chipsFirst) card.appendChild(chips);

            if (item.text) {
                const p = el("p", "sc-item-text");
                if (item.href && SAFE_HREF.test(item.href)) {
                    const link = el("a", "sc-link", item.text);
                    link.href = item.href;
                    if (item.href.startsWith("https:")) {
                        link.target = "_blank";
                        link.rel = "noopener noreferrer";
                    }
                    p.appendChild(link);
                } else {
                    p.textContent = item.text;
                }
                card.appendChild(p);
            }

            if (chips && !item.chipsFirst) card.appendChild(chips);
            return card;
        }

        function renderAnswer(answer) {
            const wrap = el("div", "sc-answer");
            if (answer.intro) wrap.appendChild(el("p", "sc-intro", answer.intro));

            (answer.sections || []).forEach(section => {
                // Short label/value lists (contact details) read better as
                // compact rows than as a stack of near-empty cards.
                const compact = section.items.every(i =>
                    i.title && !i.subtitle && !(i.chips && i.chips.length) && (i.text || "").length <= 60);

                const block = el("div", compact ? "sc-section sc-section-compact" : "sc-section");
                block.appendChild(el("div", "sc-section-title", section.title));
                const list = el("div", "sc-items");
                section.items.forEach(item => list.appendChild(renderItem(item)));
                block.appendChild(list);
                wrap.appendChild(block);
            });

            if (answer.note) wrap.appendChild(el("p", "sc-note", answer.note));

            if (answer.suggestions && answer.suggestions.length) {
                const row = el("div", "sc-suggest");
                answer.suggestions.forEach(s => {
                    const pill = el("button", "sys-chat-pill", s.label);
                    pill.type = "button";
                    pill.addEventListener("click", () => sendMessage(s.query));
                    row.appendChild(pill);
                });
                wrap.appendChild(row);
            }
            return wrap;
        }

        function appendAiMessage(text, answer) {
            const row = appendMessage("ai", `<span class="sys-chat-ai-tag">Assistant</span>`);
            row.appendChild(answer ? renderAnswer(answer) : el("span", "sys-chat-ai-text", text));

            // A long answer would otherwise leave the view scrolled to its end.
            // Pin the question just above it so the answer reads from the top.
            const anchor = row.previousElementSibling || row;
            messagesEl.scrollTop = Math.max(0, anchor.offsetTop - 8);
            return row;
        }

        function appendErrorMessage(text) {
            appendMessage("error", `<span class="sys-chat-ai-tag sys-chat-error-tag">Error</span> <span class="sys-chat-ai-text">${escapeHtml(text)}</span>`);
        }

        function appendLoadingMessage() {
            const row = appendMessage("loading", `<span class="sys-chat-ai-tag">Assistant</span> <span class="sys-chat-loading-text"></span><span class="sys-chat-cursor" aria-hidden="true"></span>`);
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

            const topChunks = retrieveTopChunks(text, 4);
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
                appendAiMessage((data && data.reply) || "No response generated.", data && data.answer);
            } catch (err) {
                loading.stop();
                loading.row.remove();
                appendErrorMessage(
                    err.message === "Failed to fetch"
                        ? "Couldn't reach the assistant. The /api/chat endpoint needs a server: " +
                          "run `node dev-server.js` and open http://localhost:3000, or deploy to " +
                          "Vercel. It isn't reachable from a file:// preview."
                        : `Couldn't reach the assistant. ${err.message}`
                );
                console.error("Portfolio Assistant error:", err);
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
            setLauncherExpanded(false);
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

        // ---- Launcher: circle -> "Chat with resume" pill ---------------------------
        const launcherText = toggleBtn.querySelector(".sys-chat-toggle-text");

        function setLauncherExpanded(expanded) {
            if (expanded && panel.classList.contains("open")) return;
            if (expanded) {
                // CSS can't transition to width:auto, so measure the label and
                // hand the pill an exact target: text + 18px left pad + the
                // 52px icon slot + 2px of border.
                toggleBtn.style.setProperty("--sys-chat-pill-w", `${Math.ceil(launcherText.offsetWidth) + 72}px`);
            }
            toggleBtn.classList.toggle("expanded", expanded);
        }

        const launcherEngaged = () => toggleBtn.matches(":hover, :focus-visible");

        // Peek open shortly after load so visitors notice it, then tuck away —
        // unless they're already hovering it. Hover/focus reopens it any time.
        setTimeout(() => setLauncherExpanded(true), 1200);
        setTimeout(() => { if (!launcherEngaged()) setLauncherExpanded(false); }, 6500);

        toggleBtn.addEventListener("mouseenter", () => setLauncherExpanded(true));
        toggleBtn.addEventListener("mouseleave", () => setLauncherExpanded(false));
        // Keyboard focus only: a mouse click also focuses the button, and would
        // otherwise flash the pill open just as the panel opens.
        toggleBtn.addEventListener("focus", () => { if (toggleBtn.matches(":focus-visible")) setLauncherExpanded(true); });
        toggleBtn.addEventListener("blur", () => setLauncherExpanded(false));
    });
})();
