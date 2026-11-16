import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Minimal browser chrome around a screenshot. */
export function BrowserFrame({
  children,
  url,
  className,
}: {
  children: ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line-strong bg-raised shadow-[0_40px_120px_-40px_rgb(0_0_0/0.7)] md:rounded-2xl",
        className,
      )}
    >
      <div className="flex h-8 items-center gap-1.5 border-b border-line px-3 md:h-9 md:px-4">
        <span className="size-2 rounded-full bg-line-strong md:size-2.5" />
        <span className="size-2 rounded-full bg-line-strong md:size-2.5" />
        <span className="size-2 rounded-full bg-line-strong md:size-2.5" />
        {url && (
          <span className="ml-3 truncate rounded-md bg-[var(--glass-hi)] px-2.5 py-1 font-mono text-[0.625rem] text-mute">
            {url}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
