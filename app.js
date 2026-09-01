

// --- MULTI-OBJECT GRAPHICS ACCELERATION CORE & PERSISTENT DATA DRIVERS ---
document.addEventListener("DOMContentLoaded", () => {

   const nav = document.querySelector('nav');
    
if (!nav) {
    console.error("Navbar element not found!");
    return;
}

// STYLING FIXES (Updated for centering):
nav.style.position = "fixed"; 
nav.style.top = "0";
nav.style.left = "50%"; // Move left edge to the middle of the screen
nav.style.transform = "translateX(-50%)"; // Center it perfectly
nav.style.width = "max-content"; // Fits content perfectly, or use a percentage like "90%" with a max-width
nav.style.zIndex = "999999"; 
// Notice we now transition 'transform' and 'opacity' smoothly while keeping horizontal centering intact
nav.style.transition = "transform 0.4s ease, opacity 0.4s ease";

let hideTimeout;

function showNavbar() {
    // Keeps the horizontal centering (-50%) while bringing it down into view (0)
    nav.style.transform = "translate(-50%, 0)";
    nav.style.opacity = "1";
    
    if (window.scrollY > 0) {
        resetTimer();
    } else {
        clearTimeout(hideTimeout);
    }
}

function hideNavbar() {
    if (window.scrollY === 0) return;

    if (!nav.matches(':hover')) {
        // Keeps the horizontal centering (-50%) while sliding it out of view upward (-100%)
        nav.style.transform = "translate(-50%, -100%)";
        nav.style.opacity = "0";
    }
}

function resetTimer() {
    clearTimeout(hideTimeout);
    if (window.scrollY > 0) {
        hideTimeout = setTimeout(hideNavbar, 2000);
    }
}

// Show when mouse moves
window.addEventListener('mousemove', (e) => {
    if (window.scrollY === 0) {
        showNavbar();
        return;
    }

    if (nav.style.opacity === "0" || e.clientY <= 60) {
        showNavbar();
    } else {
        resetTimer();
    }
});

// Show when scrolling
window.addEventListener('scroll', showNavbar);

// Keep visible on hover
nav.addEventListener('mouseenter', () => {
    clearTimeout(hideTimeout);
    nav.style.transform = "translate(-50%, 0)";
    nav.style.opacity = "1";
});

nav.addEventListener('mouseleave', () => {
    if (window.scrollY > 0) {
        resetTimer();
    }
});

// Initial execution
showNavbar();
const scrollToOriginBtn = document.getElementById('scroll-to-origin');

    // Scoped to its own guard so a missing scroll-to-origin button (e.g. on
    // pages without the floating button group) never skips the setup below —
    // that used to silently disable magnetic hover, decrypt text, and tilt
    // effects sitewide whenever this one element was absent.
    if (scrollToOriginBtn) {
        function toggleOriginButton() {
            // Checks standard scroll, HTML element scroll, and body element scroll
            const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;

            if (scrollPosition > 100) {
                scrollToOriginBtn.classList.add('visible');
            } else {
                scrollToOriginBtn.classList.remove('visible');
            }
        }

        // Attach listener to both window and the document body just in case
        window.addEventListener('scroll', toggleOriginButton);
        document.addEventListener('scroll', toggleOriginButton);

        // Initial check
        toggleOriginButton();
    }

    resetTimer();

    initWebGLBackground();
    initMagneticComponents();
    initDecryptionMatrix();
    init3DTilt();
});

// FEATURE 1: 3D CYBER NET GRID GENERATOR WITH CUSTOM FRAGMENT SHADERS
function initWebGLBackground() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Global Object Transform Assemblies
    const architectureGroup = new THREE.Group();
    scene.add(architectureGroup);

    // Construct Core Node (Primary Wireframe Wire Structure)
    const centralGeom = new THREE.IcosahedronGeometry(1.2, 1);
    const centralMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        wireframe: true,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x2e0854,
        emissiveIntensity: 1.2
    });
    const centralNode = new THREE.Mesh(centralGeom, centralMat);
    architectureGroup.add(centralNode);

    // Dynamic Outer Structural Ring Tracking Coordinates
    const ringGeom = new THREE.TorusGeometry(2.1, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        wireframe: true,
        transparent: true,
        opacity: 0.4
    });
    const trackingRing = new THREE.Mesh(ringGeom, ringMat);
    trackingRing.rotation.x = Math.PI / 3;
    architectureGroup.add(trackingRing);

    // Lighting Array Node Calibration
    const structuralAmbient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(structuralAmbient);

    const directionalVector = new THREE.PointLight(0xffffff, 2.5);
    directionalVector.position.set(5, 5, 5);
    scene.add(directionalVector);

    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let scrollY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) - 0.5;
        mouseY = (e.clientY / window.innerHeight) - 0.5;
    });

    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    });

    const clock = new THREE.Clock();

    function renderRuntime() {
        requestAnimationFrame(renderRuntime);
        const elapsedTime = clock.getElapsedTime();

        // Mechanical Asset Rotation Vectors
        centralNode.rotation.y = elapsedTime * 0.15;
        centralNode.rotation.x = elapsedTime * 0.05;
        trackingRing.rotation.z = -elapsedTime * 0.1;

        // Linear Interpolation (LERP) Processing for Mouse Tracking Metrics
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        architectureGroup.rotation.y = targetX * 1.5;
        architectureGroup.rotation.x = targetY * 1.5;

        // Dynamic Scroll Parallax Compression Engine
        architectureGroup.position.x = (scrollY * 0.002);
        architectureGroup.position.y = -(scrollY * 0.0005);
        camera.position.z = 4 + (scrollY * 0.0015);

        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    renderRuntime();
}

// FEATURE 2: VARIABLE WEIGHT MAGNETIC FLUID DOM COMPONENTS
function initMagneticComponents() {
    const magneticElements = document.querySelectorAll('.magnetic');
    
    magneticElements.forEach(elem => {
        elem.addEventListener('mousemove', function(e) {
            const boundBox = this.getBoundingClientRect();
            const strengthCoefficient = this.getAttribute('data-strength') || 20;
            
            // Calculate Vector Distance from Element Origin Node Center
            const vectorX = e.clientX - (boundBox.left + boundBox.width / 2);
            const vectorY = e.clientY - (boundBox.top + boundBox.height / 2);
            
            // Structural Displacement Mapping
            this.style.transform = `translate(${vectorX / boundBox.width * strengthCoefficient}px, ${vectorY / boundBox.height * strengthCoefficient}px)`;
            this.style.transition = 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)';
        });
        
        elem.addEventListener('mouseleave', function() {
            this.style.transform = 'translate(0px, 0px)';
            this.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
        });
    });
}

// FEATURE 3: ENCRYPTED CHARACTER DECRYPTION MATRIX STREAM
function initDecryptionMatrix() {
    const decrypters = document.querySelectorAll('[data-decrypt]');
    const glyphLibrary = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_@#$%-+=*{}/";

    const triggerDecryption = (target) => {
        if (target.classList.contains('decrypting')) return;
        target.classList.add('decrypting');

        const originalString = target.innerText;
        let iterationCounter = 0;
        
        const decryptionInterval = setInterval(() => {
            target.innerText = originalString.split("").map((char, index) => {
                if (char === " " || char === "&") return char;
                if (index < iterationCounter) return originalString[index];
                return glyphLibrary[Math.floor(Math.random() * glyphLibrary.length)];
            }).join("");
            
            if (iterationCounter >= originalString.length) {
                clearInterval(decryptionInterval);
                target.classList.remove('decrypting');
                target.innerText = originalString;
            }
            iterationCounter += 1 / 3;
        }, 25);
    };

    // Viewport Intersection Triggers
    const intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) triggerDecryption(entry.target);
        });
    }, { threshold: 0.1 });

    decrypters.forEach(node => {
        intersectionObserver.observe(node);
        node.addEventListener('mouseenter', () => triggerDecryption(node));
    });
}

// HARDWARE ACCELERATED 3D PARALLAX FOR VIEW CARDS
function bindCardTilt(card) {
    card.addEventListener('mousemove', (e) => {
        const metrics = card.getBoundingClientRect();
        const posX = e.clientX - metrics.left;
        const posY = e.clientY - metrics.top;

        const amplitudeX = ((posY / metrics.height) - 0.5) * -12;
        const amplitudeY = ((posX / metrics.width) - 0.5) * 12;

        card.style.transform = `perspective(1000px) rotateX(${amplitudeX}deg) rotateY(${amplitudeY}deg) translateY(-5px)`;
        card.style.transition = 'transform 0.05s ease-out';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        card.style.transition = 'transform 0.5s ease-out';
    });
}

function init3DTilt() {
    document.querySelectorAll('.card, .skill-item').forEach(bindCardTilt);
}
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form-engine");
    const emailBtn = document.getElementById("submit-email");
    const whatsappBtn = document.getElementById("submit-whatsapp");
    const popup = document.getElementById("transmission-popup");
    const closePopupBtn = document.getElementById("close-popup");

    // Primary Target Parameter Endpoints from Identity Profile
    const developerEmail = "w2mohdkamranforwork@gmail.com";
    const developerPhone = "919820360057"; // Format with clear country calling protocol (no spaces, no + symbols)[cite: 3]

    // Form inputs validator and details extractor
    function checkFormValidity() {
        const nameField = document.getElementById("name");
        const emailField = document.getElementById("email");
        const msgField = document.getElementById("msg");

        if (!nameField || !emailField || !msgField) {
            console.error("Critical: Form UI inputs missing in layout ecosystem.");
            return { isValid: false };
        }

        const name = nameField.value.trim();
        const email = emailField.value.trim();
        const msg = msgField.value.trim();

        return { 
            isValid: (name !== "" && email !== "" && msg !== ""), 
            data: { name, email, msg } 
        };
    }

    // Core execution pipeline: commits clean structural logs locally, pops visual feedback
    function pipelineExecution(formData, callback) {
        try {
            let transmissionLogs = [];
            const localData = localStorage.getItem("system_transmission_logs");
            
            if (localData) {
                transmissionLogs = JSON.parse(localData);
            }

            // Bind transaction metadata timestamps
            formData.timestamp = new Date().toISOString();
            transmissionLogs.push(formData);

            // Commit to persistent local storage environment
            localStorage.setItem("system_transmission_logs", JSON.stringify(transmissionLogs));
            console.log("Local system ledger synchronized:", formData);

        } catch (error) {
            console.error("Local data persistence routine failed:", error);
        }

        // Trigger interactive HUD notification pop-up block
        if (popup) {
            popup.style.display = "flex";
        }

        const closeSequence = () => {
            if (popup) popup.style.display = "none";
            
            // Fire target dispatch pipeline (Email link or WhatsApp external anchor tab)
            callback();
            
            if (form) form.reset();
            if (closePopupBtn) closePopupBtn.removeEventListener("click", closeSequence);
        };

        if (closePopupBtn) {
            closePopupBtn.addEventListener("click", closeSequence);
        } else {
            // Automatic structural fallback execution loop if confirmation layout element is detached
            setTimeout(closeSequence, 1200);
        }
    }

    // 1. WhatsApp Router: maps *ALL* input fields directly to WhatsApp API payload string
    if (whatsappBtn) {
        whatsappBtn.addEventListener("click", () => {
            const check = checkFormValidity();
            if (!check.isValid) {
                if (form) form.reportValidity();
                return;
            }

            pipelineExecution(check.data, () => {
                // Formats text cleanly with bold Markdown highlights for the WhatsApp message layout
                const textMessage = `*SYSTEM TRANSMISSION INTENT*\n\n` + 
                                    `*Name:* ${check.data.name}\n` + 
                                    `*Email:* ${check.data.email}\n\n` + 
                                    `*Scope Specifications:*\n${check.data.msg}`;
                
                const encodedPayload = encodeURIComponent(textMessage);
                const targetUrl = `https://wa.me/${developerPhone}?text=${encodedPayload}`;
                
                // Dispatches directly to an active message conversation window
                window.open(targetUrl, '_blank');
            });
        });
    }

    // 2. Email Router: backup pipeline mapping fields cleanly to Mailto endpoints
    if (emailBtn) {
        emailBtn.addEventListener("click", () => {
            const check = checkFormValidity();
            if (!check.isValid) {
                if (form) form.reportValidity();
                return;
            }

            pipelineExecution(check.data, () => {
                const subject = encodeURIComponent(`System Operations Scope Request - ${check.data.name}`);
                const body = encodeURIComponent(`Identifier Name: ${check.data.name}\nRouting Return Node: ${check.data.email}\n\nProject Parameter Scope Specifications:\n${check.data.msg}`);
                
                window.location.href = `mailto:${developerEmail}?subject=${subject}&body=${body}`;
            });
        });document.addEventListener("DOMContentLoaded", () => {
    const themeBtn = document.getElementById("theme-toggle-node");
    const themeIcon = themeBtn?.querySelector(".theme-icon");
    const themeText = themeBtn?.querySelector(".theme-text");

    // Check system persistence logs or default to Dark mode configuration
    const currentTheme = localStorage.getItem("portfolio_theme_configuration") || "dark";
    
    // Core engine update function
    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("portfolio_theme_configuration", theme);
        
        if (theme === "light") {
            if (themeIcon) themeIcon.textContent = "☾";
            if (themeText) themeText.textContent = "DARK NODE";
        } else {
            if (themeIcon) themeIcon.textContent = "☼";
            if (themeText) themeText.textContent = "LIGHT NODE";
        }
    }

    // Initialize environment configuration
    applyTheme(currentTheme);

    // Operational trigger link
    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const activeState = document.documentElement.getAttribute("data-theme");
            const structuralTarget = activeState === "dark" ? "light" : "dark";
            applyTheme(structuralTarget);
        });
    }
});
    }
});

// TECHNICAL STACK: expand-on-hover/focus/click behaviour (vanilla port of
// the shadcn ExpandingCards component's activeIndex state).
document.addEventListener("DOMContentLoaded", () => {
    const skillCards = document.querySelectorAll("#skills .expanding-card");
    if (!skillCards.length) return;

    function setActiveSkillCard(card) {
        skillCards.forEach(c => c.removeAttribute("data-active"));
        if (card) card.setAttribute("data-active", "true");
    }

    skillCards.forEach(card => {
        card.addEventListener("mouseenter", () => setActiveSkillCard(card));
        card.addEventListener("focus", () => setActiveSkillCard(card));
        card.addEventListener("click", () => setActiveSkillCard(card));
    });

    setActiveSkillCard(skillCards[0]);
});

document.addEventListener("DOMContentLoaded", () => {
    // 1. Target buttons specifically inside the project section
    const filterButtons = document.querySelectorAll(".filter-btn");
    // 2. ONLY target cards inside the #project section grid
    const projectCards = document.querySelectorAll("#project .complex-tilt-card");
    const projectGrid = document.querySelector("#project .grid");
    const filterValues = Array.from(filterButtons).map(btn => btn.getAttribute("data-filter"));

    const CARD_TRANSITION_MS = 450; // matches the .complex-tilt-card CSS transition duration
    const CARD_STAGGER_MS = 90;

    // Lock the grid's height to its tallest ("all") state so compacting cards
    // for a category never shrinks the section itself — that used to shift
    // everything below it (the Reviews section) on every autoplay tick. The
    // reserved space sits *below* the compacted cards (see align-content:
    // start in style.css), never between them.
    function lockGridHeight() {
        if (!projectGrid) return;
        const prevTransition = projectGrid.style.transition;
        projectGrid.style.transition = "none";
        projectGrid.style.minHeight = "0px";
        const naturalHeight = projectGrid.scrollHeight;
        projectGrid.style.minHeight = naturalHeight + "px";
        void projectGrid.offsetHeight; // force reflow before re-enabling the transition
        projectGrid.style.transition = prevTransition;
    }

    // Cards that don't match the active category fade out then leave the grid
    // flow (display:none) so the remaining cards compact to the top — no
    // blank gaps are left where hidden cards used to be. Matching cards fade
    // back in one after another (staggered), not all at once.
    function applyFilter(filterValue) {
        filterButtons.forEach(btn => {
            btn.classList.toggle("active", btn.getAttribute("data-filter") === filterValue);
        });

        let showIndex = 0;

        projectCards.forEach(card => {
            const cardCategory = card.getAttribute("data-category");
            const matches = filterValue === "all" || cardCategory === filterValue;

            if (matches) {
                const delay = showIndex * CARD_STAGGER_MS;
                showIndex += 1;

                card.style.display = "block";
                card.style.opacity = "0";
                card.style.transform = "scale(0.92) translateY(8px)";
                card.style.pointerEvents = "none";

                setTimeout(() => {
                    card.style.opacity = "1";
                    card.style.transform = "scale(1)";
                    card.style.pointerEvents = "";
                }, delay + 20);
            } else {
                card.style.opacity = "0";
                card.style.transform = "scale(0.92) translateY(8px)";
                card.style.pointerEvents = "none";

                setTimeout(() => {
                    card.style.display = "none";
                }, CARD_TRANSITION_MS);
            }
        });
    }

    lockGridHeight();

    // Recalibrate on resize (debounced) since the number of grid columns —
    // and therefore the tallest possible height — depends on viewport width.
    let resizeDebounce = null;
    window.addEventListener("resize", () => {
        clearTimeout(resizeDebounce);
        resizeDebounce = setTimeout(lockGridHeight, 200);
    });

    // 3. Autoplay: automatically cycle through every category every 2 seconds
    const AUTOPLAY_INTERVAL_MS = 2000;
    let currentFilterIndex = 0;
    let autoplayTimer = null;

    function startAutoplay() {
        autoplayTimer = setInterval(() => {
            currentFilterIndex = (currentFilterIndex + 1) % filterValues.length;
            applyFilter(filterValues[currentFilterIndex]);
        }, AUTOPLAY_INTERVAL_MS);
    }

    function restartAutoplay() {
        clearInterval(autoplayTimer);
        startAutoplay();
    }

    function pauseAutoplay() {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
    }

    filterButtons.forEach((button, index) => {
        button.addEventListener("click", () => {
            currentFilterIndex = index;
            applyFilter(button.getAttribute("data-filter"));
            restartAutoplay();
        });
    });

    // Pause the autoplay cycle while the visitor is looking at a card, so it
    // doesn't fade out from under their cursor mid-read. Resumes on mouseleave.
    if (projectGrid) {
        projectGrid.addEventListener("mouseenter", pauseAutoplay);
        projectGrid.addEventListener("mouseleave", startAutoplay);
    }

    startAutoplay();
});

document.addEventListener("DOMContentLoaded", () => {
    const loadBar = document.getElementById("load-bar");
    const loadPercentage = document.getElementById("load-percentage");
    const logsContainer = document.getElementById("terminal-logs");

    // Pages without the preloader markup (e.g. project detail pages) skip this entirely.
    if (!loadBar || !loadPercentage || !logsContainer) return;

    let currentProgress = 0;

    // Real, contextual logs tailored specifically to your backend/UI portfolio stack
    const technicalLogs = [
        { progress: 5, text: "dotnet run --project Portfolio.Web" },
        { progress: 15, text: "info: Microsoft.Hosting.Lifetime[0] Hosting environment: Production" },
        { progress: 28, text: "info: Core.Pipeline[1] Initializing high-performance middleware..." },
        { progress: 42, text: "db: Connection pool initialized. Routing schemas mapped." },
        { progress: 58, text: "api: RESTful endpoints generated securely [HTTPS //200 OK]" },
        { progress: 70, text: "ui: Mapping responsive layouts & client viewports..." },
        { progress: 85, text: "sys: Compiling 3D tilt-engine parallax layout matrices..." },
        { progress: 95, text: "exec: Ready. Removing optimization buffers.", success: true }
    ];

    function appendLog(text, isSuccess = false) {
        const line = document.createElement("div");
        line.className = `terminal-line ${isSuccess ? 'success' : ''}`;
        line.textContent = `> ${text}`;
        logsContainer.appendChild(line);
        
        // Auto-scrolls down to show latest console event
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }
    
    const bootSequence = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 8) + 3;
        
        // Find and print logs that match the current loader timeline progression threshold
        while (technicalLogs.length > 0 && currentProgress >= technicalLogs[0].progress) {
            const nextLog = technicalLogs.shift();
            appendLog(nextLog.text, nextLog.success);
        }

        if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(bootSequence);
            
            loadBar.style.width = "100%";
            loadPercentage.textContent = "100%";
            
            setTimeout(() => {
                document.body.classList.add("sys-ready");
                
                // If you have a global text scramble decryption method, trigger it here:
                // if (window.initializeDecrypt) window.initializeDecrypt();
            }, 350);
        } else {
            loadBar.style.width = `${currentProgress}%`;
            loadPercentage.textContent = `${currentProgress.toString().padStart(2, '0')}%`;
        }
    }, 45); // Tight, lightning-fast pacing
});

// INITIALIZE SCROLL ENGINE CONTROL
document.addEventListener("DOMContentLoaded", () => {
    const originBtn = document.getElementById('scroll-to-origin');
    if (!originBtn) return;

    window.addEventListener('scroll', () => {
        // Reveal navigation option once the page passes 400 pixels of depth
        if (window.scrollY > 400) {
            originBtn.classList.add('is-active');
        } else {
            originBtn.classList.remove('is-active');
        }
    });

    // ROUTE FLOW BACK TO SOURCE PLATFORM ON INTERACTION
    originBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Triggers smooth system native tracking physics
        });
    });
});

// GIVE FEEDBACK: lets visitors submit their own testimonial, appended after
// the existing ones (oldest first, newest last) and kept across reloads.
document.addEventListener("DOMContentLoaded", () => {
    const addBtn = document.getElementById("add-feedback-btn");
    const modal = document.getElementById("feedback-modal");
    const closeBtn = document.getElementById("feedback-modal-close");
    const form = document.getElementById("feedback-form");
    const track = document.querySelector(".review-track");
    const starButtons = document.querySelectorAll(".fb-star");
    const ratingInput = document.getElementById("fb-rating");

    if (!addBtn || !modal || !form || !track) return;

    const STORAGE_KEY = "portfolio-user-feedback";

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value;
        return div.innerHTML;
    }

    function nextReviewId() {
        return track.querySelectorAll(".complex-tilt-card").length + 1;
    }

    function renderStars(rating) {
        return "★".repeat(rating) + "☆".repeat(5 - rating);
    }

    function buildReviewCard({ name, title, scope, rating, message }) {
        const card = document.createElement("div");
        card.className = "card complex-tilt-card";
        card.innerHTML = `
            <div class="card-internal-wrapper">
                <div class="project-header layer-z-mid">
                    <span class="project-id">REC-${String(nextReviewId()).padStart(2, "0")}</span>
                    <span class="project-status verified">Verified Client</span>
                </div>
                <div class="review-rating layer-z-high" aria-label="${rating} out of 5 stars">${renderStars(rating)}</div>
                <p class="layer-z-mid review-text">"${escapeHtml(message)}"</p>
                <div class="project-metrics layer-z-mid">
                    <div class="metric"><span class="label">Project Scope</span><span class="val">${escapeHtml(scope)}</span></div>
                </div>
                <div class="reviewer-meta layer-z-low">
                    <div class="reviewer-info">
                        <span class="reviewer-name">${escapeHtml(name)}</span>
                        <span class="reviewer-title">${escapeHtml(title)}</span>
                    </div>
                </div>
            </div>
        `;
        return card;
    }

    function loadStoredFeedback() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function saveStoredFeedback(entries) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }

    // Restore anything submitted previously, oldest first — same "last come, last added" order.
    const storedFeedback = loadStoredFeedback();
    storedFeedback.forEach(entry => {
        const card = buildReviewCard(entry);
        track.appendChild(card);
        bindCardTilt(card);
    });

    function setRating(value) {
        ratingInput.value = String(value);
        starButtons.forEach(star => {
            star.classList.toggle("filled", Number(star.dataset.value) <= value);
        });
    }

    starButtons.forEach(star => {
        star.addEventListener("click", () => setRating(Number(star.dataset.value)));
    });
    setRating(Number(ratingInput.value) || 5);

    function openModal() {
        modal.classList.add("open");
    }

    function closeModal() {
        modal.classList.remove("open");
    }

    addBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("fb-name").value.trim();
        const title = document.getElementById("fb-title").value.trim();
        const scope = document.getElementById("fb-scope").value;
        const message = document.getElementById("fb-message").value.trim();
        const rating = Number(ratingInput.value) || 5;

        if (!name || !title || !scope || !message) {
            form.reportValidity();
            return;
        }

        const entry = { name, title, scope, rating, message };

        // Append at the end, after all existing reviews — last submitted, last shown.
        storedFeedback.push(entry);
        saveStoredFeedback(storedFeedback);

        const card = buildReviewCard(entry);
        track.appendChild(card);
        bindCardTilt(card);
        card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "end" });

        form.reset();
        setRating(5);
        closeModal();
    });
});

// CLIENT FEEDBACK MARQUEE: duplicates the review cards once so the CSS
// translateX(-50% -> 0%) animation on .review-track loops seamlessly in a
// single line. Stays in sync automatically (including cards added later via
// "Give Feedback") by watching the track for real (non-clone) card changes.
document.addEventListener("DOMContentLoaded", () => {
    const track = document.querySelector(".review-track");
    if (!track) return;

    const CARD_GAP_PX = 20; // matches .review-track { gap: 20px; }
    const SPEED_PX_PER_SECOND = 40;

    function realCards() {
        return Array.from(track.children).filter(el => !el.classList.contains("marquee-clone"));
    }

    function syncClones() {
        track.querySelectorAll(".marquee-clone").forEach(el => el.remove());

        const originals = realCards();
        if (originals.length < 2) return; // not enough content to loop meaningfully

        originals.forEach(card => {
            const clone = card.cloneNode(true);
            clone.classList.add("marquee-clone");
            clone.setAttribute("aria-hidden", "true");
            track.appendChild(clone);
        });

        // One real-card-set's width (each card plus the gap that follows
        // it) — the exact distance the track must shift for the duplicated
        // clone set to land pixel-for-pixel where the originals started.
        const shiftPx = originals.reduce((sum, card) => sum + card.getBoundingClientRect().width + CARD_GAP_PX, 0);
        const duration = Math.max(18, shiftPx / SPEED_PX_PER_SECOND);
        track.style.setProperty("--marquee-shift", `${shiftPx}px`);
        track.style.setProperty("--marquee-duration", `${duration}s`);
    }

    syncClones();

    // Re-sync whenever a real card is added/removed (e.g. new feedback
    // submitted). Clone-only mutations (from syncClones itself) are ignored
    // so this never re-triggers itself.
    const observer = new MutationObserver((mutations) => {
        const touchesRealCard = mutations.some(m =>
            Array.from(m.addedNodes).some(n => n.nodeType === 1 && !n.classList.contains("marquee-clone")) ||
            Array.from(m.removedNodes).some(n => n.nodeType === 1 && !n.classList.contains("marquee-clone"))
        );
        if (touchesRealCard) syncClones();
    });
    observer.observe(track, { childList: true });
});

