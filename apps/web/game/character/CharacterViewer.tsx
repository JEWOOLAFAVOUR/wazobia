"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { SimpleAvatar } from "./SimpleAvatar";
import type { Avatar } from "./wardrobe";

export default function CharacterViewer({ avatar }: { avatar: Avatar }) {
  return (
    <Canvas
      camera={{ position: [0, 1.1, 2.9], fov: 36 }}
      dpr={[1, 2]}
      shadows
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.6} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.45} />
      <SimpleAvatar avatar={avatar} />
      <mesh position={[0, -0.035, 0]} receiveShadow>
        <cylinderGeometry args={[0.62, 0.66, 0.07, 36]} />
        <meshStandardMaterial color="#d9dee4" roughness={0.95} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} scale={6} blur={2.6} opacity={0.3} far={2.5} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.6}
        maxDistance={5}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.9}
        target={[0, 0.62, 0]}
      />
    </Canvas>
  );
}
