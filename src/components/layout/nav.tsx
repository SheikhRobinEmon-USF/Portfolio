"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { useActiveSection, useMounted } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { profile } from "@/content/profile";

export const navItems = [
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

const ids = ["top", "impact", "work", "shipped", "experience", "skills", "about", "contact"];

export function Nav() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const { theme, toggleTheme, setPaletteOpen, setAssistantOpen, assistantOpen, scrollTo } = useApp();
  const mounted = useMounted();
  const active = useActiveSection(ids);
  const activeNav = active === "shipped" ? "work" : active;
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    if (open) return;
    if (y > 500 && y - prev > 6) setHidden(true);
    else if (prev - y > 4 || y < 200) setHidden(false);
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent) => {
    setOpen(false);
    if (!onHome) return; // let <Link> navigate to /#id
    e.preventDefault();
    scrollTo(`#${id}`);
    history.replaceState(null, "", `#${id}`);
  };

  const isMac = mounted && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-3 md:pt-5"
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: hidden ? -110 : 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav
          aria-label="Primary"
          className={cn(
            "flex w-full max-w-[60rem] items-center justify-between gap-2 rounded-full p-1.5 pl-2 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500",
            scrolled || open ? "glass-strong" : "border border-transparent",
          )}
        >
          <Link
            href="/"
            onClick={(e) => {
              setOpen(false);
              if (onHome) {
                e.preventDefault();
                scrollTo(0, { offset: 0 });
                history.replaceState(null, "", location.pathname);
              }
            }}
            className="group flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3"
            aria-label={`${profile.name}, home`}
          >
            <span className="grid size-9 place-items-center rounded-full bg-ink font-display text-[0.9rem] text-bg transition-transform duration-500 ease-out-expo [--wdth:80] [--wght:700] group-hover:rotate-[-8deg] group-hover:scale-105">
              {profile.initials}
            </span>
            <span className="hidden text-sm font-medium tracking-tight sm:block">{profile.name}</span>
          </Link>

          <ul className="hidden items-center md:flex">
            {navItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/#${item.id}`}
                  onClick={go(item.id)}
                  aria-current={onHome && activeNav === item.id ? "location" : undefined}
                  className={cn(
                    "relative block rounded-full px-3.5 py-2 text-sm transition-colors duration-300",
                    onHome && activeNav === item.id ? "text-ink" : "text-soft hover:text-ink",
                  )}
                >
                  {onHome && activeNav === item.id && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-[var(--glass-hi)] ring-1 ring-line"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-full border border-line px-3 text-xs text-mute transition-colors hover:border-line-strong hover:text-ink lg:flex"
              aria-label="Open command palette"
            >
              <span>Search</span>
              <kbd className="font-mono text-[0.6875rem]">{isMac ? "⌘K" : "Ctrl K"}</kbd>
            </button>
            <button
              type="button"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
              }}
              className="grid size-9 place-items-center rounded-full text-soft transition-colors hover:bg-[var(--glass-hi)] hover:text-ink"
              aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} theme` : "Switch theme"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mounted ? theme : "dark"}
                  initial={{ rotate: -90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid"
                >
                  {mounted && theme === "light" ? <Sun size={17} /> : <Moon size={17} />}
                </motion.span>
              </AnimatePresence>
            </button>
            <button
              type="button"
              onClick={() => setAssistantOpen(!assistantOpen)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[0.8125rem] font-medium text-accent-ink transition-transform duration-300 ease-out-expo hover:scale-[1.04] active:scale-95"
              aria-expanded={assistantOpen}
            >
              <Sparkles size={15} />
              <span>Ask AI</span>
            </button>
            <button
              type="button"
              className="grid size-9 place-items-center rounded-full text-ink md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-30 flex flex-col justify-end bg-[var(--scrim)] px-5 pb-10 pt-28 backdrop-blur-2xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="flex flex-col">
              {navItems.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.6, delay: 0.04 * i, ease: [0.16, 1, 0.3, 1] }}
                  className="border-b border-line"
                >
                  <Link
                    href={`/#${item.id}`}
                    onClick={go(item.id)}
                    className="flex items-baseline justify-between py-4 font-display text-5xl"
                  >
                    {item.label}
                    <span className="label-mono text-mute">0{i + 1}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setPaletteOpen(true);
              }}
              className="label-mono mt-8 self-start text-mute"
            >
              Search everything
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
