import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  index: string;
  label: string;
  title: ReactNode;
  lede?: ReactNode;
  className?: string;
  aside?: ReactNode;
};

export function SectionHeading({ index, label, title, lede, className, aside }: SectionHeadingProps) {
  return (
    <div className={cn("mb-12 flex flex-col gap-8 md:mb-16 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="max-w-4xl">
        <Reveal y={14}>
          <div className="label-mono mb-6 flex items-center gap-3 text-mute">
            <span className="text-accent">{index}</span>
            <span className="h-px w-8 bg-line-strong" />
            <span>{label}</span>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="font-display text-[clamp(2.4rem,6.2vw,5.25rem)]">{title}</h2>
        </Reveal>
        {lede && (
          <Reveal delay={0.12}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-soft">{lede}</p>
          </Reveal>
        )}
      </div>
      {aside && <Reveal delay={0.15}>{aside}</Reveal>}
    </div>
  );
}
