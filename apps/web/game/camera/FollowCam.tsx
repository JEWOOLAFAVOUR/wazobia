"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Pos } from "@/game/player/Player";

// Third-person follow camera. Guide §5: camera is browser-side (visual world).
export default function FollowCam({
  posRef,
  enabled,
  offset = new THREE.Vector3(0, 14, 14),
}: {
  posRef: React.MutableRefObject<Pos>;
  enabled: boolean;
  offset?: THREE.Vector3;
}) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());
  useFrame(() => {
    if (!enabled) return;
    const target = new THREE.Vector3(posRef.current.x, 0, posRef.current.z);
    const desired = target.clone().add(offset);
    camera.position.lerp(desired, 1 - Math.exp(-4 * 0.016));
    look.current.lerp(target, 1 - Math.exp(-6 * 0.016));
    camera.lookAt(look.current);
  });
  return null;
}
