"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { EntryPos } from "@/game/player/EntryPlayer";

/**
 * Third-person orbit-follow camera.
 * Drag / right-drag orbits (touch drag included via pointer events).
 * Wheel zooms 4–10m. Collides against a simple ground clamp only (v1).
 * Touch movement sticks come later — input writes to posRef so they slot in.
 */
export default function EntryCamera({ posRef }: { posRef: React.MutableRefObject<EntryPos> }) {
  const { camera, gl } = useThree();
  const look = useRef(new THREE.Vector3());
  const orbit = useRef({ yaw: Math.PI, pitch: 0.42, dist: 7 });
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
      orbit.current.pitch = Math.max(0.12, Math.min(1.1, orbit.current.pitch + dy * 0.004));
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
    const target = new THREE.Vector3(p.x, 1.4, p.z);
    const desired = new THREE.Vector3(
      target.x + Math.sin(yaw) * Math.cos(pitch) * dist,
      target.y + Math.sin(pitch) * dist,
      target.z + Math.cos(yaw) * Math.cos(pitch) * dist,
    );
    desired.y = Math.max(1.6, desired.y);
    camera.position.lerp(desired, 1 - Math.exp(-5 * dt));
    look.current.lerp(target, 1 - Math.exp(-8 * dt));
    camera.lookAt(look.current);
  });

  return null;
}
