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
  org: string;
  period: string;
  category: Category[];
  metric: { value: string; label: string };
  secondary?: { value: string; label: string }[];
  text: string;
  tools: string[];
  lens: Lens[];
};

export const categories: Category[] = ["AI and ML", "Product", "Analytics", "Growth", "Social impact"];

export const shipped: Shipped[] = [
  {
    id: "teachers-portal",
    name: "Teachers Portal",
    org: "Riseup Labs",
    period: "2022 to 2025",
    category: ["Product", "AI and ML", "Social impact"],
    metric: { value: "1.3M+", label: "monthly active users" },
    secondary: [{ value: "+25%", label: "user retention" }],
    text: "The largest social platform for teachers in Bangladesh. Scaled through roadmap execution, data analysis, AI integrations and cross-team collaboration, with a Scikit-learn content recommendation engine and GTM strategy behind the retention lift.",
    tools: ["Agile", "Jira", "Python", "R", "SQL", "Scikit-learn", "Power BI", "Tableau", "AWS", "Firebase", "Google Analytics"],
    lens: ["pm", "ba", "fde"],
  },
  {
    id: "ad-verification",
    name: "AI Ad Verification",
    org: "AdPlay Technology",
    period: "2020 to 2022",
    category: ["AI and ML"],
    metric: { value: "48% to 98%", label: "detection accuracy" },
    text: "Led development of CNN models for live image detection and ad tracking, with custom Python web scrapers and AI APIs that automate the verification of ad placements at scale.",
    tools: ["Python", "CNN", "TensorFlow", "Web scraping", "AI APIs"],
    lens: ["fde", "pm"],
  },
  {
    id: "uyouth",
    name: "UYouth Burkina Faso",
    org: "Riseup Labs, for UNICEF",
    period: "2022 to 2025",
    category: ["AI and ML", "Social impact"],
    metric: { value: "700K", label: "U-Reporters connected" },
    text: "A mobile application with AI-powered French to Mooré text-to-speech and offline-ready features, built on TTS and translation APIs.",
    tools: ["TTS API", "Translation API", "Mobile", "Offline-first"],
    lens: ["fde", "pm"],
  },
  {
    id: "ecook",
    name: "eCook IoT App",
    org: "Riseup Labs",
    period: "2022 to 2025",
    category: ["Analytics", "Product"],
    metric: { value: "+48%", label: "annual revenue" },
    text: "A data pipeline integrating Angaza and SQL to track real-time stove usage, with the insights used to optimize pay-as-you-go collection strategies.",
    tools: ["Angaza", "SQL", "IoT", "PAYG"],
    lens: ["ba", "fde", "pm"],
  },
  {
    id: "programmatic",
    name: "Programmatic Optimization",
    org: "AdPlay Technology and VU Mobile",
    period: "2020 to 2022",
    category: ["Analytics", "AI and ML", "Growth"],
    metric: { value: "-34%", label: "ad costs" },
    text: "Python predictive models that automate bidding across Google Display Network and DV360, improving DSP and DMP performance.",
    tools: ["Python", "Predictive models", "DV360", "Google Display Network"],
    lens: ["ba", "fde"],
  },
  {
    id: "meena",
    name: "Meena Game",
    org: "Riseup Labs, for UNICEF",
    period: "2022 to 2025",
    category: ["Product", "Social impact"],
    metric: { value: "10M+", label: "downloads" },
    text: "Improved usability for children on UNICEF's Meena Game through UX research, usability testing and Firebase.",
    tools: ["UX research", "Usability testing", "Firebase"],
    lens: ["pm"],
  },
  {
    id: "nutrition",
    name: "Adolescent Nutrition Reporting",
    org: "Riseup Labs, for UNICEF Bangladesh",
    period: "2022 to 2025",
    category: ["AI and ML", "Analytics", "Social impact"],
    metric: { value: "+32%", label: "user adoption" },
    text: "Integrated generative AI through the OpenAI API and Google AI Studio to enhance nutrition reporting, with Python and R for data modeling and SQL for database management.",
    tools: ["OpenAI API", "Google AI Studio", "Python", "R", "SQL"],
    lens: ["fde", "ba"],
  },
  {
    id: "jeeto",
    name: "Jeeto.Online",
    org: "Riseup Labs",
    period: "2022 to 2025",
    category: ["Product", "Analytics"],
    metric: { value: "+25%", label: "user retention" },
    secondary: [
      { value: "98%", label: "transaction success" },
      { value: "92%", label: "fraud detection" },
    ],
    text: "An online gaming platform improved with Firebase, UX research and A/B testing. Secured the payment ecosystem through rigorous sandbox testing and integration audits.",
    tools: ["A/B testing", "UX research", "Firebase", "Payments"],
    lens: ["ba", "pm"],
  },
  {
    id: "retouching",
    name: "Retouching Labs",
    org: "Founding member",
    period: "2022 to 2025",
    category: ["Growth", "Product"],
    metric: { value: "1 to 90+", label: "people" },
    text: "Directed the expansion from a solo founding stage to a 90+ person organization, with market analysis and full-funnel campaigns across Google Ads and Facebook Ads.",
    tools: ["Market analysis", "Google Ads", "Facebook Ads"],
    lens: ["pm", "ba"],
  },
  {
    id: "spark",
    name: "Spark Infrastructure",
    org: "Riseup Labs",
    period: "2022 to 2025",
    category: ["Growth", "Analytics"],
    metric: { value: "+43%", label: "revenue" },
    text: "Led the go-to-market strategy for an e-commerce site while optimizing conversion through UX research and targeted Google Ads campaigns.",
    tools: ["GTM strategy", "UX research", "Google Ads"],
    lens: ["ba", "pm"],
  },
  {
    id: "getecd",
    name: "GeTECD",
    org: "Riseup Labs",
    period: "2022 to 2025",
    category: ["Product", "Social impact"],
    metric: { value: "WCAG", label: "accessible by design" },
    text: "Gender Transformative Early Childhood Development. Used UX research to find parents' pain points, iterated designs in Figma and measured engagement and task success with A/B testing.",
    tools: ["UX research", "Figma", "A/B testing", "WCAG"],
    lens: [],
  },
  {
    id: "vr",
    name: "7th March Speech VR",
    org: "Riseup Labs",
    period: "2022 to 2025",
    category: ["Product"],
    metric: { value: "VR", label: "international showcase" },
    text: "Directed the lifecycle of an international VR showcase, managing development of a VR application with Unity and VR development frameworks.",
    tools: ["Unity", "VR"],
    lens: [],
  },
];
