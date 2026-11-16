"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { SectionHeading } from "@/components/ui/section-heading";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { categories, shipped, type Category, type Shipped as Item } from "@/content/projects";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;
const INITIAL = 9;
type Filter = Category | "All";

function Card({ item, onOpen }: { item: Item; onOpen: () => void }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.94, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.94, filter: "blur(8px)" }}
      transition={{ duration: 0.5, ease, layout: { type: "spring", stiffness: 260, damping: 30 } }}
      className="h-full list-none"
      id={`shipped-${item.id}`}
    >
      <SpotlightCard className="glass group h-full rounded-3xl transition-transform duration-500 ease-out-expo hover:-translate-y-1">
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          className="flex h-full w-full flex-col rounded-3xl p-6 text-left md:p-7"
        >
          <span className="flex w-full items-start justify-between gap-4">
            <span className="label-mono leading-relaxed text-mute">{item.org}</span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-soft transition-[transform,background-color,color,border-color] duration-500 ease-out-expo group-hover:rotate-45 group-hover:border-transparent group-hover:bg-accent group-hover:text-accent-ink">
              <ArrowUpRight size={15} />
            </span>
          </span>

          <span className="mt-8 block">
            <span className="font-display block text-[clamp(2.5rem,4.2vw,3.5rem)] [--wdth:80] [--wght:650]">
              {item.metric.value}
            </span>
            <span className="label-mono mt-2.5 block text-accent">{item.metric.label}</span>
          </span>

          <span className="mt-7 block text-xl font-medium tracking-tight">{item.name}</span>
          <span className="mt-2 line-clamp-3 block text-[0.9375rem] leading-relaxed text-mute">{item.text}</span>

          <span className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-6 font-mono text-[0.6875rem] text-mute">
            {item.domain.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </span>
        </button>
      </SpotlightCard>
    </motion.li>
  );
}

export function Shipped() {
  const { lens, openCase } = useApp();
  const [filter, setFilter] = useState<Filter>("All");
  const [expanded, setExpanded] = useState(false);

  const rank = (it: Item) => {
    const i = it.lens.indexOf(lens);
    return i === -1 ? 9 : i;
  };
  const matching = shipped
    .filter((it) => filter === "All" || it.category.includes(filter))
    .sort((a, b) => rank(a) - rank(b));
  const collapsible = filter === "All" && matching.length > INITIAL;
  const items = collapsible && !expanded ? matching.slice(0, INITIAL) : matching;

  const filters: Filter[] = ["All", ...categories];

  return (
    <section id="shipped" className="relative py-24 md:py-36">
      <div className="container-x">
        <SectionHeading
          index="03"
          label="Case study gallery"
          title={
            <>
              {shipped.length} case studies, <span className="serif-accent text-gradient">measured</span> in outcomes
            </>
          }
          lede="Work from Arena by PTC, Riseup Labs, AdPlay and VU Mobile. Open any card for what I did and what changed."
        />

        <LayoutGroup>
          <div
            role="tablist"
            aria-label="Filter case studies by category"
            className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0"
          >
            {filters.map((f) => {
              const active = filter === f;
              const count = f === "All" ? shipped.length : shipped.filter((s) => s.category.includes(f)).length;
              return (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "relative flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-colors duration-300",
                    active ? "border-transparent text-bg" : "border-line text-soft hover:border-line-strong hover:text-ink",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="shipped-filter"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <span className="relative">{f}</span>
                  <span className={cn("relative font-mono text-[0.6875rem]", active ? "opacity-60" : "text-mute")}>{count}</span>
                </button>
              );
            })}
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((item) => (
                <Card key={item.id} item={item} onOpen={() => openCase(item.id)} />
              ))}
            </AnimatePresence>
          </ul>

          {collapsible && (
            <motion.div layout className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                aria-expanded={expanded}
                className="label-mono flex items-center gap-2.5 rounded-full border border-line-strong px-6 py-3.5 text-ink transition-colors hover:bg-ink hover:text-bg"
              >
                {expanded ? "Show fewer" : `Show all ${matching.length} case studies`}
                <ChevronDown size={14} className={cn("transition-transform duration-500 ease-out-expo", expanded && "rotate-180")} />
              </button>
            </motion.div>
          )}
        </LayoutGroup>
      </div>
    </section>
  );
}
