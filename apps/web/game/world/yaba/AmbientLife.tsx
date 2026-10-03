"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { EntryPos } from "@/game/player/EntryPlayer";
import { Danfo } from "./parts";

type Point = { x: number; z: number; pause?: number };
type WalkerRoute = { start: Point; points: Point[]; speed: number; shirt: string; trousers: string };
const MAP_ACTIVITY_CENTER = new THREE.Vector3(0, 0, 0);

const WALKERS: WalkerRoute[] = [
  {
    start: { x: 10, z: -6.3 },
    points: [
      { x: 36, z: -6.3 },
      { x: 36, z: 6.3, pause: 1.4 },
      { x: 0, z: 6.3, pause: 1.4 },
      { x: 0, z: -6.3, pause: 1 },
      { x: 34, z: -6.3 },
      { x: 34, z: -9.2, pause: 2.4 },
      { x: 34, z: -6.3, pause: 0.6 },
    ],
    speed: 1.2,
    shirt: "#bc583e",
    trousers: "#303b45",
  },
  {
    start: { x: 17, z: 6.3 },
    points: [{ x: 0, z: 6.3 }, { x: 0, z: -6.3, pause: 1 }, { x: -36, z: -6.3 }, { x: -36, z: 6.3, pause: 1.8 }],
    speed: 1.45,
    shirt: "#315f75",
    trousers: "#413d39",
  },
  {
    start: { x: -35, z: -29.5 },
    points: [{ x: 0, z: -29.5 }, { x: 0, z: -22.5, pause: 1.5 }, { x: 35, z: -22.5 }, { x: 35, z: -29.5, pause: 0.8 }],
    speed: 1.05,
    shirt: "#d3a33e",
    trousers: "#49433e",
  },
  {
    start: { x: 5.6, z: 38 },
    points: [{ x: 5.6, z: 0 }, { x: -5.6, z: 0, pause: 1.6 }, { x: -5.6, z: -38 }, { x: 5.6, z: -38, pause: 0.9 }],
    speed: 1.3,
    shirt: "#557d4e",
    trousers: "#343943",
  },
  {
    start: { x: -5.6, z: -37 },
    points: [{ x: -5.6, z: 0 }, { x: 5.6, z: 0, pause: 1.1 }, { x: 5.6, z: 37 }, { x: -5.6, z: 37, pause: 1.5 }],
    speed: 1.55,
    shirt: "#875675",
    trousers: "#3b3a3b",
  },
  {
    start: { x: 38, z: -29.5 },
    points: [{ x: 14, z: -29.5 }, { x: 14, z: -22.5, pause: 1.2 }, { x: -38, z: -22.5 }, { x: -38, z: -29.5, pause: 2 }],
    speed: 0.95,
    shirt: "#d8d0bd",
    trousers: "#514a41",
  },
];

function AmbientPedestrian({ route, id, player, mapView = false }: { route: WalkerRoute; id: number; player: React.MutableRefObject<EntryPos>; mapView?: boolean }) {
  const body = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const state = useRef({ target: 0, pause: id * 0.27, elapsed: id * 1.7 });
  const scale = 0.9 + (id % 4) * 0.045;
  const camera = useThree((three) => three.camera);

  useFrame((_, rawDt) => {
    const root = body.current;
    if (!root) return;
    if (mapView && camera.position.distanceToSquared(MAP_ACTIVITY_CENTER) > 190 * 190) {
      root.visible = false;
      return;
    }
    const dxPlayer = root.position.x - player.current.x;
    const dzPlayer = root.position.z - player.current.z;
    if (dxPlayer * dxPlayer + dzPlayer * dzPlayer > 105 * 105) {
      root.visible = false;
      return;
    }
    root.visible = true;

    const dt = Math.min(rawDt, 0.05);
    const motion = state.current;
    motion.elapsed += dt;
    if (motion.pause > 0) {
      motion.pause = Math.max(0, motion.pause - dt);
    } else {
      const target = route.points[motion.target];
      const dx = target.x - root.position.x;
      const dz = target.z - root.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.24) {
        root.position.set(target.x, 0, target.z);
        motion.target = (motion.target + 1) % route.points.length;
        const stop = target.pause ?? 0;
        const variation = 0.35 + (Math.sin(id * 17 + motion.elapsed) + 1) * 0.45;
        motion.pause = stop > 0 ? stop + variation : 0.3 + variation;
      } else {
        const step = Math.min(route.speed * dt, distance);
        root.position.x += (dx / distance) * step;
        root.position.z += (dz / distance) * step;
        root.rotation.y = Math.atan2(dx, dz);
      }
    }

    const stride = motion.pause > 0 ? 0 : Math.sin(motion.elapsed * route.speed * 5);
    root.position.y = Math.abs(stride) * 0.035;
    if (leftArm.current) leftArm.current.rotation.x = stride * 0.42;
    if (rightArm.current) rightArm.current.rotation.x = -stride * 0.42;
    if (leftLeg.current) leftLeg.current.rotation.x = -stride * 0.48;
    if (rightLeg.current) rightLeg.current.rotation.x = stride * 0.48;
  });

  const armColor = "#62472f";

  return (
    <group ref={body} position={[route.start.x, 0, route.start.z]} scale={scale}>
      <mesh position={[0, 1.08, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.58, 3, 7]} />
        <meshStandardMaterial color={route.shirt} roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.82, 0]} castShadow>
        <sphereGeometry args={[0.25, 10, 8]} />
        <meshStandardMaterial color={["#7c4d32", "#573722", "#905f40"][id % 3]} roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.03, -0.015]}>
        <sphereGeometry args={[0.25, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={id % 2 ? "#1e1c1a" : "#29221c"} roughness={1} />
      </mesh>
      <group ref={leftArm} position={[-0.34, 1.28, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <capsuleGeometry args={[0.095, 0.42, 3, 6]} />
          <meshStandardMaterial color={route.shirt} roughness={0.95} />
        </mesh>
        <mesh position={[0, -0.58, 0]}>
          <sphereGeometry args={[0.085, 7, 6]} />
          <meshStandardMaterial color={armColor} roughness={1} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.34, 1.28, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <capsuleGeometry args={[0.095, 0.42, 3, 6]} />
          <meshStandardMaterial color={route.shirt} roughness={0.95} />
        </mesh>
        <mesh position={[0, -0.58, 0]}>
          <sphereGeometry args={[0.085, 7, 6]} />
          <meshStandardMaterial color={armColor} roughness={1} />
        </mesh>
      </group>
      <group ref={leftLeg} position={[-0.14, 0.66, 0]}>
        <mesh position={[0, -0.29, 0]} castShadow>
          <capsuleGeometry args={[0.12, 0.38, 3, 6]} />
          <meshStandardMaterial color={route.trousers} roughness={0.95} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.14, 0.66, 0]}>
        <mesh position={[0, -0.29, 0]} castShadow>
          <capsuleGeometry args={[0.12, 0.38, 3, 6]} />
          <meshStandardMaterial color={route.trousers} roughness={0.95} />
        </mesh>
      </group>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.08, 8]} />
        <meshBasicMaterial transparent opacity={0.14} color="#111111" />
      </mesh>
    </group>
  );
}

function AmbientDanfo({ player, mapView = false }: { player: React.MutableRefObject<EntryPos>; mapView?: boolean }) {
  const vehicle = useRef<THREE.Group>(null);
  const state = useRef({ direction: 1, pause: 0, stoppedAtStop: false, activeTime: 0 });
  const busStopX = 8;
  const camera = useThree((three) => three.camera);

  useFrame((_, rawDt) => {
    const group = vehicle.current;
    if (!group) return;
    if (mapView && camera.position.distanceToSquared(MAP_ACTIVITY_CENTER) > 190 * 190) {
      group.visible = false;
      return;
    }
    const dt = Math.min(rawDt, 0.05);
    const active = Math.hypot(group.position.x - player.current.x, group.position.z - player.current.z) < 125;
    group.visible = active;
    if (!active) return;

    const motion = state.current;
    motion.activeTime += dt;
    if (motion.pause > 0) {
      motion.pause = Math.max(0, motion.pause - dt);
      return;
    }

    const nextX = group.position.x + motion.direction * 7.2 * dt;
    const reachesStop = !motion.stoppedAtStop &&
      ((motion.direction > 0 && group.position.x < busStopX && nextX >= busStopX) ||
        (motion.direction < 0 && group.position.x > busStopX && nextX <= busStopX));
    if (reachesStop) {
      group.position.x = busStopX;
      motion.stoppedAtStop = true;
      motion.pause = 1.5;
      return;
    }
    group.position.x = nextX;
    if (group.position.x >= 49 || group.position.x <= -49) {
      group.position.x = THREE.MathUtils.clamp(group.position.x, -49, 49);
      motion.direction *= -1;
      motion.stoppedAtStop = false;
      group.position.z = motion.direction > 0 ? 1.8 : -1.8;
    }
    group.rotation.y = motion.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
  });

  return (
    <group ref={vehicle} position={[-12, 0, -1.8]} rotation={[0, Math.PI / 2, 0]}>
      <Danfo position={[0, 0, 0]} />
    </group>
  );
}

function AmbientTaxi({ player, mapView = false }: { player: React.MutableRefObject<EntryPos>; mapView?: boolean }) {
  const vehicle = useRef<THREE.Group>(null);
  const state = useRef({ pause: 0 });
  const camera = useThree((three) => three.camera);

  useFrame((_, rawDt) => {
    const group = vehicle.current;
    if (!group) return;
    if (mapView && camera.position.distanceToSquared(MAP_ACTIVITY_CENTER) > 190 * 190) {
      group.visible = false;
      return;
    }
    const active = Math.hypot(group.position.x - player.current.x, group.position.z - player.current.z) < 125;
    group.visible = active;
    if (!active) return;

    const dt = Math.min(rawDt, 0.05);
    if (state.current.pause > 0) {
      state.current.pause = Math.max(0, state.current.pause - dt);
      return;
    }
    group.position.x -= 9.5 * dt;
    if (group.position.x <= -49) {
      group.position.x = 49;
      state.current.pause = 0.8;
    }
  });

  return (
    <group ref={vehicle} position={[28, 0, 1.8]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0.68, 0]} castShadow>
        <boxGeometry args={[1.85, 0.72, 3.8]} />
        <meshStandardMaterial color="#d8b937" roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.22, -0.12]} castShadow>
        <boxGeometry args={[1.5, 0.62, 1.9]} />
        <meshStandardMaterial color="#c9a92e" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.24, -0.12]}>
        <boxGeometry args={[1.53, 0.42, 1.72]} />
        <meshStandardMaterial color="#49616a" roughness={0.28} metalness={0.15} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.94, 0.43, 1.12]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.22, 10]} />
          <meshStandardMaterial color="#171717" roughness={0.94} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.94, 0.43, -1.12]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.22, 10]} />
          <meshStandardMaterial color="#171717" roughness={0.94} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.58, 0.78, 1.92]}>
          <boxGeometry args={[0.32, 0.2, 0.08]} />
          <meshStandardMaterial color="#fff3bf" emissive="#ffd76b" emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export default function AmbientLife({ player, mapView = false }: { player: React.MutableRefObject<EntryPos>; mapView?: boolean }) {
  const routes = useMemo(() => WALKERS, []);
  return (
    <group>
      {routes.map((route, index) => (
        <AmbientPedestrian key={index} route={route} id={index} player={player} mapView={mapView} />
      ))}
      <AmbientDanfo player={player} mapView={mapView} />
      <AmbientTaxi player={player} mapView={mapView} />
    </group>
  );
}
