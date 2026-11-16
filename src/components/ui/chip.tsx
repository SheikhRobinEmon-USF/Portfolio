import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChipProps = {
  children: ReactNode;
  tone?: "default" | "accent" | "solid";
  className?: string;
};

export function Chip({ children, tone = "default", className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] leading-none transition-colors duration-300",
        tone === "default" && "border border-line bg-[var(--glass-hi)] text-soft",
        tone === "accent" && "border border-transparent bg-accent-soft text-accent",
        tone === "solid" && "bg-ink text-bg",
        className,
      )}
    >
      {children}
    </span>
  );
}
