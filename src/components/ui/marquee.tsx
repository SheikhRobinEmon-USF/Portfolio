import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type MarqueeProps = {
  children: ReactNode;
  duration?: number;
  reverse?: boolean;
  className?: string;
};

/** CSS-only infinite marquee. Pauses on hover; the duplicate track is hidden from assistive tech. */
export function Marquee({ children, duration = 40, reverse, className }: MarqueeProps) {
  return (
    <div className={cn("group/marquee mask-fade-x flex overflow-hidden", className)}>
      <div
        className="flex w-max shrink-0 animate-marquee items-center group-hover/marquee:[animation-play-state:paused]"
        style={
          {
            "--marquee-duration": `${duration}s`,
            animationDirection: reverse ? "reverse" : "normal",
          } as CSSProperties
        }
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
