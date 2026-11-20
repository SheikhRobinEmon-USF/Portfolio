/*
 * Portfolio assistant: the answer engine.
 * BM25 search over the site's own content (assets/js/data.js) plus an intent router.
 * Runs entirely in the browser. No API calls, no model, nothing leaves the page.
 */
(() => {
  // ../../../tmp/claude-0/-home-user-portfolio/41d18d37-cf4c-56b0-a07b-cc43f39ead2e/scratchpad/port/shim/experience.js
  var experience = window.PORTFOLIO.experience;
  function bulletsFor(role, lens) {
    const rank = (b) => {
      const i = b.lens.indexOf(lens);
      return i === -1 ? 99 : i;
    };
    return [...role.bullets].sort((a, b) => rank(a) - rank(b));
  }

  // ../../../tmp/claude-0/-home-user-portfolio/41d18d37-cf4c-56b0-a07b-cc43f39ead2e/scratchpad/port/shim/profile.js
  var D = window.PORTFOLIO;
  var profile = D.profile;
  var lenses = D.lenses;
  var metrics = D.metrics;
  var education = D.education;
  var awards = D.awards;
  var story = D.story;
  var strengths = D.strengths;

  // ../../../tmp/claude-0/-home-user-portfolio/41d18d37-cf4c-56b0-a07b-cc43f39ead2e/scratchpad/port/shim/projects.js
  var D2 = window.PORTFOLIO;
  var caseStudies = D2.caseStudies;
  var clearline = D2.clearline;
  var categories = D2.categories;
  var shipped = D2.shipped;

  // ../../../tmp/claude-0/-home-user-portfolio/41d18d37-cf4c-56b0-a07b-cc43f39ead2e/scratchpad/port/shim/skills.js
  var capabilities = window.PORTFOLIO.capabilities;
  var technologies = window.PORTFOLIO.technologies;

  // src/lib/assistant/knowledge.ts
  function buildKnowledge() {
    var _a, _b, _c, _d;
    const docs = [];
    docs.push(
      {
        id: "profile-summary",
        kind: "profile",
        title: "Who Robin is",
        text: `${profile.name} is an AI Product Manager and Forward Deployed AI Engineer with 6+ years of international experience taking AI products from customer discovery to production. ${profile.currently}`,
        href: "/#top",
        source: "Intro",
        tags: "about bio introduction overview background summary who"
      },
      {
        id: "profile-domains",
        kind: "profile",
        title: "Industries",
        text: `Domain experience spans ${profile.domains.join(", ")}.`,
        href: "/#impact",
        source: "Impact",
        tags: "industry domain sector vertical"
      },
      {
        id: "profile-location",
        kind: "contact",
        title: "Location",
        text: `Robin is based in ${profile.location}. ${profile.relocation}.`,
        href: "/#contact",
        source: "Contact",
        tags: "where live based city relocate remote onsite move california bay area"
      },
      {
        id: "profile-contact",
        kind: "contact",
        title: "Contact",
        text: `Email Robin at ${profile.email}. He is also on LinkedIn and GitHub.`,
        href: "/#contact",
        source: "Contact",
        tags: "email reach message hire talk connect linkedin github call interview"
      }
    );
    story.forEach(
      (para, i) => docs.push({
        id: `story-${i}`,
        kind: "profile",
        title: ["Starting in AdTech", "Product management at Riseup Labs", "Graduate school and research"][i],
        text: para,
        href: "/#about",
        source: "About",
        tags: "story journey career path history"
      })
    );
    for (const m of metrics) {
      docs.push({
        id: `metric-${m.id}`,
        kind: "profile",
        title: `${(_a = m.prefix) != null ? _a : ""}${m.value.toLocaleString("en-US")}${m.suffix} ${m.label}`,
        text: m.context,
        href: "/#impact",
        source: "Impact",
        tags: "result impact number metric outcome achievement"
      });
    }
    for (const role of experience) {
      docs.push({
        id: `role-${role.id}`,
        kind: "experience",
        title: `${role.role}, ${role.company}`,
        text: `${role.period}, ${role.place}. ${role.blurb}`,
        href: `/#role-${role.id}`,
        source: role.company,
        tags: `job role work experience company employer ${role.stack.join(" ")}`
      });
      role.bullets.forEach(
        (b, i) => docs.push({
          id: `role-${role.id}-${i}`,
          kind: "experience",
          title: `${b.title} (${role.company})`,
          text: b.text,
          href: `/#role-${role.id}`,
          source: role.company
        })
      );
    }
    for (const c of caseStudies) {
      docs.push({
        id: `case-${c.slug}`,
        kind: "case",
        title: c.name,
        text: `${c.summary} ${c.problem}`,
        href: `/work/${c.slug}`,
        source: c.name,
        tags: `project open source github repo side project build ${c.stack.join(" ")}`
      });
      c.features.forEach(
        (f, i) => docs.push({
          id: `case-${c.slug}-f${i}`,
          kind: "case",
          title: `${c.name}: ${f.title}`,
          text: f.text,
          href: `/work/${c.slug}`,
          source: c.name
        })
      );
      docs.push({
        id: `case-${c.slug}-design`,
        kind: "case",
        title: `${c.name}: design principles`,
        text: c.principles.map((p) => `${p.concern}: ${p.approach}`).join(" "),
        href: `/work/${c.slug}`,
        source: c.name,
        tags: "architecture design decisions why approach hallucination grounding trust"
      });
      docs.push({
        id: `case-${c.slug}-limits`,
        kind: "case",
        title: `${c.name}: limits`,
        text: c.limits,
        href: `/work/${c.slug}`,
        source: c.name,
        tags: "limitations caveats honest weaknesses"
      });
      for (const e of (_b = c.evals) != null ? _b : []) {
        const best = e.rows[(_c = e.highlight) != null ? _c : 0];
        docs.push({
          id: `case-${c.slug}-eval-${e.title}`,
          kind: "case",
          title: `${c.name}: ${e.title.toLowerCase()} results`,
          text: `${e.note} Best configuration: ${e.columns.map((col, i) => `${col} ${best[i]}`).join(", ")}.`,
          href: `/work/${c.slug}`,
          source: c.name,
          tags: "evaluation evals benchmark accuracy results models tested score latency"
        });
      }
    }
    docs.push({
      id: "case-clearline",
      kind: "case",
      title: clearline.name,
      text: `${clearline.tagline} ${clearline.summary.replace("I own", "Robin owns")} ${clearline.kind}.`,
      href: "/#work",
      source: "Selected work",
      tags: `project agent agentic tariff customs trade hts ${clearline.stack.join(" ")}`
    });
    for (const s of shipped) {
      const extra = (_d = s.secondary) == null ? void 0 : _d.map((x) => `${x.value} ${x.label}`).join(", ");
      docs.push({
        id: `shipped-${s.id}`,
        kind: "project",
        title: `${s.name} (${s.org})`,
        text: `${s.metric.value} ${s.metric.label}${extra ? `, ${extra}` : ""}. ${s.text} ${s.did.join(" ")} ${s.impact.join(" ")}`,
        href: `case:${s.id}`,
        source: s.name,
        tags: `product shipped case study ${s.headline} ${s.role} ${s.category.join(" ")} ${s.domain.join(" ")} ${s.tools.join(" ")}`
      });
    }
    for (const g of [...technologies, ...capabilities]) {
      docs.push({
        id: `skills-${g.id}`,
        kind: "skills",
        title: `${g.label} skills`,
        text: g.items.join(", ") + ".",
        href: "/#skills",
        source: "Toolkit",
        tags: "skills tools stack technologies know proficient experience with"
      });
    }
    for (const e of education) {
      docs.push({
        id: `edu-${e.school}`,
        kind: "education",
        title: e.school,
        text: `${e.degree}, ${e.school}, ${e.place}. ${e.period}. GPA ${e.gpa}.`,
        href: "/#about",
        source: "Education",
        tags: "education degree school university college study masters bachelor gpa grade graduate graduation"
      });
    }
    docs.push({
      id: "awards",
      kind: "award",
      title: "Awards and recognition",
      text: awards.map((a) => `${a.title}, ${a.org} (${a.year})`).join("; ") + ".",
      href: "/#about",
      source: "Recognition",
      tags: "award prize honor recognition achievement won judge"
    });
    return docs;
  }
  function skillTerms() {
    const base = [...technologies, ...capabilities].flatMap((g) => g.items);
    const extra = [
      "LLM",
      "LLMs",
      "agents",
      "MCP",
      "evals",
      "CNN",
      "Power BI",
      "Claude Code",
      "A/B testing",
      "UX research",
      "linear programming",
      "forecasting",
      "text-to-speech",
      "IoT",
      "Unity",
      "DV360",
      "Streamlit",
      "Ollama",
      "Svelte",
      "Next.js",
      "DuckDB",
      "SQLite",
      "GTM",
      "RICE",
      "HIPAA",
      "PLM"
    ];
    return [.../* @__PURE__ */ new Set([...base, ...extra])].sort((a, b) => b.length - a.length);
  }

  // src/lib/assistant/engine.ts
  var STOP = new Set(
    "a an and are as at be been but by can could did do does for from had has have he her him his how i if in into is it its me my of on or our robin robins emon sheikh she so tell than that the their them then there these they this to us was we were what when where which who whom why will with would you your about any some more most much many please show give know like".split(
      " "
    )
  );
  var SYNONYMS = {
    llm: ["llm", "language", "model", "genai", "generative"],
    llms: ["llm"],
    genai: ["generative", "llm", "openai"],
    ai: ["ai", "llm", "machine", "learning"],
    ml: ["machine", "learning", "scikit", "tensorflow", "model"],
    rag: ["rag", "retrieval", "retrieve"],
    retrieval: ["rag", "retrieval"],
    agent: ["agent", "agentic", "langgraph"],
    agents: ["agent", "agentic", "langgraph"],
    agentic: ["agent", "agentic"],
    eval: ["eval", "evaluation", "benchmark"],
    evals: ["eval", "evaluation", "benchmark"],
    evaluation: ["eval", "evaluation", "benchmark"],
    healthcare: ["healthcare", "hospital", "health"],
    hospital: ["hospital", "healthcare"],
    health: ["healthcare", "hospital"],
    school: ["education", "university", "degree"],
    study: ["education", "university", "degree"],
    degree: ["degree", "education", "master", "bachelor"],
    college: ["university", "education"],
    job: ["role", "experience", "work"],
    jobs: ["role", "experience", "work"],
    startup: ["founding", "founder", "retouching"],
    founder: ["founding", "retouching"],
    growth: ["growth", "revenue", "retention", "adoption"],
    revenue: ["revenue", "growth"],
    data: ["data", "analytics", "sql", "dashboard"],
    analytics: ["analytics", "data", "dashboard", "analysis"],
    dashboard: ["dashboard", "power", "tableau"],
    ads: ["ad", "advertising", "adtech", "programmatic"],
    advertising: ["ad", "adtech"],
    adtech: ["ad", "adtech", "programmatic"],
    unicef: ["unicef"],
    teacher: ["teacher"],
    teachers: ["teacher"],
    speech: ["speech", "tts"],
    voice: ["speech", "tts"],
    tts: ["speech", "tts"],
    game: ["game", "gaming", "meena", "jeeto"],
    gaming: ["game", "gaming"],
    payment: ["payment", "transaction", "fraud"],
    payments: ["payment", "transaction", "fraud"],
    fintech: ["payment", "transaction", "payg", "fintech", "paylineage", "payable", "beneficiary", "fraud"],
    edtech: ["teacher", "edtech", "education"],
    ecommerce: ["commerce", "spark"],
    intern: ["intern", "arena", "ptc"],
    internship: ["intern", "arena", "ptc"],
    ptc: ["ptc", "arena"],
    arena: ["arena", "ptc"],
    usf: ["south", "florida", "usf"],
    tgh: ["tampa", "general", "hospital"],
    pm: ["product", "manager", "roadmap"],
    leadership: ["led", "leading", "leadership", "team", "stakeholder"],
    lead: ["led", "leading", "leadership"],
    team: ["team", "cross", "functional"],
    customer: ["customer", "client", "stakeholder", "user"],
    customers: ["customer", "client", "stakeholder", "user"],
    cost: ["cost", "saving"],
    forecasting: ["forecast", "forecasting"],
    hallucination: ["grounding", "hallucinated", "grounded"],
    hallucinations: ["grounding", "hallucinated", "grounded"],
    grounding: ["grounding", "grounded"]
  };
  function stem(w) {
    if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
    if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
    if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
    return w;
  }
  function tokenize(text, expand = false) {
    const raw = text.toLowerCase().replace(/e-commerce/g, "ecommerce").replace(/[^a-z0-9+#./ ]+/g, " ").split(/[\s/]+/).map((w) => w.replace(/^[.]+|[.]+$/g, "")).filter((w) => w.length > 1 || /\d/.test(w));
    const out = [];
    for (const w of raw) {
      if (STOP.has(w)) continue;
      if (expand && SYNONYMS[w]) out.push(...SYNONYMS[w].map(stem));
      out.push(stem(w));
    }
    return out;
  }
  var Index = class {
    constructor(docs) {
      this.docs = [];
      this.df = /* @__PURE__ */ new Map();
      this.avg = 1;
      var _a, _b, _c;
      for (const doc of docs) {
        const tokens = [
          ...tokenize(doc.title),
          ...tokenize(doc.title),
          ...tokenize(doc.title),
          ...tokenize(doc.text),
          ...tokenize((_a = doc.tags) != null ? _a : "")
        ];
        const tf = /* @__PURE__ */ new Map();
        for (const t of tokens) tf.set(t, ((_b = tf.get(t)) != null ? _b : 0) + 1);
        for (const t of tf.keys()) this.df.set(t, ((_c = this.df.get(t)) != null ? _c : 0) + 1);
        this.docs.push({ doc, tf, len: tokens.length });
      }
      this.avg = this.docs.reduce((s, d) => s + d.len, 0) / Math.max(1, this.docs.length);
    }
    search(query, limit = 4) {
      const terms = [...new Set(tokenize(query, true))];
      if (!terms.length) return [];
      const N = this.docs.length;
      const k1 = 1.4;
      const b = 0.7;
      const scored = this.docs.map((d) => {
        var _a;
        let score = 0;
        for (const t of terms) {
          const f = d.tf.get(t);
          if (!f) continue;
          const n = (_a = this.df.get(t)) != null ? _a : 0;
          const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
          score += idf * f * (k1 + 1) / (f + k1 * (1 - b + b * d.len / this.avg));
        }
        return { doc: d.doc, score };
      });
      return scored.filter((s) => s.score > 0).sort((a, b2) => b2.score - a.score).slice(0, limit);
    }
  };
  var cache = null;
  function kb() {
    if (!cache) {
      const docs = buildKnowledge();
      cache = { index: new Index(docs), docs, skills: skillTerms() };
    }
    return cache;
  }
  var uniqueSources = (docs) => {
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const d of docs) {
      const key = d.href + d.source;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ label: d.source, href: d.href });
    }
    return out.slice(0, 4);
  };
  var esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function findSkill(q) {
    const lower = ` ${q.toLowerCase()} `;
    for (const s of kb().skills) {
      const re = new RegExp(`(^|[^a-z0-9])${esc(s.toLowerCase())}([^a-z0-9]|$)`);
      if (re.test(lower)) return s;
    }
    return null;
  }
  var sections = [
    { re: /\b(experience|career|timeline|work history|jobs?)\b/, target: "#experience", label: "Experience" },
    { re: /\b(skills?|stack|toolkit|tech(nolog(y|ies))?|tools)\b/, target: "#skills", label: "Toolkit" },
    { re: /\b(about|story|bio|education|awards?|photo)\b/, target: "#about", label: "About" },
    { re: /\b(contact|email|hire|reach)\b/, target: "#contact", label: "Contact" },
    { re: /\b(impact|numbers|metrics|results)\b/, target: "#impact", label: "Impact" },
    { re: /\b(shipped|products|archive|gallery|case studies)\b/, target: "#shipped", label: "Case study gallery" },
    { re: /\b(work|projects?|portfolio|case stud(y|ies))\b/, target: "#work", label: "Selected work" },
    { re: /\b(top|home|start|beginning)\b/, target: "#top", label: "the top" }
  ];
  var defaultFollowups = [
    "What has Robin built with RAG?",
    "Tell me about the hospital research",
    "What are his strongest results?"
  ];
  function answer(question, lens = "pm") {
    var _a, _b, _c;
    const q = question.trim();
    const l = q.toLowerCase();
    const base = { sources: [], actions: [], followups: defaultFollowups, grounded: true };
    if (!q) {
      return { ...base, text: "Ask me anything about Robin's work, skills or background.", grounded: false };
    }
    if (/\b(dark|light)\s?(mode|theme)\b|\b(switch|toggle|change)\b.*\btheme\b/.test(l)) {
      return {
        ...base,
        text: "Done. I switched the theme.",
        run: { type: "theme", label: "Switched theme" },
        grounded: false
      };
    }
    const lensMatch = /\b(view|read|see|show|switch|tailor)\b.*\b(as|for|to)\b.*\b(engineer|fde|forward deployed|pm|product manager|product|analyst|ba|business analyst|analytics)\b/.exec(
      l
    );
    if (lensMatch) {
      const w = lensMatch[3];
      const next = /engineer|fde|forward/.test(w) ? "fde" : /analyst|ba|analytics/.test(w) ? "ba" : "pm";
      const label = lenses.find((x) => x.id === next).label;
      return {
        ...base,
        text: `I re-ordered the site for a **${label}** reader. Summaries, experience bullets, skills and products now lead with what matters most for that role.`,
        run: { type: "lens", lens: next, label: `Lens set to ${label}` },
        actions: [{ type: "scroll", target: "#experience", label: "See experience" }],
        grounded: false
      };
    }
    const nav = /\b(take me|go|jump|scroll|navigate|bring me|open|show me)\b/.test(l);
    if (nav) {
      const cs = caseStudies.find((c) => l.includes(c.name.toLowerCase()) || l.includes(c.slug.split("-")[0]));
      if (cs) {
        return {
          ...base,
          text: `Opening the **${cs.name}** case study.`,
          run: { type: "route", href: `/work/${cs.slug}`, label: `Opened ${cs.name}` },
          sources: [{ label: cs.name, href: `/work/${cs.slug}` }]
        };
      }
      const sp = shipped.find((s) => l.includes(s.name.toLowerCase().split(" ")[0]));
      if (sp) {
        return {
          ...base,
          text: `Here is **${sp.name}**: ${sp.metric.value} ${sp.metric.label}. ${sp.text}`,
          run: { type: "case", id: sp.id, label: `Opened ${sp.name}` },
          sources: [{ label: sp.name, href: `case:${sp.id}` }]
        };
      }
      const sec = sections.find((s) => s.re.test(l));
      if (sec && !/\bshow me (how|what|why|where|who|his|her|the best|some)\b/.test(l)) {
        return {
          ...base,
          text: `Taking you to **${sec.label}**.`,
          run: { type: "scroll", target: sec.target, label: `Scrolled to ${sec.label}` },
          grounded: false
        };
      }
    }
    if (/\b(salary|compensation|pay|visa|sponsor(ship)?|h-?1b|opt|cpt|citizen(ship)?|age|old|married|religion|notice period|start date|available to start)\b/.test(l)) {
      return {
        ...base,
        text: "That is not something this portfolio states, and I only answer from what is published here. The quickest way to find out is to ask Robin directly.",
        actions: [
          { type: "copy-email", label: "Copy his email" },
          { type: "open", href: profile.links.linkedin, label: "Open LinkedIn" }
        ],
        grounded: false
      };
    }
    if (/^(hi|hello|hey|yo|howdy|hola|good (morning|afternoon|evening))\b/.test(l) && q.length < 30) {
      return {
        ...base,
        text: "Hello. I am a small retrieval assistant that runs entirely in your browser. I answer questions about Robin from the content of this site, cite where each answer comes from, and can navigate the page for you. Try one of these:",
        grounded: false
      };
    }
    if (/\b(what can you do|how do you work|are you (an? )?(ai|llm|gpt|bot|real)|(which|what) (model|llm) (are you|do you|powers|is this|runs)|who (made|built) you|how (were|are) you built)\b/.test(l)) {
      return {
        ...base,
        text: "I am not a hosted LLM. I am a retrieval engine that runs locally in your browser: BM25 search over an index built from this site's own content, plus a small intent router. That means no API calls, nothing you type leaves the page, and I cannot invent facts, because every sentence I return is drawn from what is published here. It is the same idea behind Robin's Hospital Ops Copilot, where the model never does the arithmetic.\n\nI can answer questions, cite sources, jump to sections, open case studies, switch the theme, and re-order the site for the role you are hiring for.",
        sources: [{ label: "Hospital Ops Copilot", href: "/work/hospital-ops-copilot" }],
        grounded: false
      };
    }
    if (/\b(30.second|elevator|summary|summari[sz]e|overview|tl;?dr|who is|about (him|robin)|introduce|in short|quick version)\b/.test(l)) {
      const top = [...metrics].sort((a, b) => (a.lens.indexOf(lens) === -1 ? 9 : a.lens.indexOf(lens)) - (b.lens.indexOf(lens) === -1 ? 9 : b.lens.indexOf(lens))).slice(0, 3);
      return {
        ...base,
        text: `${profile.summary[lens]}

${top.map((m) => {
          var _a2;
          return `- **${(_a2 = m.prefix) != null ? _a2 : ""}${m.value.toLocaleString("en-US")}${m.suffix}** ${m.label}. ${m.context}`;
        }).join("\n")}

${profile.currently}`,
        sources: [
          { label: "Intro", href: "/#top" },
          { label: "Impact", href: "/#impact" }
        ],
        followups: ["Why should we hire Robin?", "What is he working on now?", "Show me his open-source projects"]
      };
    }
    if (/\b(why (should|would) (we|i|you)|why hire|why robin|what makes (him|robin)|stand out|different|strength|strongest|best (results|work)|biggest (wins?|achievements?)|proud)\b/.test(l)) {
      const byLens = {
        pm: [
          "**He has shipped at scale.** Teachers Portal reached 1.3M+ monthly active users with a 25% retention lift, and UNICEF's Meena Game passed 10M+ downloads.",
          "**He builds what he specifies.** At Arena by PTC he built Claude API, LangGraph and MCP agent workflows that cut delivery turnaround by 30%, and designed the LLM evals that informed the roadmap.",
          "**He ties product to revenue.** At Arena by PTC he revamped Scribe, a feature with more than US $11M in annual recurring revenue; eCook's pay-as-you-go pipeline contributed to 48% annual revenue growth."
        ],
        fde: [
          "**He deploys AI in the field.** French to Mooré text-to-speech with offline-ready features reached 700,000 U-Reporters in Burkina Faso.",
          "**He measures before he ships.** PayLineage allowed zero unauthorized payments across 54 attacks on a frozen holdout, even with a fully manipulated model; Hospital Ops Copilot was evaluated across models for tool selection, accuracy, grounding and latency.",
          "**He moves real numbers with models.** CNN ad verification went from 48% to 98% detection accuracy, and predictive bidding cut ad costs by 34%."
        ],
        ba: [
          "**He works large, messy operational data.** 500K+ hospital records across 8 departments with Tampa General Hospital, delivered as 6 Power BI dashboards to 15+ stakeholders.",
          "**His analysis changes outcomes.** Forecast accuracy up 20% over baseline, ad costs down 34%, onboarding drop-off down 18%.",
          "**He connects insight to revenue.** A real-time usage pipeline contributed to 48% annual revenue growth at eCook, and a GTM and UX program grew an e-commerce site's revenue by 43%."
        ]
      };
      return {
        ...base,
        text: `${/\b(result|win|achievement|proud|best work)/.test(l) ? "His strongest results" : "Three reasons"}, with the evidence behind each:

${byLens[lens].map((b) => `- ${b}`).join("\n")}`,
        sources: [
          { label: "Impact", href: "/#impact" },
          { label: "Experience", href: "/#experience" },
          { label: "Selected work", href: "/#work" }
        ],
        actions: [{ type: "copy-email", label: "Copy his email" }],
        followups: ["What is he working on now?", "Tell me about Hospital Ops Copilot", "Where is he based?"]
      };
    }
    if (/\b(contact|email|e-mail|reach (him|robin|out)|get in touch|hire him|talk to (him|robin)|message him|linkedin|github profile|phone( number)?|call him)\b/.test(l)) {
      return {
        ...base,
        text: `The best way to reach Robin is email: **${profile.email}**. He is also on LinkedIn and GitHub.`,
        sources: [{ label: "Contact", href: "/#contact" }],
        actions: [
          { type: "copy-email", label: "Copy email" },
          { type: "open", href: profile.links.linkedin, label: "LinkedIn" },
          { type: "open", href: profile.links.github, label: "GitHub" }
        ],
        followups: ["Where is he based?", "Why should we hire Robin?", "What roles is he looking for?"]
      };
    }
    if (/\b(resume|résumé|cv|curriculum)\b/.test(l)) {
      return {
        ...base,
        text: `This site is the living version of Robin's CV, and it carries everything a PDF would. For a formatted copy tailored to your role, email him at **${profile.email}**.`,
        sources: [{ label: "Experience", href: "/#experience" }],
        actions: [
          { type: "copy-email", label: "Copy email" },
          { type: "scroll", target: "#experience", label: "See experience" }
        ]
      };
    }
    if (/\b(live demo|demo|try (it|them)|play with|hosted|deployed|link to (the )?app)\b/.test(l)) {
      const live = caseStudies.filter((c) => c.demo);
      if (live.length) {
        return {
          ...base,
          text: `Yes. ${live.map((c) => `**${c.name}** has a live demo that runs in your browser with nothing to install`).join("; ")}. The other projects run locally from their GitHub repositories.`,
          sources: live.map((c) => ({ label: c.name, href: `/work/${c.slug}` })),
          actions: live.map((c) => ({ type: "open", href: c.demo, label: `Open the ${c.name} demo` })),
          followups: ["How does PayLineage stop a changed bank account?", "What were the PayLineage eval results?", "Show me his open-source projects"]
        };
      }
    }
    if (/\bwhere (did|has|does) (he|robin) (work|worked)\b|\b(which|what) (companies|employers|organi[sz]ations)\b|\b(work history|employment history|past jobs|previous jobs)\b/.test(l)) {
      return {
        ...base,
        text: `Robin has worked at:\n\n${experience.map((r) => `- **${r.company}**, ${r.role}. ${r.place}, ${r.period}.`).join("\n")}`,
        sources: experience.map((r) => ({ label: r.company, href: `/#role-${r.id}` })).slice(0, 4),
        actions: [{ type: "scroll", target: "#experience", label: "See experience" }],
        followups: ["What did he do at Arena by PTC?", "Tell me about the hospital research", "Why should we hire Robin?"]
      };
    }
    if (/\b(fintech|financial technology|payments? (work|experience|projects?)|accounts payable)\b/.test(l)) {
      const pl = caseStudies.find((c) => c.slug === "paylineage");
      const pay = shipped.filter((x) => ["jeeto", "ecook"].indexOf(x.id) !== -1);
      const lines = [];
      if (pl) lines.push(`- **${pl.name}.** ${pl.summary} On a 96-scenario holdout it allowed zero unauthorized payments across 54 attacks.`);
      pay.forEach((x) => lines.push(`- **${x.name} (${x.org}).** ${x.text} ${x.impact.join(" ")}`));
      return {
        ...base,
        text: `Robin's fintech work spans AI payment security and consumer payments:\n\n${lines.join("\n")}`,
        sources: [
          ...(pl ? [{ label: pl.name, href: `/work/${pl.slug}` }] : []),
          ...pay.map((x) => ({ label: x.name, href: `case:${x.id}` }))
        ],
        actions: pl ? [{ type: "route", href: `/work/${pl.slug}`, label: "Open PayLineage" }, ...(pl.demo ? [{ type: "open", href: pl.demo, label: "Try the live demo" }] : [])] : [],
        followups: ["How does PayLineage stop a changed bank account?", "What were the PayLineage eval results?", "Tell me about the eCook pipeline"]
      };
    }
    if (/\b(where|location|based|live|city|relocat\w*|remote|on-?site|bay area|california|florida|tampa)\b/.test(l) && !/\blive (demo|app|site)\b/.test(l) && !/\bwhere\b.*\b(use[sd]?|using|appl(y|ied)|buil[dt]|work(ed|s)?|job|stud(y|ied)|school|degree|graduat\w*|intern\w*)\b/.test(l)) {
      return {
        ...base,
        text: `Robin is based in **${profile.location}**. ${profile.relocation}.`,
        sources: [{ label: "Contact", href: "/#contact" }],
        followups: ["How do I contact him?", "When does he graduate?", "What roles is he looking for?"]
      };
    }
    if (/\b(roles?|position|looking for|open to|seeking|kind of (job|work)|availability|available|graduat)\b/.test(l)) {
      return {
        ...base,
        text: `Robin works across three roles: **${profile.roles.join("**, **")}**. He completes his MS in Artificial Intelligence and Business Analytics at USF in **May 2027**. ${profile.relocation}.

Use the lens switch to re-order this site around the role you have in mind.`,
        sources: [
          { label: "Intro", href: "/#top" },
          { label: "Education", href: "/#about" }
        ],
        actions: lenses.map((x) => ({ type: "lens", lens: x.id, label: `View as ${x.short}` }))
      };
    }
    const named = caseStudies.find(
      (c) => l.includes(c.name.toLowerCase()) || c.slug.startsWith("modelroi") && /model ?roi/.test(l)
    );
    if (named && named.slug === "paylineage" && /\b(how|stop|prevent|block|catch|work|protect|bank|account|check)\w*/.test(l) && !/\b(limit|result|eval|score)\w*/.test(l)) {
      return {
        ...base,
        text: `**${named.name}** treats every invoice and email value as untrusted, so a changed bank account cannot become payment authority. Six independent checks run in order:\n\n${named.principles.map((x) => `- **${x.concern}.** ${x.approach}`).join("\n")}\n\nOne Rego policy compiled to policy.wasm makes every allow, hold or deny decision, and the executor re-runs it before the single-use permit is spent.`,
        sources: [{ label: named.name, href: `/work/${named.slug}` }],
        actions: [
          { type: "route", href: `/work/${named.slug}`, label: "Open the case study" },
          ...(named.demo ? [{ type: "open", href: named.demo, label: "Try the live demo" }] : [])
        ],
        followups: ["What were the PayLineage eval results?", "Is there a live demo?", "What are the limits of this project?"]
      };
    }
    if (named && named.evals && /\b(result|eval|benchmark|score|tested|measur|numbers)\w*/.test(l) && !/\b(which|best|top) (model|llm|retriever)\b/.test(l)) {
      return {
        ...base,
        text: `**${named.name}: evaluation.**\n\n${named.evals.map((e) => `- **${e.title}.** ${e.note} ${e.rows.map((r) => `${r[0]}: ${r.slice(1).join(" / ")}`).join("; ")}.`).join("\n")}`,
        sources: [{ label: named.name, href: `/work/${named.slug}` }],
        actions: [{ type: "route", href: `/work/${named.slug}`, label: "See the full tables" }],
        followups: ["What are the limits of this project?", "Is there a live demo?", "Show me his open-source projects"]
      };
    }
    if (named && /\b(tell me|what is|what's|explain|describe|overview|about|summar)\b/.test(l) && !/\b(limit|eval|rank|grade|hallucinat|built|stack|model scored)\w*/.test(l)) {
      return {
        ...base,
        text: `**${named.name}.** ${named.summary}

${named.problem}

${named.features.slice(0, 3).map((f) => `- **${f.title}.** ${f.text}`).join("\n")}`,
        sources: [{ label: named.name, href: `/work/${named.slug}` }],
        actions: [
          { type: "route", href: `/work/${named.slug}`, label: "Open the case study" },
          ...named.repo ? [{ type: "open", href: named.repo, label: "View on GitHub" }] : []
        ],
        followups: named.slug === "paylineage" ? ["How does PayLineage stop a changed bank account?", "What were the PayLineage eval results?", "Is there a live demo?"] : named.slug === "hospital-ops-copilot" ? ["Which model scored best in the evals?", "How is the copilot kept from hallucinating?", "What are the limits of this project?"] : ["How does ModelROI rank models?", "How are answers graded?", "What are the limits of this project?"]
      };
    }
    if (/\b(evals?|evaluat\w*|benchmark\w*|scored?|accura\w*)\b/.test(l) && /\b(which|best|top|winning|what) (model|llm|retriever|embedding)s?\b|\bmodels? (scored?|won|performed|did best)\b/.test(l)) {
      const hoc = caseStudies.find((c) => c.slug === "hospital-ops-copilot") || caseStudies.find((c) => c.evals);
      const lines = ((_a = hoc.evals) != null ? _a : []).map((e) => {
        var _a2;
        const best2 = e.rows[(_a2 = e.highlight) != null ? _a2 : 0];
        const detail = e.columns.slice(1).map((col, i) => `${col.toLowerCase()} ${best2[i + 1]}`).join(", ");
        return `- **${e.title}: ${best2[0]}.** ${detail}. ${e.note}`;
      });
      return {
        ...base,
        text: `In **${hoc.name}**, the configurations that came out on top were:

${lines.join("\n")}

ModelROI AI, his model comparison studio, deliberately claims no winner yet: its benchmark cases are still drafts.`,
        sources: [
          { label: hoc.name, href: `/work/${hoc.slug}` },
          { label: "ModelROI AI", href: "/work/modelroi-ai" }
        ],
        actions: [{ type: "route", href: `/work/${hoc.slug}`, label: "See the full eval tables" }],
        followups: ["How is the copilot kept from hallucinating?", "How does ModelROI rank models?", "What are the limits of this project?"]
      };
    }
    const companies = [
      { re: /\b(arena|ptc)\b/, id: "arena" },
      { re: /\b(riseup|rise up)\b/, id: "riseup" },
      { re: /\b(adplay|ad play|vu mobile)\b/, id: "adplay" },
      { re: /\b(usf|south florida|tampa general|tgh|teaching assistant|hospital research|research(ing)?)\b/, id: "usf" }
    ];
    const generic = new Set(
      "arena ptc inc riseup rise lab adplay ad play vu mobile usf south florida university tampa general tgh work role job experience intern internship time research hospital teach assistant graduate summer product manager management senior executive built build accomplish achieve company there".split(
        " "
      )
    );
    const hasTopic = tokenize(q).some((t) => !generic.has(t));
    const company = hasTopic ? void 0 : companies.find((c) => c.re.test(l));
    if (company && !/\b(degree|gpa|stud(y|ied|ying)|graduat|masters?|bachelors?|copilot)\b/.test(l) && !findSkill(q)) {
      const role = experience.find((r) => r.id === company.id);
      const top = bulletsFor(role, lens).slice(0, 4);
      return {
        ...base,
        text: `**${role.role}, ${role.company}** (${role.period}). ${role.blurb}

${top.map((b) => `- **${b.title}.** ${b.text}`).join("\n")}`,
        sources: [{ label: role.company, href: `/#role-${role.id}` }],
        actions: [{ type: "scroll", target: `#role-${role.id}`, label: "See the full role" }],
        followups: ["What are his strongest results?", "What has Robin built with RAG?", "How do I contact him?"]
      };
    }
    if (/\b(education|degree|study|studied|studying|school|university|college|gpa|masters?|bachelors?|iub|academic)\b/.test(l)) {
      return {
        ...base,
        text: education.map((e) => `- **${e.degree}**, ${e.school}, ${e.place}. ${e.period}. GPA ${e.gpa}.`).join("\n"),
        sources: [{ label: "Education", href: "/#about" }],
        followups: ["What is he researching at USF?", "What awards has he won?", "What is Clearline?"]
      };
    }
    if (/\b(awards?|honou?rs?|recognition|prizes?|won|accolades?)\b/.test(l)) {
      return {
        ...base,
        text: awards.map((a) => `- **${a.title}**, ${a.org} (${a.year})`).join("\n"),
        sources: [{ label: "Recognition", href: "/#about" }]
      };
    }
    if (/\b(now|currently|current|these days|at the moment|latest|recent)\b/.test(l)) {
      const usf = experience[0];
      return {
        ...base,
        text: `${profile.currently}

${usf.bullets.slice(0, 4).map((b) => `- **${b.title}.** ${b.text}`).join("\n")}`,
        sources: [{ label: usf.company, href: `/#role-${usf.id}` }],
        followups: ["Tell me about Hospital Ops Copilot", "What did he do at Arena by PTC?", "What has Robin built with RAG?"]
      };
    }
    if (/\b(open.?source|github|repos?|side projects?|personal projects?|built himself)\b/.test(l)) {
      return {
        ...base,
        text: caseStudies.map((c) => `- **${c.name}.** ${c.summary}`).join("\n"),
        sources: caseStudies.map((c) => ({ label: c.name, href: `/work/${c.slug}` })),
        actions: caseStudies.map((c) => ({ type: "route", href: `/work/${c.slug}`, label: `Open ${c.name}` }))
      };
    }
    if (/\b(all|list|what are)\b.*\b(skills?|technolog|tools|stack)\b|^(skills?|stack|tech stack|toolkit)\??$/.test(l)) {
      return {
        ...base,
        text: technologies.map((g) => `- **${g.label}:** ${g.items.join(", ")}`).join("\n"),
        sources: [{ label: "Toolkit", href: "/#skills" }],
        actions: [{ type: "scroll", target: "#skills", label: "Open the toolkit" }]
      };
    }
    const skill = findSkill(q);
    if (skill && /\b(use[sd]?|using|know|knows|experience|familiar|worked|work with|where|built with|build with|good at|proficien|skilled|has he|does he|can he)\b/.test(l)) {
      const re = new RegExp(`(^|[^a-z0-9])${esc(skill.toLowerCase())}([^a-z0-9]|$)`, "i");
      const hits = kb().docs.filter(
        (d) => {
          var _a2;
          return (d.kind === "experience" || d.kind === "project" || d.kind === "case") && re.test(`${d.title} ${d.text} ${(_a2 = d.tags) != null ? _a2 : ""}`);
        }
      );
      const group = [...technologies, ...capabilities].find((g) => g.items.some((i) => i.toLowerCase() === skill.toLowerCase()));
      if (hits.length) {
        const top = hits.filter((h) => re.test(`${h.title} ${h.text}`)).slice(0, 4);
        const compact = (h) => {
          const item = h.href.startsWith("case:") ? shipped.find((x) => x.id === h.href.slice(5)) : void 0;
          return item ? `${item.text} ${item.impact.join(" ")}` : h.text;
        };
        const list = (top.length ? top : hits.slice(0, 3)).map((h) => `- **${h.title}.** ${compact(h)}`);
        return {
          ...base,
          text: `${/^(has|does|did|is|can|do)\b/.test(l) ? "Yes. " : ""}Here is where **${skill}** shows up in Robin's work:

${list.join("\n")}`,
          sources: uniqueSources(top.length ? top : hits),
          followups: ["What are his strongest results?", "Show me his open-source projects", "How do I contact him?"]
        };
      }
      if (group) {
        return {
          ...base,
          text: `**${skill}** is listed in Robin's toolkit under ${group.label}, but this site does not describe a specific project that used it. Worth asking him directly.`,
          sources: [{ label: "Toolkit", href: "/#skills" }],
          actions: [{ type: "copy-email", label: "Copy his email" }]
        };
      }
    }
    const results = kb().index.search(q, 4);
    const best = (_c = (_b = results[0]) == null ? void 0 : _b.score) != null ? _c : 0;
    const strong = results.filter((r) => r.score >= Math.max(2.2, best * 0.55)).slice(0, 3);
    if (!strong.length) {
      return {
        ...base,
        text: "I could not find that in Robin's portfolio, and I only answer from what is published here, so I would rather not guess. You can rephrase, try one of the suggestions below, or ask him directly.",
        actions: [{ type: "copy-email", label: "Copy his email" }],
        grounded: false
      };
    }
    const lead = strong[0].doc;
    const rest = strong.slice(1).map((r) => r.doc);
    const body = (d) => {
      if (!d.href.startsWith("case:")) return d.text;
      const item = shipped.find((x) => x.id === d.href.slice(5));
      return item ? `${item.text} ${item.impact.join(" ")}` : d.text;
    };
    const leadItem = lead.href.startsWith("case:") ? shipped.find((x) => x.id === lead.href.slice(5)) : void 0;
    const text = (leadItem ? `**${lead.title}.** ${leadItem.text}

${leadItem.did.map((x) => `- ${x}`).join("\n")}

**Impact.** ${leadItem.impact.join(" ")}` : `**${lead.title}.** ${lead.text}`) + (rest.length ? `

Related:

${rest.map((d) => `- **${d.title}.** ${body(d)}`).join("\n")}` : "");
    const actions = [];
    const first = strong[0].doc;
    if (first.href.startsWith("case:")) actions.push({ type: "case", id: first.href.slice(5), label: "Open the case study" });
    else if (first.href.startsWith("/work/")) actions.push({ type: "route", href: first.href, label: "Open the case study" });
    else if (first.href.startsWith("/#")) actions.push({ type: "scroll", target: first.href.slice(1), label: `Go to ${first.source}` });
    return { ...base, text, sources: uniqueSources(strong.map((s) => s.doc)), actions };
  }
  function suggestionsFor(section, pathname) {
    if (pathname.startsWith("/work/hospital"))
      return ["How is the copilot kept from hallucinating?", "Which model scored best in the evals?", "What are the limits of this project?"];
    if (pathname.startsWith("/work/paylineage"))
      return ["How does PayLineage stop a changed bank account?", "What were the PayLineage eval results?", "Is there a live demo?"];
    if (pathname.startsWith("/work/modelroi"))
      return ["How does ModelROI rank models?", "How are answers graded?", "What are the limits of this project?"];
    switch (section) {
      case "impact":
        return ["What are his strongest results?", "How did detection accuracy reach 98%?", "Tell me about Teachers Portal"];
      case "work":
        return ["Tell me about Hospital Ops Copilot", "What is Clearline?", "What has Robin built with RAG?"];
      case "shipped":
        return ["What did he build for UNICEF?", "Tell me about the eCook pipeline", "Has he used A/B testing?"];
      case "experience":
        return ["What did he do at Arena by PTC?", "Tell me about the hospital research", "View this as an engineer"];
      case "skills":
        return ["Has he used LangGraph?", "Where has Robin used AWS Bedrock?", "Does he know Power BI?"];
      case "about":
        return ["Where did he study?", "What awards has he won?", "What is he working on now?"];
      case "contact":
        return ["How do I contact him?", "Where is he based?", "Why should we hire Robin?"];
      default:
        return ["Give me the 30-second version", "Why should we hire Robin?", "What has Robin built with RAG?"];
    }
  }

  // ../../../tmp/claude-0/-home-user-portfolio/41d18d37-cf4c-56b0-a07b-cc43f39ead2e/scratchpad/port/engine-entry.ts
  window.AssistantEngine = { answer, suggestionsFor };
})();
