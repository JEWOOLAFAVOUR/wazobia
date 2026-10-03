"use client";

import { PALETTE } from "./palette";

/** Plastered perimeter wall segment, with broken glass on the coping. */
export function CompoundWall({
  position,
  rotationY = 0,
  len = 8,
  h = 2.1,
  color = PALETTE.plasterB,
  glass = true,
}: {
  position: [number, number, number];
  rotationY?: number;
  len?: number;
  h?: number;
  color?: string;
  glass?: boolean;
}) {
  const posts = Math.max(2, Math.round(len / 2.4));
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, h, 0.22]} />
        <meshStandardMaterial color={color} roughness={0.96} />
      </mesh>
      <mesh position={[0, h + 0.05, 0]}>
        <boxGeometry args={[len, 0.1, 0.3]} />
        <meshStandardMaterial color={PALETTE.concreteDark} roughness={1} />
      </mesh>
      {Array.from({ length: posts }, (_, i) => {
        const x = -len / 2 + (i * len) / (posts - 1);
        return (
          <mesh key={i} position={[x, h / 2, 0.12]}>
            <boxGeometry args={[0.3, h, 0.03]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        );
      })}
      {glass &&
        Array.from({ length: Math.floor(len / 0.5) }, (_, i) => {
          const x = -len / 2 + 0.25 + i * 0.5;
          return (
            <mesh key={`g${i}`} position={[x, h + 0.16, 0]} rotation={[0, 0.6, 0.25]}>
              <coneGeometry args={[0.045, 0.16, 4]} />
              <meshStandardMaterial color="#9fb7a8" roughness={0.25} metalness={0.2} transparent opacity={0.85} />
            </mesh>
          );
        })}
    </group>
  );
}

/** Welded steel gate — the metal one that clangs. */
export function MetalGate({
  position,
  rotationY = 0,
  w = 3.2,
  h = 2.0,
  color = PALETTE.paintBlue,
}: {
  position: [number, number, number];
  rotationY?: number;
  w?: number;
  h?: number;
  color?: string;
}) {
  const bars = Math.max(4, Math.round(w / 0.32));
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-h / 2 + 0.09, 0, h / 2 - 0.09].map((y, i) => (
        <mesh key={i} position={[0, h / 2 + y, 0]} castShadow>
          <boxGeometry args={[w, 0.13, 0.07]} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.55} />
        </mesh>
      ))}
      {Array.from({ length: bars }, (_, i) => {
        const x = -w / 2 + 0.12 + (i * (w - 0.24)) / (bars - 1);
        return (
          <mesh key={`b${i}`} position={[x, h / 2, 0]} castShadow>
            <boxGeometry args={[0.05, h, 0.05]} />
            <meshStandardMaterial color={color} roughness={0.55} metalness={0.55} />
          </mesh>
        );
      })}
      {[-w / 2 - 0.14, w / 2 + 0.14].map((x, i) => (
        <mesh key={`p${i}`} position={[x, (h + 0.5) / 2, 0]} castShadow>
          <boxGeometry args={[0.28, h + 0.5, 0.28]} />
          <meshStandardMaterial color={PALETTE.plasterC} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/** Burglar-proof window: dark glazing behind a steel grid. */
export function BurglarWindow({
  position,
  rotationY = 0,
  w = 1.1,
  h = 1.1,
  frame = "#e9e4d6",
}: {
  position: [number, number, number];
  rotationY?: number;
  w?: number;
  h?: number;
  frame?: string;
}) {
  const vBars = Math.max(2, Math.round(w / 0.22));
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[w + 0.12, h + 0.12, 0.08]} />
        <meshStandardMaterial color={frame} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[w, h, 0.04]} />
        <meshStandardMaterial color="#1b2229" roughness={0.25} metalness={0.45} />
      </mesh>
      {Array.from({ length: vBars }, (_, i) => {
        const x = -w / 2 + 0.06 + (i * (w - 0.12)) / (vBars - 1);
        return (
          <mesh key={i} position={[x, 0, 0.07]}>
            <boxGeometry args={[0.03, h, 0.03]} />
            <meshStandardMaterial color="#6e6a63" roughness={0.5} metalness={0.6} />
          </mesh>
        );
      })}
      {[-h / 3, 0, h / 3].map((y, i) => (
        <mesh key={`h${i}`} position={[0, y, 0.07]}>
          <boxGeometry args={[w, 0.03, 0.03]} />
          <meshStandardMaterial color="#6e6a63" roughness={0.5} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** Open doorway with a swung metal leaf, threshold and warm light spill. */
export function Doorway({
  position,
  rotationY = 0,
  w = 2.2,
  h = 2.4,
  color = PALETTE.paintGreen,
  open = true,
}: {
  position: [number, number, number];
  rotationY?: number;
  w?: number;
  h?: number;
  color?: string;
  open?: boolean;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, h + 0.09, 0]}>
        <boxGeometry args={[w + 0.24, 0.18, 0.34]} />
        <meshStandardMaterial color="#e9e4d6" roughness={0.9} />
      </mesh>
      {[-w / 2 - 0.09, w / 2 + 0.09].map((x, i) => (
        <mesh key={i} position={[x, h / 2, 0]} castShadow>
          <boxGeometry args={[0.18, h, 0.34]} />
          <meshStandardMaterial color="#e9e4d6" roughness={0.9} />
        </mesh>
      ))}
      {open && (
        <mesh position={[w / 2 - 0.05, h / 2, -w / 2 + 0.1]} rotation={[0, Math.PI / 2.3, 0]} castShadow>
          <boxGeometry args={[w * 0.92, h * 0.96, 0.06]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.35} />
        </mesh>
      )}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[w, 0.06, 0.5]} />
        <meshStandardMaterial color={PALETTE.concreteDark} roughness={1} />
      </mesh>
      <mesh position={[0, 0.02, -0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 1.4, 1.8]} />
        <meshStandardMaterial
          color={PALETTE.lampWarm}
          emissive={PALETTE.lampWarm}
          emissiveIntensity={0.5}
          transparent
          opacity={0.45}
        />
      </mesh>
    </group>
  );
}

