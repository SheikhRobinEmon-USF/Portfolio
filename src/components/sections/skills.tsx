"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Marquee } from "@/components/ui/marquee";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { capabilities, orderByLens, technologies, type SkillGroup } from "@/content/skills";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

type Mode = "technologies" | "capabilities";

function Explorer({ groups, mode }: { groups: SkillGroup[]; mode: Mode }) {
  const { ask } = useApp();
  const [picked, setPicked] = useState<string | null>(null);
  const active = groups.find((g) => g.id === picked) ?? groups[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-10">
      <div role="tablist" aria-orientation="vertical" aria-label={mode} className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {groups.map((g, i) => {
          const on = g.id === active.id;
          return (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setPicked(g.id)}
              onMouseEnter={() => setPicked(g.id)}
              className={cn(
                "group relative flex shrink-0 items-center justify-between gap-6 rounded-2xl px-4 py-3 text-left transition-colors duration-300 lg:px-5 lg:py-4",
                on ? "text-ink" : "text-mute hover:text-soft",
              )}
            >
              {on && (
                <motion.span
                  layoutId={`skill-tab-${mode}`}
                  className="glass absolute inset-0 rounded-2xl"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              <span className="relative flex items-baseline gap-4">
                <span className="hidden font-mono text-[0.6875rem] lg:inline">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display whitespace-nowrap text-lg [--wdth:86] [--wght:560] lg:text-2xl">{g.label}</span>
              </span>
              <span className="relative font-mono text-xs">{g.items.length}</span>
            </button>
          );
        })}
      </div>

      <div className="glass relative min-h-[19rem] overflow-hidden rounded-3xl p-6 md:p-9" role="tabpanel">
        <div className="label-mono mb-6 flex items-center justify-between text-mute">
          <span>{active.label}</span>
          <span>{active.items.length} items</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={active.id}
            className="flex flex-wrap gap-2 md:gap-2.5"
            initial="hidden"
            animate="show"
            exit="exit"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.025 } },
              exit: { opacity: 0, transition: { duration: 0.12 } },
            }}
          >
            {active.items.map((item) => (
              <motion.li
                key={item}
                variants={{
                  hidden: { opacity: 0, y: 14, scale: 0.92 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } },
                }}
              >
                <button
                  type="button"
                  onClick={() => ask(`Where has Robin used ${item}?`)}
                  title={`Ask where Robin has used ${item}`}
                  className="rounded-full border border-line bg-[var(--glass-hi)] px-4 py-2.5 text-[0.9375rem] text-ink transition-[transform,border-color,background-color,color] duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-transparent hover:bg-accent hover:text-accent-ink md:text-base"
                >
                  {item}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
        <p className="mt-8 text-xs text-mute">Select any skill to ask the assistant where it was used.</p>
      </div>
    </div>
  );
}

export function Skills() {
  const { lens } = useApp();
  const [mode, setMode] = useState<Mode>("technologies");
  const groups = orderByLens(mode === "technologies" ? technologies : capabilities, lens);
  const rows = [
    technologies.slice(0, 2).flatMap((g) => g.items),
    [...technologies.slice(2, 5).flatMap((g) => g.items)],
  ];

  return (
    <section id="skills" data-scene="3" className="relative py-24 md:py-36">
      <div aria-hidden className="mb-20 space-y-3 md:mb-28">
        {rows.map((row, i) => (
          <Marquee key={i} duration={70 + i * 14} reverse={i === 1}>
            {row.map((t) => (
              <span
                key={t}
                className={cn(
                  "font-display whitespace-nowrap px-5 text-[clamp(2rem,5vw,4.25rem)] [--wdth:80]",
                  i === 0 ? "text-ink [--wght:650]" : "text-transparent [--wght:300] [-webkit-text-stroke:1px_var(--ink-mute)]",
                )}
              >
                {t}
                <span className="pl-10 text-accent [-webkit-text-stroke:0]">/</span>
              </span>
            ))}
          </Marquee>
        ))}
      </div>

      <div className="container-x">
        <SectionHeading
          index="05"
          label="Toolkit"
          title={
            <>
              The stack, and the <span className="serif-accent text-gradient">judgment</span> around it
            </>
          }
          aside={
            <div role="radiogroup" aria-label="Skill view" className="flex gap-1 rounded-2xl border border-line bg-[var(--glass-hi)] p-1">
              {(["technologies", "capabilities"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "relative rounded-xl px-4 py-2.5 text-[0.8125rem] font-medium capitalize transition-colors duration-300",
                    mode === m ? "text-bg" : "text-soft hover:text-ink",
                  )}
                >
                  {mode === m && (
                    <motion.span layoutId="skill-mode" className="absolute inset-0 rounded-xl bg-ink" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
                  )}
                  <span className="relative">{m}</span>
                </button>
              ))}
            </div>
          }
        />
        <Reveal>
          <Explorer key={mode} groups={groups} mode={mode} />
        </Reveal>
      </div>
    </section>
  );
}
