"use client";

import { PALETTE } from "./palette";

/** Broad-leaf street tree, dry-season Lagos green. */
export function StreetTree({ position, s = 1, tone = 0 }: { position: [number, number, number]; s?: number; tone?: number }) {
  const leaf = tone % 2 === 0 ? PALETTE.leafDark : PALETTE.leafMid;
  return (
    <group position={position} scale={s}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.32, 2.6, 7]} />
        <meshStandardMaterial color={PALETTE.trunk} roughness={1} />
      </mesh>
      <mesh position={[0.12, 3.3, 0]} rotation={[0, 0, 0.22]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, 1.6, 6]} />
        <meshStandardMaterial color={PALETTE.trunk} roughness={1} />
      </mesh>
      <mesh position={[0, 3.6, 0]} castShadow>
        <icosahedronGeometry args={[1.75, 1]} />
        <meshStandardMaterial color={leaf} roughness={1} flatShading />
      </mesh>
      <mesh position={[1.0, 2.9, 0.5]}>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial color={PALETTE.leafMid} roughness={1} flatShading />
      </mesh>
      <mesh position={[-0.9, 3.1, -0.4]}>
        <icosahedronGeometry args={[0.95, 1]} />
        <meshStandardMaterial color={PALETTE.leafDry} roughness={1} flatShading />
      </mesh>
    </group>
  );
}

/** Palm — the unmistakable Lagos skyline element. */
export function Palm({ position, s = 1, rot = 0 }: { position: [number, number, number]; s?: number; rot?: number }) {
  const fronds = 7;
  return (
    <group position={position} scale={s} rotation={[0, rot, 0]}>
      <mesh position={[0, 2.8, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.28, 5.6, 8]} />
        <meshStandardMaterial color="#7a6a4a" roughness={1} />
      </mesh>
      {Array.from({ length: fronds }, (_, i) => {
        const a = (i / fronds) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0.85, 5.75, 0]} rotation={[0, 0, -0.85]} castShadow>
              <boxGeometry args={[1.8, 0.05, 0.42]} />
              <meshStandardMaterial color={PALETTE.leafDark} roughness={1} flatShading />
            </mesh>
            <mesh position={[1.5, 5.25, 0]} rotation={[0, 0, -1.25]}>
              <boxGeometry args={[1.4, 0.04, 0.3]} />
              <meshStandardMaterial color={PALETTE.leafMid} roughness={1} flatShading />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Coarse grass / weed tuft. */
export function GrassTuft({ position, s = 1 }: { position: [number, number, number]; s?: number }) {
  return (
    <group position={position} scale={s}>
      {Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.1, 0.14, Math.sin(a) * 0.1]} rotation={[0.2, a, 0.15]}>
            <coneGeometry args={[0.07, 0.34, 4]} />
            <meshStandardMaterial color={PALETTE.leafDry} roughness={1} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}
