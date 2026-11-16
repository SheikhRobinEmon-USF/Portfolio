"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { useApp } from "@/components/providers/app-provider";
import { lenses } from "@/content/profile";
import { useMounted } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * "Read this site as": reorders summaries, experience bullets, skills and
 * projects around the role a visitor is hiring for.
 */
export function LensSwitch({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { lens, setLens } = useApp();
  const mounted = useMounted();
  const id = useId();
  const current = mounted ? lens : "pm";

  return (
    <div className={cn(!compact && "glass rounded-3xl p-4 md:p-5", className)}>
      {!compact && (
        <div className="mb-3 flex items-center justify-between gap-6">
          <span className="label-mono text-mute">Read this site as</span>
          <span className="hidden text-xs text-mute sm:block">Reorders the story for the role you are hiring</span>
        </div>
      )}
      <div
        role="radiogroup"
        aria-label="Choose the role to tailor this portfolio to"
        className="flex gap-1 rounded-2xl border border-line bg-[var(--glass-hi)] p-1"
      >
        {lenses.map((l) => {
          const active = current === l.id;
          return (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={l.label}
              onClick={() => setLens(l.id)}
              className={cn(
                "relative flex-1 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[0.8125rem] font-medium transition-colors duration-300",
                active ? "text-bg" : "text-soft hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`lens-${id}`}
                  className="absolute inset-0 rounded-xl bg-ink"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative">
                {compact ? (
                  l.short
                ) : (
                  <>
                    <span className="sm:hidden">{l.short}</span>
                    <span className="hidden sm:inline">{l.label}</span>
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
