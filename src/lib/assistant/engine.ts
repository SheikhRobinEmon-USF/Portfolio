import { bulletsFor, experience } from "@/content/experience";
import { awards, education, lenses, metrics, profile, type Lens } from "@/content/profile";
import { caseStudies, shipped } from "@/content/projects";
import { capabilities, technologies } from "@/content/skills";
import { buildKnowledge, skillTerms, type Doc } from "./knowledge";

export type Action =
  | { type: "scroll"; target: string; label: string }
  | { type: "route"; href: string; label: string }
  | { type: "case"; id: string; label: string }
  | { type: "theme"; label: string }
  | { type: "lens"; lens: Lens; label: string }
  | { type: "copy-email"; label: string }
  | { type: "open"; href: string; label: string };

export type Source = { label: string; href: string };

export type Answer = {
  /** Markdown-lite: paragraphs, "- " bullets and **bold**. */
  text: string;
  sources: Source[];
  /** Offered as buttons under the answer. */
  actions: Action[];
  /** Performed immediately, and shown as a tool call. */
  run?: Action;
  followups: string[];
  grounded: boolean;
};

/* ---------------------------------------------------------------- */
/* Text processing                                                    */
/* ---------------------------------------------------------------- */

const STOP = new Set(
  "a an and are as at be been but by can could did do does for from had has have he her him his how i if in into is it its me my of on or our robin robins emon sheikh she so tell than that the their them then there these they this to us was we were what when where which who whom why will with would you your about any some more most much many please show give know like".split(
    " ",
  ),
);

const SYNONYMS: Record<string, string[]> = {
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
  fintech: ["payment", "transaction", "payg", "fintech"],
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
  grounding: ["grounding", "grounded"],
};

function stem(w: string) {
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

export function tokenize(text: string, expand = false): string[] {
  const raw = text
    .toLowerCase()
    .replace(/e-commerce/g, "ecommerce")
    .replace(/[^a-z0-9+#./ ]+/g, " ")
    .split(/[\s/]+/)
    .map((w) => w.replace(/^[.]+|[.]+$/g, ""))
    .filter((w) => w.length > 1 || /\d/.test(w));
  const out: string[] = [];
  for (const w of raw) {
    if (STOP.has(w)) continue;
    if (expand && SYNONYMS[w]) out.push(...SYNONYMS[w].map(stem));
    out.push(stem(w));
  }
  return out;
}

/* ---------------------------------------------------------------- */
/* BM25 index                                                         */
/* ---------------------------------------------------------------- */

type Indexed = { doc: Doc; tf: Map<string, number>; len: number };

class Index {
  private docs: Indexed[] = [];
  private df = new Map<string, number>();
  private avg = 1;

  constructor(docs: Doc[]) {
    for (const doc of docs) {
      // Titles count three times, tags once.
      const tokens = [
        ...tokenize(doc.title),
        ...tokenize(doc.title),
        ...tokenize(doc.title),
        ...tokenize(doc.text),
        ...tokenize(doc.tags ?? ""),
      ];
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
      this.docs.push({ doc, tf, len: tokens.length });
    }
    this.avg = this.docs.reduce((s, d) => s + d.len, 0) / Math.max(1, this.docs.length);
  }

  search(query: string, limit = 4): { doc: Doc; score: number }[] {
    const terms = [...new Set(tokenize(query, true))];
    if (!terms.length) return [];
    const N = this.docs.length;
    const k1 = 1.4;
    const b = 0.7;
    const scored = this.docs.map((d) => {
      let score = 0;
      for (const t of terms) {
        const f = d.tf.get(t);
        if (!f) continue;
        const n = this.df.get(t) ?? 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        score += (idf * f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / this.avg));
      }
      return { doc: d.doc, score };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b2) => b2.score - a.score)
      .slice(0, limit);
  }
}

let cache: { index: Index; docs: Doc[]; skills: string[] } | null = null;
function kb() {
  if (!cache) {
    const docs = buildKnowledge();
    cache = { index: new Index(docs), docs, skills: skillTerms() };
  }
  return cache;
}

/* ---------------------------------------------------------------- */
/* Helpers                                                            */
/* ---------------------------------------------------------------- */

const uniqueSources = (docs: Doc[]): Source[] => {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const d of docs) {
    const key = d.href + d.source;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label: d.source, href: d.href });
  }
  return out.slice(0, 4);
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function findSkill(q: string): string | null {
  const lower = ` ${q.toLowerCase()} `;
  for (const s of kb().skills) {
    const re = new RegExp(`(^|[^a-z0-9])${esc(s.toLowerCase())}([^a-z0-9]|$)`);
    if (re.test(lower)) return s;
  }
  return null;
}

const sections: { re: RegExp; target: string; label: string }[] = [
  { re: /\b(experience|career|timeline|work history|jobs?)\b/, target: "#experience", label: "Experience" },
  { re: /\b(skills?|stack|toolkit|tech(nolog(y|ies))?|tools)\b/, target: "#skills", label: "Toolkit" },
  { re: /\b(about|story|bio|education|awards?|photo)\b/, target: "#about", label: "About" },
  { re: /\b(contact|email|hire|reach)\b/, target: "#contact", label: "Contact" },
  { re: /\b(impact|numbers|metrics|results)\b/, target: "#impact", label: "Impact" },
  { re: /\b(shipped|products|archive|gallery|case studies)\b/, target: "#shipped", label: "Case study gallery" },
  { re: /\b(work|projects?|portfolio|case stud(y|ies))\b/, target: "#work", label: "Selected work" },
  { re: /\b(top|home|start|beginning)\b/, target: "#top", label: "the top" },
];

const defaultFollowups = [
  "What has Robin built with RAG?",
  "Tell me about the hospital research",
  "What are his strongest results?",
];

/* ---------------------------------------------------------------- */
/* Router                                                             */
/* ---------------------------------------------------------------- */

export function answer(question: string, lens: Lens = "pm"): Answer {
  const q = question.trim();
  const l = q.toLowerCase();
  const base = { sources: [] as Source[], actions: [] as Action[], followups: defaultFollowups, grounded: true };

  if (!q) {
    return { ...base, text: "Ask me anything about Robin's work, skills or background.", grounded: false };
  }

  /* --- Actions the assistant can take on the page ------------------ */

  if (/\b(dark|light)\s?(mode|theme)\b|\b(switch|toggle|change)\b.*\btheme\b/.test(l)) {
    return {
      ...base,
      text: "Done. I switched the theme.",
      run: { type: "theme", label: "Switched theme" },
      grounded: false,
    };
  }

  const lensMatch =
    /\b(view|read|see|show|switch|tailor)\b.*\b(as|for|to)\b.*\b(engineer|fde|forward deployed|pm|product manager|product|analyst|ba|business analyst|analytics)\b/.exec(
      l,
    );
  if (lensMatch) {
    const w = lensMatch[3];
    const next: Lens = /engineer|fde|forward/.test(w) ? "fde" : /analyst|ba|analytics/.test(w) ? "ba" : "pm";
    const label = lenses.find((x) => x.id === next)!.label;
    return {
      ...base,
      text: `I re-ordered the site for a **${label}** reader. Summaries, experience bullets, skills and products now lead with what matters most for that role.`,
      run: { type: "lens", lens: next, label: `Lens set to ${label}` },
      actions: [{ type: "scroll", target: "#experience", label: "See experience" }],
      grounded: false,
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
        sources: [{ label: cs.name, href: `/work/${cs.slug}` }],
      };
    }
    const sp = shipped.find((s) => l.includes(s.name.toLowerCase().split(" ")[0]));
    if (sp) {
      return {
        ...base,
        text: `Here is **${sp.name}**: ${sp.metric.value} ${sp.metric.label}. ${sp.text}`,
        run: { type: "case", id: sp.id, label: `Opened ${sp.name}` },
        sources: [{ label: sp.name, href: `case:${sp.id}` }],
      };
    }
    const sec = sections.find((s) => s.re.test(l));
    if (sec && !/\bshow me (how|what|why|where|who|his|her|the best|some)\b/.test(l)) {
      return {
        ...base,
        text: `Taking you to **${sec.label}**.`,
        run: { type: "scroll", target: sec.target, label: `Scrolled to ${sec.label}` },
        grounded: false,
      };
    }
  }

  /* --- Things this site cannot know -------------------------------- */

  if (/\b(salary|compensation|pay|visa|sponsor(ship)?|h-?1b|opt|cpt|citizen(ship)?|age|old|married|religion|notice period|start date|available to start)\b/.test(l)) {
    return {
      ...base,
      text: "That is not something this portfolio states, and I only answer from what is published here. The quickest way to find out is to ask Robin directly.",
      actions: [
        { type: "copy-email", label: "Copy his email" },
        { type: "open", href: profile.links.linkedin, label: "Open LinkedIn" },
      ],
      grounded: false,
    };
  }

  /* --- Hand-written answers for the questions everyone asks -------- */

  if (/^(hi|hello|hey|yo|howdy|hola|good (morning|afternoon|evening))\b/.test(l) && q.length < 30) {
    return {
      ...base,
      text: "Hello. I am a small retrieval assistant that runs entirely in your browser. I answer questions about Robin from the content of this site, cite where each answer comes from, and can navigate the page for you. Try one of these:",
      grounded: false,
    };
  }

  if (/\b(what can you do|how do you work|are you (an? )?(ai|llm|gpt|bot|real)|(which|what) (model|llm) (are you|do you|powers|is this|runs)|who (made|built) you|how (were|are) you built)\b/.test(l)) {
    return {
      ...base,
      text: "I am not a hosted LLM. I am a retrieval engine that runs locally in your browser: BM25 search over an index built from this site's own content, plus a small intent router. That means no API calls, nothing you type leaves the page, and I cannot invent facts, because every sentence I return is drawn from what is published here. It is the same idea behind Robin's Hospital Ops Copilot, where the model never does the arithmetic.\n\nI can answer questions, cite sources, jump to sections, open case studies, switch the theme, and re-order the site for the role you are hiring for.",
      sources: [{ label: "Hospital Ops Copilot", href: "/work/hospital-ops-copilot" }],
      grounded: false,
    };
  }

  if (/\b(30.second|elevator|summary|summari[sz]e|overview|tl;?dr|who is|about (him|robin)|introduce|in short|quick version)\b/.test(l)) {
    const top = [...metrics]
      .sort((a, b) => (a.lens.indexOf(lens) === -1 ? 9 : a.lens.indexOf(lens)) - (b.lens.indexOf(lens) === -1 ? 9 : b.lens.indexOf(lens)))
      .slice(0, 3);
    return {
      ...base,
      text: `${profile.summary[lens]}\n\n${top
        .map((m) => `- **${m.prefix ?? ""}${m.value.toLocaleString("en-US")}${m.suffix}** ${m.label}. ${m.context}`)
        .join("\n")}\n\n${profile.currently}`,
      sources: [
        { label: "Intro", href: "/#top" },
        { label: "Impact", href: "/#impact" },
      ],
      followups: ["Why should we hire Robin?", "What is he working on now?", "Show me his open-source projects"],
    };
  }

  if (/\b(why (should|would) (we|i|you)|why hire|why robin|what makes (him|robin)|stand out|different|strength|strongest|best (results|work)|biggest (wins?|achievements?)|proud)\b/.test(l)) {
    const byLens: Record<Lens, string[]> = {
      pm: [
        "**He has shipped at scale.** Teachers Portal reached 1.3M+ monthly active users with a 25% retention lift, and UNICEF's Meena Game passed 10M+ downloads.",
        "**He builds what he specifies.** At Arena by PTC he built Claude API, LangGraph and MCP agent workflows that cut delivery turnaround by 30%, and designed the LLM evals that informed the roadmap.",
        "**He ties product to revenue.** eCook's pay-as-you-go pipeline contributed to 48% annual revenue growth; a GTM framework at Arena lifted initial feature adoption by 20%.",
      ],
      fde: [
        "**He deploys AI in the field.** French to Mooré text-to-speech with offline-ready features reached 700,000 U-Reporters in Burkina Faso.",
        "**He measures before he ships.** Hospital Ops Copilot was evaluated across models for tool selection, accuracy, grounding and latency; his hospital RAG prototype reached 90% answer accuracy in LLM evals.",
        "**He moves real numbers with models.** CNN ad verification went from 48% to 98% detection accuracy, and predictive bidding cut ad costs by 34%.",
      ],
      ba: [
        "**He works large, messy operational data.** 500K+ hospital records across 8 departments with Tampa General Hospital, delivered as 6 Power BI dashboards to 15+ stakeholders.",
        "**His analysis changes outcomes.** Forecast accuracy up 20% over baseline, ad costs down 34%, onboarding drop-off down 18%.",
        "**He connects insight to revenue.** A real-time usage pipeline contributed to 48% annual revenue growth at eCook, and a GTM and UX program grew an e-commerce site's revenue by 43%.",
      ],
    };
    return {
      ...base,
      text: `${
        /\b(result|win|achievement|proud|best work)/.test(l) ? "His strongest results" : "Three reasons"
      }, with the evidence behind each:\n\n${byLens[lens].map((b) => `- ${b}`).join("\n")}`,
      sources: [
        { label: "Impact", href: "/#impact" },
        { label: "Experience", href: "/#experience" },
        { label: "Selected work", href: "/#work" },
      ],
      actions: [{ type: "copy-email", label: "Copy his email" }],
      followups: ["What is he working on now?", "Tell me about Hospital Ops Copilot", "Where is he based?"],
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
        { type: "open", href: profile.links.github, label: "GitHub" },
      ],
      followups: ["Where is he based?", "Why should we hire Robin?", "What roles is he looking for?"],
    };
  }

  if (/\b(resume|résumé|cv|curriculum)\b/.test(l)) {
    return {
      ...base,
      text: `This site is the living version of Robin's CV, and it carries everything a PDF would. For a formatted copy tailored to your role, email him at **${profile.email}**.`,
      sources: [{ label: "Experience", href: "/#experience" }],
      actions: [
        { type: "copy-email", label: "Copy email" },
        { type: "scroll", target: "#experience", label: "See experience" },
      ],
    };
  }

  if (/\b(where|location|based|live|city|relocat|remote|on-?site|bay area|california|florida|tampa)\b/.test(l) && !/\bwhere (has|did|does|is .* used|was)\b/.test(l)) {
    return {
      ...base,
      text: `Robin is based in **${profile.location}**. ${profile.relocation}.`,
      sources: [{ label: "Contact", href: "/#contact" }],
      followups: ["How do I contact him?", "When does he graduate?", "What roles is he looking for?"],
    };
  }

  if (/\b(roles?|position|looking for|open to|seeking|kind of (job|work)|availability|available|graduat)\b/.test(l)) {
    return {
      ...base,
      text: `Robin works across three roles: **${profile.roles.join("**, **")}**. He completes his MS in Artificial Intelligence and Business Analytics at USF in **May 2027**. ${profile.relocation}.\n\nUse the lens switch to re-order this site around the role you have in mind.`,
      sources: [
        { label: "Intro", href: "/#top" },
        { label: "Education", href: "/#about" },
      ],
      actions: lenses.map((x) => ({ type: "lens" as const, lens: x.id, label: `View as ${x.short}` })),
    };
  }

  /* --- "Tell me about <case study>" --------------------------------- */

  const named = caseStudies.find(
    (c) => l.includes(c.name.toLowerCase()) || (c.slug.startsWith("modelroi") && /model ?roi/.test(l)),
  );
  if (named && /\b(tell me|what is|what's|explain|describe|overview|about|summar)\b/.test(l) && !/\b(limit|eval|rank|grade|hallucinat|built|stack|model scored)\w*/.test(l)) {
    return {
      ...base,
      text: `**${named.name}.** ${named.summary}\n\n${named.problem}\n\n${named.features
        .slice(0, 3)
        .map((f) => `- **${f.title}.** ${f.text}`)
        .join("\n")}`,
      sources: [{ label: named.name, href: `/work/${named.slug}` }],
      actions: [
        { type: "route", href: `/work/${named.slug}`, label: "Open the case study" },
        ...(named.repo ? [{ type: "open" as const, href: named.repo, label: "View on GitHub" }] : []),
      ],
      followups: named.evals
        ? ["Which model scored best in the evals?", "How is the copilot kept from hallucinating?", "What are the limits of this project?"]
        : ["How does ModelROI rank models?", "How are answers graded?", "What are the limits of this project?"],
    };
  }

  /* --- Eval results ------------------------------------------------- */

  if (/\b(evals?|evaluat\w*|benchmark\w*|scored?|accura\w*)\b/.test(l) && /\b(which|best|top|winning|what) (model|llm|retriever|embedding)s?\b|\bmodels? (scored?|won|performed|did best)\b/.test(l)) {
    const hoc = caseStudies.find((c) => c.evals)!;
    const lines = (hoc.evals ?? []).map((e) => {
      const best = e.rows[e.highlight ?? 0];
      const detail = e.columns
        .slice(1)
        .map((col, i) => `${col.toLowerCase()} ${best[i + 1]}`)
        .join(", ");
      return `- **${e.title}: ${best[0]}.** ${detail}. ${e.note}`;
    });
    return {
      ...base,
      text: `In **${hoc.name}**, the configurations that came out on top were:\n\n${lines.join("\n")}\n\nModelROI AI, his model comparison studio, deliberately claims no winner yet: its benchmark cases are still drafts.`,
      sources: [
        { label: hoc.name, href: `/work/${hoc.slug}` },
        { label: "ModelROI AI", href: "/work/modelroi-ai" },
      ],
      actions: [{ type: "route", href: `/work/${hoc.slug}`, label: "See the full eval tables" }],
      followups: ["How is the copilot kept from hallucinating?", "How does ModelROI rank models?", "What are the limits of this project?"],
    };
  }

  /* --- "What did he do at <company>?" ------------------------------- */

  const companies: { re: RegExp; id: string }[] = [
    { re: /\b(arena|ptc)\b/, id: "arena" },
    { re: /\b(riseup|rise up)\b/, id: "riseup" },
    { re: /\b(adplay|ad play|vu mobile)\b/, id: "adplay" },
    { re: /\b(usf|south florida|tampa general|tgh|teaching assistant|hospital research|research(ing)?)\b/, id: "usf" },
  ];
  // Only a general "what did he do there?" gets the role summary. A question with
  // its own topic ("KPI reporting at Arena") goes to retrieval for the specific work.
  const generic = new Set(
    "arena ptc inc riseup rise lab adplay ad play vu mobile usf south florida university tampa general tgh work role job experience intern internship time research hospital teach assistant graduate summer product manager management senior executive built build accomplish achieve company there".split(
      " ",
    ),
  );
  const hasTopic = tokenize(q).some((t) => !generic.has(t));
  const company = hasTopic ? undefined : companies.find((c) => c.re.test(l));
  if (company && !/\b(degree|gpa|stud(y|ied|ying)|graduat|masters?|bachelors?|copilot)\b/.test(l) && !findSkill(q)) {
    const role = experience.find((r) => r.id === company.id)!;
    const top = bulletsFor(role, lens).slice(0, 4);
    return {
      ...base,
      text: `**${role.role}, ${role.company}** (${role.period}). ${role.blurb}\n\n${top
        .map((b) => `- **${b.title}.** ${b.text}`)
        .join("\n")}`,
      sources: [{ label: role.company, href: `/#role-${role.id}` }],
      actions: [{ type: "scroll", target: `#role-${role.id}`, label: "See the full role" }],
      followups: ["What are his strongest results?", "What has Robin built with RAG?", "How do I contact him?"],
    };
  }

  if (/\b(education|degree|study|studied|studying|school|university|college|gpa|masters?|bachelors?|iub|academic)\b/.test(l)) {
    return {
      ...base,
      text: education
        .map((e) => `- **${e.degree}**, ${e.school}, ${e.place}. ${e.period}. GPA ${e.gpa}.`)
        .join("\n"),
      sources: [{ label: "Education", href: "/#about" }],
      followups: ["What is he researching at USF?", "What awards has he won?", "What is Clearline?"],
    };
  }

  if (/\b(awards?|honou?rs?|recognition|prizes?|won|accolades?)\b/.test(l)) {
    return {
      ...base,
      text: awards.map((a) => `- **${a.title}**, ${a.org} (${a.year})`).join("\n"),
      sources: [{ label: "Recognition", href: "/#about" }],
    };
  }

  if (/\b(now|currently|current|these days|at the moment|latest|recent)\b/.test(l)) {
    const usf = experience[0];
    return {
      ...base,
      text: `${profile.currently}\n\n${usf.bullets
        .slice(0, 4)
        .map((b) => `- **${b.title}.** ${b.text}`)
        .join("\n")}`,
      sources: [{ label: usf.company, href: `/#role-${usf.id}` }],
      followups: ["Tell me about Hospital Ops Copilot", "What did he do at Arena by PTC?", "What has Robin built with RAG?"],
    };
  }

  if (/\b(open.?source|github|repos?|side projects?|personal projects?|built himself)\b/.test(l)) {
    return {
      ...base,
      text: caseStudies.map((c) => `- **${c.name}.** ${c.summary}`).join("\n"),
      sources: caseStudies.map((c) => ({ label: c.name, href: `/work/${c.slug}` })),
      actions: caseStudies.map((c) => ({ type: "route" as const, href: `/work/${c.slug}`, label: `Open ${c.name}` })),
    };
  }

  if (/\b(all|list|what are)\b.*\b(skills?|technolog|tools|stack)\b|^(skills?|stack|tech stack|toolkit)\??$/.test(l)) {
    return {
      ...base,
      text: technologies.map((g) => `- **${g.label}:** ${g.items.join(", ")}`).join("\n"),
      sources: [{ label: "Toolkit", href: "/#skills" }],
      actions: [{ type: "scroll", target: "#skills", label: "Open the toolkit" }],
    };
  }

  /* --- "Has he used X?" -------------------------------------------- */

  const skill = findSkill(q);
  if (skill && /\b(use[sd]?|using|know|knows|experience|familiar|worked|work with|where|built with|build with|good at|proficien|skilled|has he|does he|can he)\b/.test(l)) {
    const re = new RegExp(`(^|[^a-z0-9])${esc(skill.toLowerCase())}([^a-z0-9]|$)`, "i");
    const hits = kb().docs.filter(
      (d) => (d.kind === "experience" || d.kind === "project" || d.kind === "case") && re.test(`${d.title} ${d.text} ${d.tags ?? ""}`),
    );
    const group = [...technologies, ...capabilities].find((g) => g.items.some((i) => i.toLowerCase() === skill.toLowerCase()));
    if (hits.length) {
      const top = hits.filter((h) => re.test(`${h.title} ${h.text}`)).slice(0, 4);
      const compact = (h: Doc) => {
        const item = h.href.startsWith("case:") ? shipped.find((x) => x.id === h.href.slice(5)) : undefined;
        return item ? `${item.text} ${item.impact.join(" ")}` : h.text;
      };
      const list = (top.length ? top : hits.slice(0, 3)).map((h) => `- **${h.title}.** ${compact(h)}`);
      return {
        ...base,
        text: `${/^(has|does|did|is|can|do)\b/.test(l) ? "Yes. " : ""}Here is where **${skill}** shows up in Robin's work:\n\n${list.join("\n")}`,
        sources: uniqueSources(top.length ? top : hits),
        followups: ["What are his strongest results?", "Show me his open-source projects", "How do I contact him?"],
      };
    }
    if (group) {
      return {
        ...base,
        text: `**${skill}** is listed in Robin's toolkit under ${group.label}, but this site does not describe a specific project that used it. Worth asking him directly.`,
        sources: [{ label: "Toolkit", href: "/#skills" }],
        actions: [{ type: "copy-email", label: "Copy his email" }],
      };
    }
  }

  /* --- Retrieval ---------------------------------------------------- */

  const results = kb().index.search(q, 4);
  const best = results[0]?.score ?? 0;
  const strong = results.filter((r) => r.score >= Math.max(2.2, best * 0.55)).slice(0, 3);

  if (!strong.length) {
    return {
      ...base,
      text: "I could not find that in Robin's portfolio, and I only answer from what is published here, so I would rather not guess. You can rephrase, try one of the suggestions below, or ask him directly.",
      actions: [{ type: "copy-email", label: "Copy his email" }],
      grounded: false,
    };
  }

  const lead = strong[0].doc;
  const rest = strong.slice(1).map((r) => r.doc);
  const body = (d: Doc) => {
    if (!d.href.startsWith("case:")) return d.text;
    const item = shipped.find((x) => x.id === d.href.slice(5));
    return item ? `${item.text} ${item.impact.join(" ")}` : d.text;
  };
  const leadItem = lead.href.startsWith("case:") ? shipped.find((x) => x.id === lead.href.slice(5)) : undefined;
  const text =
    (leadItem
      ? `**${lead.title}.** ${leadItem.text}\n\n${leadItem.did.map((x) => `- ${x}`).join("\n")}\n\n**Impact.** ${leadItem.impact.join(" ")}`
      : `**${lead.title}.** ${lead.text}`) +
    (rest.length ? `\n\nRelated:\n\n${rest.map((d) => `- **${d.title}.** ${body(d)}`).join("\n")}` : "");

  const actions: Action[] = [];
  const first = strong[0].doc;
  if (first.href.startsWith("case:")) actions.push({ type: "case", id: first.href.slice(5), label: "Open the case study" });
  else if (first.href.startsWith("/work/")) actions.push({ type: "route", href: first.href, label: "Open the case study" });
  else if (first.href.startsWith("/#")) actions.push({ type: "scroll", target: first.href.slice(1), label: `Go to ${first.source}` });

  return { ...base, text, sources: uniqueSources(strong.map((s) => s.doc)), actions };
}

/** Prompts that fit what the visitor is looking at right now. */
export function suggestionsFor(section: string | null, pathname: string): string[] {
  if (pathname.startsWith("/work/hospital"))
    return ["How is the copilot kept from hallucinating?", "Which model scored best in the evals?", "What are the limits of this project?"];
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
