// Derives collisions, doors and interactables from the layout — never hand-typed.
// Enterable plots collide as 4 WALLS with a gap at the door, so the player can
// physically walk through the entrance. Decorative plots collide as one solid.

import type { Box } from "@/lib/collision";
import { AREA_BOUND, PLOTS, ROADS, SIDEWALK_W, CURB_W, DRAIN_W, frontageEdge, plotFacingVector, type Plot } from "./layout";

export const WALL_T = 0.3;
export const DOOR_W = 2.2;

export type Door = {
  id: string;
  plotId: string;
  name: string;
  interior: "restaurant" | "shop" | "apartment" | "office";
  /** centre of the doorway, on the front face */
  x: number;
  z: number;
  /** outward unit normal (toward the street) */
  nx: number;
  nz: number;
  width: number;
};

export type Interactable = {
  id: string;
  title: string;
  detail: string;
  x: number;
  z: number;
  radius: number;
};

function box(minX: number, minZ: number, maxX: number, maxZ: number): Box {
  return { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2, hx: (maxX - minX) / 2, hz: (maxZ - minZ) / 2 };
}

/** Four walls with a doorway gap punched in the frontage wall. */
export function wallBoxes(p: Plot): Box[] {
  const { fx, fz } = plotFacingVector(p.facing);
  const halfW = p.w / 2;
  const halfD = p.d / 2;
  const minX = p.x - halfW;
  const maxX = p.x + halfW;
  const minZ = p.z - halfD;
  const maxZ = p.z + halfD;
  const out: Box[] = [];
  const frontIsZ = fx === 0; // frontage runs along z when facing +/-z

  if (frontIsZ) {
    // frontage wall (the one with the door), split around the opening
    const fz0 = fz > 0 ? maxZ - WALL_T : minZ;
    const fz1 = fz > 0 ? maxZ : minZ + WALL_T;
    const gapA = p.x - DOOR_W / 2;
    const gapB = p.x + DOOR_W / 2;
    out.push(box(minX, fz0, gapA, fz1));
    out.push(box(gapB, fz0, maxX, fz1));
    // rear wall
    const bz0 = fz > 0 ? minZ : maxZ - WALL_T;
    const bz1 = fz > 0 ? minZ + WALL_T : maxZ;
    out.push(box(minX, bz0, maxX, bz1));
    // side walls
    out.push(box(minX, minZ, minX + WALL_T, maxZ));
    out.push(box(maxX - WALL_T, minZ, maxX, maxZ));
  } else {
    const fx0 = fx > 0 ? maxX - WALL_T : minX;
    const fx1 = fx > 0 ? maxX : minX + WALL_T;
    const gapA = p.z - DOOR_W / 2;
    const gapB = p.z + DOOR_W / 2;
    out.push(box(fx0, minZ, fx1, gapA));
    out.push(box(fx0, gapB, fx1, maxZ));
    const bx0 = fx > 0 ? minX : maxX - WALL_T;
    const bx1 = fx > 0 ? minX + WALL_T : maxX;
    out.push(box(bx0, minZ, bx1, maxZ));
    out.push(box(minX, minZ, maxX, minZ + WALL_T));
    out.push(box(minX, maxZ - WALL_T, maxX, maxZ));
  }
  return out;
}

export function plotColliders(p: Plot): Box[] {
  if (p.enterable) return wallBoxes(p);
  return [box(p.x - p.w / 2, p.z - p.d / 2, p.x + p.w / 2, p.z + p.d / 2)];
}

/** Door trigger sits just outside the wall, facing the street. */
export function plotDoor(p: Plot): Door | null {
  if (!p.enterable || !p.interior) return null;
  const { fx, fz } = plotFacingVector(p.facing);
  return {
    id: `door-${p.id}`,
    plotId: p.id,
    name: p.name,
    interior: p.interior,
    x: p.x + fx * (p.d / 2),
    z: p.z + fz * (p.d / 2),
    nx: fx,
    nz: fz,
    width: DOOR_W,
  };
}

/** Outer perimeter of the neighbourhood, so the player cannot walk off the map. */
export function areaWalls(): Box[] {
  const t = 1;
  return [
    box(AREA_BOUND.minX - t, AREA_BOUND.minZ - t, AREA_BOUND.minX, AREA_BOUND.maxZ + t),
    box(AREA_BOUND.maxX, AREA_BOUND.minZ - t, AREA_BOUND.maxX + t, AREA_BOUND.maxZ + t),
    box(AREA_BOUND.minX, AREA_BOUND.minZ - t, AREA_BOUND.maxX, AREA_BOUND.minZ),
    box(AREA_BOUND.minX, AREA_BOUND.maxZ, AREA_BOUND.maxX, AREA_BOUND.maxZ + t),
  ];
}

export const BUILDING_COLLIDERS: Box[] = [
  ...areaWalls(),
  ...PLOTS.flatMap(plotColliders),
];

export const DOORS: Door[] = PLOTS.map(plotDoor).filter((d): d is Door => d !== null);

export const DOOR_INTERACTABLES: Interactable[] = DOORS.map((d) => ({
  id: d.id,
  title: d.name,
  detail: "Walk in through the open door.",
  x: d.x + d.nx * 1.6,
  z: d.z + d.nz * 1.6,
  radius: 2.6,
}));

/** Street furniture markers derived from the road list (poles, drains, kerbs). */
export type StreetPiece = { id: string; kind: "pole" | "light" | "drain" | "bin"; x: number; z: number; rot: number };

export function streetPieces(): StreetPiece[] {
  const out: StreetPiece[] = [];
  for (const r of ROADS) {
    const edge = r.width / 2 + CURB_W;
    const step = 14;
    for (let a = r.from + 8; a <= r.to - 8; a += step) {
      const side = ((a / step) | 0) % 2 === 0 ? -1 : 1;
      const off = side * (edge + 1.1);
      if (r.axis === "x") {
        out.push({ id: `${r.id}-pole-${a}`, kind: "pole", x: a, z: off, rot: 0 });
        out.push({ id: `${r.id}-bin-${a}`, kind: "bin", x: a + step / 2, z: -off, rot: 0 });
      } else {
        out.push({ id: `${r.id}-pole-${a}`, kind: "pole", x: off, z: a, rot: Math.PI / 2 });
        out.push({ id: `${r.id}-bin-${a}`, kind: "bin", x: -off, z: a + step / 2, rot: 0 });
      }
    }
  }
  return out;
}

export { SIDEWALK_W, CURB_W, DRAIN_W, frontageEdge };
