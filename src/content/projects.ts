import type { StaticImageData } from "next/image";
import type { Lens } from "./profile";

import hocOverview from "@/assets/projects/hoc-overview.webp";
import hocBenchmark from "@/assets/projects/hoc-benchmark.webp";
import hocCopilot from "@/assets/projects/hoc-copilot.webp";
import hocScenario from "@/assets/projects/hoc-scenario.webp";
import hocLight from "@/assets/projects/hoc-light.webp";
import roiPromptLab from "@/assets/projects/roi-prompt-lab.webp";
import roiResults from "@/assets/projects/roi-results.webp";
import roiBenchmark from "@/assets/projects/roi-benchmark.webp";
import roiHistory from "@/assets/projects/roi-history.webp";
import roiLight from "@/assets/projects/roi-light.webp";
import roiAddModel from "@/assets/projects/roi-add-model.webp";

export type Shot = { src: StaticImageData; alt: string; caption: string };

export type CaseStudy = {
  slug: string;
  name: string;
  kind: string;
  year: string;
  tagline: string;
  summary: string;
  accent: "volt" | "iris" | "aqua";
  repo?: string;
  cover?: Shot;
  shots: Shot[];
  facts: { label: string; value: string }[];
  stack: string[];
  problem: string;
  features: { title: string; text: string }[];
  principles: { concern: string; approach: string }[];
  evals?: {
    title: string;
    note: string;
    columns: string[];
    rows: (string | number)[][];
    highlight?: number;
  }[];
  limits: string;
  screenshotNote?: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "hospital-ops-copilot",
    name: "Hospital Ops Copilot",
    kind: "Independent open-source project",
    year: "2026",
    tagline: "Hospital financial benchmarking with a copilot that never does the math itself.",
    summary:
      "An open-source benchmarking platform over public CMS cost reports for 6,264 US hospitals, with 19 KPIs, opportunity sizing and a local tool-calling LLM copilot evaluated across models for accuracy, grounding and latency.",
    accent: "aqua",
    repo: "https://github.com/SheikhRobinEmon-USF/Hospital-Ops-Copilot",
    cover: {
      src: hocOverview,
      alt: "Hospital Ops Copilot dashboard showing a hospital overview with KPI tiles and a docked AI copilot",
      caption: "Overview dashboard with the docked, streaming copilot",
    },
    shots: [
      {
        src: hocBenchmark,
        alt: "Peer benchmarking view with percentile ranks for each KPI",
        caption: "Peer benchmarking: percentile rank, peer median and the 25th to 75th percentile range",
      },
      {
        src: hocCopilot,
        alt: "Copilot answering a question with sources and a grounding check",
        caption: "Copilot answers carry sources and a numeric grounding check",
      },
      {
        src: hocScenario,
        alt: "What-if scenario view for volume, payment rate and cost changes",
        caption: "What-if scenarios for volume, payment rate, operating expense and labor cost",
      },
      {
        src: hocLight,
        alt: "Hospital Ops Copilot in light mode",
        caption: "Full light theme",
      },
    ],
    facts: [
      { label: "Hospitals", value: "6,264" },
      { label: "Hospital-years", value: "24,060" },
      { label: "KPIs", value: "19" },
      { label: "Cost report years", value: "2021 to 2024" },
    ],
    stack: [
      "Python",
      "FastAPI",
      "Ollama",
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind CSS v4",
      "Radix UI",
      "Motion",
      "TanStack Query",
      "Storybook",
      "Streamlit",
      "Docker",
    ],
    problem:
      "Hospital finance teams cannot act on numbers they cannot audit, and small local models misstate numbers. So the design keeps the model out of the arithmetic: deterministic Python computes every figure, and the LLM only chooses tools and explains results.",
    features: [
      {
        title: "Peer benchmarking",
        text: "19 KPIs across margins, cost and revenue per adjusted discharge, staffing, contract labor, occupancy, length of stay, payer mix, liquidity and revenue cycle, compared with a peer group you define.",
      },
      {
        title: "Opportunity sizing",
        text: "Dollar estimates for closing the gap to the peer median or top quartile. Every formula and assumption is shown, and overlapping gaps are not double-counted.",
      },
      {
        title: "What-if scenarios and trends",
        text: "Model volume, payment rate, operating expense and labor cost changes, and track every KPI against the peer median for each year on file.",
      },
      {
        title: "A grounded copilot",
        text: "Plain-English questions answered by a local LLM that calls the analytics engine through tools. Each answer lists its CMS sources and passes a check that traces every number back to tool output.",
      },
      {
        title: "Four interfaces",
        text: "A dark-mode-first web app with a command palette, proactive insights and voice input, plus a REST API with server-sent events, a CLI and a Streamlit analyst view.",
      },
      {
        title: "Runs offline",
        text: "Free open-weight models through Ollama, public data only, no API keys. If Ollama is down, an offline analyst answers with the same tools and templated wording.",
      },
    ],
    principles: [
      { concern: "Accuracy", approach: "Deterministic Python computes every figure; the LLM chooses tools and explains results." },
      { concern: "Hallucinated numbers", approach: "Post-answer numeric grounding check, with unverified figures flagged in the UI." },
      { concern: "Hallucinated sources", approach: "Citations are built from tool outputs, never from model text." },
      { concern: "Privacy and cost", approach: "Free open-weight models on Ollama; public data only; runs offline." },
      { concern: "Transparency", approach: "KPI formulas, CMS source fields, peer definitions and assumptions are visible everywhere." },
    ],
    evals: [
      {
        title: "Agent suite",
        note: "12 questions covering lookups, peer comparison, opportunities, trends, what-if scenarios, rankings and definitions. Expected answers are computed from the data at run time.",
        columns: ["Model", "Tool selection", "Answer accuracy", "Grounded answers", "p50 latency (CPU)"],
        rows: [
          ["qwen3.5:4b", "100%", "100%", "100%", "59 s"],
          ["qwen3.5:2b", "92%", "75%", "92%", "22 s"],
          ["granite4:3b", "92%", "75%", "58%", "49 s"],
          ["llama3.2:3b", "75%", "67%", "100%", "28 s"],
        ],
        highlight: 0,
      },
      {
        title: "Retrieval suite",
        note: "25 questions over the KPI glossary, methodology and CMS data dictionary.",
        columns: ["Retriever", "hit@1", "hit@3", "MRR", "Query latency"],
        rows: [
          ["BM25", "0.84", "0.96", "0.893", "0 ms"],
          ["Dense, nomic-embed-text", "0.88", "0.96", "0.913", "56 ms"],
          ["Dense, embeddinggemma", "0.88", "0.96", "0.930", "51 ms"],
          ["Hybrid, embeddinggemma", "0.92", "0.96", "0.948", "53 ms"],
          ["Dense, qwen3-embedding:0.6b", "0.92", "0.96", "0.950", "99 ms"],
        ],
        highlight: 3,
      },
    ],
    limits:
      "Cost reports are unaudited and filed per hospital, there is no case mix index so cost per case is not acuity-adjusted, and operating margin counts only patient revenue. Benchmarks show where to look, not what to cut. An independent project on public CMS data, not affiliated with CMS or any hospital.",
  },
  {
    slug: "modelroi-ai",
    name: "ModelROI AI",
    kind: "Independent open-source project",
    year: "2026",
    tagline: "Compare language models on quality, speed, reliability and cost per successful task.",
    summary:
      "An open-source evaluation studio that runs up to five models on identical prompts or benchmark cases, has an independent judge model grade every answer, and only ranks models that clear a minimum bar.",
    accent: "iris",
    repo: "https://github.com/SheikhRobinEmon-USF/Model-ROI-AI",
    cover: {
      src: roiPromptLab,
      alt: "ModelROI prompt lab comparing several model answers side by side",
      caption: "Prompt lab: one prompt, every selected model, graded side by side",
    },
    shots: [
      {
        src: roiResults,
        alt: "Benchmark results with ranking and confidence intervals",
        caption: "Benchmark results with case-level evidence and 95% Wilson intervals",
      },
      {
        src: roiBenchmark,
        alt: "Benchmark setup screen",
        caption: "Matched benchmarks on identical cases",
      },
      {
        src: roiHistory,
        alt: "History and trends across saved runs",
        caption: "History and trends, pooled with DuckDB",
      },
      {
        src: roiAddModel,
        alt: "Dialog for adding a custom model",
        caption: "Bring your own model: upload a GGUF, download by name, or customize an installed one",
      },
      {
        src: roiLight,
        alt: "ModelROI in light mode",
        caption: "Full light theme",
      },
    ],
    facts: [
      { label: "Models per run", value: "Up to 5" },
      { label: "Benchmark cases", value: "50 draft + 6 analytical" },
      { label: "Judge rubric", value: "5 criteria, scored out of 10" },
      { label: "Status", value: "Development preview" },
    ],
    stack: [
      "Python",
      "FastAPI",
      "Ollama",
      "Svelte 5",
      "TypeScript",
      "Tailwind CSS v4",
      "Vite",
      "SQLite",
      "DuckDB",
      "Streamlit",
      "Docker",
    ],
    problem:
      "A model comparison is only useful if you can see how each number was produced. ModelROI keeps measured facts, judged opinions and estimates apart, so a team can choose a model on evidence instead of a leaderboard.",
    features: [
      {
        title: "Prompt lab",
        text: "Ask once and every selected model answers the same prompt, with follow-ups that keep each model's own conversation context. Attach a PDF, Word, Excel, PowerPoint, CSV or text file to compare on an excerpt.",
      },
      {
        title: "Independent grading",
        text: "A separate judge model scores each answer on correctness, relevance, completeness, instruction following and faithfulness, with a one-sentence reason.",
      },
      {
        title: "Matched benchmarks",
        text: "Executable checks compare exact expected values and JSON structure, kept separate from the judge's qualitative grade.",
      },
      {
        title: "Threshold-first ranking",
        text: "A model must clear minimum task success, schema compliance and an optional p95 latency limit before it is ranked on success, speed, provider fees and reliability.",
      },
      {
        title: "Results you can audit",
        text: "Case-level evidence, 95% Wilson intervals, paired comparisons with Holm-adjusted p-values, token counts, timings and JSON export.",
      },
      {
        title: "Your own models",
        text: "Upload a GGUF file, download from the Ollama library or Hugging Face, or give an installed model its own instructions. It becomes a candidate beside the built-in models.",
      },
    ],
    principles: [
      { concern: "Fair comparison", approach: "Every model receives identical prompts and cases, run sequentially to limit memory pressure." },
      { concern: "Correctness", approach: "Deterministic checks for exact values and JSON types." },
      { concern: "Small samples", approach: "95% Wilson intervals on success rates; paired exact tests with Holm adjustment between models." },
      { concern: "Honest failures", approach: "Exceptions count as failed cases, truncated outputs fail grading, and no winner is claimed on draft cases." },
      { concern: "Reproducibility", approach: "Each run records model digest, dataset SHA-256, settings, token counts and UTC start time." },
    ],
    limits:
      "The studio is a development preview. Benchmark cases are draft synthetic examples with no holdout evaluated yet, latency is specific to the machine it runs on, and judge grades are assessments rather than measured hallucination rates. No comparative model winner is claimed.",
    screenshotNote:
      "Screenshots are generated from sample data. They show the interface, not measured model results.",
  },
];

export const clearline = {
  name: "Clearline",
  kind: "Coursework, four-person team",
  year: "2026",
  tagline: "An agentic assistant that classifies apparel into Harmonized Tariff Schedule codes.",
  summary:
    "Co-developed with Python, LangGraph, RAG and vector search. I own the codebase architecture, the retrieval pipelines and the evaluations.",
  stack: ["Python", "LangGraph", "RAG", "Vector search", "Evals"],
  steps: ["Product description", "Retrieve tariff text", "Reason over rules", "HTS code"],
};

export type Category = "AI and ML" | "Product" | "Analytics" | "Growth" | "Social impact";

export type Shipped = {
  id: string;
  name: string;
  /** Descriptive title from the case study. */
  headline: string;
  org: string;
  role: string;
  period: string;
  category: Category[];
  domain: string[];
  metric: { value: string; label: string };
  secondary?: { value: string; label: string }[];
  /** One or two sentences for the card. */
  text: string;
  did: string[];
  impact: string[];
  tools: string[];
  lens: Lens[];
};

export const categories: Category[] = ["AI and ML", "Product", "Analytics", "Growth", "Social impact"];

const arena = { org: "Arena by PTC", role: "Summer Intern, Product Management", period: "2026" };
const riseup = { org: "Riseup Labs", role: "Product Manager", period: "2022 to 2025" };
const adplay = { org: "AdPlay Technology and VU Mobile", role: "Senior Product Executive", period: "2020 to 2022" };

export const shipped: Shipped[] = [
  {
    id: "teachers-portal",
    name: "Teachers Portal",
    headline: "EdTech social platform scaling",
    ...riseup,
    category: ["Product", "AI and ML", "Social impact"],
    domain: ["EdTech", "Social media", "Machine learning"],
    metric: { value: "1.3M+", label: "monthly active users" },
    secondary: [{ value: "+25%", label: "user retention" }],
    text: "Scaled the largest social platform for teachers in Bangladesh with recommendation models, GTM strategy and Agile execution.",
    did: [
      "Executed long-term product roadmaps using Agile workflows in Jira.",
      "Deployed personalized content recommendation models with Scikit-learn in Python.",
      "Configured real-time user tracking across AWS, Firebase, SQL, Power BI and Tableau.",
    ],
    impact: [
      "Scaled the platform to 1.3M+ monthly active users.",
      "Raised user retention by 25% through personalized content feeds and GTM strategy.",
    ],
    tools: ["Agile", "Jira", "Python", "R", "SQL", "Scikit-learn", "Power BI", "Tableau", "AWS", "Firebase", "Google Analytics"],
    lens: ["pm", "ba", "fde"],
  },
  {
    id: "ad-verification",
    name: "Live Ad Verification",
    headline: "Computer vision live ad verification pipeline",
    ...adplay,
    category: ["AI and ML"],
    domain: ["Computer vision", "Web scraping", "Automation"],
    metric: { value: "48% to 98%", label: "detection accuracy" },
    text: "Deep learning detection models and automated web scrapers that verify live ad placements at scale.",
    did: [
      "Led development and deployment of Convolutional Neural Network (CNN) models for live image recognition.",
      "Built custom Python web scrapers to audit ad placements across external publisher sites at scale.",
      "Integrated AI verification APIs into the core ad-tracking infrastructure.",
    ],
    impact: ["Improved ad detection and tracking accuracy from 48% to 98%."],
    tools: ["Python", "CNN", "TensorFlow", "Web scraping", "AI APIs"],
    lens: ["fde", "pm"],
  },
  {
    id: "uyouth",
    name: "UYouth Burkina Faso",
    headline: "AI speech and translation engine",
    ...riseup,
    org: "Riseup Labs, for UNICEF Burkina Faso",
    category: ["AI and ML", "Social impact"],
    domain: ["Mobile apps", "Speech AI", "Localization"],
    metric: { value: "700K", label: "U-Reporters connected" },
    text: "A mobile application with AI-powered French to Mooré text-to-speech and offline-ready features, built on TTS and translation APIs.",
    did: [
      "Integrated text-to-speech and translation APIs for French to Mooré language support.",
      "Delivered offline-ready features to support low-connectivity rural environments.",
      "Oversaw the end-to-end mobile app lifecycle and deployment schedule.",
    ],
    impact: ["Connected 700,000 U-Reporters with localized AI communication tools."],
    tools: ["TTS API", "Translation API", "Mobile", "Offline-first"],
    lens: ["fde", "pm"],
  },
  {
    id: "genai-ops",
    name: "GenAI Product Operations",
    headline: "B2B SaaS GenAI operations and workflow automation",
    ...arena,
    category: ["AI and ML", "Product"],
    domain: ["B2B SaaS", "Generative AI", "Product operations"],
    metric: { value: "-30%", label: "delivery turnaround" },
    text: "LLM agent workflows that automate PRD, user story and documentation drafting across engineering squads.",
    did: [
      "Built LLM agent workflows with the Claude API, LangGraph and MCP integrations.",
      "Brought Claude, Atlassian Rovo and Microsoft Copilot into daily product operations.",
      "Automated routine PRD creation, user story drafting and technical specification updates while keeping squads aligned.",
    ],
    impact: ["Cut PRD and user story delivery turnaround by 30%."],
    tools: ["Claude API", "LangGraph", "MCP", "Atlassian Rovo", "Microsoft Copilot"],
    lens: ["fde", "pm"],
  },
  {
    id: "ecook",
    name: "eCook IoT App",
    headline: "IoT stove real-time data pipeline and PAYG revenue",
    ...riseup,
    category: ["Analytics", "Product"],
    domain: ["IoT", "FinTech", "Data engineering"],
    metric: { value: "+48%", label: "annual revenue" },
    text: "A real-time data pipeline for an IoT cooking stove platform, used to optimize pay-as-you-go collections.",
    did: [
      "Built an integrated data pipeline linking Angaza IoT telemetry with SQL databases.",
      "Tracked real-time stove usage and payment behavior to identify default patterns.",
      "Redesigned pay-as-you-go collection strategies around the real-time analytics.",
    ],
    impact: ["Contributed to a 48% increase in annual revenue."],
    tools: ["Angaza", "SQL", "IoT", "PAYG"],
    lens: ["ba", "fde", "pm"],
  },
  {
    id: "programmatic",
    name: "Programmatic Ad Budget Optimization",
    headline: "Predictive models for DSP and DMP spend",
    ...adplay,
    category: ["Analytics", "AI and ML", "Growth"],
    domain: ["AdTech", "DSP and DMP platforms", "Programmatic bidding"],
    metric: { value: "-34%", label: "ad costs" },
    text: "Python predictive models that automate bidding across Google Display Network and DV360.",
    did: [
      "Analyzed programmatic campaign data across Google Display Network and DV360.",
      "Applied predictive analytics in Python to streamline DSP and DMP operations.",
      "Automated bidding workflows to optimize budget allocation in real time.",
    ],
    impact: ["Reduced ad costs by 34%."],
    tools: ["Python", "Predictive models", "DV360", "Google Display Network"],
    lens: ["ba", "fde"],
  },
  {
    id: "gtm-launch",
    name: "Feature Launch GTM",
    headline: "Enterprise product discovery and feature launch GTM",
    ...arena,
    category: ["Product", "Growth"],
    domain: ["Market expansion", "GTM strategy", "Product discovery"],
    metric: { value: "+20%", label: "initial adoption" },
    secondary: [{ value: "+15%", label: "target market" }],
    text: "Found expansion segments through behavioral analytics, then led go-to-market for a new feature.",
    did: [
      "Analyzed user behavioral datasets to uncover untapped expansion segments.",
      "Structured and executed an end-to-end go-to-market framework.",
      "Scoped feature requirements to align release velocity with adoption targets.",
    ],
    impact: ["Grew the target market by 15%.", "Lifted initial adoption of the new feature by 20%."],
    tools: ["Behavioral analytics", "GTM strategy", "Product discovery"],
    lens: ["pm", "ba"],
  },
  {
    id: "meena",
    name: "Meena Game",
    headline: "Child-centric game UX and reinforcement learning",
    ...riseup,
    org: "Riseup Labs, for UNICEF",
    category: ["Product", "AI and ML", "Social impact"],
    domain: ["Gaming", "EdTech", "Reinforcement learning"],
    metric: { value: "10M+", label: "downloads" },
    text: "Improved usability and engagement for young children on UNICEF's Unity-based educational game.",
    did: [
      "Ran UX research and usability testing sessions with children.",
      "Applied reinforcement learning models to adapt gameplay difficulty dynamically.",
      "Tracked player progression and drop-off points with Firebase analytics.",
    ],
    impact: ["Improved usability and player engagement for children on a game with 10M+ downloads."],
    tools: ["UX research", "Usability testing", "Unity", "Reinforcement learning", "Firebase"],
    lens: ["pm"],
  },
  {
    id: "onboarding",
    name: "Persona Segmentation and Onboarding",
    headline: "Production engineer persona segmentation and onboarding",
    ...arena,
    category: ["Analytics", "Product"],
    domain: ["UX research", "User onboarding", "Product analytics"],
    metric: { value: "-18%", label: "onboarding drop-off" },
    text: "Turned behavioral analytics into personas and requirements that removed friction from client onboarding.",
    did: [
      "Structured raw behavioral datasets into distinct user segments.",
      "Created production engineer personas from qualitative and quantitative research.",
      "Translated persona insights into product requirements that streamline initial setup.",
    ],
    impact: ["Reduced new client onboarding drop-off by 18%."],
    tools: ["Segmentation", "Personas", "UX research", "Requirements"],
    lens: ["ba", "pm"],
  },
  {
    id: "nutrition",
    name: "Adolescent Nutrition Reporting",
    headline: "GenAI nutrition reporting engine",
    ...riseup,
    org: "Riseup Labs, for UNICEF Bangladesh",
    category: ["AI and ML", "Analytics", "Social impact"],
    domain: ["HealthTech", "Generative AI", "Data analytics"],
    metric: { value: "+32%", label: "user adoption" },
    text: "Generative AI embedded in national nutrition reporting, with Python and R data modeling behind it.",
    did: [
      "Integrated generative AI features through the OpenAI API and Google AI Studio.",
      "Built data modeling scripts in Python and R on SQL database structures.",
      "Simplified reporting workflows for field healthcare operators.",
    ],
    impact: ["Grew user adoption by 32%."],
    tools: ["OpenAI API", "Google AI Studio", "Python", "R", "SQL"],
    lens: ["fde", "ba"],
  },
  {
    id: "plm",
    name: "PLM and Hardware Lifecycle",
    headline: "PLM and hardware lifecycle optimization",
    ...arena,
    category: ["Product"],
    domain: ["Hardware PLM", "Manufacturing", "Supply chain"],
    metric: { value: "-22%", label: "release lead times" },
    text: "Streamlined hardware release cycles by optimizing PLM workflows and configuration handoffs.",
    did: [
      "Analyzed PLM workflows to find bottlenecks in manufacturing release cycles.",
      "Refined Bill of Materials (BOM) configurations to make engineering handoffs clearer.",
      "Streamlined Engineering Change Order (ECO) approvals and cycle times across teams.",
    ],
    impact: ["Reduced cross-functional manufacturing release lead times by 22%."],
    tools: ["PLM", "BOM", "ECO", "Process analysis"],
    lens: ["pm"],
  },
  {
    id: "jeeto",
    name: "Jeeto.Online",
    headline: "Gaming payment integrity and anti-fraud",
    ...riseup,
    category: ["Product", "Analytics"],
    domain: ["FinTech", "Security", "Mobile gaming"],
    metric: { value: "+25%", label: "user retention" },
    secondary: [
      { value: "98%", label: "transaction success" },
      { value: "92%", label: "fraud detection" },
    ],
    text: "Raised retention on an online gaming platform while securing its payment ecosystem.",
    did: [
      "Evaluated engagement with Firebase analytics and ran iterative A/B tests.",
      "Secured payment gateway integrations through sandbox testing and integration audits.",
      "Implemented fraud detection to protect user transactions.",
    ],
    impact: [
      "Increased user retention by 25%.",
      "Reached a 98% transaction success rate and a 92% fraud detection rate.",
    ],
    tools: ["A/B testing", "UX research", "Firebase", "Payments"],
    lens: ["ba", "pm"],
  },
  {
    id: "retouching",
    name: "Retouching Labs",
    headline: "Agency scaling and client segmentation",
    org: "Retouching Labs",
    role: "Founding Member",
    period: "2022 to 2025",
    category: ["Growth", "Product"],
    domain: ["Business operations", "Machine learning", "Digital marketing"],
    metric: { value: "1 to 90+", label: "people" },
    text: "Scaled a global retouching agency from a solo venture to a 90+ person organization.",
    did: [
      "Developed client segmentation strategies with TensorFlow predictive models.",
      "Ran full-funnel acquisition campaigns across Google Ads and Facebook Ads.",
      "Managed business expansion, operational scaling and cross-team leadership.",
    ],
    impact: ["Grew the organization from its founding stage to 90+ people, capturing global market share."],
    tools: ["Market analysis", "TensorFlow", "Google Ads", "Facebook Ads"],
    lens: ["pm", "ba"],
  },
  {
    id: "kpi-systems",
    name: "Product KPI Systems",
    headline: "Product performance KPI systems and governance",
    ...arena,
    category: ["Analytics"],
    domain: ["Product analytics", "Data governance", "Executive reporting"],
    metric: { value: "-25%", label: "reporting overhead" },
    text: "KPI tracking and standardized dashboards that made executive reporting faster and more reliable.",
    did: [
      "Designed and deployed KPI tracking across platform features.",
      "Audited tracking endpoints to find and close data gaps.",
      "Standardized automated performance dashboards for leadership.",
    ],
    impact: ["Reduced weekly executive reporting overhead by 25%.", "Closed the identified gaps in product telemetry."],
    tools: ["KPI design", "Dashboards", "Data governance"],
    lens: ["ba"],
  },
  {
    id: "spark",
    name: "Spark Infrastructure",
    headline: "E-commerce funnel optimization",
    ...riseup,
    category: ["Growth", "Analytics"],
    domain: ["E-commerce", "Digital marketing", "GTM strategy"],
    metric: { value: "+43%", label: "revenue" },
    text: "UX optimization and targeted advertising for an e-commerce platform.",
    did: [
      "Formulated and executed a comprehensive GTM strategy for the site.",
      "Ran UX research to find checkout friction and raise conversion.",
      "Managed targeted acquisition campaigns in Google Ads.",
    ],
    impact: ["Achieved 43% revenue growth."],
    tools: ["GTM strategy", "UX research", "Google Ads"],
    lens: ["ba", "pm"],
  },
  {
    id: "roadmap-sync",
    name: "Roadmap Synchronization",
    headline: "Engineering and research roadmap synchronization",
    ...arena,
    category: ["Product"],
    domain: ["Technical scoping", "Cross-functional alignment", "Roadmapping"],
    metric: { value: "-20%", label: "release timelines" },
    text: "Aligned research and engineering deliverables so features shipped sooner.",
    did: [
      "Partnered with engineering, design and research squads to scope technical requirements.",
      "Defined data requirements and dependencies before sprint execution.",
      "Managed cross-functional roadmap dependencies to prevent delivery bottlenecks.",
    ],
    impact: ["Shortened feature release timelines by 20%."],
    tools: ["Roadmapping", "Technical scoping", "Agile"],
    lens: ["pm"],
  },
  {
    id: "riseup-site",
    name: "Riseup Labs Website",
    headline: "Web platform optimization and growth",
    ...riseup,
    category: ["Growth", "Analytics"],
    domain: ["Enterprise web", "SEO", "UX design"],
    metric: { value: "40K+", label: "monthly active users" },
    text: "Analytics-driven redesigns and an SEO roadmap for an IT services website.",
    did: [
      "Used Google Analytics to evaluate traffic sources, user behavior and drop-offs.",
      "Redesigned page layouts and UX flows in Figma to improve conversion paths.",
      "Managed WordPress development in Asana and guided SEO strategy with Semrush.",
    ],
    impact: ["Reached 40K+ monthly active users."],
    tools: ["Google Analytics", "Figma", "WordPress", "Asana", "Semrush"],
    lens: ["ba"],
  },
  {
    id: "data-narrative",
    name: "Data Narrative for Executives",
    headline: "Data narrative and executive prioritization",
    ...arena,
    category: ["Analytics", "Product"],
    domain: ["Strategic influence", "Data storytelling", "Roadmap planning"],
    metric: { value: "+15%", label: "prioritization velocity" },
    text: "Translated product analytics into business-value narratives that sped up roadmap decisions.",
    did: [
      "Synthesized dense product metrics into executive-ready insights.",
      "Built value-driven narrative frameworks to connect business goals with engineering capacity.",
      "Led alignment sessions with non-technical leadership to resolve roadmap trade-offs.",
    ],
    impact: ["Improved roadmap prioritization velocity by 15%."],
    tools: ["Data storytelling", "Executive reporting", "Roadmap planning"],
    lens: ["ba", "pm"],
  },
  {
    id: "predictive-bidding",
    name: "Predictive Ad Bidding",
    headline: "Predictive ad bidding ecosystem",
    ...adplay,
    category: ["AI and ML", "Analytics"],
    domain: ["Machine learning", "Automated bidding", "Predictive analytics"],
    metric: { value: "ML", label: "automated bidding" },
    text: "Automated programmatic bidding models built on unified display-network telemetry.",
    did: [
      "Integrated telemetry from Google Display Network and DV360 into a unified data ecosystem.",
      "Built predictive analytics models in Python to automate bidding decisions.",
      "Monitored live campaign performance to keep tuning the model logic.",
    ],
    impact: ["Automated programmatic bidding and improved DSP and DMP performance."],
    tools: ["Python", "Predictive analytics", "DV360", "Google Display Network"],
    lens: ["fde"],
  },
  {
    id: "crm-analytics",
    name: "CRM Behavioral Analytics",
    headline: "Data-driven CRM behavioral analytics",
    ...adplay,
    category: ["Analytics"],
    domain: ["CRM analytics", "Behavioral modeling", "Product operations"],
    metric: { value: "CRM", label: "behavioral models" },
    text: "Behavioral models and live engagement tracking that informed customer relationship management.",
    did: [
      "Analyzed customer behavior in Python, R and SQL.",
      "Tracked live user engagement in Firebase.",
      "Ran Agile workflows in Asana across functions.",
    ],
    impact: ["Delivered CRM insights used to optimize relationship management."],
    tools: ["Python", "R", "SQL", "Firebase", "Asana"],
    lens: ["ba"],
  },
  {
    id: "getecd",
    name: "GeTECD",
    headline: "Accessibility-focused inclusive design",
    ...riseup,
    category: ["Product", "Social impact"],
    domain: ["UX research", "Accessibility (WCAG)", "A/B testing"],
    metric: { value: "WCAG", label: "accessible by design" },
    text: "Gender Transformative Early Childhood Development: iterative design cycles for parents, aligned with WCAG.",
    did: [
      "Used UX research to identify parents' pain points.",
      "Iterated interface designs in Figma and ran A/B tests on engagement and task success.",
      "Validated interface changes against the Web Content Accessibility Guidelines.",
    ],
    impact: ["Improved usability for parents while meeting WCAG accessibility standards."],
    tools: ["UX research", "Figma", "A/B testing", "WCAG"],
    lens: [],
  },
  {
    id: "vr",
    name: "7th March Speech VR",
    headline: "Immersive VR historical experience",
    ...riseup,
    category: ["Product"],
    domain: ["AR/VR", "Immersive media", "EdTech"],
    metric: { value: "VR", label: "international showcase" },
    text: "Directed the lifecycle of a historical VR application shown at international events.",
    did: [
      "Managed cross-functional development with Unity and VR frameworks.",
      "Oversaw product requirements, hardware deployment checks and performance optimization.",
      "Coordinated release schedules for international public showcases.",
    ],
    impact: ["Delivered the VR application for an international showcase."],
    tools: ["Unity", "VR"],
    lens: [],
  },
];
