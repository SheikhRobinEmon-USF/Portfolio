"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import type { Lens } from "@/content/profile";

export type Theme = "dark" | "light";

type AppState = {
  theme: Theme;
  toggleTheme: (origin?: { x: number; y: number }) => void;
  lens: Lens;
  setLens: (lens: Lens) => void;
  assistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  /** Open the assistant and ask it something. */
  ask: (question: string) => void;
  pendingQuestion: { id: number; text: string } | null;
  scrollTo: (target: string | number, opts?: { offset?: number; immediate?: boolean }) => void;
};

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = use(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

/* ---------------------------------------------------------------- */
/* Tiny external stores so the persisted values hydrate without a    */
/* flash and without setState-in-effect.                             */
/* ---------------------------------------------------------------- */

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
function readLens(): Lens {
  const v = document.documentElement.dataset.lens;
  return v === "fde" || v === "ba" ? v : "pm";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "dark");
  const lens = useSyncExternalStore<Lens>(subscribe, readLens, () => "pm");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<AppState["pendingQuestion"]>(null);
  const lenisRef = useRef<Lenis | null>(null);

  /* Smooth scrolling */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.11,
      anchors: { offset: -80 },
      // Let panels that scroll on their own (assistant, palette) keep the wheel.
      prevent: (node) => node.closest("[data-lenis-prevent]") !== null,
    });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  /* Route changes: drop any in-flight smooth scroll so the new page starts
     at the top (or at its #hash) instead of where the last one left off. */
  const pathname = usePathname();
  const firstPath = useRef(true);
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    const lenis = lenisRef.current;
    if (!lenis) return;
    const hash = window.location.hash;
    if (hash && document.querySelector(hash)) {
      lenis.scrollTo(hash, { offset: -80, immediate: true, force: true });
    } else {
      lenis.scrollTo(0, { immediate: true, force: true });
    }
  }, [pathname]);

  /* Lock background scroll while an overlay is open */
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (paletteOpen) lenis.stop();
    else lenis.start();
  }, [paletteOpen]);

  const scrollTo = useCallback<AppState["scrollTo"]>((target, opts) => {
    const offset = opts?.offset ?? -80;
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { offset, immediate: opts?.immediate, duration: 1.3 });
      return;
    }
    if (typeof target === "number") {
      window.scrollTo({ top: target });
      return;
    }
    const el = document.querySelector(target);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top });
    }
  }, []);

  const toggleTheme = useCallback<AppState["toggleTheme"]>((origin) => {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    const apply = () => {
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {}
      emit();
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce) {
      apply();
      return;
    }
    const x = origin?.x ?? window.innerWidth - 80;
    const y = origin?.y ?? 40;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const root = document.documentElement;
    root.classList.add("theme-vt");
    const vt = document.startViewTransition(() => flushSync(apply));
    vt.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          {
            duration: 700,
            easing: "cubic-bezier(0.76, 0, 0.24, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {});
    vt.finished.finally(() => root.classList.remove("theme-vt"));
  }, []);

  const setLens = useCallback((next: Lens) => {
    document.documentElement.dataset.lens = next;
    try {
      localStorage.setItem("lens", next);
    } catch {}
    emit();
  }, []);

  const ask = useCallback((text: string) => {
    setPendingQuestion({ id: Date.now(), text });
    setAssistantOpen(true);
    setPaletteOpen(false);
  }, []);

  /* Global shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setAssistantOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      theme,
      toggleTheme,
      lens,
      setLens,
      assistantOpen,
      setAssistantOpen,
      paletteOpen,
      setPaletteOpen,
      ask,
      pendingQuestion,
      scrollTo,
    }),
    [theme, toggleTheme, lens, setLens, assistantOpen, paletteOpen, ask, pendingQuestion, scrollTo],
  );

  return <AppContext value={value}>{children}</AppContext>;
}

/** Inline, render-blocking: restores theme and lens before first paint. */
export const bootScript = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("theme");d.dataset.theme=t==="light"?"light":"dark";var l=localStorage.getItem("lens");d.dataset.lens=(l==="fde"||l==="ba")?l:"pm";}catch(e){document.documentElement.dataset.theme="dark";}})();`;
