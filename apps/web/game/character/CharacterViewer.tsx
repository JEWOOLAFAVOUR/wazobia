"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import { CHARACTERS, IDLE_LIBRARY_URL } from "./characters";
import { HAIR_BASE_URL, REAL_TEE_URL } from "./wardrobe";
import { AvatarModel } from "./AvatarModel";
import type { Avatar } from "./wardrobe";

for (const c of CHARACTERS) useGLTF.preload(c.modelUrl);
useGLTF.preload(IDLE_LIBRARY_URL);
useGLTF.preload(REAL_TEE_URL);
for (const f of ["buzzed", "buzzedfemale", "buns", "long", "simpleparted"]) {
  useGLTF.preload(`${HAIR_BASE_URL}/${f}.gltf`);
}

export default function CharacterViewer({ avatar }: { avatar: Avatar }) {
  return (
    <Canvas
      camera={{ position: [0, 1.45, 3.4], fov: 34 }}
      dpr={[1, 2]}
      shadows
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.6} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.45} />
      <Suspense fallback={null}>
        <AvatarModel key={avatar.body} avatar={avatar} />
      </Suspense>
      <ContactShadows position={[0, 0.001, 0]} scale={6} blur={2.6} opacity={0.55} far={2.5} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={6}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.9}
        target={[0, 0.95, 0]}
      />
    </Canvas>
  );
}
