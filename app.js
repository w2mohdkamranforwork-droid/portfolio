

// --- MULTI-OBJECT GRAPHICS ACCELERATION CORE & PERSISTENT DATA DRIVERS ---
document.addEventListener("DOMContentLoaded", () => {
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
function init3DTilt() {
    const structuralCards = document.querySelectorAll('.card, .skill-item');
    
    structuralCards.forEach(card => {
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
    });
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

document.addEventListener("DOMContentLoaded", () => {
    // 1. Target buttons specifically inside the project section
    const filterButtons = document.querySelectorAll(".filter-btn");
    // 2. ONLY target cards inside the #project section grid
    const projectCards = document.querySelectorAll("#project .complex-tilt-card");

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            filterButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            const filterValue = button.getAttribute("data-filter");

            projectCards.forEach(card => {
                const cardCategory = card.getAttribute("data-category");

                if (filterValue === "all" || cardCategory === filterValue) {
                    card.style.display = "block";
                    setTimeout(() => {
                        card.style.opacity = "1";
                        card.style.transform = "scale(1)";
                    }, 10);
                } else {
                    card.style.opacity = "0";
                    card.style.transform = "scale(0.95)";
                    setTimeout(() => {
                        card.style.display = "none";
                    }, 300); 
                }
            });
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const loadBar = document.getElementById("load-bar");
    const loadPercentage = document.getElementById("load-percentage");
    const logsContainer = document.getElementById("terminal-logs");
    
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

window.addEventListener('resize', () => {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer rendering dimensions
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// INITIALIZE SCROLL ENGINE CONTROL
const originBtn = document.getElementById('scroll-to-origin');

window.addEventListener('scroll', () => {
    // Reveal navigation option once the page passes 400 pixels of depth
    if (window.scrollY > 400) {
        originBtn.classList.add('is-active');
    } else {
        originBtn.classList.remove('is-active');
    }
});

// ROUTE FLOW BACK TO SOURCE PLATFORM ON INTERACTION
originBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Triggers smooth system native tracking physics
    });
});

const scrollBtn = document.getElementById('scroll-to-origin');

window.addEventListener('scroll', () => {
    // Check if the user has scrolled down more than 300px
    if (window.scrollY > 300) {
        scrollBtn.classList.add('visible');
    } else {
        scrollBtn.classList.remove('visible');
    }
});

// Optional: Smooth scroll back to top when clicked
scrollBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Wait for the DOM to be safe and loaded
document.addEventListener("DOMContentLoaded", () => {
    const whatsappBtn = document.getElementById("submit-whatsapp");

    if (whatsappBtn) {
        whatsappBtn.addEventListener("click", function(e) {
            // 1. Halt browser layout form reloads
            e.preventDefault();
            e.stopPropagation();

            // 2. Direct input values extraction matching your exact HTML layout
            const nameField = document.getElementById("name");
            const emailField = document.getElementById("email");
            const msgField = document.getElementById("msg");

            if (!nameField || !emailField || !msgField) {
                console.error("Critical: Layout form fields are missing from the DOM ecosystem.");
                return;
            }

            const name = nameField.value.trim();
            const email = emailField.value.trim();
            const msg = msgField.value.trim();

            // 3. Form input validation check
            if (name === "" || email === "" || msg === "") {
                const formEngine = document.getElementById("contact-form-engine");
                if (formEngine) formEngine.reportValidity();
                return;
            }

            // 4. Compile message data string with clean Markdown layout
            const textMessage = `*SYSTEM TRANSMISSION INTENT*\n\n` + 
                                `*Name:* ${name}\n` + 
                                `*Email:* ${email}\n\n` + 
                                `*Scope Specifications:*\n${msg}`;
            
            const encodedPayload = encodeURIComponent(textMessage);
            
            // 5. Target routing assignment
            const targetUrl = "https://wa.me/919820360057?text=" + encodedPayload;
            
            console.log("Routing payload execution destination to:", targetUrl);

            // 6. Direct browser window location transfer
            window.location.href = targetUrl;
        });
    } else {
        console.warn("System Notice: WhatsApp anchor element ('submit-whatsapp') missing from active view.");
    }
});