import { experience } from "@/content/experience";
import { awards, education, metrics, profile, story } from "@/content/profile";
import { caseStudies, clearline, shipped } from "@/content/projects";
import { capabilities, technologies } from "@/content/skills";

export type Doc = {
  id: string;
  kind: "profile" | "experience" | "project" | "case" | "skills" | "education" | "award" | "contact";
  title: string;
  text: string;
  /** Where on the site this fact lives. */
  href: string;
  source: string;
  /** Extra search terms that do not appear in the text. */
  tags?: string;
};

/**
 * The assistant's whole world: every fact it can state is one of these
 * documents, generated from the same content files that render the site.
 */
export function buildKnowledge(): Doc[] {
  const docs: Doc[] = [];

  docs.push(
    {
      id: "profile-summary",
      kind: "profile",
      title: "Who Robin is",
      text: `${profile.name} is an AI Product Manager and Forward Deployed AI Engineer with 6+ years of international experience taking AI products from customer discovery to production. ${profile.currently}`,
      href: "/#top",
      source: "Intro",
      tags: "about bio introduction overview background summary who",
    },
    {
      id: "profile-domains",
      kind: "profile",
      title: "Industries",
      text: `Domain experience spans ${profile.domains.join(", ")}.`,
      href: "/#impact",
      source: "Impact",
      tags: "industry domain sector vertical",
    },
    {
      id: "profile-location",
      kind: "contact",
      title: "Location",
      text: `Robin is based in ${profile.location}. ${profile.relocation}.`,
      href: "/#contact",
      source: "Contact",
      tags: "where live based city relocate remote onsite move california bay area",
    },
    {
      id: "profile-contact",
      kind: "contact",
      title: "Contact",
      text: `Email Robin at ${profile.email}. He is also on LinkedIn and GitHub.`,
      href: "/#contact",
      source: "Contact",
      tags: "email reach message hire talk connect linkedin github call interview",
    },
  );

  story.forEach((para, i) =>
    docs.push({
      id: `story-${i}`,
      kind: "profile",
      title: ["Starting in AdTech", "Product management at Riseup Labs", "Graduate school and research"][i],
      text: para,
      href: "/#about",
      source: "About",
      tags: "story journey career path history",
    }),
  );

  for (const m of metrics) {
    docs.push({
      id: `metric-${m.id}`,
      kind: "profile",
      title: `${m.prefix ?? ""}${m.value.toLocaleString("en-US")}${m.suffix} ${m.label}`,
      text: m.context,
      href: "/#impact",
      source: "Impact",
      tags: "result impact number metric outcome achievement",
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
      tags: `job role work experience company employer ${role.stack.join(" ")}`,
    });
    role.bullets.forEach((b, i) =>
      docs.push({
        id: `role-${role.id}-${i}`,
        kind: "experience",
        title: `${b.title} (${role.company})`,
        text: b.text,
        href: `/#role-${role.id}`,
        source: role.company,
      }),
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
      tags: `project open source github repo side project build ${c.stack.join(" ")}`,
    });
    c.features.forEach((f, i) =>
      docs.push({
        id: `case-${c.slug}-f${i}`,
        kind: "case",
        title: `${c.name}: ${f.title}`,
        text: f.text,
        href: `/work/${c.slug}`,
        source: c.name,
      }),
    );
    docs.push({
      id: `case-${c.slug}-design`,
      kind: "case",
      title: `${c.name}: design principles`,
      text: c.principles.map((p) => `${p.concern}: ${p.approach}`).join(" "),
      href: `/work/${c.slug}`,
      source: c.name,
      tags: "architecture design decisions why approach hallucination grounding trust",
    });
    docs.push({
      id: `case-${c.slug}-limits`,
      kind: "case",
      title: `${c.name}: limits`,
      text: c.limits,
      href: `/work/${c.slug}`,
      source: c.name,
      tags: "limitations caveats honest weaknesses",
    });
    for (const e of c.evals ?? []) {
      const best = e.rows[e.highlight ?? 0];
      docs.push({
        id: `case-${c.slug}-eval-${e.title}`,
        kind: "case",
        title: `${c.name}: ${e.title.toLowerCase()} results`,
        text: `${e.note} Best configuration: ${e.columns.map((col, i) => `${col} ${best[i]}`).join(", ")}.`,
        href: `/work/${c.slug}`,
        source: c.name,
        tags: "evaluation evals benchmark accuracy results models tested score latency",
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
    tags: `project agent agentic tariff customs trade hts ${clearline.stack.join(" ")}`,
  });

  for (const s of shipped) {
    const extra = s.secondary?.map((x) => `${x.value} ${x.label}`).join(", ");
    docs.push({
      id: `shipped-${s.id}`,
      kind: "project",
      title: `${s.name} (${s.org})`,
      text: `${s.metric.value} ${s.metric.label}${extra ? `, ${extra}` : ""}. ${s.text}`,
      href: `/#shipped-${s.id}`,
      source: s.name,
      tags: `product shipped ${s.category.join(" ")} ${s.tools.join(" ")}`,
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
      tags: "skills tools stack technologies know proficient experience with",
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
      tags: "education degree school university college study masters bachelor gpa grade graduate graduation",
    });
  }

  docs.push({
    id: "awards",
    kind: "award",
    title: "Awards and recognition",
    text: awards.map((a) => `${a.title}, ${a.org} (${a.year})`).join("; ") + ".",
    href: "/#about",
    source: "Recognition",
    tags: "award prize honor recognition achievement won judge",
  });

  return docs;
}

/** Every named skill, used to detect "has he used X?" questions. */
export function skillTerms(): string[] {
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
    "PLM",
  ];
  return [...new Set([...base, ...extra])].sort((a, b) => b.length - a.length);
}
