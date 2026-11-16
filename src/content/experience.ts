import type { Lens } from "./profile";

export type Bullet = {
  title: string;
  text: string;
  /** Which lenses this bullet matters most to, in priority order. */
  lens: Lens[];
};

export type Role = {
  id: string;
  company: string;
  role: string;
  place: string;
  period: string;
  start: string;
  end: string;
  blurb: string;
  bullets: Bullet[];
  stack: string[];
};

export const experience: Role[] = [
  {
    id: "usf",
    company: "University of South Florida",
    role: "Graduate Teaching Assistant",
    place: "Tampa, Florida",
    period: "September 2026 to Present",
    start: "2026",
    end: "Now",
    blurb:
      "Applied AI research on hospital resource and cost optimization with Tampa General Hospital, plus teaching support across 10 course sections.",
    bullets: [
      {
        title: "Healthcare operations research",
        text: "Analyze 500K+ operational records across 8 departments with Tampa General Hospital to identify cost drivers in bed capacity, staffing, patient flow and supply utilization.",
        lens: ["ba", "pm", "fde"],
      },
      {
        title: "LLM decision support",
        text: "Prototype a RAG assistant over 1,000+ hospital operational reports, reaching 90% answer accuracy in LLM evals, so administrators can query cost and utilization in plain language.",
        lens: ["fde", "pm"],
      },
      {
        title: "AI engineering projects",
        text: "Built Hospital Ops Copilot and ModelROI AI as independent open-source projects, and co-develop Clearline, an agentic RAG assistant that classifies apparel into HTS codes.",
        lens: ["fde"],
      },
      {
        title: "Forecasting and optimization",
        text: "Build demand forecasting and optimization models in Python (Scikit-learn, linear programming), improving forecast accuracy by 20% over baseline and testing 30+ staffing and capacity scenarios.",
        lens: ["fde", "ba"],
      },
      {
        title: "Stakeholder delivery",
        text: "Present findings to 15+ hospital stakeholders through 6 Power BI dashboards and briefings built with Claude Code, following HIPAA-compliant data handling.",
        lens: ["ba", "pm"],
      },
      {
        title: "AI-assisted grading workflow",
        text: "Build rubric-based grading templates and LLM-assisted feedback drafts, cutting grading time per assignment by 40% while keeping feedback consistent across sections.",
        lens: ["fde", "pm"],
      },
      {
        title: "Course support",
        text: "Support 250+ graduate and undergraduate students in Data Analytics for Business and Artificial Intelligence, partnering with Dr. Matthew Mullarkey and Dr. Daniel Zantedeschi on course materials, research and rubrics.",
        lens: [],
      },
    ],
    stack: ["Python", "Scikit-learn", "RAG", "LangGraph", "Power BI", "Claude Code", "SQL"],
  },
  {
    id: "arena",
    company: "Arena by PTC Inc.",
    role: "Summer Intern, Product Management",
    place: "San Mateo, California",
    period: "June 2026 to August 2026",
    start: "2026",
    end: "2026",
    blurb:
      "AI product work inside a cloud PLM platform: agent workflows, a RAG prototype with evals, and discovery that reshaped onboarding and go-to-market.",
    bullets: [
      {
        title: "AI product operations",
        text: "Built LLM agent workflows with the Claude API, LangGraph and MCP integrations alongside Atlassian Rovo and Microsoft Copilot to automate PRD, user story and documentation drafting, cutting delivery turnaround by 30%.",
        lens: ["fde", "pm"],
      },
      {
        title: "AI prototyping and evaluation",
        text: "Prototyped a RAG assistant over product and PLM documentation on AWS Bedrock and designed LLM evals for retrieval quality, response accuracy, latency and cost to inform feasibility and roadmap decisions.",
        lens: ["fde", "pm"],
      },
      {
        title: "Product discovery and GTM strategy",
        text: "Analyzed user behavior to identify expansion segments that grew the target market by 15%, then built the go-to-market framework for a new feature that lifted initial adoption by 20%.",
        lens: ["pm", "ba"],
      },
      {
        title: "User insights and onboarding",
        text: "Turned behavioral datasets into user segments and production engineer personas, producing requirements that reduced new client onboarding drop-off by 18%.",
        lens: ["ba", "pm"],
      },
      {
        title: "PLM and manufacturing",
        text: "Optimized PLM workflows, Bill of Materials configurations and Engineering Change Order cycles, reducing cross-functional manufacturing release lead times by 22%.",
        lens: ["pm", "ba"],
      },
      {
        title: "Cross-functional roadmap alignment",
        text: "Partnered with engineering, design and research squads to scope initiatives and data requirements, shortening feature release timelines by 20%.",
        lens: ["pm"],
      },
      {
        title: "Unit economics and prioritization",
        text: "Modeled unit economics for an AI feature, including inference cost per user and ROI, and prioritized AI feature requests with the RICE framework after a build-vs-buy assessment of AI tooling options.",
        lens: ["ba", "pm"],
      },
    ],
    stack: ["Claude API", "LangGraph", "MCP", "AWS Bedrock", "Atlassian Rovo", "RICE", "PLM"],
  },
  {
    id: "riseup",
    company: "Riseup Labs",
    role: "Product Manager",
    place: "Dhaka, Bangladesh",
    period: "June 2022 to July 2025",
    start: "2022",
    end: "2025",
    blurb:
      "Three years owning products across EdTech, IoT, gaming, e-commerce and UNICEF programs. Named Best Product Manager in 2023.",
    bullets: [
      {
        title: "Teachers Portal",
        text: "Scaled the largest social platform for teachers in Bangladesh to 1.3M+ monthly active users, and raised retention by 25% with a Scikit-learn content recommendation engine.",
        lens: ["pm", "ba", "fde"],
      },
      {
        title: "UYouth Burkina Faso",
        text: "Delivered AI-powered French to Mooré text-to-speech and offline-ready features with TTS and translation APIs, connecting 700,000 U-Reporters.",
        lens: ["fde", "pm"],
      },
      {
        title: "eCook IoT app",
        text: "Built an Angaza and SQL data pipeline to track real-time stove usage, optimizing pay-as-you-go collections and contributing to 48% annual revenue growth.",
        lens: ["ba", "fde", "pm"],
      },
      {
        title: "Adolescent Nutrition Reporting, UNICEF Bangladesh",
        text: "Grew user adoption by 32% by integrating generative AI through the OpenAI API and Google AI Studio, with Python and R data modeling and SQL.",
        lens: ["fde", "ba"],
      },
      {
        title: "Jeeto.Online",
        text: "Increased retention by 25% through A/B testing and UX research, and secured payments with a 98% transaction success rate and a 92% fraud detection rate.",
        lens: ["ba", "pm"],
      },
      {
        title: "Retouching Labs, founding member",
        text: "Scaled the business from a solo founding stage to a 90+ person organization, leading market analysis and Google and Facebook Ads campaigns.",
        lens: ["pm", "ba"],
      },
      {
        title: "Spark Infrastructure Limited",
        text: "Achieved 43% revenue growth for an e-commerce site through GTM strategy, UX research and Google Ads.",
        lens: ["ba", "pm"],
      },
      {
        title: "UNICEF Meena Game and GeTECD",
        text: "Improved usability for children and parents through UX research, usability testing, Figma design iterations, A/B testing and WCAG accessibility standards.",
        lens: ["pm"],
      },
    ],
    stack: ["Agile", "Jira", "Python", "R", "SQL", "AWS", "Firebase", "Power BI", "Tableau", "Figma"],
  },
  {
    id: "adplay",
    company: "AdPlay Technology Ltd. and VU Mobile",
    role: "Product Executive to Senior Product Executive",
    place: "Dhaka, Bangladesh",
    period: "November 2020 to May 2022",
    start: "2020",
    end: "2022",
    blurb:
      "AdTech product work where the models had to pay for themselves: verification, bidding and CRM analytics.",
    bullets: [
      {
        title: "AI ad verification",
        text: "Improved ad detection accuracy from 48% to 98% by leading development of CNN image-detection models, with custom Python web scrapers and AI APIs to verify ad placements at scale.",
        lens: ["fde", "pm", "ba"],
      },
      {
        title: "Programmatic optimization",
        text: "Reduced ad costs by 34% across Google Display Network and DV360 by building Python predictive models to automate bidding and improve DSP and DMP performance.",
        lens: ["ba", "fde", "pm"],
      },
      {
        title: "CRM analytics",
        text: "Analyzed customer behavior in Python, R and SQL to optimize relationship management, ran Agile workflows in Asana and tracked live engagement in Firebase.",
        lens: ["ba", "pm"],
      },
    ],
    stack: ["Python", "CNN", "TensorFlow", "DV360", "Google Display Network", "R", "SQL", "Firebase"],
  },
];

export function bulletsFor(role: Role, lens: Lens): Bullet[] {
  const rank = (b: Bullet) => {
    const i = b.lens.indexOf(lens);
    return i === -1 ? 99 : i;
  };
  return [...role.bullets].sort((a, b) => rank(a) - rank(b));
}
