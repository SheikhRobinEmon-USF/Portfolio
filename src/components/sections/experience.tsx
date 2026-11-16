"use client";

import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Chip } from "@/components/ui/chip";
import { LensSwitch } from "@/components/ui/lens-switch";
import { Reveal } from "@/components/ui/reveal";
import { Figures } from "@/components/ui/rich-text";
import { SectionHeading } from "@/components/ui/section-heading";
import { bulletsFor, experience, type Role } from "@/content/experience";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;
const VISIBLE = 4;

function RoleRow({ role, index }: { role: Role; index: number }) {
  const { lens } = useApp();
  const [expanded, setExpanded] = useState(false);
  const bullets = bulletsFor(role, lens);
  const shown = expanded ? bullets : bullets.slice(0, VISIBLE);
  const extra = bullets.length - VISIBLE;

  return (
    <article id={`role-${role.id}`} className="relative grid gap-6 border-t border-line py-12 md:py-16 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
      {/* Timeline node */}
      <span aria-hidden className="absolute -left-[calc(var(--rail)+5px)] top-[3.35rem] hidden size-[11px] rounded-full border-2 border-accent bg-bg md:top-[4.4rem] lg:block" />

      <div className="lg:sticky lg:top-28 lg:self-start">
        <Reveal y={16}>
          <div className="label-mono flex items-center gap-3 text-mute">
            <span className="text-accent">{role.start}</span>
            <span className="h-px w-5 bg-line-strong" />
            <span>{role.end}</span>
          </div>
          <h3 className="font-display mt-5 text-[clamp(1.75rem,3vw,2.6rem)] leading-[0.98] [--wdth:86]">{role.company}</h3>
          <p className="mt-3 text-lg text-ink">{role.role}</p>
          <p className="mt-1.5 text-sm text-mute">
            {role.place} · {role.period}
          </p>
        </Reveal>
      </div>

      <div>
        <Reveal delay={0.06}>
          <p className="max-w-2xl text-xl leading-snug md:text-2xl">
            <span className="serif-accent">{role.blurb}</span>
          </p>
        </Reveal>

        <ul className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-line bg-line">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.map((b, i) => (
              <motion.li
                key={b.title}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: expanded ? 0 : 0.03 * i, ease, layout: { type: "spring", stiffness: 300, damping: 32 } }}
                className="group grid gap-2 bg-raised p-5 transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--bg-raised),var(--accent)_5%)] md:grid-cols-[13rem_1fr] md:gap-8 md:p-6"
              >
                <h4 className="flex items-baseline gap-3 text-[0.9375rem] font-medium">
                  <span className="font-mono text-[0.6875rem] text-mute transition-colors group-hover:text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {b.title}
                </h4>
                <p className="text-[0.9375rem] leading-relaxed text-soft">
                  <Figures text={b.text} />
                </p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {role.stack.map((s) => (
              <Chip key={s} className="px-2.5 py-1 text-xs">
                {s}
              </Chip>
            ))}
          </div>
          {extra > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="label-mono flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-soft transition-colors hover:border-line-strong hover:text-ink"
            >
              {expanded ? "Show fewer" : `Show ${extra} more`}
              <ChevronDown size={13} className={cn("transition-transform duration-500 ease-out-expo", expanded && "rotate-180")} />
            </button>
          )}
        </div>
      </div>
      <span className="sr-only">Role {index + 1} of {experience.length}</span>
    </article>
  );
}

export function Experience() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.6", "end 0.6"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });

  return (
    <section id="experience" data-scene="3" className="relative py-24 md:py-36">
      <div className="container-x">
        <SectionHeading
          index="04"
          label="Experience"
          title={
            <>
              Six years, four teams, <span className="serif-accent text-gradient">two continents</span>
            </>
          }
          lede="From AdTech in Dhaka to AI product work in the Bay Area and hospital research in Tampa. Switch the lens to reorder each role around what you are hiring for."
          aside={<LensSwitch compact />}
        />

        <div ref={ref} className="relative [--rail:2rem] lg:pl-[var(--rail)]">
          <div aria-hidden className="absolute bottom-0 left-0 top-0 hidden w-px bg-line lg:block">
            <motion.div className="h-full w-full origin-top bg-[linear-gradient(180deg,var(--iris),var(--aqua),var(--volt))]" style={{ scaleY }} />
          </div>
          {experience.map((role, i) => (
            <RoleRow key={role.id} role={role} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
