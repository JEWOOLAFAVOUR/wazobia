"use client";

export default function Roads() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#4d4132" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[7.5, 90]} />
        <meshStandardMaterial color="#2e3134" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[90, 7.5]} />
        <meshStandardMaterial color="#2e3134" roughness={0.95} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={`ew${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-20 + i * 5, 0.035, 0.4]}>
          <planeGeometry args={[1.5, 0.22]} />
          <meshStandardMaterial color="#b99b3e" roughness={1} />
        </mesh>
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={`ns${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0.4, 0.035, -20 + i * 5]}>
          <planeGeometry args={[0.22, 1.5]} />
          <meshStandardMaterial color="#b99b3e" roughness={1} />
        </mesh>
      ))}
      {[
        [6.2, 0, 4.6, 90],
        [-6.2, 0, 4.6, 90],
        [0, 6.2, 90, 4.6],
        [0, -6.2, 90, 4.6],
      ].map((s, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[s[0], 0.045, s[1]]} receiveShadow>
          <planeGeometry args={[s[2], s[3]]} />
          <meshStandardMaterial color="#6f6a60" roughness={1} />
        </mesh>
      ))}
      {[
        [8.9, 0, 0.9, 90],
        [-8.9, 0, 0.9, 90],
        [0, 8.9, 90, 0.9],
        [0, -8.9, 90, 0.9],
      ].map((s, i) => (
        <mesh key={`d${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[s[0], 0.055, s[1]]}>
          <planeGeometry args={[s[2], s[3]]} />
          <meshStandardMaterial color="#3a3f45" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
