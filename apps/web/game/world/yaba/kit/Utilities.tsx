"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { PALETTE } from "./palette";

/** Wooden electricity pole with a cross-arm and transformer drum. */
export function UtilityPole({ position, rot = 0 }: { position: [number, number, number]; rot?: number }) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh position={[0, 3.6, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.19, 7.2, 8]} />
        <meshStandardMaterial color={PALETTE.poleWood} roughness={0.95} />
      </mesh>
      <mesh position={[0, 6.7, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 2.4, 6]} />
        <meshStandardMaterial color={PALETTE.poleWood} roughness={0.95} />
      </mesh>
      <mesh position={[0.42, 5.4, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 1.0, 10]} />
        <meshStandardMaterial color={PALETTE.steelDark} roughness={0.7} metalness={0.4} />
      </mesh>
    </group>
  );
}

/** Sagging wire between two points — visual only, no collision. */
export function Wire({ from, to, sag = 0.55 }: { from: [number, number, number]; to: [number, number, number]; sag?: number }) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(from[0], from[1], from[2]),
      new THREE.Vector3((from[0] + to[0]) / 2, (from[1] + to[1]) / 2 - sag, (from[2] + to[2]) / 2),
      new THREE.Vector3(to[0], to[1], to[2]),
    ]);
    return new THREE.TubeGeometry(curve, 12, 0.022, 4, false);
  }, [from, to, sag]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={PALETTE.wire} roughness={1} />
    </mesh>
  );
}

/** Galvanised streetlight with an arm over the carriageway. */
export function Streetlight({ position, rot = 0 }: { position: [number, number, number]; rot?: number }) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh position={[0, 3.4, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 6.8, 8]} />
        <meshStandardMaterial color={PALETTE.steelDark} roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0, 6.7, 0.9]} rotation={[Math.PI / 2.4, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.9, 6]} />
        <meshStandardMaterial color={PALETTE.steelDark} roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0, 6.95, 1.8]}>
        <boxGeometry args={[0.42, 0.14, 0.3]} />
        <meshStandardMaterial color={PALETTE.steel} emissive={PALETTE.lampWarm} emissiveIntensity={0.35} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Black roto-moulded water tank on a welded stand. */
export function WaterTank({ position, s = 1 }: { position: [number, number, number]; s?: number }) {
  return (
    <group position={position} scale={s}>
      {[-0.5, 0.5].map((o, i) => (
        <mesh key={i} position={[o, 0.35, 0]} castShadow>
          <boxGeometry args={[0.1, 0.7, 0.1]} />
          <meshStandardMaterial color={PALETTE.steelDark} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.85, 0.85, 1.5, 14]} />
        <meshStandardMaterial color={PALETTE.tankBlack} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.93, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.14, 12]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Petrol generator — the sound of every Lagos street. */
export function Generator({ position, rot = 0 }: { position: [number, number, number]; rot?: number }) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.15, 0.72, 0.75]} />
        <meshStandardMaterial color={PALETTE.generatorRed} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.83, 0]}>
        <boxGeometry args={[1.2, 0.1, 0.8]} />
        <meshStandardMaterial color="#5a2018" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.45, 0.39]}>
        <cylinderGeometry args={[0.17, 0.17, 0.5, 10]} />
        <meshStandardMaterial color={PALETTE.steelDark} roughness={0.6} metalness={0.5} />
      </mesh>
    </group>
  );
}

/** Split AC condenser unit. */
export function ACUnit({ position, rot = 0 }: { position: [number, number, number]; rot?: number }) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.86, 0.6, 0.34]} />
        <meshStandardMaterial color="#d5d5d2" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.18]}>
        <circleGeometry args={[0.2, 16]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Satellite dish. */
export function Dish({ position, rot = 0 }: { position: [number, number, number]; rot?: number }) {
  return (
    <group position={position} rotation={[Math.PI / 3.2, rot, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.52, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
        <meshStandardMaterial color="#cbcbc8" roughness={0.55} side={2} />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.6, 8]} />
        <meshStandardMaterial color={PALETTE.steelDark} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Street bin. */
export function Bin({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.28, 1.0, 10]} />
        <meshStandardMaterial color={PALETTE.paintGreen} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.03, 0]}>
        <cylinderGeometry args={[0.37, 0.37, 0.08, 10]} />
        <meshStandardMaterial color="#24512f" roughness={0.9} />
      </mesh>
    </group>
  );
}
