"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Counter } from "@/components/ui/counter";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Reveal } from "@/components/ui/reveal";
import { metrics, type Metric } from "@/content/profile";
import { useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const statement: { text: string; em?: boolean }[] = [
  { text: "Six years taking AI products from customer discovery to production, across" },
  { text: "healthcare, EdTech, FinTech, AdTech and e-commerce.", em: true },
  { text: "Product strategy on one side of the table, hands-on LLM engineering on the other." },
];

function Word({ children, progress, range, em }: { children: string; progress: MotionValue<number>; range: [number, number]; em?: boolean }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className={cn("inline-block", em && "serif-accent text-[1.06em]")}>
      {children}&nbsp;
    </motion.span>
  );
}

function Statement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = statement.flatMap((s) => s.text.split(" ").map((w) => ({ w, em: s.em })));

  return (
    <p
      ref={ref}
      className="font-display max-w-6xl text-[clamp(1.75rem,4.6vw,4.25rem)] leading-[1.04] [--wdth:90] [--wght:520]"
    >
      {reduced
        ? statement.map((s, i) => (
            <span key={i} className={cn(s.em && "serif-accent")}>
              {s.text}{" "}
            </span>
          ))
        : words.map(({ w, em }, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, Math.min(1, (i + 4) / words.length)]} em={em}>
              {w}
            </Word>
          ))}
    </p>
  );
}

/** 48% to 98%: two bars that grow when in view. */
function BeforeAfter() {
  return (
    <div className="mt-6 space-y-2.5" aria-hidden>
      {[
        { label: "Before", v: 48, tone: "bg-line-strong" },
        { label: "After", v: 98, tone: "bg-accent" },
      ].map((b, i) => (
        <div key={b.label} className="flex items-center gap-3">
          <span className="label-mono w-12 text-mute">{b.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--glass-hi)]">
            <motion.div
              className={cn("h-full origin-left rounded-full", b.tone)}
              style={{ width: `${b.v}%` }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.25 + i * 0.25, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="w-9 text-right font-mono text-xs text-soft">{b.v}%</span>
        </div>
      ))}
    </div>
  );
}

/** A growth curve drawn on scroll, for the headline metric. */
function GrowthCurve() {
  return (
    <svg viewBox="0 0 400 140" className="mt-6 w-full overflow-visible" aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id="curve-stroke" x1="0" x2="1">
          <stop offset="0" stopColor="var(--iris)" />
          <stop offset="0.55" stopColor="var(--aqua)" />
          <stop offset="1" stopColor="var(--volt)" />
        </linearGradient>
        <linearGradient id="curve-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--aqua)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--aqua)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0 132 C 70 128, 110 118, 160 100 S 250 62, 300 34 S 370 8, 400 4 L 400 140 L 0 140 Z"
        fill="url(#curve-fill)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.9 }}
      />
      <motion.path
        d="M0 132 C 70 128, 110 118, 160 100 S 250 62, 300 34 S 370 8, 400 4"
        fill="none"
        stroke="url(#curve-stroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

const layout: Record<string, string> = {
  mau: "sm:col-span-2 lg:row-span-2",
  accuracy: "sm:col-span-2",
};

function MetricCard({ m, i }: { m: Metric; i: number }) {
  const { scrollTo } = useApp();
  const big = m.id === "mau";
  return (
    <Reveal delay={0.05 * (i % 4)} className={cn("h-full", layout[m.id])}>
      <SpotlightCard className="glass group h-full rounded-3xl">
        <a
          href={m.href}
          onClick={(e) => {
            e.preventDefault();
            scrollTo(m.href);
          }}
          className="flex h-full flex-col justify-between rounded-3xl p-6 md:p-7"
        >
          <div>
            <div
              className={cn(
                "font-display [--wdth:82] [--wght:640]",
                big ? "text-[clamp(4.5rem,11vw,9rem)]" : "text-[clamp(3rem,5.4vw,4.5rem)]",
              )}
            >
              <Counter value={m.value} from={m.from ?? 0} decimals={m.decimals ?? 0} prefix={m.prefix} suffix={m.suffix} />
            </div>
            <p className="label-mono mt-3 leading-relaxed text-accent">{m.label}</p>
          </div>
          <div>
            {m.id === "mau" && <GrowthCurve />}
            {m.id === "accuracy" && <BeforeAfter />}
            <p className={cn("mt-5 text-sm leading-relaxed text-soft", big && "max-w-md text-base")}>{m.context}</p>
          </div>
        </a>
      </SpotlightCard>
    </Reveal>
  );
}

export function Impact() {
  const { lens } = useApp();
  const ordered = [...metrics].sort((a, b) => {
    // The headline card stays first; the rest follow the lens.
    if (a.id === "mau") return -1;
    if (b.id === "mau") return 1;
    const ra = a.lens.indexOf(lens);
    const rb = b.lens.indexOf(lens);
    return (ra === -1 ? 9 : ra) - (rb === -1 ? 9 : rb);
  });

  return (
    <section id="impact" data-scene="1" className="relative py-28 md:py-44">
      <div className="container-x">
        <div className="label-mono mb-10 flex items-center gap-3 text-mute">
          <span className="text-accent">01</span>
          <span className="h-px w-8 bg-line-strong" />
          <span>Impact</span>
        </div>
        <Statement />

        <div className="mt-20 grid grid-flow-dense gap-3 sm:auto-rows-fr sm:grid-cols-2 md:mt-28 md:gap-4 lg:grid-cols-4">
          {ordered.map((m, i) => (
            <MetricCard key={m.id} m={m} i={i} />
          ))}
        </div>
        <p className="mt-6 text-xs text-mute">
          Figures come from shipped products and research described below. Select a card to jump to the work behind it.
        </p>
      </div>
    </section>
  );
}
