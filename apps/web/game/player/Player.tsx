"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { buildingsToBoxes, resolveCollision } from "@/lib/collision";
import type { Building } from "@/lib/api";
import type { RemotePlayer } from "@/game/networking/useSocket";

export type Pos = { x: number; z: number };

export function LocalPlayer({
  posRef,
  buildings,
  onMove,
}: {
  posRef: React.MutableRefObject<Pos>;
  buildings: Building[];
  onMove?: (x: number, z: number) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const keys = useRef<Record<string, boolean>>({});
  const boxes = useMemo(() => buildingsToBoxes(buildings), [buildings]);

  useMemo(() => {
    if (typeof window === "undefined") return;
    const down = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      if (["w", "a", "s", "d", " "].includes(e.key.toLowerCase())) e.preventDefault();
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
    const run = keys.current["shift"] ? 1.6 : 1;
    const speed = 8 * run * dt;
    let nx = posRef.current.x;
    let nz = posRef.current.z;
    if (keys.current["w"] || keys.current["arrowup"]) nz -= speed;
    if (keys.current["s"] || keys.current["arrowdown"]) nz += speed;
    if (keys.current["a"] || keys.current["arrowleft"]) nx -= speed;
    if (keys.current["d"] || keys.current["arrowright"]) nx += speed;
    const solved = resolveCollision(nx, nz, 0.6, boxes);
    posRef.current.x = solved.x;
    posRef.current.z = solved.z;
    if (ref.current) {
      ref.current.position.set(solved.x, 1, solved.z);
      // Face movement direction
      const dx = solved.x - ref.current.userData.px || 0;
      const dz = solved.z - ref.current.userData.pz || 0;
      if (Math.abs(dx) + Math.abs(dz) > 0.0001) {
        ref.current.rotation.y = Math.atan2(dx, dz);
      }
      ref.current.userData.px = solved.x;
      ref.current.userData.pz = solved.z;
    }
    onMove?.(solved.x, solved.z);
  });

  return (
    <mesh ref={ref} position={[posRef.current.x, 1, posRef.current.z]}>
      <capsuleGeometry args={[0.5, 1, 4, 10]} />
      <meshStandardMaterial color="#e8c547" />
      <Html position={[0, 1.8, 0]} center distanceFactor={30}>
        <div style={{ background: "#e8c547", color: "#111", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>YOU</div>
      </Html>
    </mesh>
  );
}

export function RemotePlayers({ remotes }: { remotes: Map<string, RemotePlayer> }) {
  return (
    <group>
      {[...remotes.values()].map((r) => (
        <Remote key={r.userId} r={r} />
      ))}
    </group>
  );
}

function Remote({ r }: { r: RemotePlayer }) {
  const ref = useRef<THREE.Mesh>(null);
  const target = useMemo(() => new THREE.Vector3(r.x, 1, r.z), [r.x, r.z]);
  useFrame((_, rawDt) => {
    if (!ref.current) return;
    const dt = Math.min(rawDt, 0.1);
    // Exponential smoothing toward latest authoritative position.
    ref.current.position.lerp(target, 1 - Math.exp(-10 * dt));
  });
  return (
    <mesh ref={ref} position={[r.x, 1, r.z]}>
      <capsuleGeometry args={[0.5, 1, 4, 10]} />
      <meshStandardMaterial color="#5aa9e6" />
      <Html position={[0, 1.8, 0]} center distanceFactor={30}>
        <div style={{ background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 11, padding: "2px 8px", borderRadius: 8, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {r.userId}
        </div>
      </Html>
    </mesh>
  );
}
