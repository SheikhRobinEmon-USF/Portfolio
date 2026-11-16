/** Deterministic PRNG so the field looks identical on every visit. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SHAPE_COUNT = 5;

/**
 * Five point clouds the field morphs between while you scroll:
 * 0 sphere (the model), 1 wave (the data), 2 knot (the product),
 * 3 helix (the track record), 4 ring (the handshake).
 */
export function buildShapes(count: number) {
  const rnd = mulberry32(20261116);
  const shapes = Array.from({ length: SHAPE_COUNT }, () => new Float32Array(count * 3));
  const rand = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const r1 = rnd();
    const r2 = rnd();
    const r3 = rnd();
    rand.set([r1, r2, r3], i * 3);

    // 0. Fibonacci sphere with a thin shell
    {
      const y = 1 - t * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = golden * i;
      const shell = 1.55 + (r1 - 0.5) * 0.08 + (r2 > 0.94 ? r3 * 0.5 : 0);
      shapes[0].set([Math.cos(th) * rad * shell, y * shell, Math.sin(th) * rad * shell], i * 3);
    }

    // 1. Wave sheet (the shader adds the motion)
    {
      const cols = Math.ceil(Math.sqrt(count * 2.1));
      const rows = Math.ceil(count / cols);
      const cx = (i % cols) / (cols - 1) - 0.5;
      const cz = Math.floor(i / cols) / (rows - 1) - 0.5;
      const x = cx * 7.4;
      const z = cz * 3.8;
      const y = Math.sin(x * 1.25) * 0.34 + Math.cos(z * 2.1 + x * 0.6) * 0.26;
      shapes[1].set([x, y - 0.2, z], i * 3);
    }

    // 2. Trefoil knot tube
    {
      const u = t * Math.PI * 2 * 3 + r1 * 0.02;
      const p = 2;
      const q = 3;
      const k = u / 3;
      const cr = 0.95 + 0.42 * Math.cos(q * k);
      const bx = cr * Math.cos(p * k);
      const by = cr * Math.sin(p * k);
      const bz = 0.46 * Math.sin(q * k);
      const a = r2 * Math.PI * 2;
      const tube = 0.2 * Math.sqrt(r3);
      shapes[2].set(
        [
          (bx + Math.cos(a) * tube * Math.cos(p * k)) * 1.35,
          (by + Math.cos(a) * tube * Math.sin(p * k)) * 1.35,
          (bz + Math.sin(a) * tube) * 1.35,
        ],
        i * 3,
      );
    }

    // 3. Double helix with rungs
    {
      const y = (t - 0.5) * 5.4;
      const ang = t * Math.PI * 7;
      const strand = i % 2 === 0 ? 0 : Math.PI;
      const isRung = r1 > 0.72;
      if (isRung) {
        const snapped = Math.round(t * 34) / 34;
        const ya = (snapped - 0.5) * 5.4;
        const aa = snapped * Math.PI * 7;
        const s = (r2 - 0.5) * 2;
        shapes[3].set([Math.cos(aa) * 0.95 * s, ya, Math.sin(aa) * 0.95 * s], i * 3);
      } else {
        const j = 0.07;
        shapes[3].set(
          [
            Math.cos(ang + strand) * 0.95 + (r2 - 0.5) * j,
            y + (r3 - 0.5) * j,
            Math.sin(ang + strand) * 0.95 + (r1 - 0.5) * j,
          ],
          i * 3,
        );
      }
    }

    // 4. Halo: a dense ring with a faint spiral disc
    {
      const a = r1 * Math.PI * 2;
      const inner = r2 > 0.3;
      const rad = inner ? 1.75 + (r3 - 0.5) * 0.14 : 0.5 + Math.pow(r3, 0.6) * 2.5;
      const twist = inner ? 0 : rad * 0.9;
      shapes[4].set(
        [Math.cos(a + twist) * rad, (r2 - 0.5) * (inner ? 0.07 : 0.16), Math.sin(a + twist) * rad],
        i * 3,
      );
    }
  }

  return { shapes, rand };
}

export type Pose = {
  /** Offset as a fraction of the visible half-width / half-height. */
  x: number;
  y: number;
  scale: number;
  rx: number;
  ry: number;
  rz: number;
  spin: number;
  opacity: number;
};

export const poses: { desktop: Pose[]; mobile: Pose[] } = {
  desktop: [
    { x: 0.5, y: 0.02, scale: 1.12, rx: 0.15, ry: 0, rz: 0.1, spin: 0.09, opacity: 1 },
    { x: 0, y: -0.38, scale: 1.25, rx: 0.42, ry: 0.2, rz: 0, spin: 0, opacity: 0.6 },
    { x: 0.62, y: 0.3, scale: 0.92, rx: 0.5, ry: 0.3, rz: 0.2, spin: 0.07, opacity: 0.42 },
    { x: 0.72, y: 0, scale: 0.98, rx: 0.1, ry: 0, rz: -0.22, spin: 0.14, opacity: 0.55 },
    { x: 0, y: -0.1, scale: 1.5, rx: 1.12, ry: 0, rz: 0.12, spin: 0.05, opacity: 0.8 },
  ],
  mobile: [
    { x: 0.35, y: 0.42, scale: 0.78, rx: 0.15, ry: 0, rz: 0.1, spin: 0.09, opacity: 0.75 },
    { x: 0, y: -0.5, scale: 0.8, rx: 0.42, ry: 0.2, rz: 0, spin: 0, opacity: 0.45 },
    { x: 0.5, y: 0.5, scale: 0.6, rx: 0.5, ry: 0.3, rz: 0.2, spin: 0.07, opacity: 0.28 },
    { x: 0.85, y: 0, scale: 0.7, rx: 0.1, ry: 0, rz: -0.22, spin: 0.14, opacity: 0.32 },
    { x: 0, y: -0.25, scale: 0.85, rx: 1.12, ry: 0, rz: 0.12, spin: 0.05, opacity: 0.6 },
  ],
};
