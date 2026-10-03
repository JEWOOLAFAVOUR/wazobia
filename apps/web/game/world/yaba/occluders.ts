// Camera occluders derived from the same layout data as the visible walls, so
// what blocks the camera is exactly what the player sees. Pure module (no
// three.js) shared by the live camera and headless tests.

import { PLOTS } from "./layout";
import type { Plot } from "./layout";
import { wallBoxes } from "./derive";
import { interiorColliders, localBoxToWorld } from "./interiorLayout";
import { HOME_PLOT } from "@/game/navigation/locations";
import type { Occluder } from "@/game/camera/collision";
import type { Box } from "@/lib/collision";

export const ENTERABLE_WALL_H = 3.6;

function flat(b: Box, y0: number, y1: number): Occluder {
  return { minX: b.x - b.hx, minY: y0, minZ: b.z - b.hz, maxX: b.x + b.hx, maxY: y1, maxZ: b.z + b.hz };
}

/** Roof/cap slab so a high camera stays above the roof instead of seeing through it. */
function roofSlab(plotId: string, cx: number, cz: number, w: number, d: number, wallH: number): Occluder {
  return {
    minX: cx - (w + 0.4) / 2,
    minY: wallH,
    minZ: cz - (d + 0.4) / 2,
    maxX: cx + (w + 0.4) / 2,
    maxY: wallH + 0.5,
    maxZ: cz + (d + 0.4) / 2,
  };
}

// Furniture heights pair 1:1 with interiorColliders() order per kind — see
// interiorLayout.ts. If that order changes, update these arrays together.
const FURNITURE_H: Record<string, number[]> = {
  restaurant: [1.2, 0.8, 0.8],
  shop: [1.6, 1.6, 1.6, 1.2, 2.0],
  apartment: [2.7, 2.7, 1.1, 1.4, 0.75, 2.0, 1.2, 1.8, 1.2, 0.5],
};

function furniture(plot: Plot, dims: { w: number; d: number; interior: "restaurant" | "shop" | "apartment" }): Occluder[] {
  const boxes = interiorColliders(dims);
  const heights = FURNITURE_H[dims.interior] ?? [];
  return boxes.map((b, i) => flat(localBoxToWorld(plot, b), 0, heights[i] ?? 1.2));
}

/** Adeyemi Compound gate walls (mirrors CompoundWalls in Hood.tsx). */
function compoundOccluders(): Occluder[] {
  const p = PLOTS.find((x) => x.id === "house-1");
  if (!p) return [];
  const h = 2.35;
  const hw = p.w / 2 + 2;
  const hd = p.d / 2 + 2;
  const t = 0.3;
  const out: Occluder[] = [];
  // rear + sides
  out.push({ minX: p.x - hw, minY: 0, minZ: p.z - hd - t / 2, maxX: p.x + hw, maxY: h, maxZ: p.z - hd + t / 2 });
  for (const s of [-1, 1]) {
    out.push({ minX: p.x + s * hw - t / 2, minY: 0, minZ: p.z - hd, maxX: p.x + s * hw + t / 2, maxY: h, maxZ: p.z + hd });
    // front splits around the 3m gate
    const cx = p.x + s * (1.5 + (hw - 1.5) / 2);
    out.push({ minX: cx - (hw - 1.5) / 2, minY: 0, minZ: p.z + hd - t / 2, maxX: cx + (hw - 1.5) / 2, maxY: h, maxZ: p.z + hd + t / 2 });
    // gate posts
    out.push({ minX: p.x + s * 1.7 - 0.2, minY: 0, minZ: p.z + hd - 0.2, maxX: p.x + s * 1.7 + 0.2, maxY: 2.8, maxZ: p.z + hd + 0.2 });
  }
  return out;
}

/** Full street-scene occluders: building walls + roofs + compound + interiors. */
export function streetOccluders(): Occluder[] {
  const out: Occluder[] = [];
  for (const p of PLOTS) {
    const h = p.enterable ? ENTERABLE_WALL_H : p.height;
    for (const b of wallBoxes(p)) out.push(flat(b, 0, h));
    out.push(roofSlab(p.id, p.x, p.z, p.w, p.d, h));
    if (p.enterable && p.interior) {
      out.push(...furniture(p, { w: p.w - 0.7, d: p.d - 0.7, interior: p.interior }));
    }
  }
  out.push(...compoundOccluders());
  return out;
}

/** Home-interior occluders for the recentered flat. Roofless by default so a
 *  top-down camera can see the room (matches PlotShell roof={false}). */
export function homeOccluders(opts?: { roof?: boolean }): Occluder[] {
  const out: Occluder[] = [];
  for (const b of wallBoxes(HOME_PLOT)) out.push(flat(b, 0, ENTERABLE_WALL_H));
  // Closed front door leaf — matches the visual panel + movement blocker so
  // neither the player nor an eye-level camera can slip through the gap.
  out.push({
    minX: HOME_PLOT.x - 1.3,
    minY: 0,
    minZ: HOME_PLOT.z + HOME_PLOT.d / 2 - 0.25,
    maxX: HOME_PLOT.x + 1.3,
    maxY: 2.7,
    maxZ: HOME_PLOT.z + HOME_PLOT.d / 2 + 0.25,
  });
  if (opts?.roof ?? false) {
    out.push(roofSlab(HOME_PLOT.id, HOME_PLOT.x, HOME_PLOT.z, HOME_PLOT.w, HOME_PLOT.d, ENTERABLE_WALL_H));
  }
  out.push(...furniture(HOME_PLOT, { w: HOME_PLOT.w - 0.7, d: HOME_PLOT.d - 0.7, interior: "apartment" }));
  return out;
}
