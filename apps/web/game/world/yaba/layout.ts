// Yaba block layout — the single source of truth for the playable area.
// Geometry, collisions and interaction all derive from this file (Phase 2 Step 1-2).
// Metric, y-up. +x = east, +z = south. Player walks on x/z.

export type Axis = "x" | "z";

export type RoadSpec = {
  id: string;
  axis: Axis; // "x" = runs along x (east-west), "z" = runs along z (north-south)
  /** centre line position on the perpendicular axis */
  center: number;
  width: number;
  from: number;
  to: number;
  main: boolean;
};

export type BuildingKind =
  | "shop"
  | "restaurant"
  | "house"
  | "apartment"
  | "office"
  | "bank"
  | "church"
  | "mosque"
  | "club";

/** Direction the building front faces. */
export type Facing = "+z" | "-z" | "+x" | "-x";

export type Plot = {
  id: string;
  kind: BuildingKind;
  name: string;
  /** footprint centre */
  x: number;
  z: number;
  /** footprint width (along the facing axis) and depth (away from street) */
  w: number;
  d: number;
  height: number;
  facing: Facing;
  /** false = decorative landmark, not enterable */
  enterable: boolean;
  /** interior template id, when enterable */
  interior?: "restaurant" | "shop" | "apartment" | "office";
};

export const SIDEWALK_W = 2.4;
export const CURB_W = 0.3;
export const DRAIN_W = 0.7;

/** Playable area bounds (blocks the player at the edge of the neighbourhood). */
export const AREA_BOUND = { minX: -46, maxX: 46, minZ: -46, maxZ: 46 };

export const ROADS: RoadSpec[] = [
  { id: "herbert-macaulay", axis: "x", center: 0, width: 9, from: -46, to: 46, main: true },
  { id: "cross-street", axis: "z", center: 0, width: 8, from: -46, to: 46, main: false },
  { id: "back-lane", axis: "x", center: -26, width: 6, from: -46, to: 46, main: false },
];

/** Sidewalk strip centre-lines, derived from the road list. */
export function sidewalkLines(road: RoadSpec): { off: number; len: number }[] {
  const off = road.width / 2 + CURB_W + SIDEWALK_W / 2;
  return [
    { off: -off, len: road.to - road.from },
    { off, len: road.to - road.from },
  ];
}

/** Outer edge of the sidewalk band (where plot frontage begins). */
export function frontageEdge(road: RoadSpec): number {
  return road.width / 2 + CURB_W + SIDEWALK_W;
}

export const SPAWN = { x: 24, z: 9, facing: Math.PI };

// Frontage lines: just inside the sidewalk outer edge, so doors face the street.
const MAIN = frontageEdge(ROADS[0]); // 4.5 + 0.3 + 2.4 = 7.2
const CROSS = frontageEdge(ROADS[1]); // 4.0 + 0.3 + 2.4 = 6.7
const LANE = frontageEdge(ROADS[2]); // 3.0 + 0.3 + 2.4 = 5.7

/**
 * Plots are placed on street frontage, not at magic coordinates.
 * Block A/C hug the main street, B hugs the back lane, D/E face the south kerb.
 */
export const PLOTS: Plot[] = [
  // North side of Herbert Macaulay Way, east of the cross street (block A)
  { id: "shop-1", kind: "shop", name: "Corner Provisions", x: 13, z: -(MAIN + 4.5), w: 8.5, d: 9, height: 4.2, facing: "+z", enterable: true, interior: "shop" },
  { id: "shop-2", kind: "shop", name: "Bola Phone & Repair", x: 23.5, z: -(MAIN + 4.5), w: 8.5, d: 9, height: 4.2, facing: "+z", enterable: false },
  { id: "rest-1", kind: "restaurant", name: "Mama Put Spot", x: 34, z: -(MAIN + 5), w: 9.5, d: 10, height: 4.6, facing: "+z", enterable: true, interior: "restaurant" },

  // North side, west of the cross street (block C)
  { id: "house-1", kind: "house", name: "Adeyemi Compound", x: -13, z: -(MAIN + 5.5), w: 12, d: 11, height: 6.2, facing: "+z", enterable: false },
  { id: "apt-1", kind: "apartment", name: "Sunrise Flats", x: -29, z: -(MAIN + 6), w: 13, d: 12, height: 9.4, facing: "+z", enterable: true, interior: "apartment" },

  // South side of the main street, west (block D)
  { id: "office-1", kind: "office", name: "CcHUB Lagos", x: -14, z: MAIN + 5, w: 10.5, d: 10, height: 8.5, facing: "-z", enterable: true, interior: "office" },
  { id: "bank-1", kind: "bank", name: "Wazobia Microfinance", x: -28, z: MAIN + 5, w: 10, d: 10, height: 7.2, facing: "-z", enterable: false },

  // South side, east (block E)
  { id: "church-1", kind: "church", name: "St. Dominic's", x: 14, z: MAIN + 7, w: 13, d: 15, height: 11, facing: "-z", enterable: false },
  { id: "club-1", kind: "club", name: "The Vault Lounge", x: 31, z: MAIN + 5.5, w: 11, d: 11, height: 6.5, facing: "-z", enterable: false },

  // Facing the back lane (block B)
  { id: "mosque-1", kind: "mosque", name: "Yaba Central Mosque", x: 16, z: -(LANE + 7), w: 14, d: 13, height: 10.5, facing: "+z", enterable: false },
  { id: "bldg-b2", kind: "apartment", name: "Unity Court", x: -16, z: -(LANE + 6.5), w: 12, d: 12, height: 8.8, facing: "+z", enterable: false },
];

export function plotFacingVector(facing: Facing): { fx: number; fz: number } {
  switch (facing) {
    case "+z":
      return { fx: 0, fz: 1 };
    case "-z":
      return { fx: 0, fz: -1 };
    case "+x":
      return { fx: 1, fz: 0 };
    case "-x":
      return { fx: -1, fz: 0 };
  }
}

/** Area registry (Phase 8 streams these; the slice keeps one active area). */
export type Area = {
  id: string;
  name: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
};

export const AREAS: Area[] = [
  { id: "yaba-market", name: "Yaba Market Road", bounds: { ...AREA_BOUND } },
];

export function areaAt(x: number, z: number): Area | null {
  return AREAS.find((a) => x >= a.bounds.minX && x <= a.bounds.maxX && z >= a.bounds.minZ && z <= a.bounds.maxZ) ?? null;
}

export function plotAt(x: number, z: number): Plot | null {
  return PLOTS.find((p) => Math.abs(x - p.x) <= p.w / 2 && Math.abs(z - p.z) <= p.d / 2) ?? null;
}
