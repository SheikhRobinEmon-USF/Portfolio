import type { Lens } from "./profile";

export type SkillGroup = { id: string; label: string; lens: Lens[]; items: string[] };

export const capabilities: SkillGroup[] = [
  {
    id: "ai-product",
    label: "AI Product",
    lens: ["pm", "fde"],
    items: [
      "AI Product Strategy",
      "LLM Evaluation Design",
      "Model Selection",
      "AI Cost and Latency Tradeoffs",
      "AI UX for Non-Deterministic Systems",
      "Responsible AI and Governance (EU AI Act, NIST AI RMF)",
      "Prompt Engineering",
    ],
  },
  {
    id: "ai-engineering",
    label: "AI Engineering",
    lens: ["fde"],
    items: [
      "Agentic Workflows",
      "RAG Pipelines",
      "Retrieval Evaluation",
      "LLM Evals",
      "Forecasting and Optimization Models",
      "System and API Integration",
      "Enterprise AI Deployment",
    ],
  },
  {
    id: "forward-deployed",
    label: "Forward Deployed",
    lens: ["fde", "pm"],
    items: [
      "Customer Discovery",
      "Solution Design",
      "Technical Presales",
      "Customer Onboarding",
      "Account Management",
    ],
  },
  {
    id: "product",
    label: "Product",
    lens: ["pm"],
    items: [
      "Product Strategy",
      "Product Roadmapping",
      "Product Discovery",
      "Prioritization (RICE)",
      "OKRs and North Star Metrics",
      "PRDs and User Stories",
      "PLM and SDLC",
      "Agile and Scrum",
      "A/B Testing",
      "Usability Testing",
      "UAT",
    ],
  },
  {
    id: "analysis",
    label: "Business Analysis",
    lens: ["ba"],
    items: [
      "Requirements Gathering",
      "Business Requirements Documents",
      "Stakeholder Interviews",
      "Gap Analysis",
      "Process Improvement",
      "Root Cause Analysis",
      "Data Modeling",
      "KPI and Metrics Design",
      "Dashboard Development",
      "Data Visualization",
    ],
  },
  {
    id: "business",
    label: "Business",
    lens: ["ba", "pm"],
    items: [
      "Business Case and ROI Analysis",
      "Unit Economics",
      "Pricing and Packaging",
      "Financial Modeling",
      "Build vs. Buy Analysis",
      "Competitive Analysis",
      "Go-to-Market Strategy",
      "Market Research",
      "Stakeholder Management",
      "Negotiation",
      "Cross-functional Leadership",
      "Mentorship",
    ],
  },
  {
    id: "growth",
    label: "Growth and Design",
    lens: [],
    items: [
      "User Acquisition",
      "User Retention",
      "Digital Product Marketing",
      "AdTech",
      "Lead Generation",
      "UX Research",
      "UI Design",
      "Product Design",
    ],
  },
];

export const technologies: SkillGroup[] = [
  {
    id: "llm",
    label: "AI and LLM",
    lens: ["fde", "pm", "ba"],
    items: [
      "Claude API",
      "OpenAI API",
      "Google AI Studio",
      "AWS Bedrock",
      "Azure OpenAI",
      "Google Vertex AI",
      "LangChain",
      "LangGraph",
      "OpenAI Agents SDK",
      "Model Context Protocol",
      "RAG",
      "Embeddings",
      "Vector Databases",
    ],
  },
  {
    id: "ml",
    label: "Machine Learning",
    lens: ["fde", "ba"],
    items: ["Scikit-learn", "TensorFlow", "Pandas", "NumPy", "Matplotlib"],
  },
  {
    id: "code",
    label: "Programming and APIs",
    lens: ["fde", "ba"],
    items: [
      "Python",
      "SQL",
      "R",
      "TypeScript",
      "JavaScript",
      "React",
      "FastAPI",
      "Flask",
      "HTML",
      "CSS",
      "REST APIs",
    ],
  },
  {
    id: "cloud",
    label: "Cloud and DevOps",
    lens: ["fde"],
    items: ["AWS", "Google Cloud Platform", "Microsoft Azure", "Docker", "Kubernetes", "Git", "CI/CD"],
  },
  {
    id: "data",
    label: "Data and Analytics",
    lens: ["ba", "pm"],
    items: ["Redshift", "Oracle RDBMS", "Power BI", "Tableau", "Excel", "Firebase", "Google Analytics"],
  },
  {
    id: "collab",
    label: "AI Productivity",
    lens: ["ba", "pm"],
    items: ["Claude", "ChatGPT", "Atlassian Rovo", "Jira", "Asana", "ClickUp", "Notion", "Trello", "Figma"],
  },
  {
    id: "marketing",
    label: "Marketing and Growth",
    lens: [],
    items: [
      "Google Ads",
      "Facebook Ads",
      "AdMob",
      "AppLovin",
      "App Store Connect",
      "Google Play Console",
    ],
  },
];

export function orderByLens<T extends { lens: Lens[] }>(groups: T[], lens: Lens): T[] {
  const rank = (g: T) => {
    const i = g.lens.indexOf(lens);
    return i === -1 ? 99 : i;
  };
  return [...groups].sort((a, b) => rank(a) - rank(b));
}
