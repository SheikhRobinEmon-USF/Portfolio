"use client";

import { Command } from "cmdk";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Briefcase,
  Copy,
  Eye,
  FileText,
  Home,
  Layers,
  Mail,
  Moon,
  Search,
  Sparkles,
  Sun,
  User,
  Zap,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useApp } from "@/components/providers/app-provider";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/icons";
import { lenses, profile } from "@/content/profile";
import { caseStudies, shipped } from "@/content/projects";

const ease = [0.16, 1, 0.3, 1] as const;

const sections = [
  { id: "top", label: "Home", icon: <Home size={16} /> },
  { id: "impact", label: "Impact", icon: <Zap size={16} /> },
  { id: "work", label: "Selected work", icon: <Layers size={16} /> },
  { id: "shipped", label: "Shipped products", icon: <Layers size={16} /> },
  { id: "experience", label: "Experience", icon: <Briefcase size={16} /> },
  { id: "skills", label: "Toolkit", icon: <Zap size={16} /> },
  { id: "about", label: "About", icon: <User size={16} /> },
  { id: "contact", label: "Contact", icon: <Mail size={16} /> },
];

function Item({
  children,
  icon,
  onSelect,
  value,
  hint,
}: {
  children: ReactNode;
  icon: ReactNode;
  onSelect: () => void;
  value: string;
  hint?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9375rem] text-soft outline-none transition-colors data-[selected=true]:bg-[var(--glass-hi)] data-[selected=true]:text-ink"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-mute transition-colors group-data-[selected=true]:border-accent group-data-[selected=true]:text-accent">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint && <span className="shrink-0 font-mono text-[0.6875rem] text-mute">{hint}</span>}
      <ArrowRight size={14} className="shrink-0 opacity-0 transition-opacity group-data-[selected=true]:opacity-60" />
    </Command.Item>
  );
}

const groupClass =
  "[&_[cmdk-group-heading]]:label-mono [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-4 [&_[cmdk-group-heading]]:text-mute";

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, toggleTheme, theme, setLens, ask, scrollTo } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const close = () => {
    setPaletteOpen(false);
    setQuery("");
  };
  const run = (fn: () => void) => () => {
    close();
    // Wait for the palette to release scroll before moving the page.
    setTimeout(fn, 60);
  };
  const goSection = (id: string) =>
    run(() => {
      if (pathname === "/") scrollTo(id === "top" ? 0 : `#${id}`, id === "top" ? { offset: 0 } : undefined);
      else router.push(id === "top" ? "/" : `/#${id}`);
    });

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-md" onClick={close} aria-hidden />
          <motion.div
            className="glass-strong relative w-full max-w-2xl overflow-hidden rounded-3xl"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.35, ease }}
            data-lenis-prevent
          >
            <Command
              label="Command palette"
              loop
              onKeyDown={(e) => {
                if (e.key === "Escape") close();
              }}
            >
              <div className="flex items-center gap-3 border-b border-line px-5">
                <Search size={18} className="shrink-0 text-mute" />
                <Command.Input
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search, jump, or ask a question…"
                  className="h-16 w-full bg-transparent text-lg outline-none placeholder:text-mute"
                />
                <kbd className="shrink-0 rounded-md border border-line px-2 py-1 font-mono text-[0.6875rem] text-mute">esc</kbd>
              </div>

              <Command.List className="max-h-[min(26rem,55vh)] overflow-y-auto overscroll-contain p-2">
                <Command.Empty className="px-3 py-10 text-center text-sm text-mute">Nothing matches that.</Command.Empty>

                {query.trim().length > 2 && (
                  <Command.Group heading="Assistant" className={groupClass} forceMount>
                    <Item value={`ask ${query}`} icon={<Sparkles size={16} />} onSelect={run(() => ask(query))} hint="AI">
                      Ask: <span className="text-ink">{query}</span>
                    </Item>
                  </Command.Group>
                )}

                <Command.Group heading="Go to" className={groupClass}>
                  {sections.map((s) => (
                    <Item key={s.id} value={`go ${s.label}`} icon={s.icon} onSelect={goSection(s.id)}>
                      {s.label}
                    </Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Case studies" className={groupClass}>
                  {caseStudies.map((c) => (
                    <Item
                      key={c.slug}
                      value={`case ${c.name} ${c.stack.join(" ")}`}
                      icon={<FileText size={16} />}
                      onSelect={run(() => router.push(`/work/${c.slug}`))}
                      hint={c.year}
                    >
                      {c.name}
                    </Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Products" className={groupClass}>
                  {shipped.map((s) => (
                    <Item
                      key={s.id}
                      value={`product ${s.name} ${s.org} ${s.tools.join(" ")}`}
                      icon={<Layers size={16} />}
                      onSelect={run(() => {
                        if (pathname === "/") scrollTo(`#shipped-${s.id}`, { offset: -110 });
                        else router.push(`/#shipped-${s.id}`);
                      })}
                      hint={s.metric.value}
                    >
                      {s.name}
                    </Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Read this site as" className={groupClass}>
                  {lenses.map((l) => (
                    <Item key={l.id} value={`lens view as ${l.label} ${l.short}`} icon={<Eye size={16} />} onSelect={run(() => setLens(l.id))}>
                      {l.label}
                    </Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Actions" className={groupClass}>
                  <Item
                    value="toggle theme dark light mode"
                    icon={theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                    onSelect={run(() => toggleTheme())}
                  >
                    Switch to {theme === "dark" ? "light" : "dark"} theme
                  </Item>
                  <Item
                    value="copy email address contact"
                    icon={<Copy size={16} />}
                    onSelect={run(() => void navigator.clipboard?.writeText(profile.email))}
                    hint={profile.email}
                  >
                    Copy email
                  </Item>
                  <Item
                    value="open linkedin profile"
                    icon={<LinkedInIcon />}
                    onSelect={run(() => window.open(profile.links.linkedin, "_blank", "noopener,noreferrer"))}
                  >
                    Open LinkedIn
                  </Item>
                  <Item
                    value="open github profile source code"
                    icon={<GitHubIcon />}
                    onSelect={run(() => window.open(profile.links.github, "_blank", "noopener,noreferrer"))}
                  >
                    Open GitHub
                  </Item>
                  <Item value="ask ai assistant chat" icon={<Sparkles size={16} />} onSelect={run(() => ask("Give me the 30-second version of Robin."))}>
                    Ask the assistant for a summary
                  </Item>
                </Command.Group>
              </Command.List>

              <div className="flex items-center justify-between border-t border-line px-5 py-3 font-mono text-[0.6875rem] text-mute">
                <span>↑↓ navigate · ↵ select</span>
                <span>Type a question to ask the assistant</span>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
