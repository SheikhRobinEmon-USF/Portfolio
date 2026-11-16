"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, ViewTransition, type CSSProperties, type ReactNode } from "react";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { buttonClass } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { GitHubIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { caseStudies, clearline, type CaseStudy } from "@/content/projects";
import { useIsDesktop, useReducedMotion } from "@/lib/hooks";

const accentVar = { volt: "var(--volt)", iris: "var(--iris)", aqua: "var(--aqua)" } as const;

function StackCard({
  i,
  total,
  progress,
  accent,
  children,
}: {
  i: number;
  total: number;
  progress: MotionValue<number>;
  accent: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const desktop = useIsDesktop();
  // Each card shrinks slightly as the ones after it slide over the top.
  const start = i / total;
  const scale = useTransform(progress, [start, 1], [1, 1 - (total - 1 - i) * 0.035]);
  const dim = useTransform(progress, [start, 1], [0, (total - 1 - i) * 0.22]);
  const pinned = desktop && !reduced;
  const wrap = useRef<HTMLDivElement>(null);

  // Pin at the top when the card fits; otherwise pin once its bottom edge is in view,
  // so nothing on a tall card is ever hidden behind the next one.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const place = () => {
      const ideal = 88 + i * 22;
      const fit = window.innerHeight - el.offsetHeight - 20;
      el.style.top = `${Math.min(ideal, fit)}px`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    window.addEventListener("resize", place);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [i]);

  return (
    <div ref={wrap} className="lg:sticky" style={{ "--spot": accent } as CSSProperties}>
      <motion.article
        style={pinned ? { scale, transformOrigin: "50% 0%" } : undefined}
        className="relative overflow-hidden rounded-[2rem] border border-line bg-raised shadow-[0_-30px_80px_-40px_rgb(0_0_0/0.55)] md:rounded-[2.5rem]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full opacity-[0.16] blur-[90px]"
          style={{ background: accent }}
        />
        {children}
        {pinned && (
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 bg-bg" style={{ opacity: dim }} />
        )}
      </motion.article>
    </div>
  );
}

function CaseCard({ project, index }: { project: CaseStudy; index: number }) {
  const href = `/work/${project.slug}`;
  return (
    <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:p-14">
      <div className="flex flex-col">
        <div className="label-mono flex items-center gap-3 text-mute">
          <span style={{ color: "var(--spot)" }}>0{index + 1}</span>
          <span>{project.kind}</span>
          <span>{project.year}</span>
        </div>
        <h3 className="font-display mt-6 text-[clamp(2.25rem,4.4vw,4rem)]">
          <Link href={href} className="outline-none after:absolute after:inset-0 after:z-10 focus-visible:underline">
            {project.name}
          </Link>
        </h3>
        <p className="mt-4 text-xl leading-snug text-ink md:text-2xl">
          <span className="serif-accent">{project.tagline}</span>
        </p>
        <p className="mt-5 leading-relaxed text-soft">{project.summary}</p>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6">
          {project.facts.slice(0, 4).map((f) => (
            <div key={f.label}>
              <dt className="label-mono text-mute">{f.label}</dt>
              <dd className="font-display mt-2 text-2xl [--wdth:84] [--wght:600]">{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="relative z-20 mt-8 flex flex-wrap items-center gap-3 lg:mt-auto lg:pt-10">
          <Link href={href} className={buttonClass("primary", "md")}>
            Read the case study
            <ArrowRight size={16} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Link>
          {project.repo && (
            <a href={project.repo} target="_blank" rel="noreferrer noopener" className={buttonClass("glass", "md")}>
              <GitHubIcon />
              Source
              <ArrowUpRight size={15} className="text-mute" />
            </a>
          )}
        </div>
      </div>

      <div className="relative flex flex-col justify-center">
        {project.cover && (
          <div className="transition-transform duration-700 ease-out-expo group-hover/case:-translate-y-2 group-hover/case:rotate-[-0.4deg]">
            <ViewTransition name={`cover-${project.slug}`} share="morph" default="none">
              <BrowserFrame url={`localhost:3000 · ${project.name}`}>
                <Image
                  src={project.cover.src}
                  alt={project.cover.alt}
                  placeholder="blur"
                  sizes="(min-width: 1024px) 52vw, 92vw"
                  className="h-auto w-full"
                />
              </BrowserFrame>
            </ViewTransition>
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          {project.stack.slice(0, 7).map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
          {project.stack.length > 7 && <Chip>+{project.stack.length - 7}</Chip>}
        </div>
      </div>
    </div>
  );
}

/** Clearline has no public UI yet, so the card shows the agent's pipeline instead. */
function Pipeline() {
  return (
    <div className="relative rounded-2xl border border-line bg-[var(--glass-hi)] p-5 md:p-8">
      <div className="label-mono mb-6 flex items-center justify-between text-mute">
        <span>Agent pipeline</span>
        <span className="flex items-center gap-2">
          <span className="size-1.5 animate-pulse rounded-full bg-volt" />
          LangGraph
        </span>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2">
        {clearline.steps.map((step, i) => (
          <motion.li
            key={step}
            className="relative overflow-hidden rounded-xl border border-line bg-raised p-4"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 * i, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="label-mono text-mute">Step 0{i + 1}</span>
            <p className="mt-3 font-medium">{step}</p>
            <motion.span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[linear-gradient(90deg,var(--iris),var(--aqua),var(--volt))]"
              animate={{ scaleX: [0, 1, 1, 0], opacity: [1, 1, 0, 0] }}
              transition={{ duration: 4, times: [0, 0.3, 0.6, 1], delay: i * 0.9, repeat: Infinity, repeatDelay: 0.6 }}
            />
          </motion.li>
        ))}
      </ol>
      <div className="mt-5 flex items-center justify-between rounded-xl border border-dashed border-line-strong p-4 font-mono text-xs text-soft">
        <span>women&apos;s knit cotton pullover</span>
        <ArrowRight size={14} className="text-mute" />
        <span className="text-ink">HTS heading + rationale</span>
      </div>
      <p className="mt-3 text-xs text-mute">Illustrative flow. The repository is coursework and not public.</p>
    </div>
  );
}

function ClearlineCard() {
  return (
    <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:p-14">
      <div className="flex flex-col">
        <div className="label-mono flex items-center gap-3 text-mute">
          <span style={{ color: "var(--spot)" }}>03</span>
          <span>{clearline.kind}</span>
          <span>{clearline.year}</span>
        </div>
        <h3 className="font-display mt-6 text-[clamp(2.25rem,4.4vw,4rem)]">{clearline.name}</h3>
        <p className="mt-4 text-xl leading-snug md:text-2xl">
          <span className="serif-accent">{clearline.tagline}</span>
        </p>
        <p className="mt-5 leading-relaxed text-soft">{clearline.summary}</p>
        <div className="mt-8 flex flex-wrap gap-2 lg:mt-auto lg:pt-10">
          {clearline.stack.map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        </div>
      </div>
      <Pipeline />
    </div>
  );
}

export function Work() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const total = caseStudies.length + 1;

  return (
    <section id="work" data-scene="2" className="relative py-24 md:py-36">
      <div className="container-x">
        <SectionHeading
          index="02"
          label="Selected work"
          title={
            <>
              Built, evaluated and <span className="serif-accent text-gradient">open-sourced</span>
            </>
          }
          lede="AI tools I designed and built end to end. Each one keeps the model honest: deterministic code does the arithmetic, evals decide what ships."
        />

        <div ref={ref} className="flex flex-col gap-6 lg:gap-10">
          {caseStudies.map((project, i) => (
            <StackCard key={project.slug} i={i} total={total} progress={scrollYProgress} accent={accentVar[project.accent]}>
              <div className="group/case">
                <CaseCard project={project} index={i} />
              </div>
            </StackCard>
          ))}
          <StackCard i={total - 1} total={total} progress={scrollYProgress} accent={accentVar.volt}>
            <ClearlineCard />
          </StackCard>
        </div>
      </div>
    </section>
  );
}
