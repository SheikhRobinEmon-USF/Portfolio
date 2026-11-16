"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Check, Copy, Mail, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useApp } from "@/components/providers/app-provider";
import { buttonClass } from "@/components/ui/button";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/icons";
import { KineticWord, useKineticType } from "@/components/ui/kinetic";
import { Magnetic } from "@/components/ui/magnetic";
import { Reveal } from "@/components/ui/reveal";
import { profile } from "@/content/profile";
import { useReducedMotion } from "@/lib/hooks";

export function useCopyEmail() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };
  return { copied, copy };
}

const formatTime = () =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: profile.timezone,
    timeZoneName: "short",
  }).format(new Date());

function subscribeClock(cb: () => void) {
  const id = setInterval(cb, 15_000);
  return () => clearInterval(id);
}

function LocalTime() {
  const time = useSyncExternalStore(subscribeClock, formatTime, () => "--:--");
  return <span className="tabular-nums">{time}</span>;
}

export function Contact() {
  const { ask } = useApp();
  const { copied, copy } = useCopyEmail();
  const reduced = useReducedMotion();
  const headline = useRef<HTMLHeadingElement>(null);
  useKineticType(headline, !reduced);

  return (
    <section id="contact" data-scene="4" className="relative overflow-hidden pb-10 pt-32 md:pt-52">
      <div className="container-x">
        <Reveal y={14}>
          <div className="label-mono mb-8 flex items-center gap-3 text-mute">
            <span className="text-accent">07</span>
            <span className="h-px w-8 bg-line-strong" />
            <span>Contact</span>
          </div>
        </Reveal>

        <Reveal>
          <h2
            ref={headline}
            aria-label="Let's take it to production."
            className="font-display text-[clamp(2.75rem,11vw,11rem)] [--wdth:86]"
          >
            <span aria-hidden>
              <span className="block">
                <KineticWord text="Let’s" /> <KineticWord text="take" /> <KineticWord text="it" />
              </span>
              <span className="block">
                <KineticWord text="to" /> <span className="serif-accent pr-[0.05em] text-gradient">production.</span>
              </span>
            </span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-12 md:mt-20 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
          <Reveal delay={0.1}>
            <p className="max-w-xl text-xl leading-relaxed text-soft">
              I am looking for AI product, forward deployed engineering and analytics roles where the work
              ends in something people use. {profile.relocation}.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Magnetic strength={0.2}>
                <button type="button" onClick={copy} className={buttonClass("primary", "lg", "min-w-[17rem] !justify-between")}>
                  <span className="flex items-center gap-2.5">
                    <Mail size={18} />
                    {profile.email}
                  </span>
                  <span className="relative grid size-5 place-items-center">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={copied ? "y" : "n"}
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        transition={{ duration: 0.2 }}
                        className="grid"
                      >
                        {copied ? <Check size={17} /> : <Copy size={16} />}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </button>
              </Magnetic>
              <span aria-live="polite" className="text-sm text-mute">
                {copied ? "Copied to clipboard" : "Select to copy"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <a href={`mailto:${profile.email}`} className={buttonClass("glass", "md")}>
                Write an email
                <ArrowUpRight size={15} className="text-mute" />
              </a>
              <a href={profile.links.linkedin} target="_blank" rel="noreferrer noopener" className={buttonClass("glass", "md")}>
                <LinkedInIcon />
                LinkedIn
                <ArrowUpRight size={15} className="text-mute" />
              </a>
              <a href={profile.links.github} target="_blank" rel="noreferrer noopener" className={buttonClass("glass", "md")}>
                <GitHubIcon />
                GitHub
                <ArrowUpRight size={15} className="text-mute" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="glass rounded-3xl p-6 md:p-7">
              <dl className="divide-y divide-line">
                <div className="flex items-center justify-between gap-6 pb-4">
                  <dt className="label-mono text-mute">Based in</dt>
                  <dd className="text-right text-sm">{profile.location}</dd>
                </div>
                <div className="flex items-center justify-between gap-6 py-4">
                  <dt className="label-mono text-mute">Local time</dt>
                  <dd className="text-right font-mono text-sm">
                    <LocalTime />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-6 py-4">
                  <dt className="label-mono text-mute">Graduating</dt>
                  <dd className="text-right text-sm">May 2027, MS AI and Business Analytics</dd>
                </div>
                <div className="flex items-center justify-between gap-6 pt-4">
                  <dt className="label-mono text-mute">Not sure where to start</dt>
                  <dd>
                    <button
                      type="button"
                      onClick={() => ask("Why should we hire Robin?")}
                      className="flex items-center gap-1.5 text-sm text-accent underline-offset-4 hover:underline"
                    >
                      <Sparkles size={14} />
                      Ask the assistant
                    </button>
                  </dd>
                </div>
              </dl>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
