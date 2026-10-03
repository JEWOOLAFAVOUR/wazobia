// Shared AABB collision — mirrors server bounds (movement/validation.go).
export type Box = { x: number; z: number; hx: number; hz: number };

export const WORLD_BOUND = 55;

export function buildingsToBoxes(
  buildings: { x: number; z: number }[],
  half = 3.4,
): Box[] {
  return buildings.map((b) => ({ x: b.x, z: b.z, hx: half, hz: half }));
}

export function resolveCollision(
  px: number,
  pz: number,
  radius: number,
  boxes: Box[],
): { x: number; z: number } {
  let x = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, px));
  let z = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, pz));
  for (const b of boxes) {
    const dx = x - b.x;
    const dz = z - b.z;
    const ox = b.hx + radius - Math.abs(dx);
    const oz = b.hz + radius - Math.abs(dz);
    if (ox > 0 && oz > 0) {
      if (ox < oz) x = b.x + Math.sign(dx || 1) * (b.hx + radius);
      else z = b.z + Math.sign(dz || 1) * (b.hz + radius);
    }
  }
  return { x, z };
}

export function nearestBuilding(
  px: number,
  pz: number,
  buildings: { x: number; z: number; name: string; id: string; kind: string }[],
  maxDist = 5,
) {
  let best: { d: number; b: (typeof buildings)[number] } | null = null;
  for (const b of buildings) {
    const d = Math.hypot(px - b.x, pz - b.z);
    if (d <= maxDist && (!best || d < best.d)) best = { d, b };
  }
  return best;
}
