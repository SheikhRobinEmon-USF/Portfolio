"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import { useApp } from "@/components/providers/app-provider";
import { useMounted, useReducedMotion } from "@/lib/hooks";

const ParticleField = dynamic(() => import("./particle-field"), { ssr: false });

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Fixed backdrop: soft colour fields, then the WebGL particle field on top. */
export function Scene() {
  const { theme } = useApp();
  const mounted = useMounted();
  const reduced = useReducedMotion();
  const webgl = mounted && hasWebGL();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-[30vh] right-[-20vw] h-[90vh] w-[80vw] rounded-full opacity-40 blur-[120px] light:opacity-30"
        style={{ background: "radial-gradient(closest-side, var(--iris), transparent)" }}
      />
      <div
        className="absolute bottom-[-40vh] left-[-25vw] h-[90vh] w-[80vw] rounded-full opacity-25 blur-[140px] light:opacity-20"
        style={{ background: "radial-gradient(closest-side, var(--aqua), transparent)" }}
      />
      {webgl && (
        <Boundary>
          <div className="absolute inset-0">
            <ParticleField theme={theme} reduced={reduced} />
          </div>
        </Boundary>
      )}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(120% 90% at 50% 40%, transparent 55%, var(--bg) 100%)",
        }}
      />
    </div>
  );
}
