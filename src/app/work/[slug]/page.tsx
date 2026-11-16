import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { ViewTransition, type CSSProperties } from "react";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { buttonClass } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { GitHubIcon } from "@/components/ui/icons";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { EvalTable } from "@/components/sections/eval-table";
import { caseStudies } from "@/content/projects";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = caseStudies.find((c) => c.slug === slug);
  if (!project) return {};
  return { title: project.name, description: project.summary };
}

const accentVar = { volt: "var(--volt)", iris: "var(--iris)", aqua: "var(--aqua)" } as const;

function Label({ index, children }: { index: string; children: string }) {
  return (
    <div className="label-mono mb-8 flex items-center gap-3 text-mute">
      <span style={{ color: "var(--spot)" }}>{index}</span>
      <span className="h-px w-8 bg-line-strong" />
      <span>{children}</span>
    </div>
  );
}

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const index = caseStudies.findIndex((c) => c.slug === slug);
  const project = caseStudies[index];
  if (!project) notFound();
  const next = caseStudies[(index + 1) % caseStudies.length];
  const accent = accentVar[project.accent];

  return (
    <article style={{ "--spot": accent } as CSSProperties}>
      {/* Header */}
      <header data-scene="2" className="container-x pt-32 md:pt-44">
        <Reveal y={12}>
          <Link
            href="/#work"
            className="label-mono group inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-soft transition-colors hover:border-line-strong hover:text-ink"
          >
            <ArrowLeft size={13} className="transition-transform duration-300 group-hover:-translate-x-1" />
            All work
          </Link>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="label-mono mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-mute">
            <span style={{ color: accent }}>Case study</span>
            <span>{project.kind}</span>
            <span>{project.year}</span>
          </div>
          <h1 className="font-display mt-6 text-[clamp(2.75rem,9vw,8.5rem)] [--wdth:86]">{project.name}</h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-6 max-w-3xl text-2xl leading-snug md:text-4xl md:leading-[1.15]">
            <span className="serif-accent">{project.tagline}</span>
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="mt-9 flex flex-wrap gap-3">
            {project.repo && (
              <a href={project.repo} target="_blank" rel="noreferrer noopener" className={buttonClass("primary", "lg")}>
                <GitHubIcon />
                View the source
                <ArrowUpRight size={16} />
              </a>
            )}
            <a href="#how" className={buttonClass("glass", "lg")}>
              How it is built
            </a>
          </div>
        </Reveal>
      </header>

      {/* Cover */}
      {project.cover && (
        <div className="container-x mt-14 md:mt-20">
          <ViewTransition name={`cover-${project.slug}`} share="morph" default="none">
            <BrowserFrame url={`localhost:3000 · ${project.name}`}>
              <Image
                src={project.cover.src}
                alt={project.cover.alt}
                placeholder="blur"
                priority
                sizes="(min-width: 1344px) 1250px, 94vw"
                className="h-auto w-full"
              />
            </BrowserFrame>
          </ViewTransition>
          {project.screenshotNote && <p className="mt-4 text-xs text-mute">{project.screenshotNote}</p>}
        </div>
      )}

      {/* Facts */}
      <div className="container-x mt-14 md:mt-20">
        <Stagger className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
          {project.facts.map((f) => (
            <StaggerItem key={f.label} className="bg-raised p-6 md:p-8">
              <dt className="label-mono text-mute">{f.label}</dt>
              <dd className="font-display mt-4 text-[clamp(1.5rem,3vw,2.75rem)] leading-none [--wdth:82] [--wght:620]">{f.value}</dd>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      {/* Problem */}
      <section className="container-x py-24 md:py-40">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <Reveal>
            <Label index="01">The problem</Label>
            <p className="max-w-sm leading-relaxed text-soft">{project.summary}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-display text-[clamp(1.6rem,3.4vw,3.1rem)] leading-[1.08] [--wdth:90] [--wght:500]">{project.problem}</p>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section className="container-x pb-24 md:pb-40">
        <Reveal>
          <Label index="02">What it does</Label>
        </Reveal>
        <Stagger className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3" gap={0.07}>
          {project.features.map((f, i) => (
            <StaggerItem key={f.title} className="h-full">
              <SpotlightCard className="glass h-full rounded-3xl p-6 md:p-8" spot={accent}>
                <span className="font-mono text-xs text-mute">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display mt-10 text-2xl leading-tight [--wdth:86] [--wght:600] md:text-[1.75rem]">{f.title}</h3>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-soft">{f.text}</p>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Gallery */}
      <section className="pb-24 md:pb-40">
        <div className="container-x">
          <Reveal>
            <Label index="03">In the product</Label>
          </Reveal>
        </div>
        <div className="container-x grid gap-6 md:grid-cols-2 md:gap-8">
          {project.shots.map((shot, i) => (
            <Reveal key={shot.caption} delay={0.06 * (i % 2)} className={i === 0 && project.shots.length % 2 === 1 ? "md:col-span-2" : undefined}>
              <figure>
                <BrowserFrame>
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    placeholder="blur"
                    sizes="(min-width: 768px) 46vw, 94vw"
                    className="h-auto w-full"
                  />
                </BrowserFrame>
                <figcaption className="mt-4 flex gap-3 text-sm text-soft">
                  <span className="font-mono text-xs leading-5 text-mute">{String(i + 1).padStart(2, "0")}</span>
                  {shot.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section id="how" className="container-x scroll-mt-28 pb-24 md:pb-40">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <Reveal>
            <Label index="04">Why it is built this way</Label>
            <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)]">
              Decisions, <span className="serif-accent text-gradient">not defaults</span>
            </h2>
          </Reveal>
          <Stagger className="border-t border-line" gap={0.06}>
            {project.principles.map((p) => (
              <StaggerItem key={p.concern} className="grid gap-2 border-b border-line py-6 md:grid-cols-[14rem_1fr] md:gap-8">
                <h3 className="font-display text-xl [--wdth:86] [--wght:600]">{p.concern}</h3>
                <p className="leading-relaxed text-soft">{p.approach}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Evals */}
      {project.evals && (
        <section className="container-x pb-24 md:pb-40">
          <Reveal>
            <Label index="05">Evaluation</Label>
            <h2 className="font-display max-w-3xl text-[clamp(2rem,4vw,3.5rem)]">
              Measured before it was <span className="serif-accent text-gradient">trusted</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {project.evals.map((e, i) => (
              <Reveal key={e.title} delay={0.08 * i}>
                <EvalTable data={e} accent={accent} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Stack + limits */}
      <section className="container-x pb-24 md:pb-36">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="h-full">
            <div className="glass h-full rounded-3xl p-6 md:p-9">
              <h2 className="label-mono text-mute">Stack</h2>
              <div className="mt-6 flex flex-wrap gap-2">
                {project.stack.map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="h-full">
            <div className="h-full rounded-3xl border border-dashed border-line-strong p-6 md:p-9">
              <h2 className="label-mono text-mute">Honest limits</h2>
              <p className="mt-6 leading-relaxed text-soft">{project.limits}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Next */}
      <section className="container-x pb-10">
        <Link
          href={`/work/${next.slug}`}
          className="group relative block overflow-hidden rounded-[2rem] border border-line bg-raised p-8 transition-colors duration-500 hover:border-line-strong md:rounded-[2.5rem] md:p-14"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-32 size-[30rem] rounded-full opacity-20 blur-[90px] transition-opacity duration-700 group-hover:opacity-40"
            style={{ background: accentVar[next.accent] }}
          />
          <span className="label-mono text-mute">Next case study</span>
          <div className="mt-6 flex items-end justify-between gap-6">
            <span className="font-display text-[clamp(2.25rem,7vw,6rem)] [--wdth:86]">{next.name}</span>
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-ink text-bg transition-transform duration-500 ease-out-expo group-hover:translate-x-2 md:size-20">
              <ArrowRight size={26} />
            </span>
          </div>
          <p className="mt-4 max-w-xl text-soft">{next.tagline}</p>
        </Link>
      </section>
    </article>
  );
}
