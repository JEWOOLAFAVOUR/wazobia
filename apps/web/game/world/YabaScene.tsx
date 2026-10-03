"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Building } from "@/lib/api";
import { useSocket } from "@/game/networking/useSocket";

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[120, 120]} />
      <meshStandardMaterial color="#1a2b1f" />
    </mesh>
  );
}

function BuildingBox({ b }: { b: Building }) {
  const color =
    b.kind === "restaurant" ? "#c2703d" :
    b.kind === "bank" ? "#3d7bc2" :
    b.kind === "shop" ? "#7bc23d" : "#8a8a8a";
  return (
    <group position={[b.x, 0, b.z]}>
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[6, 4, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 4.6, 0]}>
        <boxGeometry args={[6.4, 0.4, 6.4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

function LocalPlayer({ posRef }: { posRef: React.MutableRefObject<{ x: number; z: number }> }) {
  const ref = useRef<any>(null);
  const keys = useRef<Record<string, boolean>>({});
  useFrame((_, dt) => {
    const speed = 8 * dt;
    if (keys.current["w"]) posRef.current.z -= speed;
    if (keys.current["s"]) posRef.current.z += speed;
    if (keys.current["a"]) posRef.current.x -= speed;
    if (keys.current["d"]) posRef.current.x += speed;
    posRef.current.x = Math.max(-55, Math.min(55, posRef.current.x));
    posRef.current.z = Math.max(-55, Math.min(55, posRef.current.z));
    if (ref.current) ref.current.position.set(posRef.current.x, 1, posRef.current.z);
  });
  useState(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", (e) => (keys.current[e.key.toLowerCase()] = true));
      window.addEventListener("keyup", (e) => (keys.current[e.key.toLowerCase()] = false));
    }
  });
  return (
    <mesh ref={ref} position={[0, 1, 0]}>
      <capsuleGeometry args={[0.5, 1, 4, 8]} />
      <meshStandardMaterial color="#e8c547" />
    </mesh>
  );
}

export default function YabaScene({ buildings, userId }: { buildings: Building[]; userId: string }) {
  const posRef = useRef({ x: 0, z: 5 });
  const { remotes } = useSocket(userId, "zone-b", posRef);
  return (
    <Canvas camera={{ position: [0, 25, 30], fov: 50 }} style={{ height: "60vh" }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[20, 30, 10]} intensity={1.2} />
      <Ground />
      {/* Roads: simple cross */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[8, 120]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[120, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {buildings.map((b) => (
        <BuildingBox key={b.id} b={b} />
      ))}
      <LocalPlayer posRef={posRef} />
      {[...remotes.values()].map((r) => (
        <mesh key={r.userId} position={[r.x, 1, r.z]}>
          <capsuleGeometry args={[0.5, 1, 4, 8]} />
          <meshStandardMaterial color="#5aa9e6" />
        </mesh>
      ))}
      <OrbitControls makeDefault />
    </Canvas>
  );
}
