"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Chip } from "@/components/ui/chip";
import { SectionHeading } from "@/components/ui/section-heading";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { categories, shipped, type Category, type Shipped as Item } from "@/content/projects";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;
type Filter = Category | "All";

function Card({ item, open, onToggle }: { item: Item; open: boolean; onToggle: () => void }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.94, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.94, filter: "blur(8px)" }}
      transition={{ duration: 0.5, ease, layout: { type: "spring", stiffness: 260, damping: 30 } }}
      className="list-none"
      id={`shipped-${item.id}`}
    >
      <SpotlightCard className="glass h-full rounded-3xl">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex h-full w-full flex-col rounded-3xl p-6 text-left md:p-7"
        >
          <motion.div layout="position" className="flex w-full items-start justify-between gap-4">
            <span className="label-mono leading-relaxed text-mute">{item.org}</span>
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full border border-line text-soft transition-[transform,background-color,color] duration-500 ease-out-expo",
                open && "rotate-45 bg-ink text-bg",
              )}
            >
              <Plus size={15} />
            </span>
          </motion.div>

          <motion.div layout="position" className="mt-8">
            <div className="font-display text-[clamp(2.5rem,4.2vw,3.5rem)] [--wdth:80] [--wght:650]">
              {item.metric.value}
            </div>
            <div className="label-mono mt-2.5 text-accent">{item.metric.label}</div>
          </motion.div>

          <motion.h3 layout="position" className="mt-7 text-xl font-medium tracking-tight">
            {item.name}
          </motion.h3>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease }}
                className="overflow-hidden"
              >
                <p className="pt-3 text-[0.9375rem] leading-relaxed text-soft">{item.text}</p>
                {item.secondary && (
                  <div className="mt-4 flex gap-6">
                    {item.secondary.map((s) => (
                      <div key={s.label}>
                        <div className="font-display text-2xl [--wdth:82]">{s.value}</div>
                        <div className="label-mono mt-1.5 text-mute">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {item.tools.map((t) => (
                    <Chip key={t} className="px-2.5 py-1 text-xs">
                      {t}
                    </Chip>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!open && (
            <motion.p layout="position" className="mt-2 line-clamp-2 text-[0.9375rem] leading-relaxed text-mute">
              {item.text}
            </motion.p>
          )}
        </button>
      </SpotlightCard>
    </motion.li>
  );
}

export function Shipped() {
  const { lens } = useApp();
  const [filter, setFilter] = useState<Filter>("All");
  const [open, setOpen] = useState<string | null>(null);

  const rank = (it: Item) => {
    const i = it.lens.indexOf(lens);
    return i === -1 ? 9 : i;
  };
  const items = shipped
    .filter((it) => filter === "All" || it.category.includes(filter))
    .sort((a, b) => rank(a) - rank(b));

  const filters: Filter[] = ["All", ...categories];

  return (
    <section id="shipped" className="relative py-24 md:py-36">
      <div className="container-x">
        <SectionHeading
          index="03"
          label="Shipped at scale"
          title={
            <>
              Twelve products, <span className="serif-accent text-gradient">measured</span> in outcomes
            </>
          }
          lede="Products I led or built at Riseup Labs, AdPlay and VU Mobile. Open a card for the story and the stack."
        />

        <LayoutGroup>
          <div role="tablist" aria-label="Filter products by category" className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {filters.map((f) => {
              const active = filter === f;
              const count = f === "All" ? shipped.length : shipped.filter((s) => s.category.includes(f)).length;
              return (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setFilter(f);
                    setOpen(null);
                  }}
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

          <ul className="grid items-start gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((item) => (
                <Card
                  key={item.id}
                  item={item}
                  open={open === item.id}
                  onToggle={() => setOpen(open === item.id ? null : item.id)}
                />
              ))}
            </AnimatePresence>
          </ul>
        </LayoutGroup>
      </div>
    </section>
  );
}
