"use client";

import { Html } from "@react-three/drei";

export function Sign({ text, color = "#f5b301" }: { text: string; color?: string }) {
  return (
    <Html position={[0, 0.4, 0]} center distanceFactor={26} occlude>
      <div
        style={{
          background: "#141210",
          color,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 0.5,
          padding: "3px 10px",
          borderRadius: 6,
          border: `1px solid ${color}55`,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </Html>
  );
}

export function UtilityPole({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 3.4, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.17, 6.8, 7]} />
        <meshStandardMaterial color="#4a3826" roughness={0.95} />
      </mesh>
      <mesh position={[0, 6.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 2.2, 6]} />
        <meshStandardMaterial color="#4a3826" roughness={0.95} />
      </mesh>
      <mesh position={[5, 6.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 10, 4]} />
        <meshStandardMaterial color="#0c0c0c" roughness={1} />
      </mesh>
    </group>
  );
}

export function StreetTree({ position, s = 1 }: { position: [number, number, number]; s?: number }) {
  return (
    <group position={position} scale={s}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.3, 2.2, 7]} />
        <meshStandardMaterial color="#5b3a1e" roughness={1} />
      </mesh>
      <mesh position={[0, 2.9, 0]} castShadow>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial color="#3d6b34" roughness={1} flatShading />
      </mesh>
      <mesh position={[0.9, 2.2, 0.4]}>
        <icosahedronGeometry args={[1.0, 1]} />
        <meshStandardMaterial color="#4a7d3a" roughness={1} flatShading />
      </mesh>
    </group>
  );
}

export function Danfo({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[2.0, 1.5, 5.6]} />
        <meshStandardMaterial color="#e8a90c" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.32, 0]}>
        <boxGeometry args={[2.02, 0.5, 5.62]} />
        <meshStandardMaterial color="#efe9dc" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.9, 0.7, 5.4]} />
        <meshStandardMaterial color="#2b2b2e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.75, 1.2]}>
        <boxGeometry args={[1.86, 0.5, 2.9]} />
        <meshStandardMaterial color="#1d2b33" roughness={0.25} metalness={0.4} />
      </mesh>
      {[
        [-0.95, 0.42, 1.8],
        [0.95, 0.42, 1.8],
        [-0.95, 0.42, -1.8],
        [0.95, 0.42, -1.8],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.3, 12]} />
          <meshStandardMaterial color="#151515" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
