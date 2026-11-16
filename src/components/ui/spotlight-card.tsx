"use client";

import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

type SpotlightCardProps = ComponentProps<"div"> & { spot?: string };

/** A surface whose border and fill glow under the cursor. */
export function SpotlightCard({ className, spot, style, onPointerMove, children, ...rest }: SpotlightCardProps) {
  return (
    <div
      className={cn("spotlight", className)}
      style={{ ...(spot ? ({ "--spot": spot } as CSSProperties) : {}), ...style }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
        onPointerMove?.(e);
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
