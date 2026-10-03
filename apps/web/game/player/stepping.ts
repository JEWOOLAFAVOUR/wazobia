// Pure click-to-move stepping — no three.js import so headless tests can drive
// the exact logic the live player controller uses.
//
// Contract: each frame the player turns toward the target and advances.
// Arrival (within reach radius) or a stuck detector stops the walk.

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
