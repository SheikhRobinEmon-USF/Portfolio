"use client";

import { ArrowUp } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { profile } from "@/content/profile";

const built = ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "Motion", "Three.js", "Storybook"];

export function Footer() {
  const { scrollTo } = useApp();
  return (
    <footer className="relative mt-24 border-t border-line">
      <div className="container-x flex flex-col gap-8 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-soft">
            © 2026 {profile.name}
          </p>
          <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 font-mono text-[0.6875rem] text-mute">
            <span>Built with</span>
            {built.map((b, i) => (
              <span key={b}>
                {b}
                {i < built.length - 1 && <span className="pl-2 text-line-strong">/</span>}
              </span>
            ))}
          </p>
        </div>
        <div className="flex items-center gap-5">
          <a
            href={profile.links.repo}
            target="_blank"
            rel="noreferrer noopener"
            className="label-mono text-mute transition-colors hover:text-ink"
          >
            View source
          </a>
          <button
            type="button"
            onClick={() => scrollTo(0, { offset: 0 })}
            className="label-mono flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-soft transition-colors hover:border-line-strong hover:text-ink"
          >
            Back to top
            <ArrowUp size={13} />
          </button>
        </div>
      </div>
    </footer>
  );
}
