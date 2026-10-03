// Pure click-to-move stepping — no three.js import so headless tests can drive
// the exact logic the live player controller uses.
//
// Contract: each frame the player turns toward the target and advances.
// Arrival (within reach radius) or a stuck detector stops the walk.

import { resolveCollision, type Box } from "@/lib/collision";

export type StepTarget = { x: number; z: number };

export type StepResult = {
  x: number;
  z: number;
  heading: number;
  /** true when the player reached the target this step */
  arrived: boolean;
};

/** Arrival radius — comfortably outside interaction range, inside intent. */
export const ARRIVE_RADIUS = 0.3;

function wrapAngle(d: number): number {
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * One movement step toward a click target. Turning blends at the same rate
 * as keyboard movement so tap-walks look identical to WASD walks.
 */
export function stepToward(
  pos: { x: number; z: number; heading: number },
  target: StepTarget,
  stepLen: number,
  turnRate = 12,
  dt = 1 / 60,
): StepResult {
  const dx = target.x - pos.x;
  const dz = target.z - pos.z;
  const dist = Math.hypot(dx, dz);
  if (dist <= ARRIVE_RADIUS) {
    return { x: pos.x, z: pos.z, heading: pos.heading, arrived: true };
  }
  const want = Math.atan2(dx, dz);
  const heading = pos.heading + wrapAngle(want - pos.heading) * Math.min(1, turnRate * dt);
  const move = Math.min(stepLen, dist);
  return {
    x: pos.x + Math.sin(heading) * move,
    z: pos.z + Math.cos(heading) * move,
    heading,
    arrived: move >= dist - 1e-9,
  };
}

/** Walkable rectangle (already shrunk by the caller's body margin). */
export type WalkBounds = { minX: number; maxX: number; minZ: number; maxZ: number };

function insideBounds(p: { x: number; z: number }, b: WalkBounds): boolean {
  return p.x >= b.minX && p.x <= b.maxX && p.z >= b.minZ && p.z <= b.maxZ;
}

/**
 * Validate a click destination against the room by simulating the real walk
 * (same turn rate, speed, wall-slide and stuck detection as the controller),
 * so validation can never reject a walk the player could actually make.
 * Returns the point to walk to, or null when nothing sensible is reachable:
 * - free point inside bounds → walk straight there
 * - blocked/outside point → walk to the closest reachable approach
 *   (e.g. clicking behind a table walks you around it to the table)
 * - no meaningful progress possible → reject; the character never clips
 *   through walls/furniture or leaves the room.
 */
export function findReachableTarget(
  from: { x: number; z: number },
  to: { x: number; z: number },
  colliders: Box[],
  bounds: WalkBounds,
  radius = 0.5,
): { x: number; z: number } | null {
  const direct = resolveCollision(to.x, to.z, radius, colliders);
  if (direct.x === to.x && direct.z === to.z && insideBounds(to, bounds)) {
    return { x: to.x, z: to.z };
  }
  const startDist = Math.hypot(to.x - from.x, to.z - from.z);
  if (startDist < 1e-9) return null;
  const stepLen = 5.2 / 60;
  const dt = 1 / 60;
  let sim = { x: from.x, z: from.z, heading: Math.atan2(to.x - from.x, to.z - from.z) };
  let best = { x: sim.x, z: sim.z };
  let bestD = startDist;
  let stuck = 0;
  let lastX = sim.x;
  let lastZ = sim.z;
  for (let i = 0; i < 600; i++) {
    const step = stepToward(sim, to, stepLen, 12, dt);
    if (!insideBounds({ x: step.x, z: step.z }, bounds)) break;
    const s = resolveCollision(step.x, step.z, radius, colliders);
    sim = { x: s.x, z: s.z, heading: step.heading };
    const d = Math.hypot(to.x - sim.x, to.z - sim.z);
    if (d < bestD) {
      bestD = d;
      best = { x: sim.x, z: sim.z };
    }
    if (d <= ARRIVE_RADIUS) break;
    const prog = Math.hypot(sim.x - lastX, sim.z - lastZ);
    lastX = sim.x;
    lastZ = sim.z;
    stuck = prog < stepLen * 0.25 ? stuck + dt : 0;
    if (stuck > 1.2) break;
  }
  if (startDist - bestD < 0.4) return null;
  return best;
}
