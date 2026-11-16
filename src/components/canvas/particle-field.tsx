"use client";

/* Three.js objects are mutable by design: uniforms and transforms are written
   every frame, outside React's data flow. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePathname } from "next/navigation";
import { buildShapes, poses, SHAPE_COUNT, type Pose } from "./shapes";
import { clamp, damp } from "@/lib/utils";
import type { Theme } from "@/components/providers/app-provider";

const vertexShader = /* glsl */ `
  attribute vec3 aPos1;
  attribute vec3 aPos2;
  attribute vec3 aPos3;
  attribute vec3 aPos4;
  attribute vec3 aRand;

  uniform float uTime;
  uniform float uProgress;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uCalm;
  uniform float uSolid;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  varying vec3 vColor;
  varying float vAlpha;

  vec3 flow(vec3 p, float t) {
    return vec3(
      sin(p.y * 1.7 + t * 0.9) + sin(p.z * 2.3 - t * 0.6),
      sin(p.z * 1.9 + t * 0.7) + sin(p.x * 2.1 + t * 0.5),
      sin(p.x * 1.6 - t * 0.8) + sin(p.y * 2.5 + t * 0.4)
    ) * 0.5;
  }

  vec3 shape(float i) {
    if (i < 0.5) return position;
    if (i < 1.5) return aPos1;
    if (i < 2.5) return aPos2;
    if (i < 3.5) return aPos3;
    return aPos4;
  }

  void main() {
    float p = clamp(uProgress, 0.0, 3.9999);
    float seg = floor(p);
    float f = p - seg;

    // Each particle leaves and arrives on its own schedule.
    float delay = aRand.x * 0.4;
    float ft = smoothstep(delay, delay + 0.6, f);
    ft = ft * ft * (3.0 - 2.0 * ft);

    vec3 a = shape(seg);
    vec3 b = shape(seg + 1.0);
    vec3 pos = mix(a, b, ft);

    // Wave sheet keeps rolling while it is on screen.
    float waveAmt = 1.0 - clamp(abs(uProgress - 1.0), 0.0, 1.0);
    pos.y += sin(pos.x * 1.3 + uTime * 0.8) * cos(pos.z * 1.6 + uTime * 0.5) * 0.22 * waveAmt * uCalm;

    // Turbulence peaks mid-morph, then settles into a slow drift.
    float mid = sin(ft * 3.14159265);
    vec3 n = flow(pos * 0.9 + aRand * 4.0, uTime * 0.6);
    pos += n * (0.035 + mid * (0.5 + aRand.y * 0.9)) * uCalm;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = uSize * (0.55 + aRand.z * 1.1);
    size *= 1.0 + step(0.985, aRand.y) * mix(2.2, 0.6, uSolid);
    size *= mix(1.0, 0.62, uSolid);
    gl_PointSize = size * uPixelRatio * (1.0 / -mv.z);

    float g = clamp(pos.y * 0.26 + 0.5 + (aRand.z - 0.5) * 0.35, 0.0, 1.0);
    vColor = g < 0.5 ? mix(uColorA, uColorB, g * 2.0) : mix(uColorB, uColorC, (g - 0.5) * 2.0);

    // Depth fade so the far side recedes.
    float depth = smoothstep(-9.5, -4.0, mv.z);
    vAlpha = (0.35 + 0.65 * depth) * (0.55 + aRand.x * 0.45);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform float uSolid;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.22, 0.0, d);
    float a = mix(soft * soft, smoothstep(0.5, 0.32, d), uSolid) * vAlpha * uOpacity;
    vec3 col = vColor + core * 0.35 * (1.0 - uSolid);
    gl_FragColor = vec4(col, a);
  }
`;

const palettes: Record<Theme, [string, string, string]> = {
  dark: ["#7a5cff", "#3fd0ff", "#d6ff3f"],
  light: ["#4a2fe0", "#0b84b8", "#5f7d00"],
};

type Anchor = { y: number; v: number };

/** Read the page's [data-scene] sections into scroll anchors. */
function collectAnchors(): Anchor[] {
  const out: Anchor[] = [];
  const vh = window.innerHeight;
  document.querySelectorAll<HTMLElement>("[data-scene]").forEach((el) => {
    const v = Number(el.dataset.scene);
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    const pad = Math.min(r.height * 0.3, vh * 0.55);
    out.push({ y: top + pad, v }, { y: top + r.height - pad, v });
  });
  return out.sort((a, b) => a.y - b.y);
}

function progressAt(anchors: Anchor[], y: number, fallback: number) {
  if (anchors.length === 0) return fallback;
  if (y <= anchors[0].y) return anchors[0].v;
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (y >= a.y && y <= b.y) {
      const span = b.y - a.y;
      return span <= 0 ? b.v : a.v + ((y - a.y) / span) * (b.v - a.v);
    }
  }
  return anchors[anchors.length - 1].v;
}

function mixPose(list: Pose[], p: number): Pose {
  const i = clamp(Math.floor(p), 0, SHAPE_COUNT - 2);
  const t = clamp(p - i, 0, 1);
  const a = list[i];
  const b = list[i + 1];
  const e = t * t * (3 - 2 * t);
  const m = (k: keyof Pose) => a[k] + (b[k] - a[k]) * e;
  return {
    x: m("x"),
    y: m("y"),
    scale: m("scale"),
    rx: m("rx"),
    ry: m("ry"),
    rz: m("rz"),
    spin: m("spin"),
    opacity: m("opacity"),
  };
}

function Field({ theme, count, reduced }: { theme: Theme; count: number; reduced: boolean }) {
  "use no memo";
  const group = useRef<THREE.Group>(null);
  const pathname = usePathname();
  const { viewport, size } = useThree();
  const state = useRef({
    anchors: [] as Anchor[],
    progress: 0,
    spin: 0,
    mx: 0,
    my: 0,
    tmx: 0,
    tmy: 0,
    ready: false,
  });

  const { geometry, material } = useMemo(() => {
    const { shapes, rand } = buildShapes(count);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(shapes[0], 3));
    geo.setAttribute("aPos1", new THREE.BufferAttribute(shapes[1], 3));
    geo.setAttribute("aPos2", new THREE.BufferAttribute(shapes[2], 3));
    geo.setAttribute("aPos3", new THREE.BufferAttribute(shapes[3], 3));
    geo.setAttribute("aPos4", new THREE.BufferAttribute(shapes[4], 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uPixelRatio: { value: 1 },
        uSize: { value: 30 },
        uCalm: { value: 1 },
        uOpacity: { value: 0 },
        uSolid: { value: 0 },
        uColorA: { value: new THREE.Color() },
        uColorB: { value: new THREE.Color() },
        uColorC: { value: new THREE.Color() },
      },
    });
    return { geometry: geo, material: mat };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  /* Theme: additive glow on dark, solid ink dots on light. */
  useEffect(() => {
    const [a, b, c] = palettes[theme];
    material.uniforms.uColorA.value.set(a);
    material.uniforms.uColorB.value.set(b);
    material.uniforms.uColorC.value.set(c);
    material.uniforms.uSolid.value = theme === "light" ? 1 : 0;
    material.blending = theme === "light" ? THREE.NormalBlending : THREE.AdditiveBlending;
    material.needsUpdate = true;
  }, [theme, material]);

  /* Re-measure sections when the route or layout changes. */
  useEffect(() => {
    const s = state.current;
    let raf = 0;
    const measure = () => {
      raf = 0;
      s.anchors = collectAnchors();
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(queue);
    ro.observe(document.body);
    window.addEventListener("resize", queue);
    const onMove = (e: PointerEvent) => {
      s.tmx = (e.clientX / window.innerWidth) * 2 - 1;
      s.tmy = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", queue);
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  useFrame((three, delta) => {
    const g = group.current;
    if (!g) return;
    const s = state.current;
    const dt = Math.min(delta, 0.05);
    const u = material.uniforms;

    const fallback = pathname === "/" ? 0 : 2;
    const target = progressAt(s.anchors, window.scrollY + window.innerHeight * 0.5, fallback);
    if (!s.ready) {
      s.progress = target;
      s.ready = true;
    }
    s.progress = reduced ? target : damp(s.progress, target, 3.2, dt);

    const mobile = size.width < 900;
    const pose = mixPose(mobile ? poses.mobile : poses.desktop, s.progress);

    s.mx = damp(s.mx, s.tmx, 2.5, dt);
    s.my = damp(s.my, s.tmy, 2.5, dt);
    if (!reduced) s.spin += dt * pose.spin;

    g.position.set(pose.x * viewport.width * 0.5, pose.y * viewport.height * 0.5, 0);
    g.scale.setScalar(pose.scale);
    g.rotation.set(pose.rx + s.my * 0.12, pose.ry + s.spin + s.mx * 0.18, pose.rz);

    u.uTime.value = reduced ? 0 : three.clock.elapsedTime;
    u.uProgress.value = s.progress;
    u.uCalm.value = reduced ? 0.25 : 1;
    u.uPixelRatio.value = three.gl.getPixelRatio() * (size.height / 900);
    u.uOpacity.value = damp(u.uOpacity.value, pose.opacity * (u.uSolid.value > 0.5 ? 0.62 : 0.9), 2.2, dt);
  });

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

export default function ParticleField({ theme, reduced }: { theme: Theme; reduced: boolean }) {
  const count = useMemo(() => {
    if (typeof window === "undefined") return 9000;
    const small = window.innerWidth < 900;
    const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
    return small ? 6500 : weak ? 10000 : 16000;
  }, []);

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 7], fov: 42, near: 0.1, far: 40 }}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      <Field theme={theme} count={count} reduced={reduced} />
    </Canvas>
  );
}
