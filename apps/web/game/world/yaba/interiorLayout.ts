// Pure interior data — colliders, spots and local↔world math with no React/three
// dependency, so camera occluders, the location registry and headless tests can
// reuse the exact same numbers the visuals are built from.
// Local frame: x in [-w/2, w/2], z in [-d/2, d/2], front (door side) at +z.

import type { Box } from "@/lib/collision";
import type { Plot } from "./layout";

export type LocalBox = { x: number; z: number; hx: number; hz: number };
export type LocalSpot = { id: string; title: string; detail: string; x: number; z: number; radius: number };

/** Rotate local (x,z) into world for a plot whose front faces (fx,fz). */
export function localToWorld(p: Plot, x: number, z: number): { x: number; z: number } {
  const yaw = Math.atan2(p.facing === "+x" ? 1 : p.facing === "-x" ? -1 : 0, p.facing === "+z" ? 1 : p.facing === "-z" ? -1 : 0);
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { x: p.x + x * c + z * s, z: p.z - x * s + z * c };
}

export function yawOfPlot(p: Plot): number {
  const fx = p.facing === "+x" ? 1 : p.facing === "-x" ? -1 : 0;
  const fz = p.facing === "+z" ? 1 : p.facing === "-z" ? -1 : 0;
  return Math.atan2(fx, fz);
}

/** Axis-aligned world box from a local box (yaw is a multiple of 90°). */
export function localBoxToWorld(p: Plot, b: LocalBox): Box {
  const straight = p.facing === "+z" || p.facing === "-z";
  const c = localToWorld(p, b.x, b.z);
  return { x: c.x, z: c.z, hx: straight ? b.hx : b.hz, hz: straight ? b.hz : b.hx };
}

/** Interior furniture colliders, derived alongside the visuals. */
export function interiorColliders(p: { w: number; d: number; interior: "restaurant" | "shop" | "apartment" | "office" }): LocalBox[] {
  if (p.interior === "restaurant") {
    return [
      { x: 0, z: -p.d / 2 + 1.6, hx: 2.2, hz: 0.4 },
      { x: -2.2, z: 0.6, hx: 1.3, hz: 1.3 },
      { x: 2.2, z: 0.6, hx: 1.3, hz: 1.3 },
    ];
  }
  if (p.interior === "shop") {
    const w = p.w - 0.7;
    const d = p.d - 0.7;
    return [
      { x: -1.4, z: -0.6, hx: 1.2, hz: 0.35 },
      { x: 1.4, z: -0.6, hx: 1.2, hz: 0.35 },
      { x: 0, z: -d / 2 + 0.9, hx: 1.8, hz: 0.45 },
      { x: -w / 2 + 1.3, z: d / 2 - 1.4, hx: 1.3, hz: 0.4 },
      { x: w / 2 - 0.6, z: -d / 2 + 0.9, hx: 0.5, hz: 0.4 },
    ];
  }
  if (p.interior === "office") {
    return [
      { x: 0, z: -p.d / 2 + 1.0, hx: 1.8, hz: 0.45 },
      { x: -2.4, z: -0.5, hx: 1.0, hz: 0.55 },
      { x: 2.4, z: -0.5, hx: 1.0, hz: 0.55 },
      { x: 0, z: 1.3, hx: 1.0, hz: 0.6 },
      { x: -3.8, z: 2.2, hx: 0.45, hz: 0.45 },
      { x: 3.8, z: 2.2, hx: 0.45, hz: 0.45 },
    ];
  }
  return [
    { x: 1.5, z: -2.4, hx: 3.6, hz: 0.09 },
    { x: 4.45, z: 2.6, hx: 1.55, hz: 0.09 },
    { x: -3.2, z: 1.2, hx: 1.2, hz: 0.48 },
    { x: -3.2, z: -1.3, hx: 0.8, hz: 0.23 },
    { x: 3.9, z: -3.4, hx: 1.0, hz: 1.5 },
    { x: 5.3, z: -3.4, hx: 0.45, hz: 1.1 },
    { x: -4.55, z: -4.55, hx: 1.6, hz: 0.4 },
    { x: 1.2, z: -5.0, hx: 1.3, hz: 0.45 },
    { x: 5.0, z: 4.5, hx: 0.35, hz: 0.35 },
    { x: -1.2, z: 2.2, hx: 0.3, hz: 0.3 },
  ];
}

export function interiorSpots(kind: "restaurant" | "shop" | "apartment" | "office"): LocalSpot[] {
  if (kind === "restaurant") {
    return [
      { id: "spot-counter", title: "Mama Put counter", detail: "Jollof ₦2,500 · Chicken ₦4,000 · Ordering opens soon.", x: 0, z: -1.4, radius: 2.4 },
      { id: "spot-table", title: "Family table", detail: "Saved seats for regulars.", x: -2.2, z: 0.6, radius: 2.2 },
    ];
  }
  if (kind === "shop") {
    return [
      { id: "spot-shelf", title: "Provision shelves", detail: "Rice, Indomie, Milo, detergent — restocking daily.", x: 0, z: -0.6, radius: 2.4 },
      { id: "spot-fridge", title: "Cold drinks", detail: "Chilled water and soft drinks.", x: 2.4, z: -2.6, radius: 2.2 },
    ];
  }
  if (kind === "office") {
    return [
      { id: "spot-reception", title: "CcHUB reception", detail: "Welcome to the innovation hub.", x: 0, z: -3.2, radius: 2.2 },
      { id: "spot-workspace", title: "Co-working desks", detail: "A shared space for Lagos builders.", x: 0, z: -0.5, radius: 2.4 },
      { id: "spot-meeting", title: "Meeting corner", detail: "Ideas and collaborations happen here.", x: 0, z: 2.1, radius: 2.2 },
    ];
  }
  return [
    { id: "spot-bed", title: "Bedroom", detail: "Your room — bed, wardrobe, window breeze.", x: 3.9, z: -1.4, radius: 2.4 },
    { id: "spot-kitchen", title: "Kitchen corner", detail: "Two-burner stove, pots, Egusi on Sundays.", x: -4.2, z: -3.6, radius: 2.4 },
    { id: "spot-sofa", title: "Sitting room", detail: "Match days happen here.", x: -3.2, z: 1.2, radius: 2.4 },
  ];
}
