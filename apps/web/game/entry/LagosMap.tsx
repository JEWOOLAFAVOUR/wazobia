"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, MapControls } from "@react-three/drei";
import * as THREE from "three";
import { PLOTS, ROADS, type RoadSpec } from "@/game/world/yaba/layout";
import { Danfo } from "@/game/world/yaba/parts";

export type MapFocus = { x: number; z: number };

const KIND_COLOR: Record<string, string> = {
  shop: "#e8b04b",
  restaurant: "#e8b04b",
  house: "#d8cfc0",
  apartment: "#cfd4d6",
  office: "#b9c2c7",
  bank: "#9fc3e0",
  church: "#f2ede0",
  mosque: "#9fd0c0",
  club: "#6b5f86",
};

/**
 * Robust map controls: left-drag / one-finger pans, wheel / pinch zooms,
 * two-finger drag pans on touch. No rotation (map stays north-up like reference).
 * focusRef stays in sync both ways so venue chips can fly the camera.
 */
export function MapCamera({ focusRef }: { focusRef: React.MutableRefObject<MapFocus> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controls = useRef<any>(null);
  const camera = useThree((state) => state.camera);
  const goal = useRef(new THREE.Vector3(0, 0, 0));
  const last = useRef({ x: 0, z: 0 });
  const focus = useRef(focusRef);
  useEffect(() => {
    focus.current = focusRef;
  }, [focusRef]);

  useLayoutEffect(() => {
    camera.position.set(225, 240, 225);
    camera.lookAt(0, 0, 0);
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
  }, [camera]);

  useFrame((_, rawDt) => {
    const c = controls.current as { target: THREE.Vector3; update: () => void } | null;
    if (!c) return;
    const dt = Math.min(rawDt, 0.05);
    const f = focus.current.current;
    // External focus request (venue chip click) — fly target there.
    if (last.current.x !== f.x || last.current.z !== f.z) {
      last.current = { x: f.x, z: f.z };
      goal.current.set(f.x, 0, f.z);
    }
    c.target.lerp(goal.current, 1 - Math.exp(-8 * dt));
    // User panned — keep the ref in sync for the next external request.
    goal.current.copy(c.target);
    f.x = c.target.x;
    f.z = c.target.z;
    c.update();
  });

  return (
    <MapControls
      ref={controls}
      makeDefault
      enableRotate={false}
      enableDamping
      dampingFactor={0.12}
      screenSpacePanning={false}
      minDistance={18}
      maxDistance={460}
      maxPolarAngle={Math.PI / 3.2}
      mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
      touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
    />
  );
}

type House = { x: number; z: number; rot: number; c: string; roof: string; w: number; d: number; h: number };

const HOUSE_COLORS = ["#e4d1b2", "#e8c9a9", "#d7d0bf", "#d6bd91", "#deb9a0"];
const ROOF_COLORS = ["#a95136", "#75483a", "#4b4b48", "#9a7145", "#59634b"];

const CITY_ROADS: RoadSpec[] = [
  { id: "expressway", axis: "x", center: -108, width: 12, from: -150, to: 150, main: true },
  { id: "north-ring", axis: "x", center: -74, width: 7, from: -150, to: 150, main: false },
  { id: "south-link", axis: "x", center: 48, width: 9, from: -150, to: 150, main: true },
  { id: "mainland-west", axis: "z", center: -125, width: 8, from: -135, to: 52, main: true },
  { id: "mainland-inner-west", axis: "z", center: -90, width: 5, from: -135, to: 52, main: false },
  { id: "mainland-east", axis: "z", center: 92, width: 6, from: -135, to: 52, main: false },
  { id: "mainland-far-east", axis: "z", center: 132, width: 8, from: -135, to: 52, main: true },
  { id: "vi-west", axis: "z", center: -68, width: 6, from: 82, to: 142, main: false },
  { id: "vi-centre-west", axis: "z", center: -28, width: 5, from: 82, to: 142, main: false },
  { id: "vi-centre-east", axis: "z", center: 22, width: 6, from: 82, to: 142, main: false },
  { id: "vi-east", axis: "z", center: 62, width: 7, from: 82, to: 142, main: true },
  { id: "vi-north", axis: "x", center: 88, width: 7, from: -92, to: 66, main: false },
  { id: "vi-middle", axis: "x", center: 112, width: 6, from: -92, to: 66, main: false },
  { id: "vi-south", axis: "x", center: 138, width: 8, from: -92, to: 66, main: true },
  { id: "lekki-west", axis: "z", center: 92, width: 7, from: 68, to: 198, main: true },
  { id: "lekki-middle", axis: "z", center: 132, width: 5, from: 68, to: 198, main: false },
  { id: "lekki-east", axis: "z", center: 174, width: 6, from: 68, to: 198, main: false },
  { id: "lekki-north", axis: "x", center: 88, width: 6, from: 68, to: 198, main: false },
  { id: "lekki-centre", axis: "x", center: 116, width: 8, from: 68, to: 198, main: true },
  { id: "lekki-south", axis: "x", center: 151, width: 6, from: 68, to: 198, main: false },
];

function landGeometry(points: [number, number][]): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => {
    if (index === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  });
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

const MAINLAND_GEOMETRY = landGeometry([
  [-160, -120], [-145, -138], [-70, -141], [10, -137], [90, -141], [150, -127],
  [157, -100], [148, -77], [158, -49], [150, -18], [157, 8], [144, 38], [125, 55],
  [72, 59], [8, 53], [-66, 60], [-132, 53], [-157, 36], [-150, 8], [-160, -24], [-149, -60], [-158, -91],
]);
const ISLAND_GEOMETRY = landGeometry([
  [-113, 81], [-105, 94], [-108, 119], [-99, 137], [-80, 150], [-51, 151], [-28, 143],
  [4, 151], [35, 143], [59, 139], [79, 125], [75, 105], [61, 88], [39, 80], [2, 76], [-38, 79], [-76, 76],
]);
const EKO_GEOMETRY = landGeometry([
  [-158, 84], [-104, 87], [-98, 102], [-102, 127], [-111, 146], [-137, 158], [-160, 146], [-166, 121],
]);
const LEKKI_GEOMETRY = landGeometry([
  [48, 78], [68, 73], [92, 81], [112, 72], [140, 78], [163, 88], [190, 87],
  [210, 103], [214, 128], [202, 148], [210, 163], [196, 182], [169, 187],
  [140, 180], [110, 174], [91, 164], [77, 146], [67, 125], [56, 108],
]);

function RoadStrip({ road }: { road: RoadSpec }) {
  const alongX = road.axis === "x";
  const length = road.to - road.from;
  const middle = (road.from + road.to) / 2;
  const at = (offset: number): [number, number, number] =>
    alongX
      ? [middle, 0.16, road.center + offset]
      : [road.center + offset, 0.16, middle];
  const size = (width: number): [number, number] =>
    alongX ? [length, width] : [width, length];
  const dashCount = road.main ? Math.floor(length / 14) : 0;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={alongX ? [middle, 0.16, road.center] : [road.center, 0.16, middle]}>
        <planeGeometry args={size(road.width)} />
        <meshStandardMaterial color={road.main ? "#55534e" : "#625e54"} roughness={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          rotation={[-Math.PI / 2, 0, 0]}
          position={at(side * (road.width / 2 + 0.9))}
        >
          <planeGeometry args={size(1.2)} />
          <meshStandardMaterial color="#aaa18e" roughness={1} />
        </mesh>
      ))}
      {Array.from({ length: dashCount }, (_, i) => {
        const distance = road.from + 5 + i * 14;
        return (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={alongX ? [distance, 0.18, road.center] : [road.center, 0.18, distance]}
          >
            <planeGeometry args={alongX ? [4, 0.28] : [0.28, 4]} />
            <meshStandardMaterial color="#e2c967" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

function houseGrid(x0: number, z0: number, cols: number, rows: number, dx: number, dz: number, seed: number): House[] {
  const houses: House[] = [];
  for (let ix = 0; ix < cols; ix++) {
    for (let iz = 0; iz < rows; iz++) {
      const n = ix * 7 + iz * 11 + seed;
      if (n % 13 === 0) continue;
      houses.push({
        x: x0 + ix * dx + (iz % 2) * 0.8,
        z: z0 + iz * dz,
        rot: (n % 5 === 0 ? 0.025 : 0) * (n % 2 === 0 ? 1 : -1),
        c: HOUSE_COLORS[n % HOUSE_COLORS.length],
        roof: ROOF_COLORS[(n + 2) % ROOF_COLORS.length],
        w: 2.7 + (n % 3) * 0.22,
        d: 3.1 + (n % 2) * 0.35,
        h: 1.9 + (n % 4) * 0.12,
      });
    }
  }
  return houses;
}

function buildEstates(): { mainland: House[]; island: House[]; lekki: House[] } {
  return {
    mainland: [
      ...houseGrid(-143, -123, 7, 3, 6.5, 7.2, 1),
      ...houseGrid(-88, -122, 7, 3, 6.5, 7.2, 4),
      ...houseGrid(64, -122, 11, 3, 6.5, 7.2, 8),
      ...houseGrid(-143, -82, 7, 3, 6.5, 7.2, 12),
      ...houseGrid(-40, -48, 4, 2, 7, 7, 60),
      ...houseGrid(12, -48, 4, 2, 7, 7, 64),
      ...houseGrid(-43, -96, 3, 2, 7.4, 7.5, 48),
      ...houseGrid(22, -96, 3, 2, 7.4, 7.5, 52),
      ...houseGrid(64, -82, 11, 3, 6.5, 7.2, 16),
      ...houseGrid(-143, -49, 7, 3, 6.5, 7.2, 20),
      ...houseGrid(64, -49, 11, 3, 6.5, 7.2, 24),
      ...houseGrid(-143, 12, 7, 4, 6.5, 7.2, 28),
      ...houseGrid(-43, 22, 4, 2, 7.4, 7.5, 56),
      ...houseGrid(-40, 26, 4, 2, 7, 7, 68),
      ...houseGrid(64, 12, 11, 4, 6.5, 7.2, 32),
    ],
    island: [
      ...houseGrid(-94, 91, 6, 5, 6.4, 7.2, 36),
      ...houseGrid(-24, 91, 7, 5, 6.4, 7.2, 40),
      ...houseGrid(-94, 132, 6, 3, 6.4, 7.2, 44),
    ],
    lekki: houseGrid(88, 92, 13, 9, 6.7, 7.3, 48),
  };
}

function EstateInstances({ houses, y = 0 }: { houses: House[]; y?: number }) {
  const bodies = useRef<THREE.InstancedMesh>(null);
  const roofs = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => houses.map((h) => new THREE.Color(h.c)), [houses]);

  useLayoutEffect(() => {
    const b = bodies.current;
    const r = roofs.current;
    if (!b || !r) return;
    houses.forEach((h, i) => {
      dummy.position.set(h.x, y + h.h / 2, h.z);
      dummy.rotation.set(0, h.rot, 0);
      dummy.scale.set(h.w / 2.3, h.h / 1.4, h.d / 2.7);
      dummy.updateMatrix();
      b.setMatrixAt(i, dummy.matrix);
      b.setColorAt(i, colors[i]);
      dummy.position.set(h.x, y + h.h + 0.16, h.z);
      dummy.rotation.set(0, h.rot, 0);
      dummy.scale.set((h.w + 0.55) / 2.6, 1, (h.d + 0.55) / 3);
      dummy.updateMatrix();
      r.setMatrixAt(i, dummy.matrix);
      r.setColorAt(i, new THREE.Color(h.roof));
    });
    b.instanceMatrix.needsUpdate = true;
    r.instanceMatrix.needsUpdate = true;
    if (b.instanceColor) b.instanceColor.needsUpdate = true;
    if (r.instanceColor) r.instanceColor.needsUpdate = true;
  }, [houses, colors, dummy, y]);

  return (
    <group>
      <instancedMesh ref={bodies} args={[undefined, undefined, houses.length]} frustumCulled={false}>
        <boxGeometry args={[2.3, 1.4, 2.7]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={roofs} args={[undefined, undefined, houses.length]} frustumCulled={false}>
        <boxGeometry args={[2.6, 0.3, 3.0]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </instancedMesh>
    </group>
  );
}

function Bridge({ x }: { x: number }) {
  return (
    <group position={[x, 0, 64]}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[11, 0.6, 38]} />
        <meshStandardMaterial color="#55524d" roughness={1} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <boxGeometry args={[0.35, 0.05, 35]} />
        <meshStandardMaterial color="#e4c96c" roughness={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 5.8, 0.7, 0]}>
          <mesh>
            <boxGeometry args={[0.28, 0.65, 38]} />
            <meshStandardMaterial color="#d5c4a1" roughness={1} />
          </mesh>
          {[-14, -7, 0, 7, 14].map((z) => (
            <mesh key={z} position={[0, -0.08, z]}>
              <boxGeometry args={[0.4, 0.4, 0.25]} />
              <meshStandardMaterial color="#a99d88" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
      {[-12, 0, 12].map((z) => (
        <mesh key={z} position={[0, -1.4, z]}>
          <boxGeometry args={[12, 2.8, 1.4]} />
          <meshStandardMaterial color="#8b9385" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function CompoundWall({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  const wall = "#d9c9a8";
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.52, -d / 2]}>
        <boxGeometry args={[w, 1.04, 0.42]} />
        <meshStandardMaterial color={wall} roughness={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (w / 2), 0.52, 0]}>
          <boxGeometry args={[0.42, 1.04, d]} />
          <meshStandardMaterial color={wall} roughness={1} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (w / 4 + 0.75), 0.52, d / 2]}>
          <mesh>
            <boxGeometry args={[w / 2 - 1.5, 1.04, 0.42]} />
            <meshStandardMaterial color={wall} roughness={1} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.5, 0.75, d / 2]}>
          <boxGeometry args={[0.4, 1.5, 0.55]} />
          <meshStandardMaterial color="#bd985f" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function BusinessCluster({ x, z, color = "#d4d0c5" }: { x: number; z: number; color?: string }) {
  return (
    <group position={[x, 0, z]}>
      {[
        { x: -8, z: 1, w: 9, d: 9, h: 10 },
        { x: 2, z: -3, w: 10, d: 8, h: 15 },
        { x: 11, z: 2, w: 8, d: 10, h: 8 },
      ].map((building, index) => (
        <group key={index} position={[building.x, 0, building.z]}>
          <mesh position={[0, building.h / 2, 0]} castShadow>
            <boxGeometry args={[building.w, building.h, building.d]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          {Array.from({ length: Math.floor(building.h / 2.5) }, (_, floor) => (
            <mesh key={floor} position={[0, 1.5 + floor * 2.5, building.d / 2 + 0.03]}>
              <boxGeometry args={[building.w * 0.72, 0.7, 0.06]} />
              <meshStandardMaterial color="#41616a" roughness={0.35} metalness={0.1} />
            </mesh>
          ))}
          <mesh position={[0, building.h + 0.35, 0]}>
            <boxGeometry args={[building.w + 0.5, 0.7, building.d + 0.5]} />
            <meshStandardMaterial color="#b8784d" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MarketRow({ x, z }: { x: number; z: number }) {
  const awnings = ["#d94637", "#e0ab32", "#397b57", "#3b6e9d", "#e6d5b2"];
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i} position={[i * 4.2, 0, (i % 2) * 1.1]}>
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[3.3, 1.6, 2.8]} />
            <meshStandardMaterial color={i % 2 ? "#bb8455" : "#c49a68"} roughness={1} />
          </mesh>
          <mesh position={[0, 1.75, 0]}>
            <boxGeometry args={[3.8, 0.25, 3.2]} />
            <meshStandardMaterial color={awnings[i % awnings.length]} roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CityTrees() {
  const spots = useMemo(
    () => [
      [-43, -117], [-35, -117], [-27, -117], [35, -117], [43, -117],
      [-145, -17], [-137, -17], [-63, -17], [-55, -17], [57, -17], [65, -17],
      [-45, 28], [-37, 28], [39, 28], [47, 28],
      [-86, 101], [-78, 101], [76, 104], [84, 104], [78, 155], [86, 155],
      [-144, 32], [-136, 32], [143, 32], [151, 32],
    ] as [number, number][],
    [],
  );
  const trunks = useRef<THREE.InstancedMesh>(null);
  const canopies = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    if (!trunks.current || !canopies.current) return;
    spots.forEach(([x, z], index) => {
      const scale = 0.8 + (index % 4) * 0.12;
      dummy.position.set(x, 1.1 * scale, z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      trunks.current!.setMatrixAt(index, dummy.matrix);
      dummy.position.set(x, 2.8 * scale, z);
      dummy.updateMatrix();
      canopies.current!.setMatrixAt(index, dummy.matrix);
    });
    trunks.current.instanceMatrix.needsUpdate = true;
    canopies.current.instanceMatrix.needsUpdate = true;
  }, [dummy, spots]);

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]}>
        <cylinderGeometry args={[0.17, 0.24, 2.2, 6]} />
        <meshStandardMaterial color="#745034" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={canopies} args={[undefined, undefined, spots.length]}>
        <coneGeometry args={[1.4, 2.5, 7]} />
        <meshStandardMaterial color="#3d7945" roughness={1} />
      </instancedMesh>
    </group>
  );
}

function RegionLabel({ position, children }: { position: [number, number, number]; children: string }) {
  return (
    <group position={position}>
      <Html center distanceFactor={120} wrapperClass="venue-label" style={{ pointerEvents: "none" }}>
        <div
          style={{
            pointerEvents: "none",
            userSelect: "none",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.22em",
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 1px 6px rgba(15,40,60,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          {children}
        </div>
      </Html>
    </group>
  );
}

/** Lightweight static Lagos slab — no interiors, no per-mesh useFrame. Coordinates match street 1:1. */
export function LagosMapBlocks({ onPick }: { onPick?: (plotId: string) => void }) {
  const roads = useMemo(() => ROADS, []);
  const cityRoads = useMemo(() => CITY_ROADS, []);
  const plots = useMemo(() => PLOTS, []);
  const estates = useMemo(() => buildEstates(), []);
  const downAt = useRef<{ x: number; y: number } | null>(null);

  return (
    <group>
      {/* ocean */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 20]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#6fb3d2" roughness={1} />
      </mesh>
      {/* mainland: Yaba grows into denser mixed residential and commercial districts */}
      <mesh geometry={MAINLAND_GEOMETRY} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
        <meshStandardMaterial color="#a9bd87" roughness={1} />
      </mesh>
      {/* Lagos Island and Victoria Island */}
      <mesh geometry={ISLAND_GEOMETRY} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
        <meshStandardMaterial color="#d7c69f" roughness={1} />
      </mesh>
      {/* Eko Atlantic and the Lekki peninsula */}
      <mesh geometry={EKO_GEOMETRY} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
        <meshStandardMaterial color="#d8c9a6" roughness={1} />
      </mesh>
      <mesh geometry={LEKKI_GEOMETRY} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
        <meshStandardMaterial color="#b9c78e" roughness={1} />
      </mesh>
      {/* lagoon and beach edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 64]}>
        <planeGeometry args={[330, 24]} />
        <meshStandardMaterial color="#4e9fc1" roughness={0.82} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[16, 0.12, 179]}>
        <planeGeometry args={[300, 10]} />
        <meshStandardMaterial color="#e0c68e" roughness={1} />
      </mesh>
      {/* neighborhood parks and civic greens */}
      {[
        [-38, -116, 22, 15],
        [34, -116, 22, 15],
        [-103, -15, 18, 13],
        [106, -17, 20, 14],
        [-81, 104, 12, 12],
        [78, 151, 14, 14],
      ].map(([x, z, w, d], index) => (
        <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.1, z]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color={index % 2 ? "#91ad70" : "#96b277"} roughness={1} />
        </mesh>
      ))}
      {/* connected, marked streets and the existing playable Yaba roads */}
      {cityRoads.map((road) => <RoadStrip key={road.id} road={road} />)}
      {roads.map((road) => <RoadStrip key={road.id} road={road} />)}
      {[-110, 0, 110].map((x) => <Bridge key={x} x={x} />)}
      {/* compounds and detached homes */}
      <EstateInstances houses={estates.mainland} />
      <EstateInstances houses={estates.island} />
      <EstateInstances houses={estates.lekki} />
      {[
        [-111, -115, 27, 21],
        [104, -115, 30, 21],
        [-111, -74, 27, 19],
        [104, -74, 30, 19],
        [-27, -42, 29, 16],
        [-27, 32, 29, 16],
        [-45, 104, 34, 29],
        [119, 106, 39, 30],
        [165, 151, 36, 30],
      ].map(([x, z, w, d], index) => (
        <CompoundWall key={index} x={x} z={z} w={w} d={d} />
      ))}
      {/* recognizable city centers and a busy open market row */}
      <BusinessCluster x={0} z={-89} color="#c6c1b5" />
      <BusinessCluster x={-39} z={110} color="#ded3bc" />
      <BusinessCluster x={143} z={108} color="#c6d0ce" />
      <MarketRow x={42} z={-36} />
      <group position={[-44, 0.16, -108]} rotation={[0, Math.PI / 2, 0]}>
        <Danfo position={[0, 0, 0]} />
      </group>
      <group position={[54, 0.16, 48]} rotation={[0, Math.PI / 2, 0]}>
        <Danfo position={[0, 0, 0]} />
      </group>
      <Danfo position={[-125, 0.16, -94]} />
      {/* Yaba plots as massing blocks — click only counts when it wasn't a drag */}
      <group
        onPointerDown={(e) => {
          downAt.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
        }}
      >
        {plots.map((p) => {
          const h = Math.max(2.2, Math.min(p.height, 9));
          return (
            <group key={p.id}>
              <mesh
                position={[p.x, h / 2, p.z]}
                onClick={(e) => {
                  const d = downAt.current;
                  downAt.current = null;
                  if (d && Math.hypot(e.nativeEvent.clientX - d.x, e.nativeEvent.clientY - d.y) > 6) return;
                  e.stopPropagation();
                  onPick?.(p.id);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  document.body.style.cursor = "";
                }}
              >
                <boxGeometry args={[p.w, h, p.d]} />
                <meshStandardMaterial color={KIND_COLOR[p.kind] ?? "#d8cfc0"} roughness={0.95} />
              </mesh>
              {/* roof cap */}
              <mesh position={[p.x, h + 0.12, p.z]}>
                <boxGeometry args={[p.w + 0.3, 0.24, p.d + 0.3]} />
                <meshStandardMaterial color="#4a4239" roughness={1} />
              </mesh>
            </group>
          );
        })}
      </group>
      <CityTrees />
      <RegionLabel position={[45, 0.5, 12]}>YABA</RegionLabel>
      <RegionLabel position={[-112, 0.5, -32]}>SURULERE</RegionLabel>
      <RegionLabel position={[12, 0.5, -124]}>IKEJA</RegionLabel>
      <RegionLabel position={[-3, 0.5, 74]}>LAGOS LAGOON</RegionLabel>
      <RegionLabel position={[-24, 0.5, 142]}>VICTORIA ISLAND</RegionLabel>
      <RegionLabel position={[145, 0.5, 174]}>LEKKI</RegionLabel>
      <RegionLabel position={[-126, 0.5, 160]}>EKO ATLANTIC</RegionLabel>
    </group>
  );
}
