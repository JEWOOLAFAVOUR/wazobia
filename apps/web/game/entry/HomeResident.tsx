"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { resolveCollision, type Box } from "@/lib/collision";
import { stepToward } from "@/game/player/stepping";
import { SimpleAvatar } from "@/game/character/SimpleAvatar";
import type { Avatar } from "@/game/character/wardrobe";

/**
 * Integration point for people inside the home: one roommate who wanders
 * between free spots, pauses, and never blocks the player (purely visual —
 * contributes no collider). Route-following like the street pedestrians in
 * AmbientLife, but confined to the room via the same colliders.
 */
export const RESIDENT_AVATAR: Avatar = {
  body: "male",
  skin: "deep",
  hair: { cut: "lowcut", color: "black" },
  eyes: "espresso",
  top: { id: "tee", color: "#315f75" },
  bottom: { id: "trousers", color: "#343943" },
  shoes: { id: "sneakers", color: "#eceae6" },
  headwear: { id: "none", color: "#1c1a18" },
  accessory: "none",
  name: "Tunde",
  situation: "roommate",
  outfit: "casual",
  fabric: "royal",
};

const WAYPOINTS = [
  { x: 0.2, z: 1.6 },
  { x: -3.0, z: 0.0 },
  { x: -3.0, z: -3.0 },
  { x: 2.5, z: -1.0 },
];

export default function HomeResident({ colliders }: { colliders: Box[] }) {
  const group = useRef<THREE.Group>(null);
  const pos = useRef({ x: WAYPOINTS[0].x, z: WAYPOINTS[0].z, heading: Math.PI });
  const st = useRef({ i: 1, pause: 1.5, stuck: 0, lastX: WAYPOINTS[0].x, lastZ: WAYPOINTS[0].z });
  const [moving, setMoving] = useState(false);
  const movingRef = useRef(false);
  const collidersRef = useRef(colliders);
  useEffect(() => {
    collidersRef.current = colliders;
  }, [colliders]);

  const setMove = (m: boolean) => {
    if (movingRef.current !== m) {
      movingRef.current = m;
      setMoving(m);
    }
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = st.current;
    if (s.pause > 0) {
      s.pause -= dt;
      setMove(false);
    } else {
      const step = stepToward(pos.current, WAYPOINTS[s.i], 1.1 * dt, 8, dt);
      const solved = resolveCollision(step.x, step.z, 0.45, collidersRef.current);
      const progressed = Math.hypot(solved.x - s.lastX, solved.z - s.lastZ);
      s.lastX = solved.x;
      s.lastZ = solved.z;
      s.stuck = progressed < 1.1 * dt * 0.25 && !step.arrived ? s.stuck + dt : 0;
      pos.current = { x: solved.x, z: solved.z, heading: step.heading };
      setMove(true);
      if (step.arrived || s.stuck > 1.0) {
        s.i = (s.i + 1) % WAYPOINTS.length;
        s.pause = 2 + ((s.i * 37) % 3);
        s.stuck = 0;
        setMove(false);
      }
    }
    if (group.current) {
      group.current.position.set(pos.current.x, 0, pos.current.z);
      group.current.rotation.y = pos.current.heading;
    }
  });

  return (
    <group ref={group} position={[WAYPOINTS[0].x, 0, WAYPOINTS[0].z]}>
      <SimpleAvatar avatar={RESIDENT_AVATAR} moving={moving} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.5, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
