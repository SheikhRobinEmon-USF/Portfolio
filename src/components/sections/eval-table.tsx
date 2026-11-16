"use client";

import { motion } from "motion/react";
import type { CaseStudy } from "@/content/projects";
import { cn } from "@/lib/utils";

type Eval = NonNullable<CaseStudy["evals"]>[number];

/** Turns "92%" or "0.948" into a 0..1 bar length; anything else gets no bar. */
function ratio(v: string | number): number | null {
  const s = String(v);
  if (s.endsWith("%")) return Number(s.slice(0, -1)) / 100;
  if (/^0\.\d+$/.test(s)) return Number(s);
  return null;
}

export function EvalTable({ data, accent }: { data: Eval; accent: string }) {
  return (
    <div className="glass h-full overflow-hidden rounded-3xl">
      <div className="p-6 md:p-8">
        <h3 className="font-display text-2xl [--wdth:86] [--wght:600]">{data.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-soft">{data.note}</p>
      </div>
      <div className="no-scrollbar overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-y border-line">
              {data.columns.map((c, i) => (
                <th key={c} scope="col" className={cn("label-mono px-4 py-3.5 font-normal text-mute first:pl-6 last:pr-6 md:first:pl-8", i > 0 && "text-right")}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, r) => {
              const top = r === data.highlight;
              return (
                <tr key={String(row[0])} className={cn("border-b border-line last:border-0", top && "bg-[color-mix(in_oklab,var(--spot)_8%,transparent)]")}>
                  {row.map((cell, i) => {
                    const v = i > 0 ? ratio(cell) : null;
                    return i === 0 ? (
                      <th key={i} scope="row" className="whitespace-nowrap px-4 py-4 pl-6 font-mono text-[0.8125rem] font-normal md:pl-8">
                        <span className="flex items-center gap-2.5">
                          <span className={cn("size-1.5 rounded-full", top ? "bg-[var(--spot)]" : "bg-line-strong")} />
                          {cell}
                        </span>
                      </th>
                    ) : (
                      <td key={i} className="px-4 py-4 text-right last:pr-6">
                        <span className={cn("font-mono text-[0.8125rem] tabular-nums", top ? "text-ink" : "text-soft")}>{cell}</span>
                        {v !== null && (
                          <span className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-[var(--glass-hi)]">
                            <motion.span
                              className="block h-full origin-right rounded-full"
                              style={{ width: `${v * 100}%`, marginLeft: "auto", background: top ? accent : "var(--line-strong)" }}
                              initial={{ scaleX: 0 }}
                              whileInView={{ scaleX: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.1, delay: 0.1 + r * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
