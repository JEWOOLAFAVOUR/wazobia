"use client";

import { PALETTE } from "./palette";

/** Yellow-and-white danfo minibus — the icon of Lagos transport. */
export function Danfo({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[2.0, 0.72, 5.6]} />
        <meshStandardMaterial color={PALETTE.danfoYellow} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.26, 0]} castShadow>
        <boxGeometry args={[2.04, 0.58, 5.64]} />
        <meshStandardMaterial color={PALETTE.danfoWhite} roughness={0.65} />
      </mesh>
      <mesh position={[0, 1.66, 0]} castShadow>
        <boxGeometry args={[1.96, 0.22, 5.5]} />
        <meshStandardMaterial color={PALETTE.danfoYellow} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.3, 0.05]}>
        <boxGeometry args={[2.08, 0.42, 4.4]} />
        <meshStandardMaterial color={PALETTE.glass} roughness={0.2} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.24, 2.78]}>
        <boxGeometry args={[1.78, 0.5, 0.1]} />
        <meshStandardMaterial color={PALETTE.glass} roughness={0.18} metalness={0.55} />
      </mesh>
      <mesh position={[1.01, 0.9, -0.6]}>
        <boxGeometry args={[0.03, 1.0, 1.5]} />
        <meshStandardMaterial color="#b8860a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, 2.85]}>
        <boxGeometry args={[2.0, 0.22, 0.14]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.8} />
      </mesh>
      {([
        [-0.9, 0.4, 1.8],
        [0.9, 0.4, 1.8],
        [-0.9, 0.4, -1.8],
        [0.9, 0.4, -1.8],
      ] as [number, number, number][]).map((p, i) => (
        <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.28, 12]} />
          <meshStandardMaterial color={PALETTE.tyre} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Generic saloon car. */
export function Car({
  position,
  rotationY = 0,
  color = "#c9c6c1",
}: {
  position: [number, number, number];
  rotationY?: number;
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[1.8, 0.66, 4.3]} />
        <meshStandardMaterial color={color} roughness={0.42} metalness={0.25} />
      </mesh>
      <mesh position={[0, 1.12, -0.18]} castShadow>
        <boxGeometry args={[1.62, 0.54, 2.3]} />
        <meshStandardMaterial color={color} roughness={0.42} metalness={0.25} />
      </mesh>
      <mesh position={[0, 1.14, -0.18]}>
        <boxGeometry args={[1.66, 0.4, 2.1]} />
        <meshStandardMaterial color={PALETTE.glass} roughness={0.15} metalness={0.6} />
      </mesh>
      {([
        [-0.86, 0.35, 1.35],
        [0.86, 0.35, 1.35],
        [-0.86, 0.35, -1.35],
        [0.86, 0.35, -1.35],
      ] as [number, number, number][]).map((p, i) => (
        <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.24, 12]} />
          <meshStandardMaterial color={PALETTE.tyre} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}


/** Keke napep — the three-wheeler. */
export function Keke({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.95, -0.15]} castShadow>
        <boxGeometry args={[1.35, 1.1, 1.9]} />
        <meshStandardMaterial color="#e2c53a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.32, -0.15]}>
        <boxGeometry args={[1.39, 0.5, 1.7]} />
        <meshStandardMaterial color={PALETTE.glass} roughness={0.2} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.72, 1.2]} rotation={[0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.62, 0.72, 1.1]} />
        <meshStandardMaterial color="#c9a92e" roughness={0.65} />
      </mesh>
      {([
        [-0.78, 0.34, -0.7],
        [0.78, 0.34, -0.7],
        [0, 0.34, 1.5],
      ] as [number, number, number][]).map((p, i) => (
        <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.2, 10]} />
          <meshStandardMaterial color={PALETTE.tyre} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Okada — the ubiquitous motorcycle. */
export function Okada({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.34, 0.3, 1.5]} />
        <meshStandardMaterial color="#8a2f2a" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.98, -0.2]} castShadow>
        <boxGeometry args={[0.42, 0.22, 0.62]} />
        <meshStandardMaterial color="#1f1f1f" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.02, 0.62]} rotation={[Math.PI / 2.6, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.33, 0.78]}>
        <boxGeometry args={[0.66, 0.05, 0.05]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.88, 0.72]}>
        <sphereGeometry args={[0.15, 10, 8]} />
        <meshStandardMaterial color="#f0ead6" emissive="#fff4c9" emissiveIntensity={0.4} />
      </mesh>
      {([
        [0, 0.36, 0.78],
        [0, 0.36, -0.78],
      ] as [number, number, number][]).map((p, i) => (
        <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.36, 0.36, 0.12, 12]} />
          <meshStandardMaterial color={PALETTE.tyre} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
