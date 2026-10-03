"use client";

import { Sign } from "./parts";

export default function Restaurant() {
  return (
    <group position={[9, 0, -13]}>
      <mesh position={[0, 1.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.5, 3.8, 6.5]} />
        <meshStandardMaterial color="#e0cfa8" roughness={0.95} />
      </mesh>
      <mesh position={[0, 3.95, 0]}>
        <boxGeometry args={[7.9, 0.3, 6.9]} />
        <meshStandardMaterial color="#5a3a24" roughness={1} />
      </mesh>
      <mesh position={[0, 0.15, 4.6]} receiveShadow>
        <boxGeometry args={[7.5, 0.3, 2.8]} />
        <meshStandardMaterial color="#8a8478" roughness={1} />
      </mesh>
      {[-3.4, 3.4].map((dx, i) => (
        <mesh key={i} position={[dx, 1.5, 5.8]}>
          <cylinderGeometry args={[0.12, 0.12, 2.7, 8]} />
          <meshStandardMaterial color="#5a3a24" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 2.6, 4.2]}>
        <Sign text="MAMA PUT · JOLLOF" />
      </mesh>
      {[
        [-1.8, 4.6],
        [1.8, 4.6],
      ].map((p, i) => (
        <group key={i} position={[p[0], 0, p[1]]}>
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.06, 12]} />
            <meshStandardMaterial color="#eceae6" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.75, 8]} />
            <meshStandardMaterial color="#274b73" roughness={0.6} />
          </mesh>
          <mesh position={[0.9, 0.45, 0]}>
            <boxGeometry args={[0.45, 0.06, 0.45]} />
            <meshStandardMaterial color="#c96a2c" roughness={0.8} />
          </mesh>
        </group>
      ))}
      <mesh position={[-1.5, 1.1, 3.28]}>
        <boxGeometry args={[1.4, 2.2, 0.12]} />
        <meshStandardMaterial color="#ffe9a3" emissive="#ff9d3a" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}
