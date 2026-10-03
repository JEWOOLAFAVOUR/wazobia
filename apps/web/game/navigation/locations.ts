// Reusable world navigation — the ONLY place Home/map UI resolves "go to X".
//
// Home (or any caller) requests `navigateToLocation("rest-1")` and gets back a
// concrete spawn. Positions derive from world data (layout + doors), never
// from UI components, so every button shares one teleport implementation.
//
// Spawn rules:
// - public buildings  → doorstep outside the entrance, facing the door
// - player's property → just inside the entrance, facing into the room
// - landmarks         → on the street frontage, facing the building

import { AREA_BOUND, PLOTS, plotFacingVector, type Plot } from "@/game/world/yaba/layout";
import { plotDoor } from "@/game/world/yaba/derive";

export type AreaId = "yaba-street" | "home-interior";

export type WorldLocation = {
  id: string;
  label: string;
  detail: string;
  areaId: AreaId;
  x: number;
  z: number;
  /** heading (radians) the player faces after arriving — EntryPlayer convention */
  heading: number;
};

/** The player's flat, recentered at the origin like HomeWorld renders it. */
export const HOME_PLOT: Plot = (() => {
  const p = PLOTS.find((x) => x.id === "apt-1") ?? PLOTS[0];
  return { ...p, x: 0, z: 0, facing: "+z" as const };
})();

/** Interior spawn: just inside the flat's entrance, facing into the room. */
export const HOME_SPAWN = { x: 0, z: 3.3, heading: Math.PI };

/** How far outside the wall face a doorstep spawn sits (player radius 0.5 + margin). */
export const DOORSTEP_OUT = 2.6;

function faceToward(dx: number, dz: number): number {
  return Math.atan2(dx, dz);
}

/** Doorstep outside a plot's entrance, facing the door. Never inside a wall. */
export function doorstepOf(p: Plot, out = DOORSTEP_OUT): { x: number; z: number; heading: number } {
  const door = plotDoor(p);
  if (door) {
    return {
      x: door.x + door.nx * out,
      z: door.z + door.nz * out,
      heading: faceToward(-door.nx, -door.nz),
    };
  }
  // Decorative plots have no door gap — use the street frontage instead.
  const { fx, fz } = plotFacingVector(p.facing);
  return {
    x: p.x + fx * (p.d / 2 + out),
    z: p.z + fz * (p.d / 2 + out),
    heading: faceToward(-fx, -fz),
  };
}

/** Adeyemi Compound is ringed by its own gate wall — spawn at the gate, not the house wall. */
function compoundGate(): { x: number; z: number; heading: number } {
  const p = PLOTS.find((x) => x.id === "house-1");
  if (!p) return { x: -13, z: -3, heading: Math.PI };
  const { fx, fz } = plotFacingVector(p.facing);
  const gateX = p.x + fx * (p.d / 2 + 2);
  const gateZ = p.z + fz * (p.d / 2 + 2);
  return { x: gateX + fx * 2.2, z: gateZ + fz * 2.2, heading: faceToward(-fx, -fz) };
}

function streetLocation(p: Plot, detail: string): WorldLocation {
  const s = p.id === "house-1" ? compoundGate() : doorstepOf(p);
  return { id: p.id, label: p.name, detail, areaId: "yaba-street", ...s };
}

/** Everywhere Home can send the player. Order = menu order. */
export function buildLocations(): WorldLocation[] {
  const byId = new Map(PLOTS.map((p) => [p.id, p]));
  const pick = (id: string): Plot | null => byId.get(id) ?? null;
  const out: WorldLocation[] = [
    { id: "home", label: "My Apartment", detail: "Sunrise Flats · your room", areaId: "home-interior", ...HOME_SPAWN },
  ];
  const pub: [string, string][] = [
    ["rest-1", "Mama Put Spot · jollof & family table"],
    ["shop-1", "Corner Provisions · daily needs"],
    ["apt-1", "Sunrise Flats entrance"],
  ];
  for (const [id, detail] of pub) {
    const p = pick(id);
    if (p) out.push(streetLocation(p, detail));
  }
  const land = ["shop-2", "house-1", "office-1", "bank-1", "church-1", "mosque-1", "club-1", "bldg-b2"];
  for (const id of land) {
    const p = pick(id);
    if (p) out.push(streetLocation(p, p.name));
  }
  return out;
}

export const LOCATIONS: WorldLocation[] = buildLocations();

/**
 * Resolve a location id to a concrete spawn. Returns null for unknown ids —
 * callers fall back to leaving the player where they are.
 */
export function navigateToLocation(id: string): WorldLocation | null {
  return LOCATIONS.find((l) => l.id === id) ?? null;
}

/** Sanity helper for tests: spawns must sit inside the playable area. */
export function isInsideArea(l: WorldLocation): boolean {
  return l.x >= AREA_BOUND.minX && l.x <= AREA_BOUND.maxX && l.z >= AREA_BOUND.minZ && l.z <= AREA_BOUND.maxZ;
}
