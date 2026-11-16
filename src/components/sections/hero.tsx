"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { ArrowDown, MapPin, Sparkles } from "lucide-react";
import { useRef } from "react";
import { useApp } from "@/components/providers/app-provider";
import { KineticWord, useKineticType } from "@/components/ui/kinetic";
import { Magnetic } from "@/components/ui/magnetic";
import { Marquee } from "@/components/ui/marquee";
import { buttonClass } from "@/components/ui/button";
import { LensSwitch } from "@/components/ui/lens-switch";
import { lenses, profile } from "@/content/profile";
import { useReducedMotion } from "@/lib/hooks";

const ease = [0.16, 1, 0.3, 1] as const;

function Line({ children, i }: { children: React.ReactNode; i: number }) {
  return (
    <span className="-mb-[0.14em] block overflow-hidden pb-[0.14em]">
      <motion.span
        className="block"
        initial={{ y: "115%", rotate: 4 }}
        animate={{ y: 0, rotate: 0 }}
        transition={{ duration: 1.25, delay: 0.15 + i * 0.11, ease }}
        style={{ transformOrigin: "0% 100%" }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const { lens, ask, scrollTo } = useApp();
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  useKineticType(headline, !reduced);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const role = lenses.find((l) => l.id === lens)!.label;

  return (
    <section
      ref={section}
      id="top"
      data-scene="0"
      className="relative flex min-h-[100svh] flex-col justify-between pt-24 md:pt-28"
    >
      <motion.div className="container-x flex flex-1 flex-col justify-center" style={reduced ? undefined : { y, opacity }}>
        <motion.div
          className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3 md:mb-8"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.05, ease }}
        >
          <span className="label-mono flex items-center gap-2.5 text-soft">
            <span className="relative grid size-2 place-items-center">
              <span className="absolute size-2 animate-pulse-ring rounded-full bg-volt" />
              <span className="size-2 rounded-full bg-volt" />
            </span>
            MS AI and Business Analytics, USF &apos;27
          </span>
          <span className="label-mono flex items-center gap-1.5 text-mute">
            <MapPin size={12} />
            {profile.location}
          </span>
        </motion.div>

        <h1
          ref={headline}
          aria-label="AI products, from discovery to production."
          className="font-display text-[clamp(2.75rem,min(13.6vw,15.5svh),10.25rem)] [--wdth:86]"
        >
          <span aria-hidden>
            <Line i={0}>
              <KineticWord text="AI" /> <KineticWord text="products," />
            </Line>
            <Line i={1}>
              <KineticWord text="from" />{" "}
              <span className="serif-accent pr-[0.06em] text-[1.04em] text-gradient">discovery</span>
            </Line>
            <Line i={2}>
              <KineticWord text="to" /> <KineticWord text="production." />
            </Line>
          </span>
        </h1>

        <div className="mt-8 grid gap-8 md:mt-10 lg:grid-cols-[minmax(0,34rem)_1fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.55, ease }}
          >
            <div className="label-mono mb-3 flex h-4 items-center gap-2 text-accent">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={role}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  {role}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="grid">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={lens}
                  className="col-start-1 row-start-1 text-[1.0625rem] leading-relaxed text-soft md:text-lg"
                  initial={{ opacity: 0, filter: "blur(8px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.45 }}
                >
                  {profile.summary[lens]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Magnetic>
                <a
                  href="#work"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo("#work");
                  }}
                  className={buttonClass("primary", "lg")}
                >
                  See selected work
                  <ArrowDown size={17} className="transition-transform duration-300 group-hover/btn:translate-y-0.5" />
                </a>
              </Magnetic>
              <Magnetic>
                <button
                  type="button"
                  onClick={() => ask("Give me the 30-second version of Robin.")}
                  className={buttonClass("glass", "lg")}
                >
                  <Sparkles size={17} className="text-accent" />
                  Ask my AI
                </button>
              </Magnetic>
            </div>
          </motion.div>

          <motion.div
            className="lg:justify-self-end"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease }}
          >
            <LensSwitch />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="mt-10 border-y border-line py-4 md:mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.9 }}
      >
        <Marquee duration={46}>
          {profile.organizations.map((org) => (
            <span key={org} className="flex items-center whitespace-nowrap">
              <span className="font-display px-7 text-xl text-soft [--wdth:84] [--wght:500] md:text-2xl">{org}</span>
              <span className="text-accent">✦</span>
            </span>
          ))}
        </Marquee>
        <p className="sr-only">Organizations worked with: {profile.organizations.join(", ")}</p>
      </motion.div>
    </section>
  );
}
