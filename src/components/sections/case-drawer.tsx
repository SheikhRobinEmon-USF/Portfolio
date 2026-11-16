"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Chip } from "@/components/ui/chip";
import { Figures } from "@/components/ui/rich-text";
import { shipped } from "@/content/projects";

const ease = [0.16, 1, 0.3, 1] as const;

/** Slide-over with the full story behind a gallery card. Mounted once in the layout. */
export function CaseDrawer() {
  const { caseId, openCase, closeCase, ask } = useApp();
  const index = shipped.findIndex((s) => s.id === caseId);
  const item = index >= 0 ? shipped[index] : null;
  const closeRef = useRef<HTMLButtonElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  const open = item !== null;
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      if (opener.current instanceof HTMLElement) opener.current.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scroller.current?.scrollTo({ top: 0 });
    const step = (d: number) => openCase(shipped[(index + d + shipped.length) % shipped.length].id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCase();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, openCase, closeCase]);

  const prev = shipped[(index - 1 + shipped.length) % shipped.length];
  const next = shipped[(index + 1) % shipped.length];

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-[65] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm" onClick={closeCase} aria-hidden />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-title"
            data-lenis-prevent
            className="glass-strong relative flex h-full w-full max-w-[40rem] flex-col md:m-3 md:h-[calc(100%-1.5rem)] md:rounded-[2rem]"
            initial={{ x: "104%" }}
            animate={{ x: 0 }}
            exit={{ x: "104%" }}
            transition={{ duration: 0.6, ease }}
          >
            <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4 md:px-9">
              <p className="label-mono truncate text-mute">
                <span className="text-accent">{String(index + 1).padStart(2, "0")}</span> / {shipped.length} · Case study
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={closeCase}
                aria-label="Close case study"
                className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-soft transition-colors hover:border-line-strong hover:text-ink"
              >
                <X size={17} />
              </button>
            </header>

            <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain px-6 py-8 md:px-9 md:py-10">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                  transition={{ duration: 0.35, ease }}
                >
                  <p className="label-mono leading-relaxed text-mute">
                    {item.org} · {item.role}
                  </p>
                  <h2 id="case-title" className="font-display mt-5 text-[clamp(2.25rem,6vw,3.5rem)] [--wdth:86]">
                    {item.name}
                  </h2>
                  <p className="mt-3 text-xl leading-snug md:text-2xl">
                    <span className="serif-accent">{item.headline}</span>
                  </p>

                  <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-6 rounded-3xl border border-line bg-[var(--glass-hi)] p-6">
                    <div>
                      <div className="font-display text-[clamp(3rem,9vw,4.75rem)] text-accent [--wdth:80] [--wght:650]">
                        {item.metric.value}
                      </div>
                      <div className="label-mono mt-2 text-soft">{item.metric.label}</div>
                    </div>
                    {item.secondary?.map((s) => (
                      <div key={s.label}>
                        <div className="font-display text-3xl [--wdth:82]">{s.value}</div>
                        <div className="label-mono mt-2 text-mute">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-1.5">
                    {item.domain.map((d) => (
                      <Chip key={d} tone="accent" className="px-2.5 py-1 text-xs">
                        {d}
                      </Chip>
                    ))}
                  </div>

                  <h3 className="label-mono mb-3 mt-10 text-mute">Overview</h3>
                  <p className="text-lg leading-relaxed text-ink">{item.text}</p>

                  <h3 className="label-mono mb-3 mt-10 text-mute">What I did</h3>
                  <ol className="divide-y divide-line border-y border-line">
                    {item.did.map((d, i) => (
                      <li key={d} className="flex gap-4 py-4 leading-relaxed text-soft">
                        <span className="pt-1 font-mono text-[0.6875rem] text-accent">{String(i + 1).padStart(2, "0")}</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ol>

                  <h3 className="label-mono mb-3 mt-10 text-mute">Impact</h3>
                  <ul className="space-y-3">
                    {item.impact.map((m) => (
                      <li key={m} className="flex gap-3 leading-relaxed text-soft">
                        <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
                          <Check size={12} strokeWidth={3} />
                        </span>
                        <span>
                          <Figures text={m} />
                        </span>
                      </li>
                    ))}
                  </ul>

                  <h3 className="label-mono mb-3 mt-10 text-mute">Tools and methods</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tools.map((t) => (
                      <Chip key={t} className="px-2.5 py-1 text-xs">
                        {t}
                      </Chip>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      closeCase();
                      ask(`Tell me more about ${item.name}`);
                    }}
                    className="mt-10 flex items-center gap-2 text-sm text-accent underline-offset-4 hover:underline"
                  >
                    <Sparkles size={15} />
                    Ask the assistant about this
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="grid grid-cols-2 border-t border-line">
              <button
                type="button"
                onClick={() => openCase(prev.id)}
                className="group flex items-center gap-3 border-r border-line px-6 py-4 text-left transition-colors hover:bg-[var(--glass-hi)] md:rounded-bl-[2rem] md:px-9"
              >
                <ArrowLeft size={16} className="shrink-0 text-mute transition-transform duration-300 group-hover:-translate-x-1" />
                <span className="min-w-0">
                  <span className="label-mono block text-mute">Previous</span>
                  <span className="mt-1.5 block truncate text-sm">{prev.name}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => openCase(next.id)}
                className="group flex items-center justify-end gap-3 px-6 py-4 text-right transition-colors hover:bg-[var(--glass-hi)] md:rounded-br-[2rem] md:px-9"
              >
                <span className="min-w-0">
                  <span className="label-mono block text-mute">Next</span>
                  <span className="mt-1.5 block truncate text-sm">{next.name}</span>
                </span>
                <ArrowRight size={16} className="shrink-0 text-mute transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </footer>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
