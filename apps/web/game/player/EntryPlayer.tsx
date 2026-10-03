"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { resolveCollision, type Box } from "@/lib/collision";
import { stepToward, type StepTarget } from "@/game/player/stepping";
import { SimpleAvatar } from "@/game/character/SimpleAvatar";
import type { Avatar } from "@/game/character/wardrobe";

export type EntryPos = { x: number; z: number; heading: number };

type Props = {
  avatar: Avatar;
  initial: EntryPos;
  posRef: React.MutableRefObject<EntryPos>;
  colliders: Box[];
  onMove?: (x: number, z: number, moving: boolean) => void;
  onInteractKey?: () => void;
  /** Click/tap destination. Manual input overrides it; arrival clears it. */
  moveTargetRef?: React.MutableRefObject<StepTarget | null>;
  /** Fires when a click-walk arrives or is overridden — used to clear markers. */
  onTargetDone?: () => void;
};

function isTypingTarget(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

/** Local-only controller. Multiplayer later replaces posRef writes with server state. */
export default function EntryPlayer({ avatar, initial, posRef, colliders, onMove, onInteractKey, moveTargetRef, onTargetDone }: Props) {
  const group = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const heading = useRef(initial.heading);
  const onMoveRef = useRef(onMove);
  const onInteractRef = useRef(onInteractKey);
  const onTargetDoneRef = useRef(onTargetDone);
  const collidersRef = useRef(colliders);
  const stuckFor = useRef(0);
  const lastWalk = useRef({ x: initial.x, z: initial.z });
  useEffect(() => {
    onMoveRef.current = onMove;
    onInteractRef.current = onInteractKey;
    onTargetDoneRef.current = onTargetDone;
    collidersRef.current = colliders;
  }, [onMove, onInteractKey, onTargetDone, colliders]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Never steal keys while the user is typing in chat / sheets.
      if (isTypingTarget()) return;
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      if (["w", "a", "s", "d", " ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        e.preventDefault();
      }
      if (k === "e") onInteractRef.current?.();
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const k = keys.current;
    const sprint = k["shift"] ? 1.6 : 1;
    const speed = 5.2 * sprint * dt;
    const fwd = (k["w"] || k["arrowup"] ? 1 : 0) - (k["s"] || k["arrowdown"] ? 1 : 0);
    const strafe = (k["d"] || k["arrowright"] ? 1 : 0) - (k["a"] || k["arrowleft"] ? 1 : 0);
    const manual = fwd !== 0 || strafe !== 0;
    let moving = manual;
    if (manual) {
      // Manual input always wins — drop any click destination.
      if (moveTargetRef?.current) {
        moveTargetRef.current = null;
        stuckFor.current = 0;
        onTargetDoneRef.current?.();
      }
      // Camera-relative: camera sits behind player at orbit yaw. Approximate with heading + input.
      const targetHeading = Math.atan2(strafe, fwd);
      // Blend toward input direction smoothly.
      let d = targetHeading - heading.current;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      heading.current += d * Math.min(1, 12 * dt);
      const nx = posRef.current.x + Math.sin(heading.current) * speed * Math.hypot(fwd, strafe);
      const nz = posRef.current.z + Math.cos(heading.current) * speed * Math.hypot(fwd, strafe);
      const solved = resolveCollision(nx, nz, 0.5, collidersRef.current);
      posRef.current.x = solved.x;
      posRef.current.z = solved.z;
      posRef.current.heading = heading.current;
    } else if (moveTargetRef?.current) {
      // Click-to-move: turn toward the marker and advance; walls slide us along.
      const step = stepToward(posRef.current, moveTargetRef.current, speed, 12, dt);
      const solved = resolveCollision(step.x, step.z, 0.5, collidersRef.current);
      const progressed = Math.hypot(solved.x - lastWalk.current.x, solved.z - lastWalk.current.z);
      lastWalk.current = { x: solved.x, z: solved.z };
      stuckFor.current = progressed < speed * 0.25 ? stuckFor.current + dt : 0;
      posRef.current.x = solved.x;
      posRef.current.z = solved.z;
      posRef.current.heading = step.heading;
      heading.current = step.heading;
      moving = true;
      if (step.arrived || stuckFor.current > 1.2) {
        moveTargetRef.current = null;
        stuckFor.current = 0;
        moving = false;
        onTargetDoneRef.current?.();
      }
    }
    if (group.current) {
      group.current.position.set(posRef.current.x, 0, posRef.current.z);
      group.current.rotation.y = heading.current;
    }
    onMoveRef.current?.(posRef.current.x, posRef.current.z, moving);
  });

  return (
    <group ref={group} position={[initial.x, 0, initial.z]} rotation={[0, initial.heading, 0]}>
      <SimpleAvatar avatar={avatar} />
      {/* soft contact disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
