"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { CHARACTERS, IDLE_CLIP_NAME, IDLE_LIBRARY_URL, type CharacterId } from "./characters";
import { remapIdleClip } from "./remap";

for (const c of CHARACTERS) useGLTF.preload(c.modelUrl);
useGLTF.preload(IDLE_LIBRARY_URL);

function CharacterModel({ id }: { id: CharacterId }) {
  const entry = CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
  const { scene } = useGLTF(entry.modelUrl);
  const { animations } = useGLTF(IDLE_LIBRARY_URL);
  const mixer = useRef<THREE.AnimationMixer | null>(null);

  const idle = useMemo(() => {
    const clip = animations.find((a) => a.name === IDLE_CLIP_NAME);
    if (!clip) return null;
    return remapIdleClip(clip);
  }, [animations]);

  useEffect(() => {
    if (!idle) return;
    const m = new THREE.AnimationMixer(scene);
    const action = m.clipAction(idle);
    action.play();
    mixer.current = m;
    return () => {
      action.stop();
      m.uncacheClip(idle);
      mixer.current = null;
    };
  }, [scene, idle]);

  useFrame((_, rawDt) => {
    mixer.current?.update(Math.min(rawDt, 0.05));
  });

  return <primitive object={scene} />;
}

export default function CharacterViewer({ id }: { id: CharacterId }) {
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
        <CharacterModel key={id} id={id} />
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
