"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EntryPos } from "@/game/player/EntryPlayer";

type Point = { x: number; z: number };

export default function TaxiRide({
  from,
  to,
  posRef,
  onArrive,
}: {
  from: Point;
  to: Point;
  posRef: React.MutableRefObject<EntryPos>;
  onArrive: () => void;
}) {
  const car = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Mesh[]>([]);
  const elapsed = useRef(0);
  const arrived = useRef(false);
  const fromX = from.x;
  const fromZ = from.z;
  const toX = to.x;
  const toZ = to.z;

  const route = useMemo(
    () => [
      { x: fromX, z: fromZ },
      { x: fromX, z: 0 },
      { x: toX, z: 0 },
      { x: toX, z: toZ },
    ],
    [fromX, fromZ, toX, toZ],
  );
  const segments = useMemo(() => {
    const lengths: number[] = [];
    let total = 0;
    for (let i = 1; i < route.length; i++) {
      const length = Math.hypot(route[i].x - route[i - 1].x, route[i].z - route[i - 1].z);
      lengths.push(length);
      total += length;
    }
    return { lengths, total, duration: Math.max(4, total / 4.2) };
  }, [route]);

  useFrame((_, rawDt) => {
    if (!car.current || arrived.current) return;
    elapsed.current = Math.min(segments.duration, elapsed.current + Math.min(rawDt, 0.05));
    let remaining = (elapsed.current / segments.duration) * segments.total;
    let index = 0;
    while (index < segments.lengths.length - 1 && remaining > segments.lengths[index]) {
      remaining -= segments.lengths[index];
      index++;
    }
    const start = route[index];
    const end = route[index + 1];
    const length = Math.max(0.001, segments.lengths[index]);
    const amount = THREE.MathUtils.clamp(remaining / length, 0, 1);
    const x = THREE.MathUtils.lerp(start.x, end.x, amount);
    const z = THREE.MathUtils.lerp(start.z, end.z, amount);
    const heading = Math.atan2(end.x - start.x, end.z - start.z);
    car.current.position.set(x, 0, z);
    car.current.rotation.y = heading;
    posRef.current = { x, z, heading };
    for (const wheel of wheels.current) wheel.rotation.x -= Math.min(rawDt, 0.05) * 5.5;

    if (elapsed.current >= segments.duration) {
      arrived.current = true;
      onArrive();
    }
  });

  return (
    <group ref={car} position={[from.x, 0, from.z]}>
      <mesh position={[0, 0.58, 0]} castShadow>
        <boxGeometry args={[1.75, 0.62, 3.3]} />
        <meshStandardMaterial color="#e7b523" roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.05, -0.15]} castShadow>
        <boxGeometry args={[1.48, 0.64, 1.72]} />
        <meshStandardMaterial color="#303c45" roughness={0.38} metalness={0.12} />
      </mesh>
      <mesh position={[0, 1.08, 0.72]}>
        <boxGeometry args={[1.28, 0.42, 0.05]} />
        <meshStandardMaterial color="#a8c7d1" roughness={0.25} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.99, -1.02]}>
        <boxGeometry args={[0.62, 0.16, 0.22]} />
        <meshStandardMaterial color="#fff0b0" emissive="#ffd65a" emissiveIntensity={0.35} />
      </mesh>
      {[-1, 1].flatMap((side, sideIndex) =>
        [-1, 1].map((axle, axleIndex) => (
          <mesh
            key={`${side}:${axle}`}
            ref={(mesh) => {
              if (mesh) wheels.current[sideIndex * 2 + axleIndex] = mesh;
            }}
            position={[side * 0.88, 0.34, axle * 1.05]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.32, 0.32, 0.18, 12]} />
            <meshStandardMaterial color="#25282b" roughness={0.92} />
          </mesh>
        )),
      )}
      <mesh position={[0, 1.48, -0.12]}>
        <boxGeometry args={[0.72, 0.16, 0.34]} />
        <meshStandardMaterial color="#f5e7bd" roughness={0.7} />
      </mesh>
    </group>
  );
}
