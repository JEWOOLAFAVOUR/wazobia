"use client";

import { Sign } from "./parts";

export default function ShopsRow() {
  return (
    <group position={[-9, 0, -14]}>
      {[-4.6, 0, 4.6].map((dx, i) => (
        <group key={i} position={[dx, 0, 1.5]}>
          <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
            <boxGeometry args={[4.2, 3.4, 3.6]} />
            <meshStandardMaterial color={["#c96a2c", "#2e6b46", "#274b73"][i]} roughness={0.9} />
          </mesh>
          <mesh position={[0, 3.55, 0]}>
            <boxGeometry args={[4.5, 0.25, 3.9]} />
            <meshStandardMaterial color="#3a3733" roughness={1} />
          </mesh>
          <mesh position={[0, 0.7, 1.82]}>
            <boxGeometry args={[2.6, 1.4, 0.08]} />
            <meshStandardMaterial color="#8f979e" roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[0, 1.9, 0.4]}>
            <Sign text={["PROVISIONS", "PHONES & REPAIR", "PHARMACY"][i]} />
          </mesh>
        </group>
      ))}
      <group position={[5.6, 0, 5.6]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.8, 1.0, 1.0]} />
          <meshStandardMaterial color="#7a5c3a" roughness={1} />
        </mesh>
        <mesh position={[0, 2.2, 0]} castShadow>
          <coneGeometry args={[1.6, 0.9, 8]} />
          <meshStandardMaterial color="#c96a2c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.35, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.7, 6]} />
          <meshStandardMaterial color="#4a3826" roughness={1} />
        </mesh>
      </group>
    </group>
  );
}
