"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, ArrowUpRight, Check, Mic, RotateCcw, ShieldCheck, Sparkles, Square, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/components/providers/app-provider";
import { profile } from "@/content/profile";
import { answer, suggestionsFor, type Action, type Answer } from "@/lib/assistant/engine";
import { useActiveSection, useMounted, useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

type Message =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; answer: Answer; done: boolean };

const sectionIds = ["top", "impact", "work", "shipped", "experience", "skills", "about", "contact"];
const ease = [0.16, 1, 0.3, 1] as const;

/* ---------------------------------------------------------------- */
/* Markdown-lite renderer: paragraphs, bullets, **bold**              */
/* ---------------------------------------------------------------- */

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-medium text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part.replace(/\*\*/g, "")}</Fragment>
    ),
  );
}

function Rich({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="space-y-2.5">
              {lines.map((l, j) => (
                <li key={j} className="relative pl-4 before:absolute before:left-0 before:top-[0.65em] before:size-1 before:rounded-full before:bg-accent">
                  {inline(l.slice(2))}
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(block)}</p>;
      })}
    </div>
  );
}

/** Reveals the answer a few characters at a time, like a stream. */
function useStream(text: string, active: boolean, onDone: () => void) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(active && !reduced ? 0 : text.length);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    if (!active) return;
    if (reduced) {
      done.current();
      return;
    }
    let i = 0;
    const step = Math.max(3, Math.round(text.length / 110));
    const id = setInterval(() => {
      i = Math.min(text.length, i + step);
      setN(i);
      if (i >= text.length) {
        clearInterval(id);
        done.current();
      }
    }, 16);
    return () => clearInterval(id);
  }, [text, active, reduced]);
  // Do not cut a bold marker in half mid-stream.
  const shown = text.slice(0, n);
  const open = (shown.match(/\*\*/g) ?? []).length % 2 === 1;
  return { shown: open ? shown + "**" : shown, streaming: n < text.length };
}

/* ---------------------------------------------------------------- */
/* Speech recognition (where the browser has it)                      */
/* ---------------------------------------------------------------- */

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getRecognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/* ---------------------------------------------------------------- */

function AssistantMessage({
  message,
  onDone,
  onAction,
  onAsk,
  isLast,
}: {
  message: Extract<Message, { role: "assistant" }>;
  onDone: () => void;
  onAction: (a: Action) => void;
  onAsk: (q: string) => void;
  isLast: boolean;
}) {
  const a = message.answer;
  const { shown, streaming } = useStream(a.text, !message.done, onDone);
  const router = useRouter();
  const { scrollTo, openCase } = useApp();
  const pathname = usePathname();

  const goSource = (href: string) => {
    if (href.startsWith("case:")) openCase(href.slice(5));
    else if (href.startsWith("/#") && pathname === "/") scrollTo(href.slice(1));
    else router.push(href);
  };

  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
        <Sparkles size={14} />
      </span>
      <div className="min-w-0 flex-1 text-[0.9375rem] leading-relaxed text-soft">
        {a.run && (
          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-line bg-[var(--glass-hi)] px-3 py-1.5 font-mono text-[0.6875rem] text-soft">
            <Check size={12} className="text-accent" />
            {a.run.label}
          </div>
        )}
        <Rich text={shown} />
        {streaming && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-blink bg-accent" />}

        {!streaming && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {a.sources.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <span className="label-mono mr-1 flex items-center gap-1.5 text-mute">
                  <ShieldCheck size={12} className="text-accent" />
                  Sources
                </span>
                {a.sources.map((s) => (
                  <button
                    key={s.href + s.label}
                    type="button"
                    onClick={() => goSource(s.href)}
                    className="rounded-full border border-line px-2.5 py-1 text-xs text-soft transition-colors hover:border-accent hover:text-ink"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            {a.actions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.actions.map((act) => (
                  <button
                    key={act.label}
                    type="button"
                    onClick={() => onAction(act)}
                    className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-bg transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
                  >
                    {act.label}
                    <ArrowUpRight size={12} />
                  </button>
                ))}
              </div>
            )}
            {isLast && a.followups.length > 0 && (
              <div className="mt-4 flex flex-col items-start gap-1.5">
                {a.followups.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => onAsk(f)}
                    className="rounded-xl border border-dashed border-line-strong px-3 py-1.5 text-left text-[0.8125rem] text-soft transition-colors hover:border-accent hover:text-ink"
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function Assistant() {
  const { assistantOpen, setAssistantOpen, pendingQuestion, lens, setLens, toggleTheme, scrollTo, openCase, caseId } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();
  const section = useActiveSection(sectionIds);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const rec = useRef<Recognition | null>(null);
  const seq = useRef(0);
  const handled = useRef(0);
  const canListen = mounted && getRecognition() !== null;
  const suggestions = suggestionsFor(section, pathname);

  const perform = (a: Action) => {
    switch (a.type) {
      case "scroll":
        if (pathname === "/") scrollTo(a.target);
        else router.push(`/${a.target}`);
        break;
      case "route":
        router.push(a.href);
        break;
      case "case":
        openCase(a.id);
        break;
      case "theme":
        toggleTheme();
        break;
      case "lens":
        setLens(a.lens);
        break;
      case "copy-email":
        navigator.clipboard?.writeText(profile.email).then(
          () => setToast("Email copied"),
          () => setToast(profile.email),
        );
        break;
      case "open":
        window.open(a.href, "_blank", "noopener,noreferrer");
        break;
    }
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const result = answer(text, lens);
    const uid = ++seq.current;
    const aid = ++seq.current;
    setMessages((m) => [
      ...m.map((x) => (x.role === "assistant" ? { ...x, done: true } : x)),
      { id: uid, role: "user", text },
      { id: aid, role: "assistant", answer: result, done: false },
    ]);
    setInput("");
    if (result.run) {
      const run = result.run;
      // Let the reply start rendering before the page moves.
      setTimeout(() => perform(run), 350);
    }
  };

  /* Questions handed over from elsewhere on the site (hero, skills, palette). */
  useEffect(() => {
    if (!pendingQuestion || pendingQuestion.id === handled.current) return;
    handled.current = pendingQuestion.id;
    const id = setTimeout(() => send(pendingQuestion.text), 280);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion]);

  /* Follow the answer as it streams, but stop once the question reaches the
     top of the panel so a long answer can be read from its first line. */
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const follow = () => {
      const asked = el.querySelectorAll<HTMLElement>("[data-question]");
      const last = asked[asked.length - 1];
      const bottom = el.scrollHeight - el.clientHeight;
      el.scrollTop = last ? Math.min(last.offsetTop - 12, bottom) : bottom;
    };
    follow();
    const ro = new ResizeObserver(follow);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [assistantOpen, messages.length]);

  useEffect(() => {
    if (!assistantOpen) return;
    const id = setTimeout(() => field.current?.focus({ preventScroll: true }), 250);
    // While a case study drawer is open, Escape belongs to the drawer.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !caseId && setAssistantOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [assistantOpen, setAssistantOpen, caseId]);

  /* One gentle, dismissible nudge per session. */
  useEffect(() => {
    try {
      if (sessionStorage.getItem("assistant-nudge")) return;
    } catch {
      return;
    }
    const show = setTimeout(() => setNudge(true), 9000);
    const hide = setTimeout(() => setNudge(false), 24000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);
  const dismissNudge = () => {
    setNudge(false);
    try {
      sessionStorage.setItem("assistant-nudge", "1");
    } catch {}
  };

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const toggleMic = () => {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const Ctor = getRecognition();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = false;
    let finalText = "";
    r.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setInput(text);
      if (e.results[e.results.length - 1].isFinal) finalText = text;
    };
    r.onend = () => {
      setListening(false);
      rec.current = null;
      if (finalText.trim()) send(finalText);
    };
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };

  const showNudge = nudge && !assistantOpen;

  return (
    <>
      {/* Launcher */}
      <AnimatePresence>
        {!assistantOpen && (
          <motion.div
            className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 md:bottom-7 md:right-7"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={{ duration: 0.5, ease }}
          >
            <AnimatePresence>
              {showNudge && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.5, ease }}
                  className="glass-strong relative hidden w-64 origin-bottom-right rounded-2xl rounded-br-md p-4 md:block"
                >
                  <button
                    type="button"
                    onClick={dismissNudge}
                    aria-label="Dismiss"
                    className="absolute right-2 top-2 grid size-6 place-items-center rounded-full text-mute hover:text-ink"
                  >
                    <X size={13} />
                  </button>
                  <p className="pr-5 text-sm leading-relaxed text-soft">
                    Short on time? Ask me about Robin&apos;s work. I answer from this site and show my sources.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      dismissNudge();
                      setAssistantOpen(true);
                      setTimeout(() => send(suggestions[0]), 300);
                    }}
                    className="mt-3 text-left text-sm font-medium text-accent underline-offset-4 hover:underline"
                  >
                    {suggestions[0]}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={() => {
                dismissNudge();
                setAssistantOpen(true);
              }}
              aria-label="Open the portfolio assistant"
              className="group relative grid size-14 place-items-center rounded-full bg-accent text-accent-ink shadow-[0_18px_50px_-12px_var(--accent)] transition-transform duration-500 ease-out-expo hover:scale-110 active:scale-95"
            >
              <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-full border border-accent" />
              <Sparkles size={22} className="transition-transform duration-500 ease-out-expo group-hover:rotate-12" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {assistantOpen && (
          <motion.aside
            role="dialog"
            aria-label="Portfolio assistant"
            data-lenis-prevent
            className="glass-strong fixed inset-x-2 bottom-2 z-50 flex h-[min(42rem,calc(100dvh-5rem))] origin-bottom-right flex-col overflow-hidden rounded-[1.75rem] md:inset-x-auto md:bottom-6 md:right-6 md:w-[27rem]"
            initial={{ opacity: 0, y: 40, scale: 0.92, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 30, scale: 0.94, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease }}
          >
            <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="relative grid size-9 place-items-center rounded-full bg-accent text-accent-ink">
                  <Sparkles size={17} />
                </span>
                <div>
                  <p className="text-sm font-medium leading-tight">Ask about Robin</p>
                  <p className="mt-1 flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-wider text-mute">
                    <span className="size-1.5 rounded-full bg-volt" />
                    Runs in your browser · cites sources
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMessages([])}
                    aria-label="Clear conversation"
                    className="grid size-8 place-items-center rounded-full text-mute transition-colors hover:bg-[var(--glass-hi)] hover:text-ink"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAssistantOpen(false)}
                  aria-label="Close assistant"
                  className="grid size-8 place-items-center rounded-full text-mute transition-colors hover:bg-[var(--glass-hi)] hover:text-ink"
                >
                  <X size={17} />
                </button>
              </div>
            </header>

            <div ref={list} className="relative flex-1 overflow-y-auto overscroll-contain px-5 py-5" aria-live="polite">
              <div className="space-y-6">
                {messages.length === 0 && (
                  <div>
                    <p className="font-display text-3xl leading-[1.02] [--wdth:86] [--wght:560]">
                      What would you like to <span className="serif-accent text-gradient">know?</span>
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-soft">
                      I search this portfolio&apos;s own content and answer only from what is published here. No
                      language model, no network calls, nothing you type leaves this page.
                    </p>
                    <p className="label-mono mb-3 mt-7 text-mute">
                      {section && section !== "top" ? "Based on what you are viewing" : "Try asking"}
                    </p>
                    <div className="flex flex-col items-start gap-2">
                      {[...suggestions, "Take me to the contact section", "View this as an engineer"].map((s, i) => (
                        <motion.button
                          key={s}
                          type="button"
                          onClick={() => send(s)}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.15 + i * 0.05, ease }}
                          className="rounded-2xl border border-line bg-[var(--glass-hi)] px-4 py-2.5 text-left text-sm text-ink transition-[border-color,transform] duration-300 ease-out-expo hover:translate-x-1 hover:border-accent"
                        >
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <motion.div
                      key={m.id}
                      data-question
                      className="flex justify-end"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease }}
                    >
                      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[0.9375rem] leading-relaxed text-bg">
                        {m.text}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.15 }}>
                      <AssistantMessage
                        message={m}
                        isLast={i === messages.length - 1}
                        onAction={perform}
                        onAsk={send}
                        onDone={() =>
                          setMessages((all) => all.map((x) => (x.id === m.id && x.role === "assistant" ? { ...x, done: true } : x)))
                        }
                      />
                    </motion.div>
                  ),
                )}
              </div>
            </div>

            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center"
                >
                  <span className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-medium text-bg">
                    <Check size={13} />
                    {toast}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <form
              className="border-t border-line p-3"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <div className="flex items-end gap-2 rounded-2xl border border-line bg-[var(--glass-hi)] p-1.5 pl-4 transition-colors focus-within:border-accent">
                <textarea
                  ref={field}
                  value={input}
                  rows={1}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder={listening ? "Listening…" : "Ask about projects, skills, results…"}
                  aria-label="Ask a question about Robin"
                  className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-2 text-[0.9375rem] outline-none placeholder:text-mute"
                />
                {canListen && (
                  <button
                    type="button"
                    onClick={toggleMic}
                    aria-label={listening ? "Stop listening" : "Ask by voice"}
                    aria-pressed={listening}
                    className={cn(
                      "relative grid size-9 shrink-0 place-items-center rounded-xl transition-colors",
                      listening ? "bg-red-500 text-white" : "text-mute hover:bg-[var(--glass-hi)] hover:text-ink",
                    )}
                  >
                    {listening ? <Square size={13} fill="currentColor" /> : <Mic size={17} />}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send"
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink transition-[transform,opacity] duration-300 ease-out-expo hover:scale-105 disabled:scale-100 disabled:opacity-30"
                >
                  <ArrowUp size={17} />
                </button>
              </div>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
