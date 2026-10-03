"use client";

import { useMemo } from "react";
import { PALETTE } from "./palette";
import { AREA_BOUND, CURB_W, DRAIN_W, ROADS, SIDEWALK_W, type RoadSpec } from "../layout";

function Ground() {
  const w = AREA_BOUND.maxX - AREA_BOUND.minX + 24;
  const d = AREA_BOUND.maxZ - AREA_BOUND.minZ + 24;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={PALETTE.laterite} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[w - 3, d - 3]} />
        <meshStandardMaterial color={PALETTE.earth} roughness={1} />
      </mesh>
    </>
  );
}

function Asphalt({ road }: { road: RoadSpec }) {
  const len = road.to - road.from;
  const mid = (road.to + road.from) / 2;
  const alongX = road.axis === "x";
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={alongX ? [mid, 0.02, road.center] : [road.center, 0.02, mid]}
        receiveShadow
      >
        <planeGeometry args={[len, road.width]} />
        <meshStandardMaterial color={PALETTE.asphalt} roughness={0.95} />
      </mesh>
      {[-road.width / 4, road.width / 4].map((o, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={alongX ? [mid, 0.026, road.center + o] : [road.center + o, 0.026, mid]}
        >
          <planeGeometry args={[len - 2, road.width * 0.22]} />
          <meshStandardMaterial color={PALETTE.asphaltWorn} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Markings({ road }: { road: RoadSpec }) {
  if (!road.main) return null;
  const alongX = road.axis === "x";
  const step = 6;
  const count = Math.floor((road.to - road.from) / step);
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const a = road.from + 3 + i * step;
        return (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={alongX ? [a, 0.034, road.center] : [road.center, 0.034, a]}
          >
            <planeGeometry args={alongX ? [2.4, 0.18] : [0.18, 2.4]} />
            <meshStandardMaterial color="#c9b25a" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}
function SidewalkBand({ road }: { road: RoadSpec }) {
  const len = road.to - road.from;
  const mid = (road.to + road.from) / 2;
  const alongX = road.axis === "x";
  const off = road.width / 2 + CURB_W + SIDEWALK_W / 2;
  const seams = Math.floor(len / 1.5);
  return (
    <group>
      {[-off, off].map((o, i) => {
        const p: [number, number] = alongX ? [mid, road.center + o] : [road.center + o, mid];
        const roadSide = road.center + o - Math.sign(o) * (SIDEWALK_W / 2);
        return (
          <group key={i}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[p[0], 0.16, p[1]]} receiveShadow>
              <planeGeometry args={alongX ? [len, SIDEWALK_W] : [SIDEWALK_W, len]} />
              <meshStandardMaterial color={PALETTE.concrete} roughness={1} />
            </mesh>
            <mesh position={alongX ? [mid, 0.08, roadSide] : [roadSide, 0.08, mid]}>
              <boxGeometry args={alongX ? [len, 0.16, 0.08] : [0.08, 0.16, len]} />
              <meshStandardMaterial color={PALETTE.curb} roughness={1} />
            </mesh>
            {Array.from({ length: seams }, (_, s) => {
              const a = road.from + s * 1.5;
              return (
                <mesh
                  key={s}
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={alongX ? [a, 0.165, p[1]] : [p[0], 0.165, a]}
                >
                  <planeGeometry args={alongX ? [0.06, SIDEWALK_W] : [SIDEWALK_W, 0.06]} />
                  <meshStandardMaterial color={PALETTE.concreteDark} roughness={1} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

function DrainChannel({ road }: { road: RoadSpec }) {
  const len = road.to - road.from;
  const mid = (road.to + road.from) / 2;
  const alongX = road.axis === "x";
  const off = road.width / 2 + CURB_W / 2 + DRAIN_W / 2;
  return (
    <group>
      {[off, -off].map((o, i) => {
        const p: [number, number] = alongX ? [mid, road.center + o] : [road.center + o, mid];
        const lip = road.center + o - Math.sign(o) * (DRAIN_W / 2);
        return (
          <group key={i}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[p[0], 0.02, p[1]]}>
              <planeGeometry args={alongX ? [len, DRAIN_W] : [DRAIN_W, len]} />
              <meshStandardMaterial color={PALETTE.drainWater} roughness={0.5} metalness={0.15} />
            </mesh>
            <mesh position={alongX ? [mid, 0.1, lip] : [lip, 0.1, mid]}>
              <boxGeometry args={alongX ? [len, 0.2, 0.12] : [0.12, 0.2, len]} />
              <meshStandardMaterial color={PALETTE.drainConcrete} roughness={1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Crossing({ x, z, axis }: { x: number; z: number; axis: "x" | "z" }) {
  const stripes = 6;
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: stripes }, (_, i) => {
        const o = -3.2 + i * 1.28;
        return (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={axis === "x" ? [o, 0.036, 0] : [0, 0.036, o]}
          >
            <planeGeometry args={axis === "x" ? [0.62, 8.4] : [8.4, 0.62]} />
            <meshStandardMaterial color="#ddd7c8" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}



export default function Street() {
  const crossings = useMemo(
    () => [
      { x: 0, z: -7.4, axis: "x" as const },
      { x: 0, z: 7.4, axis: "x" as const },
      { x: -7.2, z: 0, axis: "z" as const },
      { x: 7.2, z: 0, axis: "z" as const },
    ],
    [],
  );
  return (
    <group>
      <Ground />
      {ROADS.map((r) => (
        <group key={r.id}>
          <Asphalt road={r} />
          <Markings road={r} />
          <DrainChannel road={r} />
          <SidewalkBand road={r} />
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, 0]} receiveShadow>
        <planeGeometry args={[ROADS[1].width, ROADS[0].width]} />
        <meshStandardMaterial color={PALETTE.asphalt} roughness={0.95} />
      </mesh>
      {crossings.map((c, i) => (
        <Crossing key={i} {...c} />
      ))}
    </group>
  );
}
