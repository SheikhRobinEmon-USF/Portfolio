export type Lens = "pm" | "fde" | "ba";

export const lenses: { id: Lens; label: string; short: string }[] = [
  { id: "pm", label: "AI Product Manager", short: "Product" },
  { id: "fde", label: "Forward Deployed AI Engineer", short: "Engineering" },
  { id: "ba", label: "Business Analyst", short: "Analytics" },
];

export const profile = {
  name: "Sheikh Robin Emon",
  firstName: "Robin",
  initials: "SR",
  email: "robinemon13@gmail.com",
  location: "Tampa, Florida",
  timezone: "America/New_York",
  relocation: "Open to relocation anywhere in the US, including the San Francisco Bay Area",
  links: {
    linkedin: "https://www.linkedin.com/in/sheikh-robin-emon-2807a1146",
    github: "https://github.com/SheikhRobinEmon-USF",
    repo: "https://github.com/SheikhRobinEmon-USF/Portfolio",
  },
  roles: ["AI Product Manager", "Forward Deployed AI Engineer", "Business Analyst"],
  tagline: "I take AI products from customer discovery to production.",
  currently:
    "Applying AI to hospital resource and cost optimization with Tampa General Hospital, while completing an MS in AI and Business Analytics at USF.",
  summary: {
    pm: "AI Product Manager with 6+ years of international experience taking AI products from customer discovery to production. I pair product strategy, go-to-market and stakeholder leadership with hands-on work in LLMs, RAG, agents and evals.",
    fde: "Forward Deployed AI Engineer with 6+ years building and deploying AI with customers, from discovery and integration to production. Hands-on with LLM agents, RAG, MCP and evals in Python, LangGraph, FastAPI, Docker and AWS Bedrock.",
    ba: "Business Analyst with 6+ years turning business problems into data-driven requirements, process improvements and dashboards. I work large operational datasets in SQL, Python, R, Power BI and Tableau into business cases, KPIs and executive narratives.",
  } satisfies Record<Lens, string>,
  domains: [
    "Healthcare",
    "EdTech",
    "FinTech",
    "AdTech",
    "SaaS",
    "E-commerce",
    "IoT",
    "AR/VR",
    "Gaming",
    "Telecom",
    "Mobile Financial Services",
    "OTT",
    "ERP",
    "FMCG",
    "Consultancy",
  ],
  organizations: [
    "Tampa General Hospital",
    "UNICEF",
    "Arena by PTC",
    "University of South Florida",
    "Riseup Labs",
    "AdPlay Technology",
    "VU Mobile",
    "Retouching Labs",
  ],
};

export type Metric = {
  id: string;
  value: number;
  prefix?: string;
  suffix: string;
  decimals?: number;
  label: string;
  context: string;
  from?: number;
  lens: Lens[];
  href: string;
};

export const metrics: Metric[] = [
  {
    id: "mau",
    value: 1.3,
    decimals: 1,
    suffix: "M+",
    label: "monthly active users",
    context: "Scaled Teachers Portal into the largest social platform for teachers in Bangladesh.",
    lens: ["pm", "ba", "fde"],
    href: "#shipped",
  },
  {
    id: "accuracy",
    value: 98,
    from: 48,
    suffix: "%",
    label: "ad detection accuracy, up from 48%",
    context: "Led CNN image-detection models and Python scrapers that verify ad placements at scale.",
    lens: ["fde", "pm"],
    href: "#shipped",
  },
  {
    id: "reach",
    value: 700,
    suffix: "K",
    label: "UNICEF U-Reporters reached",
    context: "Deployed French to Mooré text-to-speech with offline-ready features in Burkina Faso.",
    lens: ["fde", "pm"],
    href: "#shipped",
  },
  {
    id: "revenue",
    value: 48,
    suffix: "%",
    label: "annual revenue growth",
    context: "A real-time IoT stove-usage pipeline that sharpened pay-as-you-go collections for eCook.",
    lens: ["ba", "pm"],
    href: "#shipped",
  },
  {
    id: "cost",
    value: 34,
    suffix: "%",
    label: "lower programmatic ad costs",
    context: "Python predictive bidding across Google Display Network and DV360.",
    lens: ["ba", "fde"],
    href: "#shipped",
  },
  {
    id: "hospitals",
    value: 6264,
    suffix: "",
    label: "US hospitals benchmarked",
    context: "Hospital Ops Copilot: open-source benchmarking over four years of public CMS cost reports.",
    lens: ["fde", "ba"],
    href: "#work",
  },
  {
    id: "records",
    value: 500,
    suffix: "K+",
    label: "hospital records analyzed",
    context: "Operations research across 8 departments with Tampa General Hospital.",
    lens: ["ba", "fde"],
    href: "#experience",
  },
  {
    id: "downloads",
    value: 10,
    suffix: "M+",
    label: "downloads",
    context: "UNICEF's Meena Game, tuned for children through UX research and usability testing.",
    lens: ["pm"],
    href: "#shipped",
  },
];

export const education = [
  {
    school: "University of South Florida",
    place: "Tampa, Florida",
    degree: "Master of Science in Artificial Intelligence and Business Analytics",
    period: "Expected May 2027",
    gpa: "4.0 / 4.0",
  },
  {
    school: "Independent University, Bangladesh",
    place: "Dhaka, Bangladesh",
    degree: "Bachelor's in Management Information Systems and Finance",
    period: "January 2017 to January 2021",
    gpa: "3.75 / 4.0",
  },
];

export const awards = [
  { title: "Final Round Judge", org: "E-Volve E-Business Club Business Competition", year: "2024" },
  { title: "Best Product Manager", org: "Riseup Labs", year: "2023" },
  { title: "Dean's Honor List", org: "Independent University, Bangladesh", year: "2017 to 2020" },
  { title: "Battle of Minds Semi-Finalist", org: "British American Tobacco Bangladesh", year: "2019" },
  { title: "Best Public Speaker", org: "IUB-HYD Model United Nations", year: "2018" },
];

export const story = [
  "I started in AdTech. At AdPlay and VU Mobile I led CNN ad-verification work that took detection accuracy from 48% to 98% and built predictive bidding that cut ad costs by 34%.",
  "At Riseup Labs I spent three years as a product manager shipping for teachers in Bangladesh, U-Reporters in Burkina Faso and families cooking on pay-as-you-go stoves. Teachers Portal grew past 1.3M monthly active users, and I helped take Retouching Labs from a solo founding stage to a 90+ person organization.",
  "Now I am at the University of South Florida for an MS in AI and Business Analytics, researching hospital resource and cost optimization with Tampa General Hospital, and building open-source AI tools that keep the model out of the arithmetic.",
];

/** From the Notion portfolio draft. */
export const strengths = [
  {
    title: "Product strategy and roadmap execution",
    text: "Translating complex technical requirements into crisp PRDs, user stories and high-velocity sprint plans.",
  },
  {
    title: "AI/ML solution delivery",
    text: "Shipping end-to-end AI capabilities, including GenAI workflow automation, recommendation engines, computer vision (CNNs), predictive ad models and localized speech AI.",
  },
  {
    title: "Cross-functional leadership",
    text: "Aligning engineering squads, UX researchers and executive stakeholders to accelerate product velocity and GTM execution.",
  },
  {
    title: "Data-driven discovery",
    text: "Combining Python, SQL and telemetry analytics with A/B testing and customer research to reduce churn and grow lifetime value.",
  },
];
