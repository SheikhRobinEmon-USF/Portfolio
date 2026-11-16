"use client";

import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { GraduationCap } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { awards, education, profile, story } from "@/content/profile";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";
import portrait from "@/assets/portrait.webp";

function Portrait() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-11, 11]), { stiffness: 180, damping: 18 });
  const tilt = fine && !reduced;

  return (
    <div className="[perspective:1100px]">
      <motion.div
        className="group relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-line-strong bg-raised"
        style={tilt ? { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" } : undefined}
        onPointerMove={(e) => {
          if (!tilt) return;
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
      >
        <Image
          src={portrait}
          alt={`Portrait of ${profile.name}`}
          placeholder="blur"
          sizes="(min-width: 1024px) 28vw, 80vw"
          className="size-full scale-105 object-cover object-top grayscale-[0.25] transition-[filter,transform] duration-700 ease-out-expo group-hover:scale-100 group-hover:grayscale-0"
        />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(200deg,transparent_45%,rgb(7_8_11/0.85))]" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(140deg,var(--iris),transparent_55%)] opacity-30 mix-blend-color transition-opacity duration-700 group-hover:opacity-0" />
        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between text-[#f1f1ee]">
          <div>
            <p className="font-display text-2xl [--wdth:84]">{profile.name}</p>
            <p className="label-mono mt-2 opacity-70">{profile.location}</p>
          </div>
          <span className="label-mono rounded-full bg-volt px-2.5 py-1.5 text-[#0a0c05]">GPA 4.0</span>
        </div>
      </motion.div>
    </div>
  );
}

export function About() {
  return (
    <section id="about" data-scene="3" className="relative py-24 md:py-36">
      <div className="container-x">
        <SectionHeading
          index="06"
          label="About"
          title={
            <>
              A product manager who <span className="serif-accent text-gradient">ships the code</span> too
            </>
          }
        />

        <div className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <Reveal className="mx-auto w-full max-w-sm lg:sticky lg:top-28 lg:mx-0 lg:self-start">
            <Portrait />
          </Reveal>

          <div>
            <Stagger className="space-y-6" gap={0.12}>
              {story.map((para, i) => (
                <StaggerItem key={i}>
                  <p className={i === 0 ? "text-xl leading-relaxed text-ink md:text-2xl md:leading-relaxed" : "text-lg leading-relaxed text-soft"}>
                    {para}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>

            <div className="mt-16 grid gap-3 md:grid-cols-2 md:gap-4">
              {education.map((e, i) => (
                <Reveal key={e.school} delay={0.08 * i} className="h-full">
                  <SpotlightCard className="glass flex h-full flex-col rounded-3xl p-6 md:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
                        <GraduationCap size={19} />
                      </span>
                      <span className="label-mono text-right leading-relaxed text-mute">{e.period}</span>
                    </div>
                    <h3 className="font-display mt-8 text-2xl leading-tight [--wdth:86]">{e.school}</h3>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-soft">{e.degree}</p>
                    <div className="mt-auto flex items-center justify-between border-t border-line pt-5 [margin-top:1.75rem]">
                      <span className="text-sm text-mute">{e.place}</span>
                      <span className="font-mono text-sm">
                        GPA <span className="text-accent">{e.gpa}</span>
                      </span>
                    </div>
                  </SpotlightCard>
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-16">
              <h3 className="label-mono mb-2 text-mute">Recognition</h3>
              <ul>
                {awards.map((a) => (
                  <li
                    key={a.title + a.year}
                    className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-b border-line py-5 transition-[padding] duration-500 ease-out-expo hover:px-3 md:grid-cols-[7rem_1fr_auto]"
                  >
                    <span className="order-3 font-mono text-xs text-mute md:order-none">{a.year}</span>
                    <span className="font-display text-xl transition-colors duration-300 [--wdth:86] [--wght:560] group-hover:text-accent md:text-2xl">
                      {a.title}
                    </span>
                    <span className="col-span-2 text-sm text-soft md:col-span-1 md:text-right">{a.org}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
