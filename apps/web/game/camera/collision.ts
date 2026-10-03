// Pure third-person camera collision — no three.js import so headless tests can
// exercise the exact math the live camera uses.
//
// Model: cast a ray from the player's head toward the desired camera position.
// Against every inflated wall/furniture AABB, take the nearest entry distance.
// The camera is pulled in to (hit - margin), never pushed out, so smoothing the
// distance can only move the camera along already-verified free space.

export type Vec3 = { x: number; y: number; z: number };
export type Occluder = { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number };

/** Camera body radius (spherecast approx. via box inflation) + wall safety margin. */
export const CAMERA_RADIUS = 0.35;
export const CAMERA_MARGIN = 0.5;
/** Never closer than this — keeps a comfortable third-person frame indoors. */
export const MIN_CAMERA_DIST = 1.2;

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function len(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

/**
 * Ray vs inflated AABB (slab method). Returns entry distance along the
 * normalized direction, or null on miss. Boxes containing the origin are
 * ignored — the head is never supposed to be inside a wall.
 */
export function rayHitDistance(origin: Vec3, dir: Vec3, maxDist: number, box: Occluder, inflate: number): number | null {
  let tEnter = 0;
  let tExit = maxDist;
  const o = [origin.x, origin.y, origin.z];
  const d = [dir.x, dir.y, dir.z];
  const lo = [box.minX - inflate, box.minY - inflate, box.minZ - inflate];
  const hi = [box.maxX + inflate, box.maxY + inflate, box.maxZ + inflate];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      if (o[i] < lo[i] || o[i] > hi[i]) return null;
    } else {
      let t0 = (lo[i] - o[i]) / d[i];
      let t1 = (hi[i] - o[i]) / d[i];
      if (t0 > t1) [t0, t1] = [t1, t0];
      tEnter = Math.max(tEnter, t0);
      tExit = Math.min(tExit, t1);
      if (tEnter > tExit) return null;
    }
  }
  // Origin inside the box (or flush): ignore — head must stay authoritative.
  if (tEnter <= 1e-6) return null;
  return tEnter;
}

/** Nearest blocking distance along the ray, or maxDist when the path is clear. */
export function nearestBlockDistance(origin: Vec3, dir: Vec3, maxDist: number, boxes: Occluder[], inflate = CAMERA_RADIUS): number {
  let best = maxDist;
  for (const b of boxes) {
    const t = rayHitDistance(origin, dir, maxDist, b, inflate);
    if (t !== null && t < best) best = t;
  }
  return best;
}

/**
 * Collision-safe camera distance. Pulls the camera in front of the nearest
 * obstacle (minus a safety margin), clamped to a usable minimum.
 */
export function resolveCameraDistance(
  head: Vec3,
  desired: Vec3,
  boxes: Occluder[],
  opts?: { radius?: number; margin?: number; minDist?: number },
): number {
  const radius = opts?.radius ?? CAMERA_RADIUS;
  const margin = opts?.margin ?? CAMERA_MARGIN;
  const minDist = opts?.minDist ?? MIN_CAMERA_DIST;
  const delta = sub(desired, head);
  const full = len(delta);
  if (full < 1e-6) return minDist;
  const dir = { x: delta.x / full, y: delta.y / full, z: delta.z / full };
  const hit = nearestBlockDistance(head, dir, full, boxes, radius);
  return Math.max(minDist, Math.min(full, hit - margin));
}

/** Camera world position for a given distance along the head→desired ray. */
export function cameraPointAt(head: Vec3, desired: Vec3, dist: number): Vec3 {
  const delta = sub(desired, head);
  const full = len(delta);
  if (full < 1e-6) return { ...head };
  const s = dist / full;
  return { x: head.x + delta.x * s, y: head.y + delta.y * s, z: head.z + delta.z * s };
}
