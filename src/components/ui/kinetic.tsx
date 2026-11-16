"use client";

import { useEffect, type RefObject } from "react";
import { cn } from "@/lib/utils";

const REST = { w: 600, d: 86 };
const START = { w: 200, d: 75 };

/**
 * Variable-font kinetic type. Every `.kchar` inside `ref` thickens and widens
 * as the cursor approaches; with no fine pointer a slow wave rolls through instead.
 */
export function useKineticType(ref: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const chars = Array.from(root.querySelectorAll<HTMLElement>(".kchar"));
    if (!chars.length) return;

    const apply = (el: HTMLElement, w: number, d: number) => {
      el.style.setProperty("--w", w.toFixed(1));
      el.style.setProperty("--d", d.toFixed(2));
    };

    if (!enabled) {
      chars.forEach((el) => apply(el, REST.w, REST.d));
      return;
    }

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cur = chars.map(() => ({ ...START }));
    let px = -9999;
    let py = -9999;
    let hovering = false;
    let visible = true;
    let raf = 0;
    const t0 = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const t = (now - t0) / 1000;
      // Read phase
      const rects = fine && hovering ? chars.map((c) => c.getBoundingClientRect()) : null;
      // Write phase
      for (let i = 0; i < chars.length; i++) {
        let tw = REST.w + Math.sin(t * 1.15 - i * 0.42) * (fine ? 46 : 90);
        let td = REST.d;
        if (rects) {
          const r = rects[i];
          const dx = px - (r.left + r.width / 2);
          const dy = py - (r.top + r.height / 2);
          const prox = Math.max(0, 1 - Math.hypot(dx, dy) / (r.height * 1.9));
          const e = prox * prox;
          tw = REST.w - 160 + e * 360;
          td = REST.d - 4 + e * 18;
        }
        const c = cur[i];
        c.w += (tw - c.w) * 0.12;
        c.d += (td - c.d) * 0.12;
        apply(chars[i], c.w, c.d);
      }
    };

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      const r = root.getBoundingClientRect();
      const pad = 140;
      hovering =
        px > r.left - pad && px < r.right + pad && py > r.top - pad && py < r.bottom + pad;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(root);
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [ref, enabled]);
}

/** Splits text into per-character spans the kinetic hook can drive. */
export function KineticWord({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("inline-block whitespace-nowrap", className)}>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="kchar">
          {ch}
        </span>
      ))}
    </span>
  );
}
