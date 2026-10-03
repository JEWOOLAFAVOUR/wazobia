"use client";

export default function Compound() {
  return (
    <group position={[-14, 0, -14]}>
      <mesh position={[0, 1.1, 6]} castShadow receiveShadow>
        <boxGeometry args={[15, 2.2, 0.35]} />
        <meshStandardMaterial color="#c9b896" roughness={0.95} />
      </mesh>
      <mesh position={[-2, 1.0, 6]}>
        <boxGeometry args={[3, 1.8, 0.12]} />
        <meshStandardMaterial color="#274b73" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[-3, 2.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 5.2, 8]} />
        <meshStandardMaterial color="#d8c9a8" roughness={0.95} />
      </mesh>
      <mesh position={[4, 2.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.5, 4.2, 7]} />
        <meshStandardMaterial color="#b98d5e" roughness={0.95} />
      </mesh>
      <mesh position={[-3, 5.35, 0]}>
        <boxGeometry args={[7.4, 0.3, 8.4]} />
        <meshStandardMaterial color="#4c4a46" roughness={1} />
      </mesh>
      {[
        [-4.5, 3.4, 4.02],
        [-1.5, 3.4, 4.02],
        [-4.5, 1.6, 4.02],
        [-1.5, 1.6, 4.02],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[1.1, 1.1, 0.1]} />
          <meshStandardMaterial color="#20262c" roughness={0.3} metalness={0.5} />
        </mesh>
      ))}
      <mesh position={[-3, 3.1, 4.4]}>
        <boxGeometry args={[6.6, 0.9, 0.12]} />
        <meshStandardMaterial color="#274b73" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[4, 5.2, 1]} castShadow>
        <cylinderGeometry args={[0.9, 0.9, 1.4, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      <mesh position={[1.8, 1.2, 3.6]}>
        <boxGeometry args={[0.8, 0.6, 0.4]} />
        <meshStandardMaterial color="#d9d9d9" roughness={0.7} />
      </mesh>
      <mesh position={[6.8, 0.45, 5]}>
        <boxGeometry args={[1.1, 0.9, 0.7]} />
        <meshStandardMaterial color="#a83a32" roughness={0.8} />
      </mesh>
    </group>
  );
}
