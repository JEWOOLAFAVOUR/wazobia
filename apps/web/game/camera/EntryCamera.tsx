"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cameraPointAt, resolveCameraDistance, type Occluder, type Vec3 } from "@/game/camera/collision";
import type { EntryPos } from "@/game/player/EntryPlayer";

const HEAD_HEIGHT = 1.5;
const MIN_Y = 0.6;

/**
 * Third-person orbit-follow camera with wall collision.
 * Drag orbits (left button / touch), wheel zooms 4–11m.
 * A ray from the player's head to the desired position is tested against wall
 * / roof / furniture boxes: the camera pulls in front of obstacles (with a
 * safety margin) instead of clipping through them, indoors and outdoors.
 * Pull-in is immediate (never beyond a wall); zoom-out eases back smoothly.
 */
export default function EntryCamera({
  posRef,
  occluders,
  maxPitch = 1.1,
}: {
  posRef: React.MutableRefObject<EntryPos>;
  occluders?: Occluder[];
  /** Higher values allow a dollhouse top-down view (home interiors). */
  maxPitch?: number;
}) {
  const { camera, gl } = useThree();
  const look = useRef(new THREE.Vector3());
  const orbit = useRef({ yaw: Math.PI, pitch: 0.42, dist: 7 });
  const pitchMax = useRef(maxPitch);
  useEffect(() => {
    pitchMax.current = maxPitch;
  }, [maxPitch]);
  const effDist = useRef(7);
  const boxes = useRef<Occluder[]>(occluders ?? []);
  useEffect(() => {
    boxes.current = occluders ?? [];
  }, [occluders]);
  const posRefProp = useRef(posRef);
  useEffect(() => {
    posRefProp.current = posRef;
  }, [posRef]);

  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lx = 0;
    let ly = 0;
    const down = (e: PointerEvent) => {
      // Left-button drags only — right/middle clicks and UI overlay clicks pass through.
      // Ignore drags that start on venue labels / HUD (they are pointer-transparent now,
      // but drei Html nodes can still be hit).
      const t = e.target as HTMLElement | null;
      if (e.button !== 0) return;
      if (t && t.closest && t.closest(".venue-label")) return;
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      orbit.current.yaw -= dx * 0.005;
      orbit.current.pitch = Math.max(0.12, Math.min(pitchMax.current, orbit.current.pitch + dy * 0.004));
    };
    const up = () => {
      dragging = false;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      // Trackpads fire wheel with large deltas (and ctrlKey for pinch) — normalize so zoom doesn't jump.
      const unit = e.deltaMode === 1 ? 16 : 1;
      const step = e.ctrlKey ? 0.02 : 0.004;
      orbit.current.dist = Math.max(4, Math.min(11, orbit.current.dist + e.deltaY * unit * step));
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const p = posRefProp.current.current;
    const { yaw, pitch, dist } = orbit.current;
    const head: Vec3 = { x: p.x, y: HEAD_HEIGHT, z: p.z };
    const rawDesired: Vec3 = {
      x: p.x + Math.sin(yaw) * Math.cos(pitch) * dist,
      y: HEAD_HEIGHT + Math.sin(pitch) * dist,
      z: p.z + Math.cos(yaw) * Math.cos(pitch) * dist,
    };
    rawDesired.y = Math.max(1.6, rawDesired.y);
    // Collision-safe distance along the same ray, then smooth only outwards:
    // effDist never exceeds the safe target, so the camera can't sit in a wall.
    const safe = resolveCameraDistance(head, rawDesired, boxes.current);
    const cur = effDist.current;
    const next = safe < cur ? safe : cur + (safe - cur) * Math.min(1, 5 * dt);
    effDist.current = Math.min(next, safe);
    const at = cameraPointAt(head, rawDesired, effDist.current);
    at.y = Math.max(MIN_Y, at.y);
    camera.position.lerp(new THREE.Vector3(at.x, at.y, at.z), 1 - Math.exp(-18 * dt));
    look.current.lerp(new THREE.Vector3(p.x, 1.4, p.z), 1 - Math.exp(-8 * dt));
    camera.lookAt(look.current);
  });

  return null;
}
