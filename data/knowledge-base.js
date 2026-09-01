// Local knowledge base for the SYS_CHAT portfolio assistant.
// Loaded as a plain <script> (not fetch'd JSON) so retrieval still works
// when the site is opened directly via file:// — fetch() of local JSON is
// blocked by CORS under that protocol, a global array is not.
//
// Each entry is a retrievable "chunk": a short, self-contained block of text
// the client-side retriever can score against a user query and hand to the
// LLM as grounding context. Keep entries focused — one topic per chunk reads
// better in top-K retrieval than a few giant ones.
window.PORTFOLIO_KNOWLEDGE_BASE = [
    {
        id: "bio",
        category: "About",
        keywords: ["bio", "about", "who", "introduction", "summary", "developer", "engineer"],
        text: "Mohammad Kamran Ansari is a modern .NET Core developer based in Bandra, Mumbai, India, focused on building high-performance APIs and clean full-stack systems. He blends robust backend pipelines (ASP.NET Core / C#) with modern, fluid front-end interfaces to deploy scalable, ultra-performant web ecosystems. He is currently available for full-time roles and contract work."
    },
    {
        id: "education-btech",
        category: "Education",
        keywords: ["education", "degree", "college", "university", "btech", "b.tech", "cgpa", "computer science"],
        text: "Mohammad is pursuing a Bachelor of Technology (B.Tech) in Computer Science & Engineering at Chatrapati Shivaji Maharaj University (2023 - 2026), maintaining an 8.28 CGPA."
    },
    {
        id: "education-diploma",
        category: "Education",
        keywords: ["diploma", "polytechnic", "computer engineering", "education"],
        text: "Before his B.Tech, Mohammad completed a Diploma in Engineering (Computer Engineering) at M. H. Saboo Siddik Polytechnic (2020 - 2023), scoring 72.86%."
    },
    {
        id: "experience-crisfood",
        category: "Experience",
        keywords: ["experience", "internship", "job", "work", "crisfood", "web developer"],
        text: "Mohammad worked as a Web Developer Intern at Crisfood (Jan 2023 - June 2023), collaborating with the core development team to design, code, and test both front-end and back-end segments of their applications."
    },
    {
        id: "experience-nexgen",
        category: "Experience",
        keywords: ["experience", "internship", "job", "work", "nexgen", "hardware", "network"],
        text: "Mohammad worked as a Hardware & Network Intern at NexGen Marketing (Aug 2022 - Oct 2022), configuring, installing, and troubleshooting hardware and software setups alongside computer system peripherals."
    },
    {
        id: "skills-dotnet",
        category: "Skills",
        keywords: [".net", "dotnet", "asp.net", "c#", "csharp", "backend", "api", "mvc", "microservices", "jwt", "ef core", "django", "flask", "python backend"],
        text: "Mohammad's core specialization is Backend & API Design using C# and ASP.NET Core (proficiency ~95%). His .NET stack includes ASP.NET Core 10, MVC, Microservices, Web API design, JWT authentication, and Entity Framework Core. On the Python side he also works with Django and Flask for backend services."
    },
    {
        id: "skills-database",
        category: "Skills",
        keywords: ["database", "sql", "sql server", "mongodb", "mysql", "sqlite", "data", "schema"],
        text: "Mohammad's database engineering skills (~90% proficiency) span SQL Server, MongoDB, MySQL, and SQLite, with strong experience designing relational schemas and choosing the right data store (relational vs. document) for a given project."
    },
    {
        id: "skills-frontend",
        category: "Skills",
        keywords: ["frontend", "react", "reactjs", "nextjs", "next.js", "typescript", "javascript", "tailwind", "bootstrap", "ui"],
        text: "On the front end (~88% proficiency), Mohammad builds with React.js, Next.js, TypeScript, and JavaScript, styling with Tailwind CSS and Bootstrap to ship fluid, responsive UI on top of his .NET and Python backends."
    },
    {
        id: "skills-cloud",
        category: "Skills",
        keywords: ["cloud", "azure", "aws", "vercel", "devops", "ci/cd", "git", "github", "jenkins", "deployment"],
        text: "Mohammad's cloud & deployment experience (~85% proficiency) covers Microsoft Azure, AWS (EC2/S3), and Vercel for hosting, Git/GitHub for version control, and CI/CD pipelines via Jenkins."
    },
    {
        id: "skills-core",
        category: "Skills",
        keywords: ["fundamentals", "oop", "networks", "operating systems", "testing", "computer science basics"],
        text: "Mohammad's engineering core (~92% proficiency) includes Object-Oriented Programming, Computer Networks, Operating Systems, and Software Testing — the CS fundamentals underpinning his application work."
    },
    {
        id: "skills-systems",
        category: "Skills",
        keywords: ["hardware", "systems", "infra", "troubleshooting", "cable termination", "system config"],
        text: "From his hardware/network internship, Mohammad also has hands-on Systems & Infra skills (~80% proficiency): hardware deployment, troubleshooting, system configuration, and cable termination."
    },
    {
        id: "project-advanced-crud",
        category: "Project",
        keywords: ["crud", "advanced crud solutions", "identity", "authentication", "authorization", "sql server", "asp.net core", "jwt"],
        text: "Project — Advanced CRUD Solutions (Production Ready): a high-performance ASP.NET Core 10 / MVC web architecture with full product lifecycle management and secure authentication & authorization via ASP.NET Core Identity + JWT, backed by a SQL Server relational schema. Tech: C#, ASP.NET Core 10, MVC, JWT, SQL Server."
    },
    {
        id: "project-vendor-finder",
        category: "Project",
        keywords: ["street cart", "vendor finder", "geolocation", "mapping", "web api", "ef core"],
        text: "Project — Street Cart Vendor Finder (Under Active Construction): a real-time vendor tracking and mapping platform using the browser's HTML5 Geolocation API on the front end and an ASP.NET Core Web API backend with EF Core / LINQ over SQL Server, styled with Bootstrap. Tech: C#, Web API, SQL Server, EF Core, Bootstrap."
    },
    {
        id: "project-todo-app",
        category: "Project",
        keywords: ["todo", "to-do", "task management", "flask", "sqlite", "jinja"],
        text: "Project — To-Do Web Application (Completed, Feb 2026 - Mar 2026): a full-stack task management app built with Flask and SQLite, with a full CRUD task lifecycle and server-rendered Jinja2 templates for fast, dynamic pages. Tech: Python, Flask, SQLite, Jinja2, JavaScript."
    },
    {
        id: "project-mcq-generator",
        category: "Project",
        keywords: ["mcq", "quiz generator", "openai", "ai tool", "json schema"],
        text: "Project — Python MCQ Generator (Completed, Jan 2025 - Mar 2025): an AI tool using the OpenAI API to turn raw documents into structured multiple-choice question sets, with every response validated against a strict JSON schema. Tech: Python, OpenAI API, JSON Parsing / Validation."
    },
    {
        id: "project-ecommerce",
        category: "Project",
        keywords: ["ecommerce", "e-commerce", "next.js", "react", "mongodb", "storefront"],
        text: "Project — AI-Integrated E-Commerce (Production Ready): a responsive, next-gen full-stack commercial platform built with Next.js (SSR) and React.js on the front end, MongoDB as a flexible document store for the product catalog, tuned for mobile, tablet, and desktop viewports. Tech: Next.js, React.js, JavaScript, MongoDB."
    },
    {
        id: "project-suicidal-behaviour",
        category: "Project",
        keywords: ["capstone", "diploma project", "risk prediction", "mongodb", "final year project"],
        text: "Project — Suicidal Behaviour Prediction (Completed Deployment): Mohammad's Diploma capstone project — a full-stack web app that parses structured questionnaire responses and session metadata to help surface risk indicators as an early-warning support signal, not a diagnostic tool. Built with HTML5, JavaScript, Bootstrap, and MongoDB for flexible response storage."
    },
    {
        id: "contact",
        category: "Contact",
        keywords: ["contact", "email", "phone", "hire", "reach", "location", "linkedin", "whatsapp"],
        text: "You can reach Mohammad at w2mohdkamranforwork@gmail.com, by phone/WhatsApp at +91 98203 60057, or via LinkedIn (linkedin.com/in/mohammad-kamran-28958b378). He is based in Bandra, Mumbai, India and is available for full-time roles and contract work — the portfolio's contact form and 'Give Feedback' section are also good ways to get in touch."
    },
    {
        id: "reviews",
        category: "Testimonials",
        keywords: ["review", "testimonial", "feedback", "client", "reference", "reputation"],
        text: "Client feedback on Mohammad's work: Asad Marchant (Tech Lead, Crisfood) praised a bulletproof API gateway configuration delivered ahead of schedule; Sarah Dalvi (Senior Software Architect) highlighted his ability to cleanly bind front-end viewports with NoSQL query models; Rohit Jadhav (Business Owner, MT-Collection) said the delivered web app significantly improved his business workflow."
    }
];
